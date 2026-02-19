import React from 'react';
import { Users, DollarSign, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subValue, subLabel }) => (
  <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
        {subValue !== undefined && (
          <p className="text-xs text-gray-400 mt-1">{subLabel}: {subValue}</p>
        )}
      </div>
      <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
    </div>
  </div>
);

const StatsCards = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users?.toLocaleString() || 0}
          icon={Users}
          color="#8B5CF6"
          subValue={stats.total_clients}
          subLabel="Clients"
        />
        <StatCard
          title="Total KoPartners"
          value={stats.total_kopartners?.toLocaleString() || 0}
          icon={Users}
          color="#EC4899"
          subValue={stats.active_kopartners}
          subLabel="Active"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats.total_revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="#10B981"
          subValue={stats.total_transactions}
          subLabel="Transactions"
        />
        <StatCard
          title="Total Bookings"
          value={stats.total_bookings?.toLocaleString() || 0}
          icon={TrendingUp}
          color="#F59E0B"
          subValue={stats.accepted_bookings}
          subLabel="Accepted"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Online Now</p>
          <p className="text-2xl font-bold">{stats.online_kopartners || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Pending Approvals</p>
          <p className="text-2xl font-bold">{stats.pending_approvals || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Unpaid KoPartners</p>
          <p className="text-2xl font-bold">{stats.unpaid_kopartners || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Pending Bookings</p>
          <p className="text-2xl font-bold">{stats.pending_bookings || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">SOS Reports</p>
          <p className="text-2xl font-bold">{stats.open_sos_reports || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
