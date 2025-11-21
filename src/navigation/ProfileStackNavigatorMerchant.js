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
import ReverseStockScreen from "../screens/profileScreensMerchant/ReverseStockScreen";
import SupportScreen from "../screens/profileScreensMerchant/SupportScreen";
import ProfileDetailsScreenMerchant from "../screens/profileScreensMerchant/profile";
import ReverseStockReportScreen from "../screens/profileScreensMerchant/ReverseStockReportScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStackNavigatorMerchant() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
        name="ProfileMerchant"
        component={ProfileScreenMerchant}
      />
       <Stack.Screen
        name="ReverseStockScreen"
        component={ReverseStockScreen}
      />
      <Stack.Screen 
  name="ReverseStockReportScreen" 
  component={ReverseStockReportScreen}
  options={{ headerShown: false }}
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
  name="SupportScreen" 
  component={SupportScreen}
  options={{ headerShown: false }}
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
