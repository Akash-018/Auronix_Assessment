"""add SQL challenge category, sql_schema, difficulty and project sql_code

Revision ID: 0005_add_sql_category
Revises: 0004_add_category_and_starter_js
Create Date: 2026-09-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0005_add_sql_category'
down_revision = '0004_add_category_and_starter_js'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        # Extend the existing enum in place; ADD VALUE is not transactional on older PG,
        # so guard it against re-runs.
        op.execute(
            "DO $$ BEGIN "
            "IF NOT EXISTS ("
            "  SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid "
            "  WHERE t.typname = 'challengecategory' AND e.enumlabel = 'SQL'"
            ") THEN ALTER TYPE challengecategory ADD VALUE 'SQL'; END IF; END $$;"
        )

    op.add_column('challenges', sa.Column('sql_schema', sa.Text(), nullable=True))
    op.add_column('challenges', sa.Column('difficulty', sa.String(20), nullable=True))
    op.add_column(
        'projects',
        sa.Column('sql_code', sa.Text(), nullable=False, server_default='')
    )


def downgrade() -> None:
    op.drop_column('projects', 'sql_code')
    op.drop_column('challenges', 'difficulty')
    op.drop_column('challenges', 'sql_schema')
    # The 'SQL' enum label is intentionally left in place: PostgreSQL cannot drop a
    # single enum value, and recreating the type would break existing rows.
