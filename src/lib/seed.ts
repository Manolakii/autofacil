import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const MOCK_CARS = [
  {
    brand: "Porsche",
    model: "911 Carrera",
    year: 2022,
    mileage: 12000,
    transmission: "automatic",
    fuel: "gasoline",
    color: "Guard Red",
    doors: 2,
    price: 125000,
    currency: "USD",
    condition: "Mint condition, single owner.",
    images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"],
    status: "available",
    category: "deportivo",
    sellerId: "seed-seller-1",
  },
  {
    brand: "Tesla",
    model: "Model S Plaid",
    year: 2023,
    mileage: 5000,
    transmission: "automatic",
    fuel: "electric",
    color: "Solid Black",
    doors: 4,
    price: 89000,
    currency: "USD",
    condition: "Full Self-Driving, like new.",
    images: ["https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800"],
    status: "available",
    category: "electrico",
    sellerId: "seed-seller-1",
  },
  {
    brand: "Toyota",
    model: "Corolla",
    year: 2020,
    mileage: 45000,
    transmission: "automatic",
    fuel: "hybrid",
    color: "Silver",
    doors: 4,
    price: 22000,
    currency: "USD",
    condition: "Daily driver, well maintained.",
    images: ["https://images.unsplash.com/photo-1623860841280-29e069e7e251?auto=format&fit=crop&q=80&w=800"],
    status: "available",
    category: "sedan",
    sellerId: "seed-seller-1",
  }
];

export async function seedDatabase() {
  const q = query(collection(db, 'cars'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log("Seeding database with mock cars...");
    for (const car of MOCK_CARS) {
      await addDoc(collection(db, 'cars'), {
        ...car,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}
