@echo off

REM Run pg_restore
"C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -U postgres -d feedback_app "C:\Users\goenkd\OneDrive - msg systems ag\MSG\Performance360Backups\2026-16-01_13-57-59.custom.backup"



echo Backup restored successfully

pause