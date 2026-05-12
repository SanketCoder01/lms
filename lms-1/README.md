# DMAICPRO / LeaseOS – Property & Lease Management ERP System

DMAICPRO is a comprehensive, multi-tenant SaaS-based Property and Lease Management ERP platform. It is designed specifically for malls, commercial buildings, real estate firms, and property management companies to streamline their operations. The software centralizes everything from tracking property units and managing tenant leases to handling complex rent calculations and generating financial reports. By bringing property owners, tenants, and management teams into a single digital ecosystem, DMAICPRO eliminates manual errors and saves thousands of hours in administrative work.

---

## Project Overview

DMAICPRO serves as a unified system that handles the entire lifecycle of property management. Users can easily manage their properties, track which units are occupied or vacant, and onboard tenants and owners without hassle. The system automates complex lease agreements, including automatic rent escalations and revenue-sharing calculations. Furthermore, it completely digitizes the invoicing and collections process, maintaining a highly accurate rent ledger that tracks every outstanding balance. Administrators get real-time insights through interactive dashboards, making it effortless to manage all business operations from one secure place.

---

## Core Features

* **Multi-Tenant Architecture:** The system allows multiple companies to operate independently on the same platform, ensuring that every organization's data remains completely private and isolated.
* **Role-Based Access:** Administrators can assign specific roles to users, ensuring that staff members only have access to the screens and data necessary for their daily jobs.
* **Property & Unit Management:** Users can digitally map out their entire building, defining projects, floors, and individual units, while tracking their exact occupancy status in real time.
* **Lease Management:** Create detailed rental agreements that automatically track lock-in periods, lease start and end dates, and tenant details to avoid manual tracking.
* **Rent Calculation Models:** Easily configure various rent structures, including standard Fixed Rent, Minimum Guarantee (MG), or advanced Revenue Share billing based on tenant sales.
* **Invoice Generation & Distribution:** Automate the creation of monthly rent invoices, complete with professional PDF generation and automated email distribution to tenants.
* **Collections & Settlements:** Record tenant payments quickly, handle partial payments, and automatically settle outstanding invoices to keep financial records accurate.
* **Rent Ledger & Debtors Aging:** Maintain a crystal-clear ledger of all financial transactions, allowing management to track aging debt and see exactly who owes money over 30, 60, or 90 days.
* **GST & TDS Handling:** Built-in compliance tools ensure that all invoices properly calculate GST taxes and allow for easy TDS (Tax Deducted at Source) adjustments during payment collection.
* **Audit Logs & Security:** Every critical action taken in the system is logged, providing management with a transparent trail of who updated data and when.
* **Real-Time Dashboard & Analytics:** High-level interactive dashboards provide management with instant insights into collection trends, leasing performance, and upcoming lease expirations.

---

## System Workflow

The business workflow in DMAICPRO is designed to follow a logical, step-by-step path that mirrors real-world property management operations:

Owner & Tenant Setup
↓
Project & Unit Creation
↓
Lease Creation
↓
Invoice Generation
↓
Collections & Settlement
↓
Rent Ledger Update
↓
Dashboard & Reports

1. First, basic profiles for the property Owners and Tenant Brands are added into the system.
2. Next, the physical buildings (Projects) and individual shops or offices (Units) are created.
3. A Lease agreement is then generated, linking a Tenant to a specific Unit with agreed rent rules.
4. Every month, the system generates accurate Invoices based on the active lease terms.
5. When the tenant pays, the Collections module settles the payment against the invoice.
6. The Rent Ledger is automatically updated to reflect the new balance and clear any debts.
7. Finally, management views these real-time updates through the Dashboard and Reports.

---

## Module-Wise Explanation

### Dashboard
The Dashboard serves as the central command center for property managers. It features interactive KPI cards that immediately display total revenue, outstanding collections, and occupancy rates. Visual aging charts help management quickly identify overdue payments across different timeframes. Furthermore, the dashboard provides automated lease alerts, notifying the team well in advance about upcoming lease expirations or scheduled rent escalations. This ensures that no critical dates are missed and property revenue is maximized.

### Master Data
The Master Data module is the foundational layer where all core business entities are established. Here, management sets up their entire real estate portfolio, including large-scale projects and individual leasable units. It also acts as a centralized directory for all external parties, securely storing the contact and financial details of property owners and tenant companies. By centralizing this information, the system eliminates duplicate data entry and ensures that all subsequent modules pull from a single, accurate source of truth.

### Lease Management
Lease Management handles the complete lifecycle of a rental contract from signature to termination. Users can easily input complex lease terms, including standard fixed rent, percentage-based revenue sharing, and minimum guarantee clauses. The module strictly tracks critical compliance dates, such as lock-in periods where tenants cannot terminate the agreement. Additionally, it automates rent escalations, ensuring that yearly percentage increases are accurately applied without relying on manual calendar reminders or spreadsheets.

### Invoicing
The Invoicing module acts as an automated financial engine that generates monthly rent bills with total accuracy. It consolidates multiple charges—such as base rent, common area maintenance, and taxes—into a single, easy-to-read document for the tenant. The system automatically calculates complex tax structures like GST based on the latest compliance rules. Once generated, the system creates professional, branded PDF documents that can be directly emailed to the tenant's registered contact address with a single click.

### Collections
The Collections module is designed to streamline the reception and reconciliation of tenant payments. When a payment is received, users can easily log the transaction, even accommodating partial payments that leave a remaining balance. The system features smart auto-adjustment, automatically settling payments against the oldest outstanding invoices first. It also gracefully handles tax deductions like TDS, ensuring the final financial settlement is perfectly balanced and professional payment receipts are instantly generated.

### Rent Ledger
The Rent Ledger is the ultimate financial tracking tool that provides total visibility into tenant accounts. It maintains a running statement of every charge, payment, and adjustment, acting just like a bank statement for each lease. The module includes sophisticated debtor aging tools that categorize unpaid balances into 30, 60, and 90-day buckets for easier collection follow-ups. Additionally, it generates comprehensive owner reports, providing property investors with transparent insights into their asset's financial performance.

---

## Architecture

DMAICPRO is built on a modern, secure, and highly scalable cloud architecture. The system separates the user interface from the underlying business logic and database, ensuring fast performance and easy maintenance. Data isolation is treated with the highest priority; the database uses advanced security policies to guarantee that one company can never access another company's records.

Frontend (User Interface)
↓
API Layer (Secure Communication)
↓
Business Logic (Rent & Invoice Processing)
↓
PostgreSQL / Supabase (Secure Data Storage)

The platform utilizes a Multi-Tenant architecture combined with strict Row Level Security (RLS) policies. This means that every single database query automatically verifies the user's company ID. Even if an unauthorized request reaches the database, the RLS policies physically block the data from being returned, ensuring total workspace isolation and enterprise-grade data security.

---

## Tech Stack

**Frontend**
* React.js
* TypeScript
* Tailwind CSS
* ShadCN UI

**Backend**
* Node.js / Express
* Supabase Edge Functions

**Database**
* PostgreSQL (via Supabase)

**Authentication**
* Supabase Auth (JWT)

**Hosting**
* Hostinger (VPS for Backend)
* Vercel (Frontend)
* Supabase (Backend/Database)

---

## Installation & Setup

Follow these simple steps to get the project running on your local machine:

### 1. Clone Repository
Download the source code to your computer using Git.
```bash
git clone REPO_URL
```

### 2. Install Dependencies
Install all the necessary software libraries required to run the application.
```bash
npm install
```

### 3. Start Development Server
Launch the application in development mode to see it running live on your browser.
```bash
npm run dev
```

### 4. Build Project
Compile the application into a highly optimized version ready for production deployment.
```bash
npm run build
```

---

## Environment Variables

To connect the application to the database and services, you need to create a `.env` file in the root directory. Add the following variables (these examples are populated from your current configuration):

```env
PORT=5000
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL=https://dpohejqepiyqpauycvyb.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Legacy JWT Fallback
JWT_SECRET=lms_jwt_fallback_2026
```
*Note: You can obtain your Supabase keys from your Supabase Project Dashboard under Settings > API.*

---

## Database Setup

Setting up the database involves configuring your Supabase project to handle our relational data. First, create a new project in Supabase, which instantly provisions a scalable PostgreSQL database. Next, you will need to run the provided SQL migration scripts to create the necessary tables for projects, units, leases, and invoices. Finally, enable Row Level Security (RLS) policies on all tables. These policies are critical as they use the authenticated user's ID to filter data, ensuring that multi-tenant security is strictly enforced at the database level.

---

## Invoice & Collections Flow

The financial lifecycle begins when the system evaluates active leases to automatically generate monthly invoices, accurately applying rent rules and GST calculations. Once the invoice is approved and sent, the tenant makes a payment which is recorded in the Collections module. During collection, the staff can allocate the payment to fully or partially settle the outstanding invoice, making necessary adjustments for taxes like TDS. Instantly, the Rent Ledger updates to reflect the new zero or reduced balance, and the aging reports are adjusted in real-time, giving management a perfect view of current cash flow.

---

## Security Features

Security is paramount in DMAICPRO. We utilize JWT (JSON Web Token) Authentication to securely verify the identity of every user logging into the system. Row Level Security (RLS) enforces tenant isolation at the deepest database level, making cross-company data leakage impossible. Furthermore, Role-Based Access Control (RBAC) restricts internal staff from viewing sensitive financial data unless authorized. Every financial transaction and lease modification is strictly tracked to prevent tampering and ensure complete auditability.

---

## Dashboard & Reports

Our comprehensive reporting suite gives stakeholders immediate visibility into business health. The Dashboard provides high-level collection analytics, comparing expected revenue against actual payments received. Debtor aging reports highlight overdue accounts, allowing the collection team to focus their efforts efficiently. Tenant statements can be generated on demand to resolve payment disputes, while specialized owner reports provide property investors with clear, professional summaries of their rental yields and outstanding dues.

---

## Deployment

Deploying DMAICPRO is a streamlined process designed for modern cloud infrastructure. The React frontend is deployed seamlessly on Vercel, which provides a fast, globally distributed content delivery network (CDN) for a snappy user experience. The backend services and the PostgreSQL database are hosted securely on Supabase, which automatically handles daily backups and scalability. Pushing code updates simply requires a commit to the main branch, triggering automated build and deployment pipelines for zero-downtime updates.

---

## Future Enhancements

* WhatsApp Integration
* Payment Gateway
* AI Analytics
* Mobile Application
* Automated Reminders
* Auto Bank Reconciliation

---

## Contributors

* Sanket Gaikwad
* Prenaya Softtech
