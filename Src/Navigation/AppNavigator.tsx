import React from 'react';
import PatientTabNavigator from './PatientTabNavigator';
import CaregiverNavigator from './CaregiverNavigator';
import { useAuth } from '../Context/AuthContext';

export default function AppNavigator() {
  const { state } = useAuth();

  if (state.user?.role === 'caregiver') {
  return <CaregiverNavigator />;
} else {
  return <PatientTabNavigator />;
}


}
