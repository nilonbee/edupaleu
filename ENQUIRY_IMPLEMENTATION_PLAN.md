# Enquiry Entity Implementation Plan

## 📋 Overview
This document outlines the plan for implementing an Enquiry system that serves as a lead management and conversion pipeline for applications.

## 🎯 Goals
1. Create an Enquiry entity to capture initial leads/interest
2. Build a full CRUD system similar to Applications
3. Enable conversion from Enquiry to Application (creating Student if needed)
4. Maintain existing Student/Application flow

---

## 🏗️ Architecture Decision: Student Entity

### ✅ RECOMMENDATION: **KEEP Student Entity**

**Reasoning:**
- **Student** represents a complete profile with full academic/professional data
- **Enquiry** is a lightweight lead capture (just contact info + CV)
- Natural progression: `Enquiry → Student → Application`
- Students can have multiple Applications (one-to-many relationship)
- Existing codebase heavily relies on Student entity

**Alternative Considered:**
- Removing Student would break existing applications
- Would require massive refactoring
- Student contains valuable structured data that Enquiries don't need initially

---

## 📊 Data Model Design

### Enquiry Schema (Prisma)

```prisma
model Enquiry {
  id              Int       @id @default(autoincrement())
  firstName       String    @db.VarChar(100)
  lastName        String    @db.VarChar(100)
  email           String    @db.VarChar(255)
  mobileNumber    String?   @db.VarChar(20)
  cvDocumentPath  String?   @db.VarChar(500)  // Path to uploaded CV
  
  // Follow-up tracking
  firstFollowUp   DateTime?
  secondFollowUp  DateTime?
  thirdFollowUp   DateTime?
  
  remarks         String?   @db.Text
  
  // Tracking
  createdBy       Int
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relationships
  createdByUser   User?     @relation("EnquiryCreatedBy", fields: [createdBy], references: [id])
  application     Application? // One enquiry can convert to one application
  
  @@index([createdBy])
  @@index([email])
  @@index([createdAt])
}

// Add to User model
enquiriesCreated  Enquiry[] @relation("EnquiryCreatedBy")

// Add to Application model (optional relationship)
enquiryId         Int?
enquiry           Enquiry?  @relation(fields: [enquiryId], references: [id])
```

---

## 🔄 Workflow Flow

### Current Flow:
```
[Manual Entry] → Student → Application
```

### New Flow:
```
Option 1: Enquiry → Convert → [Create Student] → Application
Option 2: [Direct Entry] → Student → Application (existing flow)
```

### Conversion Process:
1. User clicks "Create Application" on an Enquiry
2. System checks if Student exists with same email
   - **If exists:** Link Application to existing Student
   - **If not:** Create Student from Enquiry data + additional fields
3. Pre-populate Application form with Enquiry data
4. Link Application back to Enquiry (enquiryId field)

---

## 📁 File Structure

### Backend (Server)

```
server/
├── prisma/
│   └── schema.prisma (update with Enquiry model)
├── src/
│   ├── controllers/
│   │   └── enquiryController.ts (NEW)
│   ├── routes/
│   │   └── enquiryRoutes.ts (NEW)
│   └── utils/
│       └── enquiryToStudentConverter.ts (NEW)
└── src/index.ts (register enquiry routes)
```

### Frontend (Client)

```
client/src/
├── app/
│   ├── enquiries/
│   │   ├── page.tsx (UPDATE - main table)
│   │   ├── [id]/
│   │   │   ├── page.tsx (NEW - view enquiry)
│   │   │   └── edit/
│   │   │       └── page.tsx (NEW - edit enquiry)
│   │   └── new/
│   │       └── page.tsx (NEW - create enquiry)
├── app/(components)/
│   └── EnquiriesTable/
│       ├── index.tsx (NEW - similar to ApplicationsTable)
│       ├── ActionsMenu.tsx (NEW)
│       └── ConvertToApplicationModal.tsx (NEW)
├── state/
│   ├── enquiryApi.ts (NEW - RTK Query API)
│   └── enquirySlice.ts (NEW - Redux slice, optional)
└── types/
    └── enquiries.ts (NEW - TypeScript types)
```

---

## 🔌 API Endpoints

### Enquiry Routes

```typescript
GET    /api/enquiries           // List with filters, pagination, search
GET    /api/enquiries/:id       // Get single enquiry
POST   /api/enquiries           // Create enquiry
PUT    /api/enquiries/:id       // Update enquiry
DELETE /api/enquiries/:id       // Delete enquiry
POST   /api/enquiries/:id/convert // Convert to application
```

### Enquiry Controller Methods

```typescript
- getEnquiries(req, res)        // List with search/filter/pagination
- getEnquiry(req, res)          // Get single enquiry
- createEnquiry(req, res)       // Create new enquiry
- updateEnquiry(req, res)       // Update enquiry
- deleteEnquiry(req, res)       // Delete enquiry
- convertEnquiryToApplication(req, res) // Convert + create Student if needed
```

---

## 🎨 Frontend Components

### 1. EnquiriesTable Component
- Similar structure to ApplicationsTable
- Columns: Name, Email, Mobile, Follow-ups, Status, Created Date, Actions
- Actions: View, Edit, Convert to Application, Delete
- Filters: Search, Follow-up status, Date range

### 2. Create/Edit Enquiry Form
- Fields: firstName, lastName, email, mobileNumber, cvDocument (file upload)
- Follow-up date pickers (optional)
- Remarks (textarea)
- Use existing FormInput and Button components

### 3. Convert to Application Modal/Flow
- Confirm conversion
- Show what will happen:
  - Create Student (if email not exists)
  - Pre-fill Application form
- Redirect to `/applications/new` with enquiry data in query params or state

### 4. Follow-up Tracking
- Visual indicators for follow-up dates
- Color coding: Overdue, Due Soon, Completed
- Quick actions to mark follow-ups as done

---

## 📝 Implementation Steps

### Phase 1: Backend Foundation
1. ✅ Update Prisma schema with Enquiry model
2. ✅ Run migration: `npx prisma migrate dev --name add_enquiry_model`
3. ✅ Create enquiryController.ts with CRUD operations
4. ✅ Create enquiryRoutes.ts
5. ✅ Register routes in main server file
6. ✅ Create convertEnquiryToApplication utility

### Phase 2: Frontend API Layer
7. ✅ Create enquiryApi.ts (RTK Query)
8. ✅ Create enquiries.ts types
9. ✅ Test API integration

### Phase 3: Frontend Components
10. ✅ Create EnquiriesTable component
11. ✅ Create Create/Edit Enquiry pages
12. ✅ Create View Enquiry page
13. ✅ Create Convert to Application flow
14. ✅ Update enquiries/page.tsx to use new table

### Phase 4: Integration & Enhancement
15. ✅ Integrate conversion flow with Application creation
16. ✅ Add follow-up tracking UI
17. ✅ Update Sidebar navigation (if needed)
18. ✅ Add permissions/authorization
19. ✅ Testing & bug fixes

---

## 🔐 Considerations

### Data Migration
- If you have existing lead data, create migration script
- Map existing data to Enquiry model

### Permissions
- Who can create enquiries? (All authenticated users?)
- Who can convert enquiries? (Same as application creation?)
- Who can delete enquiries? (Admin only?)

### File Upload
- CV document upload (reuse existing S3 upload logic)
- File size limits
- Allowed file types (PDF, DOCX)

### Validation
- Email uniqueness (per user? or globally?)
- Mobile number format
- Required vs optional fields

---

## 🤔 Open Questions

1. **Should enquiries be user-specific or global?**
   - Recommendation: Show all, but filter by creator if needed

2. **Can one enquiry convert to multiple applications?**
   - Recommendation: One-to-one initially, can change later

3. **What happens to enquiry after conversion?**
   - Recommendation: Keep it, mark as "Converted" status

4. **Should we track enquiry status separately?**
   - Recommendation: Add status field (NEW, CONTACTED, FOLLOW_UP, CONVERTED, CLOSED)

---

## 📦 Benefits of This Approach

1. ✅ **Non-breaking**: Existing Student/Application flow remains intact
2. ✅ **Progressive**: Enquiries are lightweight, Students are comprehensive
3. ✅ **Flexible**: Can convert when ready, or create directly
4. ✅ **Traceable**: Link back to original enquiry for reporting
5. ✅ **Scalable**: Easy to add more enquiry-specific features later

---

## 🚨 Potential Issues & Solutions

### Issue 1: Duplicate Students
**Solution**: Check by email before creating Student during conversion

### Issue 2: Data Loss on Conversion
**Solution**: Keep enquiry record, link Application to it

### Issue 3: Follow-up Management
**Solution**: Add status field, create follow-up reminders feature later

---

## ✅ Next Steps

1. Review this plan
2. Confirm Student entity decision (KEEP)
3. Approve schema design
4. Start Phase 1 implementation

---

**Ready to proceed?** Let me know if you want any changes to this plan before I start implementing!

