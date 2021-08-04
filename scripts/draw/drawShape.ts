import {Config, FillConfig, Pattern, RoughConfig, SimpleGroup, TesselationInfo} from "../types";
import {boundingBox, averageOfPoints, vecSubtract} from "../utils/math";
import {getPattern, getPatternTransform, polygon, rescalePattern} from "./renderP5js";
import {applyOps, makeRoughDotFill, makeRoughLineFill, scribbleLine} from "../rough/scribble";
import {rand, randint} from "../utils/random";


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

  let strokeWeight = (fillConfig.infiniteStrokeWeight ?? 1) * 0.5 * shapeInfo.availableWidth;
  const numCopies = Math.round((fillConfig.infiniteDensity ?? 1) * (shapeInfo.availableWidth / strokeWeight)) + 1;

  for (let i = 0; i < numCopies; i++) {
    // scale from 30% to 80%
    const scale = 0.1 + i / numCopies * 0.9;

    p5.push();

    rescalePattern(p5, scale, shapeInfo.start, shapeInfo.center);

    // w/o and * both work
    p5.strokeWeight(strokeWeight / scale);

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
    p5, config: Config, cache: any, pattern: Pattern,
    fillConfig: FillConfig, rough: RoughConfig,
    shape: SimpleGroup, scale: number, info: TesselationInfo
) {
  const shapeInfo = getShapeSizeInfo(shape);
  const patternRotation = (fillConfig.patternAngle ?? 1); // + rand() * 40;
  const patternGap = fillConfig.patternGap ?? 1;

  if (fillConfig.patternKind == 'none') {
    return;
  }

  if (fillConfig.patternKind == 'infinite') {
    drawInfiniteFill(p5, config, fillConfig, rough, shape, shapeInfo);
    return;
  }

  p5.push();

  // If there is a margin, then we want to make it smaller
  let fillMarginUsed = 1;
  if (fillConfig.margin || true) {
    const x = config.pattern.angle - 0.5;
    // Not entirely correct yet
    const factor = 0.16 + 0.2458333*x + 0.40625*x**2 + 1.354167*x**3 + 2.34375*x**4;
    fillMarginUsed = 1 - (factor + (1-factor) * fillConfig.margin);
    rescalePattern(p5, fillMarginUsed, shapeInfo.start, shapeInfo.center);
  }

  if (rough?.mode == 'on') {
    p5.stroke(config.colors.foreground);
    if (fillConfig?.patternKind == 'lines') {
      const {ops} = makeRoughLineFill(shape, {
        hachureAngle: 360 - patternRotation,
        hachureGap: Math.max(patternGap * 2 * fillConfig.patternScale, 0.3),
        maxRandomnessOffset: config.rough.maxOffset ?? 3,
        bowing: config.rough.bowing ?? 1,
        roughness: config.rough.roughness ?? 1
      });
      p5.strokeWeight(fillConfig.patternScale);
      applyOps(p5.drawingContext, ops);
    }

    if (fillConfig?.patternKind == 'dots') {
      const emptyFactor = 1;  // works between 0.3 and 0.6 it seems
      const ops = makeRoughDotFill(shape, {
        hachureGap: Math.max(patternGap * 2 * fillConfig.patternScale, 0.3),
        dotSize: fillConfig.patternScale * 0.35 / (emptyFactor)
      });
      p5.strokeWeight(fillConfig.patternScale * 0.5  * emptyFactor);
      applyOps(p5.drawingContext, ops);
    }

    if (fillConfig?.patternKind == 'solid') {
      const isThin = rand() < 0.5;
      const weight = isThin ? 0.2 : 1.5;
      let c;
      if (isThin) {
        c = {
          hachureAngle: 45,
          hachureGap: fillConfig?.roughSolidDensity ?? 0.5,
          bowing: 70,
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
      p5.strokeWeight(weight);
      const {ops} = makeRoughLineFill(shape, c);
      applyOps(p5.drawingContext, ops);
    }
  }

  else {
    if (fillConfig.patternKind == 'solid') {
      p5.fill(config.colors.foreground);
      p5.noStroke();
      polygon(p5, shape);
    }

    else {
      let p = getPattern(cache, p5, fillConfig.patternKind, config.colors, patternGap);
      // TODO: lines/waves do not look good > 0.5, but dots do

      p.setTransform(
          getPatternTransform(
              shapeInfo.shapeSize, scale,
              fillConfig.patternScale ?? 1,
              fillMarginUsed
              )
              .rotate(patternRotation)
      );

      p5.fill("black");  // I think is necessary
      p5.drawingContext.fillStyle = p;
      p5.noStroke();
      polygon(p5, shape);
      p5.drawingContext.fillStyle = null;
    }
  }

  p5.pop();
}