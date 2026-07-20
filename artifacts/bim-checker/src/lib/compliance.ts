/**
 * BIM Compliance Engine
 *
 * Implements two rules from GB 50016-2014 (Code for Fire Protection Design of Buildings):
 *
 *  Rule 1 – Fire exit door net clear width ≥ 900 mm
 *           Reference: GB 50016-2014 §5.5.18 / Table 5.5.18
 *
 *  Rule 2 – Room-to-nearest-exit travel distance ≤ 30 m (Type II office/commercial)
 *           Reference: GB 50016-2014 §5.5.17 / Table 5.5.17
 *
 * Schema uses flat JSON: `model.floors[].rooms[].distance_to_exit_m` (pre-computed, metres)
 * and `model.floors[].doors[].clear_width_mm` (mm) with `is_fire_exit` flag.
 */

import type {
  BuildingModel,
  CheckItem,
  ComplianceReport,
  Floor,
  RuleResult,
  Severity,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum fire exit door net clear width (mm) per GB 50016-2014 §5.5.18 */
export const MIN_FIRE_DOOR_WIDTH_MM = 900;

/** Maximum allowable travel distance from any room to the nearest exit (m) per GB 50016-2014 §5.5.17 */
export const MAX_TRAVEL_DISTANCE_M = 30.0;

// ─── Rule 1: Fire exit door clear width ──────────────────────────────────────

function checkDoorWidth(floor: Floor): CheckItem[] {
  const items: CheckItem[] = [];

  for (const door of floor.doors) {
    // Only fire exit doors are subject to the minimum width requirement
    if (!door.is_fire_exit) continue;

    const pass = door.clear_width_mm >= MIN_FIRE_DOOR_WIDTH_MM;
    items.push({
      elementId: door.door_id,
      elementName: door.door_id,
      severity: pass ? "PASS" : "FAIL",
      message: pass
        ? `Net clear width ${door.clear_width_mm} mm ≥ ${MIN_FIRE_DOOR_WIDTH_MM} mm — compliant.`
        : `Net clear width ${door.clear_width_mm} mm < ${MIN_FIRE_DOOR_WIDTH_MM} mm — VIOLATION. Widen by at least ${MIN_FIRE_DOOR_WIDTH_MM - door.clear_width_mm} mm.`,
      actualValue: door.clear_width_mm,
      thresholdValue: MIN_FIRE_DOOR_WIDTH_MM,
      unit: "mm",
    });
  }

  return items;
}

// ─── Rule 2: Room-to-exit travel distance ────────────────────────────────────

function checkTravelDistance(floor: Floor): CheckItem[] {
  const items: CheckItem[] = [];

  for (const room of floor.rooms) {
    const dist = room.distance_to_exit_m;
    const pass = dist <= MAX_TRAVEL_DISTANCE_M;

    items.push({
      elementId: room.room_id,
      elementName: room.name,
      severity: pass ? "PASS" : "FAIL",
      message: pass
        ? `Travel distance ${dist} m ≤ ${MAX_TRAVEL_DISTANCE_M} m — compliant.`
        : `Travel distance ${dist} m > ${MAX_TRAVEL_DISTANCE_M} m — VIOLATION.`,
      actualValue: dist,
      thresholdValue: MAX_TRAVEL_DISTANCE_M,
      unit: "m",
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

  for (const floor of model.floors) {
    allRule1Items.push(...checkDoorWidth(floor));
    allRule2Items.push(...checkTravelDistance(floor));
  }

  const rule1Counts = countBySeverity(allRule1Items);
  const rule2Counts = countBySeverity(allRule2Items);

  const rules: RuleResult[] = [
    {
      ruleId: "GB-DOOR-WIDTH",
      ruleName: "Fire Exit Door Net Clear Width",
      ruleCode: "GB 50016-2014 §5.5.18",
      description: `Every fire exit door must have a net clear width of at least ${MIN_FIRE_DOOR_WIDTH_MM} mm.`,
      items: allRule1Items,
      ...rule1Counts,
    },
    {
      ruleId: "GB-TRAVEL-DIST",
      ruleName: "Room-to-Exit Travel Distance",
      ruleCode: "GB 50016-2014 §5.5.17",
      description: `The walking distance from any room to the nearest exit must not exceed ${MAX_TRAVEL_DISTANCE_M} m.`,
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
