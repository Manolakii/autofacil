import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { initializeApp as initTempApp, deleteApp as deleteTempApp } from 'firebase/app';
import { getAuth as getTempAuth, createUserWithEmailAndPassword as createTempUser, signOut as signOutOfTemp } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldOff, 
  TrendingUp, 
  Car, 
  Search,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Edit2,
  X
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'client' | 'seller' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  createdAt: any;
}

const AdminDashboard: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create Seller Form State
  const [newSellerEmail, setNewSellerEmail] = useState('');
  const [newSellerPass, setNewSellerPass] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Edit User Form State
  const [editingUserProfile, setEditingUserProfile] = useState<UserProfile | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'client' | 'seller' | 'admin'>('client');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'banned'>('active');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserProfile) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      if (!editUsername.trim() || !editEmail.trim()) {
        setEditError('Por favor, completa todos los campos requeridos.');
        setEditLoading(false);
        return;
      }

      await updateDoc(doc(db, 'users', editingUserProfile.id), {
        username: editUsername,
        email: editEmail,
        role: editRole,
        status: editStatus
      });

      setEditSuccess('¡Usuario actualizado exitosamente!');
      
      // Update local state instantly
      setUsers(users.map(u => u.id === editingUserProfile.id ? {
        ...u, 
        username: editUsername,
        email: editEmail,
        role: editRole,
        status: editStatus
      } : u));

      setTimeout(() => {
        setEditingUserProfile(null);
        setEditSuccess('');
      }, 1000);

    } catch (err: any) {
      console.error("Error updating user:", err);
      setEditError(err.message || 'Error al actualizar el usuario.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleVeto = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active';
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus
      });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormSuccess('');
    setFormError('');

    try {
      if (!newSellerEmail || !newSellerPass) {
        setFormError('Por favor completa todos los campos.');
        setFormLoading(false);
        return;
      }

      if (newSellerPass.length < 6) {
        setFormError('La contraseña debe tener al menos 6 caracteres.');
        setFormLoading(false);
        return;
      }

      // Check if user already exists in Firestore 'users' collection
      const userRef = collection(db, 'users');
      const q = query(userRef, where("email", "==", newSellerEmail));
      const existing = await getDocs(q);

      if (!existing.empty) {
        setFormError('Este correo ya está registrado en la base de datos.');
        setFormLoading(false);
        return;
      }

      // To register the seller account without terminating the current administrator session,
      // we initialize a isolated secondary Firebase App instance.
      const tempAppName = `temp-seller-${Date.now()}`;
      const tempApp = initTempApp(firebaseConfig, tempAppName);
      const tempAuth = getTempAuth(tempApp);

      let newUid = '';
      try {
        // Register the new user credentials in Firebase Auth
        const userCredential = await createTempUser(tempAuth, newSellerEmail, newSellerPass);
        newUid = userCredential.user.uid;
        
        // Log out clean from the secondary Auth pool
        await signOutOfTemp(tempAuth);
      } catch (authError: any) {
        console.error("Auth creation failed:", authError);
        if (authError.code === 'auth/email-already-in-use') {
          throw new Error('El correo electrónico ya está registrado en Firebase Autenticación.');
        } else if (authError.code === 'auth/weak-password') {
          throw new Error('La contraseña es demasiado débil (mínimo 6 caracteres).');
        } else {
          throw new Error(`Error en Firebase Auth: ${authError.message}`);
        }
      } finally {
        // Always destroy the secondary Firebase instance to free up memory and prevent duplications
        await deleteTempApp(tempApp);
      }

      // Now create the seller's user profile in Firestore
      if (newUid) {
        const sellerRef = doc(db, 'users', newUid);
        await setDoc(sellerRef, {
          username: newSellerEmail.split('@')[0],
          email: newSellerEmail,
          role: 'seller',
          status: 'active',
          createdAt: serverTimestamp()
        });

        setFormSuccess(`Vendedor '${newSellerEmail}' creado y registrado con éxito.`);
        setNewSellerEmail('');
        setNewSellerPass('');
        // Refresh the database lists
        await fetchUsers();
      } else {
        throw new Error('No se pudo generar un identificador de usuario válido.');
      }
    } catch (error: any) {
      console.error("Error creating seller:", error);
      setFormError(error.message || 'Error al crear el vendedor en la base de datos.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Usuarios', value: users.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Clientes', value: users.filter(u => u.role === 'client').length, icon: UserPlus, color: 'bg-green-500' },
    { label: 'Vendedores', value: users.filter(u => u.role === 'seller').length, icon: Car, color: 'bg-brand-primary' },
    { label: 'Ventas Mes (Sim)', value: '$1.2M', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-4 py-12 text-center">
        <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-6 mx-auto"></div>
        <p className="text-brand-muted font-black text-xs tracking-widest uppercase animate-pulse">Verificando Credenciales de Admin...</p>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <div className="text-center">
          <ShieldOff size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-black uppercase italic">Acceso Denegado</h1>
          <p className="text-brand-muted mt-2">Solo administradores pueden ver esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-brand-text uppercase italic underline decoration-brand-primary underline-offset-8">Panel Admin</h1>
            <p className="mt-4 text-brand-muted font-bold text-xs tracking-widest uppercase">Gestión central de Auto Fácil</p>
          </div>
          <div className="flex items-center gap-4 bg-brand-card border border-brand-border px-6 py-3 rounded-2xl shadow-xl">
             <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center font-black text-white italic">A</div>
             <div>
                <p className="text-sm font-black text-brand-text">{profile.username}</p>
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Administrador Supremo</p>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-brand-card border border-brand-border p-6 rounded-[2rem] shadow-xl group hover:border-brand-primary/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-[10px] font-black uppercase text-brand-muted tracking-widest">En tiempo real</span>
              </div>
              <p className="text-3xl font-black text-brand-text mb-1 tracking-tight">{stat.value}</p>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Create Seller Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-brand-card border border-brand-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                <UserPlus className="text-brand-primary" />
                Registrar Vendedor
              </h2>

              <form onSubmit={handleCreateSeller} className="space-y-4">
                {formSuccess && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold">
                    <CheckCircle size={18} />
                    {formSuccess}
                  </div>
                )}
                {formError && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                    <AlertCircle size={18} />
                    {formError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Email del Vendedor</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                    <input 
                      type="email" 
                      required
                      value={newSellerEmail}
                      onChange={(e) => setNewSellerEmail(e.target.value)}
                      className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                      placeholder="vendedor@autofacil.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Contraseña Temporal</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                    <input 
                      type="password" 
                      required
                      value={newSellerPass}
                      onChange={(e) => setNewSellerPass(e.target.value)}
                      className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={formLoading}
                  className="w-full rounded-2xl bg-brand-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-brand-primary/20 hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50"
                >
                  {formLoading ? 'Procesando...' : 'Crear Vendedor'}
                </button>
              </form>
            </div>

            {/* Simulated Report Card */}
            <div className="bg-brand-card border border-brand-border rounded-[2.5rem] p-8 shadow-xl">
              <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                <TrendingUp className="text-brand-primary" />
                Reporte Mensual
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border">
                  <p className="text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1">Crecimiento Usuarios</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-brand-card rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary w-3/4"></div>
                    </div>
                    <span className="text-xs font-black text-brand-text">+15%</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border">
                  <p className="text-[10px] font-black uppercase text-brand-muted tracking-widest mb-1">Actividad Publicaciones</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-brand-card rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-1/2"></div>
                    </div>
                    <span className="text-xs font-black text-brand-text">Medio</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="lg:col-span-2">
            <div className="bg-brand-card border border-brand-border rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight">Gestión de Usuarios</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar usuario..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl bg-brand-bg border border-brand-border p-3 pl-12 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-brand-bg/50">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-brand-muted border-b border-brand-border">Usuario</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-brand-muted border-b border-brand-border">Rol</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-brand-muted border-b border-brand-border">Estado</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-brand-muted border-b border-brand-border">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    <AnimatePresence>
                      {filteredUsers.map((u) => (
                        <motion.tr 
                          key={u.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-brand-bg/30 transition-colors"
                        >
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black uppercase">
                                {u.username.slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-brand-text">{u.username}</p>
                                <p className="text-xs text-brand-muted">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              u.role === 'admin' ? 'bg-purple-500/10 text-purple-500' :
                              u.role === 'seller' ? 'bg-brand-primary/10 text-brand-primary' :
                              'bg-green-500/10 text-green-500'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-6">
                             <span className={`flex items-center gap-2 text-xs font-bold ${u.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                               <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                               {u.status === 'active' ? 'Activo' : u.status === 'banned' ? 'Baneado' : 'Inactivo'}
                             </span>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setEditingUserProfile(u);
                                  setEditUsername(u.username || '');
                                  setEditEmail(u.email || '');
                                  setEditRole(u.role || 'client');
                                  setEditStatus(u.status || 'active');
                                  setEditError('');
                                  setEditSuccess('');
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-brand-bg hover:bg-brand-primary hover:text-white border border-brand-border transition-all cursor-pointer text-brand-text"
                                title="Editar datos"
                              >
                                <Edit2 size={12} />
                                <span className="hidden sm:inline">Editar</span>
                              </button>

                              {u.role !== 'admin' && (
                                <button 
                                  onClick={() => handleVeto(u.id, u.status)}
                                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    u.status === 'active' 
                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                                    : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                                  }`}
                                  title={u.status === 'active' ? 'Vetar usuario' : 'Activar usuario'}
                                >
                                  {u.status === 'active' ? (
                                    <><ShieldOff size={11} /> <span className="hidden sm:inline">Vetar</span></>
                                  ) : (
                                    <><Shield size={11} /> <span className="hidden sm:inline">Activar</span></>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUserProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-[2rem] bg-brand-card border border-brand-border p-6 sm:p-8 shadow-2xl relative my-8 text-left"
            >
              <button
                type="button"
                onClick={() => setEditingUserProfile(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-brand-bg hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary border border-brand-border transition-colors outline-none cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-brand-primary/15 px-3 py-1 text-[10px] font-black uppercase text-brand-primary border border-brand-primary/20 tracking-wider">
                  Consola de Administración
                </span>
                <h2 className="text-2xl font-black text-brand-text uppercase italic tracking-tight mt-1.5">
                  Editar Usuario
                </h2>
                <p className="text-xs text-brand-muted font-bold uppercase tracking-wide">Modifica los privilegios y datos del perfil</p>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-5">
                {editSuccess && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold">
                    <CheckCircle size={18} />
                    {editSuccess}
                  </div>
                )}
                {editError && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                    <AlertCircle size={18} />
                    {editError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Nombre de Usuario</label>
                  <input 
                    type="text" 
                    value={editUsername} 
                    onChange={e => setEditUsername(e.target.value)} 
                    placeholder="Nombre completo o alias" 
                    required 
                    className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold text-brand-text focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={e => setEditEmail(e.target.value)} 
                    placeholder="email@dominio.com" 
                    required 
                    className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold text-brand-text focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Rol en el Sistema</label>
                    <select 
                      value={editRole} 
                      onChange={e => setEditRole(e.target.value as any)} 
                      className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold text-brand-text focus:ring-2 focus:ring-brand-primary outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="client">Cliente (Client)</option>
                      <option value="seller">Vendedor (Seller)</option>
                      <option value="admin">Administrador (Admin)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Estado de Cuenta</label>
                    <select 
                      value={editStatus} 
                      onChange={e => setEditStatus(e.target.value as any)} 
                      className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold text-brand-text focus:ring-2 focus:ring-brand-primary outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="active">Activo (Active)</option>
                      <option value="inactive">Inactivo (Inactive)</option>
                      <option value="banned">Baneado / Suspendido (Banned)</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUserProfile(null)}
                    className="flex-1 py-4 rounded-xl border border-brand-border text-brand-text font-black uppercase text-xs tracking-wider hover:bg-brand-bg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 py-4 rounded-xl bg-brand-primary hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/15 cursor-pointer"
                  >
                    {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
