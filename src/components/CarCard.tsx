import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Gauge, Fuel, ChevronRight, Heart } from 'lucide-react';
import { AppCar } from '../types';
import { motion } from 'motion/react';
import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface CarCardProps {
  car: AppCar;
}

export const CarCard: React.FC<CarCardProps> = ({ car }) => {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsFav(false);
      return;
    }
    const checkFav = async () => {
      try {
        const favRef = doc(db, `users/${user.uid}/favorites`, car.id);
        const favSnap = await getDoc(favRef);
        setIsFav(favSnap.exists());
      } catch (err) {
        console.error("Error checking active favorite state:", err);
      }
    };
    checkFav();
  }, [user, car.id]);

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Inicia sesión para poder añadir vehículos a tu lista personalizada.");
      return;
    }
    try {
      const favRef = doc(db, `users/${user.uid}/favorites`, car.id);
      if (isFav) {
        await deleteDoc(favRef);
        setIsFav(false);
      } else {
        await setDoc(favRef, { carId: car.id, addedAt: serverTimestamp() });
        setIsFav(true);
      }
    } catch (err) {
      console.error("Error writing favorite:", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl bg-brand-card shadow-sm ring-1 ring-brand-border transition-all hover:shadow-xl hover:shadow-brand-primary/5 relative"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-brand-bg">
        <img 
          src={car.images[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'} 
          alt={`${car.brand} ${car.model}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {car.status !== 'available' && (
          <div className={`absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg ${
            car.status === 'reserved' ? 'bg-amber-600' : 'bg-red-600'
          }`}>
            {car.status === 'reserved' ? 'Reservado' : 'Vendido'}
          </div>
        )}

        {/* Favorite heart icon */}
        {user && (
          <button
            onClick={handleToggleFav}
            className={`absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 shadow-md ${
              isFav 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-brand-card/90 text-brand-muted hover:text-red-500'
            }`}
            title={isFav ? "Quitar de favoritos" : "Añadir a mi lista personalizada"}
          >
            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-text">{car.brand} {car.model}</h3>
          <span className="text-xl font-bold text-brand-primary">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: car.currency }).format(car.price)}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2 text-xs font-medium text-brand-muted">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="opacity-50" />
            {car.year}
          </div>
          <div className="flex items-center gap-1">
            <Gauge size={14} className="opacity-50" />
            {car.mileage.toLocaleString()} km
          </div>
          <div className="flex items-center gap-1">
            <Fuel size={14} className="opacity-50" />
            {car.fuel === 'Gasoline' ? 'Nafta' : car.fuel === 'Diesel' ? 'Diesel' : car.fuel}
          </div>
        </div>

        <Link 
          to={`/cars/${car.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 py-3 text-sm font-bold text-brand-primary transition-all hover:bg-brand-primary hover:text-white"
        >
          Ver Detalles
          <ChevronRight size={16} />
        </Link>
      </div>
    </motion.div>
  );
};
