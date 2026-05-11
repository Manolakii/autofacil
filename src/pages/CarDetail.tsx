import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppCar, Review } from '../types';
import { useAuth } from '../components/AuthProvider';
import { Calendar, Gauge, Fuel, Settings, User as UserIcon, Heart, Share2, ThumbsUp, Star, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

const CarDetail: React.FC = () => {
  const { id } = useParams();
  const { profile, user } = useAuth();
  const [car, setCar] = useState<AppCar | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) return;
      try {
        const carDoc = await getDoc(doc(db, 'cars', id));
        if (carDoc.exists()) {
          setCar({ id: carDoc.id, ...carDoc.data() } as AppCar);
          
          // Fetch reviews
          const revQ = query(collection(db, 'reviews'), where('carId', '==', id));
          const revSnap = await getDocs(revQ);
          setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
        }
      } catch (error) {
        console.error("Error al cargar el vehículo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id]);

  const handleReserve = async () => {
    if (!user || !car || car.status !== 'available') return;
    setReserving(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24h reservation

      await addDoc(collection(db, `cars/${car.id}/reservations`), {
        carId: car.id,
        clientId: user.uid,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
        status: 'active'
      });

      await updateDoc(doc(db, 'cars', car.id), {
        status: 'reserved',
        updatedAt: serverTimestamp()
      });

      setCar(prev => prev ? { ...prev, status: 'reserved' } : null);
      alert("¡Vehículo reservado con éxito por 24 horas!");
    } catch (error) {
      console.error("Error en reserva:", error);
      alert("No se pudo reservar el vehículo. Verifica tus permisos.");
    } finally {
      setReserving(false);
    }
  };

  const handleWhatsApp = () => {
    if (!car) return;
    const msg = `Hola! Estoy interesado en el ${car.brand} ${car.model} (${car.year}) por $${car.price}.`;
    window.open(`/api/whatsapp?phone=5491122334455&message=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <div className="flex h-96 items-center justify-center font-bold text-brand-muted animate-pulse">Cargando detalles...</div>;
  if (!car) return <div className="p-20 text-center font-black text-brand-text text-2xl uppercase tracking-[0.2em]">Vehículo no encontrado.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Left: Info */}
        <div className="flex flex-col gap-8">
          <div>
            <nav className="mb-4 flex text-[10px] uppercase font-black tracking-[0.2em] text-brand-muted">
              <Link to="/models" className="hover:text-brand-primary transition-colors">Inventario</Link>
              <span className="mx-2 opacity-30">/</span>
              <span className="text-brand-text">{car.brand}</span>
            </nav>
            <h1 className="text-6xl font-black tracking-tight text-brand-text leading-tight uppercase italic decoration-brand-primary underline underline-offset-12 decoration-4">
              {car.brand} <br/> <span className="text-brand-primary not-italic no-underline tracking-normal">{car.model}</span>
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 border-y border-brand-border py-10 bg-brand-card/30 px-6 rounded-3xl shadow-inner">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Año</p>
              <p className="text-xl font-bold text-brand-text mt-1">{car.year}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Kilometraje</p>
              <p className="text-xl font-bold text-brand-text mt-1">{car.mileage.toLocaleString()} km</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Transmisión</p>
              <p className="text-xl font-bold text-brand-text mt-1 capitalize">{car.transmission}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Combustible</p>
              <p className="text-xl font-bold text-brand-text mt-1 capitalize">{car.fuel}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Color</p>
              <p className="text-xl font-bold text-brand-text mt-1 capitalize">{car.color}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Puertas</p>
              <p className="text-xl font-bold text-brand-text mt-1">{car.doors}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button title="Compartir" className="rounded-2xl bg-brand-card border border-brand-border p-4 text-brand-muted transition-all hover:bg-brand-primary hover:text-white hover:border-brand-primary shadow-sm hover:shadow-brand-primary/20">
               <Share2 size={22} />
             </button>
             <button title="Me gusta" className="rounded-2xl bg-brand-card border border-brand-border p-4 text-brand-muted transition-all hover:bg-brand-primary hover:text-white hover:border-brand-primary shadow-sm hover:shadow-brand-primary/20">
               <ThumbsUp size={22} />
             </button>
             <button title="Favorito" className="rounded-2xl bg-brand-card border border-brand-border p-4 text-red-500/50 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 shadow-sm hover:shadow-red-500/20">
               <Heart size={22} />
             </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-brand-text">3.8</span>
             <div className="flex text-amber-500 drop-shadow-sm">
               {[1,2,3,4,5].map(i => <Star key={i} size={20} fill={i <= 4 ? "currentColor" : "none"} />)}
             </div>
              <span className="text-xs font-bold text-brand-muted uppercase tracking-widest ml-2">Calificación Global</span>
          </div>
          
          <div className="space-y-2.5 max-w-sm">
             {[5,4,3,2,1].map(i => (
               <div key={i} className="flex items-center gap-4">
                 <span className="w-4 text-[10px] font-black text-brand-muted">{i}</span>
                 <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-card border border-brand-border">
                    <div className="h-full bg-brand-primary shadow-[0_0_8px_rgba(37,99,235,0.5)]" style={{ width: `${i === 5 ? 80 : i === 4 ? 40 : 10}%` }}></div>
                 </div>
               </div>
             ))}
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              onClick={handleReserve}
              disabled={car.status !== 'available' || reserving}
              className="flex-1 rounded-[1.5rem] bg-brand-primary py-5 font-black uppercase tracking-[0.2em] text-sm text-white shadow-xl shadow-brand-primary/30 transition-all hover:bg-blue-500 disabled:bg-brand-card disabled:text-brand-muted disabled:border-brand-border border border-brand-primary/20"
            >
              {car.status === 'available' ? 'Reservar Ahora (Rf-13)' : car.status === 'reserved' ? 'RESERVADO' : 'VENDIDO'}
            </button>
            <button 
              onClick={handleWhatsApp}
              className="flex items-center justify-center rounded-[1.5rem] bg-emerald-600 px-8 font-black text-white shadow-xl shadow-emerald-900/30 transition-all hover:bg-emerald-500 border border-emerald-500/20"
            >
              <MessageCircle size={24} />
            </button>
          </div>
        </div>

        {/* Right: Images */}
        <div className="flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative aspect-[4/3] w-full overflow-hidden rounded-[3rem] bg-brand-card border border-brand-border shadow-2xl"
          >
            <img 
              src={car.images[0]} 
              alt={car.model} 
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-8 right-8 bg-brand-primary/90 rounded-2xl px-6 py-3 text-2xl font-black text-white shadow-2xl shadow-brand-primary/40">
              ${car.price.toLocaleString()}
            </div>
          </motion.div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
             {car.images.concat(Array(5).fill(car.images[0])).slice(0, 6).map((img, idx) => (
                <div key={idx} className="aspect-square overflow-hidden rounded-2xl bg-brand-card border border-brand-border hover:border-brand-primary transition-colors cursor-pointer shadow-sm">
                  <img src={img} className="h-full w-full object-cover opacity-40 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                </div>
             ))}
          </div>
          
          <div className="p-8 rounded-[2rem] bg-brand-card border border-brand-border">
             <h3 className="text-xl font-black mb-4 tracking-tight">Detalles Técnicos</h3>
             <p className="text-sm text-brand-muted leading-relaxed">
               Este vehículo ha sido inspeccionado por nuestro equipo de expertos. 
               Cumple con todos los estándares de seguridad y rendimiento de Auto Fácil. 
               La trasacción incluye garantía de motor y caja por 6 meses.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetail;
