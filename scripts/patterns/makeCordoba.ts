import {Pattern, SimpleGroup, SimpleLine, SimplePoint} from "../types";
import {TileEdges100Square} from "./utils";
import {intersectLine, pointSetToAngle, toRadian, vecAdd} from "../utils/math";
import {mirrorShapeAtBottomRightCorner, reflectAtBottomEdge, reflectAtRightEdge} from "../rough/hachure";


export function makeCordoba(angle: number): Pattern {
  const A: SimplePoint = [100, 91.42135620117188];
  const B: SimplePoint = [91.42135620117188, 100];

  const a: SimplePoint = [0, 50];
  const b: SimplePoint = [35.35533905029297, 64.64466094970703];
  const c: SimplePoint = [50, 100];
  const d: SimplePoint = [64.64466094970703, 64.64466094970703];
  const e: SimplePoint = [100, 50];
  const f: SimplePoint = [64.64466094970703, 35.35533905029297];
  const g: SimplePoint = [50, 0];
  const h: SimplePoint = [35.35533905029297, 35.35533905029297];
  const i: SimplePoint = [14.644660949707031, 14.644660949707031];
  const j: SimplePoint = [14.644660949707031, 85.35533905029297];
  const k: SimplePoint = [85.35533905029297, 85.35533905029297];
  const l: SimplePoint = [85.35533905029297, 14.644660949707031];
  const m: SimplePoint = [29.289321899414062, 50];
  const n: SimplePoint = [50, 29.289321899414062];
  const o: SimplePoint = [70.71067810058594, 50];
  const p: SimplePoint = [50, 70.71067810058594];


  // Set of points we move inward
  const pointsToChange = [n, f, o, d, p, b, m, h];
  pointsToChange.forEach((point, idx) => {
    let m = pointSetToAngle([0, 0], toRadian(90 + 45 * idx), -14 + angle * 25);
    vecAdd(point, m);
  })

  const x = intersectLine([l, n], [g, f])
  const q = intersectLine([l, o], [e, f])
  const r = intersectLine([k, o], [e, d])
  const s = intersectLine([k, p], [c, d])
  const t = intersectLine([c, b], [j, p])
  const u = intersectLine([j, m], [a, b])
  const v = intersectLine([a, h], [i, m])
  const w = intersectLine([i, n], [g, h])

  const lines: SimpleLine[] = [
    // from left center, down
    [b, u],
    [u, a],

    // from bottom center to left
    [t, c],
    [t, b],

    // from top center to right
    [x, g],
    [f, x],

    // from top center to left
    [w, g],
    [h, w],

    // from bottom center to the right
    [s, c],
    [d, s],

    // from right center to down
    [r, e],
    [d, r],

    // from right center to up
    [q, e],
    [f, q],

    // center left, to up
    [v, a],
    [h, v],

    // top left, left edge
    [i, [0, 8.578643798828125]],
    [w, i],
    [n, w],

    // top left, top edge
    [i, [8.578643798828125, 0]],
    [v, i],
    [m, v],

    // top/right right edge
    [n, x],
    [l, [100, 8.578643798828125]],
    [x, l],

    // top right, top edge
    [l, [91.42135620117188, 0]],
    [q, l],
    [o, q],

    // bottom/left left edge
    [p, t],
    [j, [0, 91.42135620117188]],
    [t, j],

    // bottom left, bottom
    [j, [8.578643798828125, 100]],
    [u, j],
    [m, u],

    // bottom right, right edge
    [k, A],
    [s, k],
    [p, s],

    // bottom right, bottom edge
    [o, r],
    [k, B],
    [r, k],
  ];


  const shapes: SimpleGroup[] = [
    // stars, starting at the top, clock-wise
    [g, x, n, w],
    [x, l, q, f],
    [q, e, r, o],
    [r, k, s, d],
    [s, c, t, p],
    [j, u, b, t],
    [v, i, w, h],
    [a, v, m, u],

    // middle
    [n, x, f, q, o, r, d, s, p, t, b, u, m, v, h, w]
  ];

  return {
    label: {
      title: 'The Great Mosque of Cordoba',
      location: 'Cordoba, Spain (AD 784 / AH 167)'
    },
    tilingMode: 'square',
    tileSize: [100, 100],
    tileEdges: TileEdges100Square,
    shapes,
    lines,
    // only works well within a certain angle range
    // interlacingConfig: [
    //   [9, 8, 0, 0, 5, 0, 0, false],
    //   [8, 9, 0, 0, 2, 3, 0, false]
    // ],
    externalShapes: [
      reflectAtRightEdge([[100, 8.578643798828125], l, q, e]),
      reflectAtRightEdge([e, r, k, A]),
      mirrorShapeAtBottomRightCorner([A, k, B]),
      reflectAtBottomEdge([B, k, s, c]),
      reflectAtBottomEdge([c, t, j, [8.578643798828125, 100]])
    ],
    fillPatterns: [
      [
        [[8, 1, 3, 5, 6, 11], []],
        [[], [8, 1, 3, 5, 6, 11]]
      ],
      [
        [[8, 1, 3, 5, 6, 11], [11]],
        [[11], [8, 1, 3, 5, 6, 11]]
      ],
      [[
        [[0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13], [2, 7, 8, 9, 10, 11]],
        [[0, 4, 8, 11, 12, 13], [0, 1, 2, 3, 4, 5, 6, 7, 8, 11]]
      ], {shiftX: -0.5, shiftY: -0.5}],
      [[
        [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], [2, 7, 9, 10, 11]],
        [[0, 4, 11, 12, 13], [0,1,2,3,4,5,6,7,8, 11]]
      ], {shiftX: -0.5, shiftY: -0.5}],
      [
        [[9, 10, 12, 13]],
      ],
      [[
        [[9, 10, 11, 12, 13]],
      ], {}],
      [[
        [[0, 2, 4, 7, 8, 11]],
        [[11, 6, 3,1,5], [0, 2, 4, 7, 8, 11]]
      ], {shiftY: -0.5, shiftX: 1}],
      [[
        [[0, 2, 4, 7, 8]],
        [[], [0, 2, 4, 7, 8]]
      ], {shiftY: -0.5, shiftX: 0.5}],
      [[
        [[0, 1, 2, 3, 4, 5, 6, 7]],
        [[8], [0, 1, 2, 3, 4, 5, 6, 7]]
      ], {shiftX: 0.5, shiftY: 0.5}],
      [
        [[0, 1, 2, 3, 4, 5, 6, 7]],
      ]
    ]
  }
}