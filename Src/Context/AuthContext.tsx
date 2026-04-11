import React, { createContext, useReducer, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiService } from '../Services/apiService'
import * as Types from '../Types'

// Helper to normalize user data from backend (uses _id) to frontend format (uses id)
const normalizeUser = (user: any): Types.User => {
  // Handle undefined or null user
  if (!user) {
    console.warn('normalizeUser received undefined/null user');
    return {
      id: '',
      _id: undefined,
      name: '',
      email: '',
      role: 'patient',
      linkedPatientIds: [],
    };
  }
  
  return {
    id: user._id || user.id || '',
    _id: user._id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'patient',
    linkedPatientIds: user.linkedPatientIds || [],
  };
}

interface AuthState {
  isLoading: boolean
  isSignout: boolean
  userToken: string | null
  user: Types.User | null
  error: string | null
}

interface AuthContextType {
  state: AuthState
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string, role: Types.UserRole) => Promise<void>
  signOut: () => Promise<void>
  bootstrapAsync: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'RESTORE_TOKEN'; payload: { token: string | null; user: Types.User | null } }
  | { type: 'SIGN_IN'; payload: { token: string; user: Types.User } }
  | { type: 'SIGN_UP'; payload: { token: string; user: Types.User } }
  | { type: 'SIGN_OUT' }
  | { type: 'SET_ERROR'; payload: string }

const initialState: AuthState = {
  isLoading: false,
  isSignout: false,
  userToken: null,
  user: null,
  error: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        userToken: action.payload.token,
        user: action.payload.user,
        isLoading: false,
      }
    case 'SIGN_IN':
      return {
        ...state,
        isSignout: false,
        userToken: action.payload.token,
        user: action.payload.user,
        error: null,
      }
    case 'SIGN_UP':
      return {
        ...state,
        isSignout: false,
        userToken: action.payload.token,
        user: action.payload.user,
        error: null,
      }
    case 'SIGN_OUT':
      return {
        ...state,
        isSignout: true,
        userToken: null,
        user: null,
        error: null,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const bootstrapAsync = useCallback(async () => {
    const timeoutPromise = new Promise<{ token: string | null; user: Types.User | null }>((resolve) =>
      setTimeout(() => resolve({ token: null, user: null }), 3000)
    );

    const bootstrapPromise = (async (): Promise<{ token: string | null; user: Types.User | null }> => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        return { token, user };
      } catch (e) {
        console.error('Failed to restore token:', e);
        return { token: null, user: null };
      }
    })();

    const result = await Promise.race([bootstrapPromise, timeoutPromise]);

    dispatch({
      type: 'RESTORE_TOKEN',
      payload: result,
    });
  }, []);


  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password })
      const { token, user } = response
      const normalizedUser = normalizeUser(user)

      await AsyncStorage.setItem('userToken', token)
      await AsyncStorage.setItem('user', JSON.stringify(normalizedUser))

      dispatch({
        type: 'SIGN_IN',
        payload: { token, user: normalizedUser },
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage,
      })
      throw error
    }
  }, [])

  const signUp = useCallback(
    async (name: string, email: string, password: string, role: Types.UserRole) => {
      console.log('AuthContext.signUp called with:', { name, email, role });
      try {
        const response = await apiService.register({ name, email, password, role })
        console.log('Registration API response received:', response);
        const { token, user } = response
        const normalizedUser = normalizeUser(user)
        console.log('Normalized user:', normalizedUser);

        await AsyncStorage.setItem('userToken', token)
        await AsyncStorage.setItem('user', JSON.stringify(normalizedUser))

        dispatch({
          type: 'SIGN_UP',
          payload: { token, user: normalizedUser },
        })
        console.log('SIGN_UP dispatched successfully');
      } catch (error: any) {
        console.error('Registration error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
        console.error('Error message:', errorMessage);
        dispatch({
          type: 'SET_ERROR',
          payload: errorMessage,
        })
        throw error
      }
    },
    [],
  )

  const signOut = useCallback(async () => {
  try {
    await apiService.logout(); // use centralized logout

    dispatch({ type: 'SIGN_OUT' });
  } catch (error) {
    console.error('Sign out error:', error);
  }
}, []);

  const value: AuthContextType = {
    state,
    signIn,
    signUp,
    signOut,
    bootstrapAsync,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
