/**
 * BIM Compliance Engine
 *
 * Implements two rules from GB 50016-2014 (Code for Fire Protection Design of Buildings):
 *
 *  Rule 1 – Evacuation door net clear width ≥ 900 mm
 *           Reference: GB 50016-2014 §5.5.18 / Table 5.5.18
 *
 *  Rule 2 – Room-to-nearest-exit travel distance ≤ 30 m (Type II office/commercial)
 *           Reference: GB 50016-2014 §5.5.17 / Table 5.5.17
 *
 * All spatial measurements are in millimetres (mm).
 */

import type {
  BuildingModel,
  CheckItem,
  ComplianceReport,
  Door,
  Exit,
  Floor,
  Room,
  RuleResult,
  Severity,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum evacuation door net clear width (mm) per GB 50016-2014 §5.5.18 */
const MIN_EVAC_DOOR_WIDTH_MM = 900;

/**
 * Maximum allowable travel distance from any room to the nearest exit (mm).
 * 30 000 mm = 30 m, applicable to Type II buildings (office/commercial) with sprinklers.
 * Without sprinklers, many codes use 22 m; we default to 30 m here.
 */
const MAX_TRAVEL_DISTANCE_MM = 30_000;

// ─── Geometry helper ──────────────────────────────────────────────────────────

function euclidean(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function nearestExit(point: { x: number; y: number }, exits: Exit[]): Exit | null {
  if (exits.length === 0) return null;
  return exits.reduce((best, exit) =>
    euclidean(point, exit.position) < euclidean(point, best.position) ? exit : best
  );
}

// ─── Rule 1: Evacuation door width ───────────────────────────────────────────

function checkEvacuationDoorWidth(floor: Floor): CheckItem[] {
  const items: CheckItem[] = [];

  for (const door of floor.doors) {
    if (!door.isEvacuationDoor) continue;

    const pass = door.netWidthMm >= MIN_EVAC_DOOR_WIDTH_MM;
    items.push({
      elementId: door.id,
      elementName: `${door.name}${door.label ? ` (${door.label})` : ""}`,
      severity: pass ? "PASS" : "FAIL",
      message: pass
        ? `Net clear width ${door.netWidthMm} mm ≥ ${MIN_EVAC_DOOR_WIDTH_MM} mm — compliant.`
        : `Net clear width ${door.netWidthMm} mm < ${MIN_EVAC_DOOR_WIDTH_MM} mm — VIOLATION. Widen by at least ${MIN_EVAC_DOOR_WIDTH_MM - door.netWidthMm} mm.`,
      actualValue: door.netWidthMm,
      thresholdValue: MIN_EVAC_DOOR_WIDTH_MM,
      unit: "mm",
    });
  }

  return items;
}

// ─── Rule 2: Room-to-exit travel distance ────────────────────────────────────

function checkTravelDistance(floor: Floor): CheckItem[] {
  const items: CheckItem[] = [];

  for (const room of floor.rooms) {
    const nearest = nearestExit(room.centroid, floor.exits);

    if (!nearest) {
      items.push({
        elementId: room.id,
        elementName: room.name,
        severity: "FAIL",
        message: "No exits defined on this floor — cannot evaluate travel distance.",
        unit: "mm",
      });
      continue;
    }

    const distanceMm = Math.round(euclidean(room.centroid, nearest.position));
    const distanceM = (distanceMm / 1000).toFixed(1);
    const pass = distanceMm <= MAX_TRAVEL_DISTANCE_MM;

    items.push({
      elementId: room.id,
      elementName: room.name,
      severity: pass ? "PASS" : "FAIL",
      message: pass
        ? `Travel distance to "${nearest.label}" is ${distanceM} m ≤ ${MAX_TRAVEL_DISTANCE_MM / 1000} m — compliant.`
        : `Travel distance to nearest exit "${nearest.label}" is ${distanceM} m > ${MAX_TRAVEL_DISTANCE_MM / 1000} m — VIOLATION.`,
      actualValue: distanceMm,
      thresholdValue: MAX_TRAVEL_DISTANCE_MM,
      unit: "mm",
    });
  }

  return items;
}

// ─── Public API ───────────────────────────────────────────────────────────────

function countBySeverity(items: CheckItem[]) {
  return {
    passCount: items.filter((i) => i.severity === "PASS").length,
    failCount: items.filter((i) => i.severity === "FAIL").length,
    warnCount: items.filter((i) => i.severity === "WARNING").length,
  };
}

export function runCompliance(model: BuildingModel): ComplianceReport {
  const allRule1Items: CheckItem[] = [];
  const allRule2Items: CheckItem[] = [];

  for (const floor of model.building.floors) {
    allRule1Items.push(...checkEvacuationDoorWidth(floor));
    allRule2Items.push(...checkTravelDistance(floor));
  }

  const rule1Counts = countBySeverity(allRule1Items);
  const rule2Counts = countBySeverity(allRule2Items);

  const rules: RuleResult[] = [
    {
      ruleId: "GB-DOOR-WIDTH",
      ruleName: "Evacuation Door Net Clear Width",
      ruleCode: "GB 50016-2014 §5.5.18",
      description: `Every evacuation door must have a net clear width of at least ${MIN_EVAC_DOOR_WIDTH_MM} mm.`,
      items: allRule1Items,
      ...rule1Counts,
    },
    {
      ruleId: "GB-TRAVEL-DIST",
      ruleName: "Room-to-Exit Travel Distance",
      ruleCode: "GB 50016-2014 §5.5.17",
      description: `The walking distance from any occupied room's centroid to the nearest exit must not exceed ${MAX_TRAVEL_DISTANCE_MM / 1000} m.`,
      items: allRule2Items,
      ...rule2Counts,
    },
  ];

  const totalChecks = allRule1Items.length + allRule2Items.length;
  const totalFail = rule1Counts.failCount + rule2Counts.failCount;
  const totalWarn = rule1Counts.warnCount + rule2Counts.warnCount;
  const totalPass = rule1Counts.passCount + rule2Counts.passCount;

  const overallStatus: Severity =
    totalFail > 0 ? "FAIL" : totalWarn > 0 ? "WARNING" : "PASS";

  return {
    buildingName: model.building.name,
    checkedAt: new Date().toISOString(),
    rules,
    totalChecks,
    totalPass,
    totalFail,
    totalWarn,
    overallStatus,
  };
}

export { MIN_EVAC_DOOR_WIDTH_MM, MAX_TRAVEL_DISTANCE_MM };
