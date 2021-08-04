import {rand} from "../utils/random";
import {
  dotsOnLines,
  HachureOptions,
  LineOptions,
  makeDoubleLine,
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
    // TODO: Try a single line fill...
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
  const opts = makeDoubleLine(x1, y1, x2, y2, {
    roughness: o.roughness,
    maxRandomnessOffset: o.maxRandomnessOffset / 3,
    bowing: o.bowing * 6
  })
  applyOps(p5.drawingContext, opts)
}

// maxOffset is max movement of points
// bowing * maxOffset is the curve control point position +/- a random offset.
// roughness is a multiplicator for all randomness.
export function scribbleLineAlt(p5, x1: number, y1: number, x2: number, y2: number, o: {
  bowing: number,
  maxOffset: number,
  roughness?: number
}) {
  const lenSq = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
  let _offset = o.maxOffset;

  if ( o.maxOffset*o.maxOffset*100 > lenSq ) {
    _offset = Math.sqrt( lenSq )/10;
  }

  var halfOffset = _offset/2;
  var divergePoint = 0.2 + rand()*0.2;
  var midDispX = o.bowing * o.maxOffset*(y2-y1)/200;
  var midDispY = o.bowing*o.maxOffset*(x1-x2)/200;
  midDispX = offset( -midDispX, midDispX );
  midDispY = offset( -midDispY, midDispY );

  p5.noFill();

  p5.beginShape();
  p5.vertex(     x1 + offset( -_offset, _offset, o ), y1 + offset( -_offset, _offset, o ) );
  p5.curveVertex(x1 + offset( -_offset, _offset, o ), y1 + offset( -_offset, _offset, o ) );
  p5.curveVertex(midDispX+x1+(x2 -x1)*divergePoint + offset( -_offset, _offset, o ), midDispY+y1 + (y2-y1)*divergePoint + offset( -_offset, _offset, o ) );
  p5.curveVertex(midDispX+x1+2*(x2-x1)*divergePoint + offset( -_offset, _offset, o ), midDispY+y1+ 2*(y2-y1)*divergePoint + offset( -_offset,_offset, o ) );
  p5.curveVertex(x2 + offset( -_offset, _offset, o ), y2 + offset( -_offset, _offset, o ) );
  p5.vertex(     x2 + offset( -_offset, _offset, o ), y2 + offset( -_offset, _offset, o ) );
  p5.endShape();

  p5.beginShape();
  p5.vertex(     x1 + offset( -halfOffset, halfOffset, o ), y1 + offset( -halfOffset, halfOffset, o ) );
  p5.curveVertex(x1 + offset( -halfOffset, halfOffset, o ), y1 + offset( -halfOffset, halfOffset, o ) );
  p5.curveVertex(midDispX+x1+(x2 -x1)*divergePoint + offset( -halfOffset, halfOffset, o ), midDispY+y1 + (y2-y1)*divergePoint + offset( -halfOffset, halfOffset, o ) );
  p5.curveVertex(midDispX+x1+2*(x2-x1)*divergePoint + offset( -halfOffset, halfOffset, o ), midDispY+y1+ 2*(y2-y1)*divergePoint + offset( -halfOffset, halfOffset, o ) );
  p5.curveVertex(x2 + offset( -halfOffset, halfOffset, o ), y2 + offset( -halfOffset, halfOffset, o ) );
  p5.vertex(     x2 + offset( -halfOffset, halfOffset, o ), y2 + offset( -halfOffset, halfOffset, o ) );
  p5.endShape();
}


const numEllipseSteps = 9;
const ellipseInc = (Math.PI*2)/numEllipseSteps;


export function buildEllipse(p5, cx, cy, rx, ry, _offset, overlap, o: {roughness?: number} ) {
  var radialOffset = offset( -0.5, 0.5, o )-Math.PI/2;

  p5.beginShape();

  p5.curveVertex( offset( -_offset, _offset, o )+cx+0.9*rx*Math.cos( radialOffset-ellipseInc ),
      offset( -_offset, _offset, o )+cy+0.9*ry*Math.sin( radialOffset-ellipseInc ) );

  for ( var theta = radialOffset; theta < Math.PI*2+radialOffset-0.01; theta+=ellipseInc ) {
    p5.curveVertex( offset( -_offset, _offset, o )+cx+rx*Math.cos( theta ),
        offset( -_offset, _offset, o )+cy+ry*Math.sin( theta ) );
  }

  p5.curveVertex(
      offset( -_offset, _offset, o )+cx+rx*Math.cos( radialOffset+Math.PI*2+overlap*0.5 ),
      offset( -_offset, _offset, o )+cy+ry*Math.sin( radialOffset+Math.PI*2+overlap*0.5 ) );

  p5.curveVertex( offset( -_offset, _offset, o )+cx+0.98*rx*Math.cos( radialOffset+overlap ),
      offset( -_offset, _offset, o )+cy+0.98*ry*Math.sin( radialOffset+overlap ) );

  p5.curveVertex( offset( -_offset, _offset, o )+cx+0.9*rx*Math.cos( radialOffset+overlap*0.5 ),
      offset( -_offset, _offset, o )+cy+0.9*ry*Math.sin( radialOffset+overlap*0.5 ) );
  p5.endShape();
}

export function scribbleEllipse(p5, x, y, w, h, o: {roughness?: number} ) {
  var rx = Math.abs(w/2);
  var ry = Math.abs(h/2);

  rx += offset( -rx*0.05, rx*0.05 );
  ry += offset( -ry*0.05, ry*0.05 );

  buildEllipse(p5, x, y, rx, ry, 1, ellipseInc*offset( 0.1, offset( 0.4, 1, o ), o ), o );
  buildEllipse(p5, x, y, rx, ry, 1.5, 0, o );
}