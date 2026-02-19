import React from 'react';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

const BookingCard = ({ booking, onAccept, onReject, isKoPartner = false }) => {
  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      accepted: { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-700', label: 'Accepted' },
      rejected: { icon: XCircle, bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
      completed: { icon: CheckCircle, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
      cancelled: { icon: AlertTriangle, bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            {isKoPartner ? booking.client_name : booking.kopartner_name}
          </h3>
          <p className="text-sm text-gray-500">
            Booking ID: {booking.id?.slice(0, 8)}
          </p>
        </div>
        {getStatusBadge(booking.status)}
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Date:</span>
          <span className="font-medium">{formatDate(booking.preferred_date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Time:</span>
          <span className="font-medium">{booking.preferred_time || 'Flexible'}</span>
        </div>
        {booking.service_amount && (
          <div className="flex justify-between">
            <span className="text-gray-500">Amount:</span>
            <span className="font-medium text-green-600">₹{booking.service_amount}</span>
          </div>
        )}
      </div>

      {/* Services */}
      {booking.selected_services && booking.selected_services.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Services:</p>
          <div className="flex flex-wrap gap-1">
            {booking.selected_services.map((service, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">
                {service.name || service.service}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Notes:</p>
          <p className="text-sm text-gray-700">{booking.notes}</p>
        </div>
      )}

      {/* Actions for KoPartner on pending bookings */}
      {isKoPartner && booking.status === 'pending' && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onAccept(booking.id)}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            Accept
          </button>
          <button
            onClick={() => onReject(booking.id)}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            Reject
          </button>
        </div>
      )}

      {/* Contact info for accepted bookings */}
      {booking.status === 'accepted' && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-600 font-medium mb-1">Contact Details</p>
          <p className="text-sm text-gray-700">
            Phone: {isKoPartner ? booking.client_phone : booking.kopartner_phone}
          </p>
        </div>
      )}

      {/* Rejection reason */}
      {booking.status === 'rejected' && booking.rejection_reason && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason</p>
          <p className="text-sm text-gray-700">{booking.rejection_reason}</p>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
