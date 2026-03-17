'use client';

import { useState } from 'react';
import { translations } from '@/lib/i18n';
import { Task, useProjects } from '@/lib/store';
import { Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTaskCardProps {
  onAdd: (task: Omit<Task, 'id'>) => void;
  nextSequence: number;
}

export default function AddTaskCard({ onAdd, nextSequence }: AddTaskCardProps) {
  const { language } = useProjects();

  const [name, setName] = useState('');
  const [o, setO] = useState<number | ''>('');
  const [m, setM] = useState<number | ''>('');
  const [p, setP] = useState<number | ''>('');
  const [predecessorsText, setPredecessorsText] = useState('');
  const [assignee, setAssignee] = useState('');



  const handleAdd = () => {
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      o: Number(o) || 0,
      m: Number(m) || 0,
      p: Number(p) || 0,
      status: 'TODO',
      sequence: nextSequence,
      predecessorsText: predecessorsText.trim(),
      assignee: assignee.trim(),
    });

    // Reset form
    setName('');
    setO('');
    setM('');
    setP('');
    setPredecessorsText('');
    setAssignee('');
  };

  return (
    <div className="premium-card p-6 animate-scale-in">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <Plus size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">{translations[language].matrix.addTask}</h3>
            <p className="text-xs font-bold text-muted uppercase tracking-widest">{language === 'th' ? 'เพิ่มกิจกรรมใหม่ลงในแผนงาน' : 'Add new activity to the plan'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="premium-label-tiny">{translations[language].matrix.taskName}</label>
            <input
              type="text"
              className="premium-input-flat text-lg font-bold w-full bg-surface/30 border border-border/20 rounded-xl px-4 py-3 focus:bg-surface/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={translations[language].matrix.taskName}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="premium-label-tiny text-blue-500">{translations[language].matrix.opt}</label>
              <input
                type="number"
                className="premium-input-number text-blue-500 bg-blue-50/30"
                value={o === 0 ? '' : o}
                onChange={(e) => setO(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="premium-label-tiny text-slate-500">{translations[language].matrix.likely}</label>
              <input
                type="number"
                className="premium-input-number text-foreground bg-slate-50/30"
                value={m === 0 ? '' : m}
                onChange={(e) => setM(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="premium-label-tiny text-rose-500">{translations[language].matrix.pess}</label>
              <input
                type="number"
                className="premium-input-number text-rose-500 bg-rose-50/30"
                value={p === 0 ? '' : p}
                onChange={(e) => setP(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="premium-label-tiny">{translations[language].matrix.predecessors}</label>
              <input
                type="text"
                className="premium-input-number w-full"
                value={predecessorsText}
                onChange={(e) => setPredecessorsText(e.target.value)}
                placeholder="e.g. 1, 2"
              />
            </div>
            <div className="flex-1 space-y-1.5 w-full">
              <label className="premium-label-tiny">{translations[language].matrix.assignee}</label>
              <div className="relative">
                <input
                  type="text"
                  className="premium-input-number w-full pl-9"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder={translations[language].matrix.assignee}
                />
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              className={cn(
                "h-[42px] px-8 rounded-xl text-sm font-bold uppercase tracking-widest transition-all active:scale-95 shrink-0 w-full md:w-auto",
                name.trim() 
                  ? "bg-primary text-white hover:bg-primary/90" 
                  : "bg-surface text-muted cursor-not-allowed border border-border/50"
              )}
            >
              <Plus size={18} className="inline-block mr-2" />
              {translations[language].matrix.addTask}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
