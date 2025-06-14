# Emergency Recovery Plan

## Introduction
This document outlines the procedures to recover the application in case of issues caused by cleanup scripts or other system changes. Follow these steps carefully to restore the system to a working state.

## Immediate Steps
1. **Stop any running cleanup scripts** - If a cleanup script is currently running, try to stop it using Ctrl+C.
2. **Assess the damage** - Identify what changes were made and what functionality is affected.
3. **Check the logs** - Review the console output and log files for error messages.

## Restoring from Git
If the issue was caused by recent changes, you can use Git to revert to a previous state:

### Option 1: Undo the last commit (if changes are committed)
```bash
git reset --hard HEAD~1
git clean -fd
```

### Option 2: Revert to a specific commit
1. Find the commit hash using: `git log --oneline`
2. Revert to that commit: `git reset --hard <commit-hash>`

### Option 3: Discard all local changes
```bash
git fetch origin
git reset --hard origin/main  # or your main branch name
git clean -fd
```

## Verifying Recovery
After restoring from Git:

1. **Reinstall dependencies**
   ```bash
   npm install
   ```

2. **Run database migrations** (if applicable)
   ```bash
   npx prisma migrate dev
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Run tests** to verify everything is working
   ```bash
   npm test
   ```

## Prevention for Future Incidents
1. Always create a backup or branch before running cleanup scripts
2. Test cleanup scripts in a non-production environment first
3. Review the changes before committing them
4. Keep the emergency recovery plan updated

## Contact Information
- **Lead Developer**: [Your Name] - [Your Email]
- **DevOps**: [Contact Person] - [Contact Email]
- **Emergency Contact**: [Emergency Contact] - [Emergency Phone]
