import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Services
import { initializeApp } from './services/AppInitializationService';
import { NotificationService } from './services/NotificationService';
import { OfflineService } from './services/OfflineService';

// Stores
import { useAuthStore } from './stores/authStore';

// Screens - Auth
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';

// Screens - Worker
import WorkerDashboardScreen from './screens/worker/DashboardScreen';
import JobSearchScreen from './screens/worker/JobSearchScreen';
import ApplicationsScreen from './screens/worker/ApplicationsScreen';
import MessagesScreen from './screens/worker/MessagesScreen';
import ProfileScreen from './screens/worker/ProfileScreen';

// Screens - Employer
import EmployerDashboardScreen from './screens/employer/DashboardScreen';
import JobManagementScreen from './screens/employer/JobManagementScreen';
import CandidatesScreen from './screens/employer/CandidatesScreen';
import AnalyticsScreen from './screens/employer/AnalyticsScreen';

// Screens - Shared
import ChatScreen from './screens/shared/ChatScreen';
import NotificationsScreen from './screens/shared/NotificationsScreen';

// Theme
import { theme } from './config/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

const WorkerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
          case 'Dashboard':
            iconName = 'dashboard';
            break;
          case 'Jobs':
            iconName = 'work';
            break;
          case 'Applications':
            iconName = 'assignment';
            break;
          case 'Messages':
            iconName = 'message';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          default:
            iconName = 'circle';
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: styles.tabBar,
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={WorkerDashboardScreen} />
    <Tab.Screen name="Jobs" component={JobSearchScreen} />
    <Tab.Screen name="Applications" component={ApplicationsScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const EmployerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
          case 'Dashboard':
            iconName = 'dashboard';
            break;
          case 'Jobs':
            iconName = 'work';
            break;
          case 'Candidates':
            iconName = 'people';
            break;
          case 'Analytics':
            iconName = 'analytics';
            break;
          case 'Messages':
            iconName = 'message';
            break;
          default:
            iconName = 'circle';
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: styles.tabBar,
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={EmployerDashboardScreen} />
    <Tab.Screen name="Jobs" component={JobManagementScreen} />
    <Tab.Screen name="Candidates" component={CandidatesScreen} />
    <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#fff' },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const MainStack = ({ userType }) => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen 
      name="MainTabs" 
      component={userType === 'WORKER' ? WorkerTabs : EmployerTabs} 
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{
        headerShown: true,
        headerTitle: 'Chat',
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
      }}
    />
    <Stack.Screen 
      name="Notifications" 
      component={NotificationsScreen}
      options={{
        headerShown: true,
        headerTitle: 'Notifications',
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
      }}
    />
  </Stack.Navigator>
);

const App = () => {
  const { isLoggedIn, userType, initializeAuth } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize app services
        await initializeApp();
        
        // Initialize authentication
        await initializeAuth();
        
        // Initialize notification service
        await NotificationService.initialize();
        
        // Initialize offline service
        await OfflineService.initialize();
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initialize();
  }, [initializeAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={theme.colors.primary}
          />
          <NavigationContainer>
            {isLoggedIn ? (
              <MainStack userType={userType} />
            ) : (
              <AuthStack />
            )}
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 5,
    height: 60,
  },
});

export default App;