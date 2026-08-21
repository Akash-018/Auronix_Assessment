"""Add USER enum value to userrole type in PostgreSQL

Revision ID: 0002_add_user_enum_value
Revises: 0001_initial_tables
Create Date: 2026-08-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0002_add_user_enum_value'
down_revision = '0001_initial_tables'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Safely alter PostgreSQL enum type if running on PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'USER';")

def downgrade() -> None:
    pass
