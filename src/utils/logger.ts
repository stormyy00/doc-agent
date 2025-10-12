// src/utils/logger.ts
import crypto from "node:crypto";
import { CacheEntry, Level, LogLine } from "@/types/log";
import { logs as logColors } from "@/data/logs";

const MAX_ENTRIES = 200;                  
const TTL_MS = 10 * 60 * 1000;          
const cache = new Map<string, CacheEntry>();

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
} as const;

// Tool call tracking
const activeToolCalls = new Map<string, { name: string; startTime: number; reqId: string }>();

const touch = (id: string, entry: CacheEntry) => {
  // refresh LRU order
  if (cache.has(id)) cache.delete(id);
  cache.set(id, entry);
}

function evictIfNeeded() {
  if (cache.size <= MAX_ENTRIES) return;
  // drop oldest
  const oldestKey = cache.keys().next().value as string | undefined;
  if (oldestKey) {
    const old = cache.get(oldestKey);
    if (old?.timeout) clearTimeout(old.timeout);
    cache.delete(oldestKey);
  }
}

export function getCachedLogs(reqId: string): LogLine[] | undefined {
  const e = cache.get(reqId);
  if (!e) return;
  touch(reqId, e);
  return e.lines;
}

const DEBUG_ON = /^(true|1|yes|agent)$/i.test(process.env.DEBUG ?? "");

function redactValue(val: unknown, key?: string): unknown {
  if (typeof val === "string") {
    if (/sk-[A-Za-z0-9]/.test(val)) return "[redacted]";
    if (key && /api[_-]?key/i.test(key)) return "[redacted]";
    return val;
  }
  if (val && typeof val === "object") {
    // shallow clone
    const out: Record<string, unknown> = Array.isArray(val) ? [] as any : {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = redactValue(v, k);
    }
    return out;
  }
  return val;
}

// Stringify with truncation, but keep original value for `data`
function toTruncatedString(v: unknown) {
  const s = (() => {
    try { return JSON.stringify(v); } catch { return String(v); }
  })();
  return s.length > 1500 ? s.slice(0, 1500) + "…(truncated)" : s;
}

// Color formatting for console output using logColors config
function colorize(level: Level, text: string): string {
  const colorConfig = logColors[level];
  return `${colorConfig.console}${text}${COLORS.reset}`;
}

// Format tool call for display
function formatToolCall(toolName: string, input: unknown, duration?: number): string {
  const inputStr = toTruncatedString(input);
  const durationStr = duration ? ` (${duration}ms)` : '';
  return `${COLORS.magenta}🔧 ${toolName}${durationStr}${COLORS.reset}\n${COLORS.dim}Input: ${inputStr}${COLORS.reset}`;
}

// Format tool result for display
function formatToolResult(toolName: string, output: unknown, duration: number, success: boolean): string {
  const outputStr = toTruncatedString(output);
  const status = success ? `${COLORS.green}✓${COLORS.reset}` : `${COLORS.red}✗${COLORS.reset}`;
  return `${status} ${COLORS.magenta}${toolName}${COLORS.reset} (${duration}ms)\n${COLORS.dim}Output: ${outputStr}${COLORS.reset}`;
}

export const createLogger = (reqId?: string) => {
  const id = reqId || crypto.randomUUID();
  const t0 = Date.now();

  const entry: CacheEntry = cache.get(id) ?? { lines: [], ts: Date.now() };
  // schedule TTL cleanup on first creation
  if (!cache.has(id)) {
    entry.timeout = setTimeout(() => cache.delete(id), TTL_MS);
  }
  touch(id, entry);
  evictIfNeeded();

  function push(level: Level, msg: string, data?: unknown, extra?: Partial<LogLine>) {
    // if (!DEBUG_ON && level === "debug") return; // skip debug unless enabled

    const redacted = data == null ? undefined : redactValue(data);
    const line: LogLine = {
      ts: new Date().toISOString(),
      level,
      reqId: id,
      msg,
      ...(redacted !== undefined ? { data: redacted } : {}),
      ...extra,
    };

    entry.lines.push(line);
    entry.ts = Date.now();
    touch(id, entry);

    // Enhanced console output with colors and formatting
    const timestamp = new Date().toLocaleTimeString();
    const reqIdShort = id.slice(0, 8);
    
    let consoleOutput = '';
    
    // Handle tool calls specially
    if (line.toolCall) {
      consoleOutput = formatToolCall(line.toolCall.name, line.toolCall.input);
    } else if (line.toolResult) {
      consoleOutput = formatToolResult(
        line.toolResult.name, 
        line.toolResult.output, 
        line.toolResult.duration, 
        line.toolResult.success
      );
    } else {
      // Regular log formatting
      const levelColor = colorize(level, level.toUpperCase().padEnd(5));
      const msgColor = level === 'error' ? COLORS.red : level === 'warn' ? COLORS.yellow : COLORS.white;
      const dataStr = line.data ? `\n${COLORS.dim}Data: ${toTruncatedString(line.data)}${COLORS.reset}` : '';
      const durationStr = line.duration ? ` ${COLORS.gray}(${line.duration}ms)${COLORS.reset}` : '';
      
      consoleOutput = `${COLORS.gray}[${timestamp}]${COLORS.reset} ${levelColor} ${COLORS.gray}${reqIdShort}${COLORS.reset} ${msgColor}${msg}${COLORS.reset}${durationStr}${dataStr}`;
    }

    // eslint-disable-next-line no-console
    console.log(consoleOutput);
  }

  return {
    id,
    time: () => Date.now() - t0,

    debug: (m: string, d?: unknown) => push("debug", m, d),
    info:  (m: string, d?: unknown) => push("info",  m, d),
    warn:  (m: string, d?: unknown) => push("warn",  m, d),
    error: (m: string, d?: unknown) => push("error", m, d),

    step: (label: string, extra?: Record<string, unknown>) => {
      const duration = Date.now() - t0;
      push("info", `step:${label}`, { ms: duration, ...(extra || {}) }, {
        step: { name: label, phase: 'execution' },
        duration
      });
    },

    // Enhanced tool tracking with timing and success/failure
    toolCall: (name: string, input: unknown) => {
      const toolId = `${id}-${name}-${Date.now()}`;
      const startTime = Date.now();
      activeToolCalls.set(toolId, { name, startTime, reqId: id });
      
      push("debug", `tool:call:${name}`, { input }, {
        toolCall: { name, input, startTime }
      });
      
      return toolId; 
    },

    toolResult: (name: string, output: unknown, toolId?: string, success: boolean = true) => {
      const endTime = Date.now();
      let duration = 0;
      
      // Try to find the corresponding tool call
      if (toolId && activeToolCalls.has(toolId)) {
        const call = activeToolCalls.get(toolId)!;
        duration = endTime - call.startTime;
        activeToolCalls.delete(toolId);
      } else {
        // Fallback: look for any active call with this name
        for (const [id, call] of Array.from(activeToolCalls.entries())) {
          if (call.name === name && call.reqId === id) {
            duration = endTime - call.startTime;
            activeToolCalls.delete(id);
            break;
          }
        }
      }

      push("debug", `tool:result:${name}`, { output }, {
        toolResult: { name, output, duration, success }
      });
    },

    toolError: (name: string, error: unknown, toolId?: string) => {
      const endTime = Date.now();
      let duration = 0;
      
      if (toolId && activeToolCalls.has(toolId)) {
        const call = activeToolCalls.get(toolId)!;
        duration = endTime - call.startTime;
        activeToolCalls.delete(toolId);
      } else {
        for (const [id, call] of Array.from(activeToolCalls.entries())) {
          if (call.name === name && call.reqId === id) {
            duration = endTime - call.startTime;
            activeToolCalls.delete(id);
            break;
          }
        }
      }

      push("error", `tool:error:${name}`, { error: String(error) }, {
        toolResult: { name, output: { error: String(error) }, duration, success: false }
      });
    },

    modelCall: (what: string, payload?: Record<string, unknown>) => {
      const duration = Date.now() - t0;
      push("debug", `model:${what}`, payload ? { payload } : undefined, { duration });
    },

    done: (extra?: Record<string, unknown>) => {
      const duration = Date.now() - t0;
      push("info", "done", { ms: duration, ...(extra || {}) }, { duration });
    },

  
    dump: () => entry.lines.slice(),
    dumpPlain: () =>
      entry.lines.map(l =>
        `${l.ts} ${l.level.toUpperCase()} ${l.reqId} ${l.msg}` +
        (l.data ? ` ${toTruncatedString(l.data)}` : "") +
        (l.toolCall ? ` [TOOL_CALL: ${l.toolCall.name}]` : "") +
        (l.toolResult ? ` [TOOL_RESULT: ${l.toolResult.name} (${l.toolResult.duration}ms)]` : "")
      ),
  };
}
