import React, { useEffect, useState } from 'react';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppCar } from '../types';
import { CarCard } from '../components/CarCard';
import { Search, Shield, Zap, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { seedDatabase } from '../lib/seed';

const FEATURES = [
  { icon: Shield, title: "Transacciones Seguras", desc: "Cada operación está protegida y verificada por nuestro equipo técnico." },
  { icon: Zap, title: "Reservas Instantáneas", desc: "Asegura el auto de tus sueños en segundos con un solo clic." },
  { icon: Globe, title: "Presencia Local", desc: "Tasaciones ajustadas al mercado local y soporte personalizado." }
];

const Home: React.FC = () => {
  const [featuredCars, setFeaturedCars] = useState<AppCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDatabase();
    const fetchCars = async () => {
      try {
        const q = query(
          collection(db, 'cars'), 
          where('status', '==', 'available'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppCar));
        setFeaturedCars(cars);
      } catch (error) {
        console.error("Error fetching featured cars:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-brand-bg px-4 text-center text-brand-text border-b border-brand-border">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center bg-no-repeat opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-4xl"
        >
          <span className="mb-4 inline-block rounded-full bg-brand-primary/20 px-4 py-1.5 text-sm font-semibold text-brand-primary border border-brand-primary/30">
            Bienvenido a Auto Fácil
          </span>
          <h1 className="mb-6 text-5xl font-black tracking-tight sm:text-7xl">
            Tu próximo auto <br/> <span className="text-brand-primary">sin complicaciones.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-brand-muted">
            La plataforma más confiable para comprar y vender vehículos. Tasaciones reales, reservas rápidas y comunicación directa.
          </p>

          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 sm:flex-row">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
              <input 
                type="text" 
                placeholder="Busca por marca, modelo o año..."
                className="h-14 w-full rounded-2xl border-none bg-brand-card/50 px-12 py-4 text-brand-text backdrop-blur-md outline-none ring-1 ring-brand-border focus:bg-brand-card focus:ring-brand-primary transition-all"
              />
            </div>
            <button className="h-14 w-full rounded-2xl bg-brand-primary px-8 py-4 font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-blue-500 sm:w-auto">
              Buscar
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          {FEATURES.map((feature, idx) => (
            <motion.div 
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center text-center p-8 rounded-3xl bg-brand-card border border-brand-border"
            >
              <div className="mb-6 rounded-2xl bg-brand-primary/10 p-4 text-brand-primary border border-brand-primary/20">
                <feature.icon size={32} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-brand-text">{feature.title}</h3>
              <p className="text-brand-muted">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Models */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between border-b border-brand-border pb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-brand-text">Modelos Destacados</h2>
            <p className="mt-2 text-brand-muted">Explora nuestras unidades más populares actualmente.</p>
          </div>
          <Link to="/models" className="text-sm font-bold text-brand-primary hover:underline">Ver Todos los Modelos</Link>
        </div>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-brand-card border border-brand-border"></div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCars.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[3rem] bg-brand-card border border-brand-border px-8 py-16 text-center text-brand-text sm:px-16 shadow-2xl">
          <div className="absolute inset-0 bg-brand-primary opacity-[0.03]"></div>
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="mb-4 text-4xl font-black">¿Listo para vender tu auto?</h2>
            <p className="mb-10 max-w-xl text-lg text-brand-muted">Únete a nuestra red de vendedores confiables y obtén el mejor valor por tu vehículo hoy mismo.</p>
            <Link to="/login" className="rounded-2xl bg-brand-primary px-10 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-blue-500">
              Portal de Vendedores
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
