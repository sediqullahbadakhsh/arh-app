
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeConsumerScreen from "../screens/homeConsumerScreen/HomeConsumerScreen";
import HomeMerchantScreen from "../screens/homeMerchantScreen/HomeMerchantScreen";
import NotificationsScreen from "../screens/notificationScreen/NotificationsScreen";
import ProductSelectScreen from "../screens/topup/ProductSelectScreen";
import { useAuth } from "../auth/AuthProvider";
import TopupFlowScreen from "../screens/TopupFlowScreen";
import DataFlowScreen from "../screens/dataFlowScreen/DataFlowScreen";
import StockTransferScreen from "../screens/StockTransferScreen";
import TopupFlowScreen1 from "../screens/topupScreen/TopupFlowScreen1";
import GameCoinsScreen from "../screens/gameCoinsScreen/GameCoinsScreen";
import MerchantApplicationScreen from "../screens/profileScreens/MerchantApllicationScreen";
import DataFlowScreenMerchant from "../screens/dataFlowScreen1/DataFlowScreen";
import AllTransactionsScreen from "../screens/AllTransactionsScreen";
import MerchantAnalyticsScreen from "../screens/MerchantAnalyticsScreen";
import GameActivationScreen from "../screens/gameCoinsScreen/GameActivationScreen";
import ProfileDetailsScreen from "../screens/profileScreens/profile";
import SocialCustomerScreen from "../screens/socialScreen/SocialScreen";
import SocialActivationCustomerScreen from "../screens/socialScreen/SocialActivationScreen";
import GameCoinsMerchantScreen from "../screens/gameCoinsScreenMerchant/GameCoinsScreen";
import GameActivationMerchantScreen from "../screens/gameCoinsScreenMerchant/GameActivationScreen";
import SocialMerchantScreen from "../screens/socialScreenMerchant/SocialScreen";
import SocialActivationMerchantScreen from "../screens/socialScreenMerchant/SocialActivationScreen";
import ProfileScreenMerchant from "../screens/ProfileScreenMerchant";
import PurchaseStockScreen from "../screens/stockRequest/stockRequestScreen";





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
                 <Stack.Screen 
              name="AllTransactions" 
              component={AllTransactionsScreen} 
              options={{ headerShown: false }}
            />
                <Stack.Screen 
              name="MerchantAnalytics" 
              component={MerchantAnalyticsScreen} 
            />
      <Stack.Screen name="GameCoins" component={GameCoinsScreen} /> 
      <Stack.Screen name="StockRequest" component={PurchaseStockScreen} /> 
      <Stack.Screen name="GameActivationCustomer" component={GameActivationScreen} />
      <Stack.Screen name="GameCoinsMerchant" component={GameCoinsMerchantScreen} /> 
      <Stack.Screen name="GameActivationMerchant" component={GameActivationMerchantScreen} /> 
      <Stack.Screen name="SocialScreen" component={SocialCustomerScreen} /> 
      <Stack.Screen name="SocialActivationScreen" component={SocialActivationCustomerScreen} /> 
      <Stack.Screen name="SocialScreenMerchant" component={SocialMerchantScreen} /> 
      <Stack.Screen name="SocialActivationMerchantScreen" component={SocialActivationMerchantScreen} /> 
          <Stack.Screen 
       name="MerchantApplication" 
       component={MerchantApplicationScreen} 
     />
         <Stack.Screen 
       name="profileDetails" 
       component={ProfileDetailsScreen} 
     />
      <Stack.Screen
             name="ProfileMerchant"
             component={ProfileScreenMerchant}
           />
      <Stack.Screen name="Topup" component={TopupFlowScreen} />
      <Stack.Screen name="Topup1" component={TopupFlowScreen1} />
      <Stack.Screen name="StockTransfer" component={StockTransferScreen} />
     
    </Stack.Navigator>
  );
}
