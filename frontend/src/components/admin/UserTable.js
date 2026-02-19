import React from 'react';
import { Eye, Edit, Trash2, UserCheck, UserX, Send, CheckCircle, XCircle } from 'lucide-react';

const UserTable = ({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  selectAll,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onSendReminder,
  sendingReminder,
  showCheckboxes = false,
  showActions = true,
  loading = false
}) => {
  const getRoleBadge = (role) => {
    const badges = {
      client: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Client' },
      cuddlist: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'KoPartner' },
      both: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Both' },
      admin: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Admin' }
    };
    const badge = badges[role] || badges.client;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (user) => {
    if (user.role === 'client') {
      return user.service_payment_done ? (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
      ) : (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Free</span>
      );
    }
    
    if (user.membership_paid) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Unpaid</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          No users found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {showCheckboxes && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              {showActions && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                {showCheckboxes && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => onSelectUser(user.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.profile_photo ? (
                      <img src={user.profile_photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                        {(user.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{user.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{user.phone}</td>
                <td className="px-4 py-3 text-gray-600 text-sm">{user.email || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{user.city || '-'}</td>
                <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                <td className="px-4 py-3">{getStatusBadge(user)}</td>
                <td className="px-4 py-3">
                  {user.is_active ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewUser(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEditUser(user)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onToggleStatus(user.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.is_active 
                            ? 'text-orange-600 hover:bg-orange-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      {onSendReminder && !user.membership_paid && user.role !== 'client' && (
                        <button
                          onClick={() => onSendReminder(user.id)}
                          disabled={sendingReminder === user.id}
                          className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Send Payment Reminder"
                        >
                          {sendingReminder === user.id ? (
                            <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
