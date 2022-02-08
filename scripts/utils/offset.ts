import {
  averageOfPoints,
  clone,
  dotProduct,
  vecSubtract,
  vectorMagnitude,
} from "./math";
import { SimpleGroup, SimplePoint } from "../types";
import {getJoin} from "../patterns/expandStroke";

const EPSILON = 1e-9;


function calculateArea(polygon: SimpleGroup) {
  if (
    vectorMagnitude(
      vecSubtract(clone(polygon[0]), polygon[polygon.length - 1])
    ) > EPSILON
  ) {
    polygon.push(polygon[0]);
  }

  let center = averageOfPoints(polygon.slice(0, polygon.length - 1));

  let n = polygon.length - 1;

  let area = 0.0;
  for (let i = 0; i <= n; i += 1) {
    let first = polygon[i % n];
    let second = polygon[(i + 1) % n];

    const a = vecSubtract(clone(first), center);
    const b = vecSubtract(clone(second), center);

    area += a[0] * b[1] - a[1] * b[0];
  }

  return area;
}


export function offsetPolygon(polygon: SimpleGroup, offset: number) {
  if (
    vectorMagnitude(
      vecSubtract(clone(polygon[0]), polygon[polygon.length - 1])
    ) > EPSILON
  ) {
    polygon.push(polygon[0]);
  }

  let area = calculateArea(polygon);
  if (area < 0.0) {
    polygon.reverse();
    area *= -1.0;
  }

  let n = polygon.length - 1;

  const newPolygon = [];
  const zeroPolygon = [];

  for (let i = 0; i <= n; i += 1) {
    let first = polygon[i % n];
    let common = polygon[(i + 1) % n];
    let second = polygon[(i + 2) % n];
    let zero_new_p = getJoin(common, first, second, 0);
    let new_p = getJoin(common, first, second, offset);
    newPolygon.push(new_p);
    zeroPolygon.push(zero_new_p);
  }

  let error = false;
  for (let i = 0; i <= n; i += 1) {
    let first = newPolygon[i % n];
    let second = newPolygon[(i + 1) % n];
    let new_angle = vecSubtract(clone(first), second);

    first = zeroPolygon[i % n];
    second = zeroPolygon[(i + 1) % n];
    let original_angle = vecSubtract(clone(first), second);

    error = error || dotProduct(original_angle, new_angle) < 0;
  }

  // if (error)
  // {
  //   throw new Error("Negative offset Limit exceeded, Polygon reversed order of points");
  // }

  return newPolygon;
}
