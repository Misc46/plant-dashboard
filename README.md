# Plant Control & Monitoring Dashboard

Real-time software-simulated monitoring and control platform for control-engineering plants (DC Motor Speed Control, Water Tank Level Control, Temperature Control System). Built with Next.js 16 App Router, TypeScript, Tailwind CSS v4, Firebase Authentication, Cloud Firestore, and Firebase Realtime Database.

## Features

* **Dashboard Overview**: Live aggregate telemetry across all plants (active/running/fault counts, average error & output), auto-refreshed every 3 s.
* **Plant Management**: Create plants from presets (DC Motor, Water Tank, Temperature) or fully custom first-order dynamics `G(s) = K / (τs + 1)`; live status cards with ESP badges and process-variable units; edit and delete.
* **Live Telemetry**: High-frequency real-time chart (uPlot on canvas, 60 fps) fed from the Firebase Realtime Database telemetry stream.
* **Simulation Control**: Start / Stop / Reset per plant, live setpoint control, and P / PI / PID controller selection with Kp, Ki, Kd gains.
* **Anti-windup**: Conditional-integration anti-windup for PI/PID controllers, toggleable per plant.
* **Bode Plot**: Frequency-response magnitude & phase plots computed from the same first-order dynamics used by the time-domain simulator.
* **Tuning Advisor**: IMC / Lambda tuning modal suggesting Kp, Ki, Kd for Aggressive / Balanced / Conservative closed-loop speeds — read-only, never mutates the plant.
* **Performance Metrics**: Step-response metrics (rise time, overshoot %, settling time ±5 % band) computed from telemetry recorded after a step change.
* **CSV Export**: One-click export of a plant's telemetry history.
* **ESP Hardware Mode**: Connect plants to real hardware through a Node-RED WebSocket broker (`connectionMode: "SIMULATED" | "ESP"`). Reference Node-RED flow and ESP32/Arduino sketch in `ESPSimulation/`.
* **Role-based Access**: Admin users get full control (start/stop/reset, tuning, plant creation); viewer users are read-only, with mutation controls hidden in the UI and blocked by Firestore/RTDB rules.

## Tech Stack Decisions

* **Framework**: Next.js 16 (App Router, TypeScript, `src/` directory structure, React 19)
* **Styling**: Tailwind CSS v4
* **Auth**: Firebase Auth (Email/Password provider) using the Firebase Web SDK on the client side
* **Database (Structured Data)**: Cloud Firestore (`users` and `plants` collections)
* **Database (Telemetry Stream)**: Firebase Realtime Database for high-frequency `telemetry/{plantId}/{autoId}` readings
* **Server-side Firebase Access**: `firebase-admin` SDK used strictly inside Next.js API routes (see below)
* **Real-time Charting (uPlot over Recharts)**: uPlot was explicitly chosen for rendering the high-frequency plant telemetry stream. Unlike Recharts, which re-renders complete DOM SVG subtrees per tick and degrades under fast time-series streams, uPlot uses raw canvas rendering with bounded data array references, maintaining smooth 60 fps telemetry rendering.
* **HTTP Client**: Axios for non-stream HTTP API route interactions
* **Input Validation**: Zod schemas for server API route validation
* **ESP Connectivity**: Native WebSocket client (`src/services/websocket.ts`) connecting to a Node-RED broker for ESP hardware plants

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/auth/signup` | Create a user account |
| `GET /api/dashboard/summary` | Aggregate telemetry summary for the overview page |
| `POST /api/tick` | Advance the simulation for a running plant |
| `GET/PATCH/DELETE /api/plants/[id]` | Plant read / update / delete |
| `POST /api/plants/[id]/reset` | Reset plant state (PV, controller state, telemetry) |
| `GET /api/plants/[id]/performance` | Step-response performance metrics |
| `GET /api/plants/[id]/export` | CSV export of telemetry history |

## Control Theory Performance Metrics

The `/api/plants/[id]/performance` API calculates standard step response metrics from telemetry recorded after `stepStartAt`:
1. **Rise Time ($T_r$)**: Elapsed time from step start until process variable ($PV$) crosses 90% of target delta toward step setpoint.
2. **Overshoot Percentage ($M_p$)**: $\frac{PV_{peak} - Setpoint}{Setpoint} \times 100\%$ when peak exceeds setpoint.
3. **Settling Time ($T_s$)**: Time required for $PV$ to enter and remain within a $\pm 5\%$ error band of the setpoint.

---

## ESP Hardware Mode

Plants created with `connectionMode: "ESP"` replace the in-app simulator with real hardware. The ESP32 runs a water-tank simulation, and a local Node-RED instance acts as the PID controller and message bridge.

```
ESP32 (PubSubClient + ArduinoJson)          Browser (this app)
        │  MQTT esp32plant/output                  │
        ▼                                        WebSocket ws://localhost:1880/ws/esp
  Node-RED (node-red-contrib-aedes broker) ◄──────┘  PID config (Kp, Ki, Kd, setpoint)
        │  MQTT esp32plant/control
        ▼
  ESP32 actuator (pump simulation)
```

Simulation files are in `ESPSimulation/`:

```
ESPSimulation/
├── NodeRedFlows.json                                # Node-RED PID routing flow & WebSocket bridge
└── WaterTankSimulation_NodeRed_TugasWebCaslabTekken.ino  # ESP32 firmware with water tank simulation
```

**Node-RED setup:**
1. Install Node-RED locally: <https://nodered.org/docs/getting-started/local>.
2. In the burger menu → **Manage palettes → Install**, add the `node-red-contrib-aedes` package (local MQTT broker).
3. Import `ESPSimulation/NodeRedFlows.json`, then click **Deploy**. Node-RED now serves the WebSocket bridge at `ws://localhost:1880/ws/esp`.

**ESP32 setup:**
1. Libraries: `PubSubClient` (Nick O'Leary) and `ArduinoJson` (Benoit Blanchon, v6.x or v7.x).
2. In the firmware, set `WIFI_SSID`, `WIFI_PASSWORD`, and `MQTT_BROKER` to the Wi-Fi network and the Node-RED machine's LAN IP.

**Known limitation (deployment):** The WebSocket broker URL is resolved **by the browser**, not the server. When the app is opened from a different device or accessed via the Vercel deployment, `ws://localhost:1880/ws/esp` points to *that visitor's* machine — not the one running Node-RED — so the connection fails. ESP hardware mode works out of the box only when the browser and Node-RED are on the same machine (e.g. `localhost` during a demo).

**Workarounds:**

- **Option A — Cloudflare Tunnel / ngrok (recommended for demos):** Expose your local Node-RED port with a public HTTPS URL, then set the `NEXT_PUBLIC_WS_BROKER_URL` environment variable in your Vercel project settings to the corresponding `wss://` address:
  ```
  # Vercel → Project Settings → Environment Variables
  NEXT_PUBLIC_WS_BROKER_URL=wss://your-subdomain.trycloudflare.com/ws/esp
  ```
  Start the tunnel with:
  ```bash
  cloudflared tunnel --url http://localhost:1880
  ```
  Convert the resulting `https://...` address to `wss://` and paste it as the variable value.

- **Option B — Host Node-RED in the cloud:** Deploy Node-RED to a VPS (e.g. DigitalOcean, Render, or Railway) with a domain and SSL certificate. Set `NEXT_PUBLIC_WS_BROKER_URL` to that permanent `wss://` address. Simulated plants are unaffected by either option.

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

# Node-RED WebSocket broker for ESP hardware plants (client-side, optional)
# Defaults to ws://localhost:1880/ws/esp; override with a wss:// tunnel or
# cloud Node-RED URL for deployed environments (see "ESP Hardware Mode").
NEXT_PUBLIC_WS_BROKER_URL=ws://localhost:1880/ws/esp
```

---

## Running the Application & Seeding Data

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Seed Initial Firestore/Auth Data** (Admin user, Viewer user, 6 sample plants covering every plant type, controller type, and connection mode):
   ```bash
   npx tsx scripts/seed.ts
   ```

   To wipe the database and rebuild it from scratch (clears plants, users, and telemetry; recreates the demo auth accounts):
   ```bash
   npx tsx scripts/clear.ts
   npx tsx scripts/seed.ts
   ```

3. **Migrate plant units** (only needed for plants created before the units feature):
   ```bash
   npx tsx scripts/sync-units.ts
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Default Accounts

* **Admin User**: `admin@plant.local` / `admin123` (Full control, Start/Stop/Reset simulation, PID tuning, plant creation)
* **Viewer User**: `viewer@plant.local` / `viewer123` (Read-only monitoring; mutation controls strictly hidden in UI & blocked by Firestore/RTDB rules)
