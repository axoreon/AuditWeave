from __future__ import annotations

import importlib.util
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
HELPER_PATH = REPOSITORY_ROOT / "scripts" / "create_migration.py"
SPEC = importlib.util.spec_from_file_location("create_migration", HELPER_PATH)
assert SPEC and SPEC.loader
create_migration = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(create_migration)


def test_slugify_produces_readable_safe_filename_component():
    assert create_migration.slugify(" Add contact requests! ") == "add_contact_requests"
    assert create_migration.slugify("Café & audit indexes") == "cafe_audit_indexes"


def test_next_sequence_reserves_legacy_migrations(tmp_path):
    files = [
        tmp_path / "random_revision_initial.py",
        tmp_path / "another_revision_users.py",
    ]
    assert create_migration.next_sequence(files) == 3


def test_next_sequence_continues_highest_numeric_prefix(tmp_path):
    files = [
        tmp_path / "legacy_revision.py",
        tmp_path / "0009_add_contact_requests.py",
        tmp_path / "0010_add_audit_indexes.py",
    ]
    assert create_migration.next_sequence(files) == 11
