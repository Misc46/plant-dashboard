"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ControllerType, PlantData, PlantType } from "@/lib/simulator";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  PageLoader,
  Select,
} from "@/components/ui";
import { PlantCard } from "@/components/PlantCard";
import { PlantPropertiesModal } from "@/components/PlantPropertiesModal";
import { Modal } from "@/components/Modal";
import { toMillis } from "@/lib/time";

type ControllerFilter = "ALL" | ControllerType;
type TypeFilter = "ALL" | PlantType;
type SortKey = "CREATED_DESC" | "CREATED_ASC" | "NAME_ASC";

const CONTROLLER_OPTIONS: { value: ControllerFilter; label: string }[] = [
  { value: "ALL", label: "Controller Type: All" },
  { value: "PID", label: "PID" },
  { value: "PI", label: "PI" },
  { value: "P", label: "P" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "Plant Type: All" },
  { value: "DC_MOTOR", label: "DC Motor" },
  { value: "WATER_TANK", label: "Water Tank" },
  { value: "TEMPERATURE", label: "Temperature" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "CREATED_DESC", label: "Sort: Newest created" },
  { value: "CREATED_ASC", label: "Sort: Oldest created" },
  { value: "NAME_ASC", label: "Sort: Name (A–Z)" },
];

export default function PlantsListPage() {
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, user } = useAuth();

  const [search, setSearch] = useState("");
  const [controllerFilter, setControllerFilter] =
    useState<ControllerFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("CREATED_DESC");

  const [propertiesTarget, setPropertiesTarget] = useState<PlantData | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<PlantData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAdmin = profile?.role === "ADMIN";

  useEffect(() => {
    // Realtime live updating list from Firestore onSnapshot
    const unsubscribe = onSnapshot(
      collection(db, "plants"),
      (snapshot) => {
        const list: PlantData[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as PlantData);
        });
        setPlants(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const visiblePlants = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = plants.filter((plant) => {
      if (term && !plant.name?.toLowerCase().includes(term)) return false;
      if (controllerFilter !== "ALL" && plant.controllerType !== controllerFilter)
        return false;
      if (typeFilter !== "ALL" && plant.type !== typeFilter) return false;
      return true;
    });

    // Sorting happens client-side: the snapshot already holds every plant, so
    // this avoids a composite Firestore index for each sort option.
    return [...filtered].sort((a, b) => {
      if (sortKey === "NAME_ASC") {
        return (a.name ?? "").localeCompare(b.name ?? "", undefined, {
          sensitivity: "base",
        });
      }

      // Plants seeded before createdAt existed sort last instead of jumping
      // to the top with an implicit 0.
      const aCreated = toMillis(a.createdAt);
      const bCreated = toMillis(b.createdAt);
      if (aCreated === null && bCreated === null) return 0;
      if (aCreated === null) return 1;
      if (bCreated === null) return -1;

      return sortKey === "CREATED_DESC"
        ? bCreated - aCreated
        : aCreated - bCreated;
    });
  }, [plants, search, controllerFilter, typeFilter, sortKey]);

  const filtersActive =
    search.trim() !== "" || controllerFilter !== "ALL" || typeFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setControllerFilter("ALL");
    setTypeFilter("ALL");
  };

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const idToken = await user.getIdToken();
      await axios.delete(`/api/plants/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      // The onSnapshot listener removes the card on its own.
      setDeleteTarget(null);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : err instanceof Error
          ? err.message
          : "Failed to delete plant.";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header: title + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Control Plants</h1>

        <div className="relative w-full sm:w-72">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13.5 13.5L17 17" />
          </svg>
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plant name..."
            aria-label="Search plant name"
            className="pl-9"
          />
        </div>
      </div>

      {/* Toolbar: filters + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={controllerFilter}
            onChange={(e) =>
              setControllerFilter(e.target.value as ControllerFilter)
            }
            aria-label="Filter by controller type"
            className="w-auto!"
          >
            {CONTROLLER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            aria-label="Filter by plant type"
            className="w-auto!"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        <Select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="Sort plants"
          className="w-auto!"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <PageLoader text="Connecting to Firestore live stream..." />
      ) : plants.length === 0 ? (
        <EmptyState
          title="No plants created yet"
          description="Create your first control loop to start simulating telemetry."
          action={
            isAdmin ? (
              <Link href="/dashboard/plants/new">
                <Button variant="primary">+ New Plant</Button>
              </Link>
            ) : undefined
          }
        />
      ) : visiblePlants.length === 0 ? (
        <EmptyState
          title="No plants match your filters"
          description="Try a different search term or reset the filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visiblePlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              isAdmin={isAdmin}
              onProperties={setPropertiesTarget}
              onDelete={(target) => {
                setDeleteError(null);
                setDeleteTarget(target);
              }}
            />
          ))}
        </div>
      )}

      <PlantPropertiesModal
        plant={propertiesTarget}
        onClose={() => setPropertiesTarget(null)}
      />

      <Modal
        open={deleteTarget !== null}
        size="sm"
        title="Delete plant"
        onClose={deleting ? () => {} : () => setDeleteTarget(null)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              {deleting ? "Deleting..." : "Delete Plant"}
            </Button>
          </>
        }
      >
        {deleteError && (
          <Alert tone="error" className="mb-4">
            {deleteError}
          </Alert>
        )}
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            {deleteTarget?.name}
          </span>{" "}
          and its entire telemetry history will be permanently removed. This
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
