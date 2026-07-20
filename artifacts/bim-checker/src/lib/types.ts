/**
 * Simplified building model — flat JSON schema matching the Python compliance agent.
 * Distances are in metres (m); door widths are in millimetres (mm).
 */

export interface Room {
  room_id: string;
  name: string;
  /** Pre-computed walking distance from room to nearest exit, in metres */
  distance_to_exit_m: number;
}

export interface Door {
  door_id: string;
  /** Net clear width in mm */
  clear_width_mm: number;
  /** True → this is a fire/evacuation exit door and must meet minimum width */
  is_fire_exit: boolean;
  /** Fire-resistance rating in minutes (informational) */
  fire_rating_min: number;
}

export interface Floor {
  floor_id: string;
  rooms: Room[];
  doors: Door[];
}

export interface BuildingModel {
  building: { name: string };
  floors: Floor[];
}

// ─── Compliance result types ──────────────────────────────────────────────────

export type Severity = "PASS" | "FAIL" | "WARNING";

export interface CheckItem {
  elementId: string;
  elementName: string;
  severity: Severity;
  message: string;
  /** Extra numeric detail (e.g. actual width or actual distance) */
  actualValue?: number;
  /** The threshold used for comparison */
  thresholdValue?: number;
  unit?: string;
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  ruleCode: string;       // e.g. "GB 50016-2014 §5.5.18"
  description: string;
  items: CheckItem[];
  passCount: number;
  failCount: number;
  warnCount: number;
}

export interface ComplianceReport {
  buildingName: string;
  checkedAt: string;     // ISO timestamp
  rules: RuleResult[];
  totalChecks: number;
  totalPass: number;
  totalFail: number;
  totalWarn: number;
  overallStatus: Severity;
}
