import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import BalanceTab from './tabs/BalanceTab';
import IncomeTab from './tabs/IncomeTab';
import ExpensesTab from './tabs/ExpensesTab';

const Tab = createBottomTabNavigator();

const MonthDetailScreen = ({ route }) => {
    const { year, month } = route.params;
    const theme = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerTitle: `Mes: ${month}/${year}`,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: 'gray',
            }}
        >
            <Tab.Screen
                name="Balance"
                component={BalanceTab}
                initialParams={{ year, month }}
                options={{
                    tabBarLabel: 'Balance',
                    // icon can be added here if vector-icons installed, skipping for now as not strictly requested and to avoid complexities with font linking in bare react native if not using expo-vector-icons correctly. Expo usually has it.
                    // But user didn't ask for specific icons.
                }}
            />
            <Tab.Screen
                name="Ingresos"
                component={IncomeTab}
                initialParams={{ year, month }}
                options={{
                    tabBarLabel: 'Ingresos Reales'
                }}
            />
            <Tab.Screen
                name="Egresos"
                component={ExpensesTab}
                initialParams={{ year, month }}
                options={{
                    tabBarLabel: 'Egresos Reales'
                }}
            />
        </Tab.Navigator>
    );
};

export default MonthDetailScreen;
