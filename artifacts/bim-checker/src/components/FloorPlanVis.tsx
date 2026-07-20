import { useMemo } from "react";
import { BuildingModel, ComplianceReport } from "@/lib/types";

interface Props {
  model: BuildingModel;
  report: ComplianceReport;
}

export function FloorPlanVis({ model, report }: Props) {
  const floor = model.building.floors[0];

  // Build status maps for quick lookup
  const travelItems = report.rules.find(r => r.ruleId === "GB-TRAVEL-DIST")?.items ?? [];
  const doorItems = report.rules.find(r => r.ruleId === "GB-DOOR-WIDTH")?.items ?? [];

  const roomStatus = Object.fromEntries(travelItems.map(i => [i.elementId, i.severity]));
  const doorStatus = Object.fromEntries(doorItems.map(i => [i.elementId, i.severity]));

  // Calculate dynamic bounding box based on rooms
  const { minX, minY, maxX, maxY } = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    floor.rooms.forEach(r => {
      r.polygon.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });
    
    // Fallback if no rooms
    if (minX === Infinity) return { minX: 0, minY: 0, maxX: 62000, maxY: 30000 };
    return { minX, minY, maxX, maxY };
  }, [floor]);

  // Add 10% padding
  const padX = Math.max((maxX - minX) * 0.1, 2000);
  const padY = Math.max((maxY - minY) * 0.1, 2000);

  const vbMinX = minX - padX;
  const vbMinY = minY - padY;
  const vbWidth = (maxX - minX) + padX * 2;
  const vbHeight = (maxY - minY) + padY * 2;

  // Coordinate transform: map Y to SVG space (invert Y so origin is bottom-left visually)
  const ty = (y: number) => maxY - y + minY;

  const getRoomColor = (status?: string) => {
    if (status === 'PASS') return 'rgba(34, 197, 94, 0.1)'; // faint green
    if (status === 'FAIL') return 'rgba(239, 68, 68, 0.1)'; // faint red
    return 'rgba(226, 232, 240, 0.3)'; // faint slate
  }

  const getRoomStroke = (status?: string) => {
    if (status === 'PASS') return 'rgba(34, 197, 94, 0.5)';
    if (status === 'FAIL') return 'rgba(239, 68, 68, 0.6)';
    return 'rgba(148, 163, 184, 0.5)';
  }

  const getDoorColor = (isEvac: boolean, status?: string) => {
    if (!isEvac) return '#94a3b8'; // slate-400
    if (status === 'PASS') return '#22c55e'; // green-500
    if (status === 'FAIL') return '#ef4444'; // red-500
    return '#94a3b8';
  }

  return (
    <div className="w-full h-full min-h-[500px] border border-slate-200 bg-slate-50/50 rounded-xl relative overflow-hidden flex items-center justify-center p-6 shadow-sm">
      <svg
        viewBox={`${vbMinX} ${vbMinY} ${vbWidth} ${vbHeight}`}
        className="w-full h-full max-h-[70vh]"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.05))" }}
      >
        <g>
          {/* Rooms */}
          {floor.rooms.map(room => {
            const pts = room.polygon.map(p => `${p.x},${ty(p.y)}`).join(" ");
            const status = roomStatus[room.id];
            const fontSize = Math.max(vbWidth * 0.018, 500); // Scale font size relative to bounding box
            
            return (
              <g key={room.id} className="transition-all duration-300 group">
                <polygon
                  points={pts}
                  fill={getRoomColor(status)}
                  stroke={getRoomStroke(status)}
                  strokeWidth={Math.max(vbWidth * 0.002, 50)}
                  strokeLinejoin="round"
                  className="group-hover:opacity-80 transition-opacity"
                />
                <text
                  x={room.centroid.x}
                  y={ty(room.centroid.y)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-mono font-semibold pointer-events-none fill-slate-900"
                  style={{ fontSize }}
                >
                  {room.name}
                </text>
                <text
                  x={room.centroid.x}
                  y={ty(room.centroid.y) + (fontSize * 1.5)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-sans font-bold pointer-events-none tracking-widest"
                  style={{ 
                    fontSize: fontSize * 0.6, 
                    fill: status === 'FAIL' ? '#ef4444' : status === 'PASS' ? '#16a34a' : '#64748b' 
                  }}
                >
                  {status || 'UNCHECKED'}
                </text>
              </g>
            );
          })}

          {/* Doors */}
          {floor.doors.map(door => {
            const status = doorStatus[door.id];
            const color = getDoorColor(door.isEvacuationDoor, status);
            // Draw a line representing the door. In absence of rotation, we draw it horizontally.
            const w = Math.max(door.netWidthMm * 2, vbWidth * 0.015); // Exaggerated slightly for visibility
            return (
              <g key={door.id}>
                <line
                  x1={door.position.x - w/2}
                  y1={ty(door.position.y)}
                  x2={door.position.x + w/2}
                  y2={ty(door.position.y)}
                  stroke={color}
                  strokeWidth={Math.max(vbWidth * 0.006, 100)}
                  strokeLinecap="round"
                />
                {status === 'FAIL' && (
                  <circle cx={door.position.x} cy={ty(door.position.y)} r={w*0.8} fill="none" stroke="#ef4444" strokeWidth={Math.max(vbWidth * 0.002, 30)} strokeDasharray="100,100" />
                )}
              </g>
            );
          })}

          {/* Exits */}
          {floor.exits.map(exit => {
            const s = Math.max(vbWidth * 0.012, 400); // Arrow size
            const x = exit.position.x;
            const y = ty(exit.position.y);
            return (
              <g key={exit.id}>
                <polygon
                  points={`${x},${y-s*1.2} ${x-s},${y+s} ${x+s},${y+s}`}
                  fill="#0f172a"
                />
                <text
                  x={x}
                  y={y - s*1.5 - (vbHeight * 0.01)}
                  textAnchor="middle"
                  className="font-mono font-bold fill-slate-900"
                  style={{ fontSize: Math.max(vbWidth * 0.012, 300) }}
                >
                  {exit.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-sm text-xs font-mono">
        <div className="font-semibold mb-3 text-slate-800 tracking-wider">MAP LEGEND</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-sm"></div> 
            <span className="text-slate-600">Pass</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded-sm"></div> 
            <span className="text-slate-600">Fail</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-slate-100 border-2 border-slate-300 rounded-sm"></div> 
            <span className="text-slate-600">Unchecked</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,2 2,14 14,14" fill="#0f172a" /></svg>
            <span className="text-slate-600">Exit Node</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-1.5 bg-red-500 rounded-full"></div> 
            <span className="text-slate-600">Violation Door</span>
          </div>
        </div>
      </div>
    </div>
  );
}