import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import '@/App.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Team from '@/pages/Team';
import News from '@/pages/News';
import NewsDetail from '@/pages/NewsDetail';
import Contact from '@/pages/Contact';
import Products from '@/pages/Products';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import MataElang from '@/pages/MataElang';
import MemberDetail from '@/pages/MemberDetail';
import MemberCV from '@/pages/MemberCV';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <BrowserRouter>
        <div className="App min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/team" element={<Team />} />
              <Route path="/team/:id" element={<MemberDetail />} />
              <Route path="/team/:id/cv" element={<MemberCV />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:id" element={<NewsDetail />} />
              <Route path="/products" element={<Products />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/product/mata-elang" element={<MataElang />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;