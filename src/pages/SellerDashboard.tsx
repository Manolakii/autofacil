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
      images: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'],
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
    setShowForm(false);
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
       {/* Sidebar */}
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

       {/* Main Content */}
       <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-20 border-b border-brand-border flex items-center justify-between px-8 bg-brand-bg/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-4 bg-brand-card border border-brand-border px-4 py-2 rounded-2xl w-96 shadow-inner focus-within:ring-2 focus-within:ring-brand-primary transition-all">
              <Search className="text-brand-muted" size={18} />
              <input type="text" placeholder="Buscar en mi inventario..." className="bg-transparent border-none text-sm outline-none w-full text-brand-text placeholder:text-brand-muted/50" />
            </div>
            <div className="flex items-center gap-6">
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
          <div className="p-8 flex-1 space-y-8 max-w-[1400px]">
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
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-brand-muted text-[10px] font-black uppercase tracking-widest">
                          <th className="pb-6">Vehículo</th>
                          <th className="pb-6">Precio</th>
                          <th className="pb-6">Estado</th>
                          <th className="pb-6 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {cars.map(car => (
                          <tr key={car.id} className="group hover:bg-brand-border/10 transition-colors">
                            <td className="py-4 flex items-center gap-4">
                              <div className="w-20 h-12 bg-brand-bg rounded-xl overflow-hidden border border-brand-border">
                                <img src={car.images[0]} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                              </div>
                              <div>
                                <p className="font-black text-sm text-brand-text">{car.brand} {car.model}</p>
                                <p className="text-[10px] font-bold text-brand-muted mt-0.5">{car.year} • {car.mileage.toLocaleString()} km</p>
                              </div>
                            </td>
                            <td className="py-4 font-mono text-sm font-bold text-brand-primary tracking-tighter">
                              ${car.price.toLocaleString()}
                            </td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                car.status === 'available' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}>
                                {car.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleEdit(car)} className="p-2.5 hover:bg-brand-primary/10 rounded-xl text-brand-muted hover:text-brand-primary transition-all">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(car.id)} className="p-2.5 hover:bg-red-500/10 rounded-xl text-brand-muted hover:text-red-500 transition-all">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
               className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] bg-brand-card border border-brand-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-0"
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
                  </div>

                  <div className="p-6 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 flex items-start gap-4">
                    <AlertCircle size={24} className="text-brand-primary shrink-0 mt-1" />
                    <p className="text-xs text-brand-muted leading-relaxed font-medium">
                      <b className="text-brand-text">Sistema de Tasación Inteligente:</b> Al enviar este formulario, nuestro sistema validará los datos ingresados contra el mercado real para asegurar una venta rápida y segura.
                    </p>
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
