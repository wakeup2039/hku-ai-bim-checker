/**
 * FloorPlanPlot.tsx
 *
 * Plotly topology tree: Building → Floors → Rooms / Doors
 * - Works entirely from JSON structure — NO polygon/center/location needed
 * - Violation nodes highlighted red; compliant green; unchecked doors grey
 * - Hover tooltip shows element details and rule thresholds
 *
 * NOTE: Plotly is loaded via dynamic import inside useEffect to avoid the
 * duplicate-React problem that react-plotly.js causes in Vite.
 */

import { useRef, useEffect, useMemo } from "react";
import type { Data, Layout, Config } from "plotly.js";
import { BuildingModel, ComplianceReport } from "@/lib/types";
import { MIN_FIRE_DOOR_WIDTH_MM, MAX_TRAVEL_DISTANCE_M } from "@/lib/compliance";

interface Props {
  model: BuildingModel;
  report: ComplianceReport;
}

/** null-safe truncate */
function trunc(s: string | null | undefined, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// Y positions for each hierarchy level
const LY = { building: 3, floor: 2, leaf: 0.5 };

export function FloorPlanPlot({ model, report }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  // ── Build violation sets ────────────────────────────────────────────────────
  const travelItems = report.rules.find(r => r.ruleId === "GB-TRAVEL-DIST")?.items ?? [];
  const doorItems   = report.rules.find(r => r.ruleId === "GB-DOOR-WIDTH")?.items ?? [];
  const roomFail = new Set(travelItems.filter(i => i.severity === "FAIL").map(i => i.elementId));
  const doorFail = new Set(doorItems.filter(i => i.severity === "FAIL").map(i => i.elementId));

  // ── Compute traces + layout (pure, no Plotly dependency) ───────────────────
  const { traces, layout } = useMemo(() => {
    const totalLeaves = model.floors.reduce(
      (s, f) => s + f.rooms.length + f.doors.length, 0
    );

    // ── Leaf x positions ────────────────────────────────────────────────────
    const leafXOf: Record<string, number> = {};
    let li = 0;
    model.floors.forEach(f => {
      [...f.rooms.map(r => r.room_id), ...f.doors.map(d => d.door_id)].forEach(id => {
        if (id) { leafXOf[id] = li + 0.5; li++; }
      });
      li += 0.6; // gap between floors
    });
    const span = Math.max(li - 0.6, 1);
    const norm = (v: number) => v / span;

    // ── Floor x = midpoint of its leaves ───────────────────────────────────
    const floorXOf: Record<string, number> = {};
    model.floors.forEach(f => {
      const ids = [
        ...f.rooms.map(r => r.room_id),
        ...f.doors.map(d => d.door_id),
      ].filter(Boolean);
      if (ids.length === 0) { floorXOf[f.floor_id] = 0.5; return; }
      const xs = ids.map(id => norm(leafXOf[id] ?? 0));
      floorXOf[f.floor_id] = xs.reduce((a, b) => a + b, 0) / xs.length;
    });

    // ── Building x = average of floor xs ───────────────────────────────────
    const floorXVals = Object.values(floorXOf);
    const buildingX = floorXVals.length
      ? floorXVals.reduce((a, b) => a + b, 0) / floorXVals.length
      : 0.5;

    // ── Edge arrays ─────────────────────────────────────────────────────────
    const ex: (number | null)[] = [];
    const ey: (number | null)[] = [];
    const addEdge = (x0: number, y0: number, x1: number, y1: number) => {
      ex.push(x0, x1, null); ey.push(y0, y1, null);
    };

    model.floors.forEach(f => {
      const fx = floorXOf[f.floor_id] ?? 0.5;
      addEdge(buildingX, LY.building, fx, LY.floor);
      [...f.rooms.map(r => r.room_id), ...f.doors.map(d => d.door_id)]
        .filter(Boolean)
        .forEach(id => {
          addEdge(fx, LY.floor, norm(leafXOf[id] ?? 0), LY.leaf);
        });
    });

    const edgeTrace: Data = {
      type: "scatter", mode: "lines",
      x: ex, y: ey,
      line: { color: "#cbd5e1", width: 1.5 },
      hoverinfo: "skip", showlegend: false, name: "_e",
    };

    // ── Node arrays ─────────────────────────────────────────────────────────
    const nx: number[] = [], ny: number[] = [];
    const nc: string[] = [], nbc: string[] = [];
    const nsz: number[] = [], nsy: string[] = [];
    const nlabel: string[] = [], nhover: string[] = [];

    const pushNode = (
      x: number, y: number,
      fill: string, border: string, size: number, sym: string,
      label: string, hover: string
    ) => {
      nx.push(x); ny.push(y);
      nc.push(fill); nbc.push(border);
      nsz.push(size); nsy.push(sym);
      nlabel.push(label); nhover.push(hover);
    };

    // Building
    const bName = trunc(model.building?.name, 14) || "Building";
    pushNode(
      buildingX, LY.building, "#1e293b", "#0f172a", 28, "square",
      bName,
      `<b>${model.building?.name ?? "Building"}</b><br>建筑根节点 · ${model.floors.length} 楼层<extra></extra>`
    );

    model.floors.forEach(f => {
      if (!f) return;
      const fx = floorXOf[f.floor_id] ?? 0.5;
      const fireEx = (f.doors ?? []).filter(d => d?.is_fire_exit).length;
      pushNode(
        fx, LY.floor, "#3b82f6", "#1d4ed8", 22, "diamond",
        trunc(f.floor_id, 8) || "Floor",
        `<b>楼层 ${f.floor_id}</b><br>${(f.rooms ?? []).length} 房间 · ${fireEx} 消防门<extra></extra>`
      );

      // Rooms
      (f.rooms ?? []).forEach(room => {
        if (!room?.room_id) return;
        const isFail = roomFail.has(room.room_id);
        const fill = isFail ? "#ef4444" : "#22c55e";
        const bord = isFail ? "#991b1b" : "#15803d";
        pushNode(
          norm(leafXOf[room.room_id] ?? 0), LY.leaf, fill, bord, 20, "circle",
          trunc(room.name, 8),
          `<b>${room.name ?? room.room_id}</b><br>ID: ${room.room_id}<br>` +
          `距出口: ${room.distance_to_exit_m ?? "?"} m (≤ ${MAX_TRAVEL_DISTANCE_M} m)<br>` +
          `状态: ${isFail ? "❌ 违规" : "✅ 合规"}<extra></extra>`
        );
      });

      // Doors
      (f.doors ?? []).forEach(door => {
        if (!door?.door_id) return;
        const isFail   = doorFail.has(door.door_id);
        const isFireEx = !!door.is_fire_exit;
        const fill = !isFireEx ? "#94a3b8" : isFail ? "#ef4444" : "#22c55e";
        const bord = !isFireEx ? "#64748b" : isFail ? "#991b1b" : "#15803d";
        const sym  = isFireEx ? "triangle-up" : "triangle-up-open";
        pushNode(
          norm(leafXOf[door.door_id] ?? 0), LY.leaf, fill, bord,
          isFireEx ? 18 : 14, sym,
          trunc(door.door_id, 10),
          `<b>${door.door_id}</b><br>净宽: ${door.clear_width_mm ?? "?"} mm (≥ ${MIN_FIRE_DOOR_WIDTH_MM} mm)<br>` +
          `消防门: ${isFireEx ? "是" : "否"}<br>` +
          (isFireEx
            ? `耐火: ${door.fire_rating_min ?? 0} min · 状态: ${isFail ? "❌ 违规" : "✅ 合规"}`
            : "（非消防门，不检查宽度）"
          ) + "<extra></extra>"
        );
      });
    });

    const nodeTrace: Data = {
      type: "scatter", mode: "text+markers",
      x: nx, y: ny,
      marker: {
        symbol: nsy, size: nsz, color: nc,
        line: { color: nbc, width: 2.5 },
      },
      text: nlabel,
      textposition: "bottom center",
      textfont: { size: 10, color: "#334155" },
      hovertemplate: nhover,
      showlegend: false, name: "_n",
    };

    // Legend dummy traces
    const leg = (name: string, color: string, sym: string, border: string): Data => ({
      type: "scatter", mode: "markers", x: [null], y: [null],
      marker: { symbol: sym, size: 12, color, line: { color: border, width: 2 } },
      name, showlegend: true,
    });

    const traces: Data[] = [
      edgeTrace, nodeTrace,
      leg("建筑 / 楼层",      "#3b82f6", "diamond",         "#1d4ed8"),
      leg("房间 ✅ 合规",     "#22c55e", "circle",           "#15803d"),
      leg("房间 ❌ 违规",     "#ef4444", "circle",           "#991b1b"),
      leg("消防门 ✅ 合规",   "#22c55e", "triangle-up",      "#15803d"),
      leg("消防门 ❌ 违规",   "#ef4444", "triangle-up",      "#991b1b"),
      leg("普通门（不检查）", "#94a3b8", "triangle-up-open", "#64748b"),
    ];

    const layout: Partial<Layout> = {
      autosize: true,
      margin: { t: 30, r: 180, b: 55, l: 95 },
      paper_bgcolor: "#f8fafc", plot_bgcolor: "#f8fafc",
      xaxis: {
        visible: false, range: [-0.08, 1.08], fixedrange: true,
      },
      yaxis: {
        tickvals: [LY.building, LY.floor, LY.leaf],
        ticktext: ["Building", "Floor", "Room / Door"],
        tickfont: { size: 11, color: "#64748b" },
        showgrid: false, zeroline: false,
        range: [-0.3, 3.7], fixedrange: true,
      },
      legend: {
        x: 1.02, y: 1, xanchor: "left",
        font: { size: 11, color: "#334155" },
        bgcolor: "rgba(255,255,255,0.92)",
        bordercolor: "#e2e8f0", borderwidth: 1,
      },
      hoverlabel: {
        bgcolor: "#1e293b", bordercolor: "#334155",
        font: { color: "#f1f5f9", size: 12 }, align: "left",
      },
    };

    return { traces, layout };
  }, [model, report, roomFail, doorFail]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mount Plotly via useEffect (avoids duplicate-React from react-plotly.js) ─
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    let active = true;

    const config: Partial<Config> = {
      displayModeBar: true,
      modeBarButtonsToRemove: [
        "zoom2d", "pan2d", "select2d", "lasso2d",
        "zoomIn2d", "zoomOut2d", "autoScale2d", "resetScale2d",
      ],
      displaylogo: false,
      responsive: true,
    };

    import("plotly.js-dist-min").then(mod => {
      if (!active || !divRef.current) return;
      const Plotly = (mod as any).default ?? mod;
      Plotly.newPlot(divRef.current, traces, layout, config);
    });

    return () => {
      active = false;
      import("plotly.js-dist-min").then(mod => {
        const Plotly = (mod as any).default ?? mod;
        if (divRef.current) Plotly.purge(divRef.current);
      });
    };
  }, [traces, layout]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div ref={divRef} style={{ width: "100%", minHeight: 500 }} />
    </div>
  );
}
