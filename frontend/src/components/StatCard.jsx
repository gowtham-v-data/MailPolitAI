import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, iconColor = 'indigo', trend, trendLabel, onClick }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  const isPositive = trend > 0;
  const trendColor = isPositive ? 'text-emerald-600' : 'text-red-500';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-card-hover ${
        onClick ? 'cursor-pointer hover:border-slate-200' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[iconColor] || colorMap.indigo}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <p className="text-sm text-slate-500">{title}</p>
      {trendLabel && (
        <p className="text-xs text-slate-400 mt-1">{trendLabel}</p>
      )}
    </div>
  );
}
