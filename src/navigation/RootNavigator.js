import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SignUpCustomerScreen from "../screens/SignUpCustomerScreen";
import SignUpMerchantScreen from "../screens/SignUpMerchantScreen";
import SignupResultScreen from "../screens/SignupResultScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import TabNavigator from "./TabNavigator";
import CountrySelectScreen from "../screens/CountrySelectScreen";
import OtpVerificationScreen from "../screens/OtpVerificationScreen";
import OnboardingScreen from "../screens/OnboardingScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={CountrySelectScreen} />

      {/* <Stack.Screen name="Welcome" component={WelcomeScreen} /> */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUpCustomer" component={SignUpCustomerScreen} />
      <Stack.Screen name="SignUpMerchant" component={SignUpMerchantScreen} />
      <Stack.Screen name="SignupResult" component={SignupResultScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
