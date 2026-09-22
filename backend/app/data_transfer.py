"""
Move PixelTest data between databases (SQLite <-> PostgreSQL, or Postgres to Postgres).

Built for the migration off Render's expiring free PostgreSQL onto a provider whose
free tier does not expire. It is deliberately additive: an import never drops a
table, never deletes a row, and skips any row whose primary key already exists.
Nothing is destructive, so a failed run can simply be repeated.

    # 1. Dump the source database to a file
    python -m app.data_transfer export --url "<OLD_DATABASE_URL>" --out backup.json

    # 2. Load it into the new database
    python -m app.data_transfer import --url "<NEW_DATABASE_URL>" --in backup.json

    # 3. Confirm the new database matches the dump before trusting it
    python -m app.data_transfer verify --url "<NEW_DATABASE_URL>" --in backup.json

Omitting --url uses DATABASE_URL from the environment / .env.
"""
import argparse
import json
import sys
from datetime import datetime

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.sql_challenges import SQL_CHALLENGES
from app.models import Base, User, Challenge, Project, Submission

# Insert order matters: every table depends on the ones before it.
TABLES = [
    ("users", User),
    ("challenges", Challenge),
    ("projects", Project),
    ("submissions", Submission),
]

# Titles the application seeds for itself on every startup. A target database that
# has already booted owns these rows under different UUIDs, so importing them by
# primary key would duplicate them. They are matched by title and remapped instead.
SEEDED_CHALLENGE_TITLES = {spec["title"] for spec in SQL_CHALLENGES}

FORMAT_VERSION = 1


def _normalize_url(url: str) -> str:
    url = url.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    return url


def _make_session(url: str):
    url = _normalize_url(url)
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {"connect_timeout": 15}
    engine = create_engine(url, pool_pre_ping=True, connect_args=connect_args)
    return engine, sessionmaker(bind=engine)()


def _encode(value):
    """Make a column value JSON-safe without losing type information."""
    if isinstance(value, datetime):
        return {"__datetime__": value.isoformat()}
    # str-backed enums (UserRole, ChallengeCategory, ...) serialize to their value.
    if hasattr(value, "value") and not isinstance(value, (str, int, float, bool)):
        return value.value
    return value


def _decode(value):
    if isinstance(value, dict) and "__datetime__" in value:
        return datetime.fromisoformat(value["__datetime__"])
    return value


def _row_to_dict(obj, model) -> dict:
    return {c.key: _encode(getattr(obj, c.key)) for c in inspect(model).mapper.column_attrs}


def export_data(url: str, out_path: str) -> dict:
    engine, session = _make_session(url)
    payload = {"format_version": FORMAT_VERSION, "exported_at": datetime.now().isoformat(), "tables": {}}
    counts = {}

    try:
        for name, model in TABLES:
            rows = [_row_to_dict(obj, model) for obj in session.query(model).all()]
            payload["tables"][name] = rows
            counts[name] = len(rows)
            print(f"  exported {len(rows):>4} rows from {name}")
    finally:
        session.close()
        engine.dispose()

    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)

    print(f"\nWrote {out_path}")
    return counts


def import_data(url: str, in_path: str) -> dict:
    with open(in_path, "r", encoding="utf-8") as fh:
        payload = json.load(fh)

    if payload.get("format_version") != FORMAT_VERSION:
        print(f"Refusing to import: unsupported format_version {payload.get('format_version')!r}")
        sys.exit(1)

    engine, session = _make_session(url)
    # Safe on an already-migrated database: only missing tables are created.
    Base.metadata.create_all(bind=engine)

    summary = {}
    # old id -> id that actually exists in the target, for rows the target already owns
    user_map: dict = {}
    challenge_map: dict = {}

    def _row(model, data, **overrides):
        values = {k: _decode(v) for k, v in data.items()}
        values.update(overrides)
        return model(**values)

    try:
        # ---- users: identity is the email address, not the UUID ----------------
        existing_users = {u.email: u.id for u in session.query(User).all()}
        inserted = skipped = 0
        for row in payload["tables"].get("users", []):
            match = existing_users.get(row["email"])
            if match is not None:
                # Target already has this person (bootstrap creates admin + candidate
                # on first boot). Keep the target's row and redirect references to it.
                user_map[row["id"]] = match
                skipped += 1
                continue
            user_map[row["id"]] = row["id"]
            session.add(_row(User, row))
            inserted += 1
        session.commit()
        summary["users"] = {"inserted": inserted, "skipped": skipped}
        print(f"  {'users':12} inserted {inserted:>4}, skipped {skipped:>4} (matched by email)")

        # ---- challenges: PK, plus title for the self-seeded SQL set -------------
        existing_ids = {c.id for c in session.query(Challenge).all()}
        seeded_by_title = {
            c.title: c.id
            for c in session.query(Challenge).filter(Challenge.title.in_(SEEDED_CHALLENGE_TITLES)).all()
        }
        inserted = skipped = 0
        for row in payload["tables"].get("challenges", []):
            if row["id"] in existing_ids:
                challenge_map[row["id"]] = row["id"]
                skipped += 1
                continue
            match = seeded_by_title.get(row["title"])
            if match is not None:
                challenge_map[row["id"]] = match
                skipped += 1
                continue
            challenge_map[row["id"]] = row["id"]
            session.add(_row(Challenge, row, created_by=user_map.get(row["created_by"], row["created_by"])))
            inserted += 1
        session.commit()
        summary["challenges"] = {"inserted": inserted, "skipped": skipped}
        print(f"  {'challenges':12} inserted {inserted:>4}, skipped {skipped:>4} (PK or seeded title)")

        # ---- projects: one per (challenge, owner) after remapping ---------------
        existing_ids = {p.id for p in session.query(Project).all()}
        existing_pairs = {(p.challenge_id, p.owner_id) for p in session.query(Project).all()}
        project_map: dict = {}
        inserted = skipped = 0
        for row in payload["tables"].get("projects", []):
            challenge_id = challenge_map.get(row["challenge_id"], row["challenge_id"])
            owner_id = user_map.get(row["owner_id"], row["owner_id"])
            if row["id"] in existing_ids or (challenge_id, owner_id) in existing_pairs:
                project_map[row["id"]] = row["id"]
                skipped += 1
                continue
            project_map[row["id"]] = row["id"]
            existing_pairs.add((challenge_id, owner_id))
            session.add(_row(Project, row, challenge_id=challenge_id, owner_id=owner_id))
            inserted += 1
        session.commit()
        summary["projects"] = {"inserted": inserted, "skipped": skipped}
        print(f"  {'projects':12} inserted {inserted:>4}, skipped {skipped:>4} (already present)")

        # ---- submissions -------------------------------------------------------
        existing_ids = {s.id for s in session.query(Submission).all()}
        inserted = skipped = 0
        for row in payload["tables"].get("submissions", []):
            if row["id"] in existing_ids:
                skipped += 1
                continue
            session.add(_row(Submission, row, project_id=project_map.get(row["project_id"], row["project_id"])))
            inserted += 1
        session.commit()
        summary["submissions"] = {"inserted": inserted, "skipped": skipped}
        print(f"  {'submissions':12} inserted {inserted:>4}, skipped {skipped:>4} (already present)")

    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
        engine.dispose()

    return summary


def verify_data(url: str, in_path: str) -> bool:
    """
    Confirms every row in the dump is accounted for in the target.

    Uses the same identity rules as the import, so a user the target already had
    under a different UUID counts as present rather than as a missing row.
    """
    with open(in_path, "r", encoding="utf-8") as fh:
        payload = json.load(fh)

    engine, session = _make_session(url)
    ok = True

    def report(name: str, missing: list, expected: int, total: int) -> None:
        nonlocal ok
        if missing:
            ok = False
            print(f"  {name:12} MISSING {len(missing)} of {expected} — e.g. {missing[:3]}")
        else:
            print(f"  {name:12} OK  all {expected:>4} dumped rows present ({total} total in target)")

    try:
        # users — matched by email
        emails = {u.email for u in session.query(User).all()}
        dumped = payload["tables"].get("users", [])
        report("users", [r["email"] for r in dumped if r["email"] not in emails], len(dumped), len(emails))

        # challenges — matched by id, or by title for the self-seeded SQL set
        target = session.query(Challenge).all()
        ids = {c.id for c in target}
        titles = {c.title for c in target}
        dumped = payload["tables"].get("challenges", [])
        missing = [
            r["title"] for r in dumped
            if r["id"] not in ids and not (r["title"] in SEEDED_CHALLENGE_TITLES and r["title"] in titles)
        ]
        report("challenges", missing, len(dumped), len(target))

        # projects / submissions — matched by id
        for name, model in [("projects", Project), ("submissions", Submission)]:
            pk_col = inspect(model).mapper.primary_key[0].key
            present = {row[0] for row in session.query(getattr(model, pk_col)).all()}
            dumped = payload["tables"].get(name, [])
            report(name, [r[pk_col] for r in dumped if r[pk_col] not in present], len(dumped), len(present))
    finally:
        session.close()
        engine.dispose()

    return ok


def main() -> int:
    parser = argparse.ArgumentParser(description="Export/import PixelTest data between databases.")
    parser.add_argument("action", choices=["export", "import", "verify"])
    parser.add_argument("--url", default=None, help="Database URL (default: DATABASE_URL from settings)")
    parser.add_argument("--out", default="pixeltest_backup.json", help="Output file for export")
    parser.add_argument("--in", dest="in_path", default="pixeltest_backup.json", help="Input file")
    args = parser.parse_args()

    url = args.url or settings.DATABASE_URL
    safe_url = url.split("@")[-1] if "@" in url else url
    print(f"{args.action.upper()}  target: ...{safe_url}\n")

    if args.action == "export":
        export_data(url, args.out)
        return 0

    if args.action == "import":
        import_data(url, args.in_path)
        print("\nImport complete. Run `verify` before decommissioning the old database.")
        return 0

    print()
    if verify_data(url, args.in_path):
        print("\nVERIFIED — every row from the dump exists in the target database.")
        return 0
    print("\nVERIFICATION FAILED — do not decommission the source database.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
