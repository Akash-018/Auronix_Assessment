"""
Guards the route-ordering contract between the API and the SPA catch-all.

`app.main` registers `@app.get("/{full_path:path}")` to serve the built frontend,
but only when a `static/` directory exists — which is true in the production
container and false in local development. Starlette matches routes in registration
order, so any API route declared *after* that catch-all is silently shadowed and
returns 404 in production while passing every local test.

That is exactly how `/api/health` broke on Render. These tests reproduce the
production layout so the failure cannot reappear unnoticed.
"""
import importlib
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture()
def production_app(tmp_path, monkeypatch):
    """Import app.main with a `static/` bundle present, as the container has."""
    static_dir = tmp_path / "static"
    (static_dir / "assets").mkdir(parents=True)
    (static_dir / "index.html").write_text("<!doctype html><title>PixelTest</title>", encoding="utf-8")
    (static_dir / "assets" / "app.js").write_text("console.log('bundle')", encoding="utf-8")

    # app.main resolves "static" relative to the working directory at import time.
    monkeypatch.chdir(tmp_path)

    import app.main as main_module
    importlib.reload(main_module)

    yield main_module.app

    # Restore the module for any test importing it afterwards.
    monkeypatch.undo()
    importlib.reload(main_module)


def test_spa_catch_all_is_registered(production_app):
    """Sanity check: without this, the other tests would pass vacuously."""
    routes = [getattr(r, "path", None) for r in production_app.routes]
    assert "/{full_path:path}" in routes, "SPA catch-all missing; test would not prove anything"


def test_health_endpoint_not_shadowed_by_spa(production_app):
    """The regression: /api/health returned 404 in production, breaking Render's probe."""
    with TestClient(production_app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200, (
        "/api/health is shadowed by the SPA catch-all — move the route above the "
        "`if os.path.exists('static')` block in app.main"
    )
    assert response.json()["status"] == "ok"


def test_api_routes_not_shadowed_by_spa(production_app):
    """Every mounted API route must remain reachable, not swallowed into the SPA."""
    with TestClient(production_app) as client:
        # 401 (not 404) proves the route matched and auth ran.
        assert client.get("/api/challenges").status_code == 401
        assert client.post("/api/auth/login", json={"email": "no@x.com", "password": "x"}).status_code == 401


def test_unknown_api_path_still_404s(production_app):
    """Unknown /api paths must 404, not fall through to index.html."""
    with TestClient(production_app) as client:
        response = client.get("/api/definitely-not-a-route")

    assert response.status_code == 404
    assert b"<!doctype html" not in response.content.lower()


def test_frontend_routes_still_serve_the_spa(production_app):
    """The catch-all must still do its job for client-side routes."""
    with TestClient(production_app) as client:
        for path in ["/", "/dashboard", "/builder/some-id"]:
            response = client.get(path)
            assert response.status_code == 200, path
            assert b"<!doctype html" in response.content.lower(), path
