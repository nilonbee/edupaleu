# Enquiry Implementation Plan V2 - Simplified Architecture

## 🎯 Updated Proposal Discussion

Based on your feedback, here's the revised approach. Let's discuss before implementation.

---

## ✅ Your Proposed Changes (All Make Sense!)

### 1. **Follow-up Fields = Remarks (Strings, not dates)**
- `firstFollowUpRemarks` (String, optional)
- `secondFollowUpRemarks` (String, optional)  
- `thirdFollowUpRemarks` (String, optional)
- **Reasoning**: These are notes/observations from follow-up calls, not scheduled dates
- ✅ Makes sense!

### 2. **Remove Student Entity Completely**
- **Why it works:**
  - AcademicQualifications are already on Application (not Student)
  - Enquiry can hold basic contact info (firstName, lastName, email, mobile)
  - Application can store all other student details directly (dateOfBirth, passport, etc.)
- **Simpler architecture**: Enquiry → Application (no intermediate Student)
- ✅ Makes sense!

### 3. **Application Selection Uses Enquiry (not Student)**
- When creating Application, select from Enquiries
- One Enquiry can have multiple Applications (different universities/programs)
- ✅ Makes sense!

### 4. **Agent Field in Enquiry**
- Optional `agentId` field in Enquiry
- If enquiry came from an agent, Application table shows agent name
- Display as colored badge/tag
- ✅ Makes sense!

---

## 📊 Revised Data Model

### Enquiry Schema

```prisma
model Enquiry {
  id                    Int       @id @default(autoincrement())
  firstName             String    @db.VarChar(100)
  lastName              String    @db.VarChar(100)
  email                 String    @db.VarChar(255)
  mobileNumber          String?   @db.VarChar(20)
  cvDocumentPath        String?   @db.VarChar(500)
  
  // Follow-up remarks (notes, not dates)
  firstFollowUpRemarks  String?   @db.Text
  secondFollowUpRemarks String?   @db.Text
  thirdFollowUpRemarks  String?   @db.Text
  
  remarks               String?   @db.Text  // General remarks
  
  // Agent tracking
  agentId               Int?      // Optional - if enquiry came from agent
  
  // Tracking
  createdBy             Int
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relationships
  agent                 User?     @relation("EnquiryAgent", fields: [agentId], references: [id])
  createdByUser         User?     @relation("EnquiryCreatedBy", fields: [createdBy], references: [id])
  applications          Application[]  // One enquiry → many applications
  
  @@index([createdBy])
  @@index([email])
  @@index([agentId])
  @@index([createdAt])
}
```

### Updated Application Schema

```prisma
model Application {
  id                  Int       @id @default(autoincrement())
  applicationRef      String    @unique @db.VarChar(100)
  
  // CHANGED: enquiryId instead of studentId
  enquiryId           Int       // Required - must come from enquiry
  universityId        Int
  intendedProgram     String    @db.VarChar(255)
  intakeYear          Int
  intakeMonth         String    @db.VarChar(20)
  applicationStatusId Int?
  assignedAgentId     Int?
  
  // Student details stored directly on Application
  // (moved from Student model)
  dateOfBirth         DateTime?
  gender              Gender?
  nationality         String?   @db.VarChar(100)
  passportNumber      String?   @db.VarChar(50)
  displayPicture      String?
  passportExpiry      DateTime?
  address             String?
  city                String?   @db.VarChar(100)
  state               String?   @db.VarChar(100)
  zipCode             String?   @db.VarChar(20)
  emergencyContactName String?  @db.VarChar(200)
  emergencyContactPhone String? @db.VarChar(20)
  hasEnglishTest      Boolean   @default(false)
  englishTestType     EnglishTestType? @default(none)
  englishTestScore    String?   @db.VarChar(50)
  englishTestDate     DateTime?
  maritalStatus       String?   @db.VarChar(20)
  marriageCertificatePath String? @db.VarChar(500)
  
  applicationFee      Float     @default(0)
  feePaid             Boolean   @default(false)
  submissionDate      DateTime?
  decisionDate        DateTime?
  notes               String?
  createdBy           Int?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Relationships
  enquiry             Enquiry   @relation(fields: [enquiryId], references: [id], onDelete: Restrict)
  university          University @relation(fields: [universityId], references: [id], onDelete: Restrict)
  applicationStatus   ApplicationStatus? @relation(fields: [applicationStatusId], references: [id])
  assignedAgent       User?     @relation("ApplicationAssignedAgent", fields: [assignedAgentId], references: [id])
  createdByUser       User?     @relation("ApplicationCreatedBy", fields: [createdBy], references: [id])
  documents           ApplicationDocument[]
  communications      ApplicationCommunication[]
  intendedPrograms    IntendedProgram[]
  academicQualifications AcademicQualification[]  // Already exists
  
  @@index([enquiryId])
  @@index([universityId])
  @@index([applicationStatusId])
  @@index([assignedAgentId])
  @@index([createdBy])
}
```

### Update User Model

```prisma
model User {
  // ... existing fields ...
  
  enquiriesCreated    Enquiry[] @relation("EnquiryCreatedBy")
  enquiriesAsAgent    Enquiry[] @relation("EnquiryAgent")
  // ... other relations ...
}
```

---

## 🔄 New Workflow

### Current Flow (TO REMOVE):
```
[Select/Create Student] → Application
```

### New Flow:
```
1. Create Enquiry (firstName, lastName, email, mobile, CV, remarks)
2. Select Enquiry when creating Application
3. Application form pre-fills from Enquiry
4. Additional student details entered in Application (passport, DOB, etc.)
5. Multiple Applications can reference same Enquiry
```

### Application Creation Flow:
1. **Enquiry Selection Step** (replaces StudentSelection)
   - List all enquiries
   - Search/filter enquiries
   - Create new enquiry inline (or link to create page)

2. **Application Form Steps** (mostly same, but):
   - Student details step gets: firstName, lastName, email, mobile from Enquiry
   - User fills in remaining: DOB, passport, address, etc.
   - Academic qualifications (already on Application)
   - Documents, University, Programs (same as before)

---

## 🎨 UI Changes

### Enquiries Table
- Columns: Name, Email, Mobile, Agent (badge), Follow-ups Status, Created Date, Actions
- Actions: View, Edit, Create Application, Delete
- "Create Application" button → opens application form with enquiry pre-selected

### Applications Table
- **Agent Column** (NEW):
  - Show agent name if `enquiry.agentId` exists
  - Display as colored badge/tag
  - Color coding: e.g., blue badge, different colors per agent?
- Student Name: Shows from `enquiry.firstName + enquiry.lastName`

### Application Creation
- **Step 1 changed**: "Select Enquiry" instead of "Select Student"
- Pre-populate from Enquiry data
- Show enquiry details in sidebar/summary

---

## ⚠️ Important Considerations & Questions

### 1. **Migration Strategy**
**Question**: Do you have existing Student/Application data?
- If YES: Need migration script to:
  - Create Enquiries from existing Students
  - Update Applications to reference new Enquiries
  - Move student detail fields to Application
  
**If NO existing data**: Clean break, easier implementation

### 2. **Agent Display in Applications Table**
**Questions:**
- Agent color coding: 
  - Same color for all agents?
  - Different color per agent? (need agent color field)
  - Gradient theme color (cyan/blue)?
  
- Agent name display:
  - Full name: "John Smith"?
  - First name only: "John"?
  - Agent ID/code?

**Recommendation**: Use gradient theme color (cyan-400/blue-500) with agent's full name

### 3. **Enquiry Required Fields**
**Question**: Which fields are mandatory?
- firstName, lastName, email → Required?
- mobileNumber → Optional?
- CV → Optional?

**Recommendation**: 
- Required: firstName, lastName, email
- Optional: mobileNumber, CV, all follow-up remarks, agent

### 4. **Multiple Applications per Enquiry**
**Question**: How should this work?
- Same person applying to multiple universities → Multiple Applications, One Enquiry ✅
- Should we track "Application Count" in Enquiry?
- Show linked applications in Enquiry view?

**Recommendation**: 
- Show "Applications: 3" badge in Enquiries table
- Enquiry detail page shows list of linked applications

### 5. **Enquiry Status/Stage**
**Question**: Should we track enquiry progression?
- Status: NEW, CONTACTED, FOLLOW_UP, CONVERTED, CLOSED?
- Or just use "Has Applications" as indicator?

**Recommendation**: 
- Start simple: Just track if enquiry has applications
- Can add status later if needed

### 6. **Application Form - Student Details Step**
**Question**: What fields go in Application form?
- From Enquiry (read-only): firstName, lastName, email, mobile
- Editable in Application: DOB, gender, passport, address, etc.
- Or allow editing all fields in Application?

**Recommendation**: 
- Display Enquiry data as "Contact Info" (read-only section)
- Separate section for "Student Details" (editable: DOB, passport, etc.)

### 7. **Search & Filter**
**Enquiries Table:**
- Search by: Name, Email, Mobile
- Filter by: Has Applications, Agent, Date Range

**Applications Table:**
- Search by: Application Ref, Enquiry Name/Email, University
- Filter by: Status, Agent (from Enquiry), University

---

## 📋 Implementation Checklist

### Backend (Server)
- [ ] Update Prisma schema: Remove Student model
- [ ] Update Prisma schema: Add Enquiry model
- [ ] Update Prisma schema: Change Application.studentId → Application.enquiryId
- [ ] Add student detail fields to Application model
- [ ] Create migration script (if existing data)
- [ ] Create enquiryController.ts (CRUD + convert to application)
- [ ] Create enquiryRoutes.ts
- [ ] Update applicationController.ts (use enquiryId instead of studentId)
- [ ] Update all Application queries to include enquiry.agent
- [ ] Test API endpoints

### Frontend (Client)
- [ ] Create enquiryApi.ts (RTK Query)
- [ ] Create enquiries.ts types
- [ ] Create EnquiriesTable component (with agent badge)
- [ ] Update ApplicationsTable (show agent from enquiry)
- [ ] Create Enquiry CRUD pages (list, create, edit, view)
- [ ] Update Application creation: Replace StudentSelection with EnquirySelection
- [ ] Update Application form: Pre-fill from Enquiry
- [ ] Update WizardForm steps
- [ ] Update all Student references → Enquiry
- [ ] Test full flow

---

## 🎨 Agent Badge Design Suggestion

```tsx
// In ApplicationsTable
{enquiry?.agent && (
  <Chip
    label={`${enquiry.agent.firstName} ${enquiry.agent.lastName}`}
    className="bg-gradient-theme-button text-white text-xs"
    size="small"
  />
)}
```

Or with different colors per agent:
- Use agent's ID to generate consistent color
- Or store agent color preference in User model

---

## ✅ Summary of Benefits

1. **Simpler Architecture**: Enquiry → Application (no Student intermediate)
2. **Clearer Flow**: Lead capture (Enquiry) → Full application (Application)
3. **Agent Tracking**: Know which agent brought in the enquiry
4. **Flexible**: One enquiry can have multiple applications
5. **Better Reporting**: Track which agents generate most applications
6. **Follow-up Notes**: Capture conversation notes, not just dates

---

## ❓ Questions for You

1. **Existing Data**: Do you have Students/Applications already? (affects migration)
2. **Agent Colors**: Same color for all, or different per agent?
3. **Required Fields**: Confirm which Enquiry fields are mandatory?
4. **Application Editing**: Can user edit firstName/lastName in Application form, or locked from Enquiry?
5. **Agent Assignment**: Can user change agent after enquiry created, or locked?
6. **Follow-up Dates**: Do you want separate date fields for when follow-ups happened, or just remarks?

---

## 🚀 Ready to Proceed?

Once you confirm:
1. Agent badge color approach
2. Required vs optional fields
3. Existing data migration needs
4. Any other preferences

I'll start implementation! 🎯

