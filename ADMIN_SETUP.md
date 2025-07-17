# Admin Setup Guide

## Security Notice
This application no longer uses hardcoded admin credentials for security reasons. Admin access must be configured through environment variables.

## Admin Configuration

### 1. Environment Variables
Add the following to your `.env.local` file:

```
ADMIN_EMAILS=your-admin@example.com,another-admin@example.com
```

### 2. Admin User Creation
Admin users must be created through the normal registration process:

1. Sign up through the application UI
2. Confirm email address
3. Add the email to the `ADMIN_EMAILS` environment variable
4. Restart the application

### 3. Verification
- Admin status is checked via the `isAdminEmail()` function
- Admin users can access service role operations when needed
- No hardcoded credentials exist in the codebase

## Security Best Practices
- Use strong, unique passwords for admin accounts
- Rotate admin credentials regularly
- Monitor admin access logs
- Keep the `ADMIN_EMAILS` environment variable secure
- Use separate admin emails for production and development

## Development Setup
For development, create a test admin account:
1. Register normally through the UI
2. Add the email to `ADMIN_EMAILS` in `.env.local`
3. Restart the dev server 