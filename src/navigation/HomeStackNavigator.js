// src/navigation/HomeStackNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeConsumerScreen from "../screens/HomeConsumerScreen";
import HomeMerchantScreen from "../screens/HomeMerchantScreen";
import TodoScreen from "../screens/TodoScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import { SERVICES } from "../constants/services";
import ProductSelectScreen from "../screens/topup/ProductSelectScreen";
import { useAuth } from "../auth/AuthProvider";
import GameCoinsScreen from "../screens/GameCoinsScreen";
import TopupFlowScreen from "../screens/TopupFlowScreen";
import DataFlowScreen from "../screens/DataFlowScreen";
import StockTransferScreen from "../screens/StockTransferScreen";

const Stack = createNativeStackNavigator();

export default function HomeStackNavigator() {
  const { user } = useAuth();
  const HomeEntry =
    user?.role === "b2b" ? HomeMerchantScreen : HomeConsumerScreen;

  console.log(user, "userser");
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeEntry} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="TopupProducts" component={ProductSelectScreen} />
      <Stack.Screen name="Data" component={DataFlowScreen} />
      <Stack.Screen name="GameCoins" component={GameCoinsScreen} />
      <Stack.Screen name="Topup" component={TopupFlowScreen} />
      <Stack.Screen name="StockTransfer" component={StockTransferScreen} />
      {SERVICES.filter(
        (s) => !["MobileTopup", "DataBundle"].includes(s.key)
      ).map((s) => (
        <Stack.Screen
          key={s.key}
          name={s.key}
          component={TodoScreen}
          initialParams={{ title: s.label }}
        />
      ))}
    </Stack.Navigator>
  );
}
