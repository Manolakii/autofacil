export type UserRole = 'client' | 'seller' | 'admin';
export type UserStatus = 'active' | 'banned';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: any;
}

export interface AppCar {
  id: string;
  sellerId: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission: 'manual' | 'automatic';
  fuel: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  color: string;
  doors: number;
  price: number;
  currency: string;
  condition: string;
  images: string[];
  status: 'available' | 'reserved' | 'sold';
  category?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Reservation {
  id: string;
  carId: string;
  clientId: string;
  createdAt: any;
  expiresAt: any;
  status: 'active' | 'expired' | 'cancelled' | 'completed';
}

export interface Review {
  id: string;
  carId: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: any;
}
