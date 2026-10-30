// MaintenanceGate.js - blocks the UI with a maintenance screen while Maintenance Mode is on.
// The navigator stays mounted underneath (the screen is an overlay) so signed-in state and any
// on-screen form content are not reset. Unsent changes are NOT saved to the device.
import React, { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "./supabase";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  INITIAL_MAINTENANCE_STATE,
  MAINTENANCE_POLL_MS,
  clearPrivileges,
  fetchMaintenanceStatus,
  formatExpectedReturn,
  reduceMaintenanceState,
  shouldShowMaintenance,
} from "./maintenanceStatus";

function useMaintenanceStatus(userId) {
  // Remember which identity the last result belongs to, so a stale admin bypass is never applied
  // to a different (or signed-out) user while the new status is still being fetched.
  const [data, setData] = useState({ state: INITIAL_MAINTENANCE_STATE, forUserId: userId });

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const run = async () => {
      if (inFlight) return;
      inFlight = true;
      const result = await fetchMaintenanceStatus(supabase);
      inFlight = false;
      if (!cancelled) {
        setData((prev) => ({ state: reduceMaintenanceState(prev.state, result), forUserId: userId }));
      }
    };

    run();
    const timer = setInterval(run, MAINTENANCE_POLL_MS);
    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "active") run();
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      appStateSub.remove();
    };
  }, [userId]);

  return data.forUserId === userId ? data.state : clearPrivileges(data.state);
}

export default function MaintenanceGate({ children }) {
  const [userId, setUserId] = useState(null);
  // Which maintenance window (status updated_at) the user opened the login screen for.
  const [loginRequestedFor, setLoginRequestedFor] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted.current) setUserId(data?.session?.user?.id ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted.current = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const maintenance = useMaintenanceStatus(userId);
  const blocked = shouldShowMaintenance(maintenance);
  const windowId = maintenance.status.updatedAt || "none";

  // Signed-out users may open the normal login screen so the Super User can sign in. The allowance
  // applies to this maintenance window only, and as soon as anyone signs in who is not the Super User
  // the maintenance screen returns.
  const showLoginAccess = blocked && !userId && loginRequestedFor === windowId;
  const showOverlay = blocked && !showLoginAccess;
  const returnTime = formatExpectedReturn(maintenance.status.expectedReturnAt);

  return (
    <View style={styles.fill}>
      {children}
      {showOverlay && (
        <View style={styles.overlay} accessibilityViewIsModal>
          <Text style={styles.title}>Maintenance in progress</Text>
          <Text style={styles.message}>
            {maintenance.status.message || DEFAULT_MAINTENANCE_MESSAGE}
          </Text>
          {returnTime && <Text style={styles.returnTime}>Expected back: {returnTime}</Text>}
          <Text style={styles.note}>Unsent changes are not saved if you close the app.</Text>
          {maintenance.connectionError && (
            <Text style={styles.note}>
              Unable to refresh the status right now. It will update when the connection returns.
            </Text>
          )}
          {userId ? (
            <Pressable style={styles.button} onPress={() => supabase.auth.signOut()}>
              <Text style={styles.buttonText}>Sign out</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.linkButton} onPress={() => setLoginRequestedFor(windowId)}>
              <Text style={styles.linkText}>Super User sign in</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    zIndex: 1000,
    elevation: 1000,
  },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  message: { fontSize: 16, textAlign: "center", marginBottom: 12 },
  returnTime: { fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 12 },
  note: { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 8 },
  button: { marginTop: 16, backgroundColor: "#1d4ed8", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: "#ffffff", fontWeight: "600" },
  linkButton: { marginTop: 24, padding: 8 },
  linkText: { color: "#1d4ed8", fontSize: 14 },
});
