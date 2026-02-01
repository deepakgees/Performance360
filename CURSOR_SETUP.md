# Cursor IDE Configuration for Performance360

## Overview

This guide helps you configure Cursor IDE to generate code that follows ESLint rules and passes strict builds automatically.

## Configuration Files

### 1. `.cursorrules` File (Created)

This file tells Cursor's AI how to generate code. It includes:
- ESLint compliance rules
- React best practices
- TypeScript requirements
- Hook dependency rules

**Location**: `.cursorrules` (root directory)

### 2. ESLint Configuration

**Location**: `frontend/.eslintrc.json`

Already configured with:
- Strict unused variable checking
- React hooks exhaustive deps enforcement
- TypeScript-specific rules

### 3. TypeScript Configuration

**Location**: `frontend/tsconfig.json`

Already configured with:
- Strict mode enabled
- Type checking enabled

## Cursor Settings

### Enable ESLint Integration

1. Open Cursor Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "ESLint"
3. Enable:
   - ✅ **ESLint: Enable**
   - ✅ **ESLint: Validate**
   - ✅ **Editor: Code Actions On Save** → Enable "source.fixAll.eslint"

### Enable TypeScript Checking

1. In Cursor Settings, search for "TypeScript"
2. Enable:
   - ✅ **TypeScript: Validate**
   - ✅ **TypeScript: Check JS**

### Code Actions on Save

1. In Settings, search for "Code Actions On Save"
2. Add to `settings.json`:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

## Using Cursor AI

### When Asking Cursor to Generate Code

1. **Be Specific**: Mention ESLint compliance
   - "Generate a React component that follows ESLint rules"
   - "Create a function with proper TypeScript types and no ESLint errors"

2. **Reference Rules**: Point to `.cursorrules`
   - "Follow the rules in `.cursorrules`"
   - "Use useCallback for functions in useEffect dependencies"

3. **Request Validation**: Ask Cursor to check
   - "Make sure this code passes ESLint"
   - "Ensure no unused variables"

### Example Prompts

**Good Prompts:**
```
Create a React component that:
- Uses useCallback for event handlers
- Includes all useEffect dependencies
- Has no unused variables
- Follows ESLint rules in .cursorrules
```

```
Generate a function that:
- Uses proper TypeScript types
- Handles errors properly
- Passes ESLint validation
- Follows the project's code style
```

**Bad Prompts:**
```
Create a component (might ignore ESLint rules)
```

## Verification

### After Code Generation

1. **Check ESLint**: Look for red underlines
2. **Run Build**: `npm run build` in frontend
3. **Fix Issues**: Ask Cursor to fix any errors

### Quick Check Commands

```bash
# Frontend - Check for ESLint errors
cd frontend
npm run build

# If build fails, fix errors and rebuild
```

## Cursor Settings File

Create or update `.vscode/settings.json` (Cursor uses VS Code settings):

```json
{
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Tips for Better Code Generation

### 1. Context Matters
- Open relevant files before asking Cursor to generate code
- Cursor will see existing patterns and follow them

### 2. Be Explicit
- Mention specific rules: "use useCallback", "include dependencies"
- Reference project conventions

### 3. Iterate
- Generate code
- Check for errors
- Ask Cursor to fix: "Fix the ESLint errors in this code"

### 4. Use Examples
- Show Cursor examples of correct code
- Point to similar files in the project

## Troubleshooting

### Cursor Still Generates Code with Errors

1. **Check `.cursorrules`**: Make sure it's in the root directory
2. **Restart Cursor**: Sometimes needed for rules to take effect
3. **Be More Explicit**: Add "follow ESLint rules" to your prompt
4. **Check Settings**: Ensure ESLint is enabled in Cursor

### ESLint Not Working

1. **Install ESLint Extension**: In Cursor, install ESLint extension
2. **Check Node Modules**: Run `npm install` in frontend
3. **Check ESLint Config**: Verify `frontend/.eslintrc.json` exists

### TypeScript Errors

1. **Check tsconfig.json**: Verify it's properly configured
2. **Restart TypeScript Server**: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
3. **Check Types**: Ensure all types are properly defined

## Best Practices

1. **Always Review Generated Code**: Don't blindly accept AI-generated code
2. **Run Build Before Committing**: `npm run build` catches issues
3. **Fix Errors Immediately**: Don't let errors accumulate
4. **Use Linter**: Let ESLint guide your code quality
5. **Follow Patterns**: Match existing code style in the project

## Summary

- ✅ `.cursorrules` file created with project-specific rules
- ✅ ESLint configuration already strict
- ✅ TypeScript strict mode enabled
- ✅ Build script uses CI mode (warnings as errors)
- ✅ Cursor will now follow these rules when generating code

**Remember**: Always run `npm run build` before committing to catch any issues!
