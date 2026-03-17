'use client';

import { useProjects } from '@/lib/store';
import { Plus, Folder, Trash2, Edit2, Copy, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ThemeToggle } from './ThemeToggle';
import { translations } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { projects, activeProject, setActiveProjectId, createProject, deleteProject, renameProject, duplicateProject, language, setLanguage } = useProjects();
  const t = translations[language].sidebar;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleCreate = () => {
    createProject(t.untitiled);
  };

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const submitRename = (id: string) => {
    if (editName.trim()) {
      renameProject(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "shrink-0 bg-sidebar-bg border-r border-border/60 flex flex-col z-50 transition-all duration-300",
        // Desktop: always visible sidebar
        "md:relative md:w-64 lg:w-72 md:h-screen md:translate-x-0",
        // Mobile: slide-out drawer
        "fixed top-0 left-0 h-full w-72",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-6 pb-2 border-b border-border/40 md:border-b-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/90 rounded-2xl flex items-center justify-center">
              <ChevronRight size={20} className="text-black" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-lg tracking-tight text-foreground leading-none">PERT Estimator</h1>
              <span className="text-xs font-bold text-muted uppercase tracking-[0.2em] mt-1">Estimator Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-foreground">
            <button
              onClick={handleCreate}
              className="hidden md:flex p-2 hover:bg-surface rounded-xl transition-colors"
              title={t.newProject}
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-2 hover:bg-surface rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-0.5 px-3 md:px-4 pb-4">
          <div className="flex md:hidden items-center justify-between mb-3 mt-3 px-2">
            <span className="text-sm font-semibold text-muted uppercase tracking-wider">{t.projects}</span>
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Plus size={16} /> {language === 'en' ? 'New' : 'เพิ่ม'}
            </button>
          </div>
          <div className="hidden md:block text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-3 mt-1">{t.recentProjects}</div>

          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm",
                activeProject?.id === project.id
                  ? "bg-accent text-primary font-medium border border-primary/20"
                  : "hover:bg-accent/50 text-muted hover:text-foreground"
              )}
              onClick={() => {
                setActiveProjectId(project.id);
                setIsMobileOpen(false);
              }}
            >
              <Folder size={15} className={cn(activeProject?.id === project.id ? "text-primary" : "text-muted/60")} />
              {editingId === project.id ? (
                <input
                  autoFocus
                  className="bg-transparent border-none outline-none flex-1 py-0 px-1 text-sm text-foreground"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => submitRename(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename(project.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
              ) : (
                <span className="truncate flex-1">{project.name}</span>
              )}

              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); startRename(project.id, project.name); }}
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateProject(project.id); }}
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-md"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-border/40 mx-3 md:mx-4 mb-3 md:mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 p-2 rounded-xl text-sm font-medium hover:bg-surface cursor-pointer transition-colors flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent border border-primary/20 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                <span className="text-primary">U</span>
              </div>
              <span className="text-muted truncate">{t.userProfile}</span>
            </div>
            <div className="flex items-center gap-1 px-1">
              <button
                onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-xs font-bold border border-border/40 transition-colors uppercase"
                title={language === 'en' ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ'}
              >
                {language === 'en' ? 'TH' : 'EN'}
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar with hamburger - part of document flow */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4 glass border-b border-border/30",
        isMobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 hover:bg-surface rounded-xl transition-colors text-foreground"
          >
            <Menu size={20} />
          </button>
          <span className="ml-2 font-bold text-sm tracking-tight text-foreground">PERT Estimator</span>
        </div>
        <ThemeToggle />
      </div>
    </>
  );
}
