import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, setDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppCar, Review } from '../types';
import { useAuth } from '../components/AuthProvider';
import { Heart, Share2, Star, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

const CarDetail: React.FC = () => {
  const { id } = useParams();
  const { profile, user } = useAuth();
  const [car, setCar] = useState<AppCar | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [conversionRate] = useState(1000); // 1 USD = 1000 ARS
  const [showConverted, setShowConverted] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) return;
      try {
        const carDoc = await getDoc(doc(db, 'cars', id));
        if (carDoc.exists()) {
          setCar({ id: carDoc.id, ...carDoc.data() } as AppCar);
          
          const revQ = query(collection(db, 'reviews'), where('carId', '==', id));
          const revSnap = await getDocs(revQ);
          setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));

          if (user) {
            const favDoc = await getDoc(doc(db, `users/${user.uid}/favorites`, id));
            setIsFavorite(favDoc.exists());
          }
        }
      } catch (error) {
        console.error("Error al cargar el vehículo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!user || !car) return;
    try {
      const favRef = doc(db, `users/${user.uid}/favorites`, car.id);
      if (isFavorite) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, { carId: car.id, addedAt: serverTimestamp() });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !car) return;
    try {
      const reviewData = {
        carId: car.id,
        clientId: user.uid,
        clientName: profile?.username || 'Usuario',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'reviews'), reviewData);
      setReviews([{ id: 'temp', ...reviewData, createdAt: new Date() } as any, ...reviews]);
      setNewReview({ rating: 5, comment: '' });
      alert("¡Reseña publicada!");
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  const handleReserve = async () => {
    if (!user || !car || car.status !== 'available') return;
    setReserving(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

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
      alert("No se pudo reservar el vehículo.");
    } finally {
      setReserving(false);
    }
  };

  const handleWhatsApp = () => {
    if (!car) return;
    const msg = `Hola! Estoy interesado en el ${car.brand} ${car.model} (${car.year}) por $${car.price}.`;
    window.open(`https://wa.me/5491122334455?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <div className="flex h-96 items-center justify-center font-bold text-brand-muted animate-pulse">Cargando detalles...</div>;
  if (!car) return <div className="p-20 text-center font-black text-brand-text text-2xl uppercase tracking-[0.2em]">Vehículo no encontrado.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <div>
            <nav className="mb-4 flex text-[10px] uppercase font-black tracking-[0.2em] text-brand-muted">
              <Link to="/models" className="hover:text-brand-primary transition-colors">Inventario</Link>
              <span className="mx-2 opacity-30">/</span>
              <span className="text-brand-text">{car.brand}</span>
            </nav>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-brand-text leading-tight uppercase italic decoration-brand-primary underline underline-offset-12 decoration-4">
              {car.brand} <br/> <span className="text-brand-primary not-italic no-underline tracking-normal">{car.model}</span>
            </h1>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 border-y border-brand-border py-10 bg-brand-card/30 px-6 rounded-3xl shadow-inner">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Año</p>
              <p className="text-lg font-bold text-brand-text">{car.year}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Kilometraje</p>
              <p className="text-lg font-bold text-brand-text">{car.mileage.toLocaleString()} km</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Transmisión</p>
              <p className="text-lg font-bold text-brand-text capitalize">{car.transmission}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Combustible</p>
              <p className="text-lg font-bold text-brand-text capitalize">{car.fuel}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Color</p>
              <p className="text-lg font-bold text-brand-text capitalize">{car.color}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Puertas</p>
              <p className="text-lg font-bold text-brand-text">{car.doors}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button title="Compartir" className="rounded-2xl bg-brand-card border border-brand-border p-4 text-brand-muted transition-all hover:bg-brand-primary hover:text-white hover:border-brand-primary shadow-sm">
               <Share2 size={22} />
             </button>
             <button 
               title="Convertir Moneda (Rf-14)" 
               onClick={() => setShowConverted(!showConverted)}
               className={`rounded-2xl border p-4 text-xs font-black uppercase tracking-widest transition-all shadow-sm ${showConverted ? 'bg-brand-primary text-white border-brand-primary' : 'bg-brand-card border-brand-border text-brand-muted'}`}
             >
               {showConverted ? 'Ver en USD' : 'Ver en ARS'}
             </button>
             <button 
               title="Favorito (Rf-16)" 
               onClick={handleToggleFavorite}
               className={`rounded-2xl border p-4 transition-all shadow-sm ${isFavorite ? 'bg-red-500 text-white border-red-500' : 'bg-brand-card border-brand-border text-red-500/50'}`}
             >
               <Heart size={22} fill={isFavorite ? "currentColor" : "none"} />
             </button>
          </div>

          <div className="flex items-center gap-3">
             <span className="text-3xl font-black text-brand-text">3.8</span>
             <div className="flex text-amber-500">
               {[1,2,3,4,5].map(i => <Star key={i} size={20} fill={i <= 4 ? "currentColor" : "none"} />)}
             </div>
              <span className="text-xs font-bold text-brand-muted uppercase tracking-widest ml-2">Calificación Global</span>
          </div>

          {user && (
            <div className="p-8 rounded-[2rem] bg-brand-card border border-brand-border shadow-xl">
               <h3 className="text-xl font-black mb-6 tracking-tight flex items-center gap-2 uppercase italic">
                 <MessageCircle className="text-brand-primary" /> Dejar Reseña (Rf-15)
               </h3>
               <form onSubmit={handleAddReview} className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    {[1,2,3,4,5].map(i => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => setNewReview({...newReview, rating: i})}
                        className={i <= newReview.rating ? 'text-amber-500' : 'text-brand-muted'}
                      >
                        <Star size={24} fill={i <= newReview.rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    placeholder="Escribe tu opinión aquí..."
                    className="w-full h-32 rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                    required
                  />
                  <button type="submit" className="w-full rounded-xl bg-brand-primary py-4 font-black uppercase text-white shadow-lg">
                    Publicar Reseña
                  </button>
               </form>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="p-6 rounded-2xl bg-brand-card border border-brand-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-brand-text">{r.clientName}</span>
                  <div className="flex text-amber-500">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= r.rating ? "currentColor" : "none"} />)}
                  </div>
                </div>
                <p className="text-sm text-brand-muted line-clamp-3">{r.comment}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              onClick={handleReserve}
              disabled={car.status !== 'available' || reserving}
              className="flex-1 rounded-[1.5rem] bg-brand-primary py-5 font-black uppercase tracking-[0.2em] text-sm text-white shadow-xl transition-all disabled:bg-brand-card disabled:text-brand-muted"
            >
              {car.status === 'available' ? 'Reservar Ahora (Rf-13)' : car.status === 'reserved' ? 'RESERVADO' : 'VENDIDO'}
            </button>
            <button 
              onClick={handleWhatsApp}
              className="flex items-center justify-center rounded-[1.5rem] bg-emerald-600 px-8 font-black text-white shadow-xl transition-all"
            >
              <MessageCircle size={24} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative aspect-[4/3] w-full overflow-hidden rounded-[3rem] bg-brand-card border border-brand-border shadow-2xl"
          >
            <img 
              src={car.images[0]} 
              alt={car.model} 
              className="h-full w-full object-cover transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-8 right-8 bg-brand-primary/90 rounded-2xl px-6 py-3 text-2xl font-black text-white shadow-2xl">
              {showConverted 
                ? `ARS ${(car.price * conversionRate).toLocaleString()}` 
                : `$${car.price.toLocaleString()}`
              }
            </div>
          </motion.div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
             {car.images.slice(0, 6).map((img, idx) => (
                <div key={idx} className="aspect-square overflow-hidden rounded-2xl bg-brand-card border border-brand-border">
                  <img src={img} className="h-full w-full object-cover opacity-100" referrerPolicy="no-referrer" />
                </div>
             ))}
          </div>
          
          <div className="p-8 rounded-[2rem] bg-brand-card border border-brand-border">
             <h3 className="text-xl font-black mb-4 tracking-tight uppercase italic italic">Detalles Técnicos</h3>
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
