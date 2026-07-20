/**
 * Sample building model: "Innovation Tower – Level 3"
 *
 * Layout (all coords in mm, origin = bottom-left):
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │         [Exit E2 – North Staircase] @(20000,30000)   │
 *   │                                                       │
 *   │  [Storage]          [Open Office]        [Server Rm] │
 *   │  R104                R103                R105        │
 *   │  centroid(5,22)      centroid(20,22)     centroid    │
 *   │                                          (38,22)km   │
 *   │────────────────── Corridor ────────────────────────  │
 *   │  [Meeting A]        [Reception]          [Meeting B] │
 *   │  R101               R102                 R106        │
 *   │  centroid(5,8)      centroid(20,8)       centroid    │
 *   │                                          (38,8)      │
 *   │         [Exit E1 – Main Entrance] @(20000,0)         │
 *   └──────────────────────────────────────────────────────┘
 *
 * Intentional violations:
 *  • Door D102 – evacuation door width 750 mm  (< 900 mm)  → FAIL Rule 1
 *  • Door D105 – evacuation door width 820 mm  (< 900 mm)  → FAIL Rule 1
 *  • Room R105 (Server Room) centroid at (38000, 22000):
 *      nearest exit E2 @(20000,30000) → distance ≈ 19.7 m   OK
 *    We place an additional remote room R107 at (38000, 15000) with
 *      nearest exit E2 @(20000,30000) → distance ≈ 20.6 m   OK  (demo variation)
 *    To force a travel-distance failure we move R105 to a far corner:
 *      centroid (38000, 25000), nearest exit E2 @(20000,30000):
 *        d = √((38000-20000)²+(25000-30000)²) = √(324000000+25000000) ≈ 18687 mm  OK
 *    We instead add a distant basement-level annex room "Archive" at (55000, 25000):
 *        nearest E2 @(20000,30000): d = √(35²+5²)×1000 ≈ 35355 mm → FAIL Rule 2
 */

import type { BuildingModel } from "./types";

export const SAMPLE_MODEL: BuildingModel = {
  building: {
    name: "Innovation Tower",
    type: "OFFICE",
    applicableCode: "GB 50016-2014",
    floors: [
      {
        id: "F3",
        name: "Level 3",
        elevationMm: 8400,
        rooms: [
          {
            id: "R101",
            name: "Meeting Room A",
            type: "MEETING_ROOM",
            polygon: [
              { x: 0, y: 0 },
              { x: 10000, y: 0 },
              { x: 10000, y: 15000 },
              { x: 0, y: 15000 },
            ],
            centroid: { x: 5000, y: 7500 },
            areaSqm: 150,
          },
          {
            id: "R102",
            name: "Reception & Lobby",
            type: "RECEPTION",
            polygon: [
              { x: 10000, y: 0 },
              { x: 30000, y: 0 },
              { x: 30000, y: 15000 },
              { x: 10000, y: 15000 },
            ],
            centroid: { x: 20000, y: 7500 },
            areaSqm: 300,
          },
          {
            id: "R103",
            name: "Open Office",
            type: "OFFICE",
            polygon: [
              { x: 10000, y: 15000 },
              { x: 30000, y: 15000 },
              { x: 30000, y: 30000 },
              { x: 10000, y: 30000 },
            ],
            centroid: { x: 20000, y: 22500 },
            areaSqm: 300,
          },
          {
            id: "R104",
            name: "Storage",
            type: "STORAGE",
            polygon: [
              { x: 0, y: 15000 },
              { x: 10000, y: 15000 },
              { x: 10000, y: 30000 },
              { x: 0, y: 30000 },
            ],
            centroid: { x: 5000, y: 22500 },
            areaSqm: 150,
          },
          {
            id: "R105",
            name: "Server Room",
            type: "SERVER_ROOM",
            polygon: [
              { x: 30000, y: 0 },
              { x: 45000, y: 0 },
              { x: 45000, y: 15000 },
              { x: 30000, y: 15000 },
            ],
            centroid: { x: 37500, y: 7500 },
            areaSqm: 225,
          },
          {
            id: "R106",
            name: "Meeting Room B",
            type: "MEETING_ROOM",
            polygon: [
              { x: 30000, y: 15000 },
              { x: 45000, y: 15000 },
              { x: 45000, y: 30000 },
              { x: 30000, y: 30000 },
            ],
            centroid: { x: 37500, y: 22500 },
            areaSqm: 225,
          },
          {
            id: "R107",
            name: "Archive & Records",
            type: "STORAGE",
            polygon: [
              { x: 45000, y: 0 },
              { x: 62000, y: 0 },
              { x: 62000, y: 30000 },
              { x: 45000, y: 30000 },
            ],
            centroid: { x: 53500, y: 15000 },
            areaSqm: 510,
          },
        ],
        doors: [
          {
            id: "D101",
            name: "Door D101",
            label: "Meeting Room A – corridor",
            netWidthMm: 950,
            position: { x: 10000, y: 7500 },
            isEvacuationDoor: true,
          },
          {
            id: "D102",
            name: "Door D102",
            label: "Reception – south exit",
            netWidthMm: 750,
            position: { x: 20000, y: 0 },
            isEvacuationDoor: true,
          },
          {
            id: "D103",
            name: "Door D103",
            label: "Open Office – north staircase",
            netWidthMm: 1000,
            position: { x: 20000, y: 30000 },
            isEvacuationDoor: true,
          },
          {
            id: "D104",
            name: "Door D104",
            label: "Storage – corridor",
            netWidthMm: 900,
            position: { x: 5000, y: 15000 },
            isEvacuationDoor: false,
          },
          {
            id: "D105",
            name: "Door D105",
            label: "Server Room – east corridor",
            netWidthMm: 820,
            position: { x: 45000, y: 7500 },
            isEvacuationDoor: true,
          },
          {
            id: "D106",
            name: "Door D106",
            label: "Meeting Room B – north staircase",
            netWidthMm: 900,
            position: { x: 37500, y: 30000 },
            isEvacuationDoor: true,
          },
          {
            id: "D107",
            name: "Door D107",
            label: "Archive – east corridor",
            netWidthMm: 800,
            position: { x: 45000, y: 15000 },
            isEvacuationDoor: false,
          },
        ],
        exits: [
          {
            id: "E1",
            type: "MAIN_ENTRANCE",
            position: { x: 20000, y: 0 },
            label: "Main Entrance / South Exit",
          },
          {
            id: "E2",
            type: "STAIRCASE",
            position: { x: 20000, y: 30000 },
            label: "North Staircase",
          },
        ],
      },
    ],
  },
};

/** A "clean" model with no violations – useful for demonstrating the all-pass state */
export const CLEAN_MODEL: BuildingModel = {
  building: {
    name: "Compliant Office Block",
    type: "OFFICE",
    applicableCode: "GB 50016-2014",
    floors: [
      {
        id: "F1",
        name: "Ground Floor",
        elevationMm: 0,
        rooms: [
          {
            id: "R201",
            name: "Office A",
            type: "OFFICE",
            polygon: [
              { x: 0, y: 0 },
              { x: 12000, y: 0 },
              { x: 12000, y: 12000 },
              { x: 0, y: 12000 },
            ],
            centroid: { x: 6000, y: 6000 },
            areaSqm: 144,
          },
          {
            id: "R202",
            name: "Office B",
            type: "OFFICE",
            polygon: [
              { x: 12000, y: 0 },
              { x: 24000, y: 0 },
              { x: 24000, y: 12000 },
              { x: 12000, y: 12000 },
            ],
            centroid: { x: 18000, y: 6000 },
            areaSqm: 144,
          },
        ],
        doors: [
          {
            id: "D201",
            name: "Door D201",
            label: "Office A – main exit",
            netWidthMm: 1000,
            position: { x: 0, y: 6000 },
            isEvacuationDoor: true,
          },
          {
            id: "D202",
            name: "Door D202",
            label: "Office B – main exit",
            netWidthMm: 950,
            position: { x: 24000, y: 6000 },
            isEvacuationDoor: true,
          },
        ],
        exits: [
          {
            id: "E201",
            type: "FIRE_EXIT",
            position: { x: 0, y: 6000 },
            label: "West Fire Exit",
          },
          {
            id: "E202",
            type: "FIRE_EXIT",
            position: { x: 24000, y: 6000 },
            label: "East Fire Exit",
          },
        ],
      },
    ],
  },
};

export const SAMPLE_JSON = JSON.stringify(SAMPLE_MODEL, null, 2);
