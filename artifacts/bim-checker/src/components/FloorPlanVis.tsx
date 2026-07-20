/**
 * FloorPlanVis.tsx
 *
 * Card-based compliance summary for the flat schema (no polygon/geometry data).
 * Displays rooms and fire-exit doors per floor with pass/fail colour coding.
 */

import { BuildingModel, ComplianceReport } from "@/lib/types";
import { CheckCircle2, XCircle, DoorOpen, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { MIN_FIRE_DOOR_WIDTH_MM, MAX_TRAVEL_DISTANCE_M } from "@/lib/compliance";

interface Props {
  model: BuildingModel;
  report: ComplianceReport;
}

export function FloorPlanVis({ model, report }: Props) {
  // Build status look-ups from the report
  const travelItems = report.rules.find(r => r.ruleId === "GB-TRAVEL-DIST")?.items ?? [];
  const doorItems   = report.rules.find(r => r.ruleId === "GB-DOOR-WIDTH")?.items ?? [];

  const roomStatus  = Object.fromEntries(travelItems.map(i => [i.elementId, i.severity]));
  const doorStatus  = Object.fromEntries(doorItems.map(i => [i.elementId, i.severity]));

  return (
    <div className="w-full border border-slate-200 bg-slate-50/50 rounded-xl overflow-auto max-h-[70vh] p-5 space-y-6">
      {model.floors.map((floor, fi) => (
        <motion.div
          key={floor.floor_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: fi * 0.06 }}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
        >
          {/* Floor header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-800 text-sm tracking-wide">
              Floor {floor.floor_id}
            </span>
            <span className="ml-auto text-xs text-slate-400 font-mono">
              {floor.rooms.length} rooms · {floor.doors.filter(d => d.is_fire_exit).length} fire exits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* ── Rooms ── */}
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Rooms — Travel Distance (≤ {MAX_TRAVEL_DISTANCE_M} m)
              </p>
              <div className="flex flex-col gap-2">
                {floor.rooms.map(room => {
                  const status = roomStatus[room.room_id];
                  const isFail = status === "FAIL";
                  return (
                    <div
                      key={room.room_id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm ${
                        isFail
                          ? "bg-red-50 border-red-200"
                          : "bg-green-50/60 border-green-200/80"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isFail
                          ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          : <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        }
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 truncate">{room.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{room.room_id}</div>
                        </div>
                      </div>
                      <span className={`font-mono font-bold text-sm ml-3 flex-shrink-0 ${
                        isFail ? "text-red-600" : "text-green-700"
                      }`}>
                        {room.distance_to_exit_m} m
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Doors ── */}
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Doors — Clear Width (fire exits ≥ {MIN_FIRE_DOOR_WIDTH_MM} mm)
              </p>
              <div className="flex flex-col gap-2">
                {floor.doors.map(door => {
                  const status   = doorStatus[door.door_id];
                  const isFail   = status === "FAIL";
                  const isFireEx = door.is_fire_exit;
                  return (
                    <div
                      key={door.door_id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm ${
                        !isFireEx
                          ? "bg-slate-50 border-slate-200"
                          : isFail
                            ? "bg-red-50 border-red-200"
                            : "bg-green-50/60 border-green-200/80"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {!isFireEx
                          ? <DoorOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          : isFail
                            ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            : <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        }
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 truncate font-mono text-xs">{door.door_id}</div>
                          <div className="text-[10px] text-slate-400">
                            {isFireEx
                              ? `fire exit · ${door.fire_rating_min} min`
                              : "non-exit door"}
                          </div>
                        </div>
                      </div>
                      <span className={`font-mono font-bold text-sm ml-3 flex-shrink-0 ${
                        !isFireEx
                          ? "text-slate-500"
                          : isFail ? "text-red-600" : "text-green-700"
                      }`}>
                        {door.clear_width_mm} mm
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
