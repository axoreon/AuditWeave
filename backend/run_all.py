"""
run_all.py — Runs migration upgrade + pytest via Python subprocess.
Usage: python run_all.py
Writes results to run_all_output.txt
"""
import subprocess
import sys
import os

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "run_all_output.txt")

PYTHON_EXE = os.path.join(os.path.dirname(__file__), "venv", "Scripts", "python.exe")
BACKEND_DIR = os.path.dirname(__file__)


def run(args, env_extra=None):
    env = os.environ.copy()
    env.update(env_extra or {})
    result = subprocess.run(
        args,
        capture_output=True,
        text=True,
        cwd=BACKEND_DIR,
        env=env,
    )
    return result.returncode, result.stdout + result.stderr


lines = []

# 1. Check alembic current
rc, out = run([PYTHON_EXE, "-m", "alembic", "current"])
lines.append("=== alembic current ===")
lines.append(out)
lines.append(f"(exit {rc})")

# 2. Check alembic heads
rc, out = run([PYTHON_EXE, "-m", "alembic", "heads"])
lines.append("\n=== alembic heads ===")
lines.append(out)
lines.append(f"(exit {rc})")

# 3. Apply migration
rc, out = run([PYTHON_EXE, "-m", "alembic", "upgrade", "head"])
lines.append("\n=== alembic upgrade head ===")
lines.append(out)
lines.append(f"(exit {rc})")

# 4. Run OTP tests
rc, out = run(
    [PYTHON_EXE, "-m", "pytest", "tests/test_email_otp.py", "-v", "--tb=short"],
    env_extra={"JWT_SECRET": "test_jwt_secret_for_tests_only_32ch"},
)
lines.append("\n=== pytest tests/test_email_otp.py ===")
lines.append(out)
lines.append(f"(exit {rc})")

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Done. Results in:", OUTPUT_FILE)
print("\n".join(lines))
