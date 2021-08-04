import {SimpleGroup, SimpleLine} from "../types";
import {vecAdd} from "../utils/math";

export const TileEdges100Square: SimpleLine[] = [
  [[0, 0], [0, 100]],
  [[100, 100], [0, 100]],
  [[100, 0], [100, 100]],
  [[100, 0], [0,0]],
];

export function makeLinesFromShapes(shapes: SimpleGroup[]) {
  const lines: SimpleLine[] = [];
  for (const shape of shapes) {
    for (let x=0; x<shape.length; x++) {
      let first = shape[x-1];
      let second = shape[x];
      if (x == 0) {
        first = shape[shape.length-1];
      }
      lines.push([first, second]);
    }
  }
  return lines;
}

// Manually designed hex patterns often have (0, 0) at the
// construction rect.
export function moveHexagonPoints(points: any) {
  points.forEach(l => vecAdd(l, [-6.6987298107780475, 0]));
}