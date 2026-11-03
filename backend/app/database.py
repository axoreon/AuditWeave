import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Manually load .env file from the backend directory if present
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with env_path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def _is_placeholder_database_url(value: str | None) -> bool:
    if not value:
        return True
    normalized = value.strip().lower()
    if "replace_me" in normalized:
        return True
    if "host" in normalized and "user" in normalized and "pass" in normalized:
        return True
    return False


def _default_sqlite_database_url() -> str:
    db_path = Path(__file__).resolve().parent.parent / "AuditWeave.db"
    return f"sqlite:///{db_path.as_posix()}"


DATABASE_URL = os.getenv("DATABASE_URL")
if _is_placeholder_database_url(DATABASE_URL):
    DATABASE_URL = _default_sqlite_database_url()

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine_kwargs = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["connect_args"] = {"connect_timeout": 10}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
