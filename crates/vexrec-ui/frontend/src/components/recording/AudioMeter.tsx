import React from "react";

interface AudioMeterProps {
  level: number; // 0.0 to 1.0
}

export const AudioMeter: React.FC<AudioMeterProps> = ({ level }) => {
  const segments = 4;
  const activeCount = Math.round(level * segments);

  return (
    <div className="flex items-center gap-0.5 h-3 px-1 py-0.5 rounded bg-surface-base border border-surface-border">
      {Array.from({ length: segments }).map((_, i) => {
        const isActive = i < activeCount;
        const isPeak = i === segments - 1;

        let color = "bg-neutral-700";
        if (isActive) {
          color = isPeak ? "bg-amber-400" : "bg-emerald-400";
        }

        return (
          <div
            key={i}
            className={`w-1 rounded-sm transition-all duration-75 ${color}`}
            style={{ height: `${(i + 1) * 25}%` }}
          />
        );
      })}
    </div>
  );
};
