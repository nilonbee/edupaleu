# Migration Instructions: Move Academic Qualifications to Application

## What Changed
Academic qualifications are now linked to `Application` instead of `Student`. This makes them application-specific, consistent with `IntendedProgram` and `ApplicationDocument`.

## Steps to Apply Migration

### 1. Stop the Server
Make sure the server is **stopped** before running migrations to avoid file lock issues.

### 2. Generate Prisma Client
```bash
cd server
yarn prisma generate
```

### 3. Apply the Migration

**Option A: If you want to keep existing data (Recommended for production)**
```bash
yarn prisma migrate deploy
```
This will apply the manual migration file that migrates existing qualifications to their first application.

**Option B: If you're okay with losing data (Development only)**
```bash
yarn prisma migrate reset
```
This will reset the database and apply all migrations from scratch.

**Option C: Mark migration as applied (if you've manually applied it)**
```bash
yarn prisma migrate resolve --applied 20250104120000_move_academic_qualifications_to_application
```

### 4. Restart the Server
After migration is complete, restart your server.

## What the Migration Does

1. Drops old foreign key constraint on `studentId`
2. Adds new `applicationId` column
3. Migrates existing data by associating qualifications with the student's first application
4. Removes orphaned qualifications (if any student has qualifications but no applications)
5. Makes `applicationId` NOT NULL
6. Drops old `studentId` column
7. Creates new foreign key and index on `applicationId`

## Verification

After migration, verify:
- Academic qualifications are linked to applications
- Old `studentId` column is removed
- New `applicationId` foreign key exists
- API responses include `academicQualifications` at application level

## Rollback (if needed)

If you need to rollback, you'll need to manually reverse the migration:
1. Re-add `studentId` column
2. Migrate data back from `applicationId` to `studentId`
3. Drop `applicationId` column
4. Recreate old foreign key constraint

