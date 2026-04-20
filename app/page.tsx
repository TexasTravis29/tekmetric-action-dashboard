"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ActionItem = {
  id: string;
  ro: string;
  custom_label: string | null;
  event_text: string | null;
  updated_at: string | null;
  created_at: string | null;
  is_completed: boolean | null;
  is_active: boolean | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  completed_at: string | null;
};

export default function Home() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [filter, setFilter] = useState<"pending" | "completed">("pending");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const res = await fetch("/api/action-items", { cache: "no-store" });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error fetching actions:", errorText);
        return;
      }

      const data = await res.json();
      setActions(data || []);
    } catch (error) {
      console.error("Error fetching actions:", error);
    }
  };

  const markDone = async (item: ActionItem) => {
    const now = new Date();
    let durationMinutes = item.duration_minutes;

    if (item.started_at && !item.ended_at) {
      const started = new Date(item.started_at);
      durationMinutes = Math.round(
        (now.getTime() - started.getTime()) / 1000 / 60
      );
    }

    try {
      const res = await fetch("/api/action-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          updates: {
            is_completed: true,
            is_active: false,
            ended_at: item.ended_at || now.toISOString(),
            duration_minutes: durationMinutes,
            completed_at: now.toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error marking action complete:", errorText);
        return;
      }

      fetchActions();
    } catch (error) {
      console.error("Error marking action complete:", error);
    }
  };

  const markPending = async (id: string) => {
    try {
      const res = await fetch("/api/action-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          updates: {
            is_completed: false,
            completed_at: null,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error marking action pending:", errorText);
        return;
      }

      fetchActions();
    } catch (error) {
      console.error("Error marking action pending:", error);
    }
  };

  const clearAll = async () => {
    const pendingItems = actions.filter((a) => !a.is_completed);

    if (pendingItems.length === 0) return;

    setLoading(true);

    try {
      for (const item of pendingItems) {
        const now = new Date();
        let durationMinutes = item.duration_minutes;

        if (item.started_at && !item.ended_at) {
          const started = new Date(item.started_at);
          durationMinutes = Math.round(
            (now.getTime() - started.getTime()) / 1000 / 60
          );
        }

        const res = await fetch("/api/action-items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            updates: {
              is_completed: true,
              is_active: false,
              ended_at: item.ended_at || now.toISOString(),
              duration_minutes: durationMinutes,
              completed_at: now.toISOString(),
            },
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error clearing item:", errorText);
        }
      }

      fetchActions();
    } finally {
      setLoading(false);
    }
  };

  const filteredActions = actions.filter((action) =>
    filter === "pending"
      ? !action.is_completed
      : Boolean(action.is_completed)
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold text-gray-800">
          Tekmetric Action Dashboard
        </h1>

        <div className="flex gap-3">
          <Link
            href="/report"
            className="rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-800"
          >
            Reports
          </Link>

          <button
            onClick={clearAll}
            disabled={loading}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Clearing..." : "Clear All"}
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setFilter("pending")}
          className={`rounded px-4 py-2 text-white ${
            filter === "pending" ? "bg-blue-500" : "bg-blue-300"
          }`}
        >
          Pending
        </button>

        <button
          onClick={() => setFilter("completed")}
          className={`rounded px-4 py-2 text-white ${
            filter === "completed" ? "bg-gray-500" : "bg-gray-300"
          }`}
        >
          Completed
        </button>
      </div>

      <div className="space-y-4">
        {filteredActions.map((action) => (
          <div
            key={action.id}
            className="flex items-start justify-between rounded-lg bg-white p-4 shadow"
          >
            <div>
              <div className="text-lg font-semibold text-gray-800">
                RO #{action.ro}
              </div>

              <div className="mt-1 text-sm text-blue-600">
                {action.custom_label || "No Label"}
              </div>

              <div className="mt-2 text-sm text-gray-700">
                {action.event_text || "No Event Text"}
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Updated:{" "}
                {action.updated_at
                  ? new Date(action.updated_at).toLocaleString()
                  : "No Updated Date"}
              </div>

              {action.duration_minutes !== null && (
                <div className="mt-1 text-xs text-emerald-600">
                  Minutes in label: {action.duration_minutes}
                </div>
              )}

              {action.completed_at && (
                <div className="mt-1 text-xs text-gray-500">
                  Completed: {new Date(action.completed_at).toLocaleString()}
                </div>
              )}
            </div>

            {!action.is_completed ? (
              <button
                onClick={() => markDone(action)}
                className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => markPending(action.id)}
                className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Reopen
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}