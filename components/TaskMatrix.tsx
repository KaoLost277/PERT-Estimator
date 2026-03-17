'use client';

import { useProjects } from '@/lib/store';
import TaskCardView from './TaskCardView';
import AddTaskCard from './AddTaskCard';

export default function TaskMatrix() {
  const { activeProject, updateTasks } = useProjects();
  const rawTasks = activeProject?.tasks || [];

  return (
    <div className="w-full space-y-4 matrix-container">
      <AddTaskCard 
        onAdd={(newTask) => updateTasks([...rawTasks, { ...newTask, id: crypto.randomUUID() }])} 
        nextSequence={rawTasks.length > 0 ? Math.max(...rawTasks.map(t => t.sequence ?? 0)) + 1 : 1}
      />

      <TaskCardView />
    </div>
  );
}
