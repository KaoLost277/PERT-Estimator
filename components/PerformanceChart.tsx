'use client';

import { CalculatedTask } from '@/lib/logic';
import { useProjects } from '@/lib/store';

interface PerformanceChartProps {
  tasks: CalculatedTask[];
}

export default function PerformanceChart({ tasks }: PerformanceChartProps) {
  const { language } = useProjects();

  const validTasks = tasks.filter(t => t.actualDuration !== undefined && (Number(t.actualDuration) || 0) > 0);

  if (validTasks.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center opacity-50 bg-surface/30 rounded-2xl border border-dashed border-border/60">
        <p className="text-sm font-medium">No performance data available yet.</p>
        <p className="text-xs">Add &quot;Actual&quot; duration to tasks to see the comparison.</p>
      </div>
    );
  }

  const maxVal = Math.max(...validTasks.map(t => Math.max(t.te, Number(t.actualDuration) || 0)));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {validTasks.map((task, idx) => {
          const actualVal = Number(task.actualDuration) || 0;
          const expectedPct = (task.te / maxVal) * 100;
          const actualPct = (actualVal / maxVal) * 100;
          const diff = actualVal - task.te;
          const isOver = diff > 0;

          return (
            <div key={task.id} className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">T{idx + 1}</span>
                  <span className="text-xs font-bold truncate max-w-[150px]">{task.name}</span>
                </div>
                <div className="text-[10px] font-bold flex items-center gap-2">
                   <span className="text-muted">Est: {task.te.toFixed(1)} {language === 'th' ? 'ชม.' : 'h'}</span>
                   <span className={isOver ? "text-amber-500" : "text-emerald-500"}>Act: {actualVal.toFixed(1)} {language === 'th' ? 'ชม.' : 'h'}</span>
                </div>
              </div>
              <div className="relative h-4 w-full bg-surface rounded-full overflow-hidden border border-border/20">
                {/* Expected Bar */}
                <div 
                  className="absolute top-0 left-0 h-full bg-muted/30 transition-all duration-500"
                  style={{ width: `${expectedPct}%` }}
                />
                {/* Actual Bar */}
                <div 
                  className={`absolute top-0 left-0 h-full opacity-60 transition-all duration-500 ${isOver ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${actualPct}%` }}
                />
                {/* Target Marker */}
                <div 
                  className="absolute top-0 h-full w-0.5 bg-foreground/20 z-10"
                  style={{ left: `${expectedPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-muted/30 rounded-sm"></div>
          <span className="text-[10px] font-bold text-muted uppercase">{language === 'th' ? 'โดยประมาณ' : 'Estimated'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-emerald-500/60 rounded-sm"></div>
          <span className="text-[10px] font-bold text-muted uppercase">{language === 'th' ? 'ตามแผน' : 'On Track'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-amber-500/60 rounded-sm"></div>
          <span className="text-[10px] font-bold text-muted uppercase">{language === 'th' ? 'เกินแผน' : 'Over Estimate'}</span>
        </div>
      </div>
    </div>
  );
}
