'use client';

import React from 'react';
import { Trash2, Clock, ListPlus, Check, AlertCircle, Layers, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Task } from '@/lib/store';
import { validatePertInput, calculateExpectedDuration } from '@/lib/calculations';
import { CalculatedTask } from '@/lib/logic';
import { Tooltip } from './Tooltip';
import { cn } from '@/lib/utils';

interface DashboardTaskCardProps {
  task: CalculatedTask;
  allTasks: Task[];
  onUpdate: (id: string, updates: Partial<CalculatedTask>) => void;
  onRemove: (id: string) => void;
  language: 'en' | 'th';
}

export default function DashboardTaskCard({
  task,
  allTasks,
  onUpdate,
  onRemove,
  language
}: DashboardTaskCardProps) {
  const [showPredecessorDropdown, setShowPredecessorDropdown] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(true);
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
  const o = Number(task.o) || 0;
  const m = Number(task.m) || 0;
  const p = Number(task.p) || 0;

  const { isValid, error } = validatePertInput(o, m, p);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('en-CA');
    } catch {
      return '';
    }
  };

  const labels = {
    th: {
      o: 'คาดการณ์ดีสุด (O)',
      m: 'เป็นไปได้สุด (M)',
      p: 'คาดการณ์แย่สุด (P)',
      placeholder: 'ชื่องาน...',
      delete: 'ลบงาน',
      critical: 'งานวิกฤต',
      slack: 'เวลาที่ล่าช้าได้',
      predecessors: 'งานก่อนหน้า',
      selectTasks: 'เลือกงานก่อนหน้า...',
    },
    en: {
      o: 'Optimistic (O)',
      m: 'Most Likely (M)',
      p: 'Pessimistic (P)',
      placeholder: 'Task Name...',
      delete: 'Delete Task',
      critical: 'CRITICAL',
      slack: 'Buffer Time',
      predecessors: 'Predecessors',
      selectTasks: 'Select Predecessors...',
    }
  }[language === 'th' ? 'th' : 'en'];

  const isGroup = task.isGroup;

  return (
    <div className={cn(
      "premium-card",
      isGroup && "premium-card-group"
    )}>
      <div className={cn(
        "p-4 sm:p-5 flex flex-col gap-4",
        isGroup && "bg-white dark:bg-accent/20"
      )}>
        {/* Task Name Input */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all",
              isGroup
                ? "bg-foreground text-background border-foreground"
                : "bg-surface text-muted border-border"
            )}>
              {isGroup ? <Layers size={18} /> : <span className="text-sm font-bold">{task.displayId || '?'}</span>}
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <input
                type="text"
                className={cn(
                  "premium-input-flat",
                  isGroup ? "font-bold text-xl tracking-tight" : "text-lg font-bold"
                )}
                value={task.name}
                placeholder={isGroup ? (language === 'th' ? 'ชื่อกลุ่มกิจกรรม...' : 'Group Title...') : labels.placeholder}
                onChange={(e) => onUpdate(task.id, { name: e.target.value })}
              />
              {isGroup && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-normal text-slate-400 uppercase tracking-normal">
                    {task.subTasks?.length || 0} {language === 'th' ? 'งานย่อย' : 'Sub-tasks'}
                  </span>
                </div>
              )}
            </div>

            {task.isCritical && (
              <span className="premium-badge-rose animate-pulse">
                {labels.critical}
              </span>
            )}
            {task.slack > 0 && (
              <span className={cn(
                "px-3 py-1.5",
                task.slack > 2 ? 'premium-badge-emerald' : 'premium-badge-cyan'
              )}>
                <Clock size={12} className="shrink-0" />
                <span className="font-semibold uppercase tracking-wider">{labels.slack}: {task.slack.toFixed(1)}</span>
              </span>
            )}

            {(() => {
              const today = new Date().toLocaleDateString('en-CA');
              const isDone = task.status === 'DONE';
              if (isDone) return null;

              const startDate = task.plannedStartDate ? new Date(task.plannedStartDate).toLocaleDateString('en-CA') : null;
              const endDate = task.plannedEndDate ? new Date(task.plannedEndDate).toLocaleDateString('en-CA') : null;

              const hasLateStart = task.status === 'TODO' && startDate && startDate < today;
              const hasLateFinish = endDate && endDate < today;
              const isDateReversed = startDate && endDate && endDate < startDate;

              if (isDateReversed) {
                return (
                  <span className="premium-badge-amber">
                    <AlertCircle size={12} className="shrink-0" />
                    <span className="font-semibold uppercase tracking-wider">
                      {language === 'th' ? 'วันที่ผิดพลาด' : 'DATE ERROR'}
                    </span>
                  </span>
                );
              }

              if (hasLateStart || hasLateFinish) {
                return (
                  <span className="premium-badge-rose">
                    <AlertCircle size={12} className="shrink-0" />
                    <span className="font-semibold uppercase tracking-wider">
                      {language === 'th' ? 'ล่าช้า' : 'DELAYED'}
                    </span>
                  </span>
                );
              }
              return null;
            })()}

            {isGroup && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => {
                    const subs = task.subTasks || [];
                    const nextSeq = subs.length > 0 ? Math.max(...subs.map((s: Task) => s.sequence || 0)) + 1 : 1;
                    const newSub: Task = {
                      id: crypto.randomUUID(),
                      name: language === 'th' ? `งานย่อย ${subs.length + 1}` : `Sub-task ${subs.length + 1}`,
                      o: 0, m: 0, p: 0,
                      status: 'TODO' as const,
                      sequence: nextSeq
                    };
                    onUpdate(task.id, { subTasks: [...subs, newSub] });
                    setIsExpanded(true); // Auto expand when adding
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-emerald-600 dark:hover:bg-primary/90 text-white dark:text-background rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 group shadow-sm shadow-primary/10"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                  {language === 'th' ? 'เพิ่มงานใหม่' : 'Add New Task'}
                </button>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="premium-button-expand"
                  title={isExpanded ? (language === 'th' ? 'ย่อลง' : 'Collapse') : (language === 'th' ? 'ขยาย' : 'Expand')}
                >
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Predecessors Dropdown Selection */}
            <div className="md:col-span-1 space-y-1.5 relative" ref={dropdownRef}>
              <label className="premium-label-tiny flex items-center gap-1.5">
                <ListPlus size={12} className="text-primary/60" />
                {labels.predecessors}
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  onClick={() => setShowPredecessorDropdown(!showPredecessorDropdown)}
                  className="w-full bg-input-bg border border-border rounded-2xl px-4 py-3 text-sm font-bold text-foreground focus:border-primary cursor-pointer transition-all outline-none hover:border-primary/50"
                  value={task.predecessorsText || ''}
                  placeholder={labels.selectTasks}
                />

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
                                onUpdate(task.id, { predecessorsText: newPreds.join(', ') });
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

            {!isGroup ? (
              <>
                <div className="md:col-span-1 space-y-1.5">
                  <label className="premium-label-tiny text-blue-600/70">{language === 'th' ? 'เร็วสุด (O)' : 'Fastest (O)'}</label>
                  <input
                    type="number"
                    className={cn(
                      "premium-input-number text-blue-600 dark:text-blue-400 bg-blue-500/[0.03] dark:bg-blue-500/5",
                      !isValid && o > m ? 'border-red-500' : 'border-blue-500/10'
                    )}
                    value={task.o}
                    onChange={(e) => onUpdate(task.id, { o: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="md:col-span-1 space-y-1.5">
                  <label className="premium-label-tiny text-slate-500/70">{language === 'th' ? 'ปกติ (M)' : 'Normal (M)'}</label>
                  <input
                    type="number"
                    className={cn(
                      "premium-input-number bg-slate-500/[0.03] dark:bg-slate-500/5",
                      !isValid && (o > m || m > p) ? 'border-red-500' : 'border-slate-500/10'
                    )}
                    value={task.m}
                    onChange={(e) => onUpdate(task.id, { m: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="md:col-span-1 space-y-1.5">
                  <label className="premium-label-tiny text-rose-600/70">{language === 'th' ? 'ช้าสุด (P)' : 'Slowest (P)'}</label>
                  <input
                    type="number"
                    className={cn(
                      "premium-input-number text-rose-600 dark:text-rose-400 bg-rose-500/[0.03] dark:bg-rose-500/5 rounded-2xl",
                      !isValid && m > p ? 'border-red-500' : 'border-rose-500/10'
                    )}
                    value={task.p}
                    onChange={(e) => onUpdate(task.id, { p: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col justify-center p-4 bg-accent/30 border border-border rounded-2xl">
                  <div className="premium-label-tiny text-slate-400 font-medium mb-2">{language === 'th' ? 'ระยะเวลาตามแผน' : 'PLANNED DATES'}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted/60 uppercase tracking-tighter">Start</label>
                      <input
                        type="date"
                        className="premium-date-input"
                        value={formatDate(task.plannedStartDate)}
                        onChange={(e) => onUpdate(task.id, { plannedStartDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted/60 uppercase tracking-tighter">End</label>
                      <input
                        type="date"
                        className="premium-date-input"
                        value={formatDate(task.plannedEndDate)}
                        onChange={(e) => onUpdate(task.id, { plannedEndDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-end text-right p-4 bg-accent/30 border border-border rounded-2xl">
                  <div className="premium-label-tiny text-slate-400 font-medium mb-1">{language === 'th' ? 'ระยะเวลารวมในกลุ่ม' : 'GROUP DURATION'}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold font-heading text-foreground leading-none tracking-tight">{task.te.toFixed(1)}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-normal">{language === 'th' ? 'ชม.' : 'HR'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions & Alerts */}
        <div className="flex flex-row sm:flex-col justify-between items-end sm:items-center sm:w-12 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 pt-3 sm:pt-0 sm:pl-3 mt-1 sm:mt-0">
          <button
            onClick={() => onRemove(task.id)}
            className="premium-button-icon bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white"
            title={labels.delete}
          >
            <Trash2 size={20} />
          </button>

          {!isValid && (
            <Tooltip text={error || ''}>
              <div className="p-2 bg-red-500/10 text-red-500 rounded-xl animate-pulse cursor-help">
                <AlertCircle size={20} />
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Sub-tasks Section for Groups */}
      {isGroup && task.subTasks && task.subTasks.length > 0 && isExpanded && (
        <div className="px-5 pb-8 pt-4 space-y-6 bg-white dark:bg-black/30 border-t border-border/40 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="indicator-dot-primary" />
              <span className="text-[12px] font-bold text-muted uppercase tracking-[0.25em]">{language === 'th' ? 'รายการงานย่อย' : 'SUB-TASKS'}</span>
            </div>
            <span className="px-2 py-0.5 premium-badge-emerald rounded-md">
              {task.subTasks.length} {language === 'th' ? 'งาน' : 'ITEMS'}
            </span>
          </div>

          <div className="space-y-3">
            {task.subTasks.map((sub: Task, sIdx: number) => {
              const subTe = calculateExpectedDuration(
                { o: Number(sub.o) || 0, m: Number(sub.m) || 0, p: Number(sub.p) || 0 },
                sub.status,
                Number(sub.actualDuration) || 0
              );
              return (
                <div key={sub.id} className="flex flex-col xl:flex-row items-center gap-6 p-5 bg-card-bg border border-border/80 rounded-[28px] hover:border-primary/40 transition-all group/sub">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <button
                      onClick={() => {
                        const nextStatus = sub.status === 'DONE' ? 'TODO' : 'DONE' as 'TODO' | 'DONE';
                        const updated = task.subTasks?.map((st: Task) => st.id === sub.id ? { ...st, status: nextStatus } : st);
                        onUpdate(task.id, { subTasks: updated });
                      }}
                      className={cn(
                        "shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl border transition-all active:scale-90",
                        sub.status === 'DONE'
                          ? "bg-primary border-primary text-background shadow-lg shadow-primary/20"
                          : "bg-surface border-border hover:border-primary/50 text-muted group-hover/sub:text-primary"
                      )}
                    >
                      {sub.status === 'DONE'
                        ? <Check size={20} strokeWidth={3} />
                        : <span className="text-[13px] font-bold font-mono">{task.displayId}.{sub.sequence || sIdx + 1}</span>
                      }
                    </button>
                    <input
                      className={cn(
                        "premium-input-flat text-base font-semibold w-full tracking-tight transition-all",
                        sub.status === 'DONE' && "text-slate-400 line-through opacity-60"
                      )}
                      value={sub.name}
                      onChange={(e) => {
                        const updated = task.subTasks?.map((st: Task) => st.id === sub.id ? { ...st, name: e.target.value } : st);
                        onUpdate(task.id, { subTasks: updated });
                      }}
                      placeholder={language === 'th' ? 'ระบุชื่อโครงการ/งาน...' : 'Enter Task Name...'}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <div className="flex-1 sm:flex-none flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="premium-label-tiny text-blue-600/60 text-center">{language === 'th' ? 'เร็วสุด' : 'FASTEST'}</span>
                        <input
                          type="number"
                          className="premium-input-sub-number bg-blue-500/[0.03] dark:bg-blue-500/10 border-blue-200/50 text-blue-600 focus:border-blue-500"
                          value={sub.o || ''}
                          onChange={(e) => {
                            const updated = task.subTasks?.map((st: Task) => st.id === sub.id ? { ...st, o: parseFloat(e.target.value) || 0 } : st);
                            onUpdate(task.id, { subTasks: updated });
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="premium-label-tiny text-slate-500 text-center">{language === 'th' ? 'ปกติ' : 'NORMAL'}</span>
                        <input
                          type="number"
                          className="premium-input-sub-number"
                          value={sub.m || ''}
                          onChange={(e) => {
                            const updated = task.subTasks?.map((st: Task) => st.id === sub.id ? { ...st, m: parseFloat(e.target.value) || 0 } : st);
                            onUpdate(task.id, { subTasks: updated });
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="premium-label-tiny text-rose-600/60 text-center">{language === 'th' ? 'ช้าสุด' : 'SLOWEST'}</span>
                        <input
                          type="number"
                          className="premium-input-sub-number bg-rose-500/[0.03] dark:bg-rose-500/10 border-rose-200/50 text-rose-600 focus:border-rose-500"
                          value={sub.p || ''}
                          onChange={(e) => {
                            const updated = task.subTasks?.map((st: Task) => st.id === sub.id ? { ...st, p: parseFloat(e.target.value) || 0 } : st);
                            onUpdate(task.id, { subTasks: updated });
                          }}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col gap-1 items-center justify-center min-w-[50px]">
                      <span className="premium-label-tiny text-primary/60 font-medium uppercase leading-none text-xs">{language === 'th' ? 'ค่า TE' : 'VAL'}</span>
                      <div className="text-xl font-bold font-heading text-primary h-10 flex items-center justify-center">{subTe.toFixed(1)}</div>
                    </div>

                    <div className="flex flex-col gap-1 items-center justify-center">
                      <span className="premium-label-tiny text-muted uppercase leading-none text-xs">{language === 'th' ? 'สถานะ' : 'STATUS'}</span>
                      <button
                        onClick={() => {
                          const nextStatus = sub.status === 'DONE' ? 'TODO' : 'DONE' as 'TODO' | 'DONE';
                          const updated = task.subTasks?.map((st: Task) => st.id === sub.id ? { ...st, status: nextStatus } : st);
                          onUpdate(task.id, { subTasks: updated });
                        }}
                        className={cn(
                          "px-4 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                          sub.status === 'DONE'
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-sm shadow-emerald-500/5"
                            : "bg-surface border-border hover:border-primary/50 text-muted hover:text-primary"
                        )}
                      >
                        {sub.status === 'DONE' ? (language === 'th' ? 'เสร็จสิ้น' : 'DONE') : (language === 'th' ? 'ทำทีหลัง' : 'TODO')}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-px h-8 bg-border/40 mx-2 hidden sm:block" />
                      <button
                        onClick={() => {
                          const updated = task.subTasks?.filter((st: Task) => st.id !== sub.id);
                          onUpdate(task.id, { subTasks: updated });
                        }}
                        className="premium-button-icon"
                        title={language === 'th' ? 'ลบงานย่อยนี้' : 'Delete this sub-task'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
