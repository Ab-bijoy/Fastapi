"""create phone_number for user column

Revision ID: 1de712b83b76
Revises: 
Create Date: 2026-03-20 00:23:39.535830

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1de712b83b76'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users",sa.Column("phone_number",sa.String))


def downgrade() -> None:
    op.drop_column("users","phone_number")
