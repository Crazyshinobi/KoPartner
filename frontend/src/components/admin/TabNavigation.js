import React from 'react';
import { 
  Home, Users, DollarSign, AlertTriangle, TrendingUp, 
  FileSpreadsheet, Bell, UserCheck, Download
} from 'lucide-react';

const tabs = [
  { id: 'stats', label: 'Dashboard', icon: Home },
  { id: 'users', label: 'All Users', icon: Users },
  { id: 'kopartners', label: 'KoPartners', icon: UserCheck },
  { id: 'unpaid', label: 'Unpaid', icon: Bell },
  { id: 'transactions', label: 'Transactions', icon: DollarSign },
  { id: 'bookings', label: 'Bookings', icon: TrendingUp },
  { id: 'payouts', label: 'Payouts', icon: FileSpreadsheet },
  { id: 'sos', label: 'SOS Reports', icon: AlertTriangle },
  { id: 'downloads', label: 'Downloads', icon: Download }
];

const TabNavigation = ({ activeTab, onTabChange, unpaidCount = 0, sosCount = 0 }) => {
  return (
    <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const showBadge = (tab.id === 'unpaid' && unpaidCount > 0) || (tab.id === 'sos' && sosCount > 0);
          const badgeCount = tab.id === 'unpaid' ? unpaidCount : sosCount;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-600 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              {tab.label}
              {showBadge && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
