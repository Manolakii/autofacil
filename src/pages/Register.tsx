import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpWithEmail, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../components/AuthProvider';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // TAREA 2: Solo registrar clientes
      await signUpWithEmail(email, password);
      // Redirection and profile creation (role: 'client') are handled by AuthProvider.tsx
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error("Registration Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('El registro con correo está deshabilitado. Actívalo en la consola de Firebase.');
      } else {
        setError(err.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (user && !authLoading) return null;

  if (authLoading) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-brand-bg px-4 py-12 text-center">
        <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-6 mx-auto"></div>
        <p className="text-brand-muted font-black text-xs tracking-widest uppercase animate-pulse">Cargando registro...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center bg-brand-bg px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none transition-all"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] pointer-events-none transition-all"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-[3rem] bg-brand-card p-10 text-center shadow-2xl border border-brand-border relative z-10"
      >
        <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-primary flex items-center justify-center shadow-2xl shadow-brand-primary/40 border-4 border-brand-bg relative group">
           <UserPlus className="text-white" size={32} />
        </div>
        
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-brand-text uppercase italic underline decoration-brand-primary underline-offset-8">Crear Cuenta</h2>
          <p className="mt-4 text-brand-muted font-bold text-xs tracking-widest uppercase">Únete a la plataforma Auto Fácil</p>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-6 text-left">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold leading-relaxed">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-4 rounded-2xl bg-brand-primary py-5 px-6 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-blue-500 active:scale-95 shadow-xl shadow-brand-primary/30 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse Ahora'}
          </button>

          <div className="pt-2 text-center text-xs">
            <p className="text-brand-muted font-bold tracking-widest uppercase">
               ¿Ya tienes cuenta? <Link to="/login" className="font-black text-brand-primary hover:underline underline-offset-4 ml-1">Inicia Sesión</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
