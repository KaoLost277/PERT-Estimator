'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from './i18n';

export interface Task {
  id: string;
  name: string;
  o: number | string; // Optimistic
  m: number | string; // Most likely
  p: number | string; // Pessimistic
  assignee?: string;
  resourceCost?: number;
  actualDuration?: number | string;
  predecessorsText?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'; // Updated to uppercase per requirements
  sequence?: number;
  isGroup?: boolean;
  subTasks?: Task[];
  // New Execution fields
  plannedStartDate?: string; // ISO string
  plannedEndDate?: string;   // ISO string
  actualStartDate?: string | null;
  actualEndDate?: string | null;
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  resources?: string[];
  timeUnit?: 'days' | 'hours';
  estimationMode?: 'three-point' | 'single-point';
  updatedAt: string;
}

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  setActiveProjectId: (id: string) => void;
  createProject: (name: string) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  updateTasks: (tasks: Task[]) => void;
  updateProjectSettings: (id: string, updates: Partial<Project>) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [initialized, setInitialized] = useState(false);

  // Initialize from LocalStorage on mount to avoid Hydration Mismatch in Next.js
  useEffect(() => {
    const saved = localStorage.getItem('pert-projects');
    const savedLang = localStorage.getItem('pert-language');

    requestAnimationFrame(() => {
      // 1. Handle Language
      if (savedLang === 'en' || savedLang === 'th') {
        setLanguage(savedLang as Language);
      }

      // 2. Handle Projects (Load or Default)
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const migrated = parsed.map((p: Project) => ({
            ...p,
            timeUnit: p.timeUnit || 'hours'
          }));
          setProjects(migrated);
          if (migrated.length > 0) {
            setActiveProjectId(migrated[0].id);
          }
        } catch (e) {
          console.error('Failed to load projects', e);
          const defaultProject: Project = {
            id: crypto.randomUUID(),
            name: 'Untitled Project',
            tasks: [],
            timeUnit: 'hours',
            estimationMode: 'three-point',
            updatedAt: new Date().toISOString(),
          };
          setProjects([defaultProject]);
          setActiveProjectId(defaultProject.id);
        }
      } else {
        const defaultProject: Project = {
          id: crypto.randomUUID(),
          name: 'Untitled Project',
          tasks: [],
          timeUnit: 'hours',
          estimationMode: 'three-point',
          updatedAt: new Date().toISOString(),
        };
        setProjects([defaultProject]);
        setActiveProjectId(defaultProject.id);
      }
      setInitialized(true);
    });
  }, []);

  // Save to LocalStorage whenever projects change (after initialization)
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('pert-projects', JSON.stringify(projects));
      localStorage.setItem('pert-language', language);
    }
  }, [projects, language, initialized]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  const createProject = (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      tasks: [],
      resources: [],
      timeUnit: 'hours',
      estimationMode: 'three-point',
      updatedAt: new Date().toISOString(),
    };
    setProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
  };

  const renameProject = (id: string, name: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p));
  };

  const deleteProject = (id: string) => {
    const filtered = projects.filter(p => p.id !== id);
    setProjects(filtered);
    if (activeProjectId === id) {
      setActiveProjectId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const duplicateProject = (id: string) => {
    const original = projects.find(p => p.id === id);
    if (original) {
      const duplicated: Project = {
        ...original,
        id: crypto.randomUUID(),
        name: `${original.name} (Copy)`,
        timeUnit: original.timeUnit || 'days',
        estimationMode: original.estimationMode || 'three-point',
        resources: original.resources ? [...original.resources] : [],
        updatedAt: new Date().toISOString(),
        tasks: original.tasks.map(t => ({ ...t })),
      };
      setProjects([duplicated, ...projects]);
      setActiveProjectId(duplicated.id);
    }
  };

  const updateTasks = (tasks: Task[]) => {
    if (activeProjectId) {
      setProjects(projects.map(p => p.id === activeProjectId ? { ...p, tasks, updatedAt: new Date().toISOString() } : p));
    }
  };

  const updateProjectSettings = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      activeProject, 
      language,
      setLanguage,
      setActiveProjectId, 
      createProject, 
      renameProject, 
      deleteProject, 
      duplicateProject,
      updateTasks,
      updateProjectSettings
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}

/**
 * Utility to flatten a nested task structure into a single array of leaf tasks.
 */
export function flattenTasks(tasks: Task[]): Task[] {
  let flat: Task[] = [];
  tasks.forEach(task => {
    // Normalize status to uppercase for consistency
    const status = (task.status?.toUpperCase() || 'TODO') as 'TODO' | 'IN_PROGRESS' | 'DONE';
    const normalizedTask = { ...task, status };

    if (task.subTasks && task.subTasks.length > 0) {
      flat = [...flat, ...flattenTasks(task.subTasks)];
    } else {
      flat.push(normalizedTask);
    }
  });
  return flat;
}
