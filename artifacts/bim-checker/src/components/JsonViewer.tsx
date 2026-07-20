/**
 * JsonViewer.tsx
 *
 * Recursive JSON tree renderer with:
 * - Syntax highlighting (keys, strings, numbers, booleans, null)
 * - Collapsible objects & arrays
 * - Red highlight + inline violation badge on any annotated path
 * - Hover tooltip showing full violation message
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import type { AnnotationMap, Annotation } from "@/lib/jsonAnnotate";

interface JsonNodeProps {
  data: unknown;
  path: string;
  annotations: AnnotationMap;
  depth?: number;
  keyName?: string | number;
  isLast?: boolean;
}

const INDENT = 20; // px per depth level

// ─── Syntax colours ──────────────────────────────────────────────────────────
const TOKEN = {
  key: "text-sky-700 font-semibold",
  string: "text-emerald-700",
  number: "text-amber-700 font-mono",
  boolean: "text-violet-700 font-mono",
  null: "text-slate-400 italic font-mono",
  punctuation: "text-slate-400",
  bracket: "text-slate-500 font-mono",
};

// ─── Build child path (handles empty root correctly) ─────────────────────────
function childPath(parentPath: string, key: string | number): string {
  if (typeof key === "number") return `${parentPath}[${key}]`;
  if (parentPath === "") return key;
  return `${parentPath}.${key}`;
}

// ─── Inline violation badge ───────────────────────────────────────────────────
function ViolationBadge({ ann }: { ann: Annotation }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-2 align-middle">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors cursor-pointer"
      >
        <AlertCircle className="w-3 h-3" />
        {ann.severity}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-50 w-72 bg-white border border-red-200 rounded-lg shadow-xl p-3 text-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800">{ann.ruleName}</span>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{ann.ruleCode}</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-2">{ann.message}</p>
            {ann.actualValue !== undefined && ann.thresholdValue !== undefined && (
              <div className="flex items-center gap-2 font-mono bg-red-50 border border-red-100 px-2 py-1.5 rounded">
                <span className="text-red-600 font-bold">{ann.actualValue} {ann.unit}</span>
                <span className="text-slate-400">vs threshold</span>
                <span className="text-slate-800 font-semibold">{ann.thresholdValue} {ann.unit}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─── Scalar leaf node ─────────────────────────────────────────────────────────
function ScalarNode({ value, path, annotations }: { value: unknown; path: string; annotations: AnnotationMap }) {
  const anns = annotations.get(path) ?? [];
  const failAnns = anns.filter(a => a.severity === "FAIL" || a.severity === "WARNING");
  const isBad = failAnns.length > 0;

  let cls = "";
  let display = "";
  if (typeof value === "string") {
    cls = isBad ? "text-red-600 font-semibold font-mono" : TOKEN.string;
    display = `"${value}"`;
  } else if (typeof value === "number") {
    cls = isBad ? "text-red-600 font-bold font-mono" : TOKEN.number;
    display = String(value);
  } else if (typeof value === "boolean") {
    cls = TOKEN.boolean;
    display = String(value);
  } else if (value === null) {
    cls = TOKEN.null;
    display = "null";
  } else {
    display = String(value);
  }

  return (
    <span className={`${isBad ? "bg-red-50 rounded px-0.5 ring-1 ring-red-300" : ""}`}>
      <span className={cls}>{display}</span>
      {failAnns.map((a, i) => <ViolationBadge key={i} ann={a} />)}
    </span>
  );
}

// ─── Main recursive node ──────────────────────────────────────────────────────
export function JsonNode({ data, path, annotations, depth = 0, keyName, isLast = true }: JsonNodeProps) {
  const [collapsed, setCollapsed] = useState(depth > 2);

  const nodeAnns = annotations.get(path) ?? [];
  const failAnns = nodeAnns.filter(a => a.severity === "FAIL" || a.severity === "WARNING");
  const hasViolation = failAnns.length > 0;

  const isObject = data !== null && typeof data === "object" && !Array.isArray(data);
  const isArray = Array.isArray(data);
  const isComplex = isObject || isArray;

  const entries = useMemo(() => {
    if (isObject) return Object.entries(data as Record<string, unknown>);
    if (isArray) return (data as unknown[]).map((v, i) => [i, v] as [number, unknown]);
    return [];
  }, [data, isObject, isArray]);

  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";
  const isEmpty = entries.length === 0;

  const keyLabel = keyName !== undefined ? (
    <span className={TOKEN.key}>
      {typeof keyName === "number"
        ? <span className="text-slate-400 font-mono">{keyName}</span>
        : `"${keyName}"`}
      <span className={TOKEN.punctuation}>: </span>
    </span>
  ) : null;

  // Highlight the whole object row if it has a violation
  const rowHighlight = hasViolation
    ? "bg-red-50/60 border-l-2 border-red-400 rounded-r-md"
    : "";

  if (!isComplex) {
    return (
      <div
        className={`flex items-start gap-1 py-0.5 px-1 rounded ${rowHighlight}`}
        style={{ paddingLeft: depth * INDENT + 4 }}
      >
        {keyLabel}
        <ScalarNode value={data} path={path} annotations={annotations} />
        {!isLast && <span className={TOKEN.punctuation}>,</span>}
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: depth > 0 ? INDENT : 0 }}>
      {/* Header row — clickable to collapse */}
      <div
        className={`flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer hover:bg-slate-100/60 select-none ${rowHighlight}`}
        onClick={() => setCollapsed(c => !c)}
      >
        <ChevronRight
          className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}
        />
        {keyLabel}
        <span className={TOKEN.bracket}>{openBracket}</span>

        {collapsed && (
          <>
            <span className="text-slate-400 text-xs font-mono mx-1">
              {isArray ? `${entries.length} items` : `${entries.length} keys`}
            </span>
            <span className={TOKEN.bracket}>{closeBracket}</span>
            {!isLast && <span className={TOKEN.punctuation}>,</span>}
          </>
        )}

        {/* Violation badges on the collapsed/header row */}
        {hasViolation && failAnns.map((a, i) => <ViolationBadge key={i} ann={a} />)}
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {!isEmpty && entries.map(([k, v], idx) => {
              const cp = childPath(path, k as string | number);
              return (
                <JsonNode
                  key={cp}
                  data={v}
                  path={cp}
                  annotations={annotations}
                  depth={depth + 1}
                  keyName={k as string | number}
                  isLast={idx === entries.length - 1}
                />
              );
            })}

            <div
              className="flex items-center gap-1 py-0.5 px-1"
              style={{ paddingLeft: depth * INDENT + 4 }}
            >
              <span className={TOKEN.bracket}>{closeBracket}</span>
              {!isLast && <span className={TOKEN.punctuation}>,</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Top-level wrapper ────────────────────────────────────────────────────────
interface JsonViewerProps {
  data: unknown;
  annotations: AnnotationMap;
  violationCount: number;
}

export function JsonViewer({ data, annotations, violationCount }: JsonViewerProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs font-mono text-slate-500 ml-2">building-model.json</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          {violationCount > 0 ? (
            <span className="flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
              <AlertCircle className="w-3.5 h-3.5" />
              {violationCount} violation{violationCount !== 1 ? "s" : ""} — click badges to inspect
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              No violations
            </span>
          )}
        </div>
      </div>

      {/* JSON tree — root path is "" so top-level keys resolve correctly */}
      <div className="overflow-auto max-h-[70vh] p-4 text-sm font-mono leading-6">
        <JsonNode data={data} path="" annotations={annotations} depth={0} />
      </div>
    </div>
  );
}
