// screens/HomeScreen.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { supabase } from "../supabase";

export default function HomeScreen({ navigation }) {
  async function handleSignOut() {
    await supabase.auth.signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maintenance App</Text>

      {/* Your logo */}
      <Image
        source={require("../assets/sitebatch-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.welcome}>Welcome to the Maintenance App</Text>

      {/* REPORT NEW DEFECT */}
      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => navigation.navigate("NewDefect")}
      >
        <Text style={styles.buttonPrimaryText}>Report New Defect</Text>
      </TouchableOpacity>

      {/* VIEW ALL DEFECTS – MUST MATCH name="DefectList" IN App.js */}
      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate("DefectList")}
      >
        <Text style={styles.buttonSecondaryText}>View All Defects</Text>
      </TouchableOpacity>

      {/* SIGN OUT */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* VERSION */}
      <Text style={styles.versionText}>v2.1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 30,
  },
  logo: {
    width: 260,
    height: 120,
    marginBottom: 30,
  },
  welcome: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 40,
  },
  buttonPrimary: {
    backgroundColor: "#007aff",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    width: "80%",
  },
  buttonPrimaryText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonSecondary: {
    borderColor: "#007aff",
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 30,
    width: "80%",
  },
  buttonSecondaryText: {
    color: "#007aff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  signOutButton: {
    marginTop: 20,
  },
  signOutText: {
    color: "red",
    fontSize: 18,
    fontWeight: "600",
  },
  versionText: {
    position: "absolute",
    bottom: 20,
    color: "#999",
    fontSize: 12,
  },
});
