# Authentication Integration Setup Guide

This document outlines the authentication workflow that has been integrated from the `final` folder into your edupal project.

## What Has Been Integrated

### Server-Side (TypeScript/Prisma)
1. **Prisma Schema Updates**
   - Added authentication fields to User model:
     - `verificationToken` - for email verification
     - `isVerified` - email verification status
     - `verified` - verification timestamp
     - `passwordToken` - for password reset
     - `passwordTokenExpirationDate` - password reset expiration
   - Created `AuthToken` model for refresh token management

2. **Error Handling**
   - Custom error classes (BadRequestError, UnauthenticatedError, UnauthorizedError, NotFoundError)
   - Error handler middleware

3. **Authentication Controller**
   - `register` - User registration with email verification
   - `login` - User login with JWT tokens
   - `logout` - User logout
   - `verifyEmail` - Email verification
   - `forgotPassword` - Password reset request
   - `resetPassword` - Password reset

4. **Middleware**
   - `authenticateUser` - JWT token validation and refresh
   - `authorizePermissions` - Role-based access control

5. **Utilities**
   - JWT token creation and validation
   - Email sending (verification and password reset)
   - Password hashing
   - Token user creation

### Client-Side (Next.js)
1. **Auth Context**
   - Global authentication state management
   - User session management
   - Auto-fetch user on mount

2. **Authentication Pages**
   - `/login` - User login
   - `/register` - User registration
   - `/forgot-password` - Password reset request
   - `/reset-password` - Password reset form
   - `/verify-email` - Email verification

3. **Protected Routes**
   - ProtectedRoute component for route protection
   - Dashboard wrapper updated to handle auth routes

## Setup Instructions

### 1. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 2. Database Migration

After the Prisma schema changes, you need to:
1. Generate a migration
2. Apply the migration
3. Regenerate Prisma client

```bash
cd server
npx prisma migrate dev --name add_authentication_fields
npx prisma generate
```

### 3. Environment Variables

Create/update `.env` files:

**Server `.env`:**
```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_jwt_secret_key_here"
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Email Configuration (for development, use Ethereal Email)
EMAIL_HOST="smtp.ethereal.email"
EMAIL_PORT=587
EMAIL_USER="your_ethereal_email"
EMAIL_PASS="your_ethereal_password"
EMAIL_FROM="Edupal <noreply@edupal.com>"
```

**Client `.env.local`:**
```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
```

### 4. Email Configuration

For development, you can use [Ethereal Email](https://ethereal.email):
1. Visit https://ethereal.email
2. Create a test account
3. Update the email credentials in `server/src/utils/nodemailerConfig.ts` or use environment variables

For production, configure your actual email provider (Gmail, SendGrid, etc.) in the nodemailer config.

### 5. Run the Application

**Server:**
```bash
cd server
npm run dev
```

**Client:**
```bash
cd client
npm run dev
```

## API Endpoints

### Authentication Routes (`/api/v1/auth`)

- `POST /api/v1/auth/register` - Register new user
  - Body: `{ first_name, last_name, email, password }`
  
- `POST /api/v1/auth/login` - User login
  - Body: `{ email, password }`
  - Returns: `{ user: { name, userId, role } }`
  - Sets httpOnly cookies: `accessToken`, `refreshToken`

- `DELETE /api/v1/auth/logout` - User logout
  - Requires authentication
  - Clears tokens

- `POST /api/v1/auth/verify-email` - Verify email
  - Body: `{ verificationToken, email }`

- `POST /api/v1/auth/forgot-password` - Request password reset
  - Body: `{ email }`

- `POST /api/v1/auth/reset-password` - Reset password
  - Body: `{ token, email, password }`

### User Routes (`/api/v1/users`)

- `GET /api/v1/users/showMe` - Get current user
  - Requires authentication
  - Returns: `{ user: { name, userId, role } }`

## Authentication Flow

1. **Registration:**
   - User registers → receives verification email
   - User clicks verification link → email verified
   - User can now login

2. **Login:**
   - User provides email/password
   - Server validates credentials
   - Server issues JWT tokens (accessToken + refreshToken)
   - Tokens stored as httpOnly cookies

3. **Protected Routes:**
   - Middleware checks for accessToken
   - If expired, checks refreshToken
   - If refreshToken valid, issues new accessToken
   - User object attached to request

4. **Password Reset:**
   - User requests password reset
   - Receives email with reset link
   - Clicks link → enters new password
   - Password updated

## Features

- ✅ JWT-based authentication with refresh tokens
- ✅ Email verification workflow
- ✅ Password reset functionality
- ✅ Role-based access control
- ✅ HttpOnly cookies for secure token storage
- ✅ Automatic token refresh
- ✅ TypeScript support
- ✅ Prisma ORM integration
- ✅ Next.js 14 App Router compatible

## Notes

- The first registered user automatically becomes an admin
- Tokens are stored in httpOnly cookies for security
- Refresh tokens are validated against the database
- Email verification is required before login
- Password reset tokens expire after 10 minutes

## Troubleshooting

1. **Prisma Client Errors:**
   - Run `npx prisma generate` after schema changes

2. **Email Not Sending:**
   - Check email configuration in `.env`
   - For development, use Ethereal Email

3. **CORS Issues:**
   - Ensure `FRONTEND_URL` matches your client URL
   - Check CORS configuration in `server/src/index.ts`

4. **Cookie Issues:**
   - Ensure `withCredentials: true` in axios config
   - Check cookie domain/path settings

