import "./load-env";
import { adminDb } from "../src/lib/firebase/admin";
import { getPlantUnit, PlantType } from "../src/lib/simulator";

// One-time idempotent backfill: stamps the display `unit` field on every
// existing plant so legacy documents match getPlantUnit() defaults.
async function syncUnits() {
  const snapshot = await adminDb.collection("plants").get();
  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const type = data.type as PlantType;
    const unit = getPlantUnit({ type, unit: data.unit });
    if (data.unit === unit) {
      skipped++;
      continue;
    }
    await doc.ref.update({ unit, updatedAt: Date.now() });
    console.log(`Updated ${data.name} (${doc.id}): unit -> ${unit}`);
    updated++;
  }

  console.log(`Unit sync complete: ${updated} updated, ${skipped} already correct.`);
}

syncUnits()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Unit sync failed:", err);
    process.exit(1);
  });
