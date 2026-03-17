'use client';

import { Task, useProjects } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { calculateExpectedDuration } from '@/lib/calculations';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  User,
  Info,
  ListPlus,
  Check,
  Layers
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Tooltip } from './Tooltip';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  index: number;
  onUpdate: (id: string, field: keyof Task, value: string | number | Task[]) => void;
  onRemove: (id: string) => void;
  onAddSub: (parentId: string) => void;
  estimationMode: 'three-point' | 'single-point';
  language: 'en' | 'th';
  timeUnit: string;
  allTasks: Task[];
}

const TaskCard = ({
  task,
  index,
  onUpdate,
  onRemove,
  onAddSub,
  estimationMode,
  language,
  allTasks
}: TaskCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showPredecessorDropdown, setShowPredecessorDropdown] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPredecessorDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const t = translations[language].matrix;

  const hasSubTasks = task.subTasks && task.subTasks.length > 0;

  const { aggregatedActual, aggregatedTe } = useMemo(() => {
    if (!hasSubTasks) return { aggregatedActual: 0, aggregatedTe: 0 };

    let sumO = 0, sumM = 0, sumP = 0, sumActual = 0;
    task.subTasks!.forEach(sub => {
      sumO += Number(sub.o) || 0;
      sumM += Number(sub.m) || 0;
      sumP += Number(sub.p) || 0;
      sumActual += Number(sub.actualDuration) || 0;
    });

    const sumTe = calculateExpectedDuration({ o: sumO, m: sumM, p: sumP }, task.status, sumActual);

    return { aggregatedActual: sumActual, aggregatedTe: sumTe };
  }, [task.subTasks, task.status, hasSubTasks]);



  const te = useMemo(() => {
    if (hasSubTasks) return aggregatedTe;
    const o = Number(task.o) || 0;
    const m = Number(task.m) || 0;
    const p = Number(task.p) || 0;
    const actual = Number(task.actualDuration) || 0;

    return calculateExpectedDuration({ o, m, p }, task.status, actual);
  }, [task, hasSubTasks, aggregatedTe]);

  const showBreakdownWarning = te > 6;
  const actualVal = hasSubTasks ? aggregatedActual : (Number(task.actualDuration) || 0);
  const isAtRisk = (task.status === 'IN_PROGRESS' || task.status === 'DONE') && actualVal > te;

  return (
    <div className={cn(
      "premium-card",
      hasSubTasks && "premium-card-group"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 sm:p-5 flex flex-col gap-4 transition-colors",
        hasSubTasks && "bg-white dark:bg-accent/20"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all",
              hasSubTasks
                ? "bg-primary text-white dark:text-background border-primary"
                : "bg-white text-muted border-border"
            )}>
              {hasSubTasks ? <Layers size={14} /> : <span className="text-xs font-bold">{task.sequence || index + 1}</span>}
            </div>
            <input
              type="text"
              className={cn(
                "premium-input-flat",
                hasSubTasks ? "font-bold text-xl tracking-tight" : "font-bold text-lg"
              )}
              value={task.name}
              placeholder={task.isGroup ? (language === 'th' ? 'ชื่อกลุ่มงาน...' : 'Group Name...') : t.taskName}
              onChange={(e) => onUpdate(task.id, 'name', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {task.isGroup && (
              <button
                onClick={() => onAddSub(task.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-foreground rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-border"
              >
                <Plus size={12} />
                {language === 'th' ? 'เพิ่มงานในกลุ่ม' : 'Add Task to Group'}
              </button>
            )}
            <button
              onClick={() => onRemove(task.id)}
              className="premium-button-icon"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="premium-button-expand"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        </div>

        {/* Action Row & Warnings */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="premium-container-stat">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider whitespace-nowrap">{t.status}:</span>
            <select
              className={cn(
                "bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-bold p-0 cursor-pointer appearance-none",
                task.status === 'DONE' ? "text-emerald-500" :
                  task.status === 'IN_PROGRESS' ? "text-blue-500" : "text-slate-400"
              )}
              value={task.status}
              onChange={(e) => onUpdate(task.id, 'status', e.target.value)}
            >
              <option value="TODO" className="bg-surface text-foreground">{t.statusLabels.todo}</option>
              <option value="IN_PROGRESS" className="bg-surface text-foreground">{t.statusLabels.inprogress}</option>
              <option value="DONE" className="bg-surface text-foreground">{t.statusLabels.done}</option>
            </select>
          </div>

          <div className="premium-container-stat">
            <User size={12} className="text-muted shrink-0" />
            <input
              type="text"
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-bold p-0 min-w-[100px] placeholder:text-muted/30"
              value={task.assignee || ''}
              placeholder={t.assignee}
              onChange={(e) => onUpdate(task.id, 'assignee', e.target.value)}
            />
          </div>

          {showBreakdownWarning && (
            <div className="premium-badge-amber h-[38px] px-4">
              <AlertTriangle size={14} className="shrink-0" />
              <span className="leading-none">{t.breakdownWarning}</span>
            </div>
          )}

          {isAtRisk && (
            <div className="premium-badge-rose h-[38px] px-3">
              <AlertTriangle size={14} />
              <span>AT RISK</span>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/20">
          {!task.isGroup && (
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="premium-label-tiny">{t.opt}</label>
                  <input
                    type="number"
                    className="premium-input-number text-blue-600 bg-blue-500/[0.03] dark:bg-blue-500/10"
                    value={task.o}
                    onChange={(e) => onUpdate(task.id, 'o', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="premium-label-tiny">{t.likely}</label>
                  <input
                    type="number"
                    className="premium-input-number text-foreground bg-slate-500/[0.03] dark:bg-slate-500/10"
                    value={task.m}
                    onChange={(e) => onUpdate(task.id, 'm', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="premium-label-tiny">{t.pess}</label>
                  <input
                    type="number"
                    className="premium-input-number text-rose-600 bg-rose-500/[0.03] dark:bg-rose-500/10"
                    value={task.p}
                    onChange={(e) => onUpdate(task.id, 'p', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="px-5 py-4 flex flex-col sm:flex-row gap-6 border-b border-border/20">
            <div className="w-full sm:w-1/2 space-y-1.5 relative" ref={dropdownRef}>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">{t.predecessors}</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  onClick={() => setShowPredecessorDropdown(!showPredecessorDropdown)}
                  className="w-full bg-white border border-border/30 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all cursor-pointer placeholder:text-muted/30"
                  value={task.predecessorsText || ''}
                  placeholder={language === 'th' ? 'เลือกงานก่อนหน้า...' : 'Select Predecessors...'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                  <ListPlus size={14} />
                </div>

                {showPredecessorDropdown && (
                  <div className="absolute z-50 mt-2 w-full min-w-[200px] bg-card-bg border border-border rounded-xl p-2 max-h-[300px] overflow-y-auto animate-in zoom-in-95 duration-200">
                    <div className="space-y-1 text-left">
                      {allTasks
                        .filter(t => t.id !== task.id)
                        .map((t, idx) => {
                          const tSeq = t.sequence || idx + 1;
                          const isSelected = task.predecessorsText?.split(',').map(s => s.trim()).includes(String(tSeq));

                          return (
                            <button
                              key={t.id}
                              onClick={() => {
                                const currentPreds = task.predecessorsText ? task.predecessorsText.split(',').map(s => s.trim()).filter(s => s !== '') : [];
                                let newPreds;
                                if (isSelected) {
                                  newPreds = currentPreds.filter(s => s !== String(tSeq));
                                } else {
                                  newPreds = [...currentPreds, String(tSeq)].sort((a, b) => Number(a) - Number(b));
                                }
                                onUpdate(task.id, 'predecessorsText', newPreds.join(', '));
                              }}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-surface text-foreground'
                                }`}
                            >
                              <div className="flex items-center gap-2 truncate text-foreground">
                                <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-muted/20 rounded-md text-[12px]">{tSeq}</span>
                                <span className="truncate">{t.name || `Task ${tSeq}`}</span>
                              </div>
                              {isSelected && <Check size={14} className="text-primary" />}
                            </button>
                          );
                        })}
                      {allTasks.length <= 1 && (
                        <div className="text-center py-4 text-[10px] text-muted font-bold uppercase">{language === 'th' ? 'ไม่มีงานอื่นให้เลือก' : 'No other tasks available'}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full sm:w-1/2 space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  {language === 'th' ? 'เวลารวมกลุ่ม' : 'Group Total'} <Tooltip text={language === 'th' ? 'ระยะเวลารวมของงานย่อยทั้งหมดในกลุ่มนี้' : 'Total duration of all sub-tasks in this group'}><Info size={10} /></Tooltip>
                </label>
                <div className="flex items-baseline gap-1.5 h-full">
                  <span className="text-2xl font-bold font-mono text-primary leading-none">{te.toFixed(1)}</span>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{language === 'th' ? 'ชม.' : 'HR'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tasks Section */}
          {task.isGroup && (
            <div className="bg-white dark:bg-surface/10 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-bold uppercase text-muted tracking-[0.2em]">{language === 'th' ? 'รายการงานย่อย' : 'Sub-Tasks'}</h4>
              </div>

              <div className="space-y-2">
                {task.subTasks?.map((sub: Task, sIdx: number) => {
                  const subTe = calculateExpectedDuration(
                    { o: Number(sub.o) || 0, m: Number(sub.m) || 0, p: Number(sub.p) || 0 },
                    sub.status,
                    Number(sub.actualDuration) || 0
                  );

                  return (
                    <div key={sub.id} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white dark:bg-slate-800/50 border border-border/20 rounded-xl group/sub hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                        <span className="text-[10px] font-mono font-bold text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">{task.sequence}.{sub.sequence || sIdx + 1}</span>
                        <input
                          className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-bold w-full p-0"
                          value={sub.name}
                          onChange={(e) => {
                            const updated = (task.subTasks || []).map((st: Task) => st.id === sub.id ? { ...st, name: e.target.value } : st);
                            onUpdate(task.id, 'subTasks', updated as Task[]);
                          }}
                        />
                      </div>

                      <div className="flex items-start gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        {estimationMode === 'three-point' ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] font-bold text-muted tracking-widest uppercase opacity-60">O | M | P</span>
                            <div className="flex items-center gap-2 border border-border/30 rounded-xl px-3 bg-white hover:bg-slate-50 transition-colors h-[42px]">
                              <input
                                type="number"
                                className="w-14 bg-transparent border-none focus:outline-none text-sm font-mono font-bold text-center"
                                placeholder="O"
                                title={t.opt}
                                value={sub.o || ''}
                                onChange={(e) => {
                                  const updated = (task.subTasks || []).map((st: Task) => st.id === sub.id ? { ...st, o: parseFloat(e.target.value) || 0 } : st);
                                  onUpdate(task.id, 'subTasks', updated as Task[]);
                                }}
                              />
                              <div className="w-px h-4 bg-border/40" />
                              <input
                                type="number"
                                className="w-14 bg-transparent border-none focus:outline-none text-sm font-mono font-bold text-center"
                                placeholder="M"
                                title={t.likely}
                                value={sub.m || ''}
                                onChange={(e) => {
                                  const updated = task.subTasks?.map(st => st.id === sub.id ? { ...st, m: parseFloat(e.target.value) || 0 } : st);
                                  onUpdate(task.id, 'subTasks', updated as Task[]);
                                }}
                              />
                              <div className="w-px h-4 bg-border/40" />
                              <input
                                type="number"
                                className="w-14 bg-transparent border-none focus:outline-none text-sm font-mono font-bold text-center"
                                placeholder="P"
                                title={t.pess}
                                value={sub.p || ''}
                                onChange={(e) => {
                                  const updated = (task.subTasks || []).map((st: Task) => st.id === sub.id ? { ...st, p: parseFloat(e.target.value) || 0 } : st);
                                  onUpdate(task.id, 'subTasks', updated as Task[]);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] font-bold text-muted tracking-widest uppercase opacity-60">{t.duration}</span>
                            <div className="flex items-center gap-3 border border-border/30 rounded-xl px-4 bg-white hover:bg-slate-50 transition-colors h-[42px]">
                              <input
                                type="number"
                                className="w-20 bg-transparent border-none focus:outline-none text-sm font-mono font-bold text-center"
                                placeholder={t.duration}
                                value={sub.m || ''}
                                onChange={(e) => {
                                  const updated = task.subTasks?.map(st => st.id === sub.id ? { ...st, m: parseFloat(e.target.value) || 0 } : st);
                                  onUpdate(task.id, 'subTasks', updated as Task[]);
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-1.5 h-full">
                            <span className="text-[10px] font-bold text-muted tracking-widest uppercase opacity-60">TE</span>
                            <div className="flex items-center justify-center h-[42px]">
                              <span className="text-lg font-bold font-mono text-primary leading-none">{subTe.toFixed(1)}</span>
                              <span className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">{language === 'th' ? 'ชม.' : 'HR'}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] font-bold text-muted tracking-widest uppercase opacity-60">{t.actual}</span>
                            <div className="bg-surface/40 border border-border/30 rounded-xl px-4 flex items-center h-[42px] hover:bg-surface/60 transition-colors w-28 justify-center">
                              <input
                                type="number"
                                className="bg-transparent border-none focus:outline-none text-sm font-bold font-mono text-foreground w-full text-center"
                                value={sub.actualDuration || ''}
                                onChange={(e) => {
                                  const updated = (task.subTasks || []).map((st: Task) => st.id === sub.id ? { ...st, actualDuration: parseFloat(e.target.value) || 0 } : st);
                                  onUpdate(task.id, 'subTasks', updated as Task[]);
                                }}
                                placeholder="-"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] font-bold text-muted tracking-widest uppercase opacity-60 text-center">{t.status}</span>
                            <button
                              onClick={() => {
                                const updated = (task.subTasks || []).map((st: Task) => st.id === sub.id ? { ...st, status: st.status === 'DONE' ? 'TODO' : 'DONE' } : st);
                                onUpdate(task.id, 'subTasks', updated as Task[]);
                              }}
                              className={cn(
                                "h-[42px] flex items-center justify-center min-w-[100px] border-none rounded-xl transition-all",
                                sub.status === 'DONE'
                                  ? "premium-badge-emerald shadow-sm shadow-emerald-500/5"
                                  : "bg-muted/10 text-muted hover:text-primary hover:bg-primary/10"
                              )}
                            >
                              {sub.status === 'DONE' ? (language === 'th' ? 'เสร็จสิ้น' : 'Done') : (language === 'th' ? 'รอดำเนินการ' : 'To Do')}
                            </button>
                          </div>
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] opacity-0 h-3">.</span>
                            <div className="flex items-center justify-center h-[42px]">
                              <button
                                onClick={() => {
                                  const updated = (task.subTasks || []).filter((st: Task) => st.id !== sub.id);
                                  onUpdate(task.id, 'subTasks', updated as Task[]);
                                }}
                                className="text-muted/40 hover:text-destructive p-2 transition-all hover:bg-destructive/10 rounded-lg"
                                title={language === 'th' ? 'ลบงานย่อย' : 'Delete Sub-task'}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!task.subTasks || task.subTasks.length === 0) && (
                  <div className="text-center py-6 border border-dashed border-border/40 rounded-xl opacity-30">
                    <p className="text-[10px] font-bold uppercase tracking-widest">{language === 'th' ? 'ยังไม่มีงานย่อย' : 'No sub-tasks yet'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function TaskCardView() {
  const { activeProject, updateTasks, language } = useProjects();
  const rawTasks = activeProject?.tasks || [];

  const tasks = [...rawTasks].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  const updateTaskField = (id: string, field: keyof Task, value: string | number | Task[]) => {
    updateTasks(rawTasks.map((t: Task) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTask = (id: string) => {
    updateTasks(rawTasks.filter((t: Task) => t.id !== id));
  };

  const onAddSub = (parentId: string) => {
    const updated = rawTasks.map((t: Task) => {
      if (t.id === parentId) {
        const subs = t.subTasks || [];
        const nextSeq = subs.length > 0 ? Math.max(...subs.map((s: Task) => s.sequence || 0)) + 1 : 1;
        const newSub: Task = {
          id: crypto.randomUUID(),
          name: `Sub-task ${subs.length + 1}`,
          o: 0, m: 0, p: 0,
          status: 'TODO',
          sequence: nextSeq
        };
        return { ...t, subTasks: [...subs, newSub] };
      }
      return t;
    });
    updateTasks(updated);
  };

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center bg-surface/10 rounded-3xl border border-dashed border-border/40">
        <p className="text-base font-bold text-muted">{translations[language].matrix.noTasks}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {tasks.map((task, idx) => (
        <TaskCard
          key={task.id}
          task={task}
          index={idx}
          onUpdate={updateTaskField}
          onRemove={removeTask}
          onAddSub={onAddSub}
          estimationMode={activeProject?.estimationMode || 'three-point'}
          language={language}
          timeUnit={activeProject?.timeUnit || 'hours'}
          allTasks={tasks}
        />
      ))}
    </div>
  );
}
