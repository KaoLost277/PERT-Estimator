'use client';

import { TrendingUp, ShieldCheck, Clock, Info } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useProjects } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SummaryStatsProps {
  expectedDuration: number;
  projectVariance: number;
  safeDate95: number;
  timeUnit: string;
  totalTasks: number;
  completedTasks: number;
  delayedTasks: number;
}

interface StatCardProps {
  title: string; 
  value: string; 
  subValue?: string; 
  icon: typeof Clock; 
  colorClass: string;
  hint: string;
}

const StatCard = ({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  colorClass, 
  hint 
}: StatCardProps) => (
  <div className="premium-card p-6 flex items-start gap-4 bg-card-bg">
    <div className={`w-12 h-12 rounded-2xl ${colorClass} shrink-0 flex items-center justify-center`}>
      <Icon className="text-white" size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <p className="premium-label-tiny mb-0">{title}</p>
        <Tooltip text={hint}>
          <Info size={12} className="text-muted/60 cursor-help" />
        </Tooltip>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-4xl font-heading font-bold text-foreground tabular-nums tracking-tight">{value}</h3>
        {subValue && <span className="text-sm font-medium text-slate-400 uppercase tracking-normal">{subValue}</span>}
      </div>
    </div>
  </div>
);

export default function SummaryStats({ 
  expectedDuration, 
  projectVariance, 
  safeDate95, 
  timeUnit,
  totalTasks,
  completedTasks,
  delayedTasks
}: SummaryStatsProps) {
  const { language } = useProjects();
  
  const labels = {
    th: {
      expected: 'วันเสร็จสิ้นที่คาดหวัง',
      variance: 'ค่าความแปรปรวนของโครงการ',
      safeDate: 'วันที่ปลอดภัยที่สุด (95%)',
      unitHours: 'ชม.',
      unitDays: 'วัน',
      hintExpected: 'ค่าเฉลี่ยถ่วงน้ำหนัก (O + 4M + P) / 6',
      hintVariance: 'ผลรวมของค่าความแปรปรวนของงานในสายงานวิกฤต',
      hintSafe: 'จุดที่มั่นใจได้ 95% ว่างานจะเสร็จสิ้น (Mean + 2SD)',
      qualityEffective: 'เสถียรมาก',
      qualityModerate: 'ปกติ',
      qualityPoor: 'เสี่ยงสูง/วางแผนไม่ดี',
      descEffective: 'การประเมินใกล้เคียงกัน ความไม่แน่นอนต่ำมาก แผนงานมีความเป็นไปได้สูง',
      descModerate: 'มีความเสี่ยงและความไม่แน่นอนในระดับที่รับได้ตามมาตรฐาน PERT',
      descPoor: 'งานมีความไม่แน่นอนสูงมาก (O และ P ต่างกันเกินไป) ควรทบทวนหรือย่อยงานใหม่',
      progressTitle: 'ความคืบหน้าโครงการ',
      taskCount: 'รายการที่เสร็จสมบูรณ์',
      delayedTitle: 'งานที่ล่าช้า (Delay)',
      remaining: 'คงเหลือ',
      of: 'จากทั้งหมด',
      tasks: 'งาน',
      allDone: 'เสร็จสมบูรณ์ทุกงาน!',
      delayedDesc: 'งานที่ยังไม่เสร็จและเกินกำหนดวันที่เริ่มหรือวันที่จบคามแผน (Planned Dates)',
      statusDelay: 'ล่าช้า',
      statusOnTrack: 'ตามแผน'
    },
    en: {
      expected: 'Expected Duration',
      variance: 'Project Variance',
      safeDate: 'Safest Date (95%)',
      unitHours: 'h',
      unitDays: 'd',
      hintExpected: 'Weighted average (O + 4M + P) / 6',
      hintVariance: 'Sum of variances of tasks on the critical path',
      hintSafe: '95% confidence point for completion (Mean + 2SD)',
      qualityEffective: 'Very Stable',
      qualityModerate: 'Normal',
      qualityPoor: 'High Risk / Poor Planning',
      descEffective: 'Estimates are very tight, very low uncertainty. High reliability.',
      descModerate: 'Standard level of risk and uncertainty.',
      descPoor: 'High uncertainty (O & P gap too wide). Re-evaluate or break down tasks.',
      progressTitle: 'Progress',
      taskCount: 'Completed Tasks',
      delayedTitle: 'Delayed Tasks',
      remaining: 'Remaining',
      of: 'of',
      tasks: 'tasks',
      allDone: 'All completed!',
      delayedDesc: 'Unfinished tasks that have passed their planned start or end dates',
      statusDelay: 'Delay Detected',
      statusOnTrack: 'On Track'
    }
  }[language === 'th' ? 'th' : 'en'];

  const unit = timeUnit === 'hours' ? labels.unitHours : labels.unitDays;

  // Planning Quality Logic
  const sd = Math.sqrt(projectVariance);
  const riskRatio = expectedDuration > 0 ? sd / expectedDuration : 0;
  
  let qualityStatus = '';
  let qualityDesc = '';
  let qualityColor = '';
  let iconColor = '';

  if (riskRatio < 0.05) {
    qualityStatus = labels.qualityEffective;
    qualityDesc = labels.descEffective;
    qualityColor = "premium-badge-emerald";
    iconColor = "bg-primary text-white";
  } else if (riskRatio < 0.15) {
    qualityStatus = labels.qualityModerate;
    qualityDesc = labels.descModerate;
    qualityColor = "premium-badge-amber";
    iconColor = "bg-amber-500 text-white";
  } else {
    qualityStatus = labels.qualityPoor;
    qualityDesc = labels.descPoor;
    qualityColor = "premium-badge-rose";
    iconColor = "bg-rose-500 text-white";
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        title={labels.expected}
        value={expectedDuration.toFixed(1)}
        subValue={unit}
        icon={Clock}
        colorClass="bg-primary/20 text-primary border border-primary/30"
        hint={labels.hintExpected}
      />
      <div className={`border rounded-2xl p-6 flex items-start gap-4 transition-all bg-card-bg ${qualityColor}`}>
        <div className={`p-3 rounded-xl shrink-0 ${iconColor}`}>
          <TrendingUp size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-normal mb-0">{labels.variance}</p>
            <Tooltip text={`${labels.hintVariance} | ${qualityDesc}`}>
              <Info size={12} className="text-muted/60 cursor-help" />
            </Tooltip>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-4xl font-heading font-bold text-foreground tabular-nums tracking-tight">{projectVariance.toFixed(2)}</h3>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-normal shrink-0 ${iconColor}`}>
              {qualityStatus}
            </span>
          </div>
        </div>
      </div>
      <StatCard 
        title={labels.safeDate}
        value={safeDate95.toFixed(1)}
        subValue={unit}
        icon={ShieldCheck}
        colorClass="bg-primary"
        hint={labels.hintSafe}
      />

      {/* Second Row: Progress & Todo Overview */}
      <div className="md:col-span-3 mt-4 pt-6 border-t border-border/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Progress Card */}
          <div className="premium-card p-6 bg-card-bg">
            <div className="flex items-center justify-between mb-4">
              <p className="premium-label-tiny mb-0">{labels.progressTitle}</p>
              <span className="text-2xl font-bold text-primary">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-border/20">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-muted uppercase mt-3 tracking-widest text-right">
              {completedTasks === totalTasks && totalTasks > 0 ? labels.allDone : `${labels.remaining} ${totalTasks - completedTasks} ${labels.tasks}`}
            </p>
          </div>

          {/* Task Counter Card */}
          <div className="premium-card p-6 bg-card-bg border-l-4 border-l-primary/30">
            <p className="premium-label-tiny mb-2">{labels.taskCount}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-heading font-bold text-foreground">{completedTasks}</h3>
              <span className="text-sm font-medium text-slate-400">/ {totalTasks} {labels.tasks}</span>
            </div>
            <p className="text-[10px] font-bold text-muted uppercase mt-2 tracking-widest">
              {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% ${labels.of} ${labels.tasks}` : '-'}
            </p>
          </div>

          {/* Delay Status Card */}
          <div className={cn(
            "premium-card p-6 bg-card-bg border-l-4 transition-all",
            delayedTasks > 0 ? "border-l-rose-500 shadow-sm shadow-rose-500/5" : "border-l-emerald-500/30"
          )}>
            <div className="flex items-center justify-between mb-2">
              <p className="premium-label-tiny mb-0">{labels.delayedTitle}</p>
              <Tooltip text={labels.delayedDesc}>
                <Info size={12} className="text-muted/60 cursor-help" />
              </Tooltip>
            </div>
            <div className="flex items-center gap-3">
              <h3 className={cn(
                "text-4xl font-heading font-bold tabular-nums",
                delayedTasks > 0 ? "text-rose-500" : "text-emerald-500"
              )}>
                {delayedTasks}
              </h3>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                delayedTasks > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
              )}>
                {delayedTasks > 0 ? labels.statusDelay : labels.statusOnTrack}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
