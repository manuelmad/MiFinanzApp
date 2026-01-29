import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import MonthDetailScreen from './src/screens/MonthDetailScreen';
import MonthSelectionScreen from './src/screens/MonthSelectionScreen';
import YearSelectionScreen from './src/screens/YearSelectionScreen';
// CreateMonthModal will be a modal screen or component

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'MiFinanzApp' }}
            />
            <Stack.Screen
              name="MonthSelection"
              component={MonthSelectionScreen}
              options={{ title: 'Seleccionar Mes' }}
            />
            <Stack.Screen
              name="MonthDetail"
              component={MonthDetailScreen}
              options={{ title: 'Detalle del Mes', headerShown: false }}
            />
            <Stack.Screen
              name="YearSelection"
              component={YearSelectionScreen}
              options={{ title: 'Estadísticas Anuales' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
