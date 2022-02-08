import {Pattern, SimpleGroup, SimplePoint} from "../types";
import {makeLinesFromShapes, TileEdges100Square} from "./utils";
import {rotatePoints} from "../rough/hachure";
import {cloneGroup} from "../utils/math";

export function makeCapellaPalatina(angle?: number): Pattern {
  // From 20 to 45, with the proper one being 35.3553390503
  const B = 20 + angle * 25;
  const A = 100 - B;

  const e: SimplePoint = [50, 0];
  const f: SimplePoint = [A, 14.64466];
  const g: SimplePoint = [85.355339, 14.64466];
  const h: SimplePoint = [85.355339, B];
  const i: SimplePoint = [100, 50];
  const j: SimplePoint = [85.355339, A];
  const k: SimplePoint = [85.355339, 85.355339];
  const l: SimplePoint = [A, 85.355339];
  const m: SimplePoint = [50, 100];

  const shapes: SimpleGroup[] = [
    [
      e,
      f,
      g,
      h,
      i,
      j,
      k,
      l,
      m,
      [B, 85.355339],
      [14.644660, 85.3553],
      [14.64466, A],
      [0, 50],
      [14.64466, B],
      [14.644660, 14.64466],
      [B, 14.64466]
    ],
  ];

  return {
    label: {
      title: 'Capella Palatina',
      location: 'Palermo, Sicily, Italy (AD 1132, AH 526)'
    },
    tilingMode: 'square',
    tileSize: [100, 100],
    tileEdges: TileEdges100Square,
    shapes,
    lines: makeLinesFromShapes(shapes),
    interlacingConfig: [
      [0, 8, 0, -1, 3, 5],
      [4, 12, 1, 0, 3, 5]
    ],
    externalShapes: [
      [
        ...[i, j, k, l, m],
        ...rotatePoints(cloneGroup([j, k, l, m]), [100, 100], -90),
        ...rotatePoints(cloneGroup([j, k, l, m]), [100, 100], -180),
        ...rotatePoints(cloneGroup([j, k, l, m]), [100, 100], -270),
      ]
    ],
    fillPatterns: [
      [[
        [[0, 1], [0],],
        [[0], [0, 1],],
      ], {shiftX: 0.5, shiftY: 0.5}],
      [[
        [[1], [0],],
        [[0], [1],],
      ], {shiftX: -0.5}],
      [[
        [[0, 1], [],],
        [[], [0, 1],],
      ], {shiftY: 0.5}],
      [[
        [[1], [0, 1], []],
        [[0, 1], [1], [0]],
        [[], [0], [1]],
      ], {shiftY: 0.5, shiftX: -0}],
      // XXX remove this dupplicate
      [[
        [[1], [0, 1], []],
        [[0, 1], [1], [0]],
        [[], [0], [1]],
      ], {shiftY: 0.5, shiftX: 0}],
    ]
  }
}