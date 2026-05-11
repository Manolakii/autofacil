import React from 'react';
import { Link } from 'react-router-dom';
import { Car, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { motion } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-brand-primary p-1.5 text-white">
              <Car size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-text">Auto Fácil</span>
          </Link>
          
          <div className="hidden space-x-6 md:flex">
            <Link to="/" className="text-sm font-medium text-brand-muted hover:text-brand-primary transform transition-colors">Inicio</Link>
            <Link to="/models" className="text-sm font-medium text-brand-muted hover:text-brand-primary transform transition-colors">Modelos</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-brand-muted hover:bg-brand-card transition-all active:scale-90"
            title="Cambiar Tema"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to={profile?.role === 'seller' ? '/dashboard' : '/my-account'} 
                className="flex items-center gap-2 text-sm font-medium text-brand-text"
              >
                <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <User size={18} />
                </div>
                <span className="hidden sm:inline">{profile?.username}</span>
              </Link>
              <button 
                onClick={() => signOut()}
                className="rounded-full p-2 text-brand-muted hover:bg-brand-card transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-primary/20 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-bg transition-all"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
