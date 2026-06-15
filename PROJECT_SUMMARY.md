# Laundry POS SaaS - Project Documentation

## 1. Executive Summary
The **Laundry POS SaaS** is a specialized management platform built for modern laundry and dry-cleaning businesses. It transitions traditional manual workflows into a streamlined, digital POS experience. The system is designed with a multi-tenant architecture, allowing for future scaling to multiple stores while maintaining a high-performance local data layer using SQLite.

## 2. Technology Stack
*   **Frontend**: Next.js 15 (App Router)
*   **Styling**: Vanilla CSS (Custom Design System)
*   **Database**: SQLite via Prisma 6.0
*   **Logic**: Server Actions for Database Mutations
*   **Deployment**: Docker (Standalone Output) & GitHub Actions CI/CD

---

## 3. Current Functional State

### 🛒 Point of Sale (POS)
*   **Tap-to-Add Interface**: Interactive product cards that add items to the cart on click.
*   **Visual Feedback**: Border highlights and quantity badges on active cards.
*   **Smart Stepper**: Quantity controls that only appear when an item is in the cart.
*   **Category Filtering**: Quick-access pills to filter services (e.g., Bedding, Formal, Everyday).
*   **Dynamic Receipts**: Real-time generation of receipts with store branding and calculated tax.

### 👥 Customer & Debt Management
*   **Quick Registration**: Inline customer creation directly within the POS sidebar.
*   **Receivables Tracking**: Support for "Pay Later" orders, automatically logged against the customer's ledger.
*   **Financial Health**: A dedicated dashboard for tracking total spent vs. amount owed per customer.
*   **Debt Settlement**: A reconciliation system that applies payments to the oldest outstanding orders first (FIFO).
*   **Security**: "Pay Later" is strictly disabled for anonymous "Walk-in" customers to prevent unrecoverable debt.

### 📦 Product & Store Management
*   **Modular Redesign**: A tabbed management interface for Products and Categories.
*   **Inventory Control**: CRUD operations for laundry services with custom icons and pricing.
*   **Live Settings**: Global synchronization of store name and tax rates across all modules.

---

## 4. Chronological Change Log

### **Phase 1: Foundation & Core POS**
*   Initialized Next.js architecture and Prisma schema.
*   Created the primary POS interface with cart state management.
*   Implemented `createOrder` action to persist transactions to SQLite.

### **Phase 2: Management & Persistence**
*   Built the **Customer Management** table with spent/owed calculations.
*   Developed the **Product Manager** with tabbed views for Services and Categories.
*   Implemented global settings for Store Name and Tax Rate propagation.

### **Phase 3: Financial Logic & Receivables**
*   Added `paymentMethod` (CASH vs RECEIVABLE) to the Order model.
*   Created the **Receivables Collection** workflow, allowing staff to record partial or full payments.
*   Implemented "Pay Later" restrictions and logic to ensure data integrity.

### **Phase 4: Dashboard & UX Overhaul**
*   **Dashboard Redesign**: Replaced static cards with 6 live KPI cards (Revenue trends, Order counts, Receivables alerts).
*   **POS Refinement**: Implemented "Tap-to-Add" cards and qty badges for a professional retail feel.
*   **Walk-in Fix**: Standardized name normalization to prevent duplicate "Walk-in" entries in the database.

### **Phase 5: DevOps & Deployment**
*   Configured `next.config.ts` for **standalone output**.
*   Created a multi-stage **Dockerfile** for production-ready containerization.
*   Wrote `docker-compose.yml` with persistent volume mounting for the SQLite database.
*   Established a full **GitHub Actions** CI/CD pipeline for automated linting, building, and SSH deployment.

---

## 5. Deployment Instructions
To deploy this application, ensure the following secrets are set in GitHub:
*   `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`
*   `GITHUB_TOKEN` (provided by GitHub)

Run locally with Docker:
```bash
docker-compose -f docker-compose.dev.yml up --build
```
