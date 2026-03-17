import { describe, it, expect } from 'vitest';
import { 
  calculateExpectedDuration, 
  calculateTaskSD, 
  calculateTaskVariance, 
  validatePertInput,
  calculateProbability,
  calculateProjectStats,
  generateBellCurveData,
  generateNormalDistributionData,
  PertInput,
  ProjectStatsInput
} from './calculations';

describe('PERT Calculations', () => {
  describe('calculateExpectedDuration (TE)', () => {
    it('should calculate TE correctly using (O + 4M + P) / 6', () => {
      const inputs: PertInput = { o: 2, m: 4, p: 12 };
      // (2 + 4*4 + 12) / 6 = (2 + 16 + 12) / 6 = 30 / 6 = 5
      expect(calculateExpectedDuration(inputs, 'TODO')).toBe(5);
    });

    it('should return actual duration if task is DONE and actual is provided', () => {
      const inputs: PertInput = { o: 2, m: 4, p: 12 };
      expect(calculateExpectedDuration(inputs, 'DONE', 8)).toBe(8);
    });

    it('should fall back to PERT formula if task is DONE but actual is 0 or invalid', () => {
      const inputs: PertInput = { o: 2, m: 4, p: 12 };
      expect(calculateExpectedDuration(inputs, 'DONE', 0)).toBe(5);
    });
  });

  describe('calculateTaskSD', () => {
    it('should calculate SD correctly using (P - O) / 6', () => {
      // (12 - 6) / 6 = 1
      expect(calculateTaskSD(6, 12)).toBe(1);
      // (10 - 2) / 6 = 1.333...
      expect(calculateTaskSD(2, 10)).toBeCloseTo(1.3333, 4);
    });
  });

  describe('calculateTaskVariance', () => {
    it('should return 0 for DONE tasks', () => {
      expect(calculateTaskVariance(2, 10, 'DONE')).toBe(0);
    });

    it('should calculate variance as SD squared for non-DONE tasks', () => {
      // SD = (8-2)/6 = 1. Variance = 1^2 = 1
      expect(calculateTaskVariance(2, 8, 'TODO')).toBe(1);
    });
  });

  describe('validatePertInput', () => {
    it('should validate correctly when O <= M <= P', () => {
      expect(validatePertInput(1, 2, 3).isValid).toBe(true);
      expect(validatePertInput(2, 2, 2).isValid).toBe(true);
    });

    it('should fail when O > M', () => {
      const result = validatePertInput(5, 4, 6);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Optimistic (O) must be less than or equal to Most Likely (M)');
    });

    it('should fail when M > P', () => {
      const result = validatePertInput(2, 5, 4);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Most Likely (M) must be less than or equal to Pessimistic (P)');
    });

    it('should fail when values are negative', () => {
      expect(validatePertInput(-1, 2, 3).isValid).toBe(false);
    });
  });

  describe('calculateProbability', () => {
    it('should return 0.5 when target time equals expected time', () => {
      expect(calculateProbability(10, 10, 2)).toBeCloseTo(0.5, 2);
    });

    it('should return approx 0.84 for target = mean + 1SD', () => {
      // 1 standard deviation above mean is ~84% in normal distribution
      expect(calculateProbability(12, 10, 2)).toBeGreaterThan(0.8);
      expect(calculateProbability(12, 10, 2)).toBeLessThan(0.85);
    });

    it('should return 1 or 0 if SD is 0', () => {
      expect(calculateProbability(11, 10, 0)).toBe(1);
      expect(calculateProbability(9, 10, 0)).toBe(0);
    });
  });

  describe('calculateProjectStats', () => {
    it('should correctly sum critical path variance and handle root tasks', () => {
       const tasks: ProjectStatsInput[] = [
         { displayId: '1', te: 5, o: 2, p: 8, isCritical: true, status: 'TODO', ef: 5, resourceCost: 100 },
         { displayId: '2', te: 5, o: 2, p: 8, isCritical: true, status: 'TODO', ef: 10, resourceCost: 50 },
         { displayId: '2.1', te: 3, o: 1, p: 5, isCritical: false, status: 'TODO', ef: 8, resourceCost: 0 }, // subtask
       ];

       const stats = calculateProjectStats(tasks);
       
       // Max EF is 10
       expect(stats.expectedDuration).toBe(10);
       
       // Critical Variance: Task 1 Var (1^2 = 1) + Task 2 Var (1^2 = 1) = 2
       expect(stats.projectVariance).toBe(2);
       expect(stats.projectSD).toBe(Math.sqrt(2));

       // Total Budget: (5 * 100) + (5 * 50) = 500 + 250 = 750
       expect(stats.totalBudget).toBe(750);
    });

    it('should calculate confidence intervals correctly (Mean +/- 2SD)', () => {
      const tasks: ProjectStatsInput[] = [
        { displayId: '1', te: 10, o: 4, p: 16, isCritical: true, status: 'TODO', ef: 10 },
      ];
      // SD = (16-4)/6 = 2. Variance = 4.
      const stats = calculateProjectStats(tasks);
      expect(stats.expectedDuration).toBe(10);
      expect(stats.projectSD).toBe(2);
      expect(stats.confidenceInterval95.lower).toBe(6); // 10 - 2*2
      expect(stats.confidenceInterval95.upper).toBe(14); // 10 + 2*2
    });

    it('should return 0 for stats when no tasks provided', () => {
      const stats = calculateProjectStats([]);
      expect(stats.expectedDuration).toBe(0);
      expect(stats.projectVariance).toBe(0);
    });
  });

  describe('generateBellCurveData', () => {

    it('should generate requested number of points', () => {
      const data = generateBellCurveData(10, 2, 20);
      expect(data.length).toBeGreaterThanOrEqual(20);
    });

    it('should have highest Y value at the mean', () => {
      const data = generateBellCurveData(10, 2, 40);
      const maxY = Math.max(...data.map(d => d.y));
      const meanPoint = data.find(d => d.x === 10);
      if (meanPoint) {
        expect(meanPoint.y).toBeCloseTo(maxY, 2);
      }
    });

    it('should return empty array if SD is 0', () => {
      const data = generateBellCurveData(10, 0);
      expect(data).toEqual([]);
    });

    it('should work via generateNormalDistributionData alias', () => {
      const data = generateNormalDistributionData(10, 2, 20);
      expect(data.length).toBeGreaterThanOrEqual(20);
    });
  });
});
