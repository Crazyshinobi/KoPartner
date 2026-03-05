import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Home, LogOut, Users, DollarSign, AlertTriangle, CheckCircle, XCircle, 
  TrendingUp, Download, Search, Eye, UserCheck, UserX, Trash2, 
  ChevronDown, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import Footer from '../components/Footer';

// API endpoint - use relative URL for same-origin requests
const API = '/api';

const AdminPanel = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allKoPartners, setAllKoPartners] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [sosReports, setSosReports] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchAllUsers(),
      fetchAllKoPartners(),
      fetchAllTransactions(),
      fetchSOSReports()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching stats from:', `${API}/admin/stats`);
      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error.response?.data || error.message);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error.response?.data || error.message);
      setAllUsers([]);
    }
  };

  const fetchAllKoPartners = async () => {
    try {
      const response = await axios.get(`${API}/admin/kopartners/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllKoPartners(response.data.kopartners || []);
    } catch (error) {
      console.error('Failed to fetch kopartners:', error.response?.data || error.message);
      setAllKoPartners([]);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await axios.get(`${API}/admin/transactions/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error.response?.data || error.message);
      setAllTransactions([]);
    }
  };

  const fetchSOSReports = async () => {
    try {
      const response = await axios.get(`${API}/admin/sos/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSosReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch SOS reports:', error.response?.data || error.message);
      setSosReports([]);
    }
  };

  const handleApproveKoPartner = async (kopartnerId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/admin/kopartners/${kopartnerId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('KoPartner approved successfully!');
      fetchAllKoPartners();
      fetchAllUsers();
      fetchStats();
    } catch (error) {
      alert('Failed to approve KoPartner');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectKoPartner = async (kopartnerId) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/admin/kopartners/${kopartnerId}/reject?reason=${encodeURIComponent(reason)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('KoPartner rejected');
      fetchAllKoPartners();
      fetchAllUsers();
      fetchStats();
    } catch (error) {
      alert('Failed to reject KoPartner');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.is_active ? 'User activated' : 'User deactivated');
      fetchAllUsers();
      fetchAllKoPartners();
    } catch (error) {
      alert('Failed to toggle user status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User deleted successfully');
      fetchAllUsers();
      fetchAllKoPartners();
      fetchStats();
    } catch (error) {
      alert('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveROS = async (reportId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/admin/sos/${reportId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('SOS report resolved');
      fetchSOSReports();
    } catch (error) {
      alert('Failed to resolve SOS report');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel (CSV format)
  const exportToExcel = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]).filter(key => 
      !['_id', 'password', 'otp', 'otp_expiry'].includes(key)
    );

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          if (value === null || value === undefined) return '';
          if (Array.isArray(value)) value = value.join('; ');
          if (typeof value === 'object') value = JSON.stringify(value);
          // Escape quotes and wrap in quotes if contains comma
          value = String(value).replace(/"/g, '""');
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            value = `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Filter users based on search and filters
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = !searchTerm || 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || '').includes(searchTerm) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'kopartner' && ['cuddlist', 'both'].includes(u.role)) ||
      (roleFilter === 'client' && ['client', 'both'].includes(u.role));
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'approved' && u.cuddlist_status === 'approved') ||
      (statusFilter === 'pending' && u.cuddlist_status === 'pending') ||
      (statusFilter === 'rejected' && u.cuddlist_status === 'rejected') ||
      (statusFilter === 'active' && u.is_active) ||
      (statusFilter === 'inactive' && !u.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingKoPartners = allKoPartners.filter(k => k.cuddlist_status === 'pending');

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            data-testid="admin-home-btn"
          >
            <Home size={24} className="text-purple-600" />
            <span>Kopartner Admin</span>
          </button>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition"
              data-testid="refresh-btn"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition"
              data-testid="logout-btn"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-lg p-2 shadow">
          {[
            { id: 'stats', label: 'Statistics', icon: TrendingUp },
            { id: 'users', label: `All Users (${allUsers.length})`, icon: Users },
            { id: 'kopartners', label: `KoPartners (${allKoPartners.length})`, icon: UserCheck },
            { id: 'approvals', label: `Pending (${pendingKoPartners.length})`, icon: AlertTriangle },
            { id: 'transactions', label: `Transactions (${allTransactions.length})`, icon: DollarSign },
            { id: 'sos', label: `SOS Reports (${sosReports.filter(r => r.status === 'open').length})`, icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-semibold transition ${
                activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-4">
                <Users size={32} className="text-purple-600" />
              </div>
              <p className="text-3xl font-bold">{stats.total_users}</p>
              <p className="text-gray-600">Total Users</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-4">
                <UserCheck size={32} className="text-blue-600" />
              </div>
              <p className="text-3xl font-bold">{stats.active_kopartners || stats.active_cuddlists}</p>
              <p className="text-gray-600">Active KoPartners</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-4">
                <DollarSign size={32} className="text-green-600" />
              </div>
              <p className="text-3xl font-bold">₹{stats.total_revenue?.toFixed(0) || 0}</p>
              <p className="text-gray-600">Total Revenue</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp size={32} className="text-yellow-600" />
              </div>
              <p className="text-3xl font-bold">{stats.total_transactions}</p>
              <p className="text-gray-600">Transactions</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 col-span-full lg:col-span-2">
              <h3 className="text-xl font-bold mb-4">User Breakdown</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-purple-600">{stats.total_clients}</p>
                  <p className="text-gray-600">Total Clients</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{stats.total_kopartners || stats.total_cuddlists}</p>
                  <p className="text-gray-600">Total KoPartners</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_approvals}</p>
                  <p className="text-gray-600">Pending Approvals</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{stats.active_kopartners || stats.active_cuddlists}</p>
                  <p className="text-gray-600">Active Profiles</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 col-span-full lg:col-span-2">
              <h3 className="text-xl font-bold mb-4">Quick Export</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => exportToExcel(allUsers, 'all_users')}
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
                  data-testid="export-users-btn"
                >
                  <FileSpreadsheet size={20} />
                  <span>Export All Users</span>
                </button>
                <button
                  onClick={() => exportToExcel(allKoPartners, 'kopartners')}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
                  data-testid="export-kopartners-btn"
                >
                  <FileSpreadsheet size={20} />
                  <span>Export KoPartners</span>
                </button>
                <button
                  onClick={() => exportToExcel(allTransactions, 'transactions')}
                  className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition"
                  data-testid="export-transactions-btn"
                >
                  <FileSpreadsheet size={20} />
                  <span>Export Transactions</span>
                </button>
                <button
                  onClick={() => exportToExcel(sosReports, 'sos_reports')}
                  className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition"
                  data-testid="export-sos-btn"
                >
                  <FileSpreadsheet size={20} />
                  <span>Export SOS Reports</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, phone, email, city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      data-testid="search-input"
                    />
                  </div>
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  data-testid="role-filter"
                >
                  <option value="all">All Roles</option>
                  <option value="client">Clients</option>
                  <option value="kopartner">KoPartners</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  data-testid="status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() => exportToExcel(filteredUsers, 'filtered_users')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  data-testid="export-filtered-btn"
                >
                  <Download size={18} />
                  <span>Export ({filteredUsers.length})</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">City</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Registered</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{u.name || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                        <td className="px-4 py-3 text-gray-600">{u.email || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            u.role === 'cuddlist' || u.role === 'both' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {u.role === 'cuddlist' ? 'KoPartner' : u.role === 'both' ? 'Both' : 'Client'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{u.city || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-block w-fit ${
                              u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {u.cuddlist_status && (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-block w-fit ${
                                u.cuddlist_status === 'approved' ? 'bg-green-100 text-green-700' :
                                u.cuddlist_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {u.cuddlist_status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Details"
                              data-testid={`view-user-${u.id}`}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`p-2 rounded-lg transition ${
                                u.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={u.is_active ? 'Deactivate' : 'Activate'}
                              data-testid={`toggle-user-${u.id}`}
                            >
                              {u.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                            </button>
                            {(u.role === 'cuddlist' || u.role === 'both') && u.cuddlist_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveKoPartner(u.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                  title="Approve"
                                  data-testid={`approve-user-${u.id}`}
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleRejectKoPartner(u.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Reject"
                                  data-testid={`reject-user-${u.id}`}
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                              data-testid={`delete-user-${u.id}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No users found matching your criteria
                </div>
              )}
            </div>
          </div>
        )}

        {/* KoPartners Tab */}
        {activeTab === 'kopartners' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All KoPartners</h2>
              <button
                onClick={() => exportToExcel(allKoPartners, 'all_kopartners')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                data-testid="export-all-kopartners-btn"
              >
                <Download size={18} />
                <span>Export All ({allKoPartners.length})</span>
              </button>
            </div>

            <div className="grid gap-4">
              {allKoPartners.map((kp) => (
                <div key={kp.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{kp.name || 'N/A'}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          kp.cuddlist_status === 'approved' ? 'bg-green-100 text-green-700' :
                          kp.cuddlist_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {kp.cuddlist_status || 'N/A'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          kp.profile_activated ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {kp.profile_activated ? 'Profile Active' : 'Profile Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{kp.bio || 'No bio'}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="font-semibold">{kp.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="font-semibold">{kp.email || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">City:</span>
                          <p className="font-semibold">{kp.city || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Pincode:</span>
                          <p className="font-semibold">{kp.pincode || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">UPI ID:</span>
                          <p className="font-semibold">{kp.upi_id || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Rating:</span>
                          <p className="font-semibold">⭐ {kp.rating?.toFixed(1) || '0.0'} ({kp.total_reviews || 0} reviews)</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Earnings:</span>
                          <p className="font-semibold text-green-600">₹{kp.earnings?.toFixed(0) || 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Services:</span>
                          <p className="font-semibold">{kp.services?.length || 0}</p>
                        </div>
                      </div>

                      {kp.hobbies && kp.hobbies.length > 0 && (
                        <div className="mt-3">
                          <span className="text-gray-500 text-sm">Hobbies:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {kp.hobbies.map((hobby, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                {hobby}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {kp.cuddlist_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveKoPartner(kp.id)}
                            disabled={loading}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                            data-testid={`approve-kp-${kp.id}`}
                          >
                            <CheckCircle size={18} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectKoPartner(kp.id)}
                            disabled={loading}
                            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                            data-testid={`reject-kp-${kp.id}`}
                          >
                            <XCircle size={18} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => { setSelectedUser(kp); setShowUserModal(true); }}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        data-testid={`view-kp-${kp.id}`}
                      >
                        <Eye size={18} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {allKoPartners.length === 0 && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
                  No KoPartners found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Pending Approvals</h2>
              {pendingKoPartners.length > 0 && (
                <button
                  onClick={() => exportToExcel(pendingKoPartners, 'pending_kopartners')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Download size={18} />
                  <span>Export Pending</span>
                </button>
              )}
            </div>

            {pendingKoPartners.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                <p className="text-xl text-gray-600">No pending approvals</p>
              </div>
            ) : (
              pendingKoPartners.map((kp) => (
                <div key={kp.id} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <h3 className="text-xl font-bold mb-2">{kp.name || 'N/A'}</h3>
                      <p className="text-gray-600 mb-3">{kp.bio || 'No bio provided'}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2 font-semibold">{kp.phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <span className="ml-2 font-semibold">{kp.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <span className="ml-2 font-semibold">{kp.city || 'N/A'}, {kp.pincode || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">UPI:</span>
                          <span className="ml-2 font-semibold">{kp.upi_id || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Services:</span>
                          <span className="ml-2 font-semibold">{kp.services?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Registered:</span>
                          <span className="ml-2 font-semibold">{kp.created_at ? new Date(kp.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      {kp.hobbies && kp.hobbies.length > 0 && (
                        <div className="mt-3">
                          <span className="text-gray-500 text-sm">Hobbies:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {kp.hobbies.map((hobby, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                {hobby}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center space-y-3">
                      <button
                        onClick={() => handleApproveKoPartner(kp.id)}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        <CheckCircle size={20} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRejectKoPartner(kp.id)}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        <XCircle size={20} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => { setSelectedUser(kp); setShowUserModal(true); }}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        <Eye size={20} />
                        <span>View Full Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Transactions</h2>
              <button
                onClick={() => exportToExcel(allTransactions, 'transactions')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Download size={18} />
                <span>Export All ({allTransactions.length})</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm">{tx.id?.substring(0, 8)}...</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            tx.type === 'membership' ? 'bg-purple-100 text-purple-700' :
                            tx.type === 'booking' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-600">₹{tx.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{tx.user_id?.substring(0, 8)}...</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {allTransactions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No transactions found
                </div>
              )}
            </div>
          </div>
        )}

        {/* SOS Tab */}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">SOS Reports</h2>
              {sosReports.length > 0 && (
                <button
                  onClick={() => exportToExcel(sosReports, 'sos_reports')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Download size={18} />
                  <span>Export All</span>
                </button>
              )}
            </div>

            {sosReports.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                <p className="text-xl text-gray-600">No SOS reports</p>
              </div>
            ) : (
              sosReports.map((report) => (
                <div
                  key={report.id}
                  className={`bg-white rounded-2xl shadow-lg p-6 ${
                    report.status === 'open' ? 'border-l-4 border-red-600' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <AlertTriangle size={24} className={report.status === 'open' ? 'text-red-600' : 'text-gray-400'} />
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          report.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {report.status?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Reported by: <strong>{report.user_name}</strong> ({report.user_phone})</p>
                        <p className="text-sm text-gray-500">Date: {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}</p>
                      </div>

                      <p className="text-gray-700 mb-3">{report.description}</p>

                      {report.evidence_url && (
                        <a href={report.evidence_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-sm">
                          View Evidence →
                        </a>
                      )}
                    </div>

                    {report.status === 'open' && (
                      <button
                        onClick={() => handleResolveROS(report.id)}
                        disabled={loading}
                        className="ml-4 flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        <CheckCircle size={20} />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Details</h2>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">ID</label>
                  <p className="font-mono text-sm">{selectedUser.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-semibold">{selectedUser.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-semibold">{selectedUser.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-semibold">{selectedUser.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Role</label>
                  <p className="font-semibold">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="font-semibold">{selectedUser.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">City</label>
                  <p className="font-semibold">{selectedUser.city || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Pincode</label>
                  <p className="font-semibold">{selectedUser.pincode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Cuddlist Status</label>
                  <p className="font-semibold">{selectedUser.cuddlist_status || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Profile Activated</label>
                  <p className="font-semibold">{selectedUser.profile_activated ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Membership Paid</label>
                  <p className="font-semibold">{selectedUser.membership_paid ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Membership Expiry</label>
                  <p className="font-semibold">{selectedUser.membership_expiry ? new Date(selectedUser.membership_expiry).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">UPI ID</label>
                  <p className="font-semibold">{selectedUser.upi_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Earnings</label>
                  <p className="font-semibold text-green-600">₹{selectedUser.earnings?.toFixed(0) || 0}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Rating</label>
                  <p className="font-semibold">⭐ {selectedUser.rating?.toFixed(1) || '0.0'} ({selectedUser.total_reviews || 0} reviews)</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Registered On</label>
                  <p className="font-semibold">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Bio</label>
                <p className="font-semibold">{selectedUser.bio || 'N/A'}</p>
              </div>

              {selectedUser.hobbies && selectedUser.hobbies.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Hobbies</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedUser.hobbies.map((hobby, idx) => (
                      <span key={idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.services && selectedUser.services.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Services</label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.services.map((service, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-semibold">{service.name}</span>
                          <span className="text-green-600 font-semibold">₹{service.price}/{service.duration}min</span>
                        </div>
                        {service.description && <p className="text-sm text-gray-600 mt-1">{service.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              {(selectedUser.role === 'cuddlist' || selectedUser.role === 'both') && selectedUser.cuddlist_status === 'pending' && (
                <>
                  <button
                    onClick={() => { handleApproveKoPartner(selectedUser.id); setShowUserModal(false); }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { handleRejectKoPartner(selectedUser.id); setShowUserModal(false); }}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setShowUserModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default AdminPanel;
