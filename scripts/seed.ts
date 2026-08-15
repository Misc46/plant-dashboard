import "./load-env";
import { adminAuth, adminDb } from "../src/lib/firebase/admin";
import type { PlantData } from "../src/lib/simulator";


async function seed() {
  console.log("Starting Firebase seed script...");

  const adminEmail = "admin@plant.local";
  const adminPass = "admin123";
  const viewerEmail = "viewer@plant.local";
  const viewerPass = "viewer123";

  // 1. Create ADMIN User
  let adminUid: string;
  try {
    const existingAdmin = await adminAuth.getUserByEmail(adminEmail);
    adminUid = existingAdmin.uid;
    console.log(`Admin user existing: ${adminUid}`);
  } catch {
    const newAdmin = await adminAuth.createUser({
      email: adminEmail,
      password: adminPass,
    });
    adminUid = newAdmin.uid;
    console.log(`Created Admin user: ${adminUid}`);
  }

  await adminDb.collection("users").doc(adminUid).set({
    email: adminEmail,
    role: "ADMIN",
    createdAt: Date.now(),
  });

  // 2. Create VIEWER User
  let viewerUid: string;
  try {
    const existingViewer = await adminAuth.getUserByEmail(viewerEmail);
    viewerUid = existingViewer.uid;
    console.log(`Viewer user existing: ${viewerUid}`);
  } catch {
    const newViewer = await adminAuth.createUser({
      email: viewerEmail,
      password: viewerPass,
    });
    viewerUid = newViewer.uid;
    console.log(`Created Viewer user: ${viewerUid}`);
  }

  await adminDb.collection("users").doc(viewerUid).set({
    email: viewerEmail,
    role: "VIEWER",
    createdAt: Date.now(),
  });

  // 3. Create sample plants covering every plant type, controller type, and
  // connection mode, with built-in educational contrasts (PID vs P-only,
  // anti-windup on vs off, simulated vs ESP hardware).
  const now = Date.now();
  const samplePlants: Omit<PlantData, "id">[] = [
    {
      name: "DC Motor Speed Loop",
      type: "DC_MOTOR",
      controllerType: "PID",
      kp: 2.0,
      ki: 0.5,
      kd: 0.1,
      setpoint: 1200,
      samplingPeriodMs: 500,
      outputMin: 0,
      outputMax: 100,
      antiWindup: true,
      unit: "RPM",
      status: "STOPPED",
      connectionMode: "SIMULATED",
      stepStartAt: null,
      stepStartSetpoint: null,
      createdBy: adminUid,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "DC Motor Proportional-Only",
      type: "DC_MOTOR",
      controllerType: "P",
      kp: 2.0,
      ki: 0.0,
      kd: 0.0,
      setpoint: 1200,
      samplingPeriodMs: 500,
      outputMin: 0,
      outputMax: 100,
      antiWindup: false,
      unit: "RPM",
      status: "STOPPED",
      connectionMode: "SIMULATED",
      stepStartAt: null,
      stepStartSetpoint: null,
      createdBy: adminUid,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Water Tank Level Control",
      type: "WATER_TANK",
      controllerType: "PI",
      kp: 1.5,
      ki: 0.2,
      kd: 0.0,
      setpoint: 75,
      samplingPeriodMs: 500,
      outputMin: 0,
      outputMax: 100,
      antiWindup: true,
      unit: "cm",
      status: "STOPPED",
      connectionMode: "SIMULATED",
      stepStartAt: null,
      stepStartSetpoint: null,
      createdBy: adminUid,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Water Tank Level (ESP Hardware)",
      type: "WATER_TANK",
      controllerType: "PI",
      kp: 1.2,
      ki: 0.15,
      kd: 0.0,
      setpoint: 60,
      samplingPeriodMs: 500,
      outputMin: 0,
      outputMax: 100,
      antiWindup: true,
      unit: "cm",
      status: "STOPPED",
      connectionMode: "ESP",
      stepStartAt: null,
      stepStartSetpoint: null,
      createdBy: adminUid,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Thermal Furnace Temperature",
      type: "TEMPERATURE",
      controllerType: "PID",
      kp: 3.5,
      ki: 0.1,
      kd: 0.8,
      setpoint: 180,
      samplingPeriodMs: 500,
      outputMin: 0,
      outputMax: 100,
      antiWindup: false,
      unit: "°C",
      status: "STOPPED",
      connectionMode: "SIMULATED",
      stepStartAt: null,
      stepStartSetpoint: null,
      createdBy: adminUid,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Custom First-Order Loop",
      type: "CUSTOM",
      controllerType: "PID",
      kp: 1.2,
      ki: 0.3,
      kd: 0.05,
      setpoint: 50,
      samplingPeriodMs: 500,
      outputMin: 0,
      outputMax: 100,
      transferGain: 2.5,
      timeConstantTau: 5.0,
      antiWindup: true,
      unit: "V",
      status: "STOPPED",
      connectionMode: "SIMULATED",
      stepStartAt: null,
      stepStartSetpoint: null,
      createdBy: adminUid,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const plant of samplePlants) {
    const existing = await adminDb
      .collection("plants")
      .where("name", "==", plant.name)
      .limit(1)
      .get();
    if (!existing.empty) {
      console.log(`Plant already exists, skipping: ${plant.name}`);
      continue;
    }
    const ref = await adminDb.collection("plants").add(plant);
    console.log(`Created plant document: ${plant.name} -> ID: ${ref.id}`);
  }

  console.log("Seeding completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
