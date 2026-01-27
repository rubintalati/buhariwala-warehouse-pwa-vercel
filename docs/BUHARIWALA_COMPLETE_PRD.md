# PRODUCT REQUIREMENTS DOCUMENT
## Buhariwala Logistics - Movers & Packers Inventory Management System
### Phase 1: MVP - Mobile-First PWA

**Version:** 1.0  
**Date:** January 9, 2026  
**Author:** Development Team

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Features & User Stories](#4-core-features--user-stories)
5. [Data Model & Database Schema](#5-data-model--database-schema)
6. [Technical Architecture](#6-technical-architecture)
7. [UI/UX Specifications](#7-uiux-specifications)
8. [API Endpoints](#8-api-endpoints)
9. [Development Roadmap](#9-development-roadmap)
10. [Operating Costs](#10-operating-costs)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Vision

Buhariwala Logistics requires a modern, mobile-first Progressive Web Application (PWA) to digitize and streamline their household moving and packing operations. The system will enable field staff to capture item photos, leverage AI for automatic item identification, manage complex multi-location moves, track warehouse storage, and generate professional branded PDFs for clients.

### 1.2 Key Objectives

- Replace manual paper-based inventory tracking with digital system
- Enable photo documentation at multiple stages (quote, packing, loading, unloading)
- Leverage Gemini AI for automatic item identification (reducing data entry time by 60-70%)
- Support complex logistics: multiple pickups, multiple deliveries, warehouse storage lots
- Generate professional branded PDFs for client communication
- Implement role-based access (Super Admin, Checker, Maker) with approval workflows
- Track packing materials and reusable boxes
- Keep costs minimal using free tiers (Supabase, Gemini, Vercel/Netlify)

### 1.3 Success Metrics

| Metric | Target |
|--------|--------|
| Time to create inventory per job | 50% reduction (from manual) |
| AI item identification accuracy | 80% (MVP), 95% (3 months) |
| Customer dispute reduction | 70% (photo documentation) |
| Staff adoption rate | 100% within 2 weeks |
| PDF generation time | <30 seconds per job |

---

## 2. PRODUCT OVERVIEW

### 2.1 Product Type

**Progressive Web Application (PWA)**
- Mobile-first responsive design (optimized for smartphones/tablets)
- Works in mobile browsers (Chrome, Safari) - no app store download required
- Can be 'installed' to home screen for app-like experience
- Online-only for MVP (offline capability deferred to Phase 2: Event Management)

### 2.2 Technology Stack

| Component | Technology | Cost |
|-----------|------------|------|
| Frontend | React + Vite + TailwindCSS | Free |
| Backend/Database | Supabase (PostgreSQL) | Free tier (upgrade to Pro ₹2K/month when needed) |
| Authentication | Supabase Auth | Included |
| Image Storage | Supabase Storage | Free (1GB), then Pro |
| AI Image Recognition | Google Gemini 1.5 Flash API | Free (45K images/month) |
| PDF Generation | jsPDF / react-pdf | Free |
| Hosting | Vercel / Netlify | Free tier |
| Email Delivery | Resend.com / SendGrid | Free (3K emails/month) |

### 2.3 Key Design Principles

1. **Mobile-First:** Every screen designed for 375px mobile width first, then desktop
2. **Speed:** <2 second page loads, instant camera capture
3. **Simplicity:** Maximum 3 taps to complete any action
4. **Predictive:** AI-powered autocomplete for all text fields
5. **Forgiving:** Editable everything, no data loss
6. **Visual:** Photos central to every workflow

---

## 3. USER ROLES & PERMISSIONS

### 3.1 Role Hierarchy

```
Super Admin (Owner)
    ↓
Checker (Supervisor/Warehouse Manager)
    ↓
Maker (Field Staff/Packers)
```

### 3.2 Role: Maker (Data Entry Staff)

**Primary Users:** Field staff, packers, surveyors

**Core Responsibilities:**
- Create new moving jobs
- Capture item photos at any stage (quote/packing/loading/unloading)
- Add/edit item details (with AI assistance)
- Manage multiple pickup/delivery locations
- Assign warehouse lots
- Request approval for job completion

**Permissions Matrix:**

| Action | Allowed |
|--------|---------|
| Create jobs (status: DRAFT) | ✅ Yes |
| Edit own DRAFT jobs | ✅ Yes |
| Edit approved jobs | ❌ No |
| Delete jobs | ❌ No |
| Submit for approval | ✅ Yes |
| Send PDF to client | ❌ No (Checker only) |
| View analytics | ❌ No |

**Job Status Flow for Makers:**
```
Create → DRAFT → Edit/Add Items → Submit for Approval → PENDING_REVIEW
```

### 3.3 Role: Checker (Verification Staff)

**Primary Users:** Supervisors, warehouse managers, quality control staff

**Core Responsibilities:**
- Review jobs submitted by Makers
- Approve, reject, or request modifications
- Edit any job at any stage (origination/warehouse/delivery)
- Create new jobs directly (bypassing draft status)
- Generate and send PDFs to clients
- Update job status (in-progress, completed, delivered)
- Manage warehouse lot assignments

**Permissions Matrix:**

| Action | Allowed |
|--------|---------|
| All Maker permissions | ✅ Yes |
| Approve/Reject jobs | ✅ Yes |
| Edit ANY job (any status) | ✅ Yes |
| Send PDF to client | ✅ Yes (multiple times) |
| Delete jobs | ❌ No (Super Admin only) |
| View analytics | ❌ No (Super Admin only) |
| Modify approved jobs | ✅ Yes |
| Bypass approval workflow | ✅ Yes (direct APPROVED status) |

**Job Status Flow for Checkers:**
```
Can create → APPROVED (skip DRAFT/PENDING)
OR
Review PENDING → APPROVED / REJECTED / REQUEST_CHANGES
```

**Verification Stages:**
Checkers can verify at any stage:
1. **Origination:** Before/during pickup
2. **Warehouse:** During storage
3. **Delivery:** During/after delivery

### 3.4 Role: Super Admin (Owner)

**Primary Users:** Business owners, top management

**Core Responsibilities:**
- All Checker permissions
- Delete jobs permanently
- Manage users (create, edit, deactivate)
- Assign roles
- View comprehensive analytics
- Configure system settings
- Access audit logs
- Manage warehouse locations
- Configure packing materials

**Permissions Matrix:**

| Action | Allowed |
|--------|---------|
| All Checker permissions | ✅ Yes |
| Delete jobs permanently | ✅ Yes |
| Create/edit/delete users | ✅ Yes |
| Assign user roles | ✅ Yes |
| View analytics dashboard | ✅ Yes |
| Configure system settings | ✅ Yes |
| View audit logs | ✅ Yes |
| Manage warehouses | ✅ Yes |
| Configure packing materials | ✅ Yes |

---

## 4. CORE FEATURES & USER STORIES

### 4.1 Feature: Job Creation & Management

#### User Story 1: Create New Moving Job
**As a** Maker  
**I want to** create a new moving job with client details  
**So that** I can start documenting the move

**Acceptance Criteria:**
- ✅ Form with autocomplete for client name (from previous jobs)
- ✅ Auto-generate unique Job ID (format: BL-2026-0001)
- ✅ Multiple consignor addresses (pickup locations)
- ✅ Multiple consignee addresses (delivery locations)
- ✅ Date picker for move date
- ✅ Optional truck/vehicle number with autocomplete
- ✅ Job saved as DRAFT automatically
- ✅ Can save partial information and continue later

**UI Flow:**
```
Home → "New Job" button → Job Details Form → Save as DRAFT
```

#### User Story 2: Add Items with Photo Capture (Single or Multiple)
**As a** Maker  
**I want to** capture one or multiple photos and have them automatically identified  
**So that** I can quickly document inventory without typing

**Acceptance Criteria:**
- ✅ Single entry point: "Add Items" button
- ✅ User chooses: Take Photo(s) | Select from Gallery | Manual Entry (No Photo)
- ✅ Can capture/select 1-50 photos in single session
- ✅ Each photo auto-compressed to 200 KB
- ✅ All photos processed simultaneously by Gemini API
- ✅ Processing queue shows progress (e.g., "Processing 3 of 15...")
- ✅ Results appear as editable item cards as they complete
- ✅ AI suggestion displayed with confidence % for each item
- ✅ User can edit/override any AI suggestion
- ✅ All fields editable with predictive text
- ✅ Can delete any item from the batch before saving
- ✅ "Save All" button saves all reviewed items at once
- ✅ Can skip photos entirely and go straight to manual entry

**AI Response Format (per photo):**
```json
{
  "item_name": "3-Seater Fabric Sofa",
  "category": "Furniture - Living Room",
  "material": "Fabric",
  "color": "Beige",
  "condition": "Good",
  "estimated_dimensions": "7ft x 3ft x 3ft",
  "special_notes": "Visible wear on left armrest",
  "confidence": 0.89
}
```

**UI Flow:**
```
Job Details → "Add Items" → Choose Method:
                                ├─ "Take Photo(s)" → Camera → Capture 1-50 photos → Processing Queue → Review/Edit All → Save All
                                ├─ "Select from Gallery" → Pick 1-50 photos → Processing Queue → Review/Edit All → Save All
                                └─ "Manual Entry" → Form → Save
```

**Implementation Notes:**
- If user captures 1 photo: Shows single item review screen immediately after processing
- If user captures 2+ photos: Shows scrollable list of item cards, each editable independently
- Processing happens in parallel (all photos sent to Gemini simultaneously)
- User can start editing items while remaining photos are still processing
- "Take another photo" button available at any time to add more to current batch

**As a** Maker  
**I want to** manually enter items without photos  
**So that** I can document items when photos aren't possible

**Acceptance Criteria:**
- ✅ Skip photo step entirely (select "Manual Entry" from Add Items menu)
- ✅ All fields with predictive autocomplete
- ✅ Recently used items suggested first
- ✅ Can duplicate previous item (copy all fields)
- ✅ Faster for standardized items (boxes, crates)

**UI Flow:**
```
Job Details → "Add Items" → "Manual Entry" → Form → Save
```

### 4.2 Feature: Multi-Location Logistics

#### User Story 4: Multiple Pickup Locations
**As a** Checker  
**I want to** assign items to different pickup addresses  
**So that** I can handle jobs with multiple origin points

**Acceptance Criteria:**
- ✅ Can add unlimited pickup addresses per job
- ✅ Each address has: Name, Full Address, Contact, Pickup Date
- ✅ Assign items to specific pickup location
- ✅ Generate separate PDFs per pickup location (optional)
- ✅ Dashboard shows items grouped by pickup location

**Example Scenario:**
```
Job #BL-2026-0045
├─ Pickup 1: Client Home (Mumbai, Andheri) - 40 items
├─ Pickup 2: Client Office (Mumbai, BKC) - 15 items
└─ Pickup 3: Parent's House (Mumbai, Bandra) - 10 items
→ Deliver all to: Bangalore apartment
```

#### User Story 5: Multiple Delivery Locations
**As a** Checker  
**I want to** assign items to different delivery addresses  
**So that** I can split inventory across destinations

**Acceptance Criteria:**
- ✅ Can add unlimited delivery addresses per job
- ✅ Each address has: Name, Full Address, Contact, Delivery Date
- ✅ Assign items to specific delivery location
- ✅ Track partial deliveries
- ✅ Generate separate PDFs per delivery location

**Example Scenario:**
```
Job #BL-2026-0046
Pickup: Client Home (Delhi) - 80 items
├─ Delivery 1: Son's Apartment (Pune) - 40 items
├─ Delivery 2: Daughter's Apartment (Bangalore) - 30 items
└─ Delivery 3: Storage Unit (Delhi) - 10 items
```

#### User Story 6: Warehouse Storage (Lot Assignment)
**As a** Checker  
**I want to** assign items to warehouse lots for temporary storage  
**So that** I can track items not immediately delivered

**Acceptance Criteria:**
- ✅ Create warehouse lots (format: LOT-2026-001)
- ✅ Assign client to one or more lots
- ✅ Track lot: Date In, Date Out, Location, Status
- ✅ Items can be assigned to lot instead of delivery address
- ✅ Later reassign from lot to delivery address
- ✅ Multiple lots per client supported
- ✅ Lot search by client name or lot number

**Lot Lifecycle:**
```
Items picked up → Assigned to LOT-2026-001 → Stored in Warehouse A, Section 3
→ (weeks later) → Reassigned to Delivery Address → Lot marked complete
```

**Data Structure:**
```
Job #BL-2026-0050
Pickup: Client Home
├─ Item 1-30: → Delivery 1 (immediate)
├─ Item 31-50: → LOT-2026-005 (Warehouse A, Sec 2)
└─ Item 51-60: → LOT-2026-006 (Warehouse B, Sec 1)

Later, from LOT-2026-005:
├─ Item 31-40: → Delivery 2 (Week 3)
└─ Item 41-50: → Still in lot
```

### 4.3 Feature: Item Data Management

#### Complete Item Schema:
```
{
  "package_id": "BL-2026-0045-ITM-001",  // Auto-generated
  "client_name": "Rajesh Kumar",           // From job
  "consignor_name": "Rajesh Kumar",
  "consignor_addresses": [
    {
      "address_id": 1,
      "name": "Home",
      "full_address": "123 Andheri West, Mumbai 400053",
      "contact": "+91 9876543210",
      "pickup_date": "2026-01-15"
    }
  ],
  "consignee_addresses": [
    {
      "address_id": 1,
      "name": "New Apartment",
      "full_address": "456 Koramangala, Bangalore 560095",
      "contact": "+91 9876543210",
      "delivery_date": "2026-01-20"
    }
  ],
  "assigned_pickup": 1,        // Which pickup address
  "assigned_delivery": 1,      // Which delivery OR lot
  "delivery_type": "address",  // "address" OR "lot"
  "lot_number": null,          // If delivery_type = "lot"
  
  "date_of_entry": "2026-01-10T10:30:00Z",
  "description_of_goods": "3-Seater Fabric Sofa",
  "dimensions": "7ft x 3ft x 3ft",  // Optional
  "quantity": 1,
  "weight_volume": "50 kg",  // Optional
  "value_of_goods": 25000,   // Optional (₹)
  "gst_taxes": 4500,         // Optional
  "origin": "Mumbai",
  "destination": "Bangalore",
  "truck_vehicle_no": "MH-01-AB-1234",  // Optional
  "special_notes": "Pre-existing scratch on right armrest",
  
  "photos": [
    {
      "url": "https://supabase.../photo1.jpg",
      "thumbnail_url": "https://supabase.../photo1_thumb.jpg",
      "stage": "packing",  // quote/packing/loading/unloading
      "uploaded_at": "2026-01-10T10:35:00Z",
      "uploaded_by": "maker_user_id_123"
    }
  ],
  
  "ai_identification": {
    "suggestion": "3-Seater Fabric Sofa",
    "confidence": 0.89,
    "was_edited": true,
    "original_suggestion": "Couch"
  },
  
  "status": "pending_approval",
  "created_by": "maker_user_id_123",
  "approved_by": null,
  "created_at": "2026-01-10T10:30:00Z",
  "updated_at": "2026-01-10T10:35:00Z"
}
```

#### User Story 7: Predictive Text for All Fields
**As a** Maker  
**I want** autocomplete suggestions based on previous entries  
**So that** I can enter data faster

**How It Works:**
1. **Trigger:** User types 2+ characters in any text field
2. **Search:** Query Supabase for top 10 matches based on what's typed
3. **Debounce:** Wait 300ms after last keystroke before searching (prevents excessive queries)
4. **Match Logic:** Case-insensitive substring match, prioritizing:
   - Exact prefix matches first (e.g., "sof" matches "Sofa" before "3-seater sofa")
   - Most recently used items
   - Most frequently used items
5. **Display:** Dropdown appears with max 10 suggestions
6. **Selection:** Click or press TAB/Enter to autocomplete
7. **Continue typing:** User can ignore suggestions and keep typing

**Example Flow:**
```
User types: "Di"
→ Debounce 300ms
→ Query: SELECT DISTINCT description FROM items 
         WHERE description ILIKE '%Di%' 
         ORDER BY created_at DESC 
         LIMIT 10
→ Results: ["Dining Table", "Dining Chair", "Dishwasher", "Digital Clock"]
→ Display dropdown
→ User types "Din"
→ Debounce 300ms
→ Query updates: WHERE description ILIKE '%Din%'
→ Results: ["Dining Table", "Dining Chair"]
→ User presses TAB
→ "Dining Table" autocompletes into field
```

**Autocomplete Fields:**
- **Client Name:** Search previous job client names (ILIKE '%{input}%')
- **Description of Goods:** Search all previous item descriptions (most recent first)
- **Dimensions:** Common sizes from previous entries + standard suggestions (2x2x2, 3x3x3, 4x2x2, 6x3x3, 7x3x3)
- **Truck Number:** Search previous truck numbers used
- **Special Notes:** Common phrases from previous entries:
  - "Pre-existing scratch on [location]"
  - "Good condition"
  - "Minor wear and tear"
  - "Excellent condition"
  - "Damaged [part]"
- **Material:** Common materials (Wood, Metal, Plastic, Fabric, Leather, Glass)
- **Color:** Common colors with fuzzy matching
- **Origin/Destination:** Cities from all previous jobs

**Implementation (Supabase Function):**
```sql
CREATE OR REPLACE FUNCTION get_autocomplete_suggestions(
  field_name TEXT,
  search_term TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (suggestion TEXT, frequency BIGINT) AS $$
BEGIN
  CASE field_name
    WHEN 'description' THEN
      RETURN QUERY
      SELECT DISTINCT description, COUNT(*) as freq
      FROM items
      WHERE description ILIKE '%' || search_term || '%'
      GROUP BY description
      ORDER BY 
        CASE WHEN description ILIKE search_term || '%' THEN 0 ELSE 1 END,
        freq DESC,
        description
      LIMIT limit_count;
    
    WHEN 'client_name' THEN
      RETURN QUERY
      SELECT DISTINCT client_name, COUNT(*) as freq
      FROM jobs
      WHERE client_name ILIKE '%' || search_term || '%'
      GROUP BY client_name
      ORDER BY freq DESC, client_name
      LIMIT limit_count;
    
    -- ... similar for other fields
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

**Frontend Implementation (React):**
```jsx
import { useDebounce } from '@/hooks/useDebounce';

function AutocompleteInput({ field, value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const debouncedValue = useDebounce(value, 300); // 300ms delay

  useEffect(() => {
    if (debouncedValue.length >= 2) {
      supabase
        .rpc('get_autocomplete_suggestions', {
          field_name: field,
          search_term: debouncedValue
        })
        .then(({ data }) => setSuggestions(data));
    } else {
      setSuggestions([]);
    }
  }, [debouncedValue]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded"
      />
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border rounded shadow-lg mt-1">
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                onChange(item.suggestion);
                setSuggestions([]);
              }}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
            >
              {item.suggestion}
              <span className="text-gray-400 text-sm ml-2">
                (used {item.frequency}x)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Performance Considerations:**
- Debouncing prevents excessive database queries
- Limit to 10 suggestions keeps UI fast
- Index on commonly searched columns (description, client_name)
- Cache recent searches in browser for 5 minutes
- Fallback to local filtering if database is slow

### 4.4 Feature: Approval Workflow

#### User Story 8: Submit Job for Approval
**As a** Maker  
**I want to** submit completed job for review  
**So that** Checker can verify before client receives PDF

**Acceptance Criteria:**
- ✅ Button only enabled when job has ≥1 item
- ✅ Status changes: DRAFT → PENDING_REVIEW
- ✅ Maker cannot edit after submission
- ✅ Notification sent to all Checkers
- ✅ Job appears in Checker's review queue

#### User Story 9: Review and Approve/Reject
**As a** Checker  
**I want to** review submitted jobs and approve or reject  
**So that** only verified data reaches clients

**Acceptance Criteria:**
- ✅ Review queue shows all PENDING_REVIEW jobs
- ✅ Can view full job details and all photos
- ✅ Three actions: APPROVE / REJECT / REQUEST CHANGES
- ✅ If APPROVE: Status → APPROVED, Maker notified
- ✅ If REJECT: Status → DRAFT, Maker can edit, reason required
- ✅ If REQUEST CHANGES: Status → DRAFT, comment added, Maker notified
- ✅ Checker can edit directly instead of rejecting

**UI Flow:**
```
Checker Dashboard → Review Queue → Select Job → View Details
→ [Approve] [Request Changes] [Reject]
```

### 4.5 Feature: PDF Generation

#### User Story 10: Generate Professional Client PDF
**As a** Checker  
**I want to** generate branded PDF with all items and photos  
**So that** client has complete documented inventory

**PDF Contents:**
1. **Cover Page:**
   - Buhariwala logo and branding
   - Job ID and Date
   - Client name and contact

2. **Job Summary:**
   - Total items count
   - Pickup addresses (with item counts)
   - Delivery addresses (with item counts)
   - Move date(s)
   - Truck details

3. **Item List (with photos):**
   - Package ID
   - Description
   - Dimensions, Weight/Volume
   - Value, Quantity
   - Photos (thumbnails)
   - Special notes (if any)
   - Grouped by pickup/delivery location

4. **Packing Materials Summary:**
   - Boxes used (small/medium/large)
   - Bubble wrap, tape, etc.

5. **Terms & Conditions:**
   - Standard disclaimer
   - Insurance information

6. **Signature Section:**
   - Client acknowledgment
   - Date and signature line

**Acceptance Criteria:**
- ✅ PDF generates in <30 seconds
- ✅ Photos compressed but readable
- ✅ Professional branding throughout
- ✅ Can regenerate PDF anytime (updated data)
- ✅ PDF saved to Supabase Storage
- ✅ Can send to multiple email addresses
- ✅ Can download directly to device

**UI Flow:**
```
Job Details → "Generate PDF" → Preview → "Send to Client" → Enter Email(s) → Send
```

#### User Story 11: Send PDF Multiple Times
**As a** Checker  
**I want to** send updated PDF to client multiple times  
**So that** client always has latest version

**Acceptance Criteria:**
- ✅ Can send PDF anytime (even after first send)
- ✅ Regenerates PDF with latest data
- ✅ Email log shows all sends (date, recipient, status)
- ✅ Can send to different email addresses each time

### 4.6 Feature: Packing Materials Tracking

#### User Story 12: Track Packing Materials Used
**As a** Checker  
**I want to** record packing materials used per job  
**So that** we can track inventory and costs

**Materials to Track:**
- Boxes (Small / Medium / Large / Extra Large)
- Bubble wrap (meters)
- Packing tape (rolls)
- Furniture covers (pieces)
- Straps (pieces)
- Other materials (free text)

**Acceptance Criteria:**
- ✅ Add materials from predefined list
- ✅ Quantity input for each material
- ✅ Materials summary included in PDF
- ✅ Super Admin can view materials usage reports

#### User Story 13: Reusable Box Tracking
**As a** Super Admin  
**I want to** track which boxes are reused  
**So that** we know box inventory and condition

**Acceptance Criteria:**
- ✅ Boxes have unique IDs (BOX-001, BOX-002)
- ✅ Track: Size, Condition (Good/Fair/Damaged), Last Used
- ✅ Assign boxes to job when used
- ✅ Mark box as returned after delivery
- ✅ Dashboard shows available boxes by size

### 4.7 Feature: Damage Documentation

#### User Story 14: Document Pre-Existing Damage
**As a** Maker  
**I want to** easily flag and photograph damaged items  
**So that** we're protected from false claims

**Acceptance Criteria:**
- ✅ "Condition" field with options: Excellent / Good / Fair / Damaged
- ✅ If "Damaged" selected, "Special Notes" auto-prompts
- ✅ Damage photos highlighted in PDF (different border/icon)
- ✅ Automatic summary: "X items had pre-existing damage"
- ✅ Can add multiple damage photos per item

**Special Notes Auto-Suggestions:**
```
- "Scratch on [location]"
- "Dent on [location]"
- "Broken [part]"
- "Stain on [location]"
- "Chipped [location]"
- "Torn [location]"
```

---

## 5. DATA MODEL & DATABASE SCHEMA

### 5.1 Database Tables

#### Table: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'checker', 'maker')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

#### Table: jobs
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number TEXT UNIQUE NOT NULL,  -- BL-2026-0001
  client_name TEXT NOT NULL,
  move_date DATE,
  truck_vehicle_no TEXT,
  
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'pending_review', 'approved', 'in_progress', 'completed')),
  
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_job_number ON jobs(job_number);
```

#### Table: addresses
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('pickup', 'delivery')),
  address_name TEXT,  -- "Home", "Office", "New Apartment"
  full_address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  pincode TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  scheduled_date DATE,
  actual_date DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_job_id ON addresses(job_id);
CREATE INDEX idx_addresses_type ON addresses(address_type);
```

#### Table: warehouse_lots
```sql
CREATE TABLE warehouse_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_number TEXT UNIQUE NOT NULL,  -- LOT-2026-001
  job_id UUID REFERENCES jobs(id),
  client_name TEXT NOT NULL,
  warehouse_location TEXT,  -- "Warehouse A, Section 3"
  
  date_in DATE NOT NULL,
  date_out DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'moved')),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lots_lot_number ON warehouse_lots(lot_number);
CREATE INDEX idx_lots_job_id ON warehouse_lots(job_id);
CREATE INDEX idx_lots_status ON warehouse_lots(status);
```

#### Table: items
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,  -- BL-2026-0045-ITM-001
  
  -- Location assignment
  pickup_address_id UUID REFERENCES addresses(id),
  delivery_type TEXT CHECK (delivery_type IN ('address', 'lot')),
  delivery_address_id UUID REFERENCES addresses(id),
  lot_id UUID REFERENCES warehouse_lots(id),
  
  -- Item details
  description TEXT NOT NULL,
  category TEXT,  -- Auto-populated by AI
  material TEXT,
  color TEXT,
  dimensions TEXT,
  quantity INTEGER DEFAULT 1,
  weight_volume TEXT,
  value_of_goods DECIMAL(10,2),
  gst_taxes DECIMAL(10,2),
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'damaged')),
  special_notes TEXT,
  
  -- AI data
  ai_suggested_description TEXT,
  ai_confidence DECIMAL(3,2),
  was_ai_edited BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_job_id ON items(job_id);
CREATE INDEX idx_items_package_id ON items(package_id);
CREATE INDEX idx_items_pickup_address ON items(pickup_address_id);
CREATE INDEX idx_items_delivery_address ON items(delivery_address_id);
CREATE INDEX idx_items_lot_id ON items(lot_id);
```

#### Table: item_photos
```sql
CREATE TABLE item_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  stage TEXT CHECK (stage IN ('quote', 'packing', 'loading', 'unloading', 'damage')),
  file_size_kb INTEGER,
  
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_item_id ON item_photos(item_id);
CREATE INDEX idx_photos_stage ON item_photos(stage);
```

#### Table: packing_materials
```sql
CREATE TABLE packing_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL,  -- "box_small", "bubble_wrap", "tape"
  material_name TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT,  -- "pieces", "meters", "rolls"
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materials_job_id ON packing_materials(job_id);
```

#### Table: reusable_boxes
```sql
CREATE TABLE reusable_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  box_number TEXT UNIQUE NOT NULL,  -- BOX-001
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'extra_large')),
  condition TEXT DEFAULT 'good' CHECK (condition IN ('good', 'fair', 'damaged')),
  current_job_id UUID REFERENCES jobs(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'damaged')),
  last_used_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_boxes_status ON reusable_boxes(status);
CREATE INDEX idx_boxes_size ON reusable_boxes(size);
```

#### Table: pdfs
```sql
CREATE TABLE pdfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  file_size_kb INTEGER,
  
  sent_to_emails TEXT[],  -- Array of email addresses
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES users(id),
  
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pdfs_job_id ON pdfs(job_id);
```

#### Table: audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,  -- "created_job", "approved_job", "sent_pdf", etc.
  entity_type TEXT,  -- "job", "item", "user"
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

### 5.2 Database Functions

#### Auto-generate Job Number
```sql
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  next_num INTEGER;
  job_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num
  FROM jobs
  WHERE job_number LIKE 'BL-' || year || '-%';
  
  job_num := 'BL-' || year || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN job_num;
END;
$$ LANGUAGE plpgsql;
```

#### Auto-generate Package ID
```sql
CREATE OR REPLACE FUNCTION generate_package_id(p_job_id UUID)
RETURNS TEXT AS $$
DECLARE
  job_num TEXT;
  next_item_num INTEGER;
  package_id TEXT;
BEGIN
  SELECT job_number INTO job_num FROM jobs WHERE id = p_job_id;
  
  SELECT COALESCE(COUNT(*), 0) + 1
  INTO next_item_num
  FROM items
  WHERE job_id = p_job_id;
  
  package_id := job_num || '-ITM-' || LPAD(next_item_num::TEXT, 3, '0');
  RETURN package_id;
END;
$$ LANGUAGE plpgsql;
```

### 5.3 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
-- ... (enable on all tables)

-- Makers can only see their own draft jobs
CREATE POLICY maker_jobs_policy ON jobs
  FOR SELECT
  USING (
    auth.uid() = created_by OR
    status != 'draft'
  );

-- Checkers and Super Admins can see all jobs
CREATE POLICY checker_admin_jobs_policy ON jobs
  FOR ALL
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('checker', 'super_admin')
  );

-- Only Super Admins can delete
CREATE POLICY super_admin_delete_policy ON jobs
  FOR DELETE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );
```

---

## 6. TECHNICAL ARCHITECTURE

### 6.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (PWA)                        │
│  React + Vite + TailwindCSS + React Query + Zustand        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Camera  │  │   PDF    │  │  Image   │  │  Forms   │  │
│  │ Component│  │Generator │  │Compression│  │& Inputs  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  Hosted on: Vercel / Netlify (CDN + Auto-deploy)          │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            PostgreSQL Database                        │  │
│  │  - All tables with RLS                                │  │
│  │  - Triggers & Functions                               │  │
│  │  - Full-text search                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Supabase Auth                              │  │
│  │  - Email/password login                               │  │
│  │  - JWT tokens                                         │  │
│  │  - Role-based access                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Supabase Storage                           │  │
│  │  - Item photos (compressed)                           │  │
│  │  - Thumbnails                                         │  │
│  │  - Generated PDFs                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Supabase Realtime                          │  │
│  │  - Job status updates                                 │  │
│  │  - Approval notifications                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │  Gemini API    │  │   Resend.com   │  │   jsPDF      │ │
│  │  (AI Vision)   │  │  (Email Send)  │  │ (PDF Gen)    │ │
│  │  - Item ID     │  │  - 3K free/mo  │  │  - Browser   │ │
│  │  - 45K free/mo │  │                 │  │  - Based     │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Frontend Architecture

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── ProtectedRoute.jsx
│   ├── jobs/
│   │   ├── JobList.jsx
│   │   ├── JobDetails.jsx
│   │   ├── JobForm.jsx
│   │   └── JobStatusBadge.jsx
│   ├── items/
│   │   ├── ItemList.jsx
│   │   ├── ItemForm.jsx
│   │   ├── ItemCard.jsx
│   │   ├── CameraCapture.jsx
│   │   └── BulkUpload.jsx
│   ├── addresses/
│   │   ├── AddressList.jsx
│   │   └── AddressForm.jsx
│   ├── pdf/
│   │   ├── PDFGenerator.jsx
│   │   └── PDFPreview.jsx
│   ├── approvals/
│   │   ├── ReviewQueue.jsx
│   │   └── ApprovalActions.jsx
│   ├── analytics/
│   │   └── Dashboard.jsx (Super Admin only)
│   └── common/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Select.jsx
│       ├── Modal.jsx
│       └── LoadingSpinner.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useJobs.js
│   ├── useItems.js
│   ├── useCamera.js
│   ├── useGeminiAI.js
│   └── usePDF.js
├── services/
│   ├── supabase.js
│   ├── geminiAI.js
│   ├── pdfGenerator.js
│   ├── emailService.js
│   └── imageCompression.js
├── stores/
│   ├── authStore.js (Zustand)
│   └── jobStore.js (Zustand)
├── utils/
│   ├── validation.js
│   ├── formatters.js
│   └── constants.js
├── App.jsx
└── main.jsx
```

### 6.3 State Management Strategy

**Zustand for:**
- User auth state
- Current job in progress (draft)
- UI state (modals, toasts)

**React Query for:**
- All server data (jobs, items, users)
- Automatic caching
- Optimistic updates
- Background refetching

**Local State (useState) for:**
- Form inputs
- Camera capture
- Temporary UI state

### 6.4 Image Processing Pipeline

```
1. User captures photo
   ↓
2. Compress in browser (200 KB target)
   - Using browser-image-compression library
   - Max width: 1920px
   - Quality: 0.7
   ↓
3. Generate thumbnail (50 KB)
   - Max width: 400px
   - Quality: 0.6
   ↓
4. Upload both to Supabase Storage
   - Full: /photos/{job_id}/{item_id}_full.jpg
   - Thumb: /photos/{job_id}/{item_id}_thumb.jpg
   ↓
5. Send full image to Gemini API
   - Base64 encoded
   - With prompt for item identification
   ↓
6. Display thumbnail in UI (fast loading)
   - Full image for PDF generation
```

### 6.5 PDF Generation Process

```
1. User clicks "Generate PDF"
   ↓
2. Fetch all job data from Supabase
   - Job details
   - All items with photos
   - Packing materials
   ↓
3. Download all thumbnail images
   - Convert to base64
   ↓
4. Generate PDF using jsPDF
   - Add Buhariwala branding
   - Add job summary
   - Add items with photos (grid layout)
   - Add terms & conditions
   ↓
5. Upload PDF to Supabase Storage
   - /pdfs/{job_id}/inventory_report_{timestamp}.pdf
   ↓
6. Return public URL
   ↓
7. If "Send Email" clicked:
   - Call Resend API
   - Attach PDF URL
   - Send to client email(s)
   ↓
8. Log email send in database
```

---

## 7. UI/UX SPECIFICATIONS

### 7.1 Design System

**Colors:**
```
Primary: #2563EB (Blue)
Secondary: #10B981 (Green)
Accent: #F59E0B (Amber)
Error: #EF4444 (Red)
Warning: #F59E0B (Amber)
Success: #10B981 (Green)
Gray: #6B7280 (Neutral)
Background: #F9FAFB (Light Gray)
```

**Typography:**
```
Font Family: Inter (sans-serif)
Headings: 24px, 20px, 18px (Bold)
Body: 16px (Regular)
Small: 14px (Regular)
Tiny: 12px (Medium)
```

**Spacing:**
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

**Mobile Breakpoints:**
```
Mobile: 375px - 767px (Primary focus)
Tablet: 768px - 1023px
Desktop: 1024px+
```

### 7.2 Key Screens (Mobile-First)

#### Screen 1: Login
```
┌─────────────────────────────┐
│                              │
│   [Buhariwala Logo]         │
│                              │
│   Movers & Packers          │
│   Inventory System          │
│                              │
│   ┌─────────────────────┐  │
│   │ Email               │  │
│   └─────────────────────┘  │
│                              │
│   ┌─────────────────────┐  │
│   │ Password            │  │
│   └─────────────────────┘  │
│                              │
│   [      Login      ]       │
│                              │
└─────────────────────────────┘
```

#### Screen 2: Home/Dashboard (Maker)
```
┌─────────────────────────────┐
│ ☰  Jobs             [+]     │ ← Header
├─────────────────────────────┤
│ Status Filter:              │
│ [All] [Draft] [Pending]     │
├─────────────────────────────┤
│ ┌─────────────────────────┐│
│ │ Job #BL-2026-0045       ││ ← Job Card
│ │ Rajesh Kumar            ││
│ │ Status: DRAFT           ││
│ │ 15 items • Created 2h ago│
│ └─────────────────────────┘│
│                              │
│ ┌─────────────────────────┐│
│ │ Job #BL-2026-0044       ││
│ │ Priya Sharma            ││
│ │ Status: PENDING REVIEW  ││
│ │ 23 items • Submitted 1d ││
│ └─────────────────────────┘│
│                              │
│ ┌─────────────────────────┐│
│ │ Job #BL-2026-0043       ││
│ │ Amit Patel              ││
│ │ Status: APPROVED        ││
│ │ 30 items • Approved 2d  ││
│ └─────────────────────────┘│
└─────────────────────────────┘
```

#### Screen 3: Job Details
```
┌─────────────────────────────┐
│ ← Job #BL-2026-0045    [⋮]  │ ← Header with menu
├─────────────────────────────┤
│ Client: Rajesh Kumar        │
│ Move Date: Jan 15, 2026     │
│ Status: DRAFT               │
├─────────────────────────────┤
│ Pickup Locations (2):       │
│ ▸ Home - Andheri (40 items) │
│ ▸ Office - BKC (15 items)   │
│                              │
│ Delivery: Bangalore         │
├─────────────────────────────┤
│ Items (55)                  │
│                              │
│ ┌─────────────────────────┐│
│ │ [📷]  3-Seater Sofa     ││ ← Item Card
│ │       Brown, Fabric      ││
│ │       Good condition     ││
│ │       Pickup: Home       ││
│ └─────────────────────────┘│
│                              │
│ ┌─────────────────────────┐│
│ │ [📷]  Dining Table      ││
│ │       Wood, 6-seater     ││
│ │       Excellent          ││
│ │       Pickup: Home       ││
│ └─────────────────────────┘│
│                              │
│ [+ Add Item] [+ Bulk Upload]│
│                              │
│ [    Submit for Approval   ]│ ← Primary Action
└─────────────────────────────┘
```

#### Screen 4: Add Items (Unified Flow)
```
┌─────────────────────────────┐
│ ← Add Items                  │
├─────────────────────────────┤
│                              │
│  Choose Method:              │
│                              │
│  ┌─────────────────────────┐│
│  │  📷 Take Photo(s)       ││ ← Opens camera
│  │                          ││
│  │  Capture 1 or more      ││
│  └─────────────────────────┘│
│                              │
│  ┌─────────────────────────┐│
│  │  🖼️  Select from Gallery││ ← Opens gallery
│  │                          ││
│  │  Pick 1-50 photos       ││
│  └─────────────────────────┘│
│                              │
│  ┌─────────────────────────┐│
│  │  ✏️  Manual Entry       ││ ← Skip photos
│  │                          ││
│  │  No photos needed       ││
│  └─────────────────────────┘│
└─────────────────────────────┘

If "Take Photo(s)" selected:
┌─────────────────────────────┐
│ ← Capture Photos             │
├─────────────────────────────┤
│                              │
│  ┌────────────────────────┐ │
│  │                         │ │
│  │    [CAMERA VIEWFINDER] │ │
│  │                         │ │
│  │                         │ │
│  │        [🔵]            │ │ ← Capture Button
│  │                         │ │
│  └────────────────────────┘ │
│                              │
│  Photos captured: 0          │
│                              │
│  [  Done (Process Photos)  ] │
└─────────────────────────────┘

After each capture:
┌─────────────────────────────┐
│ ← Capture Photos             │
├─────────────────────────────┤
│  ┌────────────────────────┐ │
│  │    [CAMERA VIEW]       │ │
│  └────────────────────────┘ │
│                              │
│  Photos captured: 3          │
│  [📷] [📷] [📷]  ← Thumbnails│
│                              │
│  [  Take Another  ]          │
│  [  Done (Process 3 Photos)] │
└─────────────────────────────┘

After "Done" - Processing Queue:
┌─────────────────────────────┐
│ ← Processing Items (3 of 3)  │
├─────────────────────────────┤
│ 🤖 AI identifying items...  │
│                              │
│ ┌─────────────────────────┐│
│ │ ✅ 3-Seater Sofa (89%)  ││ ← Completed
│ │ [Edit]                   ││
│ └─────────────────────────┘│
│                              │
│ ┌─────────────────────────┐│
│ │ ⏳ Processing...        ││ ← In progress
│ └─────────────────────────┘│
│                              │
│ ┌─────────────────────────┐│
│ │ ⏳ Waiting...           ││ ← Queued
│ └─────────────────────────┘│
└─────────────────────────────┘

After all processed - Review All:
┌─────────────────────────────┐
│ ← Review Items (3)      [×]  │
├─────────────────────────────┤
│ ┌─────────────────────────┐│
│ │ [📷]  3-Seater Sofa     ││ ← Item Card 1
│ │       AI: 89% confident ││
│ │                          ││
│ │ Description: *          ││
│ │ [3-Seater Fabric Sofa  ]││
│ │                          ││
│ │ Condition: [Good ↓]    ││
│ │ Pickup: [Home ↓]       ││
│ │ Delivery: [Bangalore ↓]││
│ │                          ││
│ │ [🗑️ Delete] [✏️ Edit]  ││
│ └─────────────────────────┘│
│                              │
│ ┌─────────────────────────┐│
│ │ [📷]  Dining Table      ││ ← Item Card 2
│ │       AI: 92% confident ││
│ │ Description: *          ││
│ │ [6-Seater Wood Table   ]││
│ │ ...                      ││
│ └─────────────────────────┘│
│                              │
│ ┌─────────────────────────┐│
│ │ [📷]  Wardrobe          ││ ← Item Card 3
│ │       AI: 85% confident ││
│ │ ...                      ││
│ └─────────────────────────┘│
│                              │
│ [+ Take More Photos]         │
│ [    Save All Items (3)    ] │
└─────────────────────────────┘

Manual Entry (No Photos):
┌─────────────────────────────┐
│ ← Manual Entry               │
├─────────────────────────────┤
│ Description: *               │
│ ┌─────────────────────────┐│
│ │ Sofa                    ││ ← Autocomplete dropdown
│ │ ▼ Suggestions:          ││
│ │   • Sofa 3-seater       ││
│ │   • Sofa 2-seater       ││
│ │   • Sofa bed            ││
│ └─────────────────────────┘│
│                              │
│ Category:                    │
│ [Furniture - Living Room ↓] │
│                              │
│ Condition: *                 │
│ [Good ↓]                     │
│                              │
│ Dimensions (Optional):       │
│ [7ft x 3ft x 3ft          ] │
│                              │
│ Pickup Location: *           │
│ [Home - Andheri ↓]          │
│                              │
│ Delivery:                    │
│ [Bangalore ↓]                │
│                              │
│ [      Save Item      ]      │
└─────────────────────────────┘
```

#### Screen 5: Review Queue (Checker)
```
┌─────────────────────────────┐
│ ← Review Queue        [3]   │
├─────────────────────────────┤
│ Pending Your Approval:      │
│                              │
│ ┌─────────────────────────┐│
│ │ Job #BL-2026-0048       ││
│ │ Rajesh Kumar            ││
│ │ 25 items • 2 hours ago  ││
│ │ Created by: Ramesh M.   ││
│ │                          ││
│ │ [   Review   ]          ││
│ └─────────────────────────┘│
│                              │
│ ┌─────────────────────────┐│
│ │ Job #BL-2026-0047       ││
│ │ Priya Sharma            ││
│ │ 18 items • 5 hours ago  ││
│ │ Created by: Suresh K.   ││
│ │                          ││
│ │ [   Review   ]          ││
│ └─────────────────────────┘│
└─────────────────────────────┘

After clicking Review:
┌─────────────────────────────┐
│ ← Job #BL-2026-0048          │
├─────────────────────────────┤
│ [View Full Details]         │
│                              │
│ Quick Summary:              │
│ • 25 items documented       │
│ • 23 with photos            │
│ • 2 damaged items noted     │
│ • Pickup: 2 locations       │
│ • Delivery: Bangalore       │
│                              │
│ Created by: Ramesh M.       │
│ Submitted: 2 hours ago      │
├─────────────────────────────┤
│ [✓ Approve]                 │
│ [✎ Request Changes]         │
│ [✗ Reject]                  │
└─────────────────────────────┘
```

#### Screen 6: Generate & Send PDF
```
┌─────────────────────────────┐
│ ← Generate PDF               │
├─────────────────────────────┤
│ Job #BL-2026-0045           │
│ Rajesh Kumar                │
│ 55 items                    │
├─────────────────────────────┤
│ PDF will include:           │
│ ✓ Cover page with branding │
│ ✓ Job summary               │
│ ✓ All 55 items with photos │
│ ✓ Packing materials         │
│ ✓ Terms & conditions        │
│ ✓ Signature section         │
├─────────────────────────────┤
│ [ Generate Preview ]        │
│                              │
│ OR                           │
│                              │
│ Send directly to client:    │
│                              │
│ Client Email: *             │
│ ┌─────────────────────────┐│
│ │ rajesh@email.com        ││
│ └─────────────────────────┘│
│                              │
│ Additional Emails:          │
│ ┌─────────────────────────┐│
│ │ wife@email.com          ││
│ └─────────────────────────┘│
│ [+ Add Another]             │
│                              │
│ [ Generate & Send PDF ]    │
└─────────────────────────────┘
```

### 7.3 Responsive Behavior

**Mobile (375px - 767px):**
- Single column layout
- Full-width cards
- Bottom sheet modals
- Fixed bottom action buttons
- Hamburger menu navigation

**Tablet (768px - 1023px):**
- Two column layout where appropriate
- Larger cards with more info
- Side sheet modals
- Top navigation bar

**Desktop (1024px+):**
- Three column layout (list + details + sidebar)
- All info visible without scrolling
- Desktop modals (centered)
- Persistent left sidebar navigation

### 7.4 Interaction Patterns

**Camera Capture:**
- Single tap to capture
- Visual confirmation (flash effect)
- Immediate thumbnail preview
- "Retake" option always visible

**Form Inputs:**
- Labels above inputs (mobile-friendly)
- Required fields marked with *
- Inline validation (on blur)
- Error messages below input
- Success state (green checkmark)

**Autocomplete:**
- Show suggestions after 2 characters
- Debounced search (300ms)
- Keyboard navigation (↑↓ Enter)
- Touch-friendly hit targets (44px min)
- "No results" message

**Loading States:**
- Skeleton screens for lists
- Spinner for quick actions (<2s)
- Progress bar for uploads
- Toast notifications for background tasks

**Empty States:**
- Friendly illustration
- Clear explanation
- Primary action button
- Examples/tips

**Errors:**
- Toast for temporary errors
- Modal for critical errors
- Inline for form validation
- Retry button when applicable

---

## 8. API ENDPOINTS

### 8.1 Authentication

#### POST /auth/login
```javascript
Request:
{
  "email": "ramesh@buhariwala.com",
  "password": "securepass123"
}

Response:
{
  "access_token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "ramesh@buhariwala.com",
    "full_name": "Ramesh Maker",
    "role": "maker"
  }
}
```

#### POST /auth/logout
```javascript
Response:
{
  "success": true
}
```

### 8.2 Jobs

#### GET /jobs
```javascript
Query Params:
- status: "draft" | "pending_review" | "approved" | "in_progress" | "completed"
- created_by: UUID (for filtering)
- limit: number
- offset: number

Response:
{
  "data": [
    {
      "id": "uuid",
      "job_number": "BL-2026-0045",
      "client_name": "Rajesh Kumar",
      "move_date": "2026-01-15",
      "status": "draft",
      "item_count": 55,
      "created_by": {
        "id": "uuid",
        "full_name": "Ramesh Maker"
      },
      "created_at": "2026-01-10T10:00:00Z"
    }
  ],
  "count": 25,
  "total": 125
}
```

#### POST /jobs
```javascript
Request:
{
  "client_name": "Rajesh Kumar",
  "move_date": "2026-01-15",
  "truck_vehicle_no": "MH-01-AB-1234"
}

Response:
{
  "data": {
    "id": "uuid",
    "job_number": "BL-2026-0045",
    "client_name": "Rajesh Kumar",
    "status": "draft",
    "created_at": "2026-01-10T10:00:00Z"
  }
}
```

#### PATCH /jobs/:id
```javascript
Request:
{
  "client_name": "Rajesh Kumar Updated",
  "truck_vehicle_no": "MH-02-XY-5678"
}

Response:
{
  "data": {
    "id": "uuid",
    "job_number": "BL-2026-0045",
    "client_name": "Rajesh Kumar Updated",
    "updated_at": "2026-01-10T11:00:00Z"
  }
}
```

#### POST /jobs/:id/submit
```javascript
Response:
{
  "data": {
    "id": "uuid",
    "status": "pending_review",
    "submitted_at": "2026-01-10T12:00:00Z"
  }
}
```

#### POST /jobs/:id/approve
```javascript
Request:
{
  "approved_by": "checker_uuid"
}

Response:
{
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_by": "checker_uuid",
    "approved_at": "2026-01-10T13:00:00Z"
  }
}
```

#### POST /jobs/:id/reject
```javascript
Request:
{
  "rejection_reason": "Missing dimensions for 5 items"
}

Response:
{
  "data": {
    "id": "uuid",
    "status": "draft",
    "rejection_reason": "Missing dimensions for 5 items"
  }
}
```

### 8.3 Items

#### GET /jobs/:job_id/items
```javascript
Response:
{
  "data": [
    {
      "id": "uuid",
      "package_id": "BL-2026-0045-ITM-001",
      "description": "3-Seater Fabric Sofa",
      "category": "Furniture - Living Room",
      "quantity": 1,
      "condition": "good",
      "photos": [
        {
          "url": "https://...",
          "thumbnail_url": "https://...",
          "stage": "packing"
        }
      ],
      "pickup_address": {
        "address_name": "Home",
        "full_address": "123 Andheri West, Mumbai"
      },
      "delivery_type": "address",
      "delivery_address": {
        "full_address": "456 Koramangala, Bangalore"
      }
    }
  ]
}
```

#### POST /jobs/:job_id/items
```javascript
Request:
{
  "description": "3-Seater Fabric Sofa",
  "category": "Furniture - Living Room",
  "material": "Fabric",
  "color": "Beige",
  "dimensions": "7ft x 3ft x 3ft",
  "quantity": 1,
  "condition": "good",
  "special_notes": "Pre-existing scratch on right armrest",
  "pickup_address_id": "uuid",
  "delivery_type": "address",
  "delivery_address_id": "uuid",
  "photos": [
    {
      "photo_url": "https://supabase.../photo1.jpg",
      "thumbnail_url": "https://supabase.../photo1_thumb.jpg",
      "stage": "packing"
    }
  ],
  "ai_suggested_description": "Couch",
  "ai_confidence": 0.89,
  "was_ai_edited": true
}

Response:
{
  "data": {
    "id": "uuid",
    "package_id": "BL-2026-0045-ITM-055",
    "description": "3-Seater Fabric Sofa",
    ...
  }
}
```

#### PATCH /items/:id
#### DELETE /items/:id (soft delete)

### 8.4 AI Identification

#### POST /ai/identify-item
```javascript
Request:
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "prompt_context": {
    "job_type": "household_moving",
    "previous_items": ["Sofa", "Dining Table", "Bed"]
  }
}

Response:
{
  "data": {
    "item_name": "3-Seater Fabric Sofa",
    "category": "Furniture - Living Room",
    "material": "Fabric",
    "color": "Beige",
    "condition": "Good",
    "estimated_dimensions": "7ft x 3ft x 3ft",
    "special_notes": "Visible wear on left armrest",
    "confidence": 0.89
  },
  "processing_time_ms": 1250
}
```

### 8.5 PDF Generation

#### POST /jobs/:id/generate-pdf
```javascript
Request:
{
  "include_photos": true,
  "include_packing_materials": true
}

Response:
{
  "data": {
    "pdf_url": "https://supabase.../pdfs/BL-2026-0045_report.pdf",
    "file_size_kb": 2450,
    "generated_at": "2026-01-10T14:00:00Z"
  }
}
```

#### POST /jobs/:id/send-pdf
```javascript
Request:
{
  "email_addresses": [
    "rajesh@email.com",
    "wife@email.com"
  ],
  "message": "Please find attached your moving inventory report."
}

Response:
{
  "data": {
    "sent_to": ["rajesh@email.com", "wife@email.com"],
    "sent_at": "2026-01-10T14:05:00Z",
    "email_ids": ["resend_abc123", "resend_def456"]
  }
}
```

### 8.6 Addresses

#### POST /jobs/:job_id/addresses
```javascript
Request:
{
  "address_type": "pickup",
  "address_name": "Home",
  "full_address": "123 Andheri West, Mumbai 400053",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400053",
  "contact_person": "Rajesh Kumar",
  "contact_phone": "+91 9876543210",
  "scheduled_date": "2026-01-15"
}

Response:
{
  "data": {
    "id": "uuid",
    "address_type": "pickup",
    "address_name": "Home",
    ...
  }
}
```

### 8.7 Warehouse Lots

#### POST /warehouse-lots
```javascript
Request:
{
  "job_id": "uuid",
  "client_name": "Rajesh Kumar",
  "warehouse_location": "Warehouse A, Section 3",
  "date_in": "2026-01-16",
  "notes": "Store for 2 weeks"
}

Response:
{
  "data": {
    "id": "uuid",
    "lot_number": "LOT-2026-005",
    "status": "active",
    ...
  }
}
```

#### GET /warehouse-lots?status=active
#### PATCH /warehouse-lots/:id/close (mark date_out, status=completed)

### 8.8 Analytics (Super Admin Only)

#### GET /analytics/dashboard
```javascript
Response:
{
  "data": {
    "total_jobs": 125,
    "jobs_this_month": 28,
    "pending_review": 3,
    "avg_items_per_job": 42,
    "total_items_processed": 5250,
    "ai_accuracy_rate": 0.87,
    "most_common_items": [
      {"description": "Sofa", "count": 125},
      {"description": "Dining Table", "count": 98},
      {"description": "Bed", "count": 156}
    ],
    "jobs_by_status": {
      "draft": 5,
      "pending_review": 3,
      "approved": 10,
      "in_progress": 8,
      "completed": 99
    }
  }
}
```

---

## 9. DEVELOPMENT ROADMAP

### 9.1 Sprint Plan (12 Weeks Total)

#### Sprint 1-2: Foundation (Weeks 1-2)
**Goal:** Setup infrastructure + authentication

**Tasks:**
- [ ] Initialize React + Vite project
- [ ] Setup TailwindCSS + design system
- [ ] Setup Supabase project
- [ ] Create all database tables
- [ ] Implement RLS policies
- [ ] Build authentication flow (login/logout)
- [ ] Setup Vercel/Netlify deployment
- [ ] Create basic routing structure
- [ ] Implement role-based navigation

**Deliverables:**
- ✅ Working login for all 3 roles
- ✅ Database ready with sample data
- ✅ Deployed to staging URL

---

#### Sprint 3-4: Job Management (Weeks 3-4)
**Goal:** Create and view jobs

**Tasks:**
- [ ] Build job list screen (with filters)
- [ ] Build job creation form
- [ ] Implement auto-generated job numbers
- [ ] Build job details screen
- [ ] Implement status badges
- [ ] Create address management (add/edit/delete)
- [ ] Implement multi-location support
- [ ] Build warehouse lot creation
- [ ] Test job CRUD operations

**Deliverables:**
- ✅ Makers can create jobs with multiple addresses
- ✅ Jobs display correctly for all roles
- ✅ Warehouse lots can be created and assigned

---

#### Sprint 5-6: Item Management + AI (Weeks 5-6)
**Goal:** Add items with photo capture and AI

**Tasks:**
- [ ] Build camera capture component
- [ ] Implement image compression
- [ ] Setup Supabase Storage
- [ ] Integrate Gemini API
- [ ] Build AI identification flow
- [ ] Create item form (with AI pre-fill)
- [ ] Implement predictive autocomplete
- [ ] Build item list view
- [ ] Add unified photo capture (1 or many photos)
- [ ] Implement manual entry (no photo)
- [ ] Test AI accuracy with sample images

**Deliverables:**
- ✅ Workers can take photos and get AI suggestions
- ✅ Items can be added manually or with photos
- ✅ Autocomplete works for all text fields
- ✅ Unified flow processes single or multiple images

---

#### Sprint 7-8: Approval Workflow (Weeks 7-8)
**Goal:** Implement Maker → Checker approval flow

**Tasks:**
- [ ] Build "Submit for Approval" button (Makers)
- [ ] Create Checker review queue
- [ ] Build approval/reject modals
- [ ] Implement status transitions
- [ ] Add notification system (Supabase Realtime)
- [ ] Build rejection reason form
- [ ] Implement "Request Changes" flow
- [ ] Add audit logging
- [ ] Test full workflow end-to-end

**Deliverables:**
- ✅ Makers can submit jobs for review
- ✅ Checkers see pending jobs in queue
- ✅ Approve/Reject/Request Changes all work
- ✅ Notifications sent in real-time

---

#### Sprint 9: PDF Generation (Week 9)
**Goal:** Generate and send professional PDFs

**Tasks:**
- [ ] Design PDF template (Figma)
- [ ] Implement jsPDF generation
- [ ] Add Buhariwala branding
- [ ] Include all sections (cover, summary, items, materials)
- [ ] Add photo thumbnails to PDF
- [ ] Test PDF on multiple devices
- [ ] Implement PDF preview
- [ ] Setup Resend.com email
- [ ] Build email sending form
- [ ] Test email delivery

**Deliverables:**
- ✅ Professional PDF generates in <30 seconds
- ✅ PDF includes all required sections
- ✅ Email successfully delivers to clients

---

#### Sprint 10: Packing Materials + Polish (Week 10)
**Goal:** Add materials tracking + UX improvements

**Tasks:**
- [ ] Build packing materials form
- [ ] Implement reusable box tracking
- [ ] Add materials to PDF
- [ ] Improve mobile responsiveness
- [ ] Add loading states everywhere
- [ ] Implement error boundaries
- [ ] Add empty states
- [ ] Improve form validation
- [ ] Add keyboard shortcuts (desktop)

**Deliverables:**
- ✅ Packing materials can be tracked per job
- ✅ Reusable boxes inventory works
- ✅ All screens fully responsive
- ✅ Professional loading/error/empty states

---

#### Sprint 11: Analytics + Admin Features (Week 11)
**Goal:** Super Admin dashboard and analytics

**Tasks:**
- [ ] Build analytics dashboard
- [ ] Implement job statistics
- [ ] Add AI accuracy tracking
- [ ] Build user management (CRUD)
- [ ] Add role assignment
- [ ] Implement audit log viewer
- [ ] Build warehouse management
- [ ] Add settings page
- [ ] Test admin-only features

**Deliverables:**
- ✅ Super Admin can view analytics
- ✅ User management works
- ✅ All admin features secured with RLS

---

#### Sprint 12: Testing + Deployment (Week 12)
**Goal:** Final testing and production launch

**Tasks:**
- [ ] End-to-end testing (all user flows)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing (Supabase limits)
- [ ] Fix all critical bugs
- [ ] Create user documentation
- [ ] Record training videos
- [ ] Setup production monitoring
- [ ] Final production deployment
- [ ] Staff training session

**Deliverables:**
- ✅ Fully tested application
- ✅ Documentation complete
- ✅ Production deployed
- ✅ Staff trained and ready

---

### 9.2 Testing Strategy

**Unit Tests:**
- All utility functions
- Form validation logic
- Data formatters

**Integration Tests:**
- API calls
- Database operations
- File uploads

**E2E Tests (Playwright):**
- Complete job creation flow
- Photo capture → AI → Save
- Approval workflow
- PDF generation and email

**Manual Testing:**
- All user flows for each role
- Mobile devices (iOS + Android)
- Cross-browser (Chrome, Safari, Firefox)
- Different network conditions

---

## 10. OPERATING COSTS

### 10.1 Monthly Operating Costs

| Service | Free Tier | Paid Tier (if exceeded) | Expected Cost |
|---------|-----------|------------------------|---------------|
| Supabase | 500 MB DB, 1 GB storage | ₹2,000/month (100 GB) | ₹0 (months 1-6), then ₹2,000/month |
| Gemini API | 45K images/month | ₹0.075 per 1K images | ₹0 (within free tier) |
| Vercel/Netlify | 100 GB bandwidth | ₹1,500/month | ₹0 (within free tier) |
| Resend Email | 3K emails/month | ₹1,200/month (50K emails) | ₹0 (within free tier) |
| **TOTAL MONTHLY** | | | **₹0-2,000/month** |

### 10.2 Annual Operating Costs

**Year 1:**
- Months 1-6: ₹0/month (free tiers)
- Months 7-12: ₹2,000/month (Supabase Pro)
- **Total Year 1: ₹12,000**

**Year 2+:**
- ₹2,000/month (Supabase Pro + all services)
- **Total Annual: ₹24,000**

**Note:** These costs assume moderate usage (~200 moving jobs/month, ~18,000 photos/month). All services offer free tiers that should cover initial months of operation.

---

## APPENDIX A: Suggested Features for Phase 2 (Event Management)

**Deferred to Phase 2 (after MVP success):**
1. Offline capability (Service Workers)
2. QR code tracking for event equipment
3. Real-time location tracking (GPS)
4. WhatsApp integration
5. Digital signatures
6. Multi-language support (Hindi, Marathi)
7. Voice input for descriptions
8. Damage cost estimation
9. Insurance claim integration
10. Customer portal (clients view their inventory online)

---

## APPENDIX B: Security Considerations

**Data Protection:**
- All API calls over HTTPS
- JWT tokens for authentication
- Row Level Security (RLS) on all tables
- Photos stored with private URLs (signed)
- Audit logging for sensitive actions

**Privacy:**
- Client data encrypted at rest
- Photos auto-deleted after 90 days (configurable)
- GDPR-compliant data export
- Right to deletion

**Access Control:**
- Role-based permissions enforced at database level
- API rate limiting
- Failed login attempt tracking
- Session timeout (24 hours)

---

## APPENDIX C: Performance Targets

| Metric | Target |
|--------|--------|
| Page Load Time | <2 seconds |
| Photo Capture to Display | <500ms |
| AI Identification | <3 seconds |
| PDF Generation | <30 seconds |
| API Response Time (95th percentile) | <500ms |
| Image Upload (200 KB) | <2 seconds (4G) |
| Lighthouse Score (Mobile) | >90 |

---

## APPENDIX D: Browser Support

**Minimum Requirements:**
- Chrome 90+ (Android)
- Safari 14+ (iOS)
- Firefox 88+
- Edge 90+

**Features Requiring Modern Browser:**
- Camera API (getUserMedia)
- Service Workers (Phase 2)
- IndexedDB (Phase 2)
- WebRTC (future)

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**

---

**Next Steps:**
1. Review and approve PRD
2. Finalize Buhariwala branding assets (logo, colors)
3. Set up development environment
4. Begin implementation following sprint plan
