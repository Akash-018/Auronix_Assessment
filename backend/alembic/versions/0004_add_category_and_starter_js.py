"""add category and starter_js to challenges

Revision ID: 0004_add_category_and_starter_js
Revises: 0003_store_images_in_db
Create Date: 2026-09-04 16:42:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0004_add_category_and_starter_js'
down_revision = '0003_store_images_in_db'
branch_labels = None
depends_on = None

def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challengecategory') THEN CREATE TYPE challengecategory AS ENUM ('HTML', 'JS'); END IF; END $$;")
        op.add_column('challenges', sa.Column('category', sa.Enum('HTML', 'JS', name='challengecategory'), nullable=False, server_default='HTML'))
    else:
        # SQLite dialect
        op.add_column('challenges', sa.Column('category', sa.String(10), nullable=False, server_default='HTML'))
    
    op.add_column('challenges', sa.Column('starter_js', sa.Text(), nullable=True))
    op.add_column('challenges', sa.Column('test_cases', sa.JSON(), nullable=True))

def downgrade() -> None:
    bind = op.get_bind()
    op.drop_column('challenges', 'test_cases')
    op.drop_column('challenges', 'starter_js')
    op.drop_column('challenges', 'category')
    if bind.dialect.name == 'postgresql':
        op.execute("DROP TYPE IF EXISTS challengecategory;")
