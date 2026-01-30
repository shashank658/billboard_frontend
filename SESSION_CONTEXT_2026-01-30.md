# Billboard Management Software - Development Session Context
**Date:** January 30, 2026

---

## Project Overview

A web-based Billboard Management Software for managing static and digital billboard inventory, bookings, revenue, costs, audit compliance, and customer relationships. Phase 1 targets 100-500 billboards with scalability to 50,000.

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18+ with TypeScript, Vite |
| UI Framework | Tailwind CSS + shadcn/ui |
| Backend | Node.js with Express + TypeScript |
| Database | PostgreSQL (Neon DB - serverless) |
| ORM | Drizzle ORM with neon-http driver |
| Authentication | JWT (Access + Refresh tokens) |
| Maps | Google Maps API |

### Repository URLs
- **Backend:** https://github.com/shashank658/billboard_be
- **Frontend:** https://github.com/shashank658/billboard_frontend

---

## Work Completed This Session

### 1. Booking Engine Implementation

#### Backend (booking.service.ts)
- Full CRUD operations for bookings
- Availability checking with overlap detection
- Auto-generated reference codes (BK-2024-0001 format)
- Support for static and digital (slot-based) billboards
- Calendar and date range queries
- Campaign support for multi-billboard bookings

#### Frontend (BookingsPage.tsx)
- Complete booking management page
- List view with filtering and pagination
- Calendar view for visual booking display
- 2-step wizard form for creating/editing bookings
- Step 1: Customer, Billboard, Date selection
- Step 2: Booking details and confirmation

---

### 2. Bug Fixes

#### Issue: Neon DB Transaction Error (500 on booking creation)
**Root Cause:** `sequence.service.ts` used `db.transaction()` which isn't supported by neon-http driver

**Solution:** Changed to PostgreSQL UPSERT (atomic operation without transactions)

```typescript
// sequence.service.ts - Fixed implementation
async getNextSequence(entityType: SequenceEntityType): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = SEQUENCE_PREFIXES[entityType];

  const result = await sql`
    INSERT INTO sequences (entity_type, year, current_value)
    VALUES (${entityType}, ${year}, 1)
    ON CONFLICT (entity_type, year)
    DO UPDATE SET current_value = sequences.current_value + 1
    RETURNING current_value
  `;

  const nextValue = result[0]?.current_value || 1;
  const paddedNumber = nextValue.toString().padStart(4, '0');
  return `${prefix}-${year}-${paddedNumber}`;
}
```

#### Issue: Frequent User Logouts
**Root Cause:** Token refresh interceptor expected wrong response structure

**Solution:** Fixed interceptor to correctly extract tokens from nested response

```typescript
// api.ts - Fixed token refresh
const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
  refreshToken: storedRefreshToken,
});
// Backend wraps tokens in { data: { tokens: { accessToken, refreshToken } } }
const { tokens } = response.data.data;
localStorage.setItem("accessToken", tokens.accessToken);
localStorage.setItem("refreshToken", tokens.refreshToken);
```

#### Issue: Token Timeout Too Short
**Solution:** Increased access token timeout from 15 minutes to 1 hour

```typescript
// config/index.ts
jwt: {
  accessExpiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10), // 1 hour
  refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800', 10), // 7 days
},
```

#### Issue: White Screen on Bookings Page
**Root Cause:** Multiple issues
1. API response not properly extracted (missing `.data`)
2. Select components with empty string values causing issues

**Solution:**
1. Updated `booking.service.ts` to extract `.data` from responses
2. Changed Select components to use "all" value instead of empty string

---

## File Structure

### Backend Key Files
```
backend/
├── src/
│   ├── config/index.ts          # JWT config (1hr access, 7d refresh)
│   ├── db/
│   │   ├── index.ts             # Neon DB connection
│   │   └── schema/
│   │       ├── bookings.ts      # Booking schema
│   │       ├── sequences.ts     # Sequence generation
│   │       └── index.ts         # Schema exports
│   ├── services/
│   │   ├── auth.service.ts      # JWT token management
│   │   ├── booking.service.ts   # Booking CRUD
│   │   └── sequence.service.ts  # Reference code generation
│   ├── routes/
│   │   └── booking.routes.ts    # Booking API endpoints
│   └── middleware/
│       └── auth.ts              # JWT authentication
```

### Frontend Key Files
```
frontend/
├── src/
│   ├── services/
│   │   ├── api.ts               # Axios instance with interceptors
│   │   └── booking.service.ts   # Booking API client
│   ├── pages/
│   │   └── bookings/
│   │       └── BookingsPage.tsx # Booking management UI
│   └── components/
│       └── ui/                  # shadcn/ui components
```

---

## API Endpoints Implemented

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Bookings
- `GET /api/bookings` - List bookings with filters
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/calendar` - Calendar view data
- `GET /api/bookings/availability` - Check availability

### Master Data
- `/api/regions/*` - Region CRUD
- `/api/cities/*` - City CRUD
- `/api/zones/*` - Zone CRUD
- `/api/billboards/*` - Billboard CRUD
- `/api/landlords/*` - Landlord CRUD
- `/api/customers/*` - Customer CRUD
- `/api/taxes/*` - Tax master CRUD

---

## Pending Tasks

| ID | Task | Status |
|----|------|--------|
| #13 | Campaign management for multi-billboard bookings | Pending |
| #14 | Purchase Order (PO) generation | Pending |
| #15 | Invoice generation with PDF | Pending |
| #16 | AWS S3 integration for audit media | Pending |
| #17 | Audit Media upload and viewer | Pending |
| #18 | Customer Portal | Pending |
| #19 | MIS Reports | Pending |
| #20 | Email notifications with SendGrid | Pending |
| #21 | Dashboard with role-based widgets | Pending |
| #22 | System Settings and Admin configuration | Pending |
| #23 | Audit Logging | Pending |
| #24 | Final testing and optimization | Pending |

---

## Recommended Next Steps

Based on the booking workflow: `Booking → PO → Invoice`

1. **Campaign Management (#13)** - Group multiple billboard bookings
2. **Purchase Order Generation (#14)** - Generate PO after display period
3. **Invoice Generation (#15)** - Create invoices with PDF export

---

## Important Notes

### Neon DB Limitations
- **No transaction support** with neon-http driver
- Use PostgreSQL UPSERT (`INSERT ON CONFLICT DO UPDATE`) for atomic operations
- Use `RETURNING` clause to get generated values

### JWT Token Flow
```
Login → Access Token (1hr) + Refresh Token (7d)
    ↓
API Request with Access Token
    ↓
401 Unauthorized? → Use Refresh Token to get new pair
    ↓
Refresh fails? → Redirect to login
```

### Reference Code Format
| Entity | Format |
|--------|--------|
| Booking | BK-2024-0001 |
| Campaign | CP-2024-0001 |
| Purchase Order | PO-2024-0001 |
| Invoice | INV-2024-0001 |

---

## Git Commits

### Backend Repository
- 62 files committed
- 17,356 lines of code
- Main branch: `main`

### Frontend Repository
- 68 files committed
- 16,438 lines of code
- Main branch: `main`

---

*Generated: January 30, 2026*
