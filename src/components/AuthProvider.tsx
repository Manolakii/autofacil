import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  banError: string | null;
  clearBanError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  banError: null,
  clearBanError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [banError, setBanError] = useState<string | null>(null);

  const clearBanError = () => setBanError(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const isAdminEmail = firebaseUser.email === 'admin@autofacil.com' || firebaseUser.email === 'manufigna5@gmail.com';

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.status === 'banned' || data.status === 'inactive') {
              await auth.signOut();
              setBanError("Su cuenta esta inhabilitada en estos momentos, en caso de reclamo, contactarse con soporte");
              setUser(null);
              setProfile(null);
              setLoading(false);
              return;
            }
            if (isAdminEmail && data.role !== 'admin') {
              // Forced upgrade for whitelisted admins
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' });
              setProfile({ id: userDoc.id, ...data, role: 'admin' } as UserProfile);
            } else {
              setProfile({ id: userDoc.id, ...data } as UserProfile);
            }
          } else {
            // No user doc exists. It's a fresh registration or Google login.
            const newProfile = {
              username: isAdminEmail ? 'Administrador' : (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'),
              email: firebaseUser.email!,
              role: (isAdminEmail ? 'admin' : 'client') as any,
              status: 'active' as const,
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile({ id: firebaseUser.uid, ...newProfile } as any);
          }
          setUser(firebaseUser);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        if (error.code === 'permission-denied') {
          alert("Error de permisos en Firestore. Revisa las reglas de seguridad.");
        }
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, banError, clearBanError }}>
      {children}
    </AuthContext.Provider>
  );
};
