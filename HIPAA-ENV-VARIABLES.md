# HIPAA Compliance Environment Variables

This document outlines the required environment variables for HIPAA compliance in the For Your Health application.

## Required Environment Variables

Add these to your `.env.local` file:

```
# Existing variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here  # Must be at least 32 characters
DATABASE_URL=file:./dev.db
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_MODEL=claude-3-haiku-20240307

# HIPAA Compliance
ENCRYPTION_KEY=your-32-character-encryption-key  # For field-level encryption
SESSION_TIMEOUT_MINUTES=15                       # HIPAA-compliant session timeout
IDLE_TIMEOUT_MINUTES=5                           # Privacy overlay timeout
AUDIT_RETENTION_DAYS=2555                        # 7 years for HIPAA
ENABLE_HIPAA_MODE=true                           # Enable all HIPAA features
```

## Security Guidelines

1. **ENCRYPTION_KEY**
   - Must be at least 32 characters
   - Store securely, never commit to version control
   - Rotate periodically according to your security policy

2. **SESSION_TIMEOUT_MINUTES**
   - HIPAA best practice is 15 minutes
   - Adjust based on risk assessment
   - Requires re-authentication after timeout

3. **AUDIT_RETENTION_DAYS**
   - HIPAA requires retention of audit logs for 6 years
   - We use 7 years (2555 days) as a safe default

## Implementation Details

The application uses these variables in the following ways:

- **ENCRYPTION_KEY**: Used for field-level encryption of PHI in the database
- **SESSION_TIMEOUT_MINUTES**: Controls automatic session termination
- **IDLE_TIMEOUT_MINUTES**: Controls when the privacy overlay appears
- **ENABLE_HIPAA_MODE**: Enables all HIPAA-compliant features including:
  - Audit logging
  - Privacy overlay
  - Enhanced authentication
  - Data encryption
  - Watermarking on exports
