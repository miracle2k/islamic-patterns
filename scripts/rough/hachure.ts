/**
 * Based on code from rough.js (https://github.com/rough-stuff/rough).
 */

import {SimpleLine, SimplePoint} from "../types";
import {lineLength} from "../utils/math";
import {rand, random} from "../utils/random";

export enum OpType {
  move,
  bcurveTo,
}

export interface Op {
  op: OpType;
  data: number[];
}

interface EllipseParams {
  rx: number;
  ry: number;
  increment: number;
}

export interface HachureOptions {
  hachureAngle: number;
  hachureGap: number;
}

export interface RoughnessOptions {
  // This is how much points can be offset from where they are actually defined - a random number is picked.
  maxRandomnessOffset: number,

  // This is a multiplication factor for `maxRandomnessOffset`.
  roughness?: number,

  // An additional multiplication factor for the bezier points of a curve, when drawing a line.
  bowing?: number,
}

export interface CurveOptions {
  curveStepCount: number,
  // 1 seems to be close the the original, 0 leads sometimes to much smaller, and sometimes much bigger circles.
  curveFitting?: number,
  // A value of 0 means the curves a very smooth, a value of 1 means sharp corners
  curveTightness?: number
}

export interface LineOptions {
  preserveVertices?: boolean
}


interface EdgeEntry {
  ymin: number;
  ymax: number;
  x: number;
  islope: number;
}

interface ActiveEdgeEntry {
  s: number;
  edge: EdgeEntry;
}


/**
 * Roughness is in theory used for how much the dots deviate from the straight hachure lines.
 * This does not support anything other than roughness=1 though. If >1 the dots are shifted way too far left/right,
 * outside of the desired area.
 */
export function dotsOnLines(lines: SimpleLine[], o: {
  gap: number,
  dotSize: number,
} & CurveOptions) {
  const ops: Op[] = [];
  let gap = Math.max(o.gap, 0.1);

  const ro = gap / 4;
  for (const line of lines) {
    const length = lineLength(line);
    const dl = length / gap;
    const count = Math.ceil(dl) - 1;
    const _offset = length - (count * gap);
    const x = ((line[0][0] + line[1][0]) / 2) - (gap / 4);
    const minY = Math.min(line[0][1], line[1][1]);

    for (let i = 0; i < count; i++) {
      const y = minY + _offset + (i * gap);
      const cx = offset(x - ro, x + ro);
      const cy = offset(y - ro, y + ro);
      const eops = makeEllipse(cx, cy, o.dotSize, o.dotSize, o);
      ops.push(...eops);
    }
  }
  return ops;
}


/**
 * Calculate hachure lines, and rotate them.
 */
export function polygonHachureLines(points: SimplePoint[], hachureGap: number, hachureAngle: number): SimpleLine[] {
  const rotationCenter: SimplePoint = [0, 0];
  const angle = Math.round(hachureAngle + 90);
  if (angle) {
    rotatePoints(points, rotationCenter, angle);
  }
  const lines = straightHachureLines(points, hachureGap);
  if (angle) {
    rotatePoints(points, rotationCenter, -angle);
    rotateLines(lines, rotationCenter, -angle);
  }
  return lines;
}

/**
 * Calculate hachure lines within a polygon.
 */
function straightHachureLines(points: SimplePoint[], hachureGap: number): SimpleLine[] {
  const vertices = [...points];
  if (vertices[0].join(',') !== vertices[vertices.length - 1].join(',')) {
    vertices.push([vertices[0][0], vertices[0][1]]);
  }
  const lines: SimpleLine[] = [];
  if (vertices && vertices.length > 2) {
    hachureGap = Math.max(hachureGap, 0.1);

    // Create sorted edges table
    const edges: EdgeEntry[] = [];
    for (let i = 0; i < vertices.length - 1; i++) {
      const p1 = vertices[i];
      const p2 = vertices[i + 1];
      if (p1[1] !== p2[1]) {
        const ymin = Math.min(p1[1], p2[1]);
        edges.push({
          ymin,
          ymax: Math.max(p1[1], p2[1]),
          x: ymin === p1[1] ? p1[0] : p2[0],
          islope: (p2[0] - p1[0]) / (p2[1] - p1[1]),
        });
      }
    }
    edges.sort((e1, e2) => {
      if (e1.ymin < e2.ymin) {
        return -1;
      }
      if (e1.ymin > e2.ymin) {
        return 1;
      }
      if (e1.x < e2.x) {
        return -1;
      }
      if (e1.x > e2.x) {
        return 1;
      }
      if (e1.ymax === e2.ymax) {
        return 0;
      }
      return (e1.ymax - e2.ymax) / Math.abs((e1.ymax - e2.ymax));
    });
    if (!edges.length) {
      return lines;
    }

    // Start scanning
    let activeEdges: ActiveEdgeEntry[] = [];
    let y = edges[0].ymin;
    while (activeEdges.length || edges.length) {
      if (edges.length) {
        let ix = -1;
        for (let i = 0; i < edges.length; i++) {
          if (edges[i].ymin > y) {
            break;
          }
          ix = i;
        }
        const removed = edges.splice(0, ix + 1);
        removed.forEach((edge) => {
          activeEdges.push({ s: y, edge });
        });
      }
      activeEdges = activeEdges.filter((ae) => {
        if (ae.edge.ymax <= y) {
          return false;
        }
        return true;
      });
      activeEdges.sort((ae1, ae2) => {
        if (ae1.edge.x === ae2.edge.x) {
          return 0;
        }
        return (ae1.edge.x - ae2.edge.x) / Math.abs((ae1.edge.x - ae2.edge.x));
      });

      // fill between the edges
      if (activeEdges.length > 1) {
        for (let i = 0; i < activeEdges.length; i = i + 2) {
          const nexti = i + 1;
          if (nexti >= activeEdges.length) {
            break;
          }
          const ce = activeEdges[i].edge;
          const ne = activeEdges[nexti].edge;
          lines.push([
            [Math.round(ce.x), y],
            [Math.round(ne.x), y],
          ]);
        }
      }

      y += hachureGap;
      activeEdges.forEach((ae) => {
        ae.edge.x = ae.edge.x + (hachureGap * ae.edge.islope);
      });
    }
  }
  return lines;
}

export function rotatePoints(points: SimplePoint[], center: SimplePoint, degrees: number): SimplePoint[] {
  if (points && points.length) {
    const [cx, cy] = center;
    const angle = (Math.PI / 180) * degrees;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    points.forEach((p) => {
      const [x, y] = p;
      p[0] = ((x - cx) * cos) - ((y - cy) * sin) + cx;
      p[1] = ((x - cx) * sin) + ((y - cy) * cos) + cy;
    });
  }
  return points;
}

export function rotateLines(lines: SimpleLine[], center: SimplePoint, degrees: number): void {
  const points: SimplePoint[] = [];
  lines.forEach((line) => points.push(...line));
  rotatePoints(points, center, degrees);
}

// Return two line operations
export function makeDoubleLine(x1: number, y1: number, x2: number, y2: number, o: LineOptions & RoughnessOptions): Op[] {
  const o1 = makeLine(x1, y1, x2, y2, o, true, false);
  const o2 = makeLine(x1, y1, x2, y2, o, true, true);
  return o1.concat(o2);
}

/**
 * Calculate a rough line between two points.
 *
 * Does this by calculating a bcurve.
 */
export function makeLine(x1: number, y1: number, x2: number, y2: number, o: LineOptions & RoughnessOptions, move: boolean, overlay: boolean): Op[] {
  const lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
  const length = Math.sqrt(lengthSq);
  let roughnessGain = 1;
  if (length < 200) {
    roughnessGain = 1;
  } else if (length > 500) {
    roughnessGain = 0.4;
  } else {
    roughnessGain = (-0.0016668) * length + 1.233334;
  }

  let offset = o.maxRandomnessOffset;
  if ((offset * offset * 100) > lengthSq) {
    offset = length / 10;
  }
  const halfOffset = offset / 2;

  // Position of the bezier points.
  let midDispX = (o.bowing ?? 1) * o.maxRandomnessOffset * (y2 - y1) / 200;
  let midDispY = (o.bowing ?? 1) * o.maxRandomnessOffset * (x1 - x2) / 200;
  midDispX = offsetValue(midDispX, o, roughnessGain);
  midDispY = offsetValue(midDispY, o, roughnessGain);

  // An additional factor for the bezier points
  const divergePoint = 0.2 + rand() * 0.2;

  const ops: Op[] = [];

  // We use random offsets from the given line points.
  const randomHalf = () => offsetValue(halfOffset, o, roughnessGain);
  const randomFull = () => offsetValue(offset, o, roughnessGain);

  const preserveVertices = o.preserveVertices;
  if (move) {
    if (overlay) {
      ops.push({
        op: OpType.move, data: [
          x1 + (preserveVertices ? 0 : randomHalf()),
          y1 + (preserveVertices ? 0 : randomHalf()),
        ],
      });
    } else {
      ops.push({
        op: OpType.move, data: [
          x1 + (preserveVertices ? 0 : randomFull()),
          y1 + (preserveVertices ? 0 : randomFull()),
        ],
      });
    }
  }

  if (overlay) {
    ops.push({
      op: OpType.bcurveTo,
      data: [
        midDispX + x1 + (x2 - x1) * divergePoint + randomHalf(),
        midDispY + y1 + (y2 - y1) * divergePoint + randomHalf(),
        midDispX + x1 + 2 * (x2 - x1) * divergePoint + randomHalf(),
        midDispY + y1 + 2 * (y2 - y1) * divergePoint + randomHalf(),
        x2 + (preserveVertices ? 0 : randomHalf()),
        y2 + (preserveVertices ? 0 : randomHalf()),
      ],
    });
  } else {
    ops.push({
      op: OpType.bcurveTo,
      data: [
        midDispX + x1 + (x2 - x1) * divergePoint + randomFull(),
        midDispY + y1 + (y2 - y1) * divergePoint + randomFull(),
        midDispX + x1 + 2 * (x2 - x1) * divergePoint + randomFull(),
        midDispY + y1 + 2 * (y2 - y1) * divergePoint + randomFull(),
        x2 + (preserveVertices ? 0 : randomFull()),
        y2 + (preserveVertices ? 0 : randomFull()),
      ],
    });
  }

  return ops;
}


export function makeEllipse(x: number, y: number, width: number, height: number, o: CurveOptions): Op[] {
  const params = generateEllipseParams(width, height, o);
  return ellipseWithParams(x, y, o, params);
}

/**
 * Return the radius values rx and rxy and the size of each angle step around the ellipsis.
 *
 * Essentially, adds the "curve fit" factor to the ellipsis. If this is 1, it will be a perfect shape.
 * If != 1, there is a skewing factor which makes each ellipsoid slightly different.
 */
export function generateEllipseParams(width: number, height: number, o: { curveFitting?: number, curveStepCount: number }): EllipseParams {
  // Be smart about the step count and limit it by size
  const psq = Math.sqrt(Math.PI * 2 * Math.sqrt((Math.pow(width / 2, 2) + Math.pow(height / 2, 2)) / 2));
  const stepCount = Math.max(
      o.curveStepCount,
      (o.curveStepCount / Math.sqrt(200)) * psq
  );

  const increment = (Math.PI * 2) / stepCount;
  let rx = Math.abs(width / 2);
  let ry = Math.abs(height / 2);
  const curveFitRandomness = 1 - (o.curveFitting ?? 0.95);
  rx += offsetValue(rx * curveFitRandomness);
  ry += offsetValue(ry * curveFitRandomness);
  return { increment, rx, ry };
}

/**
 * Compute the pains to draw the given ellipse.
 */
export function ellipseWithParams(
    x: number, y: number, o: {disableMultiStroke?: boolean, curveTightness?: number}, ellipseParams: EllipseParams): Op[]
{
  // This is essentially the random factor. If 0, all points will be perfectly set on their ellipsis.
  const _offset = 0.1;

  // This determines the actual points to draw, and uses offset as the random factor for the radius,
  // overlap shifts the randomness around the circle itself.
  const [ap1, cp1] = computeEllipsePoints(
      ellipseParams.increment, x, y, ellipseParams.rx, ellipseParams.ry, _offset,
      ellipseParams.increment * offset(0.1, offset(0.4, 1)));
  // Connects the points using bezier curves. curveTightness defines the angle of those curves.
  let o1 = curve(ap1, null, o);

  if (!o.disableMultiStroke) {
    const [ap2] = computeEllipsePoints(ellipseParams.increment, x, y, ellipseParams.rx, ellipseParams.ry, _offset*1.5, 0);
    const o2 = curve(ap2, null, o);
    o1 = o1.concat(o2);
  }
  return o1;
}

/**
 * Draw a curve along some points.
 *
 * If two points: Equivalent to a line.
 * If three points: a bcurve.
 * If >3 points: Multiple bcurves
 */
function curve(points: SimplePoint[], closePoint: SimplePoint | null, o: {curveTightness?: number}): Op[] {
  const len = points.length;
  const ops: Op[] = [];
  if (len > 3) {
    const b = [];
    const s = 1 - (o.curveTightness ?? 0);
    ops.push({ op: OpType.move, data: [points[1][0], points[1][1]] });
    for (let i = 1; (i + 2) < len; i++) {
      const cachedVertArray = points[i];
      // Ignored
      b[0] = [cachedVertArray[0], cachedVertArray[1]];
      // Control point 1
      b[1] = [
        cachedVertArray[0] + (s * points[i + 1][0] - s * points[i - 1][0]) / 6,
        cachedVertArray[1] + (s * points[i + 1][1] - s * points[i - 1][1]) / 6
      ];
      // Control point 2
      b[2] = [
        points[i + 1][0] + (s * points[i][0] - s * points[i + 2][0]) / 6,
        points[i + 1][1] + (s * points[i][1] - s * points[i + 2][1]) / 6
      ];
      // Endpoint
      b[3] = [points[i + 1][0], points[i + 1][1]];

      ops.push({ op: OpType.bcurveTo, data: [
          // control point 1
          b[1][0], b[1][1],
          // cp2
          b[2][0], b[2][1],
          // endpoint
          b[3][0], b[3][1]]
      });
    }
  } else if (len === 3) {
    ops.push({ op: OpType.move, data: [points[1][0], points[1][1]] });
    ops.push({
      op: OpType.bcurveTo,
      data: [
        points[1][0], points[1][1],
        points[2][0], points[2][1],
        points[2][0], points[2][1],
      ],
    });
  }
  return ops;
}

/**
 * Essentially calculate points around the ellipses. "offset" decides how far those points can shift from
 * their proper location on the ellipse on the radius-axis. `overlap` says how much we can shift along the circle.
 */
function computeEllipsePoints(increment: number, cx: number, cy: number, rx: number, ry: number,
                               offset: number, overlap: number): SimplePoint[][] {
  const corePoints: SimplePoint[] = [];
  const allPoints: SimplePoint[] = [];
  const radOffset = offsetValue(0.5) - (Math.PI / 2);

  allPoints.push([
    offsetValue(offset) + cx + 0.9 * rx * Math.cos(radOffset - increment),
    offsetValue(offset) + cy + 0.9 * ry * Math.sin(radOffset - increment),
  ]);
  for (let angle = radOffset; angle < (Math.PI * 2 + radOffset - 0.01); angle = angle + increment) {
    const p: SimplePoint = [
      offsetValue(offset) + cx + rx * Math.cos(angle),
      offsetValue(offset) + cy + ry * Math.sin(angle),
    ];
    corePoints.push(p);
    allPoints.push(p);
  }
  allPoints.push([
    offsetValue(offset) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
    offsetValue(offset) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5),
  ]);
  allPoints.push([
    offsetValue(offset) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
    offsetValue(offset) + cy + 0.98 * ry * Math.sin(radOffset + overlap),
  ]);
  allPoints.push([
    offsetValue(offset) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
    offsetValue(offset) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5),
  ]);

  return [allPoints, corePoints];
}


/**
 * A random number between min and max, multiplied by both roughness and roughness gain.
 */
export function offset(min: number, max: number, ops?: { roughness?: number }, roughnessGain = 1): number {
  return (ops?.roughness ?? 1) * roughnessGain * random(min, max);
}

/**
 * Return a number between -x and x, multiplied by both roughness and roughness gain.
 */
function offsetValue(x: number, ops?: { roughness?: number }, roughnessGain = 1): number {
  return offset(-x, x, ops, roughnessGain);
}


