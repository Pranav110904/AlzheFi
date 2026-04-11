import React, { useEffect,useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './Src/Context/AuthContext';
import AuthNavigator from './Src/Navigation/AuthNavigator';
import AppNavigator from './Src/Navigation/AppNavigator';
import IntroScreen from './Src/Screens/IntroScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { state, bootstrapAsync } = useAuth();
  const [appState, setAppState] = useState<
    'loading' | 'intro' | 'auth' | 'app'
  >('loading');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await bootstrapAsync();

    const hasLaunched = await AsyncStorage.getItem('hasLaunched');

    if (!hasLaunched) {
      await AsyncStorage.setItem('hasLaunched', 'true');
      setAppState('intro');
      return;
    }

    if (state.userToken) {
      setAppState('app');
    } else {
      setAppState('auth');
    }
  };

  // React when token changes (after login)
useEffect(() => {
  if (state.userToken) {
    setAppState('app');
  } else {
    setAppState('auth');
  }
}, [state.userToken]);

  if (appState === 'loading') return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {appState === 'intro' && (
          <Stack.Screen name="Intro">
            {(props) => (
              <IntroScreen
                {...props}
                onFinish={() => setAppState('auth')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'auth' && (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}

        {appState === 'app' && (
          <Stack.Screen name="App" component={AppNavigator} />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
