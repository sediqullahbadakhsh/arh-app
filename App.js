import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/auth/AuthProvider";
import AccessFromAuth from "./src/acl/AccessFromAuth";
import { UserProvider } from "./src/context/userContext";
import * as Font from "expo-font";
import { Fonts } from "./src/utils/fonts";

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);


  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        [Fonts.REGULAR]: require("./assets/fonts/dmsansRegular.ttf"),
        [Fonts.MEDIUM]: require("./assets/fonts/dmsansMedium.ttf"),
        [Fonts.BOLD]: require("./assets/fonts/dmsansBold.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  



  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <UserProvider>
      <AuthProvider>
        <AccessFromAuth>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AccessFromAuth>
      </AuthProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
