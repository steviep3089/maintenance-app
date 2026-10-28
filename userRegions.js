import { supabase } from "./supabase";

const DIVISION_COLORS = [
  "#2f855a",
  "#2b6cb0",
  "#b7791f",
  "#805ad5",
  "#c53030",
  "#0987a0",
  "#d53f8c",
  "#4a5568",
];

// Stable colour per division so tabs and cards always match.
export function divisionColor(id) {
  const text = String(id || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return DIVISION_COLORS[hash % DIVISION_COLORS.length];
}

// Divisions the signed-in user is assigned to, plus which assets belong to them.
export async function fetchUserScope() {
  const empty = { divisions: [], assetDivisionIdsByCode: {} };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data: links, error: linksError } = await supabase
    .from("user_divisions")
    .select("division_id")
    .eq("user_id", user.id);
  if (linksError || !links?.length) return empty;

  const divisionIds = links.map((link) => link.division_id);

  const { data: divisions, error } = await supabase
    .from("divisions")
    .select("id, name")
    .in("id", divisionIds)
    .order("name", { ascending: true });
  if (error) return empty;

  const assetDivisionIdsByCode = {};
  const addAsset = (code, divisionId) => {
    if (!code || !divisionId) return;
    const list = assetDivisionIdsByCode[code] || (assetDivisionIdsByCode[code] = []);
    if (!list.includes(divisionId)) list.push(divisionId);
  };

  const { data: mappings, error: mappingError } = await supabase
    .from("plant_asset_divisions")
    .select("division_id, plant_assets(asset_code)")
    .in("division_id", divisionIds);

  if (!mappingError) {
    (mappings || []).forEach((row) =>
      addAsset(row?.plant_assets?.asset_code, row?.division_id)
    );
  } else {
    const { data: assets } = await supabase
      .from("plant_assets")
      .select("asset_code, division_id")
      .in("division_id", divisionIds)
      .eq("is_active", true);
    (assets || []).forEach((row) => addAsset(row.asset_code, row.division_id));
  }

  return { divisions: divisions || [], assetDivisionIdsByCode };
}

export function fetchUserRegions() {
  return fetchUserScope().then((scope) => scope.divisions);
}
