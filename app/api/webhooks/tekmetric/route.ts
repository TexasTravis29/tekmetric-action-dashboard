import { createClient } from "@supabase/supabase-js";

const EXCLUDED_LABELS = ["Balance Due", "Ready to Post"];

type TekmetricWebhookBody = {
  event?: string;
  data?: {
    repairOrderNumber?: string | number | null;
    repairOrderCustomLabel?: {
      name?: string | null;
    } | null;
    updatedDate?: string | null;
  } | null;
};

const normalizeLabel = (label: string | null | undefined) => {
  const cleaned = (label || "No Label").trim().replace(/\s+/g, " ");

  if (cleaned === "R.A.C.E Inspection") return "R.A.C.E. Inspection";

  return cleaned || "No Label";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TekmetricWebhookBody;

    console.log("Tekmetric webhook received:");
    console.log(JSON.stringify(body, null, 2));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const data = body.data || {};

    const roNumber = data.repairOrderNumber?.toString() || "N/A";
    const customLabel = normalizeLabel(data.repairOrderCustomLabel?.name);
    const eventText = body.event || "No Event";

    // Use server receipt time for all tracking math.
    // Tekmetric updatedDate can be stale or out of sequence for label timing.
    const eventTime = new Date().toISOString();

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
    const activeLabel = normalizeLabel(activeRow?.custom_label);

    // Ignore duplicate webhook if same label is already active
    if (activeRow && activeLabel === customLabel) {
      return Response.json({
        ok: true,
        skipped: true,
        reason: "Same label already active",
      });
    }

    // Close prior active label for this RO
    if (activeRow) {
      let durationMinutes: number | null = null;

      if (activeRow.started_at) {
        const startedMs = new Date(activeRow.started_at + "Z").getTime();
        const endedMs = new Date(eventTime).getTime();

        if (Number.isFinite(startedMs) && Number.isFinite(endedMs)) {
          const diffMinutes = Math.round((endedMs - startedMs) / 1000 / 60);

          // Guard against corrupted or out-of-order times
          if (diffMinutes >= 0 && diffMinutes <= 60 * 24 * 30) {
            durationMinutes = diffMinutes;
          } else {
            console.error("Bad duration detected", {
              ro: roNumber,
              activeLabel,
              started_at: activeRow.started_at,
              ended_at: eventTime,
              computed_minutes: diffMinutes,
              source_updatedDate: data.updatedDate || null,
            });
          }
        } else {
          console.error("Invalid date detected while closing active row", {
            ro: roNumber,
            activeLabel,
            started_at: activeRow.started_at,
            ended_at: eventTime,
            source_updatedDate: data.updatedDate || null,
          });
        }
      }

      const { error: closeError } = await supabase
        .from("action_items")
        .update({
          ended_at: eventTime,
          updated_at: eventTime,
          duration_minutes: durationMinutes,
          is_active: false,
          is_completed: true,
          completed_at: eventTime,
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

    // Stop tracking if this label should not be tracked
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
        updated_at: eventTime,
        started_at: eventTime,
        ended_at: null,
        duration_minutes: null,
        is_active: true,
        is_completed: false,
        completed_at: null,
        action_type: "label_update",
        event_received_at: eventTime,
        raw_payload: body,
        shop_id: (body as any)?.data?.shopId ?? null,
      },
    ]);

    if (insertError) {
      console.error("Insert error:", insertError);
      return Response.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      ro: roNumber,
      label: customLabel,
      tracked_at: eventTime,
    });
  } catch (error) {
    console.error("Webhook error:", error);

    return Response.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
