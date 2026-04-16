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

    if (body.event === "work_approved") {
      title = "Verify parts";
      actionType = "verify_parts";
    }

    if (body.event === "inspection_completed") {
      title = "Advisor review and present";
      actionType = "advisor_review_present";
    }

    if (body.event === "customer_viewed_inspection") {
      title = "Advisor follow up with customer";
      actionType = "advisor_follow_up";
    }

    if (body.event === "repair_order_completed") {
      title = "Confirm customer pick up time";
      actionType = "confirm_pickup_time";
    }

    const { error } = await supabase.from("action_items").insert([
      {
        title,
        customer: body.customer || "Unknown",
        ro: body.ro || "N/A",
        status: "unassigned",
        action_type: actionType,
        event_received_at: loggedAt,
        raw_payload: body,
      },
    ]);

    if (error) {
      console.error("Insert error:", error);
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