/**
 * jsonAnnotate.ts
 *
 * Maps ComplianceReport violations back to exact JSON paths in the BuildingModel,
 * so the JSON viewer can highlight the specific fields that caused each failure.
 *
 * Path format uses dot-notation with bracket indices:
 *   "building.floors[0].doors[1].netWidthMm"
 */

import type { BuildingModel, ComplianceReport, CheckItem } from "./types";

export interface Annotation {
  /** The violated element's path (e.g. the whole door object) */
  elementPath: string;
  /** The specific bad field path, if we can determine it */
  fieldPath: string | null;
  severity: "PASS" | "FAIL" | "WARNING";
  ruleId: string;
  ruleName: string;
  ruleCode: string;
  message: string;
  actualValue?: number;
  thresholdValue?: number;
  unit?: string;
}

export type AnnotationMap = Map<string, Annotation[]>;

/**
 * Given a BuildingModel and ComplianceReport, returns a map from
 * JSON path string → list of annotations at that path.
 */
export function buildAnnotationMap(
  model: BuildingModel,
  report: ComplianceReport
): AnnotationMap {
  const map: AnnotationMap = new Map();

  const add = (path: string, ann: Annotation) => {
    if (!map.has(path)) map.set(path, []);
    map.get(path)!.push(ann);
  };

  for (const rule of report.rules) {
    for (const item of rule.items) {
      if (item.severity !== "FAIL" && item.severity !== "WARNING") continue;

      const ann: Omit<Annotation, "elementPath" | "fieldPath"> = {
        severity: item.severity,
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        ruleCode: rule.ruleCode,
        message: item.message,
        actualValue: item.actualValue,
        thresholdValue: item.thresholdValue,
        unit: item.unit,
      };

      // Walk the model to find the element by id
      model.building.floors.forEach((floor, fi) => {
        const floorBase = `building.floors[${fi}]`;

        // Door check
        floor.doors.forEach((door, di) => {
          if (door.id !== item.elementId) return;
          const doorPath = `${floorBase}.doors[${di}]`;
          const fieldPath =
            rule.ruleId === "GB-DOOR-WIDTH"
              ? `${doorPath}.netWidthMm`
              : null;

          add(doorPath, { ...ann, elementPath: doorPath, fieldPath });
          if (fieldPath) add(fieldPath, { ...ann, elementPath: doorPath, fieldPath });
        });

        // Room check
        floor.rooms.forEach((room, ri) => {
          if (room.id !== item.elementId) return;
          const roomPath = `${floorBase}.rooms[${ri}]`;
          // Travel distance is a derived value (centroid → exit), no single field
          add(roomPath, { ...ann, elementPath: roomPath, fieldPath: null });
        });
      });
    }
  }

  return map;
}
