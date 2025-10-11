# Authentication System Testing Guide

## 🚀 Quick Start Testing

Once your environment is set up (database running, dependencies installed), use this guide to test the authentication system.

## 📋 Manual Testing Checklist

### 1. System Health Check
```bash
# Check if the system is running
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "authentication": "ready",
  "features": { ... }
}
```

### 2. User Registration (Signup)

**Test Case 1: Valid Worker Registration**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com",
    "password": "WorkerPass123!",
    "name": "Test Worker",
    "role": "WORKER"
  }'
```

**Test Case 2: Valid Restaurant Owner Registration**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@restaurant.com",
    "password": "OwnerPass123!",
    "name": "Restaurant Owner",
    "role": "RESTAURANT_OWNER",
    "businessName": "Test Restaurant"
  }'
```

**Test Case 3: Invalid Password (Should Fail)**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "name": "Test User",
    "role": "WORKER"
  }'
# Expected: 400 error with password requirements
```

**Test Case 4: Duplicate Email (Should Fail)**
```bash
# Try to register with the same email as Test Case 1
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com",
    "password": "AnotherPass123!",
    "name": "Another User",
    "role": "WORKER"
  }'
# Expected: 400 error "User already exists"
```

### 3. User Login (Signin)

**Test Case 5: Valid Login**
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com",
    "password": "WorkerPass123!"
  }'

# Save the accessToken from response for next tests
# Note: refreshToken is set as HTTP-only cookie
```

**Test Case 6: Invalid Credentials (Should Fail)**
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com",
    "password": "wrongpassword"
  }'
# Expected: 401 error "Invalid email or password"
```

### 4. Token Refresh

**Test Case 7: Token Refresh (Requires login cookie)**
```bash
# First login to get refresh token cookie, then:
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie "refreshToken=<token_from_login_response>"
```

### 5. Protected Endpoint Access

**Test Case 8: Access with Valid Token**
```bash
# Replace YOUR_ACCESS_TOKEN with token from login response
curl -X GET http://localhost:3000/api/protected-example \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Test Case 9: Access without Token (Should Fail)**
```bash
curl -X GET http://localhost:3000/api/protected-example
# Expected: 401 error "Authorization token required"
```

### 6. Logout

**Test Case 10: Logout**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  --cookie "refreshToken=<token_from_login>"
```

### 7. Email Verification

**Test Case 11: Email Verification**
```bash
# Use verification token from console logs after signup
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "VERIFICATION_TOKEN_FROM_LOGS"
  }'
```

### 8. Password Reset

**Test Case 12: Request Password Reset**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com"
  }'
# Check console logs for reset token
```

**Test Case 13: Complete Password Reset**
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_LOGS",
    "password": "NewPassword123!"
  }'
```

## 🧪 Automated Testing

### Unit Tests
```bash
cd web
npm test -- authService.test.ts
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test-config.yml
```

## 🔍 Security Testing

### 1. Rate Limiting Test
```bash
# Try to make multiple rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' &
done
wait
# Should see rate limiting after 5 attempts
```

### 2. Account Lockout Test
```bash
# Try 6 failed login attempts
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"worker@example.com","password":"wrongpassword"}'
  echo "Attempt $i"
done
# 6th attempt should show account locked
```

### 3. Token Security Test
```bash
# Try to use expired/invalid token
curl -X GET http://localhost:3000/api/protected-example \
  -H "Authorization: Bearer invalid.token.here"
# Should return 401 Unauthorized
```

## 📊 Expected Results Summary

| Test Case | Expected Status | Expected Response |
|-----------|----------------|-------------------|
| Valid Signup | 200 | User created with tokens |
| Invalid Password | 400 | Password requirements error |
| Duplicate Email | 400 | User exists error |
| Valid Login | 200 | User data with access token |
| Invalid Login | 401 | Invalid credentials error |
| Token Refresh | 200 | New access token |
| Protected Access | 200/401 | Data or auth error |
| Logout | 200 | Success message |
| Email Verify | 200 | Verification success |
| Password Reset | 200 | Reset success |

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Ensure PostgreSQL is running: `docker-compose up -d db`
   - Check DATABASE_URL in .env file

2. **JWT Token Errors**
   - Ensure JWT_SECRET is set in .env
   - Check token format in Authorization header

3. **Prisma Client Errors**
   - Run: `npx prisma generate`
   - Run: `npx prisma db push`

4. **CORS Errors**
   - Check if requests include proper headers
   - Verify origin domain in CORS config

5. **Rate Limiting Issues**
   - Wait for rate limit window to reset
   - Check Redis connection if implemented

## 📈 Performance Benchmarks

**Target Performance Metrics:**
- Signup: < 500ms response time
- Login: < 200ms response time
- Token refresh: < 100ms response time
- Protected endpoint: < 50ms response time

**Load Testing Targets:**
- 100 concurrent users
- 1000 requests per minute
- 99% success rate
- < 1% error rate

## ✅ Testing Completion Checklist

- [ ] Health check endpoint returns healthy status
- [ ] User registration works for both roles
- [ ] Password validation enforces strength requirements
- [ ] Login returns proper tokens and user data
- [ ] Account lockout triggers after failed attempts
- [ ] Token refresh generates new valid tokens
- [ ] Protected endpoints require valid authorization
- [ ] Logout properly revokes refresh tokens
- [ ] Email verification flow completes successfully
- [ ] Password reset flow works end-to-end
- [ ] Rate limiting prevents abuse
- [ ] Security headers are present in responses
- [ ] Error messages are consistent and informative
- [ ] Database operations complete within performance targets

**Status**: Ready for comprehensive testing! 🚀