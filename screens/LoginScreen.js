import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    loadRememberedLogin();
  }, []);

  async function loadRememberedLogin() {
    const savedEmail = await AsyncStorage.getItem("savedEmail");
    const savedPassword = await AsyncStorage.getItem("savedPassword");

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRemember(true);
    }
  }

  async function rememberLogin() {
    if (remember) {
      await AsyncStorage.setItem("savedEmail", email);
      await AsyncStorage.setItem("savedPassword", password);
    } else {
      await AsyncStorage.removeItem("savedEmail");
      await AsyncStorage.removeItem("savedPassword");
    }
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      await rememberLogin();
      navigation.replace("Home");
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      alert("Enter your email first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://your-app-url/reset", // optional
    });

    if (error) alert(error.message);
    else alert("Password reset email sent.");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo */}
        <Animated.View style={{ opacity: logoOpacity, alignItems: "center" }}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.title}>Login</Text>

        {/* Email */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
        />

        {/* Password */}
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {/* Remember Me */}
        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRemember(!remember)}
        >
          <View style={[styles.checkbox, remember && styles.checkboxChecked]} />
          <Text style={styles.rememberText}>Remember me</Text>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity onPress={forgotPassword}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Sign In */}
        <TouchableOpacity style={styles.button} onPress={signIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Create Account */}
        <TouchableOpacity
          onPress={() => navigation.navigate("SignUp")}
          style={{ marginTop: 15 }}
        >
          <Text style={styles.signupText}>Create an Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------
// Styles
// ---------------------
const styles = StyleSheet.create({
  container: {
    padding: 25,
    paddingTop: 60,
  },

  logo: {
    width: 180,
    height: 180,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 25,
  },

  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: "#555",
    marginRight: 10,
    borderRadius: 4,
  },

  checkboxChecked: {
    backgroundColor: "#007aff",
    borderColor: "#007aff",
  },

  rememberText: {
    fontSize: 16,
  },

  forgotText: {
    marginTop: 5,
    marginBottom: 20,
    color: "#007aff",
    textAlign: "right",
    fontSize: 16,
  },

  button: {
    backgroundColor: "#007aff",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },

  signupText: {
    marginTop: 10,
    color: "#007aff",
    textAlign: "center",
    fontSize: 16,
  },
});
