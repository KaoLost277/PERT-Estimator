'use client';

import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { CalculatedTask } from '@/lib/logic';
import { useProjects } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { generateNormalDistributionData } from '@/lib/calculations';

interface AnalyticsDashboardProps {
  tasks: CalculatedTask[];
  stats: {
    expectedDuration: number;
    projectSD: number;
  };
}

export default function AnalyticsDashboard({ tasks, stats }: AnalyticsDashboardProps) {
  const { language } = useProjects();
  const t = translations[language].analytics;
  const { expectedDuration: mean, projectSD: sd } = stats;

  // Filter tasks to only leaf tasks (those without subTasks) for charts
  const leafTasks = useMemo(() => {
    return tasks.filter(task => !task.isGroup);
  }, [tasks]);

  // 1. Generate Normal Distribution Data
  const curveData = useMemo(() => {
    return generateNormalDistributionData(mean, sd, 50);
  }, [mean, sd]);

  // 2. Task Composition Data
  const compositionData = useMemo(() => {
    const criticalCount = leafTasks.filter(t => t.isCritical).length;
    const normalCount = leafTasks.length - criticalCount;
    
    return [
      { name: t.critical, value: criticalCount, color: '#f43f5e' }, // rose-500
      { name: t.normal, value: normalCount, color: '#3b82f6' },   // blue-500
    ];
  }, [leafTasks, t]);

  const riskData = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    
    const checkIsDelayedRaw = (t: CalculatedTask) => {
      if (t.status === 'DONE') return false;
      const startDate = t.plannedStartDate ? new Date(t.plannedStartDate).toLocaleDateString('en-CA') : null;
      const endDate = t.plannedEndDate ? new Date(t.plannedEndDate).toLocaleDateString('en-CA') : null;
      if (!startDate && !endDate) return false;
      
      const hasLateStart = t.status === 'TODO' && startDate && startDate < today;
      const hasLateFinish = endDate && endDate < today;
      return hasLateStart || hasLateFinish;
    };

    const isTaskEffectivelyDelayed = (t: CalculatedTask) => {
      if (t.status === 'DONE') return false;
      if (checkIsDelayedRaw(t)) return true;
      const displayIdParts = t.displayId.split('.');
      for (let i = 1; i < displayIdParts.length; i++) {
        const parentId = displayIdParts.slice(0, i).join('.');
        const parent = tasks.find(p => p.displayId === parentId);
        if (parent && checkIsDelayedRaw(parent)) return true;
      }
      return false;
    };

    const leafTasks = tasks.filter(t => !t.isGroup);
    const delayedCount = leafTasks.filter(t => isTaskEffectivelyDelayed(t)).length;
    const onTrackCount = leafTasks.length - delayedCount;

    return [
      { name: t.delayed || 'Delayed', value: delayedCount, color: '#f59e0b' },
      { name: t.onTrack || 'On Track', value: onTrackCount, color: '#10b981' },
    ];
  }, [tasks, t]);

  const statusData = useMemo(() => {
    const todo = leafTasks.filter(t => t.status === 'TODO').length;
    const inProgress = leafTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const done = leafTasks.filter(t => t.status === 'DONE').length;

    return [
      { name: t.todo, value: todo, color: '#94a3b8' },        // slate-400
      { name: t.inProgress, value: inProgress, color: '#3b82f6' }, // blue-500
      { name: t.done, value: done, color: '#10b981' },        // emerald-500
    ];
  }, [leafTasks, t]);

  // 3. Overall Progress Calculation (Based on task completion count)
  const progressData = useMemo(() => {
    const totalTasks = leafTasks.length;
    const doneTasks = leafTasks.filter(t => t.status === 'DONE').length;
    
    const percentage = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
    
    return [
      {
        name: 'Progress',
        value: percentage,
        fill: 'var(--primary)',
      }
    ];
  }, [leafTasks]);

  const progressPercent = Math.round(progressData[0].value);
  const progressCapped = Math.min(progressPercent, 100); // Cap visuals at 100%
  const isOverBudget = progressPercent > 100;

  if (tasks.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overall Progress Card */}
      <div className="border border-border/40 rounded-3xl p-6 md:p-8 bg-gradient-card flex flex-col items-center justify-center relative overflow-hidden">
        <h3 className="text-lg font-bold mb-2 self-start flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {t.overallProgress}
        </h3>
        
        <div className="relative w-full aspect-square max-w-[200px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { value: progressCapped, fill: 'var(--primary)' },
                  { value: 100 - progressCapped, fill: 'var(--surface)' }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                startAngle={90}
                endAngle={450}
                dataKey="value"
                stroke="none"
              >
                <Cell key="cell-0" fill={isOverBudget ? '#f43f5e' : 'var(--primary)'} />
                <Cell key="cell-1" fill="rgba(16,185,129,0.05)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-4xl font-bold tracking-tight ${isOverBudget ? 'text-rose-500' : ''}`}>{progressPercent}%</span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{t.finished}</span>
          </div>
        </div>

        <div className="w-full mt-6 space-y-3">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="text-muted">{t.finished}</span>
            <span className={isOverBudget ? 'text-rose-500' : 'text-primary'}>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-surface rounded-full overflow-hidden p-0.5 border border-border/20">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-rose-500' : 'bg-primary'}`}
              style={{ width: `${progressCapped}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="text-muted">{t.remaining}</span>
            <span className={`${isOverBudget ? 'text-rose-500' : 'text-foreground/60'}`}>{100 - progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Risk Profile Card */}
      <div className="border border-border/40 rounded-3xl p-6 md:p-8 bg-gradient-card flex flex-col">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {t.riskProfile}
        </h3>
        <div className="h-[200px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curveData}>
              <defs>
                <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="x" 
                type="number" 
                domain={['dataMin', 'dataMax']} 
                tick={{fontSize: 10, fill: 'var(--muted)'}}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                labelFormatter={(val) => `${t.duration}: ${val} ${language === 'th' ? 'ชม.' : 'h'}`}
                formatter={(val: unknown) => [Number(val).toFixed(4), t.probabilityDensity] as [string, string]}
              />
              <Area 
                type="monotone" 
                dataKey="y" 
                stroke="var(--primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorY)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-between text-[10px] font-bold text-muted uppercase tracking-wider">
           <span>{language === 'th' ? 'มองโลกในแง่ดี' : 'Optimistic'} ←</span>
           <span>→ {language === 'th' ? 'มองโลกในแง่ร้าย' : 'Pessimistic'}</span>
        </div>
      </div>

      {/* Task Composition Card */}
      <div className="border border-border/40 rounded-3xl p-6 md:p-8 bg-gradient-card flex flex-col">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {t.taskBreakdown}
        </h3>
        <div className="flex-1 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-around gap-4">
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compositionData}
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1200}
                >
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
           <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
              {compositionData.map(item => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                  <span className="text-[10px] font-bold text-muted uppercase">{item.name}</span>
                </div>
              ))}
           </div>
           <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center border-t border-border/20 pt-2">
              {riskData.map(item => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                  <span className="text-[10px] font-bold text-muted uppercase">{item.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
