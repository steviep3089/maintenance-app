// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import HomeScreen from "./screens/HomeScreen";
import NewDefectScreen from "./screens/NewDefectScreen";
import DefectListScreen from "./screens/DefectListScreen";
import DefectDetailsScreen from "./screens/DefectDetailsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerTitleAlign: "center" }}
      >
        {/* SPLASH */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />

        {/* AUTH */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login" }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ title: "Sign Up" }}
        />

        {/* HOME */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Maintenance App" }}
        />

        {/* DEFECT FLOWS */}
        <Stack.Screen
          name="NewDefect"
          component={NewDefectScreen}
          options={{ title: "New Defect" }}
        />

        {/* 🔹 THIS NAME MUST MATCH YOUR navigation.navigate TARGET 🔹 */}
        <Stack.Screen
          name="DefectList"
          component={DefectListScreen}
          options={{ title: "All Defects" }}
        />

        <Stack.Screen
          name="DefectDetails"
          component={DefectDetailsScreen}
          options={{ title: "Defect Details" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
