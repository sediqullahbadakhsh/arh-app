import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeStackNavigator from './HomeStackNavigator';
import TransactionsScreen from '../screens/TransactionsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            initialRouteName="HomeTab"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: '#BDBDBD',
                tabBarStyle: {
                    height: 60 + insets.bottom,           // raise the bar above the indicator
                    paddingTop: 6,
                    paddingBottom: Math.max(insets.bottom, 8),
                    backgroundColor: '#fff',
                },
                tabBarIcon: ({ color, size }) => {
                    let icon = 'home';
                    if (route.name === 'HomeTab') icon = 'home';
                    if (route.name === 'Transactions') icon = 'swap-horizontal';
                    if (route.name === 'Contacts') icon = 'people';
                    if (route.name === 'Profile') icon = 'person';
                    return <Ionicons name={icon} size={size} color={color} />;
                },
                tabBarLabelStyle: { fontSize: 11, marginTop: -4 },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStackNavigator}
                options={{ tabBarLabel: 'Home' }}
            />
            <Tab.Screen name="Transactions" component={TransactionsScreen} />
            <Tab.Screen name="Contacts" component={ContactsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
