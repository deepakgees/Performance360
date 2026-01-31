# Root Directory Restructure Proposal

## Current Issues
- Too many markdown documentation files at root level
- Script files scattered (`.bat`, `.sh` files)
- Configuration files mixed with documentation
- No clear organization for different types of files

## Proposed Structure

```
employee-feedback-app/
├── README.md                          # Main project README
├── package.json                       # Root package.json
├── package-lock.json                  # Root package-lock.json
├── .gitignore                         # Git ignore rules
├── cypress.config.js                  # Cypress configuration
│
├── backend/                          # Backend application (unchanged)
├── frontend/                          # Frontend application (unchanged)
├── playwright-tests/                  # E2E tests (unchanged)
├── security-tests/                   # Security tests (unchanged)
│
├── docs/                              # 📁 NEW: All documentation
│   ├── security/                      # Security-related documentation
│   │   ├── SECURITY_AUDIT_REPORT_2024.md
│   │   ├── SECURITY_AUDIT_REPORT.md
│   │   ├── SECURITY_FIXES_IMPLEMENTATION.md
│   │   ├── SECURITY_FIXES_SUMMARY.md
│   │   └── SECURITY_TESTING_SUMMARY.md
│   │
│   ├── features/                      # Feature-specific documentation
│   │   ├── ACHIEVEMENTS_OBSERVATIONS.md
│   │   ├── DIRECT_INDIRECT_REPORTS.md
│   │   ├── JIRA_REPORTER.md
│   │   └── JIRA_UNMAPPED_USERS.md
│   │
│   ├── deployment/                    # Deployment documentation
│   │   └── (move backend/frontend deployment docs here if needed)
│   │
│   └── README.md                      # Documentation index
│
├── scripts/                           # 📁 EXISTING: All scripts
│   ├── kill-port.js                   # (already here)
│   ├── database/                      # 📁 NEW: Database scripts
│   │   ├── DBBackup.bat
│   │   ├── DBRestore.bat
│   │   └── DBConnectionTermination.txt
│   │
│   ├── development/                   # 📁 NEW: Development scripts
│   │   ├── debug.bat
│   │   ├── debug.sh
│   │   └── StartApps.bat
│   │
│   └── README.md                      # Scripts documentation
│
└── config/                            # 📁 NEW: Shared configuration (optional)
    └── (future shared configs)
```

## File Movement Plan

### Documentation Files → `docs/`

**Security Documentation:**
- `SECURITY_AUDIT_REPORT_2024.md` → `docs/security/`
- `SECURITY_AUDIT_REPORT.md` → `docs/security/`
- `SECURITY_FIXES_IMPLEMENTATION.md` → `docs/security/`
- `SECURITY_FIXES_SUMMARY.md` → `docs/security/`
- `SECURITY_TESTING_SUMMARY.md` → `docs/security/`

**Feature Documentation:**
- `ACHIEVEMENTS_OBSERVATIONS_README.md` → `docs/features/ACHIEVEMENTS_OBSERVATIONS.md`
- `DIRECT_INDIRECT_REPORTS.md` → `docs/features/`
- `JIRA_REPORTER_README.md` → `docs/features/JIRA_REPORTER.md`
- `JIRA_UNMAPPED_USERS_README.md` → `docs/features/JIRA_UNMAPPED_USERS.md`

### Script Files → `scripts/`

**Database Scripts:**
- `DBBackup.bat` → `scripts/database/`
- `DBRestore.bat` → `scripts/database/`
- `DBConnectionTermination.txt` → `scripts/database/`

**Development Scripts:**
- `debug.bat` → `scripts/development/`
- `debug.sh` → `scripts/development/`
- `StartApps.bat` → `scripts/development/`
- `kill-port.bat` → `scripts/development/` (or keep in root scripts/)

## Benefits

1. **Cleaner Root**: Only essential files at root level
2. **Better Organization**: Related files grouped together
3. **Easier Navigation**: Clear structure for new developers
4. **Scalability**: Easy to add new docs/scripts without cluttering root
5. **Professional**: Follows common project structure conventions

## Implementation Steps

1. Create new directory structure
2. Move files to appropriate locations
3. Update any references in code/docs
4. Update README.md with new structure
5. Commit changes

## Alternative: Minimal Structure

If you prefer a simpler structure:

```
employee-feedback-app/
├── README.md
├── package.json
├── .gitignore
├── cypress.config.js
│
├── backend/
├── frontend/
├── playwright-tests/
├── security-tests/
│
├── docs/                    # All markdown files
│   ├── security/
│   └── features/
│
└── scripts/                 # All scripts (flat structure)
    ├── database/
    └── development/
```

