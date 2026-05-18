import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import Models from './pages/Models';
import Login from './pages/Login';
import Register from './pages/Register';
import CarDetail from './pages/CarDetail';
import SellerDashboard from './pages/SellerDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/models" element={<Models />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cars/:id" element={<CarDetail />} />
                <Route path="/dashboard" element={<SellerDashboard />} />
              </Routes>
            </main>
            <footer className="border-t border-brand-border bg-brand-card py-12">
              <div className="mx-auto max-w-7xl px-4 text-center text-brand-muted sm:px-6 lg:px-8">
                <p className="text-sm font-medium">© 2026 Auto Fácil. Todos los derechos reservados.</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
