import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Home, LogOut, Users, DollarSign, AlertTriangle, CheckCircle, XCircle, 
  TrendingUp, Download, Search, Eye, UserCheck, UserX, Trash2, 
  ChevronDown, RefreshCw, FileSpreadsheet, Edit, Send, Bell, Mail, Lock
} from 'lucide-react';
import Header from '../components/Header';
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
  const [allBookings, setAllBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [onlinePartners, setOnlinePartners] = useState([]);
  const [sosReports, setSosReports] = useState([]);
  const [unpaidKoPartners, setUnpaidKoPartners] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [sendingReminder, setSendingReminder] = useState(null);
  const [showKoPartnerDetails, setShowKoPartnerDetails] = useState(false);
  const [selectedKoPartner, setSelectedKoPartner] = useState(null);
  const [kopartnerBookings, setKopartnerBookings] = useState([]);
  const [sendingBulkEmail, setSendingBulkEmail] = useState(false);
  const [emailQuota, setEmailQuota] = useState(null);
  const [bulkEmailResult, setBulkEmailResult] = useState(null);
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordChanging, setPasswordChanging] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(50);
  
  // New state for bulk actions
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActivating, setBulkActivating] = useState(false);
  const [sendingSelectedEmails, setSendingSelectedEmails] = useState(false);
  const [activationMembershipType, setActivationMembershipType] = useState('6month'); // Default 6 months
  const [emailRotationStatus, setEmailRotationStatus] = useState(null);
  const [autoEmailRunning, setAutoEmailRunning] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(null);
  
  // Auto-Activation states
  const [autoActivationStatus, setAutoActivationStatus] = useState(null);
  const [runningAutoActivation, setRunningAutoActivation] = useState(false);
  const [paidButInactiveList, setPaidButInactiveList] = useState([]);
  
  // SUPER FAST SEARCH states
  const [instantSearchResults, setInstantSearchResults] = useState([]);
  const [showInstantSearch, setShowInstantSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAllData();
    fetchEmailQuota();
    fetchEmailRotationStatus();
    fetchAutoActivationStatus();
  }, [user]);

  // Fetch data when tab, page, or filters change
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'kopartners') {
      fetchDataForTab();
    }
  }, [activeTab, currentPage, roleFilter, statusFilter]);

  // SUPER FAST INSTANT SEARCH - separate effect for search
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length >= 1) {
      performFastSearch(searchTerm);
    } else {
      setInstantSearchResults([]);
      setShowInstantSearch(false);
      // When search is cleared, fetch normal data
      if (activeTab === 'users' || activeTab === 'kopartners') {
        fetchDataForTab();
      }
    }
  }, [searchTerm]);

  const fetchDataForTab = async () => {
    if (activeTab === 'users') {
      await fetchAllUsers();
    } else if (activeTab === 'kopartners') {
      await fetchAllKoPartners();
    }
  };

  // SUPER FAST SEARCH with instant results
  const performFastSearch = async (query) => {
    if (!query || query.trim().length < 1) return;
    
    setSearchLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${API}/admin/fast-search`, {
        params: { q: query.trim(), limit: 50 },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const endTime = Date.now();
      setLastSearchTime(endTime - startTime);
      
      setInstantSearchResults(response.data.users || []);
      setShowInstantSearch(true);
      
      // Also update main list for consistency
      setAllUsers(response.data.users || []);
      setTotalCount(response.data.count || 0);
      setTotalPages(1);
      
      console.log(`[FAST-SEARCH] "${query}" - ${response.data.count} results in ${endTime - startTime}ms (server: ${response.data.query_time_ms}ms)`);
    } catch (error) {
      console.error('Fast search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search handler - reduced to 200ms for faster response
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    
    // For fast search, use shorter debounce (200ms)
    setSearchTimeout(setTimeout(() => {
      setCurrentPage(1);
    }, 200));
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchAllUsers(),
      fetchAllKoPartners(),
      fetchAllTransactions(),
      fetchAllBookings(),
      fetchCompletedBookings(),
      fetchOnlinePartners(),
      fetchSOSReports(),
      fetchUnpaidKoPartners()
    ]);
    setLoading(false);
  };

  const fetchEmailQuota = async () => {
    try {
      const response = await axios.get(`${API}/admin/email-quota-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailQuota(response.data);
    } catch (error) {
      console.error('Failed to fetch email quota:', error);
    }
  };

  const fetchEmailRotationStatus = async () => {
    try {
      const response = await axios.get(`${API}/admin/email-rotation-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailRotationStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch email rotation status:', error);
    }
  };

  const [schedulerStatus, setSchedulerStatus] = useState(null);

  const fetchSchedulerStatus = async () => {
    try {
      const response = await axios.get(`${API}/admin/auto-email-scheduler/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedulerStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch scheduler status:', error);
    }
  };

  const toggleScheduler = async () => {
    try {
      const response = await axios.post(`${API}/admin/auto-email-scheduler/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      fetchSchedulerStatus();
    } catch (error) {
      alert('Failed to toggle scheduler: ' + (error.response?.data?.detail || error.message));
    }
  };

  const runSchedulerNow = async () => {
    if (!window.confirm('Run auto email batch now? This will send up to 15 emails.')) return;
    
    try {
      const response = await axios.post(`${API}/admin/auto-email-scheduler/run-now`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      // Wait a bit then refresh status
      setTimeout(() => {
        fetchSchedulerStatus();
        fetchEmailRotationStatus();
        fetchEmailQuota();
      }, 3000);
    } catch (error) {
      alert('Failed to run scheduler: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Auto-Activation Functions
  const fetchAutoActivationStatus = async () => {
    try {
      const response = await axios.get(`${API}/admin/auto-activation/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAutoActivationStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch auto-activation status:', error);
    }
  };

  const runAutoActivationNow = async () => {
    if (!window.confirm('Run auto-activation check now? This will find and activate all paid but inactive profiles.')) return;
    
    setRunningAutoActivation(true);
    try {
      const response = await axios.post(`${API}/admin/auto-activation/run-now`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      // Refresh status after a delay
      setTimeout(() => {
        fetchAutoActivationStatus();
        fetchPaidButInactive();
        fetchStats();
        fetchAllData();
      }, 3000);
    } catch (error) {
      alert('Failed to run auto-activation: ' + (error.response?.data?.detail || error.message));
    } finally {
      setRunningAutoActivation(false);
    }
  };

  const fetchPaidButInactive = async () => {
    try {
      const response = await axios.get(`${API}/admin/paid-but-inactive`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaidButInactiveList(response.data.members || []);
    } catch (error) {
      console.error('Failed to fetch paid but inactive:', error);
    }
  };

  const activateAllPaidMembers = async () => {
    if (!window.confirm('⚠️ This will activate ALL paid members who are currently inactive. Continue?')) return;
    
    setRunningAutoActivation(true);
    try {
      const response = await axios.post(`${API}/admin/activate-all-paid`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ ${response.data.message}`);
      fetchAutoActivationStatus();
      fetchPaidButInactive();
      fetchStats();
      fetchAllData();
    } catch (error) {
      alert('Failed to activate: ' + (error.response?.data?.detail || error.message));
    } finally {
      setRunningAutoActivation(false);
    }
  };

  // Fetch scheduler status periodically
  useEffect(() => {
    if (user && user.role === 'admin' && activeTab === 'unpaid') {
      fetchSchedulerStatus();
      fetchAutoActivationStatus();
      fetchPaidButInactive();
      const interval = setInterval(() => {
        fetchSchedulerStatus();
        fetchAutoActivationStatus();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, activeTab]);

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
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await axios.get(`${API}/admin/users/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(response.data.users || []);
      setTotalCount(response.data.total_count || 0);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error.response?.data || error.message);
      setAllUsers([]);
    }
  };

  const fetchAllKoPartners = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await axios.get(`${API}/admin/kopartners/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllKoPartners(response.data.kopartners || []);
    } catch (error) {
      console.error('Failed to fetch kopartners:', error.response?.data || error.message);
      setAllKoPartners([]);
    }
  };

  const fetchCompletedBookings = async () => {
    try {
      const response = await axios.get(`${API}/admin/bookings/completed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompletedBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch completed bookings:', error.response?.data || error.message);
      setCompletedBookings([]);
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

  const fetchUnpaidKoPartners = async () => {
    try {
      const response = await axios.get(`${API}/admin/users/unpaid-kopartners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnpaidKoPartners(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch unpaid kopartners:', error.response?.data || error.message);
      setUnpaidKoPartners([]);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await axios.get(`${API}/admin/bookings/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error.response?.data || error.message);
      setAllBookings([]);
    }
  };

  const fetchOnlinePartners = async () => {
    try {
      const response = await axios.get(`${API}/admin/online-partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOnlinePartners(response.data.partners || []);
    } catch (error) {
      console.error('Failed to fetch online partners:', error.response?.data || error.message);
      setOnlinePartners([]);
    }
  };

  // Admin password change function
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }
    
    setPasswordChanging(true);
    try {
      const response = await axios.post(`${API}/admin/change-password`, {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('✅ Password changed successfully! Please use your new password for next login.');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setEditFormData({
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      phone: userToEdit.phone || '',
      city: userToEdit.city || '',
      pincode: userToEdit.pincode || '',
      bio: userToEdit.bio || '',
      upi_id: userToEdit.upi_id || '',
      cuddlist_status: userToEdit.cuddlist_status || '',
      profile_activated: userToEdit.profile_activated || false,
      membership_paid: userToEdit.membership_paid || false,
      is_active: userToEdit.is_active !== false
    });
    setShowEditModal(true);
  };

  // View KoPartner details with bookings
  const handleViewKoPartnerDetails = (kopartner) => {
    setSelectedKoPartner(kopartner);
    // Filter bookings for this KoPartner
    const kpBookings = allBookings.filter(b => b.kopartner_id === kopartner.id);
    setKopartnerBookings(kpBookings);
    setShowKoPartnerDetails(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    setLoading(true);
    try {
      await axios.put(`${API}/admin/users/${editingUser.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User updated successfully!');
      setShowEditModal(false);
      setEditingUser(null);
      fetchAllData();
    } catch (error) {
      alert('Failed to update user: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (userId, userName, userPhone) => {
    console.log('handleSendReminder called:', { userId, userName, userPhone });
    
    if (!userId) {
      console.error('userId is undefined or null!');
      alert('Error: User ID is missing. Please refresh and try again.');
      return;
    }
    
    if (!window.confirm(`Send payment reminder (SMS + Email) to ${userName || userPhone}?`)) {
      console.log('User cancelled confirmation dialog');
      return;
    }
    
    console.log('Starting to send reminder...');
    setSendingReminder(userId);
    try {
      const apiUrl = `${API}/admin/users/${userId}/send-payment-reminder`;
      console.log('Making API call to:', apiUrl);
      
      const response = await axios.post(apiUrl, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('API response:', response.data);
      
      // Build message showing SMS and Email status
      let statusMsg = '';
      if (response.data.sms_sent) {
        statusMsg += '✅ SMS sent successfully\n';
      } else {
        statusMsg += '❌ SMS failed\n';
      }
      if (response.data.email_sent) {
        statusMsg += '✅ Email sent successfully\n';
      } else if (response.data.email_sent === false) {
        statusMsg += '❌ Email failed or no email on file\n';
      }
      
      alert(`Payment Reminder Status:\n\n${statusMsg}\n${response.data.message}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSendingReminder(null);
    }
  };

  // Send SMS only
  const handleSendSmsReminder = async (userId, userName, userPhone) => {
    if (!userId) {
      alert('Error: User ID is missing.');
      return;
    }
    
    if (!window.confirm(`Send SMS reminder to ${userName || userPhone}?`)) {
      return;
    }
    
    setSendingReminder(userId + '_sms');
    try {
      const response = await axios.post(`${API}/admin/users/${userId}/send-sms-reminder`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert(`✅ SMS sent successfully to ${userPhone}`);
      } else {
        alert(`❌ SMS failed for ${userPhone}`);
      }
    } catch (error) {
      alert('Failed to send SMS: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSendingReminder(null);
    }
  };

  // Send Email only
  const handleSendEmailReminder = async (userId, userName, userEmail) => {
    if (!userId) {
      alert('Error: User ID is missing.');
      return;
    }
    
    if (!userEmail) {
      alert('❌ No email address on file for this user.');
      return;
    }
    
    if (!window.confirm(`Send Email reminder to ${userName || userEmail}?`)) {
      return;
    }
    
    setSendingReminder(userId + '_email');
    try {
      const response = await axios.post(`${API}/admin/users/${userId}/send-email-reminder`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert(`✅ Email sent successfully to ${userEmail}`);
        fetchEmailQuota(); // Refresh quota
      } else {
        alert(`❌ Email failed for ${userEmail}`);
      }
    } catch (error) {
      alert('Failed to send Email: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSendingReminder(null);
    }
  };

  // Send Bulk Email to all unpaid KoPartners
  const handleBulkEmailReminder = async () => {
    const unpaidWithEmail = unpaidKoPartners.filter(u => u.email);
    
    if (unpaidWithEmail.length === 0) {
      alert('❌ No unpaid KoPartners with email addresses found.');
      return;
    }
    
    const confirmMsg = `📧 Send payment reminder emails to ${unpaidWithEmail.length} unpaid KoPartner(s)?\n\n` +
      `⚠️ Gmail Rate Limiting:\n` +
      `• Daily limit: ${emailQuota?.daily_limit || 450} emails\n` +
      `• Already sent today: ${emailQuota?.emails_sent_today || 0}\n` +
      `• Remaining quota: ${emailQuota?.remaining_quota || 450}\n\n` +
      `This may take a few minutes due to rate limiting (2 sec between emails).`;
    
    if (!window.confirm(confirmMsg)) {
      return;
    }
    
    setSendingBulkEmail(true);
    setBulkEmailResult(null);
    
    try {
      const response = await axios.post(`${API}/admin/bulk-email-reminder`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 300000 // 5 minute timeout for large batches
      });
      
      setBulkEmailResult(response.data);
      fetchEmailQuota(); // Refresh quota
      
      // Show summary alert
      const { sent, failed, skipped, remaining_quota } = response.data;
      alert(
        `📧 Bulk Email Complete!\n\n` +
        `✅ Sent: ${sent}\n` +
        `❌ Failed: ${failed}\n` +
        `⏭️ Skipped (quota): ${skipped}\n\n` +
        `📊 Remaining daily quota: ${remaining_quota}`
      );
      
    } catch (error) {
      console.error('Bulk email error:', error);
      alert('Failed to send bulk emails: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSendingBulkEmail(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === unpaidKoPartners.length);
  };

  // Select/Deselect all users
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(unpaidKoPartners.map(u => u.id));
      setSelectedUsers(allIds);
      setSelectAll(true);
    }
  };

  // Bulk activate selected profiles
  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) {
      alert('❌ Please select at least one user to activate');
      return;
    }

    if (selectedUsers.size > 100) {
      alert('❌ Maximum 100 users can be activated at once');
      return;
    }

    const confirmMsg = `🎯 Bulk Activate ${selectedUsers.size} Profile(s)?\n\n` +
      `Membership Type: ${activationMembershipType}\n\n` +
      `This will:\n` +
      `• Mark them as PAID\n` +
      `• Activate their profile\n` +
      `• Set status to APPROVED\n\n` +
      `Continue?`;

    if (!window.confirm(confirmMsg)) return;

    setBulkActivating(true);
    try {
      const response = await axios.post(`${API}/admin/bulk-activate-profiles`, {
        user_ids: Array.from(selectedUsers),
        membership_type: activationMembershipType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { activated, failed } = response.data;
      alert(`✅ Bulk Activation Complete!\n\nActivated: ${activated}\nFailed: ${failed}`);
      
      // Refresh data and clear selection
      setSelectedUsers(new Set());
      setSelectAll(false);
      fetchAllData();
      fetchStats();
    } catch (error) {
      alert('❌ Bulk activation failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setBulkActivating(false);
    }
  };

  // Send emails to selected users
  const handleSendSelectedEmails = async () => {
    const usersWithEmail = unpaidKoPartners.filter(u => selectedUsers.has(u.id) && u.email);
    
    if (usersWithEmail.length === 0) {
      alert('❌ No selected users have email addresses');
      return;
    }

    if (usersWithEmail.length > 20) {
      alert('❌ Maximum 20 users can be emailed at once. Please select fewer users.');
      return;
    }

    const confirmMsg = `📧 Send Email to ${usersWithEmail.length} User(s)?\n\n` +
      `This will send payment reminder emails with ~1 sec delay between each.`;

    if (!window.confirm(confirmMsg)) return;

    setSendingSelectedEmails(true);
    try {
      const response = await axios.post(`${API}/admin/send-selected-emails`, {
        user_ids: usersWithEmail.map(u => u.id)
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000
      });

      const { sent, failed, remaining_quota } = response.data;
      alert(`📧 Email Batch Complete!\n\n✅ Sent: ${sent}\n❌ Failed: ${failed}\n📊 Quota remaining: ${remaining_quota}`);
      
      fetchEmailQuota();
      setSelectedUsers(new Set());
      setSelectAll(false);
    } catch (error) {
      alert('❌ Email sending failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSendingSelectedEmails(false);
    }
  };

  // Trigger auto email batch (15 emails)
  const handleAutoEmailBatch = async () => {
    const confirmMsg = `🔄 Run Auto Email Batch?\n\n` +
      `This will send up to 15 emails to unpaid KoPartners.\n` +
      `Emails are sent in rotation to ensure everyone gets reminders.\n\n` +
      `Continue?`;

    if (!window.confirm(confirmMsg)) return;

    setAutoEmailRunning(true);
    try {
      const response = await axios.post(`${API}/admin/auto-email-batch`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000
      });

      const { sent, failed, rotation_progress, daily_count, daily_limit } = response.data;
      alert(
        `🔄 Auto Batch Complete!\n\n` +
        `✅ Sent: ${sent}\n` +
        `❌ Failed: ${failed}\n\n` +
        `📊 Rotation: ${rotation_progress}\n` +
        `📧 Daily: ${daily_count}/${daily_limit}`
      );
      
      fetchEmailQuota();
      fetchEmailRotationStatus();
    } catch (error) {
      alert('❌ Auto email batch failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setAutoEmailRunning(false);
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

  const handleActivateMembership = async (kopartnerId, kopartnerName) => {
    if (!window.confirm(`Activate membership for ${kopartnerName || 'this user'}?\n\nThis will:\n✓ Set membership_paid = true\n✓ Activate their profile\n✓ Set status to approved`)) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/kopartners/${kopartnerId}/activate-membership`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        alert(`✅ Membership activated for ${kopartnerName}!\n\nExpiry: ${new Date(response.data.membership_expiry).toLocaleDateString()}`);
        fetchAllData();
      }
    } catch (error) {
      alert('Failed to activate membership: ' + (error.response?.data?.detail || error.message));
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

  // Handle payout to KoPartner (80% of service amount)
  const handlePayPayout = async (bookingId, payoutAmount, kopartnerName) => {
    if (!window.confirm(`Pay ₹${payoutAmount.toFixed(2)} to ${kopartnerName}?`)) return;
    
    setProcessingPayout(bookingId);
    try {
      const response = await axios.post(`${API}/admin/bookings/${bookingId}/pay-payout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      fetchCompletedBookings();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to process payout');
    } finally {
      setProcessingPayout(null);
    }
  };

  // Mark booking as completed
  const handleMarkCompleted = async (bookingId) => {
    if (!window.confirm('Mark this booking as completed?')) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/admin/bookings/${bookingId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Booking marked as completed');
      fetchAllBookings();
      fetchCompletedBookings();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to mark booking as completed');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel (CSV format - fallback)
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

  // Download proper Excel file from backend
  const downloadExcelFromBackend = async (endpoint, filename) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      alert('✅ Excel file downloaded successfully!');
    } catch (error) {
      console.error('Failed to download Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Now using server-side filtering, so just use allUsers directly
  const filteredUsers = allUsers;

  const pendingKoPartners = allKoPartners.filter(k => k.cuddlist_status === 'pending');

  // Pagination component
  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t">
      <div className="text-sm text-gray-600">
        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          First
        </button>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          Previous
        </button>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          Next
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          Last
        </button>
      </div>
    </div>
  );

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 pt-28">
        {/* Admin Controls */}
        <div className="bg-white rounded-lg p-4 shadow mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              data-testid="change-password-btn"
            >
              <Lock size={20} />
              <span>Change Password</span>
            </button>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
              data-testid="refresh-btn"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-lg p-2 shadow">
          {[
            { id: 'stats', label: 'Statistics', icon: TrendingUp },
            { id: 'users', label: `All Users (${stats?.total_users || totalCount})`, icon: Users },
            { id: 'kopartners', label: `KoPartners (${stats?.total_kopartners || allKoPartners.length})`, icon: UserCheck },
            { id: 'approvals', label: `Pending (${stats?.pending_approvals || pendingKoPartners.length})`, icon: AlertTriangle },
            { id: 'unpaid', label: `Unpaid (${stats?.unpaid_kopartners || unpaidKoPartners.length})`, icon: Bell },
            { id: 'transactions', label: `Transactions (${stats?.total_transactions || allTransactions.length})`, icon: DollarSign },
            { id: 'bookings', label: `Bookings (${stats?.total_bookings || allBookings.length})`, icon: UserCheck },
            { id: 'payouts', label: `Payouts (${completedBookings.filter(b => b.payout_status !== 'paid').length})`, icon: DollarSign },
            { id: 'sos', label: `SOS Reports (${stats?.open_sos_reports || sosReports.filter(r => r.status === 'open').length})`, icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
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

            {/* Online KoPartners Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.online_kopartners || 0}</p>
              <p className="text-gray-600">Online Now</p>
            </div>

            {/* Unpaid KoPartners Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <Bell size={32} className="text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-orange-600">{stats.unpaid_kopartners || 0}</p>
              <p className="text-gray-600">Unpaid KoPartners</p>
            </div>

            {/* Bookings Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition col-span-2">
              <h3 className="text-xl font-bold mb-4">Booking Status</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.total_bookings || 0}</p>
                  <p className="text-gray-600 text-sm">Total</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_bookings || 0}</p>
                  <p className="text-gray-600 text-sm">Pending</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.accepted_bookings || 0}</p>
                  <p className="text-gray-600 text-sm">Accepted</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.denied_bookings || 0}</p>
                  <p className="text-gray-600 text-sm">Denied</p>
                </div>
              </div>
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
              <h3 className="text-xl font-bold mb-4">Quick Export (Excel)</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => downloadExcelFromBackend('users/download-excel', 'all_users')}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  data-testid="export-users-btn"
                >
                  <Download size={20} />
                  <span>Download All Users</span>
                </button>
                <button
                  onClick={() => exportToExcel(allKoPartners, 'kopartners')}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
                  data-testid="export-kopartners-btn"
                >
                  <FileSpreadsheet size={20} />
                  <span>Export KoPartners (CSV)</span>
                </button>
                <button
                  onClick={() => downloadExcelFromBackend('transactions/download-excel', 'transactions')}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  data-testid="export-transactions-btn"
                >
                  <Download size={20} />
                  <span>Download Transactions</span>
                </button>
                <button
                  onClick={() => exportToExcel(sosReports, 'sos_reports')}
                  className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition"
                  data-testid="export-sos-btn"
                >
                  <FileSpreadsheet size={20} />
                  <span>Export SOS Reports (CSV)</span>
                </button>
              </div>
              
              {/* Full Database Export Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold mb-3 text-gray-800">Full Database Backup</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      const token = localStorage.getItem('admin_token');
                      window.open(`/api/admin/export-all-data?token=${token}`, '_blank');
                    }}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
                    data-testid="export-full-json-btn"
                  >
                    <Download size={20} />
                    <span>Full Backup (JSON)</span>
                  </button>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem('admin_token');
                      window.open(`/api/admin/export-users-csv?token=${token}`, '_blank');
                    }}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-teal-700 transition shadow-lg"
                    data-testid="export-users-csv-btn"
                  >
                    <FileSpreadsheet size={20} />
                    <span>All Users (CSV)</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Full Backup includes: Users, Transactions, Bookings, Payments, SOS Reports, Reviews, Audit Logs
                </p>
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
                      placeholder="🔍 FAST Search: name, phone, email, city, pincode..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-10 pr-20 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      data-testid="search-input"
                    />
                    {/* Search Loading/Time Indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {searchLoading && (
                        <RefreshCw size={16} className="text-purple-500 animate-spin" />
                      )}
                      {lastSearchTime && searchTerm && !searchLoading && (
                        <span className="text-xs text-green-600 font-medium">
                          {lastSearchTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Search Tips */}
                  {searchTerm && (
                    <p className="text-xs text-gray-500 mt-1 ml-1">
                      💡 Found {totalCount} results {lastSearchTime && `in ${lastSearchTime}ms`}
                    </p>
                  )}
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  data-testid="role-filter"
                >
                  <option value="all">All Roles</option>
                  <option value="client">Clients</option>
                  <option value="kopartner">KoPartners</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  data-testid="status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid Members</option>
                  <option value="unpaid">Unpaid Members</option>
                </select>
                <button
                  onClick={() => exportToExcel(filteredUsers, 'filtered_users')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  data-testid="export-filtered-btn"
                >
                  <Download size={18} />
                  <span>Export ({totalCount})</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="animate-spin text-purple-600" size={32} />
                  <span className="ml-2 text-gray-600">Loading users...</span>
                </div>
              ) : (
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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                          No users found matching your criteria
                        </td>
                      </tr>
                    ) : filteredUsers.map((u) => (
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
                              onClick={() => handleEditUser(u)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Edit User"
                              data-testid={`edit-user-${u.id}`}
                            >
                              <Edit size={18} />
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
                            {(u.role === 'cuddlist' || u.role === 'both') && !u.membership_paid && (
                              <button
                                type="button"
                                onClick={() => handleSendReminder(u.id, u.name, u.phone)}
                                disabled={sendingReminder === u.id}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition disabled:opacity-50"
                                title="Send Payment Reminder"
                                data-testid={`reminder-user-${u.id}`}
                              >
                                <Send size={18} className={sendingReminder === u.id ? 'animate-pulse' : ''} />
                              </button>
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
              )}
              <PaginationControls />
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
                          <span className="text-gray-500">Registered:</span>
                          <p className="font-semibold">{kp.created_at ? new Date(kp.created_at).toLocaleDateString() : 'N/A'}</p>
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
                        onClick={() => handleViewKoPartnerDetails(kp)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        data-testid={`view-kp-${kp.id}`}
                      >
                        <Eye size={18} />
                        <span>View Details & Bookings</span>
                      </button>
                      <button
                        onClick={() => handleEditUser(kp)}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                        data-testid={`edit-kp-${kp.id}`}
                      >
                        <Edit size={18} />
                        <span>Edit</span>
                      </button>
                      {!kp.membership_paid && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSendSmsReminder(kp.id, kp.name, kp.phone)}
                            disabled={sendingReminder === kp.id + '_sms'}
                            className="flex items-center space-x-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                            data-testid={`sms-reminder-kp-${kp.id}`}
                          >
                            <Send size={16} className={sendingReminder === kp.id + '_sms' ? 'animate-pulse' : ''} />
                            <span>SMS</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendEmailReminder(kp.id, kp.name, kp.email)}
                            disabled={sendingReminder === kp.id + '_email' || !kp.email}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${kp.email ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} disabled:opacity-50`}
                            title={kp.email ? `Send to ${kp.email}` : 'No email on file'}
                            data-testid={`email-reminder-kp-${kp.id}`}
                          >
                            <Mail size={16} className={sendingReminder === kp.id + '_email' ? 'animate-pulse' : ''} />
                            <span>Email</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReminder(kp.id, kp.name, kp.phone)}
                            disabled={sendingReminder === kp.id}
                            className="flex items-center space-x-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
                            data-testid={`reminder-kp-${kp.id}`}
                          >
                            <Send size={16} className={sendingReminder === kp.id ? 'animate-pulse' : ''} />
                            <span>Both</span>
                          </button>
                        </>
                      )}
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

        {/* Unpaid KoPartners Tab */}
        {activeTab === 'unpaid' && (
          <div className="space-y-4">
            {/* Header with bulk action buttons */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold">Unpaid KoPartners</h2>
                <p className="text-gray-600">Users who signed up but have not paid membership fee</p>
                {selectedUsers.size > 0 && (
                  <p className="text-purple-600 font-semibold mt-1">
                    ✓ {selectedUsers.size} user(s) selected
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => exportToExcel(unpaidKoPartners, 'unpaid_kopartners')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Download size={16} />
                  <span>Export ({unpaidKoPartners.length})</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions Panel */}
            {unpaidKoPartners.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-indigo-800 mb-3">🎯 Bulk Actions</h3>
                
                {/* Selection Controls */}
                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-indigo-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-indigo-800">
                      Select All ({unpaidKoPartners.length})
                    </span>
                  </label>
                  {selectedUsers.size > 0 && (
                    <button
                      onClick={() => { setSelectedUsers(new Set()); setSelectAll(false); }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Bulk Activate Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-green-700 font-bold text-lg">🚀 Quick Bulk Activate (50 Users):</span>
                  </div>
                  
                  {/* Quick Action: Select All 50 & Activate for 6 Months */}
                  <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-green-300">
                    <button
                      onClick={() => {
                        // Select all unpaid users on current page (max 50)
                        const pageUsers = unpaidKoPartners.slice(0, 50);
                        const newSelected = new Set(pageUsers.map(u => u.id));
                        setSelectedUsers(newSelected);
                        setSelectAll(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      <CheckCircle size={18} />
                      Select All 50 on Page
                    </button>
                    
                    <button
                      onClick={async () => {
                        // Quick activate: Select all 50 and activate for 6 months
                        const pageUsers = unpaidKoPartners.slice(0, 50);
                        if (pageUsers.length === 0) {
                          alert('❌ No unpaid users to activate');
                          return;
                        }
                        
                        const confirmMsg = `🎯 QUICK ACTIVATE ${pageUsers.length} Users for 6 MONTHS?\n\n` +
                          `This will:\n` +
                          `• Select all ${pageUsers.length} unpaid users on this page\n` +
                          `• Mark them as PAID\n` +
                          `• Activate their profile\n` +
                          `• Set 6-month membership\n\n` +
                          `Continue?`;
                        
                        if (!window.confirm(confirmMsg)) return;
                        
                        setBulkActivating(true);
                        try {
                          const response = await axios.post(`${API}/admin/bulk-activate-profiles`, {
                            user_ids: pageUsers.map(u => u.id),
                            membership_type: '6month'
                          }, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          
                          const { activated, failed } = response.data;
                          alert(`✅ Quick Activation Complete!\n\nActivated: ${activated}\nFailed: ${failed}\nMembership: 6 Months`);
                          
                          setSelectedUsers(new Set());
                          setSelectAll(false);
                          fetchAllData();
                          fetchStats();
                        } catch (error) {
                          alert('❌ Activation failed: ' + (error.response?.data?.detail || error.message));
                        } finally {
                          setBulkActivating(false);
                        }
                      }}
                      disabled={bulkActivating || unpaidKoPartners.length === 0}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-lg transition ${
                        bulkActivating || unpaidKoPartners.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                      }`}
                    >
                      <CheckCircle size={22} />
                      {bulkActivating ? 'Activating...' : `⚡ Activate All 50 for 6 Months`}
                    </button>
                  </div>
                  
                  {/* Custom Selection Activate */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-green-700 font-medium">Or Custom Selection:</span>
                    <select
                      value={activationMembershipType}
                      onChange={(e) => setActivationMembershipType(e.target.value)}
                      className="border border-green-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="6month">6 Months (₹590) - Default</option>
                      <option value="1year">1 Year (₹1180)</option>
                      <option value="lifetime">Lifetime (₹2360)</option>
                    </select>
                    <button
                      onClick={handleBulkActivate}
                      disabled={bulkActivating || selectedUsers.size === 0}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                        bulkActivating || selectedUsers.size === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <CheckCircle size={18} />
                      {bulkActivating ? 'Activating...' : `Activate Selected (${selectedUsers.size})`}
                    </button>
                  </div>
                </div>

                {/* Email Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-indigo-700 font-medium">Send Emails:</span>
                  <button
                    onClick={handleSendSelectedEmails}
                    disabled={sendingSelectedEmails || selectedUsers.size === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                      sendingSelectedEmails || selectedUsers.size === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Mail size={18} />
                    {sendingSelectedEmails ? 'Sending...' : `Email Selected (${selectedUsers.size > 20 ? '20 max' : selectedUsers.size})`}
                  </button>
                  <button
                    onClick={handleAutoEmailBatch}
                    disabled={autoEmailRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                      autoEmailRunning
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    <RefreshCw size={18} className={autoEmailRunning ? 'animate-spin' : ''} />
                    {autoEmailRunning ? 'Running...' : 'Auto Batch (15)'}
                  </button>
                </div>
              </div>
            )}

            {/* Auto Email Scheduler Status */}
            {schedulerStatus && (
              <div className={`border rounded-xl p-4 mb-4 ${
                schedulerStatus.enabled 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${schedulerStatus.enabled ? 'bg-green-500' : 'bg-gray-400'}`}>
                      <RefreshCw size={20} className={`text-white ${schedulerStatus.running ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold ${schedulerStatus.enabled ? 'text-green-800' : 'text-gray-700'}`}>
                        🤖 Auto Email Scheduler
                      </h3>
                      <p className={`text-sm ${schedulerStatus.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                        {schedulerStatus.enabled ? '✅ ACTIVE - Runs every hour automatically' : '⏸️ PAUSED - Click to enable'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={runSchedulerNow}
                      disabled={schedulerStatus.running || !schedulerStatus.enabled}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                        schedulerStatus.running || !schedulerStatus.enabled
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {schedulerStatus.running ? '⏳ Running...' : '▶️ Run Now'}
                    </button>
                    <button
                      onClick={toggleScheduler}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                        schedulerStatus.enabled
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {schedulerStatus.enabled ? '⏸️ Pause' : '▶️ Enable'}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-600">{schedulerStatus.total_sent_today || 0}</p>
                    <p className="text-xs text-gray-600">Sent Today</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold text-gray-700">Last Run</p>
                    <p className="text-xs text-gray-500">
                      {schedulerStatus.last_run 
                        ? new Date(schedulerStatus.last_run).toLocaleTimeString() 
                        : 'Not yet'}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold text-gray-700">Next Run</p>
                    <p className="text-xs text-gray-500">
                      {schedulerStatus.next_run 
                        ? new Date(schedulerStatus.next_run).toLocaleTimeString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold text-gray-700">Last Result</p>
                    <p className={`text-xs ${
                      schedulerStatus.last_batch_result?.status === 'completed' ? 'text-green-600' :
                      schedulerStatus.last_batch_result?.status === 'error' ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {schedulerStatus.last_batch_result 
                        ? `${schedulerStatus.last_batch_result.status} (${schedulerStatus.last_batch_result.sent || 0} sent)`
                        : 'No runs yet'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Rotation Status */}
            {emailRotationStatus && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={20} className="text-amber-600" />
                    <h3 className="font-semibold text-amber-800">Email Rotation Progress</h3>
                  </div>
                  <button 
                    onClick={() => { fetchEmailRotationStatus(); fetchSchedulerStatus(); }}
                    className="text-amber-600 hover:text-amber-800 text-sm"
                  >
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-amber-600">{emailRotationStatus.daily_count}</p>
                    <p className="text-xs text-gray-600">Daily Sent</p>
                    <p className="text-xs text-amber-500">/ {emailRotationStatus.daily_limit} limit</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-orange-600">{emailRotationStatus.hourly_count || 0}</p>
                    <p className="text-xs text-gray-600">This Hour</p>
                    <p className="text-xs text-orange-500">/ {emailRotationStatus.hourly_limit} limit</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">{emailRotationStatus.emailed_in_rotation}</p>
                    <p className="text-xs text-gray-600">Emailed in Rotation</p>
                    <p className="text-xs text-green-500">/ {emailRotationStatus.total_unpaid} total</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-600">{emailRotationStatus.remaining_in_rotation}</p>
                    <p className="text-xs text-gray-600">Remaining</p>
                    <p className="text-xs text-blue-500">in this rotation</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Quota Status */}
            {emailQuota && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={20} className="text-purple-600" />
                    <h3 className="font-semibold text-purple-800">Daily Email Quota</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-purple-700">
                      <strong>{emailQuota.emails_sent_today}</strong> / {emailQuota.daily_limit} sent today
                    </span>
                    <span className={`px-3 py-1 rounded-full font-semibold ${
                      emailQuota.remaining_quota > 100 
                        ? 'bg-green-100 text-green-700' 
                        : emailQuota.remaining_quota > 0 
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {emailQuota.remaining_quota} remaining
                    </span>
                  </div>
                </div>
                <p className="text-purple-600 text-xs mt-2">
                  ⚠️ Gmail limit: ~500 emails/day. We use 450 with 2-sec delays to prevent blocking.
                </p>
              </div>
            )}

            {/* Bulk Email Result */}
            {bulkEmailResult && (
              <div className={`border rounded-xl p-4 mb-4 ${
                bulkEmailResult.failed > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
              }`}>
                <h3 className="font-semibold mb-2">📧 Last Bulk Email Result</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">{bulkEmailResult.sent}</p>
                    <p className="text-xs text-gray-600">Sent</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-red-600">{bulkEmailResult.failed}</p>
                    <p className="text-xs text-gray-600">Failed</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-600">{bulkEmailResult.skipped}</p>
                    <p className="text-xs text-gray-600">Skipped</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-purple-600">{bulkEmailResult.remaining_quota}</p>
                    <p className="text-xs text-gray-600">Quota Left</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Link Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={20} className="text-blue-600" />
                <h3 className="font-semibold text-blue-800">Payment Gateway</h3>
              </div>
              <p className="text-blue-700 text-sm">
                Payments are now processed via Cashfree Payment Gateway
              </p>
              <p className="text-blue-600 text-xs mt-1">Users will be redirected to Cashfree's secure checkout page</p>
            </div>

            {/* Auto-Activation System - Self-Healing for Paid but Inactive Users */}
            <div className={`border rounded-xl p-4 mb-4 ${
              autoActivationStatus?.enabled 
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300' 
                : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${autoActivationStatus?.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                    <CheckCircle size={20} className={`text-white ${autoActivationStatus?.running ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${autoActivationStatus?.enabled ? 'text-emerald-800' : 'text-gray-700'}`}>
                      🔄 Auto-Activation System (Self-Healing)
                    </h3>
                    <p className={`text-sm ${autoActivationStatus?.enabled ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {autoActivationStatus?.enabled 
                        ? `✅ ACTIVE - Runs ${autoActivationStatus?.interval || 'every 5 minutes'} automatically` 
                        : '⏸️ INACTIVE'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={runAutoActivationNow}
                    disabled={runningAutoActivation || autoActivationStatus?.running}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      runningAutoActivation || autoActivationStatus?.running
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                    data-testid="run-auto-activation-btn"
                  >
                    <RefreshCw size={16} className={runningAutoActivation || autoActivationStatus?.running ? 'animate-spin' : ''} />
                    {runningAutoActivation || autoActivationStatus?.running ? 'Running...' : '▶️ Run Now'}
                  </button>
                  <button
                    onClick={activateAllPaidMembers}
                    disabled={runningAutoActivation || (autoActivationStatus?.paid_but_inactive_count === 0)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      runningAutoActivation || (autoActivationStatus?.paid_but_inactive_count === 0)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                    }`}
                    data-testid="activate-all-paid-btn"
                  >
                    <CheckCircle size={16} />
                    Activate All Paid ({autoActivationStatus?.paid_but_inactive_count || 0})
                  </button>
                </div>
              </div>
              
              {/* Auto-Activation Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                <div className="bg-white/70 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-orange-600">{autoActivationStatus?.paid_but_inactive_count || 0}</p>
                  <p className="text-xs text-gray-600">Paid But Inactive</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{autoActivationStatus?.total_activated_today || 0}</p>
                  <p className="text-xs text-gray-600">Activated Today</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 text-center">
                  <p className="text-xs font-semibold text-gray-700">Last Run</p>
                  <p className="text-xs text-gray-500">
                    {autoActivationStatus?.last_run 
                      ? new Date(autoActivationStatus.last_run).toLocaleString() 
                      : 'Not yet'}
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 text-center">
                  <p className="text-xs font-semibold text-gray-700">Next Run</p>
                  <p className="text-xs text-gray-500">
                    {autoActivationStatus?.next_run 
                      ? new Date(autoActivationStatus.next_run).toLocaleString() 
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 text-center">
                  <p className="text-xs font-semibold text-gray-700">Last Result</p>
                  <p className={`text-xs ${
                    autoActivationStatus?.last_result?.activated > 0 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {autoActivationStatus?.last_result 
                      ? `${autoActivationStatus.last_result.activated || 0} activated` 
                      : 'No runs yet'}
                  </p>
                </div>
              </div>

              {/* Failed Activations Warning */}
              {autoActivationStatus?.failed_activations && autoActivationStatus.failed_activations.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-semibold">
                    ⚠️ {autoActivationStatus.failed_activations.length} activation(s) failed recently
                  </p>
                </div>
              )}

              {/* Paid but Inactive List Preview */}
              {paidButInactiveList.length > 0 && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-700 text-sm font-semibold mb-2">
                    📋 Paid But Inactive Members ({paidButInactiveList.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    {paidButInactiveList.slice(0, 5).map((member, idx) => (
                      <div key={idx} className="text-xs text-orange-600 py-1 border-b border-orange-100 last:border-0">
                        {member.name || 'N/A'} - {member.phone} - {member.cuddlist_status || 'N/A'}
                      </div>
                    ))}
                    {paidButInactiveList.length > 5 && (
                      <p className="text-xs text-orange-500 mt-1">
                        ... and {paidButInactiveList.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              <p className="text-emerald-600 text-xs mt-3">
                💡 This system automatically finds users who have paid for membership but whose profiles are not activated (due to payment callback issues) and activates them.
              </p>
            </div>

            {unpaidKoPartners.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                <p className="text-xl text-gray-600">All KoPartners have paid!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {unpaidKoPartners.map((kp) => (
                  <div 
                    key={kp.id} 
                    className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 transition ${
                      selectedUsers.has(kp.id) ? 'border-purple-500 bg-purple-50' : 'border-orange-500'
                    }`}
                  >
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Checkbox for selection */}
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(kp.id)}
                            onChange={() => toggleUserSelection(kp.id)}
                            className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <h3 className="text-xl font-bold">{kp.name || 'N/A'}</h3>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            Unpaid
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            kp.cuddlist_status === 'approved' ? 'bg-green-100 text-green-700' :
                            kp.cuddlist_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {kp.cuddlist_status || 'N/A'}
                          </span>
                          {kp.email && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              📧 Has Email
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{kp.bio || 'No bio provided'}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <span className="ml-2 font-semibold">{kp.phone}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Email:</span>
                            <span className={`ml-2 font-semibold ${kp.email ? 'text-green-600' : 'text-red-500'}`}>
                              {kp.email || '❌ N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <span className="ml-2 font-semibold">{kp.city || 'N/A'}, {kp.pincode || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Registered:</span>
                            <span className="ml-2 font-semibold">{kp.created_at ? new Date(kp.created_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center space-y-3">
                        <button
                          type="button"
                          onClick={() => handleActivateMembership(kp.id, kp.name)}
                          disabled={loading}
                          className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          <CheckCircle size={20} />
                          <span>Activate Membership</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReminder(kp.id, kp.name, kp.phone)}
                          disabled={sendingReminder === kp.id}
                          className="flex items-center justify-center space-x-2 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 transition"
                        >
                          <Send size={20} className={sendingReminder === kp.id ? 'animate-pulse' : ''} />
                          <span>{sendingReminder === kp.id ? 'Sending...' : 'Send Reminder'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditUser(kp)}
                          className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                        >
                          <Edit size={20} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => { setSelectedUser(kp); setShowUserModal(true); }}
                          className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          <Eye size={20} />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Bookings</h2>
              <button
                onClick={() => exportToExcel(allBookings, 'all_bookings')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Download size={18} />
                <span>Export All ({allBookings.length})</span>
              </button>
            </div>

            {/* Booking Stats Summary */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{allBookings.length}</p>
                <p className="text-gray-600 text-sm">Total Bookings</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{allBookings.filter(b => b.status === 'pending').length}</p>
                <p className="text-gray-600 text-sm">Pending</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{allBookings.filter(b => b.status === 'accepted').length}</p>
                <p className="text-gray-600 text-sm">Accepted</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{allBookings.filter(b => ['denied', 'rejected'].includes(b.status)).length}</p>
                <p className="text-gray-600 text-sm">Denied</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Booking ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">KoPartner</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Service</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rejection Reason</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm">{booking.id?.substring(0, 8)}...</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{booking.client_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{booking.client_phone || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{booking.kopartner_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{booking.kopartner_phone || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3">
                          {booking.selected_services?.map(s => s.name || s.service).join(', ') || booking.service || booking.service_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-600">
                          ₹{booking.amount || booking.service_amount || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {booking.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {booking.rejection_reason ? (
                            <span className="text-red-600">❌ {booking.rejection_reason}</span>
                          ) : booking.status === 'rejected' ? (
                            <span className="text-gray-400">No reason provided</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {allBookings.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No bookings found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payouts Tab - Completed Services */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Completed Services - KoPartner Payouts (80%)</h2>
              <button
                onClick={fetchCompletedBookings}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                <RefreshCw size={18} />
                <span>Refresh</span>
              </button>
            </div>

            {completedBookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                <p className="text-xl text-gray-600">No completed services pending payout</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Booking ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">KoPartner</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Service Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payout (80%)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">UPI ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {completedBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{booking.id?.slice(0, 8)}...</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{booking.client_name}</div>
                          <div className="text-sm text-gray-500">{booking.client_phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{booking.kopartner_name}</div>
                          <div className="text-sm text-gray-500">{booking.kopartner_phone}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">₹{booking.service_amount || 0}</td>
                        <td className="px-4 py-3 font-bold text-green-600">₹{(booking.payout_amount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{booking.kopartner_upi || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            booking.payout_status === 'paid' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {booking.payout_status === 'paid' ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {booking.payout_status !== 'paid' ? (
                            <button
                              onClick={() => handlePayPayout(booking.id, booking.payout_amount, booking.kopartner_name)}
                              disabled={processingPayout === booking.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 mx-auto"
                            >
                              {processingPayout === booking.id ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <DollarSign size={16} />
                              )}
                              <span>Pay 80%</span>
                            </button>
                          ) : (
                            <span className="text-green-600 font-semibold flex items-center justify-center">
                              <CheckCircle size={18} className="mr-1" /> Paid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">Complete User Details</h2>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-bold mb-3 text-purple-600">Basic Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">User ID</label>
                    <p className="font-mono text-xs bg-white p-2 rounded">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="font-semibold">{selectedUser.name || 'Not Provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-semibold">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-semibold">{selectedUser.email || 'Not Provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Role</label>
                    <p className="font-semibold">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedUser.role === 'cuddlist' ? 'bg-purple-100 text-purple-700' :
                        selectedUser.role === 'both' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {selectedUser.role === 'cuddlist' ? 'KoPartner' : selectedUser.role === 'both' ? 'Both' : 'Client'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Registered On</label>
                    <p className="font-semibold">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-lg font-bold mb-3 text-blue-600">Location Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">City</label>
                    <p className="font-semibold">{selectedUser.city || 'Not Provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Pincode</label>
                    <p className="font-semibold">{selectedUser.pincode || 'Not Provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Online Status</label>
                    <p className="font-semibold">
                      {selectedUser.is_online ? (
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Online
                        </span>
                      ) : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-yellow-50 rounded-xl p-4">
                <h3 className="text-lg font-bold mb-3 text-yellow-600">Account Status</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Account Active</label>
                    <p className={`font-semibold ${selectedUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.is_active ? '✓ Active' : '✗ Inactive'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Password Set</label>
                    <p className={`font-semibold ${selectedUser.password_set ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedUser.password_set ? '✓ Yes' : '✗ No'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Profile Activated</label>
                    <p className={`font-semibold ${selectedUser.profile_activated ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.profile_activated ? '✓ Yes' : '✗ No'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Profile Completed</label>
                    <p className={`font-semibold ${selectedUser.profile_completed ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedUser.profile_completed ? '✓ Yes' : '✗ No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* KoPartner Specific Info */}
              {(selectedUser.role === 'cuddlist' || selectedUser.role === 'both') && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold mb-3 text-purple-600">KoPartner Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">KoPartner Status</label>
                      <p className="font-semibold">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          selectedUser.cuddlist_status === 'approved' ? 'bg-green-100 text-green-700' :
                          selectedUser.cuddlist_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedUser.cuddlist_status || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Membership Paid</label>
                      <p className={`font-semibold ${selectedUser.membership_paid ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.membership_paid ? '✓ Paid' : '✗ Not Paid'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Membership Type</label>
                      <p className="font-semibold">{selectedUser.membership_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Membership Expiry</label>
                      <p className="font-semibold">
                        {selectedUser.membership_expiry ? new Date(selectedUser.membership_expiry).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">UPI ID</label>
                      <p className="font-semibold">{selectedUser.upi_id || 'Not Provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Services Count</label>
                      <p className="font-semibold">{selectedUser.services?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Earnings & Rating */}
              {(selectedUser.role === 'cuddlist' || selectedUser.role === 'both') && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold mb-3 text-green-600">Earnings & Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Total Earnings</label>
                      <p className="text-2xl font-bold text-green-600">₹{selectedUser.earnings?.toFixed(0) || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Rating</label>
                      <p className="font-semibold">⭐ {selectedUser.rating?.toFixed(1) || '0.0'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Total Reviews</label>
                      <p className="font-semibold">{selectedUser.total_reviews || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Specific Info */}
              {(selectedUser.role === 'client' || selectedUser.role === 'both') && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold mb-3 text-blue-600">Client Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Service Payment Done</label>
                      <p className={`font-semibold ${selectedUser.service_payment_done ? 'text-green-600' : 'text-yellow-600'}`}>
                        {selectedUser.service_payment_done ? '✓ Yes' : '✗ No'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Can Search KoPartners</label>
                      <p className={`font-semibold ${selectedUser.can_search ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.can_search ? '✓ Yes' : '✗ No'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">KoPartners Selected</label>
                      <p className="font-semibold">{selectedUser.selected_kopartners_count || 0} / 2</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Payment Date</label>
                      <p className="font-semibold">
                        {selectedUser.service_payment_date ? new Date(selectedUser.service_payment_date).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Payment Expiry</label>
                      <p className={`font-semibold ${selectedUser.service_payment_expiry && new Date(selectedUser.service_payment_expiry) > new Date() ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.service_payment_expiry ? new Date(selectedUser.service_payment_expiry).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* KoPartner Selections - Show which KoPartners this client selected */}
              {(selectedUser.role === 'client' || selectedUser.role === 'both') && selectedUser.kopartner_selections && selectedUser.kopartner_selections.length > 0 && (
                <div className="bg-indigo-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold mb-3 text-indigo-600">KoPartner Selections ({selectedUser.kopartner_selections.length})</h3>
                  <div className="space-y-3">
                    {selectedUser.kopartner_selections.map((selection, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                        selection.status === 'accepted' ? 'bg-green-50 border-green-500' :
                        selection.status === 'rejected' ? 'bg-red-50 border-red-500' :
                        'bg-yellow-50 border-yellow-500'
                      }`}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">KoPartner Name</label>
                            <p className="font-semibold">{selection.kopartner_name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Phone</label>
                            <p className="font-semibold">{selection.kopartner_phone || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Status</label>
                            <p className={`font-semibold ${
                              selection.status === 'accepted' ? 'text-green-600' :
                              selection.status === 'rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {selection.status === 'accepted' ? '✓ Accepted' :
                               selection.status === 'rejected' ? '✗ Rejected' :
                               '⏳ Pending'}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Selected On</label>
                            <p className="font-semibold text-sm">
                              {selection.selected_at ? new Date(selection.selected_at).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {selection.status === 'rejected' && selection.rejection_reason && (
                          <div className="mt-3 pt-3 border-t border-red-200">
                            <label className="text-xs text-gray-500">Rejection Reason</label>
                            <p className="font-semibold text-red-600">❌ {selection.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="text-sm text-gray-500">Bio</label>
                <p className="bg-gray-50 p-3 rounded-lg">{selectedUser.bio || 'No bio provided'}</p>
              </div>

              {/* Hobbies */}
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

              {/* Services */}
              {selectedUser.services && selectedUser.services.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Services Offered</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedUser.services.map((service, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-semibold">{service.name || service.service}</span>
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">Edit User: {editingUser.name || editingUser.phone}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={editFormData.pincode}
                    onChange={(e) => setEditFormData({...editFormData, pincode: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={editFormData.upi_id}
                    onChange={(e) => setEditFormData({...editFormData, upi_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {(editingUser.role === 'cuddlist' || editingUser.role === 'both') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KoPartner Status</label>
                    <select
                      value={editFormData.cuddlist_status}
                      onChange={(e) => setEditFormData({...editFormData, cuddlist_status: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-4 pt-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editFormData.profile_activated}
                        onChange={(e) => setEditFormData({...editFormData, profile_activated: e.target.checked})}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm">Profile Activated</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editFormData.membership_paid}
                        onChange={(e) => setEditFormData({...editFormData, membership_paid: e.target.checked})}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm">Membership Paid</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editFormData.is_active}
                    onChange={(e) => setEditFormData({...editFormData, is_active: e.target.checked})}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium">User Active</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KoPartner Details Modal with Bookings */}
      {showKoPartnerDetails && selectedKoPartner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedKoPartner.name || 'KoPartner'}</h2>
                  <p className="text-white/80">{selectedKoPartner.phone} • {selectedKoPartner.city || 'N/A'}</p>
                </div>
                <button
                  onClick={() => setShowKoPartnerDetails(false)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* Basic Info */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b pb-2">📋 Basic Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="font-semibold">{selectedKoPartner.name || 'Not Set'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-semibold">{selectedKoPartner.phone}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold">{selectedKoPartner.email || 'Not Set'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">City</p>
                    <p className="font-semibold">{selectedKoPartner.city || 'Not Set'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Pincode</p>
                    <p className="font-semibold">{selectedKoPartner.pincode || 'Not Set'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">UPI ID</p>
                    <p className="font-semibold">{selectedKoPartner.upi_id || 'Not Set'}</p>
                  </div>
                </div>
              </div>

              {/* Status Info */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b pb-2">📊 Status & Membership</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${selectedKoPartner.profile_activated ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-500">Profile Status</p>
                    <p className={`font-semibold ${selectedKoPartner.profile_activated ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedKoPartner.profile_activated ? '✅ Active' : '❌ Inactive'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${selectedKoPartner.membership_paid ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <p className="text-xs text-gray-500">Membership</p>
                    <p className={`font-semibold ${selectedKoPartner.membership_paid ? 'text-green-600' : 'text-orange-600'}`}>
                      {selectedKoPartner.membership_paid ? '✅ Paid' : '❌ Unpaid'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Membership Type</p>
                    <p className="font-semibold">{selectedKoPartner.membership_type || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Expiry</p>
                    <p className="font-semibold">
                      {selectedKoPartner.membership_expiry 
                        ? new Date(selectedKoPartner.membership_expiry).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Approval Status</p>
                    <p className={`font-semibold ${
                      selectedKoPartner.cuddlist_status === 'approved' ? 'text-green-600' :
                      selectedKoPartner.cuddlist_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedKoPartner.cuddlist_status || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Total Earnings</p>
                    <p className="font-semibold text-purple-600">₹{selectedKoPartner.earnings || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="font-semibold">⭐ {selectedKoPartner.rating?.toFixed(1) || '0.0'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Reviews</p>
                    <p className="font-semibold">{selectedKoPartner.total_reviews || 0}</p>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b pb-2">🛠️ Services Offered</h3>
                {selectedKoPartner.services && selectedKoPartner.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedKoPartner.services.map((service, idx) => (
                      <span key={idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {service.name || service} - ₹{service.rate || 0}/hr
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No services configured</p>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b pb-2">📝 Bio</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedKoPartner.bio || 'No bio provided'}
                </p>
              </div>

              {/* Bookings */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b pb-2">📅 Bookings ({kopartnerBookings.length})</h3>
                {kopartnerBookings.length > 0 ? (
                  <div className="space-y-3">
                    {kopartnerBookings.map((booking) => (
                      <div key={booking.id} className={`p-4 rounded-lg border-l-4 ${
                        booking.status === 'accepted' ? 'bg-green-50 border-green-500' :
                        booking.status === 'pending' ? 'bg-yellow-50 border-yellow-500' :
                        booking.status === 'completed' ? 'bg-blue-50 border-blue-500' :
                        'bg-red-50 border-red-500'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              Client: {booking.client_name || booking.client?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Phone: {booking.client_phone || booking.client?.phone || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.selected_services?.map(s => s.name || s.service).join(', ') || 'General'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              booking.status === 'accepted' ? 'bg-green-200 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                              booking.status === 'completed' ? 'bg-blue-200 text-blue-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {booking.status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-4 rounded-lg text-center">No bookings yet</p>
                )}
              </div>

              {/* Registration Info */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b pb-2">📆 Registration Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Registered On</p>
                    <p className="font-semibold">
                      {selectedKoPartner.created_at 
                        ? new Date(selectedKoPartner.created_at).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Last Online</p>
                    <p className="font-semibold">
                      {selectedKoPartner.last_online 
                        ? new Date(selectedKoPartner.last_online).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex justify-between bg-gray-50">
              <div className="flex gap-2">
                {!selectedKoPartner.membership_paid && (
                  <button
                    onClick={() => handleSendReminder(selectedKoPartner.id, selectedKoPartner.name, selectedKoPartner.phone)}
                    disabled={sendingReminder === selectedKoPartner.id}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send size={16} />
                    Send Payment Reminder
                  </button>
                )}
                {!selectedKoPartner.membership_paid && (
                  <button
                    onClick={() => handleActivateMembership(selectedKoPartner.id, selectedKoPartner.name)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Activate Membership
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowKoPartnerDetails(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock size={24} />
                Change Admin Password
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="border-t p-4 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordChanging || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {passwordChanging ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Change Password
                  </>
                )}
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
