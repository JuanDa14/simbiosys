import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartScreen } from './src/screens/CartScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: '#1a5f4a',
          }}
        >
          <Tab.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: 'Nuevo Pedido', tabBarLabel: 'Pedido' }}
          />
          <Tab.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: 'Historial', tabBarLabel: 'Historial' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
