import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, User, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
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

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-brand-muted hover:bg-brand-card transition-all active:scale-90"
            title="Cambiar Tema"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to={profile?.role === 'seller' ? '/dashboard' : '/my-account'} 
                className="flex items-center gap-2 text-sm font-medium text-brand-text"
                onClick={closeMenu}
              >
                <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <User size={18} />
                </div>
                <span className="hidden sm:inline-block max-w-[100px] truncate">{profile?.username}</span>
              </Link>
              <button 
                onClick={() => { signOut(); closeMenu(); }}
                className="hidden sm:flex rounded-full p-2 text-brand-muted hover:bg-brand-card transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="hidden sm:block rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-primary/20 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-bg transition-all"
            >
              Ingresar
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-brand-muted hover:bg-brand-card md:hidden"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-brand-bg border-b border-brand-border md:hidden"
          >
            <div className="flex flex-col space-y-4 px-4 py-6">
              <Link to="/" className="text-lg font-bold text-brand-text" onClick={closeMenu}>Inicio</Link>
              <Link to="/models" className="text-lg font-bold text-brand-text" onClick={closeMenu}>Modelos</Link>
              <hr className="border-brand-border" />
              {user ? (
                <>
                  <Link 
                    to={profile?.role === 'seller' ? '/dashboard' : '/my-account'} 
                    className="flex items-center gap-3 text-lg font-bold text-brand-text"
                    onClick={closeMenu}
                  >
                    <User size={20} className="text-brand-primary" />
                    Mi Cuenta ({profile?.role})
                  </Link>
                  <button 
                    onClick={() => { signOut(); closeMenu(); }}
                    className="flex items-center gap-3 text-left text-lg font-bold text-red-500"
                  >
                    <LogOut size={20} />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="w-full rounded-xl bg-brand-primary py-4 text-center text-lg font-black uppercase tracking-widest text-white"
                  onClick={closeMenu}
                >
                  Ingresar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
