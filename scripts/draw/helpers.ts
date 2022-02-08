import {ColorScheme, FillPattern, SimpleGroup, SimplePoint} from "../types";
import {
  getCirclePattern,
  getCrossesPattern,
  getCrossHatchPattern, getDashedLinePattern,
  getHeartPattern,
  getLinePattern,
  getWavesPattern,
  SAFETY_ZOOM
} from "./fillPatterns";


// Get a pattern, with a cache.
export function getPattern(cache: any, p5, kind: string, colors: ColorScheme, gap?: number) {
  if (!cache.patterns) {
    cache.patterns = {};
  }
  if (cache.patterns[kind]) {
    return cache.patterns[kind];
  }

  let getPatternFunc = ({
    'lines': getLinePattern,
    'dashed-lines': getDashedLinePattern,
    'dots': getCirclePattern,
    'waves': getWavesPattern,
    'crosses': getCrossesPattern,
    'crossHatch': getCrossHatchPattern,
  } as { [K in FillPattern as any]: any })[kind];

  if (!getPatternFunc) {
    return null;
  }
  const graphics = getPatternFunc(p5, cache, colors, gap).elt;
  let pattern = p5.drawingContext.createPattern(graphics, 'repeat');

  cache.patterns[kind] = pattern;

  return pattern;
}

/**
 * Return a transform matrix to bring the pattern to the desired scale.
 * Accounts for the size of the shape where you want to apply the pattern.
 * Needs to know the globally applied scale transform as well.
 */
export function getPatternTransform(
    shapeSize: SimplePoint,
    globalScale: number,
    desiredScale: number | undefined,
    gapScale?: number
) {
  // Scale down from what every pattern is scaled up
  const scaleToUse = 1 / SAFETY_ZOOM
      // Not sure why this required
      / 2
      // The scale the user desires
      * desiredScale
      // Any applied margin (which is anotehr global scale making the the shape smaller)
      * (1 / gapScale);

  const mat = new DOMMatrix();
  return mat.scale(scaleToUse)
}

/**
 * Assuming a polygon centered at center and to be drawn at start, scale
 * it while maintaining the center.
 */
export function rescalePattern(p5, scale, start, center) {
  const rscale = 1 - scale;
  p5.translate(
      start[0] * (rscale),
      start[1] * (rscale),
  );
  p5.translate(
      center[0],
      center[1],
  );
  p5.scale(scale);
  p5.translate(
      -center[0],
      -center[1],
  );
}

export function polygon(p5, points: SimpleGroup) {
  p5.beginShape();
  points.forEach((point, idx) => {
    p5.vertex(point[0], point[1])
  })
  p5.endShape(p5.CLOSE);
}