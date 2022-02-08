import {SimpleGroup, SimpleLine, SimplePoint} from "../types";


export function mapValue(value: number, instart: number, inend: number, outstart: number, outend: number) {
  return (value - instart) / (inend - instart) * (outend - outstart) + outstart
}

export function mapValueInt(value: number, instart: number, inend: number, outstart: number, outend: number) {
  // We add +1 to the out end, floor everything, and max it so that value == 1 does not give us the +1 value.
  return Math.min(outend, Math.floor(mapValue(value, instart, inend, outstart, outend + 1)));
}

export function fromRanges(ranges: [number, number][], value: number) {
  const segments = ranges.map(r => Math.abs(r[1] - r[0]));
  const total = segments.reduce((s, i) => s+i, 0);

  let r = value * total;

  for (let i=0; i<segments.length; i++) {
    if (r <= segments[i]) {
      return ranges[i][0] + (r/segments[i]) * (ranges[i][1]-ranges[i][0])
    }
    r = r - segments[i];
  }
}

export function clone<X, T extends Array<X>>(pt: T): T {
  return [...(pt as any)] as any;
}

export function cloneGroup<T extends SimplePoint[]>(l: T): T {
  return l.map(p => clone(p)) as T;
}

export function moveBy<X, T extends Array<SimplePoint>>(g: T, x: number, y: number): T {
  g.forEach(pt => {
    vecAdd(pt, [x, y]);
  });
  return g;
}

export function getOtherPoint(line: SimpleLine, point: SimplePoint) {
  return isSamePoint(line[0], point) ? line[1] : line[0];
}

// the first point < the second point
export function canonicalLine(line: SimpleGroup) {
  return pointIsLess(line[0], line[1]) ? line : [line[1], line[0]];
}

export function isSameLine(line1: SimpleGroup, line2: SimpleGroup) {
  line1 = canonicalLine(line1);
  line2 = canonicalLine(line2);
  return (isSamePoint(line1[0], line2[0]) && isSamePoint(line1[1], line2[1]));
}

export function angleOfLine(line: SimpleLine) {
  const pt = vecSubtract(clone(line[0]), line[1]);
  return angleOfVector(pt);
}

export function angleOfVector(pt: SimplePoint): number {
  // xy
  return Math.atan2(pt[1], pt[0]);
}

// Make sure that line[0] == pt, otherwise turn it around
export function orientLineFrom(line: SimpleLine, pt: SimplePoint): SimpleLine {
  return isSamePoint(line[0], pt) ? line : [line[1], line[0]];
}

export function perpendicularFromPoint(line: SimpleLine, pt: SimplePoint): SimplePoint {
  let a = vecSubtract(clone(line[0]), line[1]);
  let b = vecSubtract(clone(line[1]), pt);
  return vecSubtract(clone(b), vecProject(a, b));
}

export function vecSubtract(a: SimplePoint, b: number|SimplePoint) {
  if (typeof b == "number") {
    for (let i = 0, len = a.length; i < len; i++)
      a[i] -= b;
  }
  else {
    for (let i = 0, len = a.length; i < len; i++)
      a[i] -= b[i] || 0;
  }
  return a;
}


export function vecAdd(a: SimplePoint, b: number|SimplePoint) {
  if (typeof b == "number") {
    for (let i = 0, len = a.length; i < len; i++)
      a[i] += b;
  }
  else {
    for (let i = 0, len = a.length; i < len; i++)
      a[i] += b[i] || 0;
  }
  return a;
}

export function vecDivide(a: SimplePoint, b: number) {
  for (let i = 0, len = a.length; i < len; i++) {
    a[i] /= b;
  }
  return a;
}

export function vecMultiply(a: SimplePoint, b: SimplePoint|number ): SimplePoint {
  if (typeof b == "number") {
    for (let i=0, len=a.length; i<len; i++) a[i] *= b;
  } else {
    if (a.length != b.length) {
      throw new Error();
    }
    for (let i=0, len=a.length; i<len; i++) a[i] *= b[i];
  }
  return a;
}


// Unit vector.
export function vecUnit(a: SimplePoint): SimplePoint {
  let m = vectorMagnitude(a);
  if (m === 0) {
    return [0, 0];
  }
  return vecDivide(a, m);
}

export function vecProject( pt: SimplePoint, other: SimplePoint): SimplePoint {
  return vecMultiply(pt, dotProduct(pt, other) / magnitudeSq(pt))
}


export function lineMagnitude(line: SimpleLine) {
  return vectorMagnitude(vecSubtract(clone(line[1]), line[0]));
}

export function vectorMagnitude(a: SimplePoint) {
  return Math.sqrt(dotProduct(a, a));
}

export function magnitudeSq(a: SimplePoint) {
  return dotProduct(a, a);
}

export function dotProduct(a: number[], b: number[]) {
  let d = 0;
  for (let i = 0, len = a.length; i < len; i++) {
    d += a[i] * b[i];
  }
  return d;
}

/**
 * Return the bounding box of a set of points, as a line across the box, i.e.
 * a tuple in the form of ((x1, y1), (x2, y2)).
 *
 * See boundsOfShape() is your input is a list of edges.
 */
export function boundingBox( pts: SimplePoint[] ): SimpleLine {
  let minPt: SimplePoint, maxPt: SimplePoint;
  for (let p of pts) {
    if (minPt == undefined) {
      minPt = clone(p);
      maxPt = clone(p);
    } else {
      minPt = pointMin(minPt, p);
      maxPt = pointMax(maxPt, p);
    }
  }
  return [minPt, maxPt];
}


/**
 * The bounds rect of the shape, as a ((x1, y1), (x2, y2)) tuple.
 * Input is a list of edges. See boundingBox() if your input is a list of points.
 */
export function boundsOfShape(shape: SimpleGroup[]): SimpleLine {
  return boundingBox(shape.flatMap(edge => edge));
}

/**
 * The size of the bounds rect.
 */
export function sizeOfBounds(bounds: SimpleLine): SimplePoint {
  return [bounds[1][0] - bounds[0][0], bounds[1][1] - bounds[0][1]];
}


export function isSamePoint(self: SimplePoint, p: SimplePoint, threshold=0.01) {
  for (let i=0, len=self.length; i<len; i++) {
    if ( Math.abs(self[i]-p[i]) > threshold ) return false;
  }
  return true;
}

export function pointMin(pt: SimplePoint, other: SimplePoint) {
  let m = clone(pt);
  for (let i=0, len=Math.min( pt.length, other.length ); i<len; i++) {
    m[i] = Math.min( pt[i], other[i] );
  }
  return m;
}

export function pointMax(pt: SimplePoint, other: SimplePoint) {
  let m = clone(pt);
  for (let i=0, len=Math.min( pt.length, other.length ); i<len; i++) {
    m[i] = Math.max( pt[i], other[i] );
  }
  return m;
}

// NB: When this was broken, it made no difference. Figure it out.
export function pointIsLess(pt1: SimplePoint, pt2: SimplePoint) {
  if (pt1[0] < pt2[0]) {
    return true;
  }
  if (pt1[0] > pt2[0]) {
    return false;
  }
  if (pt1[1] < pt2[1]) {
    return true;
  }
  return false;
}

export function pointSet(pt: SimplePoint, newValues: SimplePoint) {
  pt[0] = newValues[0];
  pt[1] = newValues[1];
  return pt;
}

// The average of the given points = centroid of a polygon
export function averageOfPoints(points: SimplePoint[]): SimplePoint {
  return vecDivide(sumOfPoints(points), points.length);
}

// The sum of all the points
export function sumOfPoints(points: SimplePoint[]): SimplePoint {
  let c = clone(points[0]);
  for (let i = 1, len = points.length; i < len; i++) {
    vecAdd(c, points[i])
  }
  return c;
}

export function polygonIntersectsPoints(poly: SimpleGroup, points: SimplePoint[]) {
  for (const point of points) {
    if (polygonIntersectsPoint(poly, point)) {
      return true;
    }
  }
  return false;
}

export function polygonIntersectsPoint(poly: SimpleGroup, pt: SimplePoint): boolean {
  let c = false;
  for (let i=0, len=poly.length; i<len; i++) {
    let ln = lineAt( poly, i );
    if ( ((ln[0][1]>pt[1]) != (ln[1][1]>pt[1])) &&
        (pt[0] < (ln[1][0]-ln[0][0]) * (pt[1]-ln[0][1]) / (ln[1][1]-ln[0][1]) + ln[0][0]) ) {
      c = !c;
    }
  }
  return c;
}

function lineAt(polygon: SimpleGroup, index: number) {
  return [
    polygon[index], (index === polygon.length-1) ? polygon[0] : polygon[index+1]
  ];
}

// Rect here is [0, 0] [w, h]
export function pointsOfRect(rect: SimpleGroup): SimplePoint[] {
  const [x, y] = rect[0];
  const [w, h] = rect[1];
  return [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
  ]
}

export function toDegrees(radians: number) {
  // = PI / 180
  return radians * 57.29577951308232
}

export function toRadian(angle: number): number {
  return angle * (Math.PI/180);
}


/**
 * Given two lines as rays (infinite lines), find their intersection point if any.
 */
export function intersectLine(la: SimpleLine, lb: SimpleLine): SimplePoint {
  let a = lineIntercept( la[0], la[1] );
  let b = lineIntercept( lb[0], lb[1] );

  let pa = la[0];
  let pb = lb[0];

  let a0X = la[0][0];
  let a0Y = la[0][1];
  let a1X = la[1][0];
  let a1Y = la[1][1];
  let b0X = lb[0][0];
  let b0Y = lb[0][1];
  let b1X = lb[1][0];
  let b1Y = lb[1][1];
  
  if (a == undefined) {
    if (b == undefined) { return undefined; }
    // one of them is vertical line, while the other is not, so they will intersect
    let y1 = ((b0Y - b1Y) * (b0X - a0X) + b0Y * (b1X - b0X)) / (b1X - b0X);
    return [pa[0], y1];

  } else {
    // diff slope, or b slope is vertical line
    if (b == undefined) {
      let y1 = ((a0Y - a1Y) * (a0X - b0X) + a0Y * (a1X - a0X)) / (a1X - a0X);
      return [pb[0], y1];

    } else if (b.slope != a.slope) {
      // px and py equations are calculated using SymPy by substituting slope equations in terms of original points and then converting to common denominator format
      let px =
          (-a0X * (a0Y - a1Y) * (b0X - b1X) +
              b0X * (a0X - a1X) * (b0Y - b1Y) -
              (a0X - a1X) * (-a0Y + b0Y) * (b0X - b1X)) /
          ((a0X - a1X) * (b0Y - b1Y) + (-a0Y + a1Y) * (b0X - b1X));
      let py =
          (a0X * a1Y * b0Y -
              a0X * a1Y * b1Y -
              a0Y * a1X * b0Y +
              a0Y * a1X * b1Y -
              a0Y * b0X * b1Y +
              a0Y * b0Y * b1X +
              a1Y * b0X * b1Y -
              a1Y * b0Y * b1X) /
          (a0X * b0Y -
              a0X * b1Y -
              a0Y * b0X +
              a0Y * b1X -
              a1X * b0Y +
              a1X * b1Y +
              a1Y * b0X -
              a1Y * b1X);
      return [px, py];

    } else {
      if (a.yi == b.yi) { // exactly along the same path
        return [pa[0], pa[1]];
      } else {
        return undefined;
      }
    }
  }
}

// Calculate the slope and xy intercepts of a line.
export function lineIntercept(p1: SimplePoint, p2: SimplePoint): { slope: number, xi: number, yi: number } {
  if (p2[0] - p1[0] === 0) {
    return undefined;
  } else {
    let m = (p2[1] - p1[1]) / (p2[0] - p1[0]);
    let c = p1[1] - m * p1[0];
    return { slope: m, yi: c, xi: (m===0) ? undefined : -c/m };
  }
}

export function lineFromAngle(anchor: SimplePoint, angle: number, magnitude: number): SimpleLine {
  let g: SimpleLine = [anchor, clone(anchor)];
  pointSetToAngle(g[1], angle, magnitude, true);
  return g;
}

// Update the values of this Pt to point at a specific angle.
export function pointSetToAngle(pt: SimplePoint, radian: number, magnitude?: number, anchorFromPt: boolean = false ): SimplePoint {
  let m = (magnitude!=undefined) ? magnitude : vectorMagnitude(pt);
  let change: SimplePoint = [Math.cos(radian)*m, Math.sin(radian)*m];
  return (anchorFromPt) ? vecAdd(pt, change) : pointSet(pt, change);
}

export function lineInterpolate(g: SimpleGroup, t: number) {
  return interpolate(g[0], g[1], t);
}

export function interpolate<T>(a: SimplePoint, b: SimplePoint, t: number = 0.5 ): SimplePoint {
  let len = Math.min(a.length, b.length);
  let d: number[] = [];
  for (let i = 0; i < len; i++) {
    d[i] = a[i] * (1 - t) + b[i] * t;
  }
  return d as SimplePoint;
}


export function distributeLinear(line: SimpleLine, count: number): SimpleGroup {
  let ln = subpoints( line, count-2 );
  ln.unshift( line[0] );
  ln.push( line[line.length-1] );
  return ln;
}

export function subpoints(line: SimpleLine, num: number) {
  let pts: SimpleGroup = [];
  for (let i = 1; i <= num; i++) {
    pts.push(interpolate(line[0], line[1], i / (num + 1)));
  }
  return pts;
}