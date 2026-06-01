import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, setDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppCar, Review } from '../types';
import { useAuth } from '../components/AuthProvider';
import { Heart, Share2, Star, MessageCircle, Calendar, Clock, MapPin, ExternalLink, AlertCircle, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CarDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [car, setCar] = useState<AppCar | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [conversionRate] = useState(1000); // 1 USD = 1000 ARS
  const [showConverted, setShowConverted] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [hasBought, setHasBought] = useState(false);

  // Reservation states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [reservationError, setReservationError] = useState('');

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

            // Check if user has bought this car (has a completed reservation)
            const resRef = collection(db, 'cars', id, 'reservations');
            const resQ = query(resRef, where('clientId', '==', user.uid), where('status', '==', 'completed'));
            const resSnap = await getDocs(resQ);
            setHasBought(!resSnap.empty);
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

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayOfWeek = d.getDay(); // 0 is Sunday
      if (dayOfWeek === 0) continue; // Skip Sunday
      
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      const dayName = dayNames[d.getDay()];
      const dayNum = d.getDate();
      const monthName = monthNames[d.getMonth()];
      
      const keyStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      dates.push({
        value: keyStr,
        label: `${dayName} ${dayNum} ${monthName}`,
        dayName,
        dayNum,
        monthName,
      });
      if (dates.length >= 7) break;
    }
    return dates;
  };

  const availableHours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  useEffect(() => {
    if (showReservationModal) {
      const dates = getAvailableDates();
      if (dates.length > 0) {
        setVisitDate(dates[0].value);
      }
      setVisitTime("10:00");
    }
  }, [showReservationModal]);

  const getMinMaxDates = () => {
    const today = new Date();
    const minYear = today.getFullYear();
    const minMonth = String(today.getMonth() + 1).padStart(2, '0');
    const minDay = String(today.getDate()).padStart(2, '0');
    const minStr = `${minYear}-${minMonth}-${minDay}`;

    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    const maxYear = maxDate.getFullYear();
    const maxMonth = String(maxDate.getMonth() + 1).padStart(2, '0');
    const maxDay = String(maxDate.getDate()).padStart(2, '0');
    const maxStr = `${maxYear}-${maxMonth}-${maxDay}`;

    return { minStr, maxStr };
  };

  const handleReserveClick = () => {
    if (!user) {
      navigate('/login', { state: { from: `/cars/${car?.id}` } });
      return;
    }
    setShowReservationModal(true);
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/cars/${car?.id}` } });
      return;
    }
    if (!car || car.status !== 'available') return;

    setReservationError('');
    if (!visitDate || !visitTime) {
      setReservationError('Por favor selecciona el día y horario de tu visita.');
      return;
    }

    // Verify date limit of 1 week (7 days)
    const selectedDate = new Date(visitDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    if (selectedDate < today) {
      setReservationError('No puedes seleccionar una fecha en el pasado.');
      return;
    }

    if (selectedDate > endOfWeek) {
      setReservationError('El límite máximo para agendar tu visita es de 1 semana (7 días).');
      return;
    }

    setReserving(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await addDoc(collection(db, `cars/${car.id}/reservations`), {
        carId: car.id,
        clientId: user.uid,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
        visitDate: visitDate,
        visitTime: visitTime,
        status: 'active'
      });

      await updateDoc(doc(db, 'cars', car.id), {
        status: 'reserved',
        updatedAt: serverTimestamp()
      });

      setCar(prev => prev ? { ...prev, status: 'reserved' } : null);
      setShowReservationModal(false);
      alert(`¡Vehículo reservado con éxito por 24 horas!\nTe esperamos el ${visitDate} a las ${visitTime} en nuestra sucursal.`);
    } catch (error) {
      console.error("Error en reserva:", error);
      setReservationError("No se pudo reservar el vehículo. Revisa tu conexión.");
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

  const { minStr: minDateStr, maxStr: maxDateStr } = getMinMaxDates();

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
               className={`rounded-2xl border p-4 transition-all shadow-sm ${!user ? 'hidden' : isFavorite ? 'bg-red-500 text-white border-red-500' : 'bg-brand-card border-brand-border text-red-500/50'}`}
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

          {user && hasBought ? (
            <div className="p-8 rounded-[2rem] bg-brand-card border border-brand-border shadow-xl">
               <h3 className="text-xl font-black mb-6 tracking-tight flex items-center gap-2 uppercase italic">
                 <MessageCircle className="text-brand-primary" /> Dejar Reseña (Rf-15)
               </h3>
               <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                 <CheckCircle size={14} className="shrink-0" /> ¡Gracias por comprar este vehículo! Tu opinión es muy valiosa para la comunidad.
               </p>
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
          ) : user ? (
            <div className="p-8 rounded-[2rem] bg-brand-card border border-brand-border shadow-sm">
               <h3 className="text-lg font-black mb-3 tracking-tight flex items-center gap-2 uppercase italic text-brand-muted">
                 <MessageCircle size={18} /> Dejar Reseña (Rf-15)
               </h3>
               <p className="text-xs text-brand-muted font-bold leading-relaxed uppercase tracking-wider">
                 Solo los clientes que hayan completado la compra de este vehículo en nuestra sucursal pueden dejar una reseña del mismo.
               </p>
               <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mt-2">
                 Agenda tu visita presionando el botón "Reservar Ahora"
               </p>
            </div>
          ) : (
            <div className="p-8 rounded-[2rem] bg-brand-card border border-brand-border text-center">
              <p className="text-xs text-brand-muted font-bold uppercase tracking-wider">Inicia sesión y completa la compra de este vehículo para dejar tu reseña</p>
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
              onClick={handleReserveClick}
              disabled={car.status !== 'available' || reserving}
              className="flex-1 rounded-[1.5rem] bg-brand-primary py-5 font-black uppercase tracking-[0.2em] text-sm text-white shadow-xl transition-all disabled:bg-brand-card disabled:text-brand-muted cursor-pointer"
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

      {/* Reservation Date & Time Select Modal */}
      <AnimatePresence>
        {showReservationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="w-full max-w-lg rounded-[2.5rem] bg-brand-card border border-brand-border p-6 sm:p-8 shadow-2xl relative my-8 text-left"
            >
              <button
                type="button"
                onClick={() => setShowReservationModal(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-brand-bg hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary border border-brand-border transition-colors outline-none cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-brand-primary/15 px-3.5 py-1 text-[10px] font-black uppercase text-brand-primary border border-brand-primary/20 tracking-wider">
                  Paso Final de Reserva
                </span>
                <h2 className="text-2xl font-black text-brand-text uppercase italic tracking-tight mt-1.5 leading-none">
                  Agendar Visita
                </h2>
                <p className="text-xs text-brand-muted font-bold uppercase tracking-wider mt-1">
                  Reserva {car?.brand} {car?.model} por 24 horas
                </p>
              </div>

              {reservationError && (
                <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold leading-normal">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{reservationError}</span>
                </div>
              )}

              <form onSubmit={handleReserve} className="space-y-6">
                <div className="space-y-5">
                  {/* Date Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pl-1">
                      <Calendar className="text-brand-primary" size={14} />
                      <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest">
                        Selecciona el Día de tu Visita
                      </label>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-brand-border scrollbar-track-transparent snap-x">
                      {getAvailableDates().map((date) => {
                        const isSelected = visitDate === date.value;
                        return (
                          <button
                            key={date.value}
                            type="button"
                            onClick={() => setVisitDate(date.value)}
                            className={`snap-start shrink-0 flex flex-col items-center justify-center w-[85px] h-[95px] rounded-2xl border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/25'
                                : 'bg-brand-bg border-brand-border text-brand-text hover:border-brand-primary/40 hover:bg-brand-primary/5'
                            }`}
                          >
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-100/80' : 'text-brand-muted'}`}>
                              {date.dayName}
                            </span>
                            <span className="text-2xl font-black mt-1 leading-none">{date.dayNum}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${isSelected ? 'text-blue-100/80' : 'text-brand-muted'}`}>
                              {date.monthName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pl-1">
                      <Clock className="text-brand-primary" size={14} />
                      <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest">
                        Selecciona la Hora
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 bg-brand-bg/40 p-3 rounded-2xl border border-brand-border/60">
                      {availableHours.map((hour) => {
                        const isSelected = visitTime === hour;
                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => setVisitTime(hour)}
                            className={`py-3 px-1 rounded-xl border text-xs font-black text-center transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/20'
                                : 'bg-brand-bg border-brand-border text-brand-text hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-primary'
                            }`}
                          >
                            {hour} hs
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Highly Polished Branch Box & Map Redirection */}
                <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-brand-text">Nuestra Sucursal Central</h4>
                      <p className="text-xs text-brand-muted font-semibold mt-0.5">Av. Bernardo de Irigoyen 340, CABA</p>
                      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mt-1">Horario: Lun a Sáb de 9:00 a 19:00 hs</p>
                    </div>
                  </div>

                  {/* Beautiful visual button to Google Maps link */}
                  <a
                    href="https://maps.app.goo.gl/3FtQVQvXdsZYXz29A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand-card hover:bg-brand-primary/10 border border-brand-border hover:border-brand-primary/30 text-brand-text text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-sm"
                  >
                    <span>Ver ubicación en Google Maps</span>
                    <ExternalLink size={14} className="text-brand-primary" />
                  </a>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReservationModal(false)}
                    className="flex-1 py-4 rounded-xl border border-brand-border text-brand-text font-black uppercase text-xs tracking-wider hover:bg-brand-bg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={reserving}
                    className="flex-1 py-4 rounded-xl bg-brand-primary hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/15 cursor-pointer"
                  >
                    {reserving ? 'Reservando...' : 'Confirmar Reserva'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CarDetail;
