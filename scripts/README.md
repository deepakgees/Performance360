# Scripts

This directory contains utility scripts organized by purpose.

## Structure

### Database Scripts (`database/`)
Scripts for database operations:
- `DBBackup.bat` - Database backup script
- `DBRestore.bat` - Database restore script
- `DBConnectionTermination.txt` - Database connection termination notes

### Development Scripts (`development/`)
Development and debugging utilities:
- `debug.bat` - Debug script for Windows
- `debug.sh` - Debug script for Linux/Mac
- `StartApps.bat` - Start all applications
- `kill-port.bat` - Kill process on specific port

### Root Scripts
- `kill-port.js` - Node.js script to kill processes on specific ports

## Usage

### Database Operations
```bash
# Windows
scripts\database\DBBackup.bat
scripts\database\DBRestore.bat
```

### Development
```bash
# Windows
scripts\development\StartApps.bat
scripts\development\debug.bat

# Linux/Mac
scripts/development/debug.sh
```

### Kill Port
```bash
# Using Node.js script (cross-platform)
node scripts/kill-port.js 3001

# Using batch script (Windows)
scripts\development\kill-port.bat 3001
```

## Notes

- Always review scripts before running them
- Ensure you have proper permissions for database operations
- Some scripts may require environment variables to be set

