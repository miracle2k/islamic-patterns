import {SimpleGroup, SimpleLine, SimplePoint} from "../types";
import {
  angleOfLine,
  clone,
  isSameLine,
  isSamePoint,
  orientLineFrom,
  perpendicularFromPoint,
  vecAdd,
  vecSubtract,
  vectorMagnitude,
  vecUnit
} from "../utils/math";


/**
 * Expand the stroke, creating a wide line.
 *
 * `lines` is all lines, and `idx` tells us the index of the given line, such that we can find the next
 * and prev lines.
 *
 * Return is a hexagon with the following structure:
 *    2 to 3: line on one side
 *    0 to 5: line on the other side
 *    1, 4: Thue center point of the meet on each side
 */
export function expandLineStroke(line: SimpleLine, idx: number, lines: SimpleLine[], width: number, tileEdges: SimpleLine[]): SimpleGroup {
  // Calculate the miter on both ends of the line.
  const topPair = calculatePointsAt(line, width, lines, tileEdges);
  const bottomPair = calculatePointsAt([line[1], line[0]], width, lines, tileEdges);

  return [
    bottomPair[0], line[0], bottomPair[1], topPair[0], line[1], topPair[1]
  ];
}


/**
 * Assume that line[1] is the point for which you want to calculate the miter.
 */
export function calculatePointsAt(line: SimpleLine, width: number, allLines: SimpleLine[], tileEdges?: SimpleLine[]) {
  // Find all connecting lines at this point.
  const connectingLines = findConnectingLinesWithTiling(line, allLines, tileEdges);

  // From all the connecting lines, we need to get two! The system is as follows:
  // Order them all by angle, pointing outward from the join point
  // Find the index of the current one. Pick before/after clockwise
  const connectionsWithAngle = connectingLines.map(connectionLine => {
    connectionLine = orientLineFrom(connectionLine, line[1]);
    const angle = angleOfLine(connectionLine);
    return {
      line: connectionLine,
      angle
    }
  });
  connectionsWithAngle.sort((a, b) => a.angle - b.angle);
  const indexOfOurLine = connectionsWithAngle.findIndex(x => {
    return isSameLine(x.line,  [line[1], line[0]]);
  })

  const beforeIdx = indexOfOurLine > 0 ? indexOfOurLine - 1 : connectionsWithAngle.length -1;
  const afterIdx = indexOfOurLine < connectionsWithAngle.length -1 ? indexOfOurLine + 1 : 0;
  const beforeAfter = {
    first: connectionsWithAngle[afterIdx].line,
    second: connectionsWithAngle[beforeIdx].line,
  }

  // join point is line[1].
  // for the other lines, p1 is the joint so we use p2
  const below = getJoin(line[1], line[0], beforeAfter.first[1], width);
  const above = getJoin(line[1], beforeAfter.second[1], line[0], width);

  return [below, above];
}


/**
 * Find all connections for "line" at line[1] as a join point. Does return itself.
 *
 * tileBox = bounding box of the structure
 */
export function findConnectingLinesWithTiling(line: SimpleLine, allLines: SimpleLine[], tileEdges?: SimpleLine[]): SimpleLine[] {
  let joinPoint = line[1];

  let connectingLines = [
      line
  ];

  // find all connection lines to line[1]
  for (const candidate of allLines) {
    if (isSameLine(candidate, line)) {
      continue;
    }
    if (isSamePoint(candidate[0], joinPoint) || isSamePoint(candidate[1], joinPoint)) {
      connectingLines.push(candidate);
    }
  }

  // If a single line, or multiple lines, meet at the edge of a tesselation unit, then
  // we know there will be further connections, as the lines connect also with those
  // in the adjacent units. We can use smart mirroring to deduce those adjacent lines.
  const mirrored = [];
  for (const edge of tileEdges) {
    // Is the join point *on top of* this edge?
    const vector = perpendicularFromPoint(edge, joinPoint);
    if (vectorMagnitude(vector) < 0.01) {
      for (const o of connectingLines) {
        // Basically, we want the start point to be the edge, and the other point to be the unit vector in reverse
        const fixedO = orientLineFrom(o, edge[1]);

        // Get the distance vector (perpendicular) from the other (non-join) point to the line.
        const pv = perpendicularFromPoint(edge, fixedO[1]);

        const final = vecAdd(vecAdd(clone(fixedO[1]), pv), pv);
        mirrored.push([fixedO[0], final]);
      }

      // Do not break, so those at an edge can be mirrored twice.
    }
  }

  return [...connectingLines, ...mirrored];
}

/**
 * Assumes two lines that share a point `sharedPoint`, with `otherPointA` and `otherPointB`
 * completing the two lines. Returns the point where the two mitered strokes meet.
 *
 * https://math.stackexchange.com/questions/1849784/calculate-miter-points-of-stroked-vectors-in-cartesian-plane
 */
function getJoin(
  sharedPoint: SimplePoint,
  otherPointA: SimplePoint,
  otherPointB: SimplePoint,
  width: number
): SimplePoint {
  let angle = angleOfLine([sharedPoint, otherPointB]) - angleOfLine([sharedPoint, otherPointA]);
  while (angle < 0.0) {
     angle += Math.PI * 2;
  }
  // equiv to from the link: (A-B) / AB
  const ua = vecUnit(vecSubtract(clone(sharedPoint), otherPointA))
  const ub = vecUnit(vecSubtract(clone(sharedPoint), otherPointB));

  // equiv to from the link: b / sin(angle)
  const v = width / Math.sin(angle);

  const x = sharedPoint[0] - (ua[0] * v + ub[0] * v);
  const y = sharedPoint[1] - (ua[1] * v + ub[1] * v);
  return [x, y];
}
