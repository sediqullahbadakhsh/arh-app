import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeStackNavigator from "./HomeStackNavigator";
import TransactionsScreen from "../screens/TransactionsScreen";
import ContactsScreen from "../screens/ContactsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import TopupFlowScreen from "../screens/TopupFlowScreen1";
import WalletStackNavigator from "./WalletStackNavigator";
import ReportStackNavigator from "./ReportStackNavigator";
import AgentStackNavigator from "./AgentStackNavigator";
import { TouchableOpacity, View, Text } from "react-native";
import { Colors } from "../theme/colors";
import { useAccess } from "../acl/AccessProvider";
import { useAuth } from "../auth/AuthProvider";
import { ACTIONS, SCREENS } from "../acl/permissions";
import Feather from "react-native-vector-icons/Feather";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileStackNavigator from "./ProfileStackNavigator";


const Tab = createBottomTabNavigator();

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
      show: can(
        () => access?.can?.(ACTIONS.SEE_CONTACTS) && canUse(SCREENS?.CONTACTS)
      ),
    },
    {
      name: "TopupTab",
      label: "Top-up",
      icon: "zap",
      component: TopupFlowScreen,
      show: true,
    },
    {
      name: "Statements",
      label: "Statement",
      icon: "file-text",
      component: TransactionsScreen,
      show: true,
    },
    {
      name: "Profile",
      label: "Setting",
      icon: "settings",
      component: ProfileScreen,
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
      component: ProfileStackNavigator,

      show: can(() => canUse(SCREENS?.PROFILE)),
    },
  ];

  const tabs = (role === "b2b" ? TABS_B2B : TABS_B2C).filter((t) => t.show);

  if (tabs.length === 0) return null;

  const initial = tabs.find((t) => t.name === "HomeTab")
    ? "HomeTab"
    : tabs[0].name;

  return (
    <Tab.Navigator
      initialRouteName={initial}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#BDBDBD",
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: "#fff",
        },
        tabBarIcon: ({ color, size }) => {
          const tab = tabs.find((t) => t.name === route.name);
          const iconName = tab?.icon ?? "circle";
          return (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Feather name={iconName} size={size} color={color} />
              <View style={{ height: 4 }} />
            </View>
          );
        },
        tabBarLabel: ({ color, children }) => (
          <Text style={{ color, fontSize: 11, marginTop: 1 }}>{children}</Text>
        ),
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={1} />,
      })}
    >
      {tabs.map((t) => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{ tabBarLabel: t.label }}
        />
      ))}
    </Tab.Navigator>
  );
}