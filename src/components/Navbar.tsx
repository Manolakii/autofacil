import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, User, LogOut, Sun, Moon, Menu, X, Heart, Clock, ChevronDown } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, getDoc, doc, collectionGroup, onSnapshot } from 'firebase/firestore';
import { AppCar } from '../types';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFavDropdownOpen, setIsFavDropdownOpen] = useState(false);

  const [favsCount, setFavsCount] = useState(0);
  const [resCount, setResCount] = useState(0);
  const [favoritesList, setFavoritesList] = useState<AppCar[]>([]);
  const [reservationsList, setReservationsList] = useState<any[]>([]);

  const closeMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    if (!user) {
      setFavoritesList([]);
      setReservationsList([]);
      setFavsCount(0);
      setResCount(0);
      return;
    }

    // Live listener for Favorites
    const favsRef = collection(db, 'users', user.uid, 'favorites');
    const unsubscribeFavs = onSnapshot(favsRef, async (snapshot) => {
      const list: AppCar[] = [];
      for (const favDoc of snapshot.docs) {
        const carId = favDoc.id;
        try {
          const carDoc = await getDoc(doc(db, 'cars', carId));
          if (carDoc.exists()) {
            list.push({ id: carDoc.id, ...carDoc.data() } as AppCar);
          }
        } catch (error) {
          console.error("Error fetching favorited car:", carId, error);
        }
      }
      setFavoritesList(list);
      setFavsCount(list.length);
    }, (err) => {
      console.error("Error listening to favorites:", err);
    });

    // Query for Reservations
    let unsubscribeRes = () => {};
    const fetchReservationsLive = async () => {
      try {
        const resQ = query(
          collectionGroup(db, 'reservations'),
          where('clientId', '==', user.uid)
        );
        unsubscribeRes = onSnapshot(resQ, async (snapshot) => {
          const rawRes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
          const populatedList: any[] = [];
          for (const res of rawRes) {
            try {
              const carDoc = await getDoc(doc(db, 'cars', res.carId));
              if (carDoc.exists()) {
                populatedList.push({
                  ...res,
                  car: { id: carDoc.id, ...carDoc.data() } as AppCar
                });
              }
            } catch (error) {
              console.error("Error fetching reserved car:", res.carId, error);
            }
          }
          setReservationsList(populatedList);
          setResCount(populatedList.length);
        }, (resErr) => {
          console.warn("CollectionGroup listen in header error:", resErr);
        });
      } catch (groupError) {
        console.warn("CollectionGroup listen in header failed, falling back...", groupError);
        try {
          const carsQ = query(collection(db, 'cars'), where('status', '==', 'reserved'));
          const carsSnap = await getDocs(carsQ);
          const list: any[] = [];
          for (const carD of carsSnap.docs) {
            const subR = collection(db, 'cars', carD.id, 'reservations');
            const subSnap = await getDocs(query(subR, where('clientId', '==', user.uid)));
            for (const d of subSnap.docs) {
              list.push({
                id: d.id,
                ...d.data(),
                car: { id: carD.id, ...carD.data() } as AppCar
              });
            }
          }
          setReservationsList(list);
          setResCount(list.length);
        } catch (fallbackErr) {
          console.error("Fallback reservations list failed:", fallbackErr);
        }
      }
    };

    fetchReservationsLive();

    return () => {
      unsubscribeFavs();
      unsubscribeRes();
    };
  }, [user]);

  const totalItems = favsCount + resCount;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
            <div className="rounded-lg bg-brand-primary p-1.5 text-white">
              <Car size={24} />
            </div>
            <span className="text-xl font-black tracking-tight text-brand-text uppercase italic underline decoration-brand-primary underline-offset-4 decoration-2">Auto Fácil</span>
          </Link>
          
          <div className="hidden space-x-6 sm:flex items-center">
            <Link to="/" className="text-sm font-black text-brand-muted hover:text-brand-primary uppercase tracking-widest transition-colors">Inicio</Link>
            <Link to="/models" className="text-sm font-black text-brand-muted hover:text-brand-primary uppercase tracking-widest transition-colors">Modelos</Link>
            
            {/* Seccion Favorito */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setIsFavDropdownOpen(!isFavDropdownOpen)}
                  className="text-sm font-black text-brand-muted hover:text-brand-primary uppercase tracking-widest transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
                >
                  <Heart size={15} className={`text-red-500 transition-transform ${totalItems > 0 ? 'fill-red-500 scale-105 animate-pulse' : ''}`} />
                  <span>Favorito</span>
                  {totalItems > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                      {totalItems}
                    </span>
                  )}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isFavDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Favorites & Reservations Dropdown overlay */}
                <AnimatePresence>
                  {isFavDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsFavDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-3 z-40 w-80 rounded-2xl border border-brand-border bg-brand-card p-4 shadow-2xl"
                      >
                        <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-3">
                          <span className="text-xs font-black uppercase tracking-wider text-brand-text flex items-center gap-1.5 italic">
                            <Heart size={14} className="text-red-500 fill-red-500" />
                            Favorito
                          </span>
                          <span className="text-[10px] font-black text-brand-muted uppercase">
                            {totalItems} ítems
                          </span>
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                          {totalItems === 0 ? (
                            <div className="py-8 text-center text-brand-muted">
                              <p className="text-xs font-bold uppercase">No tienes guardados ni reservas</p>
                              <p className="text-[9px] font-black uppercase tracking-wider mt-1.5">Marca vehículos con ♡ para tenerlos a mano</p>
                            </div>
                          ) : (
                            <>
                              {/* Favorites List */}
                              {favoritesList.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-[9px] font-black uppercase tracking-widest text-brand-muted border-b border-brand-border/40 pb-1 italic">Tus Favoritos ({favoritesList.length})</h4>
                                  {favoritesList.map(car => (
                                    <Link 
                                      key={car.id} 
                                      to={`/cars/${car.id}`}
                                      onClick={() => setIsFavDropdownOpen(false)}
                                      className="flex items-center gap-3 p-2 rounded-xl bg-brand-bg/40 hover:bg-brand-primary/10 border border-brand-border hover:border-brand-primary/20 transition-all group"
                                    >
                                      <img src={car.images && car.images[0] ? car.images[0] : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'} alt={car.model} className="h-10 w-14 rounded-lg object-cover" referrerPolicy="no-referrer" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-brand-text truncate uppercase italic group-hover:text-brand-primary">{car.brand} {car.model}</p>
                                        <p className="text-[10px] font-bold text-brand-muted">${car.price?.toLocaleString()} USD</p>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}

                              {/* Reservations List */}
                              {reservationsList.length > 0 && (
                                <div className="space-y-2 pt-2">
                                  <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-500 border-b border-brand-border/40 pb-1 italic">Tus Reservas ({reservationsList.length})</h4>
                                  {reservationsList.map(res => (
                                    <Link 
                                      key={res.id} 
                                      to={`/cars/${res.carId}`}
                                      onClick={() => setIsFavDropdownOpen(false)}
                                      className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 transition-all group"
                                    >
                                      <img 
                                        src={res.car?.images && res.car.images[0] ? res.car.images[0] : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'} 
                                        alt={res.car?.model || "Vehículo"} 
                                        className="h-10 w-14 rounded-lg object-cover" 
                                        referrerPolicy="no-referrer" 
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-brand-text truncate uppercase italic group-hover:text-emerald-500">
                                          {res.car ? `${res.car.brand} ${res.car.model}` : "Vehículo"}
                                        </p>
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-wide">Reserva Activa</span>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <div className="border-t border-brand-border mt-3 pt-3 flex gap-2">
                          <Link
                            to="/my-account?tab=favorites"
                            onClick={() => setIsFavDropdownOpen(false)}
                            className="flex-1 py-2.5 rounded-xl bg-brand-primary hover:bg-blue-500 text-white text-center text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Ver Favoritos
                          </Link>
                          <Link
                            to="/my-account?tab=reservations"
                            onClick={() => setIsFavDropdownOpen(false)}
                            className="flex-1 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-primary/10 border border-brand-border text-brand-text text-center text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Ver Reservas
                          </Link>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-brand-muted hover:bg-brand-card transition-all active:scale-90 cursor-pointer"
            title="Cambiar Tema"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to={profile?.role === 'admin' ? '/admin' : profile?.role === 'seller' ? '/dashboard' : '/my-account'} 
                className="flex items-center gap-2 text-sm font-medium text-brand-text"
                onClick={closeMenu}
              >
                <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <User size={18} />
                </div>
                <span className="hidden sm:inline-block max-w-[100px] truncate font-black uppercase tracking-wider text-xs">{profile?.username}</span>
              </Link>
              <button 
                onClick={() => { signOut(); closeMenu(); }}
                className="hidden sm:flex rounded-full p-2 text-brand-muted hover:bg-brand-card transition-colors cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="hidden sm:block rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-brand-primary/20 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            >
              Ingresar
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-brand-muted hover:bg-brand-card sm:hidden cursor-pointer"
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
            className="overflow-hidden bg-brand-bg border-b border-brand-border sm:hidden"
          >
            <div className="flex flex-col space-y-4 px-4 py-6">
              <Link to="/" className="text-lg font-black uppercase italic tracking-wider text-brand-text" onClick={closeMenu}>Inicio</Link>
              <Link to="/models" className="text-lg font-black uppercase italic tracking-wider text-brand-text" onClick={closeMenu}>Modelos</Link>
              
              {/* Favorito Link in Drawer */}
              {user && (
                <Link 
                  to="/my-account?tab=favorites" 
                  className="text-lg font-black uppercase italic tracking-wider text-brand-text flex items-center gap-2" 
                  onClick={closeMenu}
                >
                  <Heart size={20} className="text-red-500 fill-red-500" />
                  <span>Favorito</span>
                  {totalItems > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}

              <hr className="border-brand-border" />
              {user ? (
                <>
                  <Link 
                    to={profile?.role === 'admin' ? '/admin' : profile?.role === 'seller' ? '/dashboard' : '/my-account'} 
                    className="flex items-center gap-3 text-lg font-black uppercase italic tracking-wider text-brand-text"
                    onClick={closeMenu}
                  >
                    <User size={20} className="text-brand-primary" />
                    Mi Cuenta ({profile?.role})
                  </Link>
                  <button 
                    onClick={() => { signOut(); closeMenu(); }}
                    className="flex items-center gap-3 text-left text-lg font-black uppercase italic tracking-wider text-red-500 cursor-pointer"
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
