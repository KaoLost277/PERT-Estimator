'use client';

import React, { useMemo, useRef } from 'react';
import {
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  ListTodo,
  AlertTriangle
} from 'lucide-react';
import { useProjects, Task } from '@/lib/store';
import { calculatePERT, calculateProjectStats, CalculatedTask } from '@/lib/logic';
import { exportToExcel, importFromFile } from '@/lib/exportUtils';
import SummaryStats from '@/components/SummaryStats';
import RiskChart from '@/components/RiskChart';
import DashboardTaskCard from '@/components/DashboardTaskCard';
import { translations } from '@/lib/i18n';

export default function DashboardPage() {
  const { activeProject, language, updateTasks } = useProjects();
  const t = translations[language];

  // สถานะสำหรับงานทั้งหมด (Raw tasks)
  const tasks = activeProject?.tasks || [];

  // การคำนวณสถิติ
  const { stats, calculatedTasks, totalTasks, completedTasks, delayedTasks } = useMemo(() => {
    if (tasks.length === 0) return { stats: null, calculatedTasks: [], totalTasks: 0, completedTasks: 0, delayedTasks: 0 };

    const today = new Date().toLocaleDateString('en-CA');

    // ใช้ logic.ts สำหรับหา Critical Path และ Project Duration (max EF)
    const { results } = calculatePERT(tasks);

    // ใช้ logic.ts สำหรับสถิติโปรเจกต์ ซึ่งเชื่อมโยงกับ calculations.ts ภายหลัง
    const pertStats = calculateProjectStats(results);

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
      // 1. Check itself
      if (checkIsDelayedRaw(t)) return true;
      // 2. Check all parents in hierarchy
      const displayIdParts = t.displayId.split('.');
      for (let i = 1; i < displayIdParts.length; i++) {
        const parentId = displayIdParts.slice(0, i).join('.');
        const parent = results.find(p => p.displayId === parentId);
        if (parent && checkIsDelayedRaw(parent)) return true;
      }
      return false;
    };

    const delayedTasksCount = results.filter(t => !t.isGroup && isTaskEffectivelyDelayed(t)).length;

    return {
      stats: pertStats,
      calculatedTasks: results,
      totalTasks: results.filter(t => !t.isGroup).length,
      completedTasks: results.filter(t => !t.isGroup && t.status === 'DONE').length,
      delayedTasks: delayedTasksCount
    };
  }, [tasks]);

  const addGroup = () => {
    const newGroup: Task = {
      id: crypto.randomUUID(),
      name: '',
      o: 0,
      m: 0,
      p: 0,
      status: 'TODO',
      isGroup: true,
      subTasks: [],
      sequence: tasks.length + 1,
    };
    updateTasks([...tasks, newGroup]);
  };


  const updateTask = (id: string, updates: Partial<Task>) => {
    updateTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTask = (id: string) => {
    updateTasks(tasks.filter(t => t.id !== id));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedTasks = await importFromFile(file);
      const tasksWithIds = importedTasks.map(it => ({
        ...it,
        id: it.id || crypto.randomUUID(),
        name: it.name || '',
        o: it.o || 0,
        m: it.m || 0,
        p: it.p || 0,
        status: it.status || 'TODO',
        sequence: tasks.length + 1
      })) as Task[];

      updateTasks([...tasks, ...tasksWithIds]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Import failed:', error);
      alert(language === 'th' ? 'นำเข้าข้อมูลล้มเหลว' : 'Import failed');
    }
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500 font-bold uppercase tracking-widest">
        Please select or create a project
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard size={20} className="text-primary" />
            </div>
            <h2 className="text-[12px] font-medium text-muted/60 uppercase tracking-[0.3em]">
              {language === 'th' ? 'แดชบอร์ด' : 'Dashboard'}
            </h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground tracking-tight">
            PERT Risk Analyzer
          </h1>
          <p className="mt-4 text-slate-400 font-normal text-sm sm:text-base uppercase tracking-wide leading-relaxed">
            {language === 'th'
              ? 'เครื่องมือวิเคราะห์ความเสี่ยงโครงการด้วยสถิติ PERT'
              : 'Reliable project estimation and risk analysis tool'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-2.5 bg-surface hover:bg-white hover:text-black rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all border border-border active:scale-95 group"
          >
            <FileSpreadsheet size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            {language === 'th' ? 'นำเข้า' : 'IMPORT'}
          </button>
          <button
            onClick={() => exportToExcel(activeProject, calculatedTasks, t.table)}
            className="flex items-center gap-2 px-6 py-2.5 bg-surface hover:bg-white hover:text-black rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all border border-border active:scale-95 group"
          >
            <Download size={16} className="text-primary group-hover:scale-110 transition-transform" />
            {language === 'th' ? 'ส่งออก' : 'EXPORT'}
          </button>
        </div>
      </header>

      {/* Stats & Chart Section */}
      <section className="space-y-6">
        {delayedTasks > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-500">
                  {language === 'th' ? 'พบงานที่ล่าช้า!' : 'Delay Detected!'}
                </h3>
                <p className="text-sm text-rose-500/80 font-medium">
                  {language === 'th'
                    ? `มีจำนวน ${delayedTasks} รายการที่เกินกำหนดระยะเวลาตามแผน`
                    : `There are ${delayedTasks} items that have exceeded their planned schedule.`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const element = document.getElementById('project-tasks-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-rose-500/20"
            >
              {language === 'th' ? 'ดูรายการงาน' : 'VIEW TASKS'}
            </button>
          </div>
        )}

        {stats && (
          <>
            <SummaryStats
              expectedDuration={stats.expectedDuration}
              projectVariance={stats.projectVariance}
              safeDate95={stats.confidenceInterval95.upper}
              timeUnit={activeProject.timeUnit || 'days'}
              totalTasks={totalTasks}
              completedTasks={completedTasks}
              delayedTasks={delayedTasks}
            />
            <RiskChart
              mean={stats.expectedDuration}
              sd={stats.projectSD}
            />
          </>
        )}
      </section>

      {/* Tasks Table/List Section */}
      <section id="project-tasks-section" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-foreground">
            <ListTodo size={24} className="text-primary" />
            <h3 className="text-xl font-bold">{language === 'th' ? 'รายการงานของโครงการ' : 'Project Tasks'}</h3>
            <span className="px-2 py-0.5 bg-surface rounded-md text-[10px] font-bold text-muted border border-border">
              {tasks.length} {language === 'th' ? 'รายการ' : 'TASKS'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addGroup}
              className="flex items-center gap-2 px-8 py-2.5 bg-primary hover:bg-primary/90 text-background rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 group"
            >
              <LayoutDashboard size={18} className="text-background group-hover:scale-110 transition-transform" />
              {language === 'th' ? 'สร้างกลุ่มงานใหม่' : 'Create New Work Group'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {calculatedTasks
            .filter(task => !task.displayId.includes('.'))
            .map(task => (
              <DashboardTaskCard
                key={task.id}
                task={task}
                allTasks={tasks}
                onUpdate={updateTask}
                onRemove={removeTask}
                language={language}
              />
            ))}

          {tasks.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-5 mt-2">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-primary uppercase tracking-normal mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {language === 'th' ? 'รวมทั้งหมด' : 'Grand Total'}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card-bg rounded-2xl px-5 py-4 border border-border/80">
                      <div className="premium-label-tiny mb-2">{language === 'th' ? 'รวม O' : 'Total O'}</div>
                      <div className="text-2xl font-mono font-bold text-blue-500 dark:text-blue-400 tracking-tight">
                        {calculatedTasks.filter(t => !t.displayId.includes('.')).reduce((acc: number, t: Task) => acc + (Number(t.o) || 0), 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-card-bg rounded-2xl px-5 py-4 border border-border/80">
                      <div className="premium-label-tiny mb-2">{language === 'th' ? 'รวม M' : 'Total M'}</div>
                      <div className="text-2xl font-mono font-bold text-foreground tracking-tight">
                        {calculatedTasks.filter(t => !t.displayId.includes('.')).reduce((acc: number, t: Task) => acc + (Number(t.m) || 0), 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-card-bg rounded-2xl px-5 py-4 border border-border/80">
                      <div className="premium-label-tiny mb-2">{language === 'th' ? 'รวม P' : 'Total P'}</div>
                      <div className="text-2xl font-mono font-bold text-rose-500 dark:text-rose-400 tracking-tight">
                        {calculatedTasks.filter(t => !t.displayId.includes('.')).reduce((acc: number, t: Task) => acc + (Number(t.p) || 0), 0).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border/40 rounded-[32px] bg-card-bg/30">
              <div className="inline-flex p-5 bg-surface rounded-2xl mb-6">
                <LayoutDashboard size={40} className="text-primary" />
              </div>
              <p className="text-muted font-black tracking-[0.1em] uppercase text-xs">
                {language === 'th' ? 'ยังไม่มีรายการงาน เริ่มต้นเพิ่มงานแรกของคุณ' : 'No tasks yet. Start by adding your first task.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer Info */}
      <footer className="pt-10 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Booking Apps Premium Dark</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>React 19 + Next.js</span>
          </div>
        </div>
        <div className="text-muted/60 text-right uppercase">
          Dynamic Theme Consistency Fix
        </div>
      </footer>
    </div>
  );
}
