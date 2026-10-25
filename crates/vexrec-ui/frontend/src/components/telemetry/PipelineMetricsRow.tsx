import React from "react";
import { MetricCard, StatusBadge } from "@aerovex/strata-ui";

export interface PipelineMetricsRowProps {
  fps?: number;
  latencyMs?: number;
  droppedFrames?: number;
  bitrateMbps?: number;
  isLive?: boolean;
  className?: string;
}

export const PipelineMetricsRow: React.FC<PipelineMetricsRowProps> = ({
  fps = 60,
  latencyMs = 1.2,
  droppedFrames = 0,
  bitrateMbps = 4.8,
  isLive = true,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-medium text-muted">Pipeline Telemetry</span>
        <StatusBadge
          status={isLive ? "online" : "standby"}
          label={isLive ? "VA-API ZERO-COPY" : "IDLE"}
          pulse={isLive}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetricCard
          title="Framerate"
          value={fps.toFixed(1)}
          unit="FPS"
          history={[59.6, 59.8, 60.1, 59.9, 60.0, 60.2, 60.0]}
          status={fps >= 58 ? "nominal" : "warning"}
        />

        <MetricCard
          title="Encode Latency"
          value={latencyMs.toFixed(1)}
          unit="ms"
          history={[1.4, 1.3, 1.2, 1.1, 1.2, 1.2]}
          status="nominal"
        />

        <MetricCard
          title="Dropped Frames"
          value={droppedFrames}
          status={droppedFrames === 0 ? "nominal" : "critical"}
        />

        <MetricCard
          title="Stream Bitrate"
          value={bitrateMbps.toFixed(1)}
          unit="Mbps"
          history={[4.2, 4.5, 4.7, 4.8, 4.8]}
          status="nominal"
        />
      </div>
    </div>
  );
};
