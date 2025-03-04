
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
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
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSubscription: (plan: 'free' | 'premium') => Promise<void>;
  incrementConversionsUsed: () => Promise<void>;
  hasRemainingFreeConversions: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // The maximum number of free conversions
  const MAX_FREE_CONVERSIONS = 5;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
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
            // If user document doesn't exist but auth does, create a new document
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
          toast.error('Error loading user data');
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error('Login failed', { description: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      // Create user document in Firestore
      const newUser = {
        email: email,
        name: email.split('@')[0],
        subscription: 'free' as const,
        conversionsUsed: 0,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error('Signup failed', { description: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
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
      
      await updateDoc(doc(db, 'users', user.id), {
        conversionsUsed: newCount
      });
      
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
