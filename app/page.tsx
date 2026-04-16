"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ActionItem = {
  id: string;
  ro: string;
  custom_label: string | null;
  event_text: string | null;
  updated_at: string | null;
  created_at: string | null;
};

export default function Home() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    const { data, error } = await supabase
      .from("action_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching actions:", error);
      return;
    }

    setActions(data || []);
  };

  const markDone = async (id: string) => {
    const { error } = await supabase
      .from("action_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting action:", error);
      return;
    }

    fetchActions();
  };

  const filteredActions =
    filter === "all" ? actions : actions;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="mb-6 text-4xl font-bold text-gray-800">
        Tekmetric Action Dashboard
      </h1>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setFilter("all")}
          className="rounded bg-gray-300 px-4 py-2 text-white"
        >
          All
        </button>
        <button
          onClick={() => setFilter("unassigned")}
          className="rounded bg-blue-400 px-4 py-2 text-white"
        >
          Unassigned
        </button>
        <button
          onClick={() => setFilter("done")}
          className="rounded bg-green-400 px-4 py-2 text-white"
        >
          Done
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
            </div>

            <button
              onClick={() => markDone(action.id)}
              className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
            >
              Done
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
