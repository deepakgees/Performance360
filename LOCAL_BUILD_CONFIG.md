# Local Build Configuration

## Overview

This project is configured to treat ESLint warnings as errors in production builds, matching the behavior of Railway/CI environments. This ensures code quality and catches issues before deployment.

## Build Scripts

### Frontend

- **`npm run build`** - Production build with strict checking (warnings as errors)
  - Uses `CI=true` to treat warnings as errors
  - Same behavior as Railway/CI builds
  - Use this before committing/deploying

- **`npm run build:dev`** - Development build (warnings allowed)
  - More lenient, warnings don't fail the build
  - Use for quick local testing

- **`npm run build:check`** - Check build (same as `build`)
  - Alias for `build` to explicitly check for issues

### Backend

- **`npm run build`** - TypeScript compilation
  - Already strict by default
  - TypeScript errors will fail the build

## Why This Matters

### Before (Local Development)
- ESLint warnings were ignored
- Build succeeded even with code quality issues
- Issues only caught in CI/Railway
- Wasted time fixing issues after deployment

### After (Current Configuration)
- ESLint warnings treated as errors locally
- Build fails early if there are issues
- Same behavior as CI/Railway
- Catch and fix issues before committing

## Testing Locally

To test your build before pushing:

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

If the build succeeds locally, it will succeed on Railway.

## Development Workflow

1. **During Development**: Use `npm start` (development mode)
   - Warnings shown but don't block
   - Fast refresh and hot reload

2. **Before Committing**: Run `npm run build`
   - Catches all issues
   - Ensures code is production-ready

3. **If Build Fails**: Fix the errors
   - All errors must be resolved
   - No warnings allowed in production builds

## Disabling Strict Mode (Not Recommended)

If you need to temporarily disable strict checking:

```bash
# Frontend - use dev build
npm run build:dev

# Or set CI=false
CI=false npm run build
```

**Note**: This is not recommended. Fix the issues instead!

## Common Issues and Fixes

### Unused Variables
```typescript
// ❌ Error
const unusedVar = 123;

// ✅ Fix - Remove or prefix with underscore
const _unusedVar = 123; // If intentionally unused
```

### Missing useEffect Dependencies
```typescript
// ❌ Error
useEffect(() => {
  loadData();
}, []); // Missing loadData dependency

// ✅ Fix - Use useCallback
const loadData = useCallback(() => {
  // ...
}, [dependencies]);

useEffect(() => {
  loadData();
}, [loadData]);
```

### TypeScript Errors
```typescript
// ❌ Error
const data: SomeType = undefined;

// ✅ Fix - Use proper types
const data: SomeType | undefined = undefined;
```

## CI/CD Integration

This configuration ensures:
- ✅ Local builds match CI builds
- ✅ No surprises in deployment
- ✅ Consistent code quality
- ✅ Faster feedback loop

## Summary

- **Always use `npm run build`** before committing
- **Fix all warnings/errors** before pushing
- **Local = CI** - if it builds locally, it builds in CI
- **No exceptions** - strict checking is enforced
