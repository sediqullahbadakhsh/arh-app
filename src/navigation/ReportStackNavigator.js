import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReportsHome from "../screens/reports/ReportsHome";
import ReportListScreen from "../screens/reports/ReportListScreen";
import StatementReportScreen from "../screens/reports/StatementReportScreen";
import StatementDetailScreen from "../screens/reports/StatementDetailScreen";

const Stack = createNativeStackNavigator();

export default function ReportStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsHome" component={ReportsHome} />
      <Stack.Screen name="StatementReport" component={StatementReportScreen} />
<Stack.Screen name="StatementDetail" component={StatementDetailScreen} />
      <Stack.Screen name="ReportList" component={ReportListScreen} />
    </Stack.Navigator>
  );
}
