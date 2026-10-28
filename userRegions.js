import { supabase } from "./supabase";

// Regions are stored as "divisions"; a user may only work with the ones assigned to them.
export async function fetchUserRegions() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: links, error: linksError } = await supabase
    .from("user_divisions")
    .select("division_id")
    .eq("user_id", user.id);
  if (linksError || !links?.length) return [];

  const { data: divisions, error } = await supabase
    .from("divisions")
    .select("id, name")
    .in(
      "id",
      links.map((link) => link.division_id)
    )
    .order("name", { ascending: true });

  return error ? [] : divisions || [];
}
