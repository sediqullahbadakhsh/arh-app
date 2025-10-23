import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AgentListScreen from "../screens/agents/AgentListScreen";
import AgentCreateScreen from "../screens/agents/AgentCreateScreen";

import AgentViewScreen from "../screens/agents/AgentViewScreen";
import SignupResultScreen from "../screens/SignupResultScreen";
import AssignSlabScreen from "../screens/agents/AssignSlabScreen";
import AgentEditScreen from "../screens/agents/AgentEditScreen";
import AllTransactionsScreen from "../screens/AllTransactionsScreen";
import MerchantAnalyticsScreen from "../screens/MerchantAnalyticsScreen";
 
// import SignupResultScreen from "../screens/SignupResultScreen";

const Stack = createNativeStackNavigator();

export default function AgentStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgentList" component={AgentListScreen} />
      <Stack.Screen name="AgentCreate" component={AgentCreateScreen} />
      <Stack.Screen name="AgentView" component={AgentViewScreen} />
      <Stack.Screen name="SignupResult" component={SignupResultScreen} />
      <Stack.Screen name="AgentEdit" component={AgentEditScreen} />
      <Stack.Screen name="AssignSlab" component={AssignSlabScreen} />
               <Stack.Screen 
        name="AllTransactions" 
        component={AllTransactionsScreen} 
   
      />
      <Stack.Screen 
  name="MerchantAnalytics" 
  component={MerchantAnalyticsScreen} 
/>
    </Stack.Navigator>
  );
}
