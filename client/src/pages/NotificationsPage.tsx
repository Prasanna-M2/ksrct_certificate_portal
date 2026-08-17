import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { Bell, CheckCheck, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-ksrct-orange" />
            <span>Notifications</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            System updates, certificate verification status alerts, and announcements
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-ksrct-navy bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <CheckCheck className="w-4 h-4 text-ksrct-orange" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            You have no notifications at this time.
          </div>
        ) : (
          notifications.map((n) => {
            let Icon = Info;
            let iconBg = 'bg-blue-50 text-blue-600';

            if (n.type === 'SUCCESS') {
              Icon = CheckCircle2;
              iconBg = 'bg-emerald-50 text-emerald-600';
            } else if (n.type === 'WARNING') {
              Icon = AlertTriangle;
              iconBg = 'bg-amber-50 text-amber-600';
            } else if (n.type === 'ERROR') {
              Icon = AlertCircle;
              iconBg = 'bg-rose-50 text-rose-600';
            }

            return (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                  !n.isRead ? 'bg-amber-50/30' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                    <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                </div>

                {!n.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-ksrct-orange flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
