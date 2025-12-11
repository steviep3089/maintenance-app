// screens/SplashScreen.js
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
} from "react-native";

export default function SplashScreen({ navigation }) {
  // Animated value for spin
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Infinite spin loop
    const spinLoop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spinLoop.start();

    // After 2 seconds, go to Login (or Home, up to you)
    const timer = setTimeout(() => {
      navigation.replace("Login"); // change to "Home" if you prefer
    }, 2000);

    return () => {
      spinLoop.stop();
      clearTimeout(timer);
    };
  }, [navigation, spinValue]);

  // Turn 0→1 into 0deg→360deg
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/sitebatch-logo.png")}
        style={[styles.logo, { transform: [{ rotate: spin }] }]}
        resizeMode="contain"
      />
      <Text style={styles.brand}>Sitebatch Technologies</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  brand: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
