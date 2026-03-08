import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
  glowColor?: 'neon' | 'green' | 'yellow' | 'red';
  subtext?: string;
}

export default function KpiCard({ label, value, prefix = '', suffix = '', delay = 0, glowColor = 'neon', subtext }: KpiCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500;
      const steps = 40;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const borderColor = {
    neon: 'border-t-neon',
    green: 'border-t-status-green',
    yellow: 'border-t-status-yellow',
    red: 'border-t-status-red',
  }[glowColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      className={`bg-panel border border-border ${borderColor} border-t-2 rounded-xl p-6 neon-glow-sm`}
    >
      <p className="text-[10px] font-mono tracking-[2px] text-muted-foreground uppercase mb-2">
        {label}
      </p>
      <p className="font-display text-2xl font-bold text-foreground">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      {subtext && (
        <p className="text-[11px] text-muted-foreground mt-1">{subtext}</p>
      )}
    </motion.div>
  );
}
