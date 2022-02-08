import {Pattern, SimpleGroup, SimpleLine, SimplePoint} from "../types";
import {makeLinesFromShapes, moveHexagonPoints} from "./utils";
import {intersectLine, lineInterpolate, moveBy, vecAdd} from '../utils/math';
import {getFormSize, getPolygonEdges} from "./makeGeneratedPattern";
import {mirrorHexagonEdge, reflectAtEdge, rotatePoints} from "../rough/hachure";


function slideOn(line: SimpleLine, pos: number) {
  const s = 0.2;
  const w = 0.2;
  const r = s + pos * w;

  return [
    lineInterpolate(line, r),
    lineInterpolate(line, 0.5 + (0.5 - r)),
  ]
}

export function makeIbnTulun(angle?: number): Pattern {
  const A1: SimplePoint = [6.6987, 25];
  const A2: SimplePoint = [50, 0];
  const A3: SimplePoint = [93.3012, 25];
  const A4: SimplePoint = [93.30127018922192896, 75];
  const A5: SimplePoint = [50, 100];
  const A6: SimplePoint = [6.6987, 75];
  moveHexagonPoints([A1, A2, A3, A4, A5, A6]);

  const [r, q] = slideOn([A1, A6], angle);
  const [g, h] = slideOn([A1, A2], angle);
  const [i, j] = slideOn([A2, A3], angle);
  const [k, l] = slideOn([A3, A4], angle);
  const [m, n] = slideOn([A4, A5], angle);
  const [o, p] = slideOn([A5, A6], angle);

  const t = intersectLine([r, i], [h, k]);
  const u = intersectLine([h, k], [j, m]);
  const v = intersectLine([l, o], [j, m]);
  const w = intersectLine([l, o], [n, q]);
  const x = intersectLine([p, g], [n, q]);
  const s = intersectLine([p, g], [r, i]);

  const lines: SimpleLine[] = [
    [h,t], [t,i], [j,u], [u,k], [l,v], [v,m], [n, w], [w,o], [p,x], [x,q], [r,s], [s,g],
    [s, x], [w, x], [w, v], [v, u], [u, t], [t, s],
  ];
  const shapes: SimpleGroup[] = [
      [t,u,v,w,x,s]
  ];

  const allLines = [
    ...makeLinesFromShapes(shapes),
    ...lines
  ];

  const template = getPolygonEdges(50, 50, 50, 6, Math.PI/2);

  return {
    label: {
      title: "Mosque of Ibn Tulun",
      location: 'Cairo, Egypt (AD 879, AH 265)'
    },
    tilingMode: 'hex2',
    tileSize: getFormSize(template.lines),
    tileEdges: template.lines,
    shapes,
    lines: allLines,
    externalShapes: [
        reflectAtEdge([k, u, v, l], [k, l]),
        mirrorHexagonEdge([l, v, m], A4),
        reflectAtEdge([m, v, w, n], [m, n]),

        mirrorHexagonEdge([n, w, o], A5),
        reflectAtEdge([o, w, x, p], [o, p]),

        // mirrorHexagonEdge([j, u, k], A3),
        // reflectAtEdge([i,t, u, j], [i, j]),
    ],
    fillPatterns: [
      // just suitable as a complete fill for the simple neat version
      [
        [[1,2,3,4]]
      ],
      // just suitable as a complete fill for the simple neat version
      [
        [[1,2,4,5]]
      ],
      // just suitable as a complete fill for the simple neat version
      [[
        [[2,3,4,5]]
      ], {shiftY: -0.2}],
      [[
        [[1,2,4]]
      ], {shiftY: -0.2}],
      [[
        [[0]]
      ], {shiftY: -0.2}],
      [[
        [[1,2,3,4,5]]
      ], {shiftY: -0.2}],
      [[
        [[2,4,0]]
      ], {shiftY: -0.2}],
      [[
        [[2,3,4], [1,2,4,5]],
        [[1,2,3,4,5], [1,2,4]],
      ], {shiftY: -0.7}],
      [[
        [[2,3,4], [4,5]],
        [[1,2,3,4,5], [1,2]],
      ], {shiftY: -0.7}]
    ]
  }
}