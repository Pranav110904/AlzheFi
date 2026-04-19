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

export default function LoginScreen({ navigation }: any) {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, state } = useAuth()

  useEffect(() => {
    if (state.userToken && !state.isLoading) {
      console.log('Login successful!')
    }
  }, [state.userToken, state.isLoading])

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Please fill all fields')
      return
    }

    setLoading(true)

    try {
      await signIn(email, password)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed'

      Alert.alert('Login Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#F8FAF7', '#EEF6E8', '#FFFFFF']} style={{ flex: 1 }}>

      {/* decorative top shapes */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* bottom glow */}
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
            <Text style={styles.headerTitle}>Welcome back</Text>
            <Text style={styles.headerCaption}>Sign in to continue</Text>
          </View>

          {/* CARD */}
          <View style={styles.card}>

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
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              value={password}
              editable={!loading}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.loginButton, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#1F2937" />
                : <Text style={styles.loginButtonText}>Continue</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity disabled={loading} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Create an account</Text>
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

  /* BRAND */
  brand: {
    fontSize: 44,
    fontFamily: 'SpaceGrotesk-Bold',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 28,
    fontFamily: 'SpaceGrotesk-Regular',
  },

  /* HEADER */
  headerBlock: {
    alignItems: 'center',
    marginBottom: 26,
  },

  headerTitle: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#1F2937',
  },

  headerCaption: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'SpaceGrotesk-Regular',
  },

  /* CARD */
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
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 6,
    marginTop: 10,
    fontFamily: 'SpaceGrotesk-Bold',
  },

  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },

  loginButton: {
    backgroundColor: '#E3F73F',
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
    shadowColor: '#E3F73F',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },

  loginButtonText: {
    color: '#1F2937',
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },

  footerText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },

  registerLink: {
    color: '#1F2937',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },

  /* decorations */
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
});