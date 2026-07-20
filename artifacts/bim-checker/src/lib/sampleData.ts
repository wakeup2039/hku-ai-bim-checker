/**
 * Sample building models using the flat GB 50016-2014 schema.
 *
 * SAMPLE_MODEL  — "HKU Innovation Center"
 *   Intentional violations:
 *     • D102_EXIT: is_fire_exit=true, clear_width_mm=800 (< 900) → FAIL Rule 1
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
        },
        {
          room_id: "R102",
          name: "主会议室",
          distance_to_exit_m: 34.5,   // ← VIOLATION: > 30 m
        },
        {
          room_id: "R103",
          name: "开放办公区",
          distance_to_exit_m: 22.0,
        },
        {
          room_id: "R104",
          name: "接待大厅",
          distance_to_exit_m: 12.5,
        },
      ],
      doors: [
        {
          door_id: "D101",
          clear_width_mm: 850,
          is_fire_exit: false,
          fire_rating_min: 0,
        },
        {
          door_id: "D102_EXIT",
          clear_width_mm: 800,         // ← VIOLATION: < 900 mm
          is_fire_exit: true,
          fire_rating_min: 60,
        },
        {
          door_id: "D103_EXIT",
          clear_width_mm: 900,
          is_fire_exit: true,
          fire_rating_min: 60,
        },
        {
          door_id: "D104",
          clear_width_mm: 950,
          is_fire_exit: false,
          fire_rating_min: 0,
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
        },
        {
          room_id: "R202",
          name: "资料室",
          distance_to_exit_m: 28.5,
        },
      ],
      doors: [
        {
          door_id: "D201_EXIT",
          clear_width_mm: 1000,
          is_fire_exit: true,
          fire_rating_min: 60,
        },
        {
          door_id: "D202_EXIT",
          clear_width_mm: 850,         // ← VIOLATION: < 900 mm
          is_fire_exit: true,
          fire_rating_min: 90,
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
        },
        {
          room_id: "R102",
          name: "研讨室",
          distance_to_exit_m: 20.0,
        },
        {
          room_id: "R103",
          name: "办公室",
          distance_to_exit_m: 28.0,
        },
      ],
      doors: [
        {
          door_id: "D101_EXIT",
          clear_width_mm: 1000,
          is_fire_exit: true,
          fire_rating_min: 60,
        },
        {
          door_id: "D102_EXIT",
          clear_width_mm: 900,
          is_fire_exit: true,
          fire_rating_min: 60,
        },
        {
          door_id: "D103",
          clear_width_mm: 850,
          is_fire_exit: false,
          fire_rating_min: 0,
        },
      ],
    },
  ],
};

export const SAMPLE_JSON = JSON.stringify(SAMPLE_MODEL, null, 2);
