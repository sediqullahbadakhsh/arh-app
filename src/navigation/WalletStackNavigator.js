// src/navigation/WalletStackNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WalletScreen from "../screens/WalletScreen";
import TransferToPrimaryScreen from "../screens/TransferToPrimaryScreen";
import TransferToPrimarySuccess from "../screens/TransferToPrimarySuccess";

const Stack = createNativeStackNavigator();

export default function WalletStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletHome" component={WalletScreen} />
      <Stack.Screen
        name="TransferToPrimary"
        component={TransferToPrimaryScreen}
      />
      <Stack.Screen
        name="TransferToPrimarySuccess"
        component={TransferToPrimarySuccess}
      />
    </Stack.Navigator>
  );
}
