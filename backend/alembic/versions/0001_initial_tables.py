"""Initial database tables migration

Revision ID: 0001_initial_tables
Revises: 
Create Date: 2026-08-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0001_initial_tables'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('SUPERADMIN', 'ADMIN', 'USER', 'CANDIDATE', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Challenges table
    op.create_table(
        'challenges',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reference_image_url', sa.String(length=500), nullable=True),
        sa.Column('reference_width', sa.Integer(), nullable=True),
        sa.Column('reference_height', sa.Integer(), nullable=True),
        sa.Column('reference_aspect_ratio', sa.Float(), nullable=True),
        sa.Column('status', sa.Enum('DRAFT', 'ACTIVE', 'ARCHIVED', name='challengestatus'), nullable=False),
        sa.Column('created_by', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('challenge_id', sa.String(length=36), nullable=False),
        sa.Column('owner_id', sa.String(length=36), nullable=False),
        sa.Column('html_code', sa.Text(), nullable=False),
        sa.Column('css_code', sa.Text(), nullable=False),
        sa.Column('js_code', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_saved_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['challenge_id'], ['challenges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Submissions table
    op.create_table(
        'submissions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('rendered_image_url', sa.String(length=500), nullable=True),
        sa.Column('visual_score', sa.Float(), nullable=True),
        sa.Column('code_score', sa.Float(), nullable=True),
        sa.Column('final_score', sa.Float(), nullable=True),
        sa.Column('evaluation_details', sa.JSON(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'COMPLETED', 'FAILED', name='submissionstatus'), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('submissions')
    op.drop_table('projects')
    op.drop_table('challenges')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
