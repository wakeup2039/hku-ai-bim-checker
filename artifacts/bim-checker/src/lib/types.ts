/**
 * Simplified building model — JSON-serialisable representation of a floor plan.
 * Coordinates are in millimetres (mm) in a 2-D plan view.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  name: string;
  /** E.g. "OFFICE", "CORRIDOR", "MEETING_ROOM", "TOILET", "STORAGE" */
  type: string;
  /** Axis-aligned bounding rectangle corner points (4 points, clockwise from top-left) */
  polygon: Point2D[];
  /** Pre-computed geometric centre (mm) */
  centroid: Point2D;
  /** Floor area in m² */
  areaSqm: number;
}

export interface Door {
  id: string;
  name: string;
  /** Net clear width in mm */
  netWidthMm: number;
  /** Position on the floor plan (mm) */
  position: Point2D;
  /** True → this door is counted as an evacuation door and must meet minimum width */
  isEvacuationDoor: boolean;
  /** Optional label describing the door's location */
  label?: string;
}

export interface Exit {
  id: string;
  /** E.g. "STAIRCASE", "FIRE_EXIT", "MAIN_ENTRANCE" */
  type: string;
  /** Position on the floor plan (mm) */
  position: Point2D;
  label: string;
}

export interface Floor {
  id: string;
  name: string;
  /** Floor elevation (mm above ground) — informational */
  elevationMm: number;
  rooms: Room[];
  doors: Door[];
  exits: Exit[];
}

export interface Building {
  name: string;
  /** E.g. "OFFICE", "RESIDENTIAL", "COMMERCIAL", "MIXED" */
  type: string;
  /** Applicable code: default "GB 50016-2014" */
  applicableCode?: string;
  floors: Floor[];
}

export interface BuildingModel {
  building: Building;
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
