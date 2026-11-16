import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import * as api from '../api';
import StatCard from '../components/StatCard';
import EmailCard from '../components/EmailCard';
import ClassificationBadge from '../components/ClassificationBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { CLASSIFICATION_CONFIG } from '../utils/constants';
import { formatMeetingDate } from '../utils/helpers';
import {
  BarChart3, Mail, Bot, User, Clock, Star, Calendar,
  Lightbulb, AlertTriangle, TrendingUp, ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedClient, emailCounts } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedClient]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const clientId = (selectedClient?._id && selectedClient?._id !== 'all') ? selectedClient._id : null;
      const [statsRes, recentRes, meetingsRes] = await Promise.all([
        clientId ? api.getDashboardStats(clientId).catch(() => ({ data: {} })) : api.getDashboardStats().catch(() => ({ data: {} })),
        clientId
          ? api.getRecentEmails(clientId).catch(() => ({ data: { emails: [] } }))
          : api.getEmails({ limit: 8 }).catch(() => ({ data: { emails: [] } })),
        api.getMeetings({ status: 'upcoming', ...(clientId ? { clientId } : {}) }).catch(() => ({ data: { meetings: [] } }))
      ]);
      setStats(statsRes.data);
      setRecentEmails(statsRes.data?.emails || recentRes.data?.emails || recentRes.data || []);
      setMeetings(meetingsRes.data?.meetings || meetingsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const chartData = stats ? [
    { name: 'Assistant', value: stats.assistantToReply || emailCounts.assistantToReply || 0, color: CLASSIFICATION_CONFIG.ASSISTANT_TO_REPLY.hex },
    { name: 'Client', value: stats.clientToReply || emailCounts.clientToReply || 0, color: CLASSIFICATION_CONFIG.CLIENT_TO_REPLY.hex },
    { name: 'No Reply', value: stats.noReplyNeeded || emailCounts.noReplyNeeded || 0, color: CLASSIFICATION_CONFIG.NO_REPLY_NEEDED.hex },
    { name: 'Review', value: stats.needsReview || emailCounts.needsReview || 0, color: CLASSIFICATION_CONFIG.NEEDS_REVIEW.hex },
  ] : [];

  const insights = [
    { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', text: `${emailCounts.clientToReply || 0} emails need client approval`, link: '/emails/CLIENT_TO_REPLY' },
    { icon: Bot, color: 'text-indigo-600 bg-indigo-50', text: `${emailCounts.assistantToReply || 0} emails for you to handle`, link: '/emails/ASSISTANT_TO_REPLY' },
    { icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', text: `${emailCounts.total || 0} total emails managed`, link: '/emails' },
    { icon: Lightbulb, color: 'text-violet-600 bg-violet-50', text: 'AI classification running smoothly', link: '/ai-assistant' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening with {selectedClient?.name || 'your client'}'s emails</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Emails" value={stats?.totalEmails ?? emailCounts.total ?? 0} icon={BarChart3} iconColor="bg-indigo-100 text-indigo-600" onClick={() => navigate('/emails')} />
        <StatCard title="Unread" value={stats?.unreadEmails ?? emailCounts.unread ?? 0} icon={Mail} iconColor="bg-blue-100 text-blue-600" onClick={() => navigate('/emails?isUnread=true')} />
        <StatCard title="Assistant" value={stats?.assistantToReply ?? emailCounts.assistantToReply ?? 0} icon={Bot} iconColor="bg-indigo-100 text-indigo-600" onClick={() => navigate('/emails/ASSISTANT_TO_REPLY')} />
        <StatCard title="Client" value={stats?.clientToReply ?? emailCounts.clientToReply ?? 0} icon={User} iconColor="bg-amber-100 text-amber-600" onClick={() => navigate('/emails/CLIENT_TO_REPLY')} />
        <StatCard title="Waiting" value={stats?.waitingForResponse ?? 0} icon={Clock} iconColor="bg-slate-100 text-slate-600" />
        <StatCard title="Important" value={stats?.importantEmails ?? emailCounts.important ?? 0} icon={Star} iconColor="bg-red-100 text-red-600" onClick={() => navigate('/emails?isImportant=true')} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Recent Conversations */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Conversations</h2>
            <Link to="/emails" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentEmails.slice(0, 8).map((email) => (
              <EmailCard key={email._id} email={{
                ...email,
                from: email.sender,
                isRead: !email.isUnread,
                date: email.createdAt,
                priority: email.classification?.priority,
                classification: email.classification?.type
              }} compact />
            ))}
            {recentEmails.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No recent conversations</div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Email Distribution</h3>
            {chartData.some(d => d.value > 0) ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {chartData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                      <span className="font-semibold text-slate-900 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            )}
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Upcoming Meetings</h3>
              <Link to="/meetings" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
            </div>
            <div className="space-y-3">
              {meetings.slice(0, 4).map((m) => (
                <div key={m._id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{m.title}</p>
                    <p className="text-xs text-slate-500">{formatMeetingDate(m.date)} · {m.time || ''} · {m.location || ''}</p>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No upcoming meetings</p>}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">AI Insights</h3>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <Link key={i} to={insight.link} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.color}`}>
                    <insight.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-slate-600 group-hover:text-slate-900">{insight.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
