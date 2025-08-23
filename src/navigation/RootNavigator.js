// import React from "react";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";

// import WelcomeScreen from "../screens/WelcomeScreen";
// import LoginScreen from "../screens/LoginScreen";
// import SignUpScreen from "../screens/SignUpScreen";
// import SignUpCustomerScreen from "../screens/SignUpCustomerScreen";
// import SignUpMerchantScreen from "../screens/SignUpMerchantScreen";
// import SignupResultScreen from "../screens/SignupResultScreen";
// import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
// import TabNavigator from "./TabNavigator";
// import CountrySelectScreen from "../screens/CountrySelectScreen";
// import OtpVerificationScreen from "../screens/OtpVerificationScreen";
// import OnboardingScreen from "../screens/OnboardingScreen";
// import ContactPickerScreen from "../screens/ContactPickerScreen";
// import SignUpChooser from "../screens/SignUpChooser";
// import PasswordLoginScreen from "../screens/PasswordLoginScreen";

// const Stack = createNativeStackNavigator();

// export default function RootNavigator() {
//   return (
//     <Stack.Navigator
//       initialRouteName="Welcome"
//       screenOptions={{ headerShown: false }}
//     >
//       <Stack.Screen name="Welcome" component={CountrySelectScreen} />

//       {/* <Stack.Screen name="Welcome" component={WelcomeScreen} /> */}
//       <Stack.Screen name="Onboarding" component={OnboardingScreen} />
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="LoginPassword" component={PasswordLoginScreen} />
//       <Stack.Screen name="SignUpChooser" component={SignUpChooser} />
//       <Stack.Screen name="SignUpCustomer" component={SignUpCustomerScreen} />
//       <Stack.Screen name="SignUpMerchant" component={SignUpMerchantScreen} />
//       <Stack.Screen name="SignupResult" component={SignupResultScreen} />
//       <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
//       <Stack.Screen name="Tabs" component={TabNavigator} />
//       <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
//       <Stack.Screen name="ContactPicker" component={ContactPickerScreen} />
//     </Stack.Navigator>
//   );
// }

// src/navigation/RootNavigator.js
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
import ContactPickerScreen from "../screens/ContactPickerScreen";
import SignUpChooser from "../screens/SignUpChooser";
import PasswordLoginScreen from "../screens/PasswordLoginScreen";
import { useAuth } from "../auth/AuthProvider";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { authed, initializing } = useAuth();

  if (initializing) return null;

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={authed ? "Tabs" : "Welcome"}
    >
      {authed ? (
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} />
        </>
      ) : (
        <>
          {/* Initial route when signed out */}
          <Stack.Screen name="Welcome" component={CountrySelectScreen} />
          {/* <Stack.Screen name="Welcome" component={WelcomeScreen} /> */}
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="LoginPassword" component={PasswordLoginScreen} />
          <Stack.Screen name="SignUpChooser" component={SignUpChooser} />
          <Stack.Screen
            name="SignUpCustomer"
            component={SignUpCustomerScreen}
          />
          <Stack.Screen
            name="SignUpMerchant"
            component={SignUpMerchantScreen}
          />
          <Stack.Screen name="SignupResult" component={SignupResultScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen
            name="OtpVerification"
            component={OtpVerificationScreen}
          />
          <Stack.Screen name="ContactPicker" component={ContactPickerScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
