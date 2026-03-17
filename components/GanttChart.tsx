'use client';

import { useProjects } from '@/lib/store';
import { CalculatedTask } from '@/lib/logic';
import { translations } from '@/lib/i18n';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GanttChartProps {
  tasks: CalculatedTask[];
  totalDuration: number;
  timeUnit?: 'days' | 'hours';
}

export default function GanttChart({ tasks, totalDuration, timeUnit = 'days' }: GanttChartProps) {
  const { language } = useProjects();
  const t = translations[language].gantt;
  if (tasks.length === 0) return null;

  const maxDays = Math.max(totalDuration, 1);
  const scale = 100 / maxDays;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold">{t.visualTimeline}</h3>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-primary rounded-sm"></div>
            <span>{t.criticalPath}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-muted/20 rounded-sm"></div>
            <span>{t.normalTask}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="relative border border-border/40 rounded-xl sm:rounded-2xl overflow-hidden bg-surface/30 min-w-[480px]">
          {/* Timeline Header */}
          <div className="flex border-b border-border/40 bg-surface/50">
            <div className="w-28 sm:w-36 shrink-0 border-r border-border/40 p-2.5 sm:p-3 text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center">{t.task}</div>
            <div className="flex-1 flex relative h-9 sm:h-10">
              {Array.from({ length: Math.ceil(maxDays) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute border-l border-border/20 h-full text-[12px] text-muted/70 pl-1 pt-1.5 font-medium"
                  style={{ left: `${i * scale}%` }}
                >
                  {i}{timeUnit === 'hours' ? t.hourShort : t.dayShort}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/30">
            {tasks.map((task, idx) => (
              <div key={task.id} className="flex hover:bg-surface/50 transition-colors group">
                <div className="w-28 sm:w-36 shrink-0 border-r border-border/40 p-2.5 sm:p-3 text-xs sm:text-sm truncate font-medium flex items-center gap-2">
                  <span className="text-[12px] sm:text-[10px] text-muted font-mono bg-surface px-1 sm:px-1.5 py-0.5 rounded-md font-bold tracking-wider shrink-0 border border-border/50">T{idx + 1}</span>
                  <span className="truncate">{task.name}</span>
                </div>
                <div className="flex-1 relative h-10 sm:h-12">
                  {/* Bar */}
                  <div
                    className={cn(
                      "absolute top-2.5 sm:top-3 h-5 sm:h-6 rounded-md transition-all duration-500",
                      task.isCritical
                        ? "bg-gradient-to-r from-primary to-blue-400"
                        : "bg-muted/20"
                    )}
                    style={{
                      left: `${task.es * scale}%`,
                      width: `${Math.max(task.te * scale, 1)}%`
                    }}
                  >
                    {/* Tooltip-like label on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded-lg text-[12px] sm:text-[10px] whitespace-nowrap pointer-events-none transition-opacity z-10 font-medium">
                      {task.es.toFixed(1)} — {task.ef.toFixed(1)} {timeUnit}
                    </div>
                  </div>

                  {/* Slack Bar (only for non-critical) */}
                  {!task.isCritical && task.slack > 0 && (
                    <div
                      className="absolute top-4 sm:top-5 h-2 bg-muted/5 border border-dashed border-muted/20 rounded-r-md"
                      style={{
                        left: `${task.ef * scale}%`,
                        width: `${task.slack * scale}%`
                      }}
                    ></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
