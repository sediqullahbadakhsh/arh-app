import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AgentListScreen from "../screens/agents/AgentListScreen";
import AgentCreateScreen from "../screens/agents/AgentCreateScreen";
import AgentViewScreen from "../screens/agents/AgentViewScreen";

const Stack = createNativeStackNavigator();

export default function AgentStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgentList" component={AgentListScreen} />
      <Stack.Screen name="AgentCreate" component={AgentCreateScreen} />
      <Stack.Screen name="AgentView" component={AgentViewScreen} />
    </Stack.Navigator>
  );
}
