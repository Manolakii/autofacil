import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center bg-brand-bg px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none transition-all"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] pointer-events-none transition-all"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-10 rounded-[3rem] bg-brand-card p-12 text-center shadow-2xl border border-brand-border relative z-10"
      >
        <div className="mx-auto h-20 w-20 rounded-3xl bg-brand-primary flex items-center justify-center shadow-2xl shadow-brand-primary/40 border-4 border-brand-bg relative group">
           <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <span className="text-3xl font-black text-white italic">AF</span>
        </div>
        
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-brand-text uppercase italic underline decoration-brand-primary underline-offset-8">Acceso Seguro</h2>
          <p className="mt-4 text-brand-muted font-bold text-sm tracking-widest uppercase">Bienvenido a la red Auto Fácil</p>
        </div>

        <div className="mt-10 space-y-8">
          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-4 rounded-2xl border-2 border-brand-border bg-brand-bg py-5 px-6 text-sm font-black uppercase tracking-[0.2em] text-brand-text transition-all hover:bg-brand-card hover:border-brand-primary hover:text-brand-primary active:scale-95 shadow-lg group"
          >
            <div className="h-6 w-6 border-2 border-brand-muted group-hover:border-brand-primary transition-colors flex items-center justify-center">
               <div className="w-2 h-2 bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            Continuar con Google
          </button>

          <div className="pt-2">
            <p className="text-xs text-brand-muted font-bold tracking-widest uppercase">
               ¿Nuevo aquí? <button className="font-black text-brand-primary hover:underline underline-offset-4 ml-1">Crea tu cuenta</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
