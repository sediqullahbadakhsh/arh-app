import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import TodoScreen from '../screens/TodoScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { SERVICES } from '../constants/services';

import ProductSelectScreen from '../screens/topup/ProductSelectScreen';
import TopupFormScreen from '../screens/topup/TopupFormScreen';
import PaymentMethodScreen from '../screens/topup/PaymentMethodScreen';
import TopupResultScreen from '../screens/topup/TopupResultScreen';
import ContactPickerScreen from '../screens/ContactPickerScreen';

import DataCountryScreen from '../screens/databundle/DataCountryScreen';
import DataProductScreen from '../screens/databundle/DataProductScreen';
import DataPhoneScreen from '../screens/databundle/DataPhoneScreen';

const Stack = createNativeStackNavigator();

export default function HomeStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />

            <Stack.Screen name="TopupProducts" component={ProductSelectScreen} />
            <Stack.Screen name="TopupForm" component={TopupFormScreen} />
            <Stack.Screen name="TopupPayment" component={PaymentMethodScreen} />
            <Stack.Screen name="TopupResult" component={TopupResultScreen} />
            <Stack.Screen name="ContactPicker" component={ContactPickerScreen} />

            <Stack.Screen name="DataCountry" component={DataCountryScreen} />
            <Stack.Screen name="DataProducts" component={DataProductScreen} />
            <Stack.Screen name="DataPhone" component={DataPhoneScreen} />
            <Stack.Screen
                name="DataPayment"
                component={PaymentMethodScreen}
                initialParams={{ titleOverride: 'Internet', resultRouteName: 'DataResult' }}
            />
            <Stack.Screen
                name="DataResult"
                component={TopupResultScreen}
                initialParams={{ titleOverride: 'Internet' }}
            />

            {/* Dynamically add a Stack.Screen for every service key */}
            {SERVICES.filter(s => !['MobileTopup', 'DataBundle'].includes(s.key)).map((s) => (
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
