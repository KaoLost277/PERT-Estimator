/**
 * PERT Risk Analyzer - Core Calculations
 */
import { Task } from './store';

/**
 * Interface for raw PERT estimates provided by stakeholders.
 */
export interface PertInput {
  o: number; // Optimistic: Minimum possible duration (1 in 100 chance)
  m: number; // Most Likely: Mode of the distribution
  p: number; // Pessimistic: Maximum possible duration (1 in 100 chance)
}

/**
 * Result of the PERT input validation logic.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Comprehensive project-level statistics summary.
 */
export interface ProjectSummary {
  expectedDuration: number;
  projectSD: number;
  projectVariance: number;
  totalBudget: number;
  actualDuration: number;
  remainingDuration: number;
  confidenceInterval95: {
    lower: number;
    upper: number;
  };
}

/**
 * Calculates the Expected Duration (TE) using the PERT Beta Distribution formula.
 * Formula: TE = (O + 4M + P) / 6
 * 
 * If the task is completed ('done'), the actual duration is preferred for historical accuracy.
 * 
 * @param inputs - Object containing O, M, P values
 * @param status - Current lifecycle state of the task
 * @param actual - Recorded actual duration if completed
 * @returns The weighted average duration.
 */
export const calculateExpectedDuration = (
  { o, m, p }: PertInput,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  actual?: number
): number => {
  // If task is completed, use actual data for reality-based calculations
  if (status === 'DONE' && typeof actual === 'number' && actual > 0) {
    return actual;
  }
  
  // Standard PERT weighted average formula
  return (o + 4 * m + p) / 6;
};

/**
 * Calculates the Standard Deviation (SD) of a single task.
 * This represents the level of uncertainty in the estimate.
 * Formula: SD = (P - O) / 6
 * 
 * @param o - Optimistic duration
 * @param p - Pessimistic duration
 * @returns Statistical standard deviation.
 */
export const calculateTaskSD = (o: number, p: number): number => {
  return (p - o) / 6;
};

/**
 * Calculates the Variance of a task.
 * Note: Variance is the square of Standard Deviation. 
 * Completed tasks are considered to have zero uncertainty (0 variance).
 * 
 * @param o - Optimistic duration
 * @param p - Pessimistic duration
 * @param status - Task status
 * @returns The variance value.
 */
export const calculateTaskVariance = (o: number, p: number, status?: string): number => {
  if (status === 'DONE') return 0;
  const sd = calculateTaskSD(o, p);
  return Math.pow(sd, 2);
};

/**
 * Input structure for Project Statistics calculation.
 * Extends the basic task data with schedule information from CPM.
 */
export interface ProjectStatsInput {
  te: number;
  o: number;
  p: number;
  isCritical: boolean;
  status: string;
  actualDuration?: number;
  resourceCost?: number;
  displayId: string;
  ef: number; // Early Finish
}

/**
 * Aggregates statistics for the entire project based on Critical Path and Resource costs.
 * 
 * @param tasks - Array of calculated tasks containing schedule data
 * @returns Project summary statistics object.
 */
export const calculateProjectStats = (tasks: ProjectStatsInput[]): ProjectSummary => {
  // Filter for top-level tasks to avoid double-counting in simple flat structures
  // displayId like "1", "2" are root; "1.1" are sub-tasks
  const rootTasks = tasks.filter(t => !t.displayId.includes('.'));
  
  // Identify tasks on the Critical Path (Slack = 0)
  const criticalTasks = tasks.filter(t => t.isCritical);
  
  // Project Expected Duration is the maximum Early Finish time of all tasks
  const expectedDuration = Math.max(...tasks.map(t => t.ef), 0);
  
  // Central Limit Theorem: Project Variance = Sum of variances of independent tasks on critical path
  const projectVariance = criticalTasks.reduce(
    (sum, t) => sum + calculateTaskVariance(t.o, t.p, t.status), 
    0
  );
  const projectSD = Math.sqrt(projectVariance);

  // Total Budget: Sum of expected costs (Expected Duration * Unit Cost)
  const totalBudget = rootTasks.reduce((sum, t) => sum + (t.te * (t.resourceCost || 0)), 0);
  
  // Total Actual: Actual time recorded so far
  const totalActual = rootTasks.reduce((sum, t) => sum + (Number(t.actualDuration) || 0), 0);
  
  // Remaining: Theoretical remaining duration
  const remainingDuration = Math.max(0, expectedDuration - totalActual);

  return {
    expectedDuration,
    projectSD,
    projectVariance,
    totalBudget,
    actualDuration: totalActual,
    remainingDuration,
    // 95.4% Confidence Interval (Mean ± 2*SD) in a Normal Distribution
    confidenceInterval95: {
      lower: Math.max(0, expectedDuration - 2 * projectSD),
      upper: expectedDuration + 2 * projectSD
    }
  };
};

/**
 * Calculates the Probability of project completion within a target time.
 * Uses the Z-Score and an approximation of the Cumulative Distribution Function (CDF).
 * 
 * @param targetTime - The deadline to evaluate
 * @param expectedTime - Project TE (Mean)
 * @param sd - Project SD
 * @returns Probability as a decimal (0.0 to 1.0)
 */
export const calculateProbability = (
  targetTime: number, 
  expectedTime: number, 
  sd: number
): number => {
  if (sd <= 0) return targetTime >= expectedTime ? 1 : 0;
  
  const z = (targetTime - expectedTime) / sd;
  
  // Constants for Abramowitz and Stegun CDF approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + 1.330274 * t))));
  
  // If Z is positive, the probability is 1 - tails probability
  return z > 0 ? 1 - p : p;
};

/**
 * Generates data points for a Normal Distribution (Bell Curve) visualization.
 * 
 * @param mean - The center of the curve
 * @param sd - Scale of the distribution
 * @param pointsCount - Precision of the generated curve
 * @returns Array of {x, y, is95} coordinates for Recharts
 */
export const generateBellCurveData = (mean: number, sd: number, pointsCount = 60) => {
  if (sd <= 0) return [];
  
  const data = [];
  const range = 4 * sd; // Cover +/- 4 standard deviations
  const start = mean - range;
  const end = mean + range;
  const step = (end - start) / pointsCount;

  for (let x = start; x <= end; x += step) {
    // Probability Density Function (PDF) for Normal Distribution
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sd, 2));
    const y = (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    
    data.push({
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(5)),
      // Flag for highlighting 95% Confidence Interval in UI
      is95: x >= mean - 2 * sd && x <= mean + 2 * sd
    });
  }

  return data;
};

/**
 * Alias for generateBellCurveData to maintain compatibility with legacy imports
 */
export const generateNormalDistributionData = generateBellCurveData;

/**
 * Validates the logical sanity of PERT inputs.
 * Mandatory Rule: Optimistic (O) <= Most Likely (M) <= Pessimistic (P)
 * 
 * @param o - Minimum estimate
 * @param m - Average estimate
 * @param p - Maximum estimate
 * @returns ValidationResult with status and typed error message.
 */
export const validatePertInput = (o: number, m: number, p: number): ValidationResult => {
  if (o < 0 || m < 0 || p < 0) {
    return { isValid: false, error: 'Estimates cannot be negative' };
  }
  
  if (o > m) {
    return { isValid: false, error: 'Optimistic (O) must be less than or equal to Most Likely (M)' };
  }
  
  if (m > p) {
    return { isValid: false, error: 'Most Likely (M) must be less than or equal to Pessimistic (P)' };
  }
  
  return { isValid: true };
};

/**
 * Generates a project schedule by calculating planned start and end dates for all tasks.
 * 
 * @param tasks - Array of tasks (possibly nested)
 * @param projectStartDate - The starting point of the project
 * @param timeUnit - 'hours' or 'days' from project settings
 * @returns Array of tasks with populated plannedStartDate and plannedEndDate.
 */
export function generateProjectSchedule(tasks: Task[], projectStartDate: Date, timeUnit: 'hours' | 'days' = 'hours'): Task[] {
  // 1. Flatten tasks for CPM calculation
  const allTasksFlat: Task[] = [];
  const collect = (items: Task[]) => {
    items.forEach(t => {
      allTasksFlat.push(t);
      if (t.subTasks) collect(t.subTasks);
    });
  };
  collect(tasks);

  const processed = new Set<string>();
  let changed = true;
  
  while (processed.size < allTasksFlat.length && changed) {
    changed = false;
    
    allTasksFlat.forEach(task => {
      if (processed.has(task.id)) return;
      
      const predNums = task.predecessorsText?.match(/(\d+(?:\.\d+)*)/g) || [];
      const predecessors = allTasksFlat.filter(t => 
        predNums.some(num => String(t.sequence) === num) && t.id !== task.id
      );
      
      const allPredsProcessed = predecessors.every(p => processed.has(p.id));
      
      if (allPredsProcessed) {
        const o = Number(task.o) || 0;
        const m = Number(task.m) || 0;
        const p = Number(task.p) || 0;
        const te = (o + 4 * m + p) / 6;
        
        let startDate = new Date(projectStartDate);
        
        if (predecessors.length > 0) {
          const maxEndDate = new Date(Math.max(...predecessors.map(p => 
            new Date(p.plannedEndDate!).getTime()
          )));
          startDate = maxEndDate;
        }
        
        const durationMs = te * 60 * 60 * 1000 * (timeUnit === 'days' ? 24 : 1);
        const endDate = new Date(startDate.getTime() + durationMs);
        
        task.plannedStartDate = startDate.toISOString();
        task.plannedEndDate = endDate.toISOString();
        task.status = task.status || 'TODO';
        
        processed.add(task.id);
        changed = true;
      }
    });
  }
  
  return tasks; // Mutates original objects during collection, returning top-level
}
