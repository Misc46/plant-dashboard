"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ControllerType, PlantData, PlantType } from "@/lib/simulator";
import { Modal } from "@/components/Modal";
import { Alert, Button, Field, Input, Select } from "@/components/ui";

/**
 * Edit an existing plant's configuration. Mirrors the create form so both
 * screens stay in sync; writes straight to Firestore (ADMIN-only per rules).
 *
 * The wrapper keys the dialog by plant id so every plant gets a freshly
 * initialised form instead of syncing props into state inside an effect.
 */
export function PlantPropertiesModal({
  plant,
  onClose,
}: {
  plant: PlantData | null;
  onClose: () => void;
}) {
  if (!plant) return null;
  return <PropertiesDialog key={plant.id} plant={plant} onClose={onClose} />;
}

function PropertiesDialog({
  plant,
  onClose,
}: {
  plant: PlantData;
  onClose: () => void;
}) {
  const [name, setName] = useState(plant.name);
  const [type, setType] = useState<PlantType>(plant.type);
  const [controllerType, setControllerType] = useState<ControllerType>(
    plant.controllerType
  );
  const [kp, setKp] = useState(plant.kp);
  const [ki, setKi] = useState(plant.ki);
  const [kd, setKd] = useState(plant.kd);
  const [setpoint, setSetpoint] = useState(plant.setpoint);
  const [outputMin, setOutputMin] = useState(plant.outputMin);
  const [outputMax, setOutputMax] = useState(plant.outputMax);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Plant name cannot be empty.");
      return;
    }
    if (outputMax <= outputMin) {
      setError("Output Max must be greater than Output Min.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const setpointChanged = plant.setpoint !== setpoint;

      await updateDoc(doc(db, "plants", plant.id), {
        name: name.trim(),
        type,
        controllerType,
        kp: Number(kp),
        ki: Number(ki),
        kd: Number(kd),
        setpoint: Number(setpoint),
        outputMin: Number(outputMin),
        outputMax: Number(outputMax),
        // A new setpoint restarts the step response window, matching the
        // behaviour of the config form on the plant detail page.
        ...(setpointChanged
          ? { stepStartAt: Date.now(), stepStartSetpoint: Number(setpoint) }
          : {}),
        updatedAt: serverTimestamp(),
      });

      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save plant properties."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Plant Properties"
      description={`Editing "${plant.name}"`}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="plant-properties-form"
            variant="primary"
            loading={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </>
      }
    >
      {plant.status === "RUNNING" && (
        <Alert tone="info" className="mb-4">
          This plant is currently RUNNING. Saving applies the new parameters to
          the live simulation on the next tick.
        </Alert>
      )}

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form
        id="plant-properties-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <Field label="Plant Name">
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Plant Type">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as PlantType)}
            >
              <option value="DC_MOTOR">DC Motor Speed Control</option>
              <option value="WATER_TANK">Water Tank Level Control</option>
              <option value="TEMPERATURE">Temperature Control System</option>
            </Select>
          </Field>

          <Field label="Controller Type">
            <Select
              value={controllerType}
              onChange={(e) =>
                setControllerType(e.target.value as ControllerType)
              }
            >
              <option value="PID">PID Controller</option>
              <option value="PI">PI Controller</option>
              <option value="P">P Controller</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Kp">
            <Input
              type="number"
              step="any"
              required
              value={kp}
              onChange={(e) => setKp(Number(e.target.value))}
            />
          </Field>
          <Field label="Ki">
            <Input
              type="number"
              step="any"
              required
              value={ki}
              onChange={(e) => setKi(Number(e.target.value))}
            />
          </Field>
          <Field label="Kd">
            <Input
              type="number"
              step="any"
              required
              value={kd}
              onChange={(e) => setKd(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Setpoint">
            <Input
              type="number"
              step="any"
              required
              value={setpoint}
              onChange={(e) => setSetpoint(Number(e.target.value))}
            />
          </Field>
          <Field label="Output Min">
            <Input
              type="number"
              step="any"
              required
              value={outputMin}
              onChange={(e) => setOutputMin(Number(e.target.value))}
            />
          </Field>
          <Field label="Output Max">
            <Input
              type="number"
              step="any"
              required
              value={outputMax}
              onChange={(e) => setOutputMax(Number(e.target.value))}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
