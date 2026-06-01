import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signInWithGoogle, loginWithEmail, signUpWithEmail } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { user, profile, loading: authLoading, banError, clearBanError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from || null;

  React.useEffect(() => {
    if (clearBanError) clearBanError();
  }, []);

  React.useEffect(() => {
    // Only navigate once everything is ready to avoid intermediate state loops
    if (user && profile && !authLoading) {
      if (from) {
        navigate(from, { replace: true });
      } else if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (profile.role === 'seller') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate, from]);

  const handleGoogleLogin = async () => {
    try {
      if (clearBanError) clearBanError();
      await signInWithGoogle();
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');
    if (clearBanError) clearBanError();

    try {
      // Hardcoded Admin Check logic
      if (email === 'admin@autofacil.com' && password === 'admin123') {
        try {
          await loginWithEmail(email, password);
        } catch (adminErr: any) {
          // If admin doesn't exist in Auth, auto-provision it
          if (adminErr.code === 'auth/user-not-found' || adminErr.code === 'auth/invalid-credential' || adminErr.code === 'auth/wrong-password') {
            try {
              // Try signing up if login fails
              await signUpWithEmail(email, password);
            } catch (signupErr: any) {
              if (signupErr.code === 'auth/email-already-in-use') {
                // If exists but password was wrong, the main catch will show error
                throw adminErr;
              }
              throw signupErr;
            }
          } else {
            throw adminErr;
          }
        }
      } else {
        await loginWithEmail(email, password);
      }
      // Redirection is handled by the useEffect watching user and profile
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta más tarde.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('El inicio de sesión con correo está deshabilitado. Actívalo en la consola de Firebase.');
      } else {
        setError(`Error al iniciar sesión: ${err.message || 'Inténtalo de nuevo.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-brand-bg px-4 py-12 text-center">
        <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-6 mx-auto"></div>
        <p className="text-brand-muted font-black text-xs tracking-widest uppercase animate-pulse">Iniciando sistema Auto Fácil...</p>
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
           <LogIn className="text-white" size={32} />
        </div>
        
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-brand-text uppercase italic underline decoration-brand-primary underline-offset-8">Iniciar Sesión</h2>
          <p className="mt-4 text-brand-muted font-bold text-xs tracking-widest uppercase">Accede a tu cuenta Auto Fácil</p>
        </div>

        <form onSubmit={handleEmailLogin} className="mt-8 space-y-6 text-left">
          {(error || banError) && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold leading-relaxed">
              <AlertCircle size={18} className="shrink-0" />
              <span>{banError || error}</span>
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
            {loading ? 'Iniciando sesión...' : 'Entrar'}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brand-card px-2 text-brand-muted font-bold tracking-widest">O continúa con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-4 rounded-2xl border border-brand-border bg-brand-bg py-4 px-6 text-sm font-bold text-brand-text transition-all hover:bg-brand-card hover:border-brand-primary active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
            Google
          </button>

          <div className="pt-2 text-center text-xs">
            <p className="text-brand-muted font-bold tracking-widest uppercase">
               ¿Nuevo aquí? <Link to="/register" className="font-black text-brand-primary hover:underline underline-offset-4 ml-1">Crea tu cuenta</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
