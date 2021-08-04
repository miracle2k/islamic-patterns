import {Pattern, SimpleGroup, SimpleLine, SimplePoint} from "../types";
import {makeLinesFromShapes, moveHexagonPoints} from "./utils";
import {moveBy, vecAdd} from '../utils/math';
import {getFormSize, getPolygonEdges} from "./makeGeneratedPattern";


export function makeIbnTulun(angle?: number): Pattern {
  const g: SimplePoint = [21.132,16.665];
  const h: SimplePoint = [35.566,8.332];
  const i: SimplePoint = [64.433,8.333];
  const j: SimplePoint = [78.867,16.665];
  const k: SimplePoint = [93.301,41.666];
  const l: SimplePoint = [93.301,58.333];
  const m: SimplePoint = [78.867,83.333];
  const n: SimplePoint = [64.433,91.666];
  const o: SimplePoint = [35.566,91.666];
  const p: SimplePoint = [21.132,83.332];
  const q: SimplePoint = [ 6.698,58.332];
  const r: SimplePoint = [6.698,41.665];
  const t: SimplePoint = [49.999,16.665];
  const u: SimplePoint = [78.866,33.332];
  const v: SimplePoint = [78.866,66.666];
  const w: SimplePoint = [49.999,83.332];
  const x: SimplePoint = [21.131,66.665];
  const s: SimplePoint = [21.131,33.331];
  moveHexagonPoints([g, h, i, j, k, l, m, n, o, p, q, r, t, u, v, w, x, s]);

  const lines: SimpleLine[] = [
    [h,t],[t,i],[j,u],[u,k],[l,v],[v,m],[n, w],[w,o],[p,x],[x,q],[r,s],[s,g]
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
    lines: allLines
  }
}