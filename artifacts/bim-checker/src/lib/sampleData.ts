/**
 * Sample building models using the flat GB 50016-2014 schema.
 * Coordinates are in millimetres (mm), origin = bottom-left of each floor.
 *
 * SAMPLE_MODEL  — "HKU Innovation Center"
 *   Intentional violations:
 *     • D102_EXIT: is_fire_exit=true, clear_width_mm=800 (< 900) → FAIL Rule 1
 *     • D202_EXIT: is_fire_exit=true, clear_width_mm=850 (< 900) → FAIL Rule 1
 *     • R102 "主会议室": distance_to_exit_m=34.5 (> 30) → FAIL Rule 2
 *
 * CLEAN_MODEL   — "HKU Library Annex"
 *   All fire exit doors ≥ 900 mm, all rooms ≤ 30 m → 100% PASS
 */

import type { BuildingModel } from "./types";

/** Demo model with intentional violations — mirrors the Python DEFAULT_DATA */
export const SAMPLE_MODEL: BuildingModel = {
  building: { name: "HKU Innovation Center" },
  floors: [
    {
      floor_id: "F1",
      rooms: [
        {
          room_id: "R101",
          name: "服务器机房",
          distance_to_exit_m: 18.0,
          center:  { x: 10000, y: 7500 },
          polygon: [
            { x: 0,     y: 0     },
            { x: 20000, y: 0     },
            { x: 20000, y: 15000 },
            { x: 0,     y: 15000 },
          ],
        },
        {
          room_id: "R102",
          name: "主会议室",
          distance_to_exit_m: 34.5,   // ← VIOLATION: > 30 m
          center:  { x: 30000, y: 7500 },
          polygon: [
            { x: 20000, y: 0     },
            { x: 40000, y: 0     },
            { x: 40000, y: 15000 },
            { x: 20000, y: 15000 },
          ],
        },
        {
          room_id: "R103",
          name: "开放办公区",
          distance_to_exit_m: 22.0,
          center:  { x: 20000, y: 22500 },
          polygon: [
            { x: 0,     y: 15000 },
            { x: 40000, y: 15000 },
            { x: 40000, y: 30000 },
            { x: 0,     y: 30000 },
          ],
        },
        {
          room_id: "R104",
          name: "接待大厅",
          distance_to_exit_m: 12.5,
          center:  { x: 50000, y: 15000 },
          polygon: [
            { x: 40000, y: 0     },
            { x: 60000, y: 0     },
            { x: 60000, y: 30000 },
            { x: 40000, y: 30000 },
          ],
        },
      ],
      doors: [
        {
          door_id: "D101",
          clear_width_mm: 850,
          is_fire_exit: false,
          fire_rating_min: 0,
          location: { x: 0, y: 7500 },
        },
        {
          door_id: "D102_EXIT",
          clear_width_mm: 800,         // ← VIOLATION: < 900 mm
          is_fire_exit: true,
          fire_rating_min: 60,
          location: { x: 20000, y: 0 },
        },
        {
          door_id: "D103_EXIT",
          clear_width_mm: 900,
          is_fire_exit: true,
          fire_rating_min: 60,
          location: { x: 40000, y: 0 },
        },
        {
          door_id: "D104",
          clear_width_mm: 950,
          is_fire_exit: false,
          fire_rating_min: 0,
          location: { x: 60000, y: 15000 },
        },
      ],
    },
    {
      floor_id: "F2",
      rooms: [
        {
          room_id: "R201",
          name: "研究实验室",
          distance_to_exit_m: 25.0,
          center:  { x: 10000, y: 10000 },
          polygon: [
            { x: 0,     y: 0     },
            { x: 20000, y: 0     },
            { x: 20000, y: 20000 },
            { x: 0,     y: 20000 },
          ],
        },
        {
          room_id: "R202",
          name: "资料室",
          distance_to_exit_m: 28.5,
          center:  { x: 30000, y: 10000 },
          polygon: [
            { x: 20000, y: 0     },
            { x: 40000, y: 0     },
            { x: 40000, y: 20000 },
            { x: 20000, y: 20000 },
          ],
        },
      ],
      doors: [
        {
          door_id: "D201_EXIT",
          clear_width_mm: 1000,
          is_fire_exit: true,
          fire_rating_min: 60,
          location: { x: 0, y: 10000 },
        },
        {
          door_id: "D202_EXIT",
          clear_width_mm: 850,         // ← VIOLATION: < 900 mm
          is_fire_exit: true,
          fire_rating_min: 90,
          location: { x: 40000, y: 10000 },
        },
      ],
    },
  ],
};

/** Clean model — no violations */
export const CLEAN_MODEL: BuildingModel = {
  building: { name: "HKU Library Annex" },
  floors: [
    {
      floor_id: "F1",
      rooms: [
        {
          room_id: "R101",
          name: "阅览室",
          distance_to_exit_m: 15.0,
          center:  { x: 9000, y: 9000 },
          polygon: [
            { x: 0,     y: 0     },
            { x: 18000, y: 0     },
            { x: 18000, y: 18000 },
            { x: 0,     y: 18000 },
          ],
        },
        {
          room_id: "R102",
          name: "研讨室",
          distance_to_exit_m: 20.0,
          center:  { x: 27000, y: 9000 },
          polygon: [
            { x: 18000, y: 0     },
            { x: 36000, y: 0     },
            { x: 36000, y: 18000 },
            { x: 18000, y: 18000 },
          ],
        },
        {
          room_id: "R103",
          name: "办公室",
          distance_to_exit_m: 28.0,
          center:  { x: 18000, y: 27000 },
          polygon: [
            { x: 0,     y: 18000 },
            { x: 36000, y: 18000 },
            { x: 36000, y: 36000 },
            { x: 0,     y: 36000 },
          ],
        },
      ],
      doors: [
        {
          door_id: "D101_EXIT",
          clear_width_mm: 1000,
          is_fire_exit: true,
          fire_rating_min: 60,
          location: { x: 0, y: 9000 },
        },
        {
          door_id: "D102_EXIT",
          clear_width_mm: 900,
          is_fire_exit: true,
          fire_rating_min: 60,
          location: { x: 36000, y: 9000 },
        },
        {
          door_id: "D103",
          clear_width_mm: 850,
          is_fire_exit: false,
          fire_rating_min: 0,
          location: { x: 18000, y: 18000 },
        },
      ],
    },
  ],
};

export const SAMPLE_JSON = JSON.stringify(SAMPLE_MODEL, null, 2);
