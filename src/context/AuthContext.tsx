import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { toast } from 'sonner';

type User = {
  id: string;
  email: string;
  name: string;
  subscription: 'free' | 'premium';
  conversionsUsed: number;
  maxFreeConversions: number;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateSubscription: (plan: 'free' | 'premium') => Promise<void>;
  incrementConversionsUsed: () => Promise<void>;
  hasRemainingFreeConversions: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const MAX_FREE_CONVERSIONS = 10;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          if (!navigator.onLine) {
            console.log('User is offline, using local info if available');
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.email ? firebaseUser.email.split('@')[0] : '',
              subscription: 'free',
              conversionsUsed: 0,
              maxFreeConversions: MAX_FREE_CONVERSIONS
            });
            setIsLoading(false);
            return;
          }

          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: userData.email || '',
              name: userData.name || '',
              subscription: userData.subscription as 'free' | 'premium',
              conversionsUsed: userData.conversionsUsed || 0,
              maxFreeConversions: MAX_FREE_CONVERSIONS
            });
          } else {
            const newUser = {
              email: firebaseUser.email || '',
              name: firebaseUser.email ? firebaseUser.email.split('@')[0] : '',
              subscription: 'free' as const,
              conversionsUsed: 0,
              createdAt: serverTimestamp()
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            
            setUser({
              id: firebaseUser.uid,
              ...newUser,
              maxFreeConversions: MAX_FREE_CONVERSIONS
            });
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.email ? firebaseUser.email.split('@')[0] : '',
            subscription: 'free',
            conversionsUsed: 0,
            maxFreeConversions: MAX_FREE_CONVERSIONS
          });
          
          if (navigator.onLine) {
            toast.error('Error loading user data. Some features may be limited.');
          } else {
            toast.error('You appear to be offline. Limited functionality available.');
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatAuthError = (error: AuthError): string => {
    const errorCode = error.code;
    console.log('Auth error code:', errorCode);
    
    switch(errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please log in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. It should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'The email address is badly formatted.';
      case 'auth/operation-not-allowed':
        return 'Email/Password authentication is not enabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Access temporarily disabled due to many failed login attempts. Try again later.';
      default:
        return error.message || 'An unknown error occurred. Please try again.';
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection and try again.');
      }
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = formatAuthError(error as AuthError);
      toast.error('Login failed', { description: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection and try again.');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      const newUser = {
        email: email,
        name: email.split('@')[0],
        subscription: 'free' as const,
        conversionsUsed: 0,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      const userObject = {
        id: firebaseUser.uid,
        ...newUser,
        maxFreeConversions: MAX_FREE_CONVERSIONS
      };
      
      setUser(userObject);
      setIsLoading(false);
      
      return userObject;
      
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = formatAuthError(error as AuthError);
      toast.error('Signup failed', { description: errorMessage });
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error('Logout failed', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (plan: 'free' | 'premium') => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        subscription: plan
      });
      
      setUser({
        ...user,
        subscription: plan
      });
      
      toast.success('Subscription updated successfully');
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error('Subscription update failed', { description: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const incrementConversionsUsed = async () => {
    if (!user) return;
    
    try {
      const newCount = user.conversionsUsed + 1;
      console.log('Incrementing conversions used:', newCount);
      
      if (navigator.onLine) {
        try {
          await updateDoc(doc(db, 'users', user.id), {
            conversionsUsed: newCount
          });
          console.log('Firestore updated with new count:', newCount);
        } catch (error) {
          console.error('Error updating Firestore:', error);
        }
      } else {
        console.log('Offline mode: only updating local state');
      }
      
      setUser({
        ...user,
        conversionsUsed: newCount
      });
    } catch (error) {
      console.error('Error incrementing conversions count:', error);
    }
  };

  const hasRemainingFreeConversions = 
    !user || 
    user.subscription === 'premium' || 
    user.conversionsUsed < MAX_FREE_CONVERSIONS;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateSubscription,
        incrementConversionsUsed,
        hasRemainingFreeConversions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
