import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/auth/AuthProvider";
import AccessFromAuth from "./src/acl/AccessFromAuth";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AccessFromAuth>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AccessFromAuth>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
