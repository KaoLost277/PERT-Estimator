import * as XLSX from 'xlsx';
import { Project, Task } from './store';
import { CalculatedTask } from './logic';

export const exportToExcel = (project: Project, tasks: CalculatedTask[], t: { [key: string]: string }) => {
  const data = tasks.map((task, idx) => ({
    [t.id]: `T${idx + 1}`,
    [t.taskName]: task.name,
    'Optimistic (O)': task.o,
    'Most Likely (M)': task.m,
    'Pessimistic (P)': task.p,
    'Expected (TE)': task.te.toFixed(2),
    'Assignee': task.assignee || '-',
    'Actual': task.actualDuration || 0,
    'Slack': task.slack.toFixed(2),
    'Critical': task.isCritical ? 'Yes' : 'No',
    [t.status]: task.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "PERT Report");
  
  XLSX.writeFile(workbook, `${project.name.replace(/\s+/g, '_')}_Report.xlsx`);
};

export const importFromFile = async (file: File): Promise<Partial<Task>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        const getVal = (row: Record<string, unknown>, keys: string[]) => {
          for (const k of keys) {
            if (row[k] !== undefined) return row[k];
          }
          return undefined;
        };

        // Map columns to Task interface, supporting both English and Thai exported headers
        const importedTasks: Partial<Task>[] = jsonData.map((row) => {
          const rawStatus = getVal(row, ['Status', 'status', 'สถานะ']);
          let parsedStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' = 'TODO';
          
          if (typeof rawStatus === 'string') {
            const lower = rawStatus.toLowerCase();
            if (lower === 'done' || lower === 'เสร็จสิ้น') parsedStatus = 'DONE';
            else if (lower === 'in progress' || lower === 'in-progress' || lower === 'กำลังทำ') parsedStatus = 'IN_PROGRESS';
          }

          return {
            id: crypto.randomUUID(),
            name: String(getVal(row, ['Name', 'taskName', 'Task Name', 'ชื่อโครงการ/งาน', 'ชื่องาน', 'งาน']) || 'Unnamed Task'),
            o: parseFloat(String(getVal(row, ['Optimistic (O)', 'Optimistic', 'O', 'o']) || 0)),
            m: parseFloat(String(getVal(row, ['Most Likely (M)', 'Most Likely', 'M', 'm']) || 0)),
            p: parseFloat(String(getVal(row, ['Pessimistic (P)', 'Pessimistic', 'P', 'p']) || 0)),
            assignee: String(getVal(row, ['Assignee', 'ผู้รับผิดชอบ']) || ''),
            actualDuration: parseFloat(String(getVal(row, ['Actual', 'Act', 'ทำจริง', 'Actual Duration']) || 0)),
            predecessorsText: getVal(row, ['Predecessors', 'Pred', 'ทำต่อจากงาน']) ? String(getVal(row, ['Predecessors', 'Pred', 'ทำต่อจากงาน'])) : '',
            status: parsedStatus,
            subTasks: [],
          };
        });

        resolve(importedTasks);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
