
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeConsumerScreen from "../screens/homeConsumerScreen/HomeConsumerScreen";
import HomeMerchantScreen from "../screens/homeMerchantScreen/HomeMerchantScreen";
import TodoScreen from "../screens/TodoScreen";
import NotificationsScreen from "../screens/notificationScreen/NotificationsScreen";
import { SERVICES } from "../constants/services";
import ProductSelectScreen from "../screens/topup/ProductSelectScreen";
import { useAuth } from "../auth/AuthProvider";
import TopupFlowScreen from "../screens/TopupFlowScreen";
import DataFlowScreen from "../screens/dataFlowScreen/DataFlowScreen";
import StockTransferScreen from "../screens/StockTransferScreen";
import TopupFlowScreen1 from "../screens/topupScreen/TopupFlowScreen1";
import GameCoinsScreen from "../screens/gameCoinsScreen/GameCoinsScreen";
import MerchantApplicationScreen from "../screens/profileScreens/MerchantApllicationScreen";
import DataFlowScreenMerchant from "../screens/dataFlowScreen1/DataFlowScreen";


const Stack = createNativeStackNavigator();

export default function HomeStackNavigator() {
  const { user } = useAuth();
  console.log(user, "this is user2")
  const HomeEntry =
    user?.role === "b2b" ? HomeMerchantScreen : HomeConsumerScreen;

  console.log(user, "userser");
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeEntry} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="TopupProducts" component={ProductSelectScreen} />
      <Stack.Screen name="Data" component={DataFlowScreen} />
      <Stack.Screen name="DataMerchant" component={DataFlowScreenMerchant} />
      <Stack.Screen name="GameCoins" component={GameCoinsScreen} /> 
          <Stack.Screen 
       name="MerchantApplication" 
       component={MerchantApplicationScreen} 
     />
      <Stack.Screen name="Topup" component={TopupFlowScreen} />
      <Stack.Screen name="Topup1" component={TopupFlowScreen1} />
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
