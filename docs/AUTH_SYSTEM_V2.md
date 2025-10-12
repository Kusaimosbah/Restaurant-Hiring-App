# Authentication System V2 - Token Handling & Security

## Overview

This document describes the enhanced authentication system with advanced token management, Redis-based session control, and comprehensive security features implemented in PR #003.

## 🔐 Security Features

### Token Management
- **JWT + Refresh Token Rotation**: Secure token pair with automatic rotation
- **Redis Token Blacklisting**: Immediate token revocation with Redis storage
- **Session Tracking**: Multi-device session management with metadata
- **Token Expiry**: Short-lived access tokens (15min) with long-lived refresh tokens (7d)

### Account Protection
- **Rate Limiting**: Per-endpoint and per-user rate limiting with Redis
- **Account Lockout**: Automatic lockout after 5 failed attempts (15min duration)
- **Password Strength**: Enforced complexity requirements
- **Brute Force Protection**: IP-based rate limiting for auth endpoints

### Security Headers
- **CORS Protection**: Strict cross-origin policies
- **XSS Protection**: Content-Type and XSS prevention headers
- **HSTS**: HTTP Strict Transport Security in production
- **CSP**: Content Security Policy headers

## 🏗️ Architecture

### Core Services

#### AuthServiceV2
Enhanced authentication service with:
- Advanced password validation (8+ chars, upper/lower/number/special)
- Redis-based rate limiting integration
- Token blacklisting support
- Multi-device session management
- Comprehensive error handling

#### TokenManager
Redis-based token and session management:
```typescript
- blacklistToken(tokenId, expiresInSeconds): Promise<void>
- isTokenBlacklisted(tokenId): Promise<boolean>
- createUserSession(userId, sessionData): Promise<void>
- getUserSessions(userId): Promise<any[]>
- revokeAllUserSessions(userId): Promise<void>
- checkRateLimit(identifier, maxAttempts, windowSeconds): Promise<RateLimitResult>
```

### Middleware Stack

#### Authentication Middleware
```typescript
withAuthV2(handler) // Enhanced auth with token blacklist checks
withRole(['WORKER', 'RESTAURANT_OWNER']) // Role-based access control
withRateLimit(100, 900) // Rate limiting (100 req/15min)
withSecurityHeaders(handler) // Security headers
withLogging(handler) // Request/response logging
compose(...middlewares) // Middleware composition utility
```

## 🚀 Usage Examples

### Basic Authentication
```typescript
// Protect endpoint with authentication
export const GET = withAuthV2(async (req: AuthenticatedRequest) => {
  const user = req.user // Guaranteed to exist
  return NextResponse.json({ user })
})
```

### Role-Based Access
```typescript
// Restrict to restaurant owners only
export const POST = withRole(['RESTAURANT_OWNER'])(async (req) => {
  // Only restaurant owners can access
  return NextResponse.json({ success: true })
})
```

### Rate Limited Endpoint
```typescript
// Apply rate limiting (50 requests per 5 minutes)
export const POST = withRateLimit(50, 300)(async (req) => {
  return NextResponse.json({ data: 'processed' })
})
```

### Composed Middleware
```typescript
// Combine multiple middleware
export const POST = compose(
  withLogging,
  withSecurityHeaders,
  withRateLimit(20, 60),
  withRole(['RESTAURANT_OWNER'])
)(async (req: AuthenticatedRequest) => {
  // Fully protected and monitored endpoint
  return NextResponse.json({ success: true })
})
```

## 🛡️ Security Best Practices

### Environment Variables
```bash
# Strong JWT secrets (minimum 32 characters)
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production-min-32-chars"

# Security settings
MAX_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION_MINUTES="15"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# Redis for session management
REDIS_URL="redis://localhost:6379"
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character (@$!%*?&)

### Rate Limiting
- **Login attempts**: 5 per 15 minutes per email
- **Signup attempts**: 3 per hour per email
- **API requests**: 100 per 15 minutes per IP
- **Password reset**: 3 per hour per email

## 📊 Monitoring & Logging

### Request Logging
All requests logged with:
- Method and URL
- IP address
- Response status
- Response time
- Error details (if any)

### Security Events
- Failed login attempts
- Account lockouts
- Rate limit violations
- Token blacklisting events
- Multi-device logouts

## 🧪 Testing

### Unit Tests
Comprehensive test coverage for:
- Authentication flows (signup/signin/logout)
- Token management (generation/validation/revocation)
- Rate limiting logic
- Password validation
- Error handling

### Integration Tests
- API endpoint security
- Middleware composition
- Redis integration
- Database transactions

### Security Tests
- Brute force attack simulation
- Token hijacking prevention
- Rate limit bypass attempts
- SQL injection prevention

## 🚀 Deployment Checklist

### Production Security
- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Configure Redis with authentication
- [ ] Enable HTTPS and HSTS headers
- [ ] Set up monitoring for security events
- [ ] Configure rate limiting based on load
- [ ] Set up email templates for notifications
- [ ] Enable CSP headers
- [ ] Configure CORS policies

### Performance Optimization
- [ ] Redis connection pooling
- [ ] Token cleanup jobs (expired tokens)
- [ ] Database query optimization
- [ ] Rate limit key expiration
- [ ] Session data compression

## 📈 Metrics & KPIs

### Security Metrics
- Failed login attempts per hour
- Account lockout rate
- Rate limit hit rate
- Token blacklist size
- Password reset frequency

### Performance Metrics
- Authentication response time (target: <200ms)
- Token validation time (target: <50ms)
- Redis operation latency (target: <10ms)
- Database query time (target: <100ms)

## 🔄 Next Steps

1. **Email Service Integration** (PR #004)
   - Verification email templates
   - Password reset emails
   - Security notification emails

2. **OAuth Integration** (PR #005)
   - Google OAuth provider
   - Apple Sign-In (optional)
   - Social profile linking

3. **Advanced Security** (PR #006)
   - Device fingerprinting
   - Suspicious activity detection
   - Geographic login monitoring
   - Two-factor authentication

---

**Status**: ✅ Complete  
**Version**: 2.0  
**Last Updated**: October 5, 2025  
**Next PR**: #004 - Email Service Integration