// src/navigation/ReportStackNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReportsHome from "../screens/reports/ReportsHome";
import ReportListScreen from "../screens/reports/ReportListScreen";

const Stack = createNativeStackNavigator();

export default function ReportStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsHome" component={ReportsHome} />
      {/* Reuse one generic list screen; pass type via params */}
      <Stack.Screen name="ReportList" component={ReportListScreen} />
    </Stack.Navigator>
  );
}
