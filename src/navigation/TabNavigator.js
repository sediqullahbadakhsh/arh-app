// src/navigation/TabNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeStackNavigator from "./HomeStackNavigator";
import TransactionsScreen from "../screens/TransactionsScreen";
import ContactsScreen from "../screens/ContactsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import TopupTabScreen from "../screens/TopupTabScreen";
import WalletScreen from "../screens/WalletScreen";
import AgentScreen from "../screens/AgentScreen";
import ReportScreen from "../screens/ReportScreen";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { useAccess } from "../acl/AccessProvider";
import { useAuth } from "../auth/AuthProvider";
import { ACTIONS, SCREENS } from "../acl/permissions";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const access = useAccess();
  const { user } = useAuth();
  const role = user?.role === "b2b" ? "b2b" : "b2c";

  const can = (fn) => (typeof fn === "function" ? fn() : true);
  const canUse = (screenId) =>
    access?.canUseScreen ? access.canUseScreen(screenId) : true;

  // ----- Define tab sets -----
  const TABS_B2C = [
    {
      name: "HomeTab",
      label: "Home",
      icon: "home",
      component: HomeStackNavigator,
      show: can(() => canUse(SCREENS?.HOME)),
    },
    {
      name: "Contacts",
      label: "Contacts",
      icon: "people",
      component: ContactsScreen,
      show: can(
        () => access?.can?.(ACTIONS.SEE_CONTACTS) && canUse(SCREENS?.CONTACTS)
      ),
    },
    {
      name: "TopupTab",
      label: "Top-up",
      icon: "flash",
      component: TopupTabScreen,
      show: true,
    }, // placeholder
    {
      name: "Statements",
      label: "Statement",
      icon: "document-text",
      component: TransactionsScreen,
      show: true,
    }, // reusing Transactions
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
      icon: "wallet",
      component: WalletScreen,
      show: true,
    },
    {
      name: "Agent",
      label: "Agent",
      icon: "people-circle",
      component: AgentScreen,
      show: true,
    },
    {
      name: "Report",
      label: "Report",
      icon: "stats-chart",
      component: ReportScreen,
      show: true,
    },
    {
      name: "Profile",
      label: "Profile",
      icon: "person",
      component: ProfileScreen,
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
          const icon = tab?.icon ?? "ellipse";
          return <Ionicons name={icon} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 11, marginTop: -4 },
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
