import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TouchableOpacity, View, Text, TabNavStylesheet, Platform } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import HomeStackNavigator from "./HomeStackNavigator";
import OrdersScreen from "../screens/orderScreen/OrdersScreen";
import TopupFlowScreen from "../screens/topupScreen/TopupFlowScreen1";
import ProfileStackNavigator from "./ProfileStackNavigator";
import WalletStackNavigator from "./WalletStackNavigator";
import ReportStackNavigator from "./ReportStackNavigator";
import AgentStackNavigator from "./AgentStackNavigator";
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import { Colors } from "../theme/colors";
import { useAccess } from "../acl/AccessProvider";
import { useAuth } from "../auth/AuthProvider";
import { ACTIONS, SCREENS } from "../acl/permissions";
import NotificationsScreen from "../screens/notificationScreen/NotificationsScreen";
import TabNavStyles from "./TabNavigatorStyle";
import { scale as Schp } from "../utils/normalizeSize";
import ProfileStackNavigatorMerchant from "./ProfileStackNavigatorMerchant";

const Tab = createBottomTabNavigator();

const CustomMiddleButton = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={TabNavStyles.middleButtonContainer}
  >
    <View style={TabNavStyles.middleButton}>
      <Feather name="zap" size={28} color="#fff" />
    </View>
  </TouchableOpacity>
);

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const access = useAccess();
  const { user } = useAuth();
  const role = user?.role === "b2b" ? "b2b" : "b2c";

  const can = (fn) => (typeof fn === "function" ? fn() : true);
  const canUse = (screenId) =>
    access?.canUseScreen ? access.canUseScreen(screenId) : true;

  const TABS_B2C = [
    {
      name: "HomeTab",
      label: "Home",
      icon: "home",
      component: HomeStackNavigator,
      show: can(() => canUse(SCREENS?.HOME)),
    },
    {
      name: "Order",
      label: "Order",
      icon: "shopping-cart",
      component: OrdersScreen,
      show: can(() => access?.can?.(ACTIONS.SEE_CONTACTS) && canUse(SCREENS?.CONTACTS)),
    },
    {
      name: "TopupTab",
      label: "Top-up",
      icon: "zap",
      component: TopupFlowScreen,
      show: true,
    },
    {
      name: "Notifications",
      label: "Notifications",
      icon: "bell",
      component: NotificationsScreen,
      show: true,
    },
    {
      name: "Setting",
      label: "Setting",
      icon: "settings",
      component: ProfileStackNavigator,
      show: can(() => canUse(SCREENS?.PROFILE)),
    },
  ];

  const TABS_B2B = [
    {
      name: "HomeTab",
      label: "Home",
      icon: "home",
      component: HomeStackNavigator,
      show: can(() => canUse(SCREENS?.HOME)),
    },
    {
      name: "Wallet",
      label: "Wallet",
      icon: "credit-card",
      component: WalletStackNavigator,
      show: true,
    },
    {
      name: "Agent",
      label: "Agent",
      icon: "user-check",
      component: AgentStackNavigator,
      show: true,
    },
    {
      name: "Report",
      label: "Report",
      icon: "bar-chart-2",
      component: ReportStackNavigator,
      show: true,
    },
    {
      name: "Profile",
      label: "Profile",
      icon: "user",
      component: ProfileStackNavigatorMerchant,
      show: can(() => canUse(SCREENS?.PROFILE)),
    },
  ];

  const tabs = (role === "b2b" ? TABS_B2B : TABS_B2C).filter((t) => t.show);
  if (tabs.length === 0) return null;

  const initial = tabs.find((t) => t.name === "HomeTab") ? "HomeTab" : tabs[0].name;

  return (
    <View style={TabNavStyles.navigatorWrapper}>
      <Tab.Navigator
        initialRouteName={initial}
        screenOptions={({ route }) => {
          const tab = tabs.find((t) => t.name === route.name);
          const iconName = tab?.icon ?? "circle";
          const isMiddle = route.name === "TopupTab";

          return {
            headerShown: false,
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: "#BDBDBD",
            tabBarStyle: {
              height: 60 + insets.bottom,
              paddingTop: 6,
              paddingBottom: Math.max(insets.bottom, 8),
              backgroundColor: "#fff",
              zIndex: 9999,
              elevation: 10,
              position: "absolute",
              borderTopWidth: 0,
            },
            tabBarIcon: ({ color, size }) => (
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Feather name={iconName} size={size} color={color} />
                <View style={{ height: 4 }} />
              </View>
            ),
            tabBarLabel: ({ color, children }) => (
              <Text style={{ color, fontSize: Schp.hp(1.2),  }}>{children}</Text>
            ),
            tabBarButton: (props) =>
              isMiddle ? <CustomMiddleButton {...props} /> : <TouchableOpacity {...props} activeOpacity={1} />,
          };
        }}
      >
        {tabs.map((t) => (
          <Tab.Screen key={t.name} name={t.name} component={t.component} />
        ))}
      </Tab.Navigator>
    </View>
  );
}

