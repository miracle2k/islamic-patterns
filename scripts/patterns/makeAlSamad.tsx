import {Pattern, SimplePoint} from "../types";
import {makeLinesFromShapes, moveHexagonPoints} from "./utils";
import {fromRanges, intersectLine, lineFromAngle, moveBy, pointSetToAngle, toRadian, vecAdd} from '../utils/math';
import {getFormSize, getPolygonEdges} from "./makeGeneratedPattern";


export function makeAlSamad(angle?: number): Pattern {
  const mod = fromRanges([[-6, 10]], angle);   // some mods seem to cause trouble, such as 6

  const m: SimplePoint = [39.1743, 18.7500];
  const n: SimplePoint = [60.825,18.7500];
  const t: SimplePoint = [39.174,81.249];
  const s: SimplePoint = [60.825,81.250];
  const w: SimplePoint = [17.5238,43.7497];
  const x: SimplePoint = [28.349,24.999];
  const o: SimplePoint = [71.650,24.999];
  const p : SimplePoint = [82.475,43.749];
  const q: SimplePoint = [82.475,56.249];
  const r: SimplePoint = [71.650, 74.999];
  const v: SimplePoint = [17.523,56.249];
  const u: SimplePoint = [28.349, 74.999];
  const a: SimplePoint = [50,0];
  const b: SimplePoint = [93.301,25];
  const c: SimplePoint = [93.301,75];
  const d: SimplePoint = [50,100];
  const e: SimplePoint = [6.698,74.999];
  const f: SimplePoint = [6.698,24.999];
  moveHexagonPoints([m, n, o, p, q, r, s, t, u, v, w, x, a, b, c, d, e, f]);

  for (const [left, right, angle] of [
      [w, x, 30],
      [m, n, 90],
      [o, p, 150],
      [r, q, 210],
      [t, s, 270],
      [u, v, 330],
  ] as [SimplePoint, SimplePoint, number][]) {
    let m = pointSetToAngle([0, 0], toRadian(angle), mod);
    vecAdd(left, m);
    vecAdd(right, m);
  }

  const y1: SimplePoint = intersectLine([w, n], [m, p]);
  const y4 : SimplePoint = intersectLine([v, s], [t, q]);
  const y6 : SimplePoint = intersectLine([w, n], [x, u]);
  const y2 : SimplePoint = intersectLine([m, p], [o, r]);
  const y3 : SimplePoint = intersectLine([t, q], [o, r]);

  // certain angles are broken: 0.94
  const y5 : SimplePoint = intersectLine([u, x], [v, s]);

  const shapes: any = [
    [a,m,y1,n],
    [b,o,y2,p],
    [c,q,y3,r],
    [d,s,y4,t],
    [e,u,y5,v],
    [f,w,y6,x],
    [y1,y2,y3,y4,y5,y6]
  ]

  const lines = [
    ...makeLinesFromShapes(shapes),
  ];

  const template = getPolygonEdges(50, 50, 50, 6, Math.PI/2);

  return {
    label: {
      title: "The 'Abd al-Samad Complex",
      location: 'Natanz, Iran (AD 1304, AH 703)'
    },
    tilingMode: 'hex2',
    tileSize: getFormSize(template.lines),
    tileEdges: template.lines,
    // interlacingConfig: [
    //     // targetLine, changeLine, mx, my, targetPointFirst, changePointSecond, doExtraY, doReverse
    //     [2, 25, 0, 0, 5, 0, 0, false],
    //     [2, 25, 0, 0, 3, 2, 0, false],
    //
    //     [6, 26, 0, 0, 5, 0, 0, false],
    //     [6, 26, 0, 0, 3, 2, 0, false],
    //
    //     [10, 27, 0, 0, 5, 0, 0, false],
    //     [10, 27, 0, 0, 3, 2, 0, false],
    //
    //     [14, 28, 0, 0, 5, 0, 0, false],
    //     [14, 28, 0, 0, 3, 2, 0, false],
    //
    //     [18, 29, 0, 0, 5, 0, 0, false],
    //     [18, 29, 0, 0, 3, 2, 0, false],
    //
    //     [22, 24, 0, 0, 5, 0, 0, false],
    //     [22, 24, 0, 0, 3, 2, 0, false],
    // ],
    shapes,
    lines
  }
}