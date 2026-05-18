import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppCar } from '../types';
import { useAuth } from '../components/AuthProvider';
import { Plus, Edit2, Trash2, LayoutDashboard, Car, FileText, Calendar, ShieldCheck, Search, MessageSquare, TrendingUp, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SellerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [cars, setCars] = useState<AppCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<AppCar | null>(null);

  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [price, setPrice] = useState(0);
  const [mileage, setMileage] = useState(0);
  const [condition, setCondition] = useState('Good');
  const [images, setImages] = useState<string[]>([]);
  const [appraising, setAppraising] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    const fetchSellerCars = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'cars'), where('sellerId', '==', user.uid));
        const snap = await getDocs(q);
        setCars(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppCar)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerCars();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const data = {
      brand,
      model,
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage),
      condition,
      sellerId: user.uid,
      transmission: 'automatic',
      fuel: 'gasoline',
      color: 'White',
      doors: 4,
      currency: 'USD',
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'],
      status: 'available',
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingCar) {
        await updateDoc(doc(db, 'cars', editingCar.id), data);
        setCars(prev => prev.map(c => c.id === editingCar.id ? { ...c, ...data } as any : c));
      } else {
        const newCar = { ...data, createdAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, 'cars'), newCar);
        setCars(prev => [{ id: docRef.id, ...newCar } as any, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setBrand(''); setModel(''); setYear(2024); setPrice(0); setMileage(0); setCondition('Good');
    setEditingCar(null);
    setImages([]);
    setSuggestedPrice(null);
    setAppraising(false);
    setShowForm(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: string[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 20 * 1024 * 1024) {
        alert(`El archivo ${files[i].name} supera los 20MB permitidos.`);
        continue;
      }
      // For the demo, we'll use URL.createObjectURL to simulate upload
      validFiles.push(URL.createObjectURL(files[i]));
    }
    setImages(prev => [...prev, ...validFiles]);
  };

  const calculateSuggestedPrice = () => {
    if (!price || !year || !mileage) {
      alert("Por favor ingresa precio, año y kilometraje base para la tasación.");
      return;
    }
    setAppraising(true);
    
    // Simple mock logic for appraisal
    setTimeout(() => {
      let multiplier = 1.0;
      if (condition === 'Excellent') multiplier = 1.1;
      if (condition === 'Fair') multiplier = 0.85;
      if (condition === 'Poor') multiplier = 0.6;
      
      const suggested = price * multiplier;
      setSuggestedPrice(Math.round(suggested));
      setAppraising(false);
    }, 1500);
  };

  const handleEdit = (car: AppCar) => {
    setEditingCar(car);
    setBrand(car.brand);
    setModel(car.model);
    setYear(car.year);
    setPrice(car.price);
    setMileage(car.mileage);
    setCondition(car.condition);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, 'cars', id));
      setCars(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (profile?.role !== 'seller' && profile?.role !== 'admin') {
    return <div className="p-20 text-center text-red-500 font-bold uppercase tracking-widest">Acceso Restringido solo para Vendedores</div>;
  }

  return (
    <div className="flex bg-brand-bg min-h-screen text-brand-text">
       {/* Sidebar - Desktop */}
       <aside className="w-64 bg-brand-card border-r border-brand-border hidden lg:flex flex-col sticky top-0 h-screen">
          <div className="p-6 border-b border-brand-border mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-brand-primary/20">AF</div>
              <h1 className="text-xl font-black tracking-tight uppercase italic underline decoration-brand-primary underline-offset-4">Auto Fácil</h1>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-xl flex items-center gap-3 font-bold cursor-pointer border border-brand-primary/20">
              <LayoutDashboard size={20} />
              Panel de Control
            </div>
            <div className="hover:bg-brand-border/50 text-brand-muted p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer group">
              <Car size={20} className="group-hover:text-brand-primary" />
              Mis Vehículos
            </div>
            <div className="hover:bg-brand-border/50 text-brand-muted p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer group">
              <FileText size={20} className="group-hover:text-brand-primary" />
              Tasaciones (Rf-17)
            </div>
            <div className="hover:bg-brand-border/50 text-brand-muted p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer group">
              <Calendar size={20} className="group-hover:text-brand-primary" />
              Reservas (Rf-13)
            </div>
          </nav>
          <div className="p-6 mt-auto">
            <div className="bg-brand-border/30 rounded-2xl p-4 border border-brand-border shadow-inner">
              <p className="text-[10px] text-brand-muted uppercase font-black mb-1 tracking-widest">Perfil Vendedor</p>
              <p className="text-emerald-400 text-xs font-bold flex items-center gap-2">
                <ShieldCheck size={14} /> Verificado
              </p>
            </div>
          </div>
       </aside>

       {/* Mobile Sidebar Overlay */}
       <AnimatePresence>
         {showMobileSidebar && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowMobileSidebar(false)}
               className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
             />
             <motion.aside 
               initial={{ x: -280 }}
               animate={{ x: 0 }}
               exit={{ x: -280 }}
               className="fixed inset-y-0 left-0 z-[101] w-72 bg-brand-card border-r border-brand-border flex flex-col lg:hidden"
             >
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-lg">AF</div>
                    <span className="text-lg font-black uppercase italic underline decoration-brand-primary underline-offset-4">Auto Fácil</span>
                  </div>
                  <button onClick={() => setShowMobileSidebar(false)} className="p-2 rounded-xl bg-brand-border/30">
                    <X size={20} />
                  </button>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                  <div onClick={() => setShowMobileSidebar(false)} className="bg-brand-primary/10 text-brand-primary p-4 rounded-xl flex items-center gap-4 font-bold border border-brand-primary/20">
                    <LayoutDashboard size={24} />
                    Panel de Control
                  </div>
                  <div onClick={() => setShowMobileSidebar(false)} className="text-brand-muted p-4 rounded-xl flex items-center gap-4 hover:bg-brand-border/50">
                    <Car size={24} />
                    Mis Vehículos
                  </div>
                  <div onClick={() => setShowMobileSidebar(false)} className="text-brand-muted p-4 rounded-xl flex items-center gap-4 hover:bg-brand-border/50">
                    <TrendingUp size={24} />
                    Tasaciones
                  </div>
                </nav>
             </motion.aside>
           </>
         )}
       </AnimatePresence>

       {/* Main Content */}
       <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
          {/* Header */}
          <header className="h-20 border-b border-brand-border flex items-center justify-between px-4 sm:px-8 bg-brand-bg/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowMobileSidebar(true)}
                className="lg:hidden p-2 rounded-xl bg-brand-card border border-brand-border text-brand-muted hover:text-brand-primary transition-colors"
              >
                <LayoutDashboard size={24} />
              </button>
              <div className="hidden md:flex items-center gap-4 bg-brand-card border border-brand-border px-4 py-2 rounded-2xl w-64 lg:w-96 shadow-inner focus-within:ring-2 focus-within:ring-brand-primary transition-all">
                <Search className="text-brand-muted" size={18} />
                <input type="text" placeholder="Buscar en mi inventario..." className="bg-transparent border-none text-sm outline-none w-full text-brand-text placeholder:text-brand-muted/50" />
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-brand-text">{profile?.username}</p>
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-tighter">ID: {user?.uid.slice(0, 5)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-brand-primary font-black shadow-lg">
                {profile?.username.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="p-4 sm:p-8 flex-1 space-y-8 max-w-[1400px] mx-auto w-full">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Mis Vehículos', val: cars.length, color: 'text-brand-primary', footer: '+2 esta semana' },
                { label: 'Consultas WhatsApp', val: 18, color: 'text-emerald-500', footer: '3 pendientes hoy' },
                { label: 'Reservas Activas', val: cars.filter(c => c.status === 'reserved').length, color: 'text-amber-500', footer: 'Expira en 24h (Rf-13)' },
                { label: 'Valor Inventario', val: `$${(cars.reduce((acc, c) => acc + c.price, 0) / 1000).toFixed(1)}k`, color: 'text-brand-text', footer: 'Conv. Local (Rf-14)' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-brand-card border border-brand-border p-6 rounded-3xl shadow-sm hover:border-brand-primary/30 transition-colors group">
                  <p className="text-brand-muted text-[10px] font-black uppercase mb-2 tracking-widest group-hover:text-brand-primary transition-colors">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color}`}>{stat.val}</p>
                  <p className="text-[10px] font-bold mt-2 text-brand-muted underline decoration-brand-border underline-offset-4">{stat.footer}</p>
                </div>
              ))}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
              {/* Inventory Table Area */}
              <div className="xl:col-span-2 bg-brand-card border border-brand-border rounded-[2rem] shadow-xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-card/50">
                  <h3 className="font-black text-xl tracking-tight">Mis Vehículos Recientes</h3>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-brand-primary hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-primary/30 transition-all active:scale-95"
                  >
                    + Publicar Auto (Rf-05)
                  </button>
                </div>

                <div className="p-6">
                  {cars.length === 0 ? (
                    <div className="text-center py-20 text-brand-muted italic">No hay vehículos publicados aún.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {cars.map(car => (
                        <div key={car.id} className="group bg-brand-bg border border-brand-border rounded-[2rem] overflow-hidden hover:border-brand-primary/50 transition-all hover:shadow-xl hover:shadow-brand-primary/5">
                          <div className="aspect-video w-full overflow-hidden relative">
                            <img src={car.images[0]} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <div className="absolute top-4 right-4 bg-brand-primary px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-lg uppercase tracking-widest">
                               ${car.price.toLocaleString()}
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-black text-brand-text">{car.brand} {car.model}</h4>
                                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1">{car.year} • {car.mileage.toLocaleString()} km</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                car.status === 'available' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}>
                                {car.status === 'available' ? 'Disponible' : 'Reservado'}
                              </span>
                            </div>
                            <div className="flex gap-2 pt-4 border-t border-brand-border">
                              <button onClick={() => handleEdit(car)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-primary/10 text-brand-primary text-xs font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
                                <Edit2 size={14} /> Editar
                              </button>
                              <button onClick={() => handleDelete(car.id)} className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Widgets Area */}
              <div className="space-y-8 h-full flex flex-col">
                <div className="bg-gradient-to-br from-brand-primary to-blue-800 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-4 text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <TrendingUp size={80} />
                   </div>
                   <h4 className="font-black text-xl tracking-tight relative z-10">Herramienta de Tasación (Rf-17)</h4>
                   <p className="text-xs text-blue-100/80 relative z-10 leading-relaxed font-medium">Valora tu vehículo instantáneamente basado en mercado y condición física.</p>
                   <button className="w-full py-4 bg-white text-brand-primary rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 transition-all mt-2 hover:bg-blue-50">
                      Empezar Nueva Tasación
                   </button>
                </div>

                <div className="bg-brand-card border border-brand-border rounded-[2rem] shadow-xl flex-1 flex flex-col min-h-[400px]">
                  <div className="p-6 border-b border-brand-border flex items-center justify-between">
                    <h3 className="font-black text-lg">Leads WhatsApp</h3>
                    <MessageSquare size={18} className="text-brand-muted" />
                  </div>
                  <div className="p-5 space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar">
                    {[
                      { name: 'Maria G.', time: '5m', msg: 'Hola, ¿está disponible el Audi? Me interesa verlo.', icon: 'MG' },
                      { name: 'Juan Pérez', time: '1h', msg: 'Consultó por: Toyota Hilux 2019', icon: 'JP' },
                      { name: 'Roberto S.', time: '3h', msg: '¿Aceptas permutas por menor valor?', icon: 'RS' }
                    ].map((lead, idx) => (
                      <div key={idx} className="flex gap-4 p-4 hover:bg-brand-border/20 rounded-2xl border border-transparent hover:border-brand-border transition-all cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 font-bold text-white text-xs shadow-lg shadow-emerald-900/20">{lead.icon}</div>
                        <div>
                          <p className="text-xs font-black text-brand-text flex items-center gap-2">
                             {lead.name} <span className="text-[10px] text-brand-muted font-bold">• {lead.time}</span>
                          </p>
                          <p className="text-[11px] text-brand-muted mt-1 italic leading-snug group-hover:text-brand-text transition-colors">"{lead.msg}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 border-t border-brand-border mt-auto">
                    <button className="w-full text-center text-xs text-brand-primary font-black uppercase tracking-widest hover:underline decoration-2">Ver todos los mensajes</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
       </main>

       {/* Form Overlay */}
       <AnimatePresence>
         {showForm && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={resetForm}
               className="absolute inset-0 bg-brand-bg/90 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] bg-brand-card border border-brand-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-0 custom-scrollbar"
             >
                <div className="flex items-center justify-between p-8 border-b border-brand-border bg-brand-card/50">
                  <h2 className="text-3xl font-black tracking-tight">{editingCar ? 'Editar Vehículo' : 'Tasación y Publicación'}</h2>
                  <button onClick={resetForm} className="p-2 hover:bg-brand-border rounded-xl transition-colors"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Marca</label>
                      <input type="text" value={brand} onChange={e => setBrand(e.target.value)} required className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all" placeholder="Ej: Porsche" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Modelo</label>
                      <input type="text" value={model} onChange={e => setModel(e.target.value)} required className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all" placeholder="Ej: 911 GT3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Año</label>
                      <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} required className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Precio (USD)</label>
                      <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Kilometraje (KM)</label>
                      <input type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))} required className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Condición Física (Rf-17)</label>
                      <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full rounded-2xl bg-brand-bg border border-brand-border p-4 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all appearance-none cursor-pointer">
                        <option value="Excellent">Excelente - Como Nuevo</option>
                        <option value="Good">Bueno - Bien Mantenido</option>
                        <option value="Fair">Aceptable - Desgaste Normal</option>
                        <option value="Poor">Pobre - Requiere Reparación</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <label className="text-[10px] font-black uppercase text-brand-muted tracking-widest pl-1">Imágenes del Vehículo (Máx 20MB por archivo)</label>
                      <div className="flex flex-wrap gap-4">
                        <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-brand-border flex items-center justify-center cursor-pointer hover:border-brand-primary transition-colors hover:bg-brand-primary/5">
                          <Plus className="text-brand-muted" />
                          <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        {images.map((img, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-2xl border border-brand-border overflow-hidden relative group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-brand-primary/5 border border-brand-primary/20 space-y-6">
                    <div className="flex items-start gap-4">
                      <TrendingUp size={24} className="text-brand-primary shrink-0 mt-1" />
                      <div>
                        <h4 className="font-black text-sm tracking-tight text-brand-text">Sistema de Tasación Inteligente (Rf-17)</h4>
                        <p className="text-xs text-brand-muted leading-relaxed font-medium mt-1">
                          Calculamos el precio ideal basándonos en la condición que seleccionaste para maximizar tus ventas.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <button 
                        type="button"
                        onClick={calculateSuggestedPrice}
                        disabled={appraising}
                        className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {appraising ? 'Tasando...' : 'Calcular Precio Sugerido'}
                      </button>

                      {suggestedPrice && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 bg-white p-3 px-6 rounded-2xl border border-brand-primary/20 shadow-sm"
                        >
                          <span className="text-[10px] font-black uppercase text-brand-muted">Sugerido:</span>
                          <span className="text-xl font-black text-brand-primary">${suggestedPrice.toLocaleString()}</span>
                          <button 
                            type="button"
                            onClick={() => setPrice(suggestedPrice)}
                            className="ml-2 text-[10px] font-black text-emerald-500 hover:underline uppercase tracking-widest"
                          >
                            Aplicar
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 rounded-2xl bg-brand-primary py-5 font-black uppercase tracking-widest text-white shadow-xl shadow-brand-primary/30 transition-all hover:bg-blue-500 active:scale-[0.98]">
                      {editingCar ? 'Confirmar Edición' : 'Confirmar Tasación y Publicar'}
                    </button>
                    <button type="button" onClick={resetForm} className="px-8 rounded-2xl bg-brand-border/50 font-black uppercase tracking-widest text-brand-text hover:bg-brand-border transition-colors">
                      Cancelar
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

export default SellerDashboard;
