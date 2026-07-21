/**
 * FloorPlanPlot.tsx
 *
 * Plotly-based 2D floor plan visualisation.
 * - Room polygons filled and labelled; red if any violation, green if pass
 * - Door positions as markers; red diamond if violation, green triangle if pass, grey circle if non-exit
 * - Works per-floor; shows one floor at a time via tab selector
 */

import { useState } from "react";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import { BuildingModel, ComplianceReport } from "@/lib/types";
import { MIN_FIRE_DOOR_WIDTH_MM, MAX_TRAVEL_DISTANCE_M } from "@/lib/compliance";

interface Props {
  model: BuildingModel;
  report: ComplianceReport;
}

// Convert mm to a display unit (we keep mm but label axes)
const mm = (v: number) => v;

export function FloorPlanPlot({ model, report }: Props) {
  const [floorIdx, setFloorIdx] = useState(0);
  const floor = model.floors[floorIdx];

  // Build violation look-up from report
  const travelItems = report.rules.find(r => r.ruleId === "GB-TRAVEL-DIST")?.items ?? [];
  const doorItems   = report.rules.find(r => r.ruleId === "GB-DOOR-WIDTH")?.items ?? [];

  const roomFail  = new Set(travelItems.filter(i => i.severity === "FAIL").map(i => i.elementId));
  const doorFail  = new Set(doorItems.filter(i => i.severity === "FAIL").map(i => i.elementId));

  // ── Build Plotly traces ────────────────────────────────────────────────────

  // 1. Room polygon fills — one trace per room so we can colour individually
  const roomTraces: Data[] = floor.rooms
    .filter(r => r.polygon && r.polygon.length > 0)
    .map(room => {
      const isFail = roomFail.has(room.room_id);
      const poly   = room.polygon!;
      // Close the polygon
      const xs = [...poly.map(p => mm(p.x)), mm(poly[0].x)];
      const ys = [...poly.map(p => mm(p.y)), mm(poly[0].y)];

      return {
        type: "scatter" as const,
        x: xs,
        y: ys,
        fill: "toself",
        fillcolor: isFail ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.12)",
        line: { color: isFail ? "#ef4444" : "#22c55e", width: isFail ? 2.5 : 1.5 },
        mode: "lines" as const,
        hoverinfo: "skip" as const,
        showlegend: false,
        name: room.name,
      };
    });

  // 2. Room centroid labels
  const roomsWithCenter = floor.rooms.filter(r => r.center);
  const labelTrace: Data = {
    type: "scatter" as const,
    mode: "text+markers" as const,
    x: roomsWithCenter.map(r => mm(r.center!.x)),
    y: roomsWithCenter.map(r => mm(r.center!.y)),
    text: roomsWithCenter.map(r => {
      const isFail = roomFail.has(r.room_id);
      return `<b>${r.name}</b><br>${r.room_id}<br>${r.distance_to_exit_m} m ${isFail ? "❌" : "✅"}`;
    }),
    textposition: "middle center" as const,
    textfont: {
      size: 11,
      color: roomsWithCenter.map(r => roomFail.has(r.room_id) ? "#b91c1c" : "#14532d"),
    },
    marker: {
      size: 6,
      color: roomsWithCenter.map(r => roomFail.has(r.room_id) ? "#ef4444" : "#22c55e"),
      opacity: 0.5,
    },
    hovertemplate: roomsWithCenter.map(r => {
      const isFail = roomFail.has(r.room_id);
      return `<b>${r.name}</b><br>ID: ${r.room_id}<br>距出口: ${r.distance_to_exit_m} m (限 ${MAX_TRAVEL_DISTANCE_M} m)<br>状态: ${isFail ? "❌ 违规" : "✅ 合规"}<extra></extra>`;
    }),
    showlegend: false,
    name: "rooms",
  };

  // 3. Door markers
  const doorsWithLoc = floor.doors.filter(d => d.location);
  const doorTrace: Data = {
    type: "scatter" as const,
    mode: "text+markers" as const,
    x: doorsWithLoc.map(d => mm(d.location!.x)),
    y: doorsWithLoc.map(d => mm(d.location!.y)),
    text: doorsWithLoc.map(d => d.door_id),
    textposition: "top center" as const,
    textfont: {
      size: 9,
      color: doorsWithLoc.map(d => {
        if (!d.is_fire_exit) return "#64748b";
        return doorFail.has(d.door_id) ? "#b91c1c" : "#15803d";
      }),
    },
    marker: {
      symbol: doorsWithLoc.map(d => {
        if (!d.is_fire_exit) return "circle";
        return doorFail.has(d.door_id) ? "diamond" : "triangle-up";
      }) as string[],
      size: doorsWithLoc.map(d => d.is_fire_exit ? 14 : 10),
      color: doorsWithLoc.map(d => {
        if (!d.is_fire_exit) return "#94a3b8";
        return doorFail.has(d.door_id) ? "#ef4444" : "#22c55e";
      }),
      line: {
        color: doorsWithLoc.map(d => {
          if (!d.is_fire_exit) return "#64748b";
          return doorFail.has(d.door_id) ? "#991b1b" : "#15803d";
        }),
        width: 2,
      },
    },
    hovertemplate: doorsWithLoc.map(d => {
      const isFail = doorFail.has(d.door_id);
      const isFireEx = d.is_fire_exit;
      return `<b>${d.door_id}</b><br>净宽: ${d.clear_width_mm} mm (限 ${MIN_FIRE_DOOR_WIDTH_MM} mm)<br>消防门: ${isFireEx ? "是" : "否"}<br>${isFireEx ? `耐火等级: ${d.fire_rating_min} min<br>状态: ${isFail ? "❌ 违规" : "✅ 合规"}` : "（非消防门，不检查宽度）"}<extra></extra>`;
    }),
    showlegend: false,
    name: "doors",
  };

  // ── Legend traces (just for legend display) ──────────────────────────────
  const legendTraces: Data[] = [
    {
      type: "scatter", mode: "markers", x: [null], y: [null],
      marker: { symbol: "square", size: 12, color: "rgba(34,197,94,0.25)", line: { color: "#22c55e", width: 2 } },
      name: "房间 — 合规", showlegend: true,
    },
    {
      type: "scatter", mode: "markers", x: [null], y: [null],
      marker: { symbol: "square", size: 12, color: "rgba(239,68,68,0.25)", line: { color: "#ef4444", width: 2 } },
      name: "房间 — 违规 ❌", showlegend: true,
    },
    {
      type: "scatter", mode: "markers", x: [null], y: [null],
      marker: { symbol: "triangle-up", size: 12, color: "#22c55e", line: { color: "#15803d", width: 2 } },
      name: "消防门 — 合规", showlegend: true,
    },
    {
      type: "scatter", mode: "markers", x: [null], y: [null],
      marker: { symbol: "diamond", size: 12, color: "#ef4444", line: { color: "#991b1b", width: 2 } },
      name: "消防门 — 违规 ❌", showlegend: true,
    },
    {
      type: "scatter", mode: "markers", x: [null], y: [null],
      marker: { symbol: "circle", size: 10, color: "#94a3b8", line: { color: "#64748b", width: 1.5 } },
      name: "普通门（不检查）", showlegend: true,
    },
  ];

  // Compute axis bounds with padding
  const allX: number[] = [];
  const allY: number[] = [];
  floor.rooms.forEach(r => {
    r.polygon?.forEach(p => { allX.push(p.x); allY.push(p.y); });
    if (r.center) { allX.push(r.center.x); allY.push(r.center.y); }
  });
  floor.doors.forEach(d => {
    if (d.location) { allX.push(d.location.x); allY.push(d.location.y); }
  });

  const pad = (max: number, min: number) => (max - min) * 0.12;
  const xMin = Math.min(...allX); const xMax = Math.max(...allX);
  const yMin = Math.min(...allY); const yMax = Math.max(...allY);
  const px = allX.length ? pad(xMax, xMin) : 5000;
  const py = allY.length ? pad(yMax, yMin) : 5000;

  const hasGeometry = floor.rooms.some(r => r.polygon) || floor.doors.some(d => d.location);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Floor tabs */}
      {model.floors.length > 1 && (
        <div className="flex border-b border-slate-100 bg-slate-50">
          {model.floors.map((f, i) => (
            <button
              key={f.floor_id}
              onClick={() => setFloorIdx(i)}
              className={`px-5 py-2.5 text-sm font-semibold border-r border-slate-100 last:border-r-0 transition-colors focus:outline-none ${
                i === floorIdx
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {f.floor_id}
            </button>
          ))}
        </div>
      )}

      {!hasGeometry ? (
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm font-mono">
          该楼层的 JSON 数据中未包含坐标信息（polygon / center / location）
        </div>
      ) : (
        <Plot
          data={[...roomTraces, labelTrace, doorTrace, ...legendTraces]}
          layout={{
            autosize: true,
            margin: { t: 20, r: 20, b: 60, l: 60 },
            xaxis: {
              title: { text: "X (mm)", font: { size: 11, color: "#64748b" } },
              range: [xMin - px, xMax + px],
              showgrid: true,
              gridcolor: "#e2e8f0",
              zeroline: false,
              tickfont: { size: 10, color: "#94a3b8" },
            },
            yaxis: {
              title: { text: "Y (mm)", font: { size: 11, color: "#64748b" } },
              range: [yMin - py, yMax + py],
              showgrid: true,
              gridcolor: "#e2e8f0",
              zeroline: false,
              tickfont: { size: 10, color: "#94a3b8" },
              scaleanchor: "x",
              scaleratio: 1,
            },
            paper_bgcolor: "#f8fafc",
            plot_bgcolor: "#f8fafc",
            legend: {
              x: 1.01,
              y: 1,
              xanchor: "left" as const,
              font: { size: 11, color: "#334155" },
              bgcolor: "rgba(255,255,255,0.9)",
              bordercolor: "#e2e8f0",
              borderwidth: 1,
            },
            hoverlabel: {
              bgcolor: "#1e293b",
              bordercolor: "#334155",
              font: { color: "#f8fafc", size: 12 },
            },
          }}
          config={{
            displayModeBar: true,
            modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d"],
            displaylogo: false,
            responsive: true,
          }}
          style={{ width: "100%", minHeight: 520 }}
          useResizeHandler
        />
      )}
    </div>
  );
}
