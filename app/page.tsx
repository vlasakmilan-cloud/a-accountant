'use client'
import React, { useState } from 'react';
import { Home, FileText, Calculator, Brain, BarChart3, Settings, User, Menu, X, Bell, Search } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-8 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">A!Accountant</h1>
        <p className="text-xl text-gray-600">AI Účetní Software</p>
        <p className="text-lg text-green-600 mt-4">✅ Build úspěšný!</p>
        
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold">Příjmy</h3>
              <p className="text-2xl text-green-600">2,450,000 Kč</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold">Výdaje</h3>
              <p className="text-2xl text-red-600">1,850,000 Kč</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold">Zisk</h3>
              <p className="text-2xl text-blue-600">600,000 Kč</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
