import {Pattern, SimpleGroup, SimpleLine, SimplePoint} from "../types";
import {TileEdges100Square} from "./utils";
import {intersectLine, moveBy, vecAdd} from "../utils/math";
import {mapRandom, Random} from "../utils/random";


export function makeKharraqan(angle: number): Pattern {
  const o: SimplePoint = [60.35533905029297, 75];
  const p: SimplePoint = [39.64466094970703, 75];
  const m: SimplePoint = [39.64466094970703, 25]
  const n: SimplePoint = [60.35533905029297, 25]

  const nn: SimplePoint = [75, 39.64466094970703]
  const oo: SimplePoint = [75, 60.35533905029297]
  const pp: SimplePoint = [25, 60.35533905029297]
  const mm: SimplePoint = [25, 39.64466094970703]

  const A: SimplePoint = [100, 50]
  const B: SimplePoint = [50, 100]
  const C: SimplePoint = [0, 50]
  const D: SimplePoint = [50, 0]
  const r: SimplePoint = [25, 10.355339050292969]
  const s: SimplePoint = [75, 10.355339050292969]
  const t: SimplePoint = [75, 89.64466094970703]
  const u: SimplePoint = [25, 89.64466094970703]
  const b1: SimplePoint = [89.64466094970703, 25]
  const b2: SimplePoint = [10.355339050292969, 25]
  const b3: SimplePoint = [89.64466094970703, 75]
  const b4: SimplePoint = [10.355339050292969, 75]

  const random = new Random(angle ?? 0);

  // the center cross
  let mod = mapRandom(random.next(), -6, 10);
  vecAdd(o, [mod, 0])
  vecAdd(p, [-mod, 0])
  vecAdd(m, [-mod, 0])
  vecAdd(n, [mod, 0])

  // the left/right sided triangles
  let mod2 = mapRandom(random.next(), -10, 6)
  vecAdd(nn, [0, mod2])
  vecAdd(oo, [0, -mod2])
  vecAdd(mm, [0, mod2])
  vecAdd(pp, [0, -mod2])

  let mod3 = mapRandom(random.next(), -10, 10);
  const vertTopLeft: SimpleLine = [r, mm];
  moveBy(vertTopLeft, -mod3, 0);

  const horzTopLeft: SimpleLine = [b2, m];
  moveBy(horzTopLeft, 0, -mod3);

  const horzBottomLeft: SimpleLine = [b4, p];
  const vertBottomLeft: SimpleLine = [pp, u]
  moveBy(horzBottomLeft, 0, mod3);
  moveBy(vertBottomLeft, -mod3, 0);

  const horzBottomRight: SimpleLine = [o, b3];
  const vertBottomRight: SimpleLine = [t, oo]
  moveBy(horzBottomRight, 0, mod3);
  moveBy(vertBottomRight, mod3, 0);

  const horzTopRight: SimpleLine = [n, b1];
  const vertTopRight: SimpleLine = [s, nn]
  moveBy(horzTopRight, 0, -mod3);
  moveBy(vertTopRight, mod3, 0);

  const e: SimplePoint = intersectLine(horzTopLeft, vertTopLeft);
  const h: SimplePoint = intersectLine(horzBottomLeft, vertBottomLeft);
  const g: SimplePoint = intersectLine(horzBottomRight, vertBottomRight);
  const f: SimplePoint = intersectLine(horzTopRight, vertTopRight);

  const L1: SimpleLine = [[0, 0], b2]
  const L2: SimpleLine = [b2, e]
  const L3: SimpleLine = [e, m]

  const L12: SimpleLine = [r, e]
  const L28: SimpleLine = [mm, e]

  const L4: SimpleLine = [[50, 50], m]
  const L5: SimpleLine = [[50, 50], n]
  const L6: SimpleLine = [f, n]
  const L7: SimpleLine = [f, b1]
  const L8: SimpleLine = [[100, 0], b1]
  const L9: SimpleLine = [D, s]
  const L10: SimpleLine = [f, s]
  const L11: SimpleLine = [D, r]
  const L13: SimpleLine = [f, nn]
  const L14: SimpleLine = [nn, A]
  const L15: SimpleLine = [A, oo]
  const L16: SimpleLine = [oo, g]
  const L17: SimpleLine = [g, b3]
  const L18: SimpleLine = [b3, [100, 100]]
  const L19: SimpleLine = [g, o]
  const L20: SimpleLine = [o, [50, 50]]
  const L21: SimpleLine = [p, [50, 50]]
  const L22: SimpleLine = [p, h]
  const L23: SimpleLine = [h, b4]
  const L24: SimpleLine = [b4, [0, 100]]
  const L25: SimpleLine = [h, pp]
  const L26: SimpleLine = [pp, C]
  const L27: SimpleLine = [C, mm]

  const L29: SimpleLine = [h, u]
  const L30: SimpleLine = [u, B]
  const L31: SimpleLine = [B, t]
  const L32: SimpleLine = [t, g]

  const lines: SimpleLine[] = [
    L1, L2, L3, L4, L5, L6, L7,
    L8, L9, L10, L11,
    L12, L13, L14, L15, L16, L17, L18, L19, L20, L21,
    L22, L23, L24, L25, L26, L27, L28, L29, L30, L31, L32
  ];

  const shapes: SimpleGroup[] = [
    [r, D, s, f, n, [50, 50], m, e],
    [C, mm, e, m, [50, 50], p, [25, 75], pp],
    [B, u, [25, 75], p, [50, 50], o, g, t],
    [A, oo, g, o, [50, 50], n, f, nn],
  ]

  return {
    label: {
      title: 'The East Tower of Kharraqan',
      location: 'Kharraqan, Iran (AD 1076 / AH 459)'
    },
    tilingMode: "square",
    tileSize: [100, 100],
    tileEdges: TileEdges100Square,
    shapes,
    shapeSets: [[0, 2], [1, 3]],
    lines,
    interlacingConfig: [
      [6, 5, 0, 0, 0, 2],

      [27, 11, 0, 0, 5, 3, 0, false],
      [27, 11, 0, 0, 3, 5, 0, false],

      [8, 29, 0, -1, 2, 3, 0, false],
      [29, 8, 0, 1,  5, 0, 0, false],

      [17, 0, 1, 1, 5, 0, 0, false],
      [17, 0, 1, 1, 3, 2, 0, false],

      [21, 22, 0, 0, 5, 0, 0, false],
      [21, 22, 0, 0, 3, 2, 0, false],

      [3, 19, 0, 0, 0, 5, 0, false],
      [3, 19, 0, 0, 2, 3, 0, false],

      [13, 25, 1, 0, 3, 5, 0, false],
      [25, 13, -1, 0, 3, 5, 0, false],

      [31, 15, 0, 0, 3, 5, 0, false],
      [31, 15, 0, 0, 5, 3, 0, false],
    ]
  };
}

