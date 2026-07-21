/**
 * FloorPlanPlot.tsx
 *
 * Plotly topology tree: Building → Floors → Rooms / Doors
 * - Works entirely from JSON structure — NO polygon/center/location needed
 * - Violation nodes highlighted red; compliant nodes green; unchecked doors grey
 * - Hover tooltip shows element details and rule thresholds
 */

import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Data, Layout } from "plotly.js";
import { BuildingModel, ComplianceReport } from "@/lib/types";
import { MIN_FIRE_DOOR_WIDTH_MM, MAX_TRAVEL_DISTANCE_M } from "@/lib/compliance";

interface Props {
  model: BuildingModel;
  report: ComplianceReport;
}

// Y positions for each level
const LEVEL_Y = { building: 3, floor: 2, leaf: 0.5 };

export function FloorPlanPlot({ model, report }: Props) {
  const travelItems = report.rules.find(r => r.ruleId === "GB-TRAVEL-DIST")?.items ?? [];
  const doorItems   = report.rules.find(r => r.ruleId === "GB-DOOR-WIDTH")?.items ?? [];

  const roomFail = new Set(travelItems.filter(i => i.severity === "FAIL").map(i => i.elementId));
  const doorFail = new Set(doorItems.filter(i => i.severity === "FAIL").map(i => i.elementId));

  const { traces, layout } = useMemo<{ traces: Data[]; layout: Partial<Layout> }>(() => {
    // ── 1. Assign x positions to leaves (rooms then doors, per floor) ────────
    const totalLeaves = model.floors.reduce((s, f) => s + f.rooms.length + f.doors.length, 0);
    if (totalLeaves === 0) return { traces: [], layout: {} };

    const leafXOf: Record<string, number> = {};
    let li = 0;
    model.floors.forEach(f => {
      [...f.rooms.map(r => r.room_id), ...f.doors.map(d => d.door_id)].forEach(id => {
        // space leaves with a small gap between floors
        leafXOf[id] = li + 0.5;
        li++;
      });
      li += 0.6; // inter-floor gap
    });
    const totalWidth = li - 0.6; // actual span

    // Normalise to [0, 1]
    const norm = (v: number) => v / totalWidth;

    // ── 2. Floor x = midpoint of its leaves ─────────────────────────────────
    const floorXOf: Record<string, number> = {};
    model.floors.forEach(f => {
      const ids = [...f.rooms.map(r => r.room_id), ...f.doors.map(d => d.door_id)];
      const xs = ids.map(id => norm(leafXOf[id]));
      floorXOf[f.floor_id] = xs.reduce((a, b) => a + b, 0) / xs.length;
    });

    // ── 3. Building x = average of floor xs ─────────────────────────────────
    const floorXs = Object.values(floorXOf);
    const buildingX = floorXs.reduce((a, b) => a + b, 0) / floorXs.length;

    // ── 4. Edges trace ───────────────────────────────────────────────────────
    const ex: (number | null)[] = [];
    const ey: (number | null)[] = [];

    const addEdge = (x0: number, y0: number, x1: number, y1: number) => {
      ex.push(x0, x1, null);
      ey.push(y0, y1, null);
    };

    model.floors.forEach(f => {
      const fx = floorXOf[f.floor_id];
      addEdge(buildingX, LEVEL_Y.building, fx, LEVEL_Y.floor);

      [...f.rooms.map(r => r.room_id), ...f.doors.map(d => d.door_id)].forEach(id => {
        addEdge(fx, LEVEL_Y.floor, norm(leafXOf[id]), LEVEL_Y.leaf);
      });
    });

    const edgeTrace: Data = {
      type: "scatter",
      mode: "lines",
      x: ex,
      y: ey,
      line: { color: "#cbd5e1", width: 1.5, dash: "solid" },
      hoverinfo: "skip",
      showlegend: false,
      name: "_edges",
    };

    // ── 5. Node arrays ───────────────────────────────────────────────────────
    type Sym = string;
    const nx: number[] = [];
    const ny: number[] = [];
    const nc: string[] = [];   // fill color
    const nbc: string[] = [];  // border color
    const nsz: number[] = [];  // marker size
    const nsy: Sym[] = [];     // marker symbol
    const nlabel: string[] = [];
    const nhover: string[] = [];

    const push = (
      x: number, y: number,
      fillColor: string, borderColor: string,
      size: number, sym: Sym,
      label: string, hover: string
    ) => {
      nx.push(x); ny.push(y);
      nc.push(fillColor); nbc.push(borderColor);
      nsz.push(size); nsy.push(sym);
      nlabel.push(label); nhover.push(hover);
    };

    // Building
    push(
      buildingX, LEVEL_Y.building,
      "#1e293b", "#0f172a", 28, "square",
      truncate(model.building.name, 14),
      `<b>${model.building.name}</b><br>建筑根节点<br>${model.floors.length} 楼层<extra></extra>`
    );

    // Floors
    model.floors.forEach(f => {
      const fx = floorXOf[f.floor_id];
      const fireExCount = f.doors.filter(d => d.is_fire_exit).length;
      push(
        fx, LEVEL_Y.floor,
        "#3b82f6", "#1d4ed8", 22, "diamond",
        f.floor_id,
        `<b>楼层 ${f.floor_id}</b><br>${f.rooms.length} 房间 · ${fireExCount} 消防门<extra></extra>`
      );

      // Rooms
      f.rooms.forEach(room => {
        const isFail = roomFail.has(room.room_id);
        const fillC  = isFail ? "#ef4444" : "#22c55e";
        const bordC  = isFail ? "#991b1b" : "#15803d";
        push(
          norm(leafXOf[room.room_id]), LEVEL_Y.leaf,
          fillC, bordC, 20, "circle",
          truncate(room.name, 8),
          `<b>${room.name}</b><br>ID: ${room.room_id}<br>` +
          `距出口: ${room.distance_to_exit_m} m (≤ ${MAX_TRAVEL_DISTANCE_M} m)<br>` +
          `状态: ${isFail ? "❌ 违规" : "✅ 合规"}<extra></extra>`
        );
      });

      // Doors
      f.doors.forEach(door => {
        const isFail   = doorFail.has(door.door_id);
        const isFireEx = door.is_fire_exit;
        const fillC = !isFireEx ? "#94a3b8" : isFail ? "#ef4444" : "#22c55e";
        const bordC = !isFireEx ? "#64748b" : isFail ? "#991b1b" : "#15803d";
        const sym   = isFireEx ? "triangle-up" : "triangle-up-open";
        push(
          norm(leafXOf[door.door_id]), LEVEL_Y.leaf,
          fillC, bordC, isFireEx ? 18 : 14, sym,
          truncate(door.door_id, 10),
          `<b>${door.door_id}</b><br>` +
          `净宽: ${door.clear_width_mm} mm (≥ ${MIN_FIRE_DOOR_WIDTH_MM} mm)<br>` +
          `消防门: ${isFireEx ? "是" : "否"}<br>` +
          (isFireEx
            ? `耐火: ${door.fire_rating_min} min<br>状态: ${isFail ? "❌ 违规" : "✅ 合规"}`
            : "（非消防门，不检查宽度）"
          ) + "<extra></extra>"
        );
      });
    });

    const nodeTrace: Data = {
      type: "scatter",
      mode: "text+markers",
      x: nx,
      y: ny,
      marker: {
        symbol: nsy,
        size: nsz,
        color: nc,
        line: { color: nbc, width: 2.5 },
      },
      text: nlabel,
      textposition: "bottom center",
      textfont: { size: 10, color: "#334155" },
      hovertemplate: nhover,
      showlegend: false,
      name: "_nodes",
    };

    // ── 6. Legend dummy traces ───────────────────────────────────────────────
    const leg = (name: string, color: string, sym: string, borderColor: string): Data => ({
      type: "scatter",
      mode: "markers",
      x: [null], y: [null],
      marker: { symbol: sym, size: 12, color, line: { color: borderColor, width: 2 } },
      name,
      showlegend: true,
    });

    const legendTraces: Data[] = [
      leg("建筑 / 楼层",       "#3b82f6", "diamond",         "#1d4ed8"),
      leg("房间 ✅ 合规",      "#22c55e", "circle",           "#15803d"),
      leg("房间 ❌ 违规",      "#ef4444", "circle",           "#991b1b"),
      leg("消防门 ✅ 合规",    "#22c55e", "triangle-up",      "#15803d"),
      leg("消防门 ❌ 违规",    "#ef4444", "triangle-up",      "#991b1b"),
      leg("普通门（不检查）",  "#94a3b8", "triangle-up-open", "#64748b"),
    ];

    // ── 7. Layout ────────────────────────────────────────────────────────────
    const layout: Partial<Layout> = {
      autosize: true,
      margin: { t: 30, r: 160, b: 60, l: 90 },
      paper_bgcolor: "#f8fafc",
      plot_bgcolor: "#f8fafc",
      xaxis: {
        visible: false,
        range: [-0.06, 1.06],
        fixedrange: true,
      },
      yaxis: {
        tickvals: [LEVEL_Y.building, LEVEL_Y.floor, LEVEL_Y.leaf],
        ticktext: ["Building", "Floor", "Room / Door"],
        tickfont: { size: 11, color: "#64748b" },
        showgrid: false,
        zeroline: false,
        range: [-0.2, 3.6],
        fixedrange: true,
      },
      legend: {
        x: 1.01,
        y: 1,
        xanchor: "left",
        font: { size: 11, color: "#334155" },
        bgcolor: "rgba(255,255,255,0.92)",
        bordercolor: "#e2e8f0",
        borderwidth: 1,
      },
      hoverlabel: {
        bgcolor: "#1e293b",
        bordercolor: "#334155",
        font: { color: "#f1f5f9", size: 12 },
        align: "left",
      },
    };

    return { traces: [edgeTrace, nodeTrace, ...legendTraces], layout };
  }, [model, report]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <Plot
        data={traces}
        layout={layout}
        config={{
          displayModeBar: true,
          modeBarButtonsToRemove: [
            "zoom2d", "pan2d", "select2d", "lasso2d",
            "zoomIn2d", "zoomOut2d", "autoScale2d", "resetScale2d",
          ],
          displaylogo: false,
          responsive: true,
        }}
        style={{ width: "100%", minHeight: 500 }}
        useResizeHandler
      />
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
