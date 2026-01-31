# Employee Tests

This directory contains tests for features available to **all roles**: Employee, Manager, and Admin.

## Test Files

### `user-registration-login.spec.js`
Tests user registration and login functionality, which is available to all users.

**Features tested:**
- User registration
- User login
- Authentication flow

### `self-assessment.spec.js`
Tests self-assessment functionality, which all employees (including managers and admins) can use.

**Features tested:**
- Creating self-assessments
- Filling assessment forms
- Submitting assessments

### `create-assessment-current-quarter.spec.js`
Tests creating assessments for the current quarter.

**Features tested:**
- Current quarter detection
- Assessment creation for current period

### `colleague-feedback.spec.js`
Tests colleague feedback functionality, where any employee can give feedback to another employee.

**Features tested:**
- Submitting colleague feedback
- Feedback form completion
- Feedback submission workflow

### `manager-feedback.spec.js`
Tests manager feedback functionality, where employees can provide feedback about their manager.

**Features tested:**
- Submitting manager feedback
- Leadership style ratings
- Career growth feedback
- Coaching and caring feedback

## Running Employee Tests

```bash
# Run all employee tests
npx playwright test --project=employee

# Run a specific test file
npx playwright test tests/employee/user-registration-login.spec.js
```

## Notes

- All tests in this directory are available to Employee, Manager, and Admin roles
- These are common features that all authenticated users can access
- Manager-specific and Admin-specific features should be in their respective directories

