# Render Deployment Guide for EduPal Server

## Pre-Deployment Checklist

- [ ] All code pushed to GitHub (main branch)
- [ ] `.env` variables documented in `.env.example`
- [ ] Local tests passing with `npm run dev`
- [ ] TypeScript compiles without errors (`npm run build`)

## Deployment Steps

### 1. Create PostgreSQL Database on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Set database name: `edupaleu_db`
4. Choose region closest to your users
5. Copy the full connection string (you'll need this)

### 2. Create Web Service on Render
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. The `render.yaml` file in the root directory will automatically configure your service

**If you need to manually configure instead:**
- Name: `edupal-server`
- Environment: `Node`
- Region: Same as database
- Branch: `main`
- Root Directory: `server` (IMPORTANT: This tells Render where your server code is)
- Build Command: `npm install && npm run build && npm run migrate`
- Start Command: `npm start`

**Environment Variables:**
Copy from your `.env` file and update:
```
DATABASE_URL=postgresql://user:password@hostname:5432/edupaleu_db
JWT_SECRET=<generate-new-secure-secret>
JWT_LIFETIME=7d
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
PORT=8000
EMAIL_USER=<production-email>
EMAIL_PASS=<production-password>
```

### 3. Important Notes

**Why each script matters:**
- `npm install` - Installs all dependencies
- `npm run build` - Compiles TypeScript to JavaScript (required for production)
- `npm run migrate` - Applies any pending Prisma migrations to Render's database
- `npm start` - Starts the compiled Node application

**Local vs Production:**
- Local: `npm run dev` (uses ts-node for development with auto-reload)
- Production (Render): `npm start` (uses compiled JavaScript for performance)

### 4. Post-Deployment

After the service deploys successfully:
1. Test the API endpoints: `https://your-service-url.onrender.com/api/...`
2. Check logs in Render Dashboard if issues occur
3. Verify database connection in logs
4. Test email functionality

### 5. Troubleshooting

**Build Fails:**
- Check build logs in Render Dashboard
- Ensure all dependencies are in `package.json`
- Verify `npm run build` works locally first

**Database Connection Error:**
- Confirm DATABASE_URL is correct
- Ensure IP addresses are whitelisted (Render allows all by default)
- Check PostgreSQL database is in "Available" state

**Application Crashes:**
- Check logs in Render Dashboard
- Verify all environment variables are set
- Test locally with production NODE_ENV: `NODE_ENV=production npm run dev`

### 6. Seeding the Production Database (Optional)

To run seed data after first deployment:
1. In Render Dashboard, go to "Shell" tab
2. Run: `npm run seed`
3. Confirm seed data was inserted in database

## Updating After Deployment

When you push changes to `main` branch:
1. Render automatically redeploys
2. Build runs again: `npm install && npm run build && npm run migrate`
3. Application restarts with new code

No manual intervention needed!
