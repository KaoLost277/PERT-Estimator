'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { calculateProbability, generateBellCurveData } from '@/lib/calculations';
import { useProjects } from '@/lib/store';

interface RiskChartProps {
  mean: number;
  sd: number;
}

export default function RiskChart({ mean, sd }: RiskChartProps) {
  const [targetDate, setTargetDate] = React.useState<number>(Math.round(mean * 10) / 10);
  const { language } = useProjects();

  // Sync targetDate with mean when mean changes significantly (e.g. project changes)
  const prevMean = React.useRef(mean);
  React.useEffect(() => {
    if (Math.abs(prevMean.current - mean) > 0.1) {
      setTargetDate(Math.round(mean * 10) / 10);
      prevMean.current = mean;
    }
  }, [mean]);

  const probability = useMemo(() => {
    return calculateProbability(targetDate, mean, sd);
  }, [targetDate, mean, sd]);

  const chartData = useMemo(() => {
    return generateBellCurveData(mean, sd);
  }, [mean, sd]);

  const labels = {
    th: {
      probabilityTitle: 'การวิเคราะห์ความเสี่ยงโครงการ',
      targetLabel: 'เป้าหมายระยะเวลา',
      probLabel: 'โอกาสสำเร็จ',
      normalDist: 'การวิเคราะห์การกระจายตัวแบบปกติ (PERT)',
      probabilityDensity: 'ความหนาแน่นของความน่าจะเป็น',
    },
    en: {
      probabilityTitle: 'Project Risk Analysis',
      targetLabel: 'Target Duration',
      probLabel: 'Probability',
      normalDist: 'Normal Distribution Analysis (PERT)',
      probabilityDensity: 'Probability Density',
    }
  }[language === 'th' ? 'th' : 'en'];

  if (sd < 0.001) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/40 rounded-3xl bg-card-bg gap-3">
        <p className="text-muted font-bold uppercase tracking-[0.3em] text-xs">
          {language === 'th' ? 'ไม่มีข้อมูลความเสี่ยง' : 'No risk data available'}
        </p>
        <p className="text-muted/60 text-[10px] max-w-xs text-center leading-relaxed">
          {language === 'th'
            ? 'กรุณากำหนดค่า Optimistic (O) และ Pessimistic (P) ให้ต่างกันในงานที่เป็นสายงานวิกฤต เพื่อดูการกระจายความเสี่ยง'
            : 'Please set different O and P values for critical tasks to visualize risk distribution.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card-bg border border-border/80 rounded-[32px] p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-foreground">{labels.probabilityTitle}</h3>
          <p className="text-[12px] font-bold text-muted uppercase tracking-widest mt-1">{labels.normalDist}</p>
        </div>

        <div className="flex items-center gap-8 bg-surface/20 px-6 py-4 rounded-[24px] border border-border/40">
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-muted uppercase tracking-[0.25em]">{labels.targetLabel}</div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={Math.max(0, Math.floor(mean - 3 * sd))}
                max={Math.ceil(mean + 3 * sd)}
                step="0.1"
                value={targetDate}
                onChange={(e) => setTargetDate(parseFloat(e.target.value))}
                className="w-24 sm:w-40 accent-foreground h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700/50"
              />
              <span className="text-xl font-mono font-bold text-foreground w-14 text-right tabular-nums">{targetDate.toFixed(1)}</span>
            </div>
          </div>
          <div className="w-px h-12 bg-border/30" />
          <div className="space-y-2 text-right">
            <div className="text-[11px] font-bold text-muted uppercase tracking-[0.3em]">{labels.probLabel}</div>
            <div className={`text-3xl font-mono font-bold tabular-nums ${(probability * 100) > 80 ? 'text-emerald-500' : (probability * 100) > 50 ? 'text-blue-500' : 'text-rose-500'}`}>
              {(probability * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 10, fontWeight: 'bold', fill: 'var(--muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                borderWidth: '1px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--foreground)'
              }}
              labelClassName="text-primary font-bold"
              formatter={(val: unknown) => [Number(val).toFixed(4), labels.probabilityDensity] as [string, string]}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="var(--primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1000}
            />
            <ReferenceLine
              x={targetDate}
              stroke="var(--foreground)"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: 'TARGET',
                position: 'top',
                fill: 'var(--foreground)',
                fontSize: 9,
                fontWeight: 'black',
                dy: -10
              }}
            />
            <ReferenceLine
              x={mean}
              stroke="var(--primary)"
              strokeWidth={1}
              opacity={0.3}
              label={{
                value: 'EXPECTED',
                position: 'insideBottom',
                fill: 'var(--primary)',
                fontSize: 8,
                fontWeight: 'bold',
                dy: 20
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
