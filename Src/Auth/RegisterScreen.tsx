import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useAuth } from '../Context/AuthContext'

export default function RegisterScreen({ navigation }: any) {

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'patient' | 'caregiver'>('patient')
  const [loading, setLoading] = useState(false)

  const { signUp, state } = useAuth()

  useEffect(() => {
    if (state.userToken && !state.isLoading) {
      console.log('Registration successful')
    }
  }, [state.userToken, state.isLoading])

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Missing details', 'Please fill all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await signUp(name, email, password, role)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Registration failed'

      Alert.alert('Registration Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#F8FAF7', '#EEF6E8', '#FFFFFF']} style={{ flex: 1 }}>

      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <LinearGradient
        colors={['transparent', 'rgba(199,255,60,0.18)', 'rgba(199,255,60,0.28)']}
        style={styles.bottomGlow}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.content}>

          {/* BRAND */}
          <Text style={styles.brand}>Alzhe</Text>
          <Text style={styles.subtitle}>Your gentle memory companion</Text>

          {/* HEADER */}
          <View style={styles.headerBlock}>
            <Text style={styles.headerTitle}>Create your account</Text>
            <Text style={styles.headerCaption}>Start your calm memory journey</Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={name}
              editable={!loading}
              onChangeText={setName}
            />

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              editable={!loading}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              value={password}
              editable={!loading}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              editable={!loading}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {/* ROLE */}
            <Text style={styles.label}>I am a</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                disabled={loading}
                style={[styles.rolePill, role === 'patient' && styles.roleActive]}
                onPress={() => setRole('patient')}
              >
                <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>
                  Patient
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={loading}
                style={[styles.rolePill, role === 'caregiver' && styles.roleActive]}
                onPress={() => setRole('caregiver')}
              >
                <Text style={[styles.roleText, role === 'caregiver' && styles.roleTextActive]}>
                  Caregiver
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#1F2937"/>
                : <Text style={styles.registerText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already registered? </Text>
              <TouchableOpacity disabled={loading} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  brand: {
    fontSize: 44,
    fontFamily: 'Coolvetica-Bold',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 28,
    fontFamily: 'Coolvetica-Regular',
  },

  headerBlock: {
    alignItems: 'center',
    marginBottom: 26,
  },

  headerTitle: {
    fontSize: 28,
    fontFamily: 'Coolvetica-Bold',
    color: '#1F2937',
  },

  headerCaption: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Coolvetica-Regular',
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },

  label: {
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 6,
    marginTop: 12,
    fontFamily: 'Coolvetica-Bold',
  },

  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Coolvetica-Regular',
    color: '#1F2937',
  },

  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },

  rolePill: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: 'center',
  },

  roleActive: {
    backgroundColor: '#E3F73F',
  },

  roleText: {
    fontFamily: 'Coolvetica-Bold',
    color: '#6B7280',
    fontSize: 16,
  },

  roleTextActive: {
    color: '#1F2937',
  },

  registerButton: {
    backgroundColor: '#E3F73F',
    marginTop: 28,
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
  },

  registerText: {
    color: '#1F2937',
    fontSize: 18,
    fontFamily: 'Coolvetica-Bold',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },

  footerText: {
    color: '#6B7280',
    fontFamily: 'Coolvetica-Regular',
  },

  loginLink: {
    color: '#1F2937',
    fontFamily: 'Coolvetica-Bold',
  },

  circle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(199,255,60,0.25)',
    top: -60,
    right: -60,
  },

  circle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(160,200,255,0.15)',
    bottom: -80,
    left: -60,
  },

  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
  },
})
