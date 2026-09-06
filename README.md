# TPLUS Management System

A web dashboard for managing an organization's IT assets — employees, equipment, software licenses, and related workflows — built as a React frontend for the TPLUS backend API.

## Features

**Authentication**
- Sign In / Create Account (new accounts require admin approval)
- Self-service "Forgot Password" flow: email → 6-digit verification code → new password
- Light/dark theme toggle, English/Lao language toggle

**Dashboard**
- Overview stat cards for every module the signed-in account has access to
- Equipment status breakdown (donut chart) and in-use-by-category breakdown (progress bars), built from live data
- Notifications panel and a recent activity feed of your own actions

**Workforce**
- Employees — records, department/position, equipment assigned
- Departments — with employee and equipment counts

**Hardware**
- Equipments — organized by category (Laptop, Desktop, PC, Monitor, Server, Network Device, CCTV, Access Control, Accessory), each with configurable columns and custom fields
- Assignation — assign / unassign equipment to employees
- Borrow — Currently Borrowed and Borrow History, with overdue tracking

**Replacement**
- Stock of spare parts (RAM, disks, CPUs, peripherals...)
- Borrow a Part
- Device Replacement and Device Replacement History

**Software & Security / Cloud**
- Software License tracking, with expiry alerts
- Server Usage records

**Operations**
- Managements — equipment and part statuses, equipment categories, and part types

**Administration**
- Report — cross-module reporting with PDF and Excel export
- Settings — one page with three tabs:
  - Users — accounts, permissions, password reset, email, delete
  - Activity Log — org-wide audit trail
  - Recycle Bin — restore deleted records

## Tech stack

- [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router v7](https://reactrouter.com/) for routing
- [react-i18next](https://react.i18next.com/) for English/Lao translations
- [react-icons](https://react-icons.github.io/react-icons/) (Feather icon set)
- Inter + Phetsarath (Lao) via `@fontsource`
- Plain JavaScript/JSX — no TypeScript
- PDF/Excel export via `jspdf` + `jspdf-autotable` and `write-excel-file`

## Getting started

### Prerequisites
- Node.js `^20.19.0` or `>=22.12.0` (required by Vite 8)
- A running instance of the TPLUS backend API

### Setup

```bash
# Install dependencies
npm install

# Configure the backend API URL
cp .env.example .env
# then edit .env and set VITE_API_BASE_URL to your backend's URL

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Other scripts

```bash
npm run build    # Production build to dist/
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

## Project structure

```
src/
├── App.jsx             # Routing shell
├── i18n.js             # react-i18next setup
├── pages/
│   ├── auth/           # login.jsx — Sign In / Create Account / Forgot Password
│   └── dashboard/      # Main app
│       ├── features/   # One folder per feature: employees, equipment, users,
│       │               # activity, recycle-bin, report, settings, ...
│       ├── hooks/      # Cross-cutting hooks (routing, notifications, search, permissions)
│       └── components/ # Shared UI (tables, dialogs, dropdowns, sidebar)
├── services/           # One file per API resource — all HTTP calls live here
├── lib/                # apiClient, permissions, i18n label helpers, activity log
├── locales/            # en.json / lo.json translation files
├── components/         # Theme and language toggles
└── hooks/              # App-level hooks (theme, language)
```

## Permissions

Access to each page is controlled per user account (Settings → Users → Permissions). Accounts without a permission for a page simply don't see it in the sidebar or on the Dashboard home. Some pages are additionally admin-only.

## Internationalization

All user-facing text goes through `react-i18next`. English and Lao translation files (`src/locales/en.json`, `src/locales/lo.json`) are kept in sync key-for-key.
