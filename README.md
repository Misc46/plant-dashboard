# Plant Control & Monitoring Dashboard

Real-time software-simulated monitoring and control platform for control-engineering plants (DC Motor Speed Control, Water Tank Level Control, Temperature Control System). Built with Next.js 15 App Router, TypeScript, Tailwind CSS, Firebase Authentication, Cloud Firestore, and Firebase Realtime Database.

## Features & Tech Stack Decisions

* **Framework**: Next.js 15 (App Router, TypeScript, `src/` directory structure)
* **Styling**: Tailwind CSS
* **Auth**: Firebase Auth (Email/Password provider) using Firebase Web SDK on the client side
* **Database (Structured Data)**: Cloud Firestore (`users` and `plants` collections)
* **Database (Telemetry Stream)**: Firebase Realtime Database for high-frequency `telemetry/{plantId}/{autoId}` readings
* **Server-side Firebase Access**: `firebase-admin` SDK used strictly inside Next.js API routes (`/api/tick`, `/api/auth/signup`, `/api/dashboard/summary`, `/api/plants/[id]/performance`)
* **Real-time Charting (uPlot over Recharts Rationale)**: `uPlot` was explicitly chosen for rendering the high-frequency plant telemetry stream. Unlike Recharts which re-renders complete DOM SVG subtrees per tick and degrades under fast time-series streams, uPlot utilizes raw Canvas rendering with bounded data array references, maintaining smooth 60fps telemetry rendering.
* **HTTP Client**: Axios (used explicitly for non-stream HTTP API route interactions like `/api/dashboard/summary` and `/api/tick`)
* **Input Validation**: Zod schemas for server API route validation

## Control Theory Performance Metrics

The `/api/plants/[id]/performance` API calculates standard step response metrics from telemetry recorded after `stepStartAt`:
1. **Rise Time ($T_r$)**: Elapsed time from step start until process variable ($PV$) crosses 90% of target delta toward step setpoint.
2. **Overshoot Percentage ($M_p$)**: $\frac{PV_{peak} - Setpoint}{Setpoint} \times 100\%$ when peak exceeds setpoint.
3. **Settling Time ($T_s$)**: Time required for $PV$ to enter and remain within a $\pm 5\%$ error band of the setpoint.

---

## Firebase Project Setup Steps

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and activate the **Email/Password** provider.
3. Enable **Cloud Firestore** in production mode. Apply security rules from `firestore.rules`.
4. Enable **Realtime Database** in locked mode. Apply security rules from `database.rules.json`.
5. Register a **Web App** inside your project to receive client config credentials.
6. Generate a **Service Account Key JSON** under **Project Settings → Service Accounts** for `firebase-admin` server access.

---

## Environment Variables Setup

Copy `.env.example` to `.env.local` in your root directory:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your Firebase web credentials and admin private key:

```env
# Client Web SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com

# Server Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## Running the Application & Seeding Data

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Seed Initial Firestore/Auth Data** (Admin user, Viewer user, 3 sample plants):
   ```bash
   npx tsx scripts/seed.ts
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Default Accounts

* **Admin User**: `admin@plant.local` / `admin123` (Full control, Start/Stop/Reset simulation, PID tuning, plant creation)
* **Viewer User**: `viewer@plant.local` / `viewer123` (Read-only monitoring; mutation controls strictly hidden in UI & blocked by Firestore/RTDB rules)

---

## Team Contributions

| Member | Role / Responsibilities |
| --- | --- |
| Placeholder | Architecture & Next.js Setup |
| Placeholder | Firebase Integration & Security Rules |
| Placeholder | PID Simulator & Performance Metrics |
