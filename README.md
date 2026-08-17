# KSRCT Student Certificate Management Portal

Official full-stack Student Certificate Management Web Application built for **K.S. Rangasamy College of Technology (Autonomous), Tiruchengode, Tamil Nadu, India**.

![KSRCT Banner](client/public/assets/ksrct-campus.jpg)

---

## 🌟 Key Features

### Student Capabilities
- **Authentication & Profile**: Student login, secure session management, profile details update (phone number, full name).
- **Certificate Upload**: Upload academic, NPTEL, internship, workshop, hackathon, NSS, NCC, sports certificates with drag-and-drop file validation (PDF, JPG, PNG up to 10 MB).
- **Status Tracking & Actions**: Real-time status indicators (**APPROVED**, **PENDING**, **REJECTED**), PDF/Image in-browser preview, download capability, and deletion of pending certificates.
- **Remarks & Notifications**: Inspect HOD verification remarks/rejection reasons, receive real-time database-backed notifications.
- **Support System**: Submit technical support tickets and browse institutional FAQs.

### HOD / Verifier Capabilities
- **Department Analytics Dashboard**: Total students count, total certificates, pending verification queue, status overview donut chart, monthly upload trends, and category distribution charts (powered by Recharts).
- **Verification Workflow**: Review pending certificates, view student profile & issue metadata, **Approve** or **Reject** with mandatory rejection remarks.
- **Student Directory**: Inspect department students, view individual student certificate history.
- **Reports & Export**: Filter department certificate records by category, status, and date range, export real database data to **CSV**, and generate print-friendly reports.

### Administrator Capabilities
- **User Management**: Create system users (Students, HODs, Admins), toggle active/disabled access status, and change user roles.
- **System Audit Logs**: Real-time institutional audit trail recording logins, certificate uploads, verifications, rejections, user modifications, and IP addresses.
- **Support Ticket Resolution**: Manage and resolve student support requests.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Institutional Color Palette (KSRCT Navy `#0f2942`, KSRCT Orange `#f97316`)
- **Icons & Visualization**: Lucide Icons + Recharts for analytics
- **Routing & HTTP**: React Router v6 + Axios with JWT interceptors

### Backend
- **Runtime & Framework**: Node.js + Express.js + TypeScript
- **Database & ORM**: SQLite (for zero-config local execution) / PostgreSQL via **Prisma ORM**
- **Authentication**: JWT (JSON Web Tokens) + `bcryptjs` password hashing
- **Security & Uploads**: Helmet security headers, CORS, rate limiting, Multer file upload validation, path-traversal protection

---

## 🔑 Demo Login Credentials

The database comes pre-seeded with initial test accounts for instant demonstration:

| Role | Name | Email Address | Password | Department / Details |
| :--- | :--- | :--- | :--- | :--- |
| **STUDENT** | Prasanna M | `prasanna@student.ksrct.ac.in` | `Student@123` | Electrical and Electronics Engineering (EEE, III Year, Reg: 22EE123) |
| **HOD** | EEE HOD | `hod.eee@ksrct.ac.in` | `Hod@123` | Electrical and Electronics Engineering |
| **ADMIN** | System Administrator | `admin@ksrct.ac.in` | `Admin@123` | Administration |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### 1. Database Setup & Seeding
From the root directory:

```bash
cd server
npm install
npx prisma db push
npx ts-node prisma/seed.ts
```

### 2. Start Backend Server
```bash
npm run dev
# Running at http://localhost:5000
```

### 3. Start Frontend Client
In a separate terminal:

```bash
cd client
npm install
npm run dev
# Running at http://localhost:5173
```

Now open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🐳 Docker Support (Optional PostgreSQL Setup)

To run a PostgreSQL database container locally:

```bash
docker compose up -d
```

Update `server/.env`:
```env
DATABASE_URL="postgresql://ksrct_user:ksrct_password@localhost:5432/ksrct_certificate_db?schema=public"
```

Then update `server/prisma/schema.prisma` provider to `postgresql` and run `npx prisma db push`.

---

## 📂 Project Structure

```text
ksrct_certificate_portal/
├── client/                      # React + TypeScript + Vite Frontend
│   ├── public/assets/           # KSRCT logo & campus images
│   ├── src/
│   │   ├── components/          # Header, Sidebar, StatusBadge, CertificateViewerModal, Toast
│   │   ├── context/             # AuthContext, NotificationContext
│   │   ├── pages/               # Login, Student Dashboard, HOD Dashboard, Admin, Reports
│   │   ├── services/            # Axios API client
│   │   └── types/               # TypeScript interfaces
│   └── package.json
├── server/                      # Express + Node.js + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma database schema
│   │   └── seed.ts              # Database seeder script
│   ├── src/
│   │   ├── controllers/         # Auth, Certificate, Dashboard, User, Audit, Support
│   │   ├── middleware/          # Auth JWT, Role checks, Multer file upload
│   │   ├── routes/              # Express API routes
│   │   ├── utils/               # JWT, Prisma instance, Audit logger
│   │   └── index.ts             # Express server setup
│   └── package.json
├── uploads/certificates/        # Certificate file storage directory
├── docker-compose.yml           # PostgreSQL Docker service
├── .env.example                 # Environment variables reference
└── README.md
```

---

## 🧪 Acceptance Testing Checklist

1. **Authentication**: Verify Student, HOD, and Admin credentials. Verify invalid passwords fail.
2. **Student Workflow**: Upload PDF/PNG certificate. Verify status displays as `PENDING`.
3. **HOD Verification**: Login as HOD, view pending queue, open certificate preview, click **Approve** or **Reject** with mandatory remarks.
4. **Student Status Sync**: Switch back to student dashboard to confirm status updated to `APPROVED`/`REJECTED` along with instant notification.
5. **CSV Export & Audit**: Generate CSV export from HOD Reports and inspect Admin Audit Logs for activity records.

---

## 📜 License & Copyright

© 2026 K.S. Rangasamy College of Technology. All rights reserved.
