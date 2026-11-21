import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Calendar, CreditCard, CheckCircle } from 'lucide-react';

const WebDashboard = () => {
  const [role, setRole] = useState<'client' | 'tasker'>('client');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock data for visualization - In reality, this calls the same API as the mobile app
  const mockCategories = [
    { name: 'Cleaning', icon: '🧹', desc: 'Deep cleaning' },
    { name: 'Plumbing', icon: '🚰', desc: 'Fix leaks' },
    { name: 'Electrical', icon: '⚡', desc: 'Wiring repairs' },
    { name: 'General', icon: '📦', desc: 'Odd jobs' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/task-buddy-logo.png" alt="Logo" className="h-8 w-auto" />
          <span className="text-xl font-bold text-buddy-dark">My Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setRole(role === 'client' ? 'tasker' : 'client')}
            className="text-sm font-medium text-buddy-blue hover:underline"
          >
            Switch to {role === 'client' ? 'Tasker' : 'Client'} View
          </button>
          <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-buddy-blue overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {role === 'client' ? (
          <div className="space-y la-8">
            {/* Client Welcome */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-buddy-dark">Welcome, Client!</h1>
                <p className="text-gray-500">Find the perfect pro for your home needs.</p>
              </div>
              <button className="bg-buddy-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition flex items-center gap-2 shadow-lg">
                <Plus size={20} /> Post a New Task
              </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {mockCategories.map((cat) => (
                <div key={cat.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition">{cat.icon}</div>
                  <h3 className="font-bold text-buddy-dark">{cat.name}</h3>
                  <p className="text-xs text-gray-500">{cat.desc}</p>
                </div>
              ))}
            </div>

            {/* My Active Tasks Table */}
            <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-buddy-dark">My Active Bookings</h2>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Task</th>
                    <th className="px-6 py-3">Tasker</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Payment</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">Kitchen Deep Clean</td>
                    <td className="px-6 py-4">Amara O. (⭐ 4.9)</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-buddy-blue px-2 py-1 rounded-full text-xs font-bold">Assigned</span>
                    </td>
                    <td className="px-6 py-4">₦15,000</td>
                    <td className="px-6 py-4">
                      <button className="text-buddy-blue font-bold text-sm hover:underline">Chat</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y la-8">
            {/* Tasker Welcome */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-buddy-dark">Tasker Portal</h1>
                <p className="text-gray-500">Grab a gig and start earning today.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-right">
                <p className="text-xs text-gray-400 uppercase font-bold">Total Earnings</p>
                <p className="text-2xl font-black text-buddy-orange">₦42,000</p>
              </div>
            </div>

            {/* Gigs Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-buddy-blue transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-buddy-blue px-3 py-1 rounded-full text-xs font-bold">Plumbing</div>
                    <div className="text-xl font-black text-buddy-dark">₦8,000</div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Leaking Pipe in Ikeja</h3>
                  <p className="text-gray-600 text-sm mb-6">Need someone to fix a kitchen sink leak. Urgent request. Must have tools.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <MapPin size={16} />
                      <span>Ikeja, Lagos</span>
                    </div>
                    <button className="bg-buddy-orange text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-600 transition shadow-md">
                      Accept Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WebDashboard;
