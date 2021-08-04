/**
 * This generates Islamic looking patterns either from a square or a hexagon tiling. It will draw lines
 * from each side of the polygon at a certain angle until they intersect with the lines from the adjacent sides.
 * This is the "Polygons in contact" technique developed by Ernest Hanbury Hankin, as described by Craig Kaplan
 * in the paper "Computer Generated Islamic Star Patterns":
 *
 * https://www.mi.sanu.ac.rs/vismath/kaplan/index.html
 *
 * Other mathematical approaches have been described in:
 *
 * "Islamic Star Patterns in Absolute Geometry", Craig S. Kaplan and David H. Salesin
 * "Reconstructing Rosette-based Islamic Geometric Patterns", Thomas Christie
 * "Geometric proportions: The underlying structure of design process for Islamic geometric patterns", Loai Dabbour
 * "Methods of Design Employed In Mohammedan Art", Ernest Hanbury Hankin
 */

import {Pattern, SimpleGroup, SimpleLine, SimplePoint} from "../types";
import {
  boundsOfShape,
  clone, cloneGroup,
  intersectLine, lineFromAngle, lineInterpolate,
  moveBy,
  angleOfVector,
  toDegrees, toRadian,
  vecSubtract
} from "../utils/math";


export type Depth = '+1'|'+2';

export type GeneratedPatternTemplate = {
  tilingMode: 'square'|'hex',
  lines: SimpleLine[],
  shape?: SimpleGroup,
  angleRange: {[key in Depth]: [number, number][]}
}

export class Tiles {
  static getRectangle(): GeneratedPatternTemplate {
    const lines: SimpleLine[] = [
      [[0, 50], [50, 50]],  // bottom
      [[50, 0], [50, 50]],  // right
      [[0, 0], [50, 0]],
      [[0, 0], [0, 50]],
    ];
    return {
      lines,
      tilingMode: 'square',
      angleRange: {
        '+1': [[10, 80]],  // 0-90 is full range, but this looks ok,
        '+2': [[50, 70]],
      }
    };
  }

  static getHexagon(): GeneratedPatternTemplate {
    return {
      tilingMode: 'hex',
      angleRange: {
        '+1': [[-15, -75]],
        '+2': [[-50, -59], [-61, -82]]  // 60 errors out
      },
      // NB: Changing those numbers is not possible unless we update the tiling.
      ...getPolygonEdges(25, 25, 25, 6)
    };
  }
}

export function generatePattern(template: GeneratedPatternTemplate, angle: number, mode: Depth): Pattern {
  const {lines: edges} = template;
  let outLines = [];
  let outShape: SimpleGroup = [];

  type EdgeSet = {edges: SimpleGroup[], p: any};
  let edgeSets: EdgeSet[] = [];

  function getidx(idx: number) {
    idx = idx % (edges.length)
    if (idx < 0) {
      return edges.length + idx;
    }
    return idx;
  }

  function getLineFromEdge(idx: number, stopIdx: number, dir=1): SimpleLine {
    const edge = edges[getidx(idx)];
    const currentAngle = toDegrees(angleOfVector(vecSubtract(clone(edge[1]), edge[0])));

    const stoppingEdge = edges[getidx(stopIdx)];
    const stoppingAngle = toDegrees(angleOfVector(vecSubtract(clone(stoppingEdge[1]), stoppingEdge[0])));

    const intersectionPoint = intersectLine(
        lineFromAngle(
            lineInterpolate(edge, 0.5),
            toRadian(currentAngle - angle*dir),
            1
        ),
        lineFromAngle(
            lineInterpolate(stoppingEdge, 0.5),
            toRadian(stoppingAngle + angle*dir),
            1
        ),
    );

    return [
      lineInterpolate(edge, 0.5),
      intersectionPoint
    ]
  }

  for (let i=0; i<edges.length; i++) {
    if (mode == '+1') {
      const line1 = getLineFromEdge(i, (i+1) % (edges.length));
      const line2 = getLineFromEdge((i+1) % (edges.length), i, -1);
      outLines.push(line1);
      outLines.push(line2);

      outShape.splice(0, 0, line2[0], line1[1], line1[0]);
    }

    else {
      const currentLine = getLineFromEdge(i, i+2);
      const nextLine = getLineFromEdge(i+1, i-1, -1);

      const intersectionPoint = intersectLine(currentLine, nextLine);

      outLines.push([currentLine[0], intersectionPoint]);
      outLines.push([intersectionPoint, currentLine[1]]);

      outLines.push([nextLine[0], intersectionPoint]);
      outLines.push([intersectionPoint, nextLine[1]]);

      outShape.splice(outShape.length, 0, nextLine[1], intersectionPoint);
    }

    // get the next two
    // edgeSets.push({
    //   edges: [cloneGroup(firstLine), twin(cloneGroup(secondLine) as SimpleLine)],
    //   p: currentEdge[1]
    // });
  }


  // Any line leading to the border: mirror it and make a shape...
  // function makeExtShape(set: EdgeSet) {
  //   let shape = [];
  //   for (let i=0; i<3; i++) {
  //     for (const edge of set.edges) {
  //       const p = edge.p1.clone().rotate2D((Math.PI*2)/3 * -i, set.p);
  //       shape.push(p);
  //     }
  //   }
  //   return shape;
  // }

  return {
    tilingMode: template.tilingMode,
    tileEdges: template.lines,
    tileSize: getFormSize(template.lines),

    lines: outLines,
    shapes: outShape.length ? [outShape as any as SimplePoint[]] : [],

    // Currently unused
    edgeSet: edgeSets[0],
    // externalShapes: [
    //   makeExtShape(edgeSets[0]),
    //   makeExtShape(edgeSets[3]),
    // ]
  };
}


export function getPolygonEdges(x: number, y: number, radius: number, npoints: number, start?: number) {
  let angle = Math.PI*2 / npoints;
  start = start ?? 0;

  let smallestX = null;
  let smallestY = null;

  let lastPt = null;
  let lines: SimpleLine[] = [];
  let shape: SimpleGroup = [];
  for (let a = start; a < Math.PI*2 + start; a += angle) {
    let sx = x + Math.cos(a) * radius;
    let sy = y + Math.sin(a) * radius;
    let pt: SimplePoint = [sx, sy];

    shape.splice(0, 0, pt);

    if (lastPt) {
      lines.push([lastPt, pt]);
    }
    lastPt = pt;

    if (smallestX === null || pt[0] < smallestX) {
      smallestX = pt[0];
    }
    if (smallestY === null || pt[1] < smallestY) {
      smallestY = pt[1];
    }
  }

  // Move it to the (0, 0) position
  lines = lines.map(line => moveBy(cloneGroup(line), -smallestX, -smallestY)) as SimpleLine[];
  shape = moveBy(shape, -smallestX, -smallestY);

  return {
    lines,
    shape
  };
}

/**
 * Get the maximum extends of the given shape , assuming a (0, 0) coordinate system.
 * This means that a rect (1, 1) to (3, 3) will return (3, 3), despite the rect itself
 * having a size of (2, 2).
 */
export function getFormSize(edges: SimpleGroup[]): SimplePoint {
  return boundsOfShape(edges)[1];
}
