import {Config, FillConfig, Pattern, RoughConfig, SimpleGroup, TesselationInfo} from "../types";
import {boundingBox, averageOfPoints, vecSubtract, fromRanges} from "../utils/math";
import {applyOps, makeRoughDotFill, makeRoughLineFill, scribbleLine} from "../rough/scribble";
import {rand, Random, random} from "../utils/random";
import {getPattern, getPatternTransform, polygon, rescalePattern} from "./helpers";
import {offsetPolygon} from "../utils/offset";


/**
 * How big is the given shape?
 */
function getShapeSizeInfo(shape: SimpleGroup) {
  const bounds = boundingBox(shape);
  const shapeSize = vecSubtract(bounds[1], bounds[0]);

  const start = bounds[0];

  // What is this?
  const availableWidth = shapeSize[0] * 0.1;


  const center = vecSubtract(averageOfPoints(shape), start);
  return {
    bounds, shapeSize, start, availableWidth, center
  }
}

type ShapeInfo = ReturnType<typeof getShapeSizeInfo>;


function drawInfiniteFill(p5, config: Config, fillConfig: FillConfig,
                          rough: RoughConfig, shape: SimpleGroup, shapeInfo: ShapeInfo) {
  p5.push();
  p5.noFill();
  p5.stroke(config.colors.foreground);
  p5.strokeWeight(0.5);
  let originalShape = shape;

  let strokeWeight = (fillConfig.infiniteStrokeWeight ?? 1) * 0.5 * shapeInfo.availableWidth;
  let numCopies = Math.round((fillConfig.infiniteDensity ?? 1) * (shapeInfo.availableWidth / strokeWeight)) + 1;

  let start = 0.1;
  let end = 0.9;
  if (fillConfig?.infiniteAlignment == 1) {
    end = 0.4;
    numCopies /= 1.5;
  }
  else if (fillConfig?.infiniteAlignment == 2) {
    start = 0.4;
    end = 0.3;
    numCopies /= 1.5;
  }

  for (let i = 0; i < numCopies; i++) {
    // scale from 30% to 80%
    const scale = start + i / numCopies * end;

    p5.push();

    let oldMode = true;
    if (oldMode) {
      rescalePattern(p5, scale, shapeInfo.start, shapeInfo.center);
      // w/o and * both work
      p5.strokeWeight(strokeWeight / scale);
    }
    else {
      //shape = offsetPolygon(originalShape, -6);
    }

    if (rough?.mode == 'on') {
      for (let x=0; x<shape.length; x++) {
        let first = shape[x-1];
        let second = shape[x];
        if (x == 0) {
          first = shape[shape.length-1];
        }
        const foo = 1/(scale/0.4);
        scribbleLine(p5, ...first, ...second, {roughness: foo, maxRandomnessOffset: 1, bowing: 9})
      }
    }
    else {
      polygon(p5, shape);
    }
    p5.pop();
  }
  p5.pop();
}


export function drawShape(
    buffer, config: Config, cache: any, pattern: Pattern,
    fillConfig: FillConfig, rough: RoughConfig,
    shape: SimpleGroup, scale: number, info: TesselationInfo, p5,
) {
  const shapeInfo = getShapeSizeInfo(shape);

  // Decide  how to orient the fill pattern; certain patterns (lines, dots) will cause,
  // when scaled down far enough, something akin to a moire pattern to appear, depending
  // on the angle; we are unable to solve this ultimately, so the hack is to not allow
  // those angles where the moire pattern is especially problematic/visually unappealing.
  const patternRotationRnd = (fillConfig.patternAngle == 'random') ?
      random(0, 1) : fillConfig.patternAngle ?? 1;
  let patternRotation;
  patternRotation = fromRanges([
      [2, 24],
      [28,42],
      [49,62],
      [65,84],
      [98,133],
      [140,151],
      [157,160],
      [163,176]
  ], patternRotationRnd)

  const patternGap = fillConfig.patternGap ?? 1;

  if (fillConfig.patternKind == 'none') {
    return;
  }

  if (fillConfig.patternKind == 'infinite') {
    drawInfiniteFill(buffer, config, fillConfig, rough, shape, shapeInfo);
    return;
  }

  buffer.push();

  // If there is a margin, then we want to make it smaller
  let fillMarginUsed = 1;
  if (fillConfig.margin) {
    const x = config.pattern.angle - 0.5;
    // Not entirely correct yet
    const factor = 0.16 + 0.2458333*x + 0.40625*x**2 + 1.354167*x**3 + 2.34375*x**4;
    fillMarginUsed = 1 - (factor + (1-factor) * fillConfig.margin);
    rescalePattern(buffer, fillMarginUsed, shapeInfo.start, shapeInfo.center);
  }

  if (rough?.mode == 'on') {
    buffer.stroke(config.colors.foreground);
    if (fillConfig?.patternKind == 'lines' || fillConfig?.patternKind == 'dashed-lines') {
      if (fillConfig?.patternKind == 'dashed-lines') {
        buffer.drawingContext.setLineDash([12*fillConfig.patternScale, 6*fillConfig.patternScale]);
      }
      const {ops} = makeRoughLineFill(shape, {
        hachureAngle: 360 - patternRotation,
        hachureGap: Math.max(patternGap * 2 * fillConfig.patternScale, 0.3),
        maxRandomnessOffset: config.rough.maxOffset ?? 3,
        bowing: config.rough.bowing ?? 1,
        roughness: config.rough.roughness ?? 1
      });
      buffer.strokeWeight(fillConfig.patternScale);
      applyOps(buffer.drawingContext, ops);
    }

    if (fillConfig?.patternKind == 'dots') {
      const emptyFactor = 1;  // works between 0.3 and 0.6 it seems
      const ops = makeRoughDotFill(shape, {
        hachureGap: Math.max(patternGap * 2 * fillConfig.patternScale, 0.3),
        dotSize: fillConfig.patternScale * 0.35 / (emptyFactor)
      });
      buffer.strokeWeight(fillConfig.patternScale * 0.5  * emptyFactor);
      applyOps(buffer.drawingContext, ops);
    }

    if (fillConfig?.patternKind == 'solid') {
      const isThin = new Random(fillConfig.patternAngle).next() < 0.5;
      const weight = isThin ? 0.2 : 1.5;
      let c;
      if (isThin) {
        c = {
          hachureAngle: 45,
          hachureGap: fillConfig?.roughSolidDensity ?? 0.1,
          bowing: 50,
          maxRandomnessOffset: 1,
          roughness: 1
        }
      } else {
        c = {
          hachureAngle: 45,
          hachureGap: 1 * weight,
          bowing: isThin ? 70 : 50, // this one adds the empt space
          maxRandomnessOffset: 1,
          roughness: 1
        }
      }

      buffer.strokeWeight(weight);
      const {ops} = makeRoughLineFill(shape, c);
      applyOps(buffer.drawingContext, ops);
    }
  }

  else {
    if (fillConfig.patternKind == 'solid') {
      buffer.fill(config.colors.foreground);
      buffer.noStroke();
      polygon(buffer, shape);
    }

    else {
      let p = getPattern(cache, p5, fillConfig.patternKind, config.colors, patternGap);
      p.setTransform(
          getPatternTransform(
              shapeInfo.shapeSize, scale,
              fillConfig.patternScale ?? 1,
              fillMarginUsed
              )
              .rotate(patternRotation)
      );

      buffer.fill("black");  // I think is necessary
      buffer.drawingContext.fillStyle = p;
      buffer.noStroke();
      polygon(buffer, shape);
      buffer.drawingContext.fillStyle = null;
    }
  }

  buffer.pop();
}