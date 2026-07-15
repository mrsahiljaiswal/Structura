# SQLAlchemy ORM models live here (one module per domain entity, e.g.
# `user.py`, `order.py`). Import every model module in this file so
# `app.db.base.Base.metadata` is fully populated for Alembic autogenerate:
#
#   from app.models.user import User  # noqa: F401
#
from .course_models import Document, Course, Chapter, Lesson  # noqa: F401

