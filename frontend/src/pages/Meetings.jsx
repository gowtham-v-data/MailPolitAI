import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatMeetingDate, stringToColor, getInitials } from '../utils/helpers';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

export default function Meetings() {
  const { selectedClient } = useApp();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedClient?._id) fetchMeetings();
  }, [selectedClient]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.getMeetings({ clientId: selectedClient._id });
      setMeetings(res.data.meetings || res.data || []);
    } catch { setMeetings([]); }
    setLoading(false);
  };

  if (loading) return <div className="p-6"><LoadingSpinner /></div>;

  const statusColors = {
    upcoming: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-slate-100 text-slate-500',
    cancelled: 'bg-red-50 text-red-600',
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Meetings & Appointments</h1>
        <p className="text-sm text-slate-500 mt-0.5">{meetings.length} scheduled meeting{meetings.length !== 1 ? 's' : ''}</p>
      </div>

      {meetings.length === 0 ? (
        <EmptyState icon={Calendar} title="No meetings scheduled" description="Meeting information extracted from emails will appear here" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((m) => (
            <div key={m._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{m.title}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[m.status] || statusColors.upcoming}`}>
                  {m.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatMeetingDate(m.date)}</span>
                  {m.time && <span className="text-slate-400">· {m.time}</span>}
                  {m.duration && <span className="text-slate-400">· {m.duration} min</span>}
                </div>
                {m.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{m.location}</span>
                  </div>
                )}
                {m.participants?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <div className="flex -space-x-2">
                      {m.participants.slice(0, 4).map((p, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-semibold"
                          style={{ backgroundColor: stringToColor(p.name) }} title={p.name}>
                          {getInitials(p.name)}
                        </div>
                      ))}
                      {m.participants.length > 4 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-semibold">
                          +{m.participants.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs">{m.participants.length} participant{m.participants.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              {m.notes && (
                <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-50">{m.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
