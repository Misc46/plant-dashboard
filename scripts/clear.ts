import "./load-env";
import { adminAuth, adminDb, adminRtdb } from "../src/lib/firebase/admin";

/**
 * Wipes the demo database so the seed script can rebuild it from scratch.
 *
 * Deletes every document in the Firestore `plants` and `users` collections,
 * removes the RTDB `telemetry` stream, and deletes only the two demo auth
 * accounts created by the seed script (admin@plant.local, viewer@plant.local).
 * Real user accounts are never touched.
 */

const DEMO_EMAILS = ["admin@plant.local", "viewer@plant.local"];

async function clearCollection(collectionName: string): Promise<number> {
  const snapshot = await adminDb.collection(collectionName).get();
  const docs = snapshot.docs;
  console.log(`Clearing Firestore ${collectionName}: ${docs.length} document(s)`);

  // Firestore batches are limited to 500 writes per commit.
  for (let i = 0; i < docs.length; i += 400) {
    const batch = adminDb.batch();
    docs.slice(i, i + 400).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  return docs.length;
}

async function clearRtdbTelemetry(): Promise<number> {
  const ref = adminRtdb.ref("telemetry");
  const snapshot = await ref.once("value");
  const readingCount = snapshot.numChildren();
  await ref.remove();
  console.log(`Cleared RTDB telemetry: ${readingCount} plant stream(s) removed`);
  return readingCount;
}

async function clearDemoAuthUsers(): Promise<void> {
  for (const email of DEMO_EMAILS) {
    try {
      const user = await adminAuth.getUserByEmail(email);
      await adminAuth.deleteUser(user.uid);
      console.log(`Deleted demo auth user: ${email}`);
    } catch {
      console.log(`No demo auth user to delete: ${email}`);
    }
  }
}

async function clear() {
  console.log("Starting database clear...");
  await clearCollection("plants");
  await clearCollection("users");
  await clearRtdbTelemetry();
  await clearDemoAuthUsers();
  console.log("Database cleared successfully!");
}

clear()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Clear failed:", err);
    process.exit(1);
  });
