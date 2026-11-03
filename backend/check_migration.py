"""
check_migration.py  —  quick migration state inspector
Run: python check_migration.py  (from backend/)
"""
import subprocess, sys, os

VENV_PYTHON = os.path.join(os.path.dirname(__file__), "venv", "Scripts", "python.exe")

result = subprocess.run(
    [VENV_PYTHON, "-m", "alembic", "current"],
    capture_output=True, text=True, cwd=os.path.dirname(__file__)
)
print("=== alembic current ===")
print(result.stdout)
print(result.stderr)

result2 = subprocess.run(
    [VENV_PYTHON, "-m", "alembic", "heads"],
    capture_output=True, text=True, cwd=os.path.dirname(__file__)
)
print("=== alembic heads ===")
print(result2.stdout)
print(result2.stderr)
