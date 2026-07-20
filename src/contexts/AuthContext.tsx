'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserData {
  name: string;
  email: string;
  role: string;
  photoURL: string;
  onboarded: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        let fetchedUserData;
        if (!userSnap.exists()) {
          try {
            fetchedUserData = {
              name: user.displayName || 'New User',
              email: user.email || '',
              createdAt: new Date().toISOString(),
              role: 'user',
              photoURL: user.photoURL || '',
              onboarded: false,
            };
            await setDoc(userRef, fetchedUserData);
            setUserData(fetchedUserData as UserData);
          } catch (error) {
            console.error('Error creating user document:', error);
          }
        } else {
          fetchedUserData = userSnap.data() as UserData;
          if (fetchedUserData.onboarded === undefined) {
            fetchedUserData.onboarded = false;
            await setDoc(userRef, { onboarded: false }, { merge: true });
          }
          setUserData(fetchedUserData);
        }
      } else {
        setUserData(null);
      }
      
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
