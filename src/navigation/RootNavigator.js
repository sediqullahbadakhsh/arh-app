import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/loginScreen/LoginScreen";
import SignUpCustomerScreen from "../screens/SignUpCustomerScreen";
import SignUpMerchantScreen from "../screens/SignUpMerchantScreen";
import SignupResultScreen from "../screens/SignupResultScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen/ForgotPasswordScreen";
import TabNavigator from "./TabNavigator";
import CountrySelectScreen from "../screens/introCountrySelectorScreen/CountrySelectScreen";
import OtpVerificationScreen from "../screens/OtpVerificationScreen";
import OnboardingScreen from "../screens/onboardingScreen/OnboardingScreen";
import ContactPickerScreen from "../screens/ContactPickerScreen";
import SignUpChooser from "../screens/SignUpChooser";
import PasswordLoginScreen from "../screens/PasswordLoginScreen";
import { useAuth } from "../auth/AuthProvider";
import { useUser } from "../context/userContext";
import { Text } from "react-native";
import AllTransactionsScreen from "../screens/AllTransactionsScreen";
import MerchantAnalyticsScreen from "../screens/MerchantAnalyticsScreen";
import TopupFlowScreen from "../screens/topupScreen/TopupFlowScreen1";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { authed, initializing } = useAuth();
  const { user, loading } = useUser();

  if (initializing) return null;
  if (loading) {
    return <Text>loading...</Text>; 
  }
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
          <Stack.Screen name="Welcome" component={CountrySelectScreen} />
          {/* <Stack.Screen name="Welcome" component={WelcomeScreen} /> */}
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen 
  name="AllTransactions" 
  component={AllTransactionsScreen} 
  options={{ headerShown: false }}
/>
    <Stack.Screen 
  name="MerchantAnalytics" 
  component={MerchantAnalyticsScreen} 
/>
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
           <Stack.Screen
            name="Topup1"
            component={TopupFlowScreen}
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
