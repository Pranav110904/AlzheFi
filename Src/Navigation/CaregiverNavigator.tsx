import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, BackHandler, ToastAndroid } from 'react-native';
import { useNavigationState, useFocusEffect } from '@react-navigation/native';

// ICONS
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

// Screens
import DashboardScreen from '../Screens/Caregiver/DashboardScreen';
import PatientsScreen from '../Screens/Caregiver/PatientsScreen';
import MemoriesScreen from '../Screens/Caregiver/MemoriesScreen';
import RemindersScreen from '../Screens/Caregiver/ReminderScreen';
import ProfileScreen from '../Screens/Caregiver/ProfileScreen';

const Tab = createBottomTabNavigator();

/* ---------- BUTTON WITHOUT RIPPLE ---------- */
function NoRippleButton({ children, onPress }: any) {
  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} style={styles.noRipple}>
      {children}
    </TouchableOpacity>
  );
}

/* ---------- ICON WRAPPER ---------- */
function CircleIcon({ routeName, renderIcon }: any) {
  const currentRoute = useNavigationState(state => state.routes[state.index].name);
  const focused = currentRoute === routeName;

  return (
    <View style={[styles.circle, focused && styles.circleActive]}>
      {renderIcon(focused)}
    </View>
  );
}

/* ---------- CENTER DASHBOARD BUTTON ---------- */
function DashboardButton({ onPress }: any) {
  const currentRoute = useNavigationState(state => state.routes[state.index].name);
  const focused = currentRoute === 'Dashboard';

  return (
    <TouchableOpacity style={styles.dashboardButton} onPress={onPress} activeOpacity={1}>
      <View style={[styles.dashboardInner, focused && styles.dashboardInnerActive]}>
        <MaterialIcons
          name="dashboard"
          size={32}
          color={focused ? '#1F2937' : '#FFFFFF'}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function CaregiverTabNavigator() {
  const backPressTime = useRef<number | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        const now = Date.now();
        if (backPressTime.current && now - backPressTime.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        backPressTime.current = now;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F1EC' }}>
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          animation: 'none',
          tabBarPressColor: 'transparent',
          tabBarPressOpacity: 1,
        }}
      >

        {/* PATIENTS */}
        <Tab.Screen
          name="Patients"
          component={PatientsScreen}
          options={{
            tabBarButton: (props) => (
              <NoRippleButton {...props}>
                <CircleIcon
                  routeName="Patients"
                  renderIcon={(focused: boolean) => (
                    <FontAwesome5
                      name="user-friends"
                      size={22}
                      color={focused ? '#1F2937' : '#FFFFFF'}
                    />
                  )}
                />
              </NoRippleButton>
            ),
          }}
        />

        {/* MEMORIES */}
        <Tab.Screen
          name="Memories"
          component={MemoriesScreen}
          options={{
            tabBarButton: (props) => (
              <NoRippleButton {...props}>
                <CircleIcon
                  routeName="Memories"
                  renderIcon={(focused: boolean) => (
                    <MaterialIcons
                      name="photo-library"
                      size={26}
                      color={focused ? '#1F2937' : '#FFFFFF'}
                    />
                  )}
                />
              </NoRippleButton>
            ),
          }}
        />

        {/* DASHBOARD CENTER */}
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarButton: (props) => <DashboardButton {...props} />,
          }}
        />

        {/* REMINDERS */}
        <Tab.Screen
          name="Reminders"
          component={RemindersScreen}
          options={{
            tabBarButton: (props) => (
              <NoRippleButton {...props}>
                <CircleIcon
                  routeName="Reminders"
                  renderIcon={(focused: boolean) => (
                    <MaterialCommunityIcons
                      name="bell-alert-outline"
                      size={28}
                      color={focused ? '#1F2937' : '#FFFFFF'}
                    />
                  )}
                />
              </NoRippleButton>
            ),
          }}
        />

        {/* PROFILE */}
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarButton: (props) => (
              <NoRippleButton {...props}>
                <CircleIcon
                  routeName="Profile"
                  renderIcon={(focused: boolean) => (
                    <Feather
                      name="user"
                      size={24}
                      color={focused ? '#1F2937' : '#FFFFFF'}
                    />
                  )}
                />
              </NoRippleButton>
            ),
          }}
        />

      </Tab.Navigator>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: '#F4F1EC',
    borderTopWidth: 1,
    borderTopColor: '#E5E0D8',
    elevation: 0,
    shadowColor: 'transparent',
    paddingHorizontal: 18,
  },

  noRipple: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  circle: {
    width: 65,
    height: 65,
    borderRadius: 29,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },

  circleActive: {
    backgroundColor: '#E3F73F',
    transform: [{ scale: 1.15 }],
    borderColor: '#1F2937',
    borderWidth: 2,
  },

  dashboardButton: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dashboardInner: {
    width: 85,
    height: 85,
    borderRadius: 40,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dashboardInnerActive: {
    backgroundColor: '#E3F73F',
    transform: [{ scale: 1.12 }],
    borderColor: '#1F2937',
    borderWidth: 2,
  },
});