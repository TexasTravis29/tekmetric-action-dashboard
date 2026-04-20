import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAccessToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.replace("Bearer ", "").trim();
}

async function getUserShopContext(req: Request) {
  const token = getAccessToken(req);

  if (!token) {
    return { error: "Missing authorization token.", status: 401 as const };
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized.", status: 401 as const };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("shop_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found.", status: 403 as const };
  }

  const { data: shop, error: shopError } = await adminClient
    .from("shops")
    .select("id, tekmetric_shop_id")
    .eq("id", profile.shop_id)
    .single();

  if (shopError || !shop) {
    return { error: "Shop not found.", status: 403 as const };
  }

  return {
    user,
    profile,
    shop,
    adminClient,
  };
}

export async function GET(req: Request) {
  const context = await getUserShopContext(req);

  if ("error" in context) {
    return Response.json({ error: context.error }, { status: context.status });
  }

  const { adminClient, shop } = context;

  const { data, error } = await adminClient
    .from("action_items")
    .select("*")
    .eq("shop_id", shop.tekmetric_shop_id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}

export async function PATCH(req: Request) {
  const context = await getUserShopContext(req);

  if ("error" in context) {
    return Response.json({ error: context.error }, { status: context.status });
  }

  const { adminClient, shop } = context;
  const body = await req.json();
  const { id, updates } = body;

  if (!id || !updates) {
    return Response.json(
      { error: "Missing id or updates." },
      { status: 400 }
    );
  }

  const { data: existingItem, error: existingError } = await adminClient
    .from("action_items")
    .select("id, shop_id")
    .eq("id", id)
    .single();

  if (existingError || !existingItem) {
    return Response.json({ error: "Action item not found." }, { status: 404 });
  }

  if (existingItem.shop_id !== shop.tekmetric_shop_id) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await adminClient
    .from("action_items")
    .update(updates)
    .eq("id", id)
    .eq("shop_id", shop.tekmetric_shop_id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}