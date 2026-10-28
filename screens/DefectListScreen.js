import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { supabase } from "../supabase";
import { useIsFocused } from "@react-navigation/native";
import { fetchUserScope, divisionColor } from "../userRegions";

// Status colours for badges
const STATUS_COLORS = {
  Reported: "#ff4d4d",
  "In Progress": "#ffa31a",
  Completed: "#28a745",

  // fallback if old entries say "Open"
  Open: "#ff4d4d",
};

export default function DefectListScreen({ navigation }) {
  const [defects, setDefects] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [regionFilter, setRegionFilter] = useState("all");
  const [regions, setRegions] = useState([]);
  const [assetDivisions, setAssetDivisions] = useState({});
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadDefects();
  }, [isFocused]); // reload list whenever screen becomes active

  async function loadDefects() {
    const scope = await fetchUserScope();
    setRegions(scope.divisions);
    setAssetDivisions(scope.assetDivisionIdsByCode);

    // Users only see defects for the divisions they are assigned to, either
    // directly or through the asset the defect was raised against.
    if (scope.divisions.length === 0) {
      setDefects([]);
      return;
    }

    const assetCodes = Object.keys(scope.assetDivisionIdsByCode);
    const [byDivision, byAsset] = await Promise.all([
      supabase
        .from("defects")
        .select("*")
        .in(
          "division_id",
          scope.divisions.map((division) => division.id)
        ),
      assetCodes.length
        ? supabase.from("defects").select("*").in("asset", assetCodes)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (byDivision.error) return;

    const merged = new Map();
    [...(byDivision.data || []), ...(byAsset.data || [])].forEach((defect) =>
      merged.set(defect.id, defect)
    );
    setDefects(
      [...merged.values()].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
    );
  }

  function defectDivisionIds(item) {
    if (item.division_id) return [item.division_id];
    return assetDivisions[item.asset] || [];
  }

  const filteredDefects = defects.filter((item) => {
    const status = item.status || "Reported";
    const isActive =
      status === "Reported" || status === "In Progress" || status === "Open";
    const matchesStatus =
      statusFilter === "active" ? isActive : status === "Completed";
    const matchesRegion =
      regionFilter === "all" || defectDivisionIds(item).includes(regionFilter);

    return matchesStatus && matchesRegion;
  });

  const regionNames = Object.fromEntries(
    regions.map((region) => [region.id, region.name])
  );

  function renderItem({ item }) {
    const status = item.status || "Reported";
    const color = STATUS_COLORS[status] || "#999";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("DefectDetails", { defect: item })}
      >
        {/* TOP ROW: Asset + Status badge */}
        <View style={styles.row}>
          <Text style={styles.asset}>{item.asset}</Text>

          <View style={[styles.statusBadge, { backgroundColor: color }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        {/* Division */}
        {defectDivisionIds(item).map((id) =>
          regionNames[id] ? (
            <View
              key={id}
              style={[styles.divisionTag, { backgroundColor: divisionColor(id) }]}
            >
              <Text style={styles.divisionTagText}>{regionNames[id]}</Text>
            </View>
          ) : null
        )}

        {/* Category */}
        <Text style={styles.category}>Category: {item.category}</Text>

        {/* Priority */}
        <Text style={styles.priority}>Priority: {item.priority}</Text>

        {/* Date */}
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === "active" && styles.filterChipActive,
          ]}
          onPress={() => setStatusFilter("active")}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === "active" && styles.filterTextActive,
            ]}
          >
            In Progress / Reported
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === "completed" && styles.filterChipActive,
          ]}
          onPress={() => setStatusFilter("completed")}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === "completed" && styles.filterTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.divisionTabs}
        >
          {[{ id: "all", name: "All" }, ...regions].map((division) => {
            const color =
              division.id === "all" ? "#333" : divisionColor(division.id);
            const selected = regionFilter === division.id;
            return (
              <TouchableOpacity
                key={division.id}
                onPress={() => setRegionFilter(division.id)}
                style={[
                  styles.divisionTab,
                  { borderColor: color },
                  selected && { backgroundColor: color },
                ]}
              >
                <Text
                  style={[
                    styles.divisionTabText,
                    { color: selected ? "#fff" : color },
                  ]}
                >
                  {division.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {regions.length === 0 ? (
          <Text style={styles.noDivisionText}>
            You are not assigned to any divisions. Please contact an administrator.
          </Text>
        ) : null}
      </View>

      <FlatList
        data={filteredDefects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}

// -------------------------
// STYLES
// -------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 10,
  },
  categoryFilterRow: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  categoryFilterLabel: {
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
    marginBottom: 4,
  },
  categoryPickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  categoryPicker: {
    height: 48,
  },
  divisionTabs: {
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 8,
  },
  divisionTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: "#fff",
  },
  divisionTabText: {
    fontSize: 14,
    fontWeight: "700",
  },
  noDivisionText: {
    color: "#b00020",
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  divisionTag: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  divisionTagText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f7f7f7",
  },
  filterChipActive: {
    backgroundColor: "#2f855a",
    borderColor: "#2f855a",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  filterTextActive: {
    color: "white",
  },
  card: {
    padding: 15,
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  asset: {
    fontSize: 20,
    fontWeight: "bold",
  },

  title: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 4,
  },

  category: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },

  priority: {
    fontSize: 14,
    color: "#333",
  },

  date: {
    marginTop: 6,
    color: "#666",
    fontSize: 12,
  },

  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  statusText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
});
