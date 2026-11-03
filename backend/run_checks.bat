@echo off
setlocal

cd /d e:\All\audit\auditweave-main\backend

echo ====== ALEMBIC CURRENT ======
venv\Scripts\alembic.exe current 2>&1
echo ====== ALEMBIC HEADS ======
venv\Scripts\alembic.exe heads 2>&1
echo ====== DONE ======
