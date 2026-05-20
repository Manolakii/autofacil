import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, limit, serverTimestamp } from 'firebase/firestore';

export const populateMockData = async () => {
  try {
    const carsSnapshot = await getDocs(query(collection(db, 'cars'), limit(1)));
    if (!carsSnapshot.empty) {
      console.log("Mock data already exists.");
      return;
    }

    console.log("Populating mock data...");

    // Mock Cars
    const mockCars = [
      {
        id: 'mock-car-1',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        mileage: 15000,
        transmission: 'automatic',
        fuel: 'hybrid',
        color: 'Silver',
        doors: 4,
        price: 25000,
        currency: 'USD',
        condition: 'excellent',
        status: 'available',
        category: 'sedan',
        sellerId: 'admin-fixed', // Simulated ID
        images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1000'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        id: 'mock-car-2',
        brand: 'BMW',
        model: 'M4 Competition',
        year: 2023,
        mileage: 5000,
        transmission: 'automatic',
        fuel: 'gasoline',
        color: 'Isle of Man Green',
        doors: 2,
        price: 85000,
        currency: 'USD',
        condition: 'excellent',
        status: 'available',
        category: 'deportivo',
        sellerId: 'admin-fixed',
        images: ['https://images.unsplash.com/photo-1617814076367-b757c7a7b8e1?q=80&w=1000'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    ];

    for (const car of mockCars) {
      await setDoc(doc(db, 'cars', car.id), car);
    }

    console.log("Mock data successfully populated.");
  } catch (error) {
    console.error("Error populating mock data:", error);
  }
};
