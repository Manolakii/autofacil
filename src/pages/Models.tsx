import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppCar } from '../types';
import { CarCard } from '../components/CarCard';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['Todos', 'Sedán', 'SUV', 'Deportivo', 'Eléctrico'];

const Models: React.FC = () => {
  const [cars, setCars] = useState<AppCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, 'cars'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const carsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppCar));
        setCars(carsData);
      } catch (error) {
        console.error("Error fetching cars:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  const filteredCars = cars.filter(car => {
    const matchesSearch = (car.brand + ' ' + car.model).toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || car.brand.includes(selectedCategory); 
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-black text-brand-text tracking-tight uppercase italic underline decoration-brand-primary underline-offset-8">Inventario Completo</h1>
        <p className="max-w-xl text-brand-muted">Explora nuestra colección curada de vehículos de alta gama y modelos populares.</p>
      </div>

      {/* Search & Filters */}
      <div className="rounded-[2.5rem] bg-brand-card p-6 sm:p-8 border border-brand-border shadow-xl">
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
            <input 
              type="text" 
              placeholder="Marca, modelo o año..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-xl border-none bg-brand-bg px-12 text-brand-text outline-none ring-1 ring-brand-border focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>
          <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-primary px-8 font-bold text-white transition-all hover:bg-blue-500 shadow-lg shadow-brand-primary/20">
            <Filter size={18} />
            Filtrar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border ${
                selectedCategory === cat 
                ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                : 'bg-brand-bg text-brand-muted border-brand-border hover:border-brand-primary/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center font-bold text-brand-muted uppercase tracking-widest text-[10px]">
        Mostrando {filteredCars.length} resultados encontrados
      </div>

      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-brand-card border border-brand-border"></div>
          ))}
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence>
            {filteredCars.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Placeholder */}
      <div className="mt-12 flex justify-center gap-3">
        <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-card border border-brand-border font-bold text-brand-muted transition-all hover:border-brand-primary hover:text-brand-primary">1</button>
        <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary font-black text-white shadow-lg shadow-brand-primary/20 ring-4 ring-brand-primary/10">2</button>
        <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-card border border-brand-border font-bold text-brand-muted transition-all hover:border-brand-primary hover:text-brand-primary">3</button>
      </div>
    </div>
  );
};

export default Models;
