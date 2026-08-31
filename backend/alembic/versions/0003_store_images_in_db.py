"""Store images in DB as Text (Base64)

Revision ID: 0003_store_images_in_db
Revises: 0002_add_user_enum_value
Create Date: 2026-08-31 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0003_store_images_in_db'
down_revision = '0002_add_user_enum_value'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('challenges') as batch_op:
        batch_op.alter_column('reference_image_url', type_=sa.Text(), existing_type=sa.String(length=500), nullable=True)

    with op.batch_alter_table('submissions') as batch_op:
        batch_op.alter_column('rendered_image_url', type_=sa.Text(), existing_type=sa.String(length=500), nullable=True)

def downgrade() -> None:
    with op.batch_alter_table('challenges') as batch_op:
        batch_op.alter_column('reference_image_url', type_=sa.String(length=500), existing_type=sa.Text(), nullable=True)

    with op.batch_alter_table('submissions') as batch_op:
        batch_op.alter_column('rendered_image_url', type_=sa.String(length=500), existing_type=sa.Text(), nullable=True)
