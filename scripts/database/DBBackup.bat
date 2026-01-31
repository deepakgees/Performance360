@echo on

REM Generate backup file name with timestamp
set CUR_YYYY=%date:~6,4%
set CUR_MM=%date:~3,2%
set CUR_DD=%date:~0,2%
set CUR_HH=%time:~0,2%
if %CUR_HH% lss 10 (set CUR_HH=0%time:~1,1%)
set CUR_NN=%time:~3,2%
set CUR_SS=%time:~6,2%

set BACKUP_FILE=%CUR_YYYY%-%CUR_MM%-%CUR_DD%_%CUR_HH%-%CUR_NN%-%CUR_SS%.custom.backup

REM Set PostgreSQL password (avoid spaces after =)
set PGPASSWORD=goenkd

REM Run pg_dump (update the path if needed)
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" --username="postgres" -d feedback_app --format=custom -f "C:\Users\goenkd\OneDrive - msg systems ag\MSG\FeedbackAppBackups\%BACKUP_FILE%"


echo Backup successfully created: %BACKUP_FILE%


@rem exit