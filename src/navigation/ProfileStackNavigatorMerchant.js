// src/navigation/WalletStackNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LanguageScreen from "../screens/profileScreens/languageScreen";
import SecurityScreen from "../screens/profileScreens/Security";
import AboutAppScreen from "../screens/profileScreens/AboutAppScreen";
import ContactUsScreen from "../screens/profileScreens/ContactUsScreen";
import AboutUsScreen from "../screens/profileScreens/AboutUsScreen";

import MerchantApplicationScreen from "../screens/profileScreens/MerchantApllicationScreen";
import ApplicationResultScreen from "../screens/profileScreens/ApplicationResultScreen";
import ProfileScreenMerchant from "../screens/ProfileScreenMerchant";
import ProfileDetailsScreenMerchant from "../screens/profileScreensMerchant/profile";

const Stack = createNativeStackNavigator();

export default function ProfileStackNavigatorMerchant() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
        name="ProfileMerchant"
        component={ProfileScreenMerchant}
      />
      <Stack.Screen name="profileDetailsMerchant" component={ProfileDetailsScreenMerchant} />
      
      <Stack.Screen
        name="languageScreen"
        component={LanguageScreen}
      />
      <Stack.Screen
        name="securityScreen"
        component={SecurityScreen}
      />
     <Stack.Screen 
  name="MerchantApplication" 
  component={MerchantApplicationScreen} 
/>
<Stack.Screen 
  name="ApplicationResult" 
  component={ApplicationResultScreen} 
/>
      <Stack.Screen
        name="aboutAppScreen"
        component={AboutAppScreen}
      />
      <Stack.Screen
        name="contactUsScreen"
        component={ContactUsScreen}
      />
      <Stack.Screen
        name="AboutUsScreen"
        component={AboutUsScreen}
      />
    </Stack.Navigator>
  );
}
