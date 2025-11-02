import React, { useMemo } from 'react';
import { AnalysisResult, RiskLevel, View, AnalysisType } from '../types';
import { HeartPulseIcon, ChartBarIcon, ClipboardListIcon, AlertTriangleIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from './icons/Icons';

interface DashboardProps {
  history: AnalysisResult[];
  onNavigate: (view: View) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend?: React.ReactNode }> = ({ title, value, icon, trend }) => (
  <div className="bg-light-navy rounded-xl shadow-md p-6 flex items-center justify-between animate-slide-in-up">
    <div>
      <div className="flex items-center text-secondary mb-2">
        {icon}
        <h3 className="text-md font-semibold text-light-slate ml-2">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-slate-200">{value}</p>
    </div>
    {trend && <div className="ml-4">{trend}</div>}
  </div>
);

const HealthScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
    let colorClass = 'text-green-400';
    if (score < 75) colorClass = 'text-yellow-400';
    if (score < 50) colorClass = 'text-red-500';

    return (
        <div className="text-center bg-light-navy rounded-xl shadow-lg p-6 flex flex-col items-center justify-center animate-slide-in-up">
            <h3 className="text-lg font-semibold text-lightest-slate mb-4">Overall Health Score</h3>
            <div className={`relative w-40 h-40`}>
                 <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-lightest-navy"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="2" />
                    <path className={colorClass}
                        strokeDasharray={`${score}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-bold ${colorClass}`}>{score}</span>
                </div>
            </div>
            <p className="text-sm text-slate mt-4">Based on all historical analyses.</p>
        </div>
    );
};

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
    const config = {
        [RiskLevel.LOW]: 'bg-green-500/10 text-green-400',
        [RiskLevel.MEDIUM]: 'bg-yellow-500/10 text-yellow-400',
        [RiskLevel.HIGH]: 'bg-orange-500/10 text-orange-400',
        [RiskLevel.CRITICAL]: 'bg-red-500/10 text-red-400',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config[level]}`}>
            {level} Risk
        </span>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ history, onNavigate }) => {
  const analytics = useMemo(() => {
    if (history.length === 0) return null;

    const overallHealthScore = Math.round(history.reduce((acc, r) => acc + r.safetyScore, 0) / history.length);
    
    let healthTrend: 'Improving' | 'Stable' | 'Needs Attention' = 'Stable';
    let trendIcon = <MinusIcon className="h-8 w-8 text-slate" />;
    if (history.length >= 2) {
      const latestScore = history[0].safetyScore;
      const previousScore = history[1].safetyScore;
      if (latestScore > previousScore + 2) {
        healthTrend = 'Improving';
        trendIcon = <TrendingUpIcon className="h-8 w-8 text-green-500" />;
      } else if (latestScore < previousScore - 2) {
        healthTrend = 'Needs Attention';
        trendIcon = <TrendingDownIcon className="h-8 w-8 text-red-500" />;
      }
    }

    const totalReports = history.length;
    const criticalAlerts = history.filter(r => r.riskLevel === RiskLevel.CRITICAL).length;
    
    const medicationSet = new Set<string>();
    history.forEach(r => {
        if (r.type === AnalysisType.PRESCRIPTION && r.medications) {
            r.medications.forEach(med => medicationSet.add(med.name));
        }
    });
    const uniqueMedications = medicationSet.size;
    
    return { overallHealthScore, healthTrend, trendIcon, totalReports, criticalAlerts, uniqueMedications };
  }, [history]);

  if (!analytics) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <h2 className="text-3xl font-bold text-slate-200">Health Dashboard</h2>
        <div className="mt-8 text-center py-16 bg-light-navy rounded-lg">
            <p className="text-light-slate">No reports found to generate analytics.</p>
            <p className="text-sm text-slate mt-2">Upload a document to build your health report.</p>
            <button 
                onClick={() => onNavigate('upload')}
                className="mt-6 bg-primary hover:bg-primary-dark text-black font-bold py-2 px-6 rounded-lg transition-all duration-300"
            >
                Upload Now
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
        <h2 className="text-3xl font-bold text-slate-200 mb-6">Health Analytics Dashboard</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                 <HealthScoreIndicator score={analytics.overallHealthScore} />
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard 
                    title="Health Trend" 
                    value={analytics.healthTrend} 
                    icon={<ChartBarIcon className="h-6 w-6"/>}
                    trend={analytics.trendIcon}
                />
                <StatCard 
                    title="Total Reports" 
                    value={analytics.totalReports} 
                    icon={<ClipboardListIcon className="h-6 w-6"/>}
                />
                <StatCard 
                    title="Unique Medications" 
                    value={analytics.uniqueMedications} 
                    icon={<ClipboardListIcon className="h-6 w-6"/>}
                />
                <StatCard 
                    title="Critical Alerts" 
                    value={analytics.criticalAlerts} 
                    icon={<AlertTriangleIcon className="h-6 w-6"/>}
                />
            </div>
        </div>

        <div className="mt-10">
            <h3 className="text-2xl font-bold text-slate-200 mb-4">Recent Activity</h3>
            <div className="bg-light-navy rounded-xl shadow-lg">
                <ul className="divide-y divide-lightest-navy">
                    {history.slice(0, 3).map(report => (
                         <li key={report.id} className="p-4 sm:p-6">
                            <div className="flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <p className="font-semibold text-lightest-slate">{report.uploadedFile.name}</p>
                                    <p className="text-sm text-slate mt-1">
                                        Type: <span className="font-medium capitalize">{report.type}</span> | Analyzed on: {new Date(report.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <RiskBadge level={report.riskLevel} />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;