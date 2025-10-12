export type Level = "debug" | "info" | "warn" | "error";
export type LogLine = {
  ts: string; // ISO
  level: Level;
  reqId: string;
  msg: string;
  data?: unknown;
  toolCall?: {
    name: string;
    input: unknown;
    startTime: number;
  };
  toolResult?: {
    name: string;
    output: unknown;
    duration: number;
    success: boolean;
  };
 
  duration?: number;

  step?: {
    name: string;
    phase: string;
  };
};
export type CacheEntry = {
  lines: LogLine[];
  ts: number;
  timeout?: NodeJS.Timeout;
};

export type LogEntry =
  | string
  | {
      ts?: string | number;
      level?: Level;
      msg: string;
      data?: unknown;
      toolCall?: LogLine['toolCall'];
      toolResult?: LogLine['toolResult'];
      duration?: number;
      step?: LogLine['step'];
    };