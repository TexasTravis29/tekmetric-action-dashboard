import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("Tekmetric webhook received:");
    console.log(JSON.stringify(body, null, 2));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let title = "New Action";
    let actionType = "general";
    const loggedAt = new Date().toISOString();

    const eventText = String(body.event || "").toLowerCase();

    // 🔧 INSPECTION COMPLETED (based on real payload)
    if (body.inspectionId && body.completedDate) {
      title = "Inspection completed";
      actionType = "advisor_review_present";
    }

    // 🔧 REPAIR ORDER COMPLETED
    if (eventText.includes("repair order") && eventText.includes("completed")) {
      title = "Confirm customer pick up time";
      actionType = "confirm_pickup_time";
    }

    // 🔧 WORK APPROVED (keep for later)
    if (eventText.includes("work approved")) {
      title = "Verify parts";
      actionType = "verify_parts";
    }

    // 🔧 RO number (handle both payload types)
    const roNumber =
      body.repairOrderNumber?.toString() ||
      body.repairOrderId?.toString() ||
      "N/A";

    const { error } = await supabase.from("action_items").insert([
      {
        title,
        ro: roNumber,
        customer: "N/A", // 👈 intentionally ignored
        status: "unassigned",
        action_type: actionType,
        event_received_at: loggedAt,
        raw_payload: body,
      },
    ]);

    if (error) {
      console.error("Insert error:", error);
      return Response.json({ ok: false, error: error.message }, { status: 500 });
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
