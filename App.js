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
import { StripeProvider } from '@stripe/stripe-react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>

    <SafeAreaProvider>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51RxnvBKOx8MiO1ejmrVjvOoop4cA1ANX3lDRPOTy1cu95T1f4qRWnM6GmnoQnAK5RDxtVsNVmH3eKdny6PWyswn300iWaALjXq"}
        // merchantIdentifier="merchant.com.yourapp" // Required for Apple Pay
        // urlScheme="yourapp" // Required for 3D Secure and redirects
      >
        <UserProvider>
          <AuthProvider>
            <AccessFromAuth>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </AccessFromAuth>
          </AuthProvider>
        </UserProvider>
      </StripeProvider>
    </SafeAreaProvider>
    </QueryClientProvider>

  );
}