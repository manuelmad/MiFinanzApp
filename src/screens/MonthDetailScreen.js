import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import BalanceTab from './tabs/BalanceTab';
import IncomeTab from './tabs/IncomeTab';
import ExpensesTab from './tabs/ExpensesTab';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const MonthDetailScreen = ({ route }) => {
    const { year, month } = route.params;
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerTitle: `Mes: ${month}/${year}`,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: 'gray',
                tabBarActiveBackgroundColor: theme.colors.secondaryContainer,
                tabBarStyle: {
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom + 5,
                },
                tabBarItemStyle: {
                    margin: 5,
                    borderRadius: 10,
                }
            }}
        >
            <Tab.Screen
                name="Balance"
                component={BalanceTab}
                initialParams={{ year, month }}
                options={{
                    tabBarLabel: 'Balance',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="balance-scale-right" size={24} color="black" />,
                }}
            />
            <Tab.Screen
                name="Ingresos"
                component={IncomeTab}
                initialParams={{ year, month }}
                options={{
                    tabBarLabel: 'Ingresos Reales',
                    tabBarIcon: ({ color }) => <FontAwesome6 name="money-bill-trend-up" size={24} color="#4CAF50" />,
                }}
            />
            <Tab.Screen
                name="Egresos"
                component={ExpensesTab}
                initialParams={{ year, month }}
                options={{
                    tabBarLabel: 'Egresos Reales',
                    tabBarIcon: ({ color }) => <FontAwesome6 name="arrow-trend-down" size={24} color="#F44336" />,
                }}
            />
        </Tab.Navigator>
    );
};

export default MonthDetailScreen;
