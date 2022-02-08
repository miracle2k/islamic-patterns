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

import {FillPatternDefinition, FillPatternStructure, Pattern, SimpleGroup, SimpleLine, SimplePoint} from "../types";
import {
  angleOfVector,
  boundsOfShape,
  clone,
  cloneGroup,
  intersectLine,
  lineFromAngle,
  lineInterpolate,
  moveBy,
  toDegrees,
  toRadian,
  vecSubtract
} from "../utils/math";
import {mirrorHexagonEdge, mirrorShapeAtBottomRightCorner} from "../rough/hachure";


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
      [[0, 100], [100, 100]],  // bottom
      [[100, 0], [100, 100]],  // right
      [[0, 0], [100, 0]],
      [[0, 0], [0, 100]],
    ];
    return {
      lines,
      tilingMode: 'square',
      angleRange: {
        // 10 to 30
        '+1': [[10, 35]],
        '+2': [[60, 70]],
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
      ...getPolygonEdges(50, 50, 50, 6)
    };
  }
}

export function generatePattern(template: GeneratedPatternTemplate, angle: number, mode: Depth): Pattern {
  const {lines: edges} = template;
  let outLines = [];
  let centerShape: SimpleGroup = [];
  let peripheralShapes: SimpleGroup[] = [];

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

  const externalShapes: SimpleGroup[] = [];

  for (let i=0; i<edges.length; i++) {
    if (mode == '+1') {
      const line1 = getLineFromEdge(i, (i+1) % (edges.length));
      const line2 = getLineFromEdge((i+1) % (edges.length), i, -1);
      outLines.push(line1);
      outLines.push(line2);

      centerShape.splice(0, 0, line2[0], line1[1], line1[0]);

      if (template.tilingMode == 'hex' && (i == 5 || i == 0)) {
        externalShapes.push(mirrorHexagonEdge([line1[0], line1[1], line2[0]], edges[i][1]))
      } else if (template.tilingMode == 'square' && i == 0) {
        externalShapes.push(mirrorShapeAtBottomRightCorner([line2[0], line1[1], line1[0]], [100, 100]));
      }
    }

    else {
      // NB: This essentially rotates counter-clockwise
      const currentLine = getLineFromEdge(i, i+2);
      const nextLine = getLineFromEdge(i+1, i-1, -1);

      const intersectionPoint = intersectLine(currentLine, nextLine);

      outLines.push([currentLine[0], intersectionPoint]);
      outLines.push([intersectionPoint, currentLine[1]]);

      outLines.push([nextLine[0], intersectionPoint]);
      outLines.push([intersectionPoint, nextLine[1]]);

      centerShape.splice(centerShape.length, 0, nextLine[1], intersectionPoint);

      if (!peripheralShapes[i]) {
        peripheralShapes[i] = [];
      }
      peripheralShapes[i].splice(peripheralShapes[i].length, 0, nextLine[0], intersectionPoint, currentLine[1]);
      const j = i == 0 ? edges.length-1 : i-1;
      if (!peripheralShapes[j]) {
        peripheralShapes[j] = [];
      }
      peripheralShapes[j].push(intersectionPoint);
      peripheralShapes[j].push(currentLine[0]);

      if (template.tilingMode == 'square' && i == 0) {
        externalShapes.push(mirrorShapeAtBottomRightCorner([nextLine[0], intersectionPoint, currentLine[0]], [100, 100]))
      }
      else if (template.tilingMode == 'hex' && i == 0 || i == 5) {
        externalShapes.push(mirrorHexagonEdge([currentLine[0], intersectionPoint, nextLine[0]], edges[i][1]))
      }
    }
  }

  let fillPatterns: FillPatternDefinition[] = [];

  if (template.tilingMode == "hex") {
    if (mode == '+2') {
      fillPatterns =
        [
          // it works better with 3.8. cross pattern
          [[
            [[6, 7], [7, 8]],
            [[8], [6, 7]],
            [[7, 8], [8]]
          ], {shiftX: -0.5, shiftY: -0.5}],
          [
            [[6], [7, 8]],
            [[], [6]],
            [[7, 8], []]

          ],
          [
            [[6, 7], []],
            [[8], [6, 7]],
            [[], [8]]
          ],
          [[
            [[6, 8], [7]],
          ], {shiftX: 0.5}],
          [
            [[0, 1, 2, 3, 4, 5, 6]],
          ],
          [
            [[6]],
          ],
          [[
            [[7, 8]],
          ], {shiftX: -0.5}],
        ]
    } else {
      fillPatterns = [
        [[
          [[1,2], [1, 0], [ 2, 0], [2, 0,1]],
          [[1,2], [1], [2, 0], [2,1]],
        ], {shiftX: 0.5, shiftY: 0}],

        [[
          [[0, 1, 2], [1, 2]]
        ], {shiftX: -0.5}],

        [
          [[0]]
        ],
        [
          [[1, 2]]
        ]
      ]
    }
  } else {
    if (mode == '+1') {
      fillPatterns =
          [
            [[
              [[1], [0, 1], []],
              [[0, 1], [1], [0]],
              [[], [0], [1]],
            ], {shiftX: 0, shiftY: 0.5}],
            [
              [[1], [0]],
              [[0], [1]]
            ],
            [[
              [[0, 1], []],
              [[], [0, 1]],
            ], {}],
            [[
              [[1], [0], [0, 1]],
              [[0], [1], []],
              [[0, 1], [], [1]]
            ], {shiftX: -0.5, shiftY: 0}],
            [[
              [[0, 1], [0], [0, 1]],
              [[0], [], []],
              [[0, 1], [], [1]]
            ], {shiftY: 0, shiftX: -0.5}],
            [[
              [[0, 1], [1]], [[0], []]
            ], {shiftY: 0}]
          ];
    }
    else {
      fillPatterns = [
        [[
          [[5], [4, 5], []],
          [[4, 5], [5], [4]],
          [[], [4], [5]],
        ], {shiftX: 0, shiftY: -0.5}],
        [[
          [[4, 5], [4]],
          [[4], [4, 5]]
        ], {shiftY: -0.5}],
        [[
          [[5], []],
          [[], [5]]
        ], {shiftX: -0.5, shiftY: 0.5}],
        [[
          [[1,2,0,3,4], [0,1,2,3,4,5]],
          [[0,1,2,3,4,5],[0,1,2,3,4]]
        ], {shiftY: 0.5}],
        [
          [[1,0,2,3,4]],
        ],
        [
          [[1,0,2,3]],
        ]
      ];
    }
  }

  return {
    tilingMode: template.tilingMode,
    tileEdges: template.lines,
    tileSize: getFormSize(template.lines),

    lines: outLines,
    shapes: [
        ...peripheralShapes.filter(x =>!!x),
        ...(centerShape.length ? [centerShape as any as SimplePoint[]] : []),
    ],
    externalShapes,
    fillPatterns
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
