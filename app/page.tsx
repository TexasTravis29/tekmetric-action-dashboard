"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [actions, setActions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
  fetchActions();

  const interval = setInterval(() => {
    fetchActions();
  }, 5000); // every 5 seconds

  return () => clearInterval(interval);
}, []);

  const fetchActions = async () => {
    const { data, error } = await supabase
      .from("action_items")
      .select("*");

    if (error) {
      console.error(error);
    } else {
      setActions(data || []);
    }
  };

  const markDone = async (id: string) => {
    const { error } = await supabase
      .from("action_items")
      .update({ status: "done" })
      .eq("id", id);

    if (error) {
      console.error(error);
    } else {
      fetchActions();
    }
  };

  const filteredActions =
    filter === "all"
      ? actions
      : actions.filter((a) => a.status === filter);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">
        Tekmetric Action Dashboard
      </h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          All
        </button>

        <button
          onClick={() => setFilter("unassigned")}
          className="px-3 py-1 bg-blue-300 rounded"
        >
          Unassigned
        </button>

        <button
          onClick={() => setFilter("done")}
          className="px-3 py-1 bg-green-300 rounded"
        >
          Done
        </button>
      </div>

      <div className="space-y-4">
        {filteredActions.map((action, index) => (
          <div
            key={action.id ?? index}
            className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{action.title}</p>
              <p className="text-sm text-gray-500">
                {action.ro} • {action.customer}
              </p>
              <p className="text-xs mt-1">{action.status}</p>
            </div>

            <button
              onClick={() => markDone(action.id)}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Done
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}