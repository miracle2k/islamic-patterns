import {rand} from "../utils/random";
import {
  CurveOptions,
  dotsOnLines,
  HachureOptions,
  LineOptions,
  makeDoubleLine, makeEllipse,
  offset,
  Op, OpType,
  polygonHachureLines,
  RoughnessOptions
} from "./hachure";
import {SimplePoint} from "../types";


export function makeRoughLineFill(points: SimplePoint[], o: HachureOptions & LineOptions & RoughnessOptions) {
  const lines = polygonHachureLines(points, o.hachureGap, o.hachureAngle);
  const ops: Op[] = [];

  for (const line of lines) {
    ops.push(...makeDoubleLine(line[0][0], line[0][1], line[1][0], line[1][1], o));
  }
  return {ops};
}

/**
 * We do not actually allow the roughness to be configured here, why?
 */
export function makeRoughDotFill(points: SimplePoint[], o: { dotSize: number, hachureGap: number; }) {
  const lines = polygonHachureLines(points, o.hachureGap, 0);

  return dotsOnLines(lines, {
    gap: o.hachureGap,
    dotSize: o.dotSize,
    curveStepCount: 10,
    curveFitting: 1,
    curveTightness: 0
  });
}

/**
 * Before this, you should set:
 * - ctx.lineWidth   (how thick you want it)
 * - ctx.strokeStyle (your color)
 *
 * Feel free to also experiment with:
 * - ctx.setLineDash
 * - ctx.lineDashOffset
 */
export function applyOps(ctx: CanvasRenderingContext2D, ops: Op[]) {
  ctx.beginPath();
  for (const item of ops) {
    const data = item.data;
    switch (item.op) {
      case OpType.move:
        ctx.moveTo(data[0], data[1]);
        break;
      case OpType.bcurveTo:
        ctx.bezierCurveTo(data[0], data[1], data[2], data[3], data[4], data[5]);
        break;
    }
  }
  ctx.stroke();
}

export function scribbleLine(p5, x1: number, y1: number, x2: number, y2: number, o: RoughnessOptions) {
  // Those changes are to approximate the look from `scribbleLineAlt`.
  const ops = makeDoubleLine(x1, y1, x2, y2, {
    roughness: o.roughness,
    maxRandomnessOffset: o.maxRandomnessOffset / 3,
    bowing: o.bowing * 6
  })
  applyOps(p5.drawingContext, ops)
}

export function scribbleEllipse(p5, x: number, y: number, w: number, h: number) {
  applyOps(p5.drawingContext, makeEllipse(x, y, w, h, {curveStepCount: 3}))
}