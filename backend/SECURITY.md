# Security Documentation

## Test Endpoint Protection

### Overview

The application includes test endpoints for automated testing that are **completely disabled in production** to prevent misuse and security vulnerabilities.

### Protected Endpoints

The following test endpoints are automatically disabled in production:

- `DELETE /api/test-cleanup/delete` - Delete user by email
- `DELETE /api/test-cleanup/delete-pattern` - Delete users by email pattern
- `POST /api/test-cleanup/create-user` - Create user with role
- `PUT /api/test-cleanup/assign-manager` - Assign manager to employee

### Protection Mechanisms

#### 1. Environment-Based Route Registration

Test routes are only registered when `NODE_ENV !== 'production'`:

```typescript
// Test cleanup routes (no authentication required) - only in non-production
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test-cleanup', userRoutes);
  console.log('🔧 Test cleanup routes enabled (development mode)');
}
```

#### 2. Endpoint-Level Security Checks

Each test endpoint includes an additional security check:

```typescript
router.put('/assign-manager', async (req: Request, res: Response) => {
  // Additional security check for production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Endpoint not found' });
  }
  // ... rest of endpoint logic
});
```

### Environment Configuration

#### Development/Testing

```env
NODE_ENV=development
# Test endpoints are available
```

#### Production

```env
NODE_ENV=production
# Test endpoints are completely disabled
```

### Security Benefits

1. **Complete Isolation**: Test endpoints are not even registered in production
2. **Double Protection**: Even if routes were somehow registered, individual endpoints check environment
3. **No Authentication Bypass**: Test endpoints cannot be used to bypass authentication in production
4. **Clear Logging**: Server logs indicate when test routes are enabled

### Deployment Checklist

Before deploying to production, ensure:

- [ ] `NODE_ENV=production` is set
- [ ] Test endpoints are not accessible (404 responses)
- [ ] No test cleanup routes are registered
- [ ] All production endpoints require proper authentication

### Testing Security

To verify test endpoints are properly disabled in production:

```bash
# Set production environment
export NODE_ENV=production

# Start server
npm start

# Test endpoints should return 404
curl -X DELETE http://localhost:5000/api/test-cleanup/delete \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# Expected: 404 Not Found
```

### Additional Security Measures

1. **Rate Limiting**: All endpoints are protected by rate limiting
2. **CORS Protection**: Only allowed origins can access the API
3. **Input Validation**: All endpoints validate input data
4. **Error Handling**: Generic error messages prevent information leakage
5. **Logging**: All requests are logged for monitoring

### Monitoring

In production, monitor for:

- 404 errors on test endpoints (should not occur)
- Unauthorized access attempts
- Unusual request patterns
- Failed authentication attempts

### Emergency Procedures

If test endpoints are accidentally exposed:

1. **Immediate**: Set `NODE_ENV=production` and restart server
2. **Investigation**: Check logs for unauthorized access
3. **Cleanup**: Review and clean any test data created
4. **Audit**: Review deployment process to prevent recurrence
