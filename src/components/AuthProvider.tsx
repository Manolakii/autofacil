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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const isAdminEmail = firebaseUser.email === 'admin@autofacil.com' || firebaseUser.email === 'manufigna5@gmail.com';

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (isAdminEmail && data.role !== 'admin') {
              // Forced upgrade for whitelisted admins
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' });
              setProfile({ id: userDoc.id, ...data, role: 'admin' } as UserProfile);
            } else {
              setProfile({ id: userDoc.id, ...data } as UserProfile);
            }
          } else {
            // Check if there is a pre-created profile with this email (e.g. created by Admin)
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("email", "==", firebaseUser.email));
            const existingProfiles = await getDocs(q);

            if (!existingProfiles.empty) {
              const existingData = existingProfiles.docs[0].data();
              const finalProfile = {
                username: firebaseUser.displayName || existingData.username || 'Usuario',
                email: firebaseUser.email || existingData.email,
                role: existingData.role || 'client',
                status: existingData.status || 'active',
                createdAt: serverTimestamp(),
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), finalProfile);
              setProfile({ id: firebaseUser.uid, ...finalProfile } as any);
            } else {
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
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
