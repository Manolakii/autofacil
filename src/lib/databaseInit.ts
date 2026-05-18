import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * TAREA 3: Script de Inicialización de Datos.
 * Verifica si el sistema tiene los datos básicos (como el admin).
 */
export const initializeDatabase = async (retries = 2) => {
  try {
    const adminEmail = 'admin@autofacil.com';
    const adminRef = doc(db, 'users', 'admin-fixed-id'); 
    
    // Check if a fixed admin profile exists
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      console.log("Inyectando admin inicial...");
      await setDoc(adminRef, {
        username: 'Administrador',
        email: adminEmail,
        role: 'admin',
        status: 'active',
        createdAt: serverTimestamp()
      });
    }
    
    console.log("Base de datos inicializada.");
  } catch (error: any) {
    if (error.message?.includes('offline') && retries > 0) {
      console.warn(`Firestore offline, reintentando inicialización en 2s... (${retries} restantes)`);
      setTimeout(() => initializeDatabase(retries - 1), 2000);
      return;
    }
    console.error("Error en inicialización:", error);
  }
};
