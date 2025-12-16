import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TouchableOpacity, View, Text } from "react-native";
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
import { useTranslation } from "react-i18next";
import ProfileDetailsScreen from "../screens/profileScreens/profile";

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

const CustomTabBarButton = (props) => {
  return (
    <TouchableOpacity
      {...props}
      activeOpacity={1}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    />
  );
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const access = useAccess();
  const { user } = useAuth();
  const { t } = useTranslation();
  const role = user?.role === "b2b" ? "b2b" : "b2c";

  const can = (fn) => (typeof fn === "function" ? fn() : true);
  const canUse = (screenId) =>
    access?.canUseScreen ? access.canUseScreen(screenId) : true;

  const TABS_B2C = [
    {
      name: "Home",
      label: t('tabs.home'),
      icon: "home",
      component: HomeStackNavigator,
      show: can(() => canUse(SCREENS?.HOME)),
      stackReset: true, 
    },
    
    {
      name: "Order",
      label: t('tabs.orders'),
      icon: "shopping-cart",
      component: OrdersScreen,
      show: can(() => access?.can?.(ACTIONS.SEE_CONTACTS) && canUse(SCREENS?.CONTACTS)),
    },
    
    {
      name: "TopupTab",
      label: t('tabs.topup'),
      icon: "zap",
      component: TopupFlowScreen,
      show: true,
      initialParams: {}
    },
    
    {
      name: "Notifications",
      label: t('tabs.notifications'),
      icon: "bell",
      component: NotificationsScreen,
      show: true,
    },
    {
      name: "Setting",
      label: t('tabs.settings'),
      icon: "settings",
      component: ProfileStackNavigator,
      show: can(() => canUse(SCREENS?.PROFILE)),
      stackReset: true, 
    },
  ];

  const TABS_B2B = [
    {
      name: "Home",
      label: t('tabs.home'),
      icon: "home",
      component: HomeStackNavigator,
      show: can(() => canUse(SCREENS?.HOME)),
      stackReset: true,
    },
    {
      name: "Wallet",
      label: t('tabs.wallet'),
      icon: "credit-card",
      component: WalletStackNavigator,
      show: true,
      stackReset: true,
    },
    {
      name: "Agent",
      label: t('tabs.agents'),
      icon: "user-check",
      component: AgentStackNavigator,
      show: true,
      stackReset: true,
    },
    {
      name: "Report",
      label: t('tabs.reports'),
      icon: "bar-chart-2",
      component: ReportStackNavigator,
      show: true,
      stackReset: true,
    },
    {
      name: "Profile",
      label: t('tabs.profile'),
      icon: "user",
      component: ProfileStackNavigatorMerchant,
      show: can(() => canUse(SCREENS?.PROFILE)),
      stackReset: true,
    },
  ];

  const tabs = (role === "b2b" ? TABS_B2B : TABS_B2C).filter((t) => t.show);
  if (tabs.length === 0) return null;

  const initial = tabs.find((t) => t.name === "HomeTab") ? "HomeTab" : tabs[0].name;

  return (
    <View style={TabNavStyles.navigatorWrapper}>
      <Tab.Navigator
        initialRouteName={initial}
        screenOptions={({ route, navigation }) => {
          const tab = tabs.find((t) => t.name === route.name);
          const iconName = tab?.icon ?? "circle";
          const isMiddle = route.name === "TopupTab";

          return {
            headerShown: false,
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: "#888",
            tabBarStyle: {
              height: 60 + insets.bottom,
              paddingTop: 6,
              paddingBottom: Math.max(insets.bottom, 8),
              backgroundColor: "#f9f9f9",
              zIndex: 9999,
              elevation: 10,
              position: "absolute",
              borderTopWidth: 0.5,
              borderTopColor: "#ddd",
            },
            tabBarIcon: ({ color, size }) => (
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Feather name={iconName} size={size} color={color} />
                <View style={{ height: 4 }} />
              </View>
            ),
            tabBarLabel: ({ color, children }) => (
              <Text style={{ color, fontSize: Schp.hp(1.2) }}>{children}</Text>
            ),
            tabBarButton: (props) =>
              isMiddle ? (
                <CustomMiddleButton {...props} />
              ) : (
                <CustomTabBarButton {...props} />
              ),
          };
        }}
      >
        {tabs.map((t) => (
          <Tab.Screen 
            key={t.name} 
            name={t.name} 
            component={t.component}
            options={{
              title: t.label,
            }}
            listeners={({ navigation, route }) => ({
              tabPress: (e) => {
                const state = navigation.getState();
                const currentTabRoutes = state.routes.find(r => r.name === route.name);
                
                if (t.stackReset && currentTabRoutes?.state?.index > 0) {
                  e.preventDefault();
                  
                  navigation.reset({
                    index: 0,
                    routes: [{ name: route.name }],
                  });
                }
              },
            })}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
}