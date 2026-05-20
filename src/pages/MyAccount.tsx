import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  addDoc,
  serverTimestamp, 
  collectionGroup 
} from 'firebase/firestore';
import { AppCar } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Calendar, 
  Heart, 
  Car as CarIcon, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  LogOut
} from 'lucide-react';

interface ReservationItem {
  id: string;
  carId: string;
  clientId: string;
  createdAt: any;
  expiresAt: any;
  status: string;
  car?: AppCar;
}

const MyAccount: React.FC = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reservations' | 'favorites'>('reservations');
  
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [favorites, setFavorites] = useState<AppCar[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      // 1. Fetch Favorites
      const favsRef = collection(db, 'users', user.uid, 'favorites');
      const favsSnap = await getDocs(favsRef);
      const favsList: AppCar[] = [];
      
      for (const favDoc of favsSnap.docs) {
        const carId = favDoc.id;
        const carDoc = await getDoc(doc(db, 'cars', carId));
        if (carDoc.exists()) {
          favsList.push({ id: carDoc.id, ...carDoc.data() } as AppCar);
        }
      }
      setFavorites(favsList);

      // 2. Fetch Reservations with safety fallback
      let rawReservations: ReservationItem[] = [];
      try {
        // Primary collection group approach
        const resQ = query(
          collectionGroup(db, 'reservations'),
          where('clientId', '==', user.uid)
        );
        const resSnap = await getDocs(resQ);
        rawReservations = resSnap.docs.map(d => ({ id: d.id, ...d.data() } as ReservationItem));
      } catch (groupError) {
        console.warn("CollectionGroup query failed (index might be missing), falling back ...", groupError);
        // Fallback: Query all reserved cars and search their subcollection
        const carsQ = query(collection(db, 'cars'), where('status', '==', 'reserved'));
        const carsSnap = await getDocs(carsQ);
        for (const carD of carsSnap.docs) {
          const subR = collection(db, 'cars', carD.id, 'reservations');
          const subSnap = await getDocs(query(subR, where('clientId', '==', user.uid)));
          const list = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as ReservationItem));
          rawReservations.push(...list);
        }
      }

      // Populate car details for each reservation
      const populatedReservations: ReservationItem[] = [];
      for (const res of rawReservations) {
        const carDoc = await getDoc(doc(db, 'cars', res.carId));
        if (carDoc.exists()) {
          populatedReservations.push({
            ...res,
            car: { id: carDoc.id, ...carDoc.data() } as AppCar
          });
        } else {
          populatedReservations.push(res);
        }
      }
      
      // Sort reservations by expiration (newest first)
      populatedReservations.sort((a,b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setReservations(populatedReservations);
    } catch (err) {
      console.error("Error loading account data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchUserData();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabOption = params.get('tab');
    if (tabOption === 'favorites') {
      setActiveTab('favorites');
    } else if (tabOption === 'reservations') {
      setActiveTab('reservations');
    }
  }, [window.location.search]);

  const handleCancelReservation = async (reservation: ReservationItem) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta reserva? El vehículo volverá a estar disponible.")) {
      return;
    }

    setActionLoading(reservation.id);
    try {
      // 1. Delete reservation doc
      const resDocRef = doc(db, 'cars', reservation.carId, 'reservations', reservation.id);
      await deleteDoc(resDocRef);

      // 2. Set car status back to available
      const carRef = doc(db, 'cars', reservation.carId);
      await updateDoc(carRef, {
        status: 'available',
        updatedAt: serverTimestamp()
      });

      alert("Reserva cancelada con éxito.");
      fetchUserData();
    } catch (err) {
      console.error("Error cancelling reservation:", err);
      alert("No se pudo cancelar la reserva.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFavorite = async (carId: string) => {
    if (!user) return;
    setActionLoading(carId);
    try {
      const favRef = doc(db, `users/${user.uid}/favorites`, carId);
      await deleteDoc(favRef);
      setFavorites(prev => prev.filter(car => car.id !== carId));
    } catch (err) {
      console.error("Error removing favorite:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-4 py-12 text-center">
        <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-6 mx-auto"></div>
        <p className="text-brand-muted font-black text-xs tracking-widest uppercase animate-pulse">Cargando Mi Cuenta...</p>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 relative min-h-[80vh]">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-900/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 space-y-10">
        
        {/* Header Hero */}
        <div className="rounded-[3rem] bg-brand-card border border-brand-border p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-6 items-center">
            <div className="h-20 w-20 rounded-[1.5rem] bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 border-4 border-brand-bg">
              <User size={40} />
            </div>
            <div>
              <span className="mb-1 inline-block rounded-full bg-brand-primary/15 px-3 py-1 text-[10px] font-black uppercase text-brand-primary border border-brand-primary/20 tracking-wider">
                Rol: Cliente
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-brand-text tracking-tight uppercase italic">
                Hola, <span className="text-brand-primary not-italic">{profile.username}</span>
              </h1>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">{profile.email}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
              onClick={() => signOut()}
              className="px-6 py-4 rounded-2xl bg-brand-bg hover:bg-red-500/10 border border-brand-border hover:border-red-500/20 text-brand-text hover:text-red-500 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
            <Link 
              to="/models"
              className="px-6 py-4 rounded-2xl bg-brand-primary hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
            >
              Ver Inventario 
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-brand-border pb-4 gap-2 overflow-x-auto scrollbar-hide">
          {(['reservations', 'favorites'] as const).map((tab) => {
            const isActive = activeTab === tab;
            let icon = <Clock size={16} />;
            let label = "Mis Reservas";

            if (tab === 'favorites') {
              icon = <Heart size={16} />;
              label = "Favoritos";
            }

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' 
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-card/50'
                }`}
              >
                {icon}
                {label}
                {tab === 'reservations' && reservations.length > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white'}`}>
                    {reservations.length}
                  </span>
                )}
                {tab === 'favorites' && favorites.length > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white'}`}>
                    {favorites.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[40vh]">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold text-brand-muted uppercase tracking-widest animate-pulse">Buscando tus datos...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'reservations' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {reservations.length === 0 ? (
                    <div className="rounded-[2.5rem] bg-brand-card/40 border border-brand-border border-dashed p-12 text-center">
                      <Clock size={48} className="mx-auto text-brand-muted mb-4" />
                      <h3 className="text-xl font-black uppercase">No tienes reservas activas</h3>
                      <p className="text-brand-muted text-sm mt-2 max-w-sm mx-auto">Reserva cualquier vehículo disponible en el catálogo por un período de gracia de 24 horas.</p>
                      <Link to="/models" className="mt-6 inline-flex px-6 py-3 bg-brand-primary hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider">
                        Explorar Catálogo
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {reservations.map((res) => {
                        const isExpired = res.expiresAt ? (new Date(res.expiresAt.toDate ? res.expiresAt.toDate() : res.expiresAt) < new Date()) : false;
                        return (
                          <div 
                            key={res.id} 
                            className="rounded-3xl bg-brand-card border border-brand-border p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all"
                          >
                            <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                              {res.car?.images && res.car.images[0] ? (
                                <img 
                                  src={res.car.images[0]} 
                                  alt={res.car.model} 
                                  className="h-24 w-32 rounded-2xl object-cover border border-brand-border"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-24 w-32 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center">
                                  <CarIcon className="text-brand-muted" size={32} />
                                </div>
                              )}
                              <div className="text-center sm:text-left">
                                <h3 className="text-xl font-black uppercase tracking-tight">
                                  {res.car ? `${res.car.brand} ${res.car.model}` : "Vehículo Desconocido"}
                                </h3>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs font-bold text-brand-muted justify-center sm:justify-start">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={14} /> Creación: {res.createdAt?.toDate ? res.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={14} /> Vence: {res.expiresAt?.toDate ? res.expiresAt.toDate().toLocaleString() : 'N/A'}
                                  </span>
                                </div>
                                <div className="mt-3 flex gap-2 justify-center sm:justify-start">
                                  {isExpired ? (
                                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider">
                                      Reserva Expirada
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                      <CheckCircle2 size={12} /> Activa (24 hrs)
                                    </span>
                                  )}
                                  <span className="px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase">
                                    ${res.car?.price.toLocaleString() ?? 'N/A'} USD
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto shrink-0 justify-center">
                              {res.car && (
                                <Link 
                                  to={`/cars/${res.carId}`}
                                  className="px-5 py-3 rounded-xl border border-brand-border bg-brand-bg hover:bg-brand-card hover:border-brand-primary font-bold text-xs uppercase text-brand-text flex items-center gap-1 transition-all"
                                >
                                  Ver Ficha
                                </Link>
                              )}
                              {!isExpired && (
                                <button
                                  onClick={() => handleCancelReservation(res)}
                                  disabled={actionLoading === res.id}
                                  className="px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 transition-all"
                                >
                                  <Trash2 size={14} />
                                  {actionLoading === res.id ? 'Cancelando...' : 'Cancelar'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'favorites' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {favorites.length === 0 ? (
                    <div className="rounded-[2.5rem] bg-brand-card/40 border border-brand-border border-dashed p-12 text-center">
                      <Heart size={48} className="mx-auto text-brand-muted mb-4" />
                      <h3 className="text-xl font-black uppercase">No tienes favoritos</h3>
                      <p className="text-brand-muted text-sm mt-2 max-w-sm mx-auto">Marca con un corazón tus autos ideales del catálogo para guardarlos aquí.</p>
                      <Link to="/models" className="mt-6 inline-flex px-6 py-3 bg-brand-primary hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider">
                        Explorar Catálogo
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {favorites.map((car) => (
                        <div 
                          key={car.id} 
                          className="rounded-[2rem] bg-brand-card border border-brand-border overflow-hidden flex flex-col hover:shadow-xl transition-all"
                        >
                          <div className="aspect-[4/3] relative">
                            <img 
                              src={car.images[0]} 
                              alt={car.model} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-4 left-4 bg-brand-primary text-white rounded-xl px-4 py-1.5 text-xs font-black">
                              ${car.price.toLocaleString()} USD
                            </div>
                            <button
                              onClick={() => handleRemoveFavorite(car.id)}
                              disabled={actionLoading === car.id}
                              className="absolute top-4 right-4 h-10 w-10 bg-brand-bg/85 hover:bg-red-500 rounded-full flex items-center justify-center text-red-500 hover:text-white transition-all shadow-md active:scale-90"
                              title="Eliminar de favoritos"
                            >
                              <Heart size={18} fill="currentColor" />
                            </button>
                          </div>
                          
                          <div className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-brand-muted">{car.brand}</div>
                              <h3 className="text-lg font-black text-brand-text truncate uppercase italic">{car.model}</h3>
                              <p className="text-xs font-bold text-brand-muted mt-1">{car.year} • {car.mileage.toLocaleString()} km</p>
                            </div>
                            <div className="mt-6 flex gap-2">
                              <Link 
                                to={`/cars/${car.id}`}
                                className="flex-1 text-center py-3 rounded-xl bg-brand-primary hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all"
                              >
                                Ver Detalles
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

      </div>
    </div>
  );
};

export default MyAccount;
