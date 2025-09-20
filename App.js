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
import dmsansRegular from './assets/fonts/dmsansRegular.ttf';
import dmsansMedium from './assets/fonts/dmsansMedium.ttf';
import dmsansBold from './assets/fonts/dmsansBold.ttf';
import { LanguageProvider } from "./src/context/LanguageContext";
import { initI18n } from "./src/locales/i18n";

export default function App() {
    const [ready, setReady] = useState(false);
const [fontsLoaded, setFontsLoaded] = useState(false);





    useEffect(() => {
    const initialize = async () => {
      const lang = await initI18n(); 
      console.log("Initialized i18n with language:", lang);
      setReady(true);
    };
    
    initialize();
  }, []);

   useEffect(() => {
    if (ready) {
      loadFonts().then(() => setFontsLoaded(true));
    }
  }, [ready]);

  useEffect(() => {
    async function loadFonts() {
await Font.loadAsync({
  [Fonts.REGULAR]: dmsansRegular,
  [Fonts.MEDIUM]: dmsansMedium,
  [Fonts.BOLD]: dmsansBold,
});

      setFontsLoaded(true);
    }
    loadFonts();
  }, []);



 


  const queryClient = new QueryClient();
   if (!ready || !fontsLoaded) {
    return null; 
  }
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>

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

    </LanguageProvider>
    </QueryClientProvider>

  );
}