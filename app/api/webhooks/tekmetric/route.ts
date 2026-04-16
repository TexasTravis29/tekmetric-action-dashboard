import { createClient } from "@supabase/supabase-js";

const EXCLUDED_LABELS = ["Balance Due", "Ready to Post"];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("Tekmetric webhook received:");
    console.log(JSON.stringify(body, null, 2));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const data = body.data || {};

    const roNumber = data.repairOrderNumber?.toString() || "N/A";
    const customLabel = data.repairOrderCustomLabel?.name || "No Label";
    const eventText = body.event || "No Event";
    const updatedAt = data.updatedDate || new Date().toISOString();

    if (roNumber === "N/A") {
      return Response.json(
        { ok: false, error: "Missing RO number" },
        { status: 400 }
      );
    }

    const { data: activeRows, error: fetchError } = await supabase
      .from("action_items")
      .select("id, started_at, custom_label")
      .eq("ro", roNumber)
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Fetch active row error:", fetchError);
      return Response.json(
        { ok: false, error: fetchError.message },
        { status: 500 }
      );
    }

    const activeRow = activeRows?.[0];

    // If exact same label is already active, ignore duplicate webhook
    if (activeRow && activeRow.custom_label === customLabel) {
      return Response.json({
        ok: true,
        skipped: true,
        reason: "Same label already active",
      });
    }

    // Close prior active label for this RO
    if (activeRow) {
      const startedAt = new Date(activeRow.started_at);
      const endedAt = new Date(updatedAt);
      const durationMinutes =
        (endedAt.getTime() - startedAt.getTime()) / 1000 / 60;

      const { error: closeError } = await supabase
        .from("action_items")
        .update({
          ended_at: updatedAt,
          duration_minutes: durationMinutes,
          is_active: false,
        })
        .eq("id", activeRow.id);

      if (closeError) {
        console.error("Close active row error:", closeError);
        return Response.json(
          { ok: false, error: closeError.message },
          { status: 500 }
        );
      }
    }

    // If label is excluded, stop here after closing previous label
    if (EXCLUDED_LABELS.includes(customLabel)) {
      return Response.json({
        ok: true,
        ignored: true,
        reason: `Tracking stopped at label: ${customLabel}`,
      });
    }

    // Start new active label row
    const { error: insertError } = await supabase.from("action_items").insert([
      {
        ro: roNumber,
        event_text: eventText,
        custom_label: customLabel,
        updated_at: updatedAt,
        started_at: updatedAt,
        ended_at: null,
        duration_minutes: null,
        is_active: true,
        is_completed: false,
        action_type: "label_update",
        event_received_at: new Date().toISOString(),
        raw_payload: body,
      },
    ]);

    if (insertError) {
      console.error("Insert error:", insertError);
      return Response.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);

    return Response.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
