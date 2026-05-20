# Cake with Joy — Bakery Management System
## User Manual & Deployment Guide

---

**Document Information**

| Field | Details |
|---|---|
| System Name | Cake with Joy — Bakery Management System (BMS) |
| Version | 1.0 |
| Date | May 13, 2026 |
| Prepared by | Adrian Charles Vergara (Business Analyst) |
| System Analysis | Sheiyn Aldrei Inocencio, Matt Cañarejo (System Analysts) |
| QA / Validation | Ibarra Lorenzo Juanillo, Fredryk Llyod Abejero (QA) |
| Technical Support | Joseph Keem Baltazar, Luis Jay Galvez (Developers) |
| Supervised by | Anne Carol G. Jonson (Project Manager) |

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Roles & Access Levels](#2-user-roles--access-levels)
3. [Getting Started](#3-getting-started)
4. [Customer Guide](#4-customer-guide)
5. [Admin Guide](#5-admin-guide)
6. [Staff Guide](#6-staff-guide)
7. [Production / Baker Guide](#7-production--baker-guide)
8. [Sales Staff Guide](#8-sales-staff-guide)
9. [Deployment Guide](#9-deployment-guide)
10. [Troubleshooting & FAQs](#10-troubleshooting--faqs)

---

## 1. System Overview

**Cake with Joy** is a web-based Bakery Management System designed to streamline order processing, production scheduling, inventory tracking, staff management, and customer experience for a cake business. The system is accessible via any modern web browser and does not require a software installation.

**Live URL:** https://cakewjoy.vercel.app

**Technology Stack**

| Component | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Database | Firebase Realtime Database |
| Authentication | Firebase Authentication |
| Hosting | Vercel |
| Styling | Tailwind CSS, Inline Styles |

**Key Features at a Glance**
- Online cake ordering (custom cakes and ready-made)
- Real-time order status tracking for customers
- Admin order management with receipt printing
- Production scheduling and kitchen dashboard
- Inventory management with expiration tracking
- Staff management (add, deactivate, assign roles)
- Sales reports and analytics (PDF/print export)
- Customer support ticketing
- Store settings (payment QR codes, announcements)

---

## 2. User Roles & Access Levels

The system has six (6) distinct roles. Each role sees a different interface and navigation.

| Role | Description | Access |
|---|---|---|
| **Customer** | Places orders, tracks them, uploads payment proof | Customer homepage, Customize, Archive, Track Order, Support |
| **Guest** | Browses only — cannot order or track | Homepage, Customize (view only), Archive (view only) |
| **Admin** | Full system access | All modules |
| **Staff** | Assists in operations and inventory | Dashboard, Orders, Inventory, Schedule, Announcements |
| **Production** | Kitchen team — manages active production | Kitchen Dashboard, Orders, Inventory, Schedule, Announcements |
| **Baker** | Baking crew — production-focused | Dashboard, Orders, Schedule, Announcements |
| **Sales** | Front-line sales staff | Order Summary, Announcements |

> **Note:** Staff, Production, Baker, and Sales accounts must be created by an Admin. Accounts that are deactivated by an Admin will see a locked screen and cannot use the system until reactivated.

---

## 3. Getting Started

### 3.1 Accessing the System

1. Open a web browser (Google Chrome, Microsoft Edge, or Safari recommended).
2. Go to: **https://cakewjoy.vercel.app**
3. The Login page will appear.

### 3.2 Logging In

1. Enter your registered **Email Address** and **Password**.
2. Click **Sign In**.
3. The system will automatically redirect you to the correct dashboard based on your role.

### 3.3 Guest Browsing

If you do not have an account, click **"Browse as Guest"** on the Login page. Guests can view the homepage and browse available cakes but cannot place orders or track deliveries.

### 3.4 Logging Out

- Click your profile icon (top-right corner of the header) and select **Logout**, or
- Click the **Logout** button visible in the header when logged in.

---

## 4. Customer Guide

### 4.1 Browsing the Homepage

After logging in as a customer, you land on the **Home** page where you can:
- View featured cakes and promotions
- Navigate using the top tabs: **Home | Customize | Archive | Track Order | Support**

### 4.2 Ordering a Custom Cake

1. Click the **Customize** tab in the navigation bar.
2. Fill in the customization form:

   **a. Upload a Reference Image** *(optional)*
   - Click the image upload area and select a photo (JPG, PNG, WEBP, GIF supported).
   - This serves as a design reference for the baker.

   **b. Tier & Size**
   - Select the number of tiers (1-tier, 2-tier, 3-tier).
   - Each tier option shows its price.

   **c. Cake Flavor**
   - Choose from available flavors listed (e.g., Chocolate, Vanilla, Strawberry).

   **d. Icing / Frosting**
   - Select the type of icing (e.g., Fondant, Buttercream).

   **e. Add-ons**
   - Toggle add-ons such as edible prints, cake toppers, sugar flowers, etc.
   - Each add-on shows its additional price.

   **f. Special Instructions**
   - Type any custom message or design notes in the text field (e.g., "Write 'Happy Birthday Ana' in pink").

   **g. Rush Order Toggle**
   - Enable if you need the cake urgently. A **20% rush fee** is automatically added to the total.

3. Review the **Order Summary panel** on the right side showing the price breakdown.
4. Click **Add to Cart**.

> **Draft Saving:** The system automatically saves your customization draft. If you leave and come back, a prompt will ask if you want to restore your saved draft.

### 4.3 Browsing the Archive (Ready-Made Cakes)

1. Click the **Archive** tab.
2. Browse cakes by category using the filter buttons at the top.
3. Click a cake to view details.
4. Select quantity and click **Add to Cart**.

### 4.4 Viewing the Cart

1. Click the **cart icon** in the top-right header (shows the number of items).
2. The Cart page shows all items, quantities, subtotal, and any rush fees.
3. You can increase or decrease quantities, or remove items.
4. Click **Proceed to Checkout** when ready.

### 4.5 Checking Out

The checkout process has **3 steps**:

**Step 1 — Order Details**
- Enter your **Full Name** and **Phone Number**.
- Select your **Pickup Date** (minimum 2 days from today, maximum 30 days).
- Select your **Pickup Time**.
- Choose **Payment Type**:
  - **50% Deposit** — Pay half now, pay the balance on pickup.
  - **Full Payment** — Pay the entire amount upfront.

**Step 2 — Terms & Conditions**
- Read the bakery's terms carefully.
- Check the box to confirm you agree.
- Click **I Agree, Continue**.

**Step 3 — Payment**
- Scan the **GCash QR code** or follow the **BDO bank transfer** details shown.
- After sending payment, click **Upload Payment Screenshot**.
- Select the screenshot from your device.
- Click **Submit Order**.

> Upon submission, your order is sent to the admin for review. You will receive a real-time status update in the **Track Order** tab.

### 4.6 Tracking Your Order

1. Click the **Track Order** tab.
2. All your active orders appear as cards.
3. Each card shows:
   - Order ID
   - Current status badge (Pending, Confirmed, Baking, Quality Check, Ready, Completed)
   - Progress bar showing overall completion percentage
   - Step-by-step timeline with icons
   - Items ordered, total amount, and pickup details
4. Status updates happen in **real time** — you do not need to refresh the page.

**Order Statuses Explained:**

| Status | Meaning |
|---|---|
| Pending | Order submitted, awaiting admin review |
| Confirmed | Admin accepted your order; downpayment acknowledged |
| Baking | The kitchen is actively making your cake |
| Quality Check | Final inspection before it's ready |
| Ready for Pickup | Your cake is done — please come pick it up! |
| Completed | Order picked up and closed |
| Declined | Order was not accepted (reason will be shown) |

### 4.7 Viewing Your Receipt

Once your order is **Confirmed** or beyond:
1. Open the **Track Order** tab.
2. Find your order card.
3. Click the **Receipt** button (dark button with printer icon) next to the status badge.
4. A professional receipt will open in a new window.
5. Click **Print Receipt** to save or print it.

### 4.8 Paying the Remaining Balance (Ready for Pickup)

If you paid only the 50% deposit, when your order status changes to **Ready for Pickup**:
1. A yellow **Remaining Balance Due** panel appears in your order card.
2. The remaining amount is shown.
3. Send payment via GCash or bank transfer.
4. Click the **upload area** and select your payment screenshot.
5. Click **Submit Payment Proof**.
6. The admin will verify and update your order.

### 4.9 Clearing Completed / Declined Orders

- On **Completed** or **Declined** order cards, a **Clear** button appears.
- Click **Clear** → **Yes, clear** to remove it from your list.

### 4.10 Customer Support

1. Click the **Support** tab in the navigation.
2. Describe your concern and submit a support ticket.
3. The admin team will respond through the Support Management module.

### 4.11 Profile Page

- Click your profile icon (top-right) to access your Profile.
- View your account details.
- Click **Logout** to sign out.

---

## 5. Admin Guide

The Admin has the highest level of access and can manage all aspects of the system. After logging in, the Admin is directed to the **Admin Dashboard**.

### 5.1 Admin Navigation Tabs

| Tab | Description |
|---|---|
| Dashboard | Overview of orders, revenue, and quick stats |
| Orders | Manage all active and completed customer orders |
| Menu | Add, edit, or remove cake products and categories |
| Settings | Configure store info, payment QR codes |
| Pricing | Adjust pricing for sizes, tiers, flavors, and add-ons |
| Order Summary | Tabular view and summary cards of all orders |
| Inventory | Track ingredient stock and expiration dates |
| Staff | Add and manage employee accounts |
| Announcements | Post internal announcements to staff |
| Production Schedule | View and manage the baking calendar |
| Support | View and respond to customer support tickets |

### 5.2 Dashboard Overview

The dashboard displays:
- **Pending Orders** — orders waiting for admin action
- **Created & Confirmed Orders** — today's accepted orders
- **Low Stock Alerts** — ingredients running low
- **Today's Revenue** — total sales for the day
- **Orders in System** — total number of orders in the database
- **Recent Orders Table** — quick view of the latest orders with status
- **Reports & Analytics** — generate business reports

### 5.3 Generating Reports

1. From the Dashboard, click **Generate Report**.
2. A dialog appears:
   - **Report Type** — Select Daily, Weekly, Monthly, or Custom
   - **Date Range** — Pick start and end dates
   - **Format** — PDF or CSV
   - **Sections** — Select which sections to include (Executive Summary, Orders, Revenue, Inventory, Staff)
3. Click **Generate Report**.
4. The Report Preview opens in a scrollable modal.
5. Scroll through the report using your mouse or trackpad.
6. Click **Print Report** to open the browser print dialog.
7. Click **Download PDF/CSV** to save the file.

> **Report Sections:**
> - **Executive Summary** — KPIs (total revenue, orders, average order value, fulfillment rate), status breakdown table
> - **Order Details & Statistics** — order volume charts, status breakdown, top customers
> - **Revenue & Financial Analysis** — revenue trends, payment type distribution, pie chart
> - **Inventory** — stock levels, expiring items, critical low-stock alerts
> - **Staff Performance** — per-staff activity and performance table

### 5.4 Managing Orders (Orders Tab)

The Orders module has two sections: **Active Orders** and **Order Archive**.

**To Review a Pending Order:**
1. Click the **Orders** tab.
2. Find the order in the **Active Orders** table (status: Pending).
3. Click the **"..." menu** (three dots) on the right side of the order row.
4. Click **View Details** to see the full order: customer info, items, payment proof screenshot, and pickup details.

**To Confirm / Accept an Order:**
1. Click the **"..." menu** → **Update Status** or use the **Confirm Payment** button directly in the order row.
2. The system will:
   - Change the order status to **Confirmed**
   - Show a printable **Order Confirmation Receipt** modal
3. In the receipt modal, click **Print Receipt** to print or save a copy for your records.
4. Click **Close** to dismiss the receipt.

**To Decline an Order:**
1. Click the **"..." menu** → **Decline**.
2. Enter a reason for declining.
3. Click **Confirm Decline**.
4. The customer will see the decline reason in their order tracking.

**To Update Order Status:**
1. Click **Update Status** from the actions menu.
2. Select the new status: Baking → Quality Check → Ready for Pickup → Completed.
3. Click **Save**.
4. The customer's tracking page updates in real time.

**Adding an Internal Note:**
- Use the Internal Note field to add comments visible only to staff (not shown to customers).

**Estimated Completion Date:**
- Set an estimated completion date to show customers when to expect their order to be ready.

### 5.5 Menu Management

1. Click the **Menu** tab.
2. The Menu Management page shows all products grouped by category.

**To Add a New Product:**
1. Click **Add New Item**.
2. Fill in the product name, category, description, and price.
3. Upload a product image.
4. Click **Save**.

**To Edit a Product:**
1. Click the **edit icon** next to the product.
2. Update fields as needed.
3. Click **Save Changes**.

**To Delete a Product:**
1. Click the **delete icon** next to the product.
2. Confirm deletion in the dialog.

### 5.6 Pricing Management

1. Click the **Pricing** tab.
2. Adjust base prices for:
   - **Tier & Size options** (1-tier, 2-tier, 3-tier)
   - **Flavors** (add or remove flavor options and prices)
   - **Icing types** and prices
   - **Add-ons** (edible prints, toppers, flowers, etc.)
   - **Rush order fee percentage**
3. Click **Save Changes** after each section.

> All price changes reflect immediately in the customer's customization tool.

### 5.7 Store Settings

1. Click the **Settings** tab.
2. Manage the following:

**Payment QR Codes:**
- Upload a GCash QR code image.
- Enter the GCash number/label.
- Upload a BDO account QR or details.
- Click **Save Payment Settings**.

**Store Information:**
- Update store name, address, contact number, and operating hours.
- Click **Save**.

### 5.8 Inventory Management

1. Click the **Inventory** tab.
2. The inventory list shows all tracked ingredients with:
   - Item name
   - Total stock quantity
   - Expiration status (Critical / Expiring Soon / Good)
   - Low stock threshold

**To Add a New Item:**
1. Click **Add Inventory Item**.
2. Enter the item name and low-stock threshold.
3. Click **Save**.

**To Add Stock (New Batch):**
1. Click on an inventory item to expand it.
2. Enter the batch quantity and expiration date.
3. Click **Add Stock**.

**To Edit Low-Stock Threshold:**
1. Click the edit icon on any item.
2. Update the threshold quantity.
3. Click **Save**.

> Items with stock at or below the threshold will be flagged as **Low Stock** and shown as an alert on the Admin Dashboard.

### 5.9 Staff Management

1. Click the **Staff** tab.
2. The Staff Management page lists all registered staff accounts.

**To Add a New Staff Member:**
1. Click **Add Staff**.
2. Enter:
   - Full Name
   - Email Address
   - Temporary Password
   - Role (Staff / Production / Baker / Sales)
3. Click **Create Account**.
4. The new employee can log in immediately using those credentials.

**To Edit a Staff Member's Role:**
1. Click the **edit icon** next to the staff member.
2. Change the role using the dropdown.
3. Click **Save**.

**To Deactivate / Reactivate a Staff Account:**
1. Click the **toggle switch** next to the staff member's name.
2. Deactivated accounts will see a "Your account has been deactivated" screen upon login.

### 5.10 Announcements

1. Click the **Announcements** tab.
2. Post store-wide announcements visible to all internal staff.
3. Enter the announcement title and body.
4. Click **Post**.
5. All staff members will see it in their **Announcements** tab.

### 5.11 Production Schedule

1. Click the **Production Schedule** tab.
2. View a calendar showing all scheduled orders by pickup date.
3. Use this to plan kitchen workloads and avoid scheduling conflicts.

### 5.12 Support Management

1. Click the **Support** tab.
2. View all support tickets submitted by customers.
3. Click a ticket to read the customer's message.
4. Type a reply and click **Send**.
5. Mark tickets as resolved when addressed.

---

## 6. Staff Guide

Staff members have operational access focused on helping the kitchen and tracking orders.

### 6.1 Staff Navigation Tabs

| Tab | Description |
|---|---|
| Dashboard | Kitchen production overview |
| Order Summary | Table view of all current orders |
| Inventory | View and update ingredient stock |
| Announcements | Read announcements from admin |
| Production Schedule | View the baking calendar |

### 6.2 Kitchen Dashboard (Staff)

The dashboard shows:
- All active orders and their current baking stages
- Orders grouped by status (Confirmed, Baking, Quality Check)
- Quick action buttons to advance an order to the next stage

### 6.3 Order Summary

- View all orders in a summarized card/table format.
- Filter by status or date.
- Use this to coordinate with the admin on priorities.

### 6.4 Inventory (Staff)

- View current stock levels.
- Add new stock batches when ingredients are restocked.
- Flag items that are running low or expired.

### 6.5 Production Schedule (Staff)

- View the calendar to see orders due on each date.
- Plan daily baking tasks based on the schedule.

---

## 7. Production / Baker Guide

Production and Baker accounts are kitchen-focused roles.

### 7.1 Navigation

| Role | Tabs Available |
|---|---|
| Production | Kitchen Dashboard, Orders, Inventory, Schedule, Announcements |
| Baker | Dashboard, Orders, Schedule, Announcements |

### 7.2 Kitchen Dashboard

- Shows orders currently in the **Baking** and **Quality Check** stages.
- Each order card displays: customer name, items, tier/flavor/icing details, pickup date, and special instructions.
- Click **Mark as Done** (or the relevant action button) to advance the order status.

### 7.3 Production Schedule

- Calendar view of all upcoming orders with their pickup dates.
- Helps the baker plan how many cakes to prepare per day.
- Click a date to see the orders due on that day.

---

## 8. Sales Staff Guide

Sales accounts have a simplified view focused on order monitoring.

### 8.1 Navigation

| Tab | Description |
|---|---|
| Orders | View and monitor all active orders |
| Announcements | Read internal announcements |

### 8.2 Order Summary

- View all current orders in a table format.
- Monitor order statuses in real time.
- Cannot modify orders — read-only access.

---

## 9. Deployment Guide

This section covers how to build and deploy the Cake with Joy BMS to Vercel.

### 9.1 Prerequisites

Ensure the following are installed on the developer's machine:

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18.x or higher | JavaScript runtime |
| npm | 9.x or higher | Package manager |
| Git | Any recent | Version control |
| Vercel CLI | Latest (`npm i -g vercel`) | Deployment tool |

### 9.2 Environment Setup

1. Clone the repository or ensure you are in the project directory:
   ```
   /Users/luis/Documents/BMS
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Verify Firebase configuration in `src/config/firebase.ts`. The file should contain valid Firebase project credentials (apiKey, authDomain, databaseURL, etc.).

### 9.3 Running the System Locally (Development)

1. Start the local development server:
   ```
   npm run dev
   ```
2. Open a browser and go to: `http://localhost:5173`
3. The system reloads automatically when source files are changed.

### 9.4 Building for Production

1. Run the production build:
   ```
   npm run build
   ```
2. The compiled output is placed in the `build/` folder.
3. Verify the build succeeded — you should see no TypeScript errors and the output will list file sizes.

### 9.5 Deploying to Vercel

The project is deployed using the Vercel CLI directly from the pre-built `build/` folder.

**Step 1 — Link the project to Vercel (first time only or if the `.vercel` folder is missing):**
```
rm -rf build/.vercel
cd build
npx vercel link --project cakewjoy --yes
```

**Step 2 — Deploy to production:**
```
npx vercel --prod --yes
```

**Expected output:**
```
Aliased: https://cakewjoy.vercel.app
```

> **Important:** Always run `rm -rf build/.vercel` before linking to avoid deploying to the wrong Vercel project.

### 9.6 Vercel Project Details

| Setting | Value |
|---|---|
| Project Name | cakewjoy |
| Organization | wisjays-projects |
| Production URL | https://cakewjoy.vercel.app |
| Project ID | prj_Fk9GOcFpDtTwQmvhRFRk1Z4jcDtM |
| Node Version | 24.x |
| Framework | Static (Vite pre-built output) |
| Build Command | None (pre-built) |
| Output Directory | `.` (inside `build/`) |

### 9.7 Firebase Database Structure

The system uses Firebase Realtime Database with the following key paths:

| Path | Description |
|---|---|
| `/allOrders/{orderId}` | All orders (admin-level view) |
| `/orders/{customerId}/{orderId}` | Orders per customer |
| `/inventory/{itemId}` | Inventory items with batches |
| `/users/{uid}` | User profiles and roles |
| `/paymentQR` | GCash and BDO QR code images |
| `/announcements/{id}` | Staff announcements |
| `/support/{ticketId}` | Customer support tickets |
| `/menu/{itemId}` | Menu/product catalog |
| `/pricing` | Custom pricing configuration |

### 9.8 Firebase Security Rules

Ensure Firebase Realtime Database rules are configured to:
- Allow authenticated users to read their own orders (`/orders/{uid}`)
- Allow admins (role = "admin") to read/write all paths
- Restrict unauthenticated writes to prevent abuse

### 9.9 Updating the System

To push a code update:

1. Make changes to the source files in `src/`.
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Deploy:
   ```
   rm -rf build/.vercel
   cd build
   npx vercel link --project cakewjoy --yes
   npx vercel --prod --yes
   ```

---

## 10. Troubleshooting & FAQs

### Q: I can't log in. What do I do?
**A:** Double-check your email and password. If you are a staff/admin, make sure your account has not been deactivated. Contact the system administrator if the issue persists.

### Q: I submitted my order but nothing happened.
**A:** Check your internet connection. If the page loaded successfully, your order was likely submitted. Go to **Track Order** to confirm. If nothing appears after 1 minute, try refreshing the page and resubmitting.

### Q: My order status has not changed for a long time.
**A:** Orders are reviewed by the admin during business hours. If you need an urgent update, use the **Support** tab to submit a ticket.

### Q: I uploaded the wrong payment screenshot. Can I change it?
**A:** After submitting, payment screenshots cannot be changed from the customer side. Please contact the bakery via the **Support** tab or call directly to request a correction.

### Q: The receipt/print button opens a blank window.
**A:** Your browser may be blocking pop-ups. Allow pop-ups for `cakewjoy.vercel.app` in your browser settings, then try again.

### Q: The system loads slowly.
**A:** A known performance consideration is the size of uploaded images stored in the database. Avoid uploading very large image files. The system automatically compresses images, but slower connections may still experience some delay.

### Q: Staff cannot see the admin tabs.
**A:** Staff roles are limited by design. Only accounts with the **Admin** role have access to all tabs. Contact the admin to adjust your role if needed.

### Q: Vercel deployment went to the wrong project.
**A:** Run `rm -rf build/.vercel` and re-link using `npx vercel link --project cakewjoy --yes` before deploying again.

### Q: The report PDF is blank or missing colors.
**A:** When saving as PDF from the browser print dialog, make sure **"Background graphics"** (Chrome) or **"Print backgrounds"** (Edge/Safari) is enabled in the print settings. This ensures colored headers and chart areas print correctly.

### Q: The report modal won't scroll.
**A:** Click anywhere inside the report preview area first to focus it, then scroll using the mouse wheel or trackpad. The scroll area becomes active after a single click.

---

## Appendix A — Order Status Flow

```
[Customer Places Order]
         |
         v
      PENDING
    (Admin Review)
    /           \
CONFIRMED      DECLINED
    |
    v
  BAKING
    |
    v
QUALITY CHECK
    |
    v
READY FOR PICKUP
(Customer pays remaining balance if applicable)
    |
    v
  COMPLETED
```

## Appendix B — Payment Flow

```
Customer selects payment type:
  ┌─────────────────┐     ┌──────────────────┐
  │  50% Deposit    │     │  Full Payment    │
  └────────┬────────┘     └────────┬─────────┘
           |                       |
     Pay 50% now            Pay 100% now
     via GCash/BDO          via GCash/BDO
           |                       |
     Upload screenshot       Upload screenshot
           |                       |
     Admin confirms          Admin confirms
           |                       |
     Status → Confirmed      Status → Confirmed
           |
     [When order is READY]
           |
     Pay remaining 50%
     via GCash/BDO
           |
     Upload proof
           |
     Admin verifies
           |
     Status → Completed
```

## Appendix C — Supported Browsers

| Browser | Minimum Version | Notes |
|---|---|---|
| Google Chrome | 90+ | Recommended |
| Microsoft Edge | 90+ | Recommended |
| Safari | 14+ | Supported |
| Mozilla Firefox | 88+ | Supported |
| Mobile Chrome (Android) | Latest | Supported |
| Mobile Safari (iOS) | iOS 14+ | Supported |

---

*End of User Manual*

*Cake with Joy — Bakery Management System v1.0*
*Confidential — Internal Use Only*
