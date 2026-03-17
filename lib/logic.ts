/**
 * PERT Calculation Engine
 * 
 * This module handles the Critical Path Method (CPM) and PERT distribution analysis.
 * It performs forward and backward passes to calculate ES, EF, LS, LF, Slack, and Criticality.
 */

import { Task } from './store';
import { 
  calculateExpectedDuration, 
  calculateTaskVariance, 
  calculateProjectStats as calculateStats,
  ProjectStatsInput
} from './calculations';

/**
 * Interface representing a task with its calculated schedule and risk metrics.
 */
export interface CalculatedTask extends Task {
  te: number;             // Expected Duration
  variance: number;       // Statistical Variance
  predecessors: string[]; // Resolved UUIDs of predecessors
  displayId: string;      // Dot-notation ID for UI (e.g., "1.1")
  es: number;             // Early Start
  ef: number;             // Early Finish
  ls: number;             // Late Start
  lf: number;             // Late Finish
  slack: number;          // Total Float (LF - EF)
  isCritical: boolean;    // Flag for Critical Path membership
}

/**
 * Transforms a hierarchical task tree into a flat array of calculated tasks.
 * Appropriately aggregates O, M, P values for group tasks from their direct children.
 * 
 * @param tasks - The source tree of tasks from the store
 * @param prefix - Accumulated display ID prefix for recursion
 * @returns Flat array of tasks with initialized metrics.
 */
function flattenAndInitializeTasks(tasks: Task[], prefix = ""): CalculatedTask[] {
  let flat: CalculatedTask[] = [];
  
  // Ensure consistent ordering based on sequence or array index
  const sortedTasks = [...tasks].sort((a, b) => {
    const seqA = a.sequence ?? (tasks.indexOf(a) + 1);
    const seqB = b.sequence ?? (tasks.indexOf(b) + 1);
    return seqA - seqB;
  });

  sortedTasks.forEach((t, i) => {
    const seq = t.sequence ?? (i + 1);
    const dId = prefix ? `${prefix}.${seq}` : `${seq}`;

    // Aggregation logic for Group Tasks
    let o = Number(t.o) || 0;
    let m = Number(t.m) || 0;
    let p = Number(t.p) || 0;
    let actual = Number(t.actualDuration) || 0;

    if (t.isGroup && t.subTasks && t.subTasks.length > 0) {
      o = t.subTasks.reduce((sum, sub) => sum + (Number(sub.o) || 0), 0);
      m = t.subTasks.reduce((sum, sub) => sum + (Number(sub.m) || 0), 0);
      p = t.subTasks.reduce((sum, sub) => sum + (Number(sub.p) || 0), 0);
      actual = t.subTasks.reduce((sum, sub) => sum + (Number(sub.actualDuration) || 0), 0);
    }

    const te = calculateExpectedDuration({ o, m, p }, t.status, actual);
    const variance = calculateTaskVariance(o, p, t.status);

    const ct: CalculatedTask = {
      ...t,
      o, m, p, 
      actualDuration: actual,
      te,
      variance,
      predecessors: [],
      displayId: dId,
      es: 0,
      ef: 0,
      ls: 0,
      lf: 0,
      slack: 0,
      isCritical: false,
    };

    flat.push(ct);

    // Recursive flattening of child tasks
    if (t.isGroup && t.subTasks && t.subTasks.length > 0) {
      flat = [...flat, ...flattenAndInitializeTasks(t.subTasks, dId)];
    }
  });

  return flat;
}

/**
 * Orchestrates the PERT analysis using Forward and Backward Scheduling passes.
 * Identifies the Critical Path and potential schedule risks.
 * 
 * @param tasks - Raw project tasks from state
 * @returns Result object with calculated tasks or an error if logic fails (e.g., cycles).
 */
export function calculatePERT(tasks: Task[]): { results: CalculatedTask[], error?: string } {
  if (tasks.length === 0) return { results: [] };

  const results = flattenAndInitializeTasks(tasks);
  const idToTask = new Map(results.map(t => [t.id, t]));
  const displayIdToId = new Map(results.map(t => [t.displayId, t.id]));

  // 1. Resolve Predecessors from string input (e.g., "1, 2.1") to UUIDs
  results.forEach((t) => {
    if (t.predecessorsText?.trim()) {
      const matches = t.predecessorsText.match(/(\d+(?:\.\d+)*)/g);
      if (matches) {
        const predIds = matches
          .map(m => displayIdToId.get(m))
          .filter(id => !!id && id !== t.id) as string[];
        t.predecessors = Array.from(new Set(predIds));
      }
    }
  });

  // 2. Forward Pass: Calculate Early Start (ES) and Early Finish (EF)
  const processed = new Set<string>();
  let changed = true;
  let iterations = 0;
  const maxIterations = results.length * 2;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    results.forEach(t => {
      if (processed.has(t.id)) return;
      
      const allPredsProcessed = t.predecessors.every(id => processed.has(id));
      if (allPredsProcessed) {
        const maxPredEf = t.predecessors.length > 0 
          ? Math.max(...t.predecessors.map(id => idToTask.get(id)?.ef || 0))
          : 0;
        
        t.es = maxPredEf;
        t.ef = t.es + t.te;
        processed.add(t.id);
        changed = true;
      }
    });
  }

  // Safety check for circular dependencies
  if (processed.size < results.length) {
    return { results, error: 'Circular dependency detected in project schedule' };
  }

  // 3. Backward Pass: Calculate Late Start (LS), Late Finish (LF), and Slack
  const projectDuration = Math.max(...results.map(t => t.ef), 0);
  const successors = new Map<string, string[]>();

  // Map successors for efficient traversal
  results.forEach(t => {
    t.predecessors.forEach(predId => {
      if (!successors.has(predId)) successors.set(predId, []);
      successors.get(predId)!.push(t.id);
    });
  });

  const revProcessed = new Set<string>();
  changed = true;
  while (changed) {
    changed = false;
    results.forEach(t => {
      if (revProcessed.has(t.id)) return;
      const taskSuccessors = successors.get(t.id) || [];
      const allSuccsProcessed = taskSuccessors.every(id => revProcessed.has(id));
      
      if (allSuccsProcessed) {
        const minSuccLs = taskSuccessors.length > 0
          ? Math.min(...taskSuccessors.map(id => idToTask.get(id)?.ls || projectDuration))
          : projectDuration;
        
        t.lf = minSuccLs;
        t.ls = t.lf - t.te;
        t.slack = t.lf - t.ef;
        
        // Logical rule: Task is critical if it has negligible slack and isn't already finished
        t.isCritical = Math.abs(t.slack) < 0.001 && t.status !== 'DONE'; 
        
        revProcessed.add(t.id);
        changed = true;
      }
    });
  }

  return { results };
}

/**
 * Higher-level utility to generate project stats from the calculated results.
 * 
 * @param calculatedTasks - Tasks with schedule and variance data
 */
export function calculateProjectStats(calculatedTasks: CalculatedTask[]) {
  return calculateStats(calculatedTasks as unknown as ProjectStatsInput[]);
}
