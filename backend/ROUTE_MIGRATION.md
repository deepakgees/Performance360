# Feedback Routes Migration Guide

## Overview

The feedback routes have been split into two separate modules for better organization and maintainability:

- **Colleague Feedback**: `colleague-feedback.ts` - Handles feedback between colleagues
- **Manager Feedback**: `manager-feedback.ts` - Handles feedback for managers

## New Route Structure

### Colleague Feedback Routes

- **Base Path**: `/api/colleague-feedback`
- **Endpoints**:
  - `GET /received` - Get received colleague feedback
  - `GET /sent` - Get sent colleague feedback
  - `POST /` - Create new colleague feedback
  - `PATCH /:id/status` - Update feedback status

### Manager Feedback Routes

- **Base Path**: `/api/manager-feedback`
- **Endpoints**:
  - `GET /received` - Get received manager feedback
  - `GET /sent` - Get sent manager feedback
  - `POST /` - Create new manager feedback
  - `PATCH /:id/status` - Update feedback status

## Migration Complete

The old feedback routes have been completely removed. All applications must now use the new separated routes:

- **Old Base Path**: `/api/feedback` ❌ **No longer available**
- **New Base Paths**:
  - `/api/colleague-feedback` ✅ **Use this for colleague feedback**
  - `/api/manager-feedback` ✅ **Use this for manager feedback**

## Migration Status

### ✅ Completed

- New routes are active at `/api/colleague-feedback` and `/api/manager-feedback`
- Old `/api/feedback` routes have been removed
- Backward compatibility layer has been eliminated
- Clean, focused route structure

### 🔄 Required Actions

- **Frontend applications must be updated** to use the new route paths
- **API clients must be updated** to use the new endpoints
- **Documentation must be updated** to reflect new routes

## Benefits of the New Structure

1. **Better Organization**: Separate concerns for colleague vs manager feedback
2. **Easier Maintenance**: Smaller, focused files
3. **Clear API Design**: Explicit route naming
4. **Scalability**: Easier to add new feedback types
5. **Testing**: Isolated test suites for each feedback type

## Example Usage

### Colleague Feedback

```javascript
// Get received colleague feedback
fetch('/api/colleague-feedback/received', {
  headers: { Authorization: `Bearer ${token}` },
});

// Create colleague feedback
fetch('/api/colleague-feedback', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    receiverId: 'user123',
    year: '2024',
    quarter: 'Q1',
    rating: 5,
    feedbackProvider: 'John Doe',
    appreciation: 'Great teamwork!',
    improvement: 'Could improve communication',
  }),
});
```

### Manager Feedback

```javascript
// Get received manager feedback
fetch('/api/manager-feedback/received', {
  headers: { Authorization: `Bearer ${token}` },
});

// Create manager feedback
fetch('/api/manager-feedback', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    receiverId: 'manager123',
    year: '2024',
    quarter: 'Q1',
    feedbackProvider: 'Jane Smith',
    managerSatisfaction: 'Very satisfied with leadership',
    managerOverallRating: 5,
  }),
});
```

## File Structure

```
backend/src/routes/
├── colleague-feedback.ts    # Colleague feedback routes
├── manager-feedback.ts      # Manager feedback routes
└── ...
```

## Testing

Each route module can be tested independently:

```bash
# Test colleague feedback routes
npm test -- --grep "colleague-feedback"

# Test manager feedback routes
npm test -- --grep "manager-feedback"
```
