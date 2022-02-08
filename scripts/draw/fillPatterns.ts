import {ColorScheme} from "../types";

export const SAFETY_ZOOM = 5;

/**
 * We have to scale the pattern because if we draw a 1 px line into a pattern, it
 * can never be rendered at a higher resolution than this. Thus, the size of the
 * texture should be the max that we ever want to draw.
 */
export function initPattern(p5, cache: any, scheme: ColorScheme, w: number, h: number, scale: boolean = true) {
  let targetWidth, targetHeight, horzScale;
  if (scale) {
    // We want width=100
    targetWidth = 100;
    horzScale = targetWidth / w;
    targetHeight = h * horzScale;
  }
  else {
    targetWidth = w;
    targetHeight = h;
  }

  const pattern = p5.createGraphics(w * SAFETY_ZOOM, h * SAFETY_ZOOM);
  pattern.background(scheme.background);
  // We want to scale it to default size
  if (scale) {
    pattern.scale(SAFETY_ZOOM, SAFETY_ZOOM)
  }
  return pattern;
}


export function getCirclePattern(p5, cache: any, scheme: ColorScheme, gap: number) {
  // 1 to 6 seems good
  const diameter = 1;
  const size = diameter + gap;

  // Have a black fill
  const pattern = initPattern(p5, cache, scheme, size, size);
  pattern.fill(scheme.foreground);
  pattern.noStroke();
  pattern.circle(size/2, size/2, diameter);
  return pattern;
}


export function getHeartPattern(p5, cache: any, config: ColorScheme, gap) {
  // We have the shape for 10x10 predefined
  const size = 10;
  const p = new Path2D('M2.83 0C1.27 0 0 1.27 0 2.83C0 6.04 2.63 7.62 5 10L5 10C7.37 7.62 10 6.04 10 2.83C10 1.27 8.73 0 7.17 0C6.29 0 5.52.42 5 1.05C4.48.42 3.71 0 2.83 0Z')

  // Make the heart smaller or bigger (while keeping the stroke)
  const scale = 0.5;
  const padding = gap;

  // Make the pattern itself smaller/bigger (including the stroke)
  const patternScale = 0.25;

  const pattern = initPattern(p5, cache, config, patternScale * scale * size + padding, patternScale * scale * size + padding);
  pattern.translate(padding/2, padding/2);
  pattern.scale(scale * patternScale);
  pattern.stroke(config.foreground);

  pattern.strokeWeight(1 / scale);

  pattern.drawingContext.stroke(p);
  return pattern;
}


// replace with zigzag?
export function getWavesPattern(p5, cache: any, scheme: ColorScheme, gap) {
  const p = new Path2D("M 0 2 c 1.25 -2.5 3.75 -2.5 5 0 c 1.25 2.5 3.75 2.5 5 0 M -5 2 c 1.25 2.5 3.75 2.5 5 0 M 10 2 c 1.25 -2.5 3.75 -2.5 5 0")
  const pathWidth = 10;
  const pathHeight = 6;
  const height = pathHeight + gap;

  const pattern = initPattern(p5, cache, scheme, pathWidth, height);
  // pattern.stroke('gray');
  // pattern.drawingContext.strokeRect(0, 0, pathWidth, height)

  pattern.translate(0, 1 + gap/2)
  pattern.stroke(scheme.foreground);
  pattern.drawingContext.stroke(p);
  return pattern;
}


export function getCrossesPattern(p5, cache: any, scheme: ColorScheme, gap: number) {
  const weight = 1;
  const length = 5;
  const size = gap+weight+length;

  const pattern = initPattern(p5, cache, scheme, size, size);
  pattern.stroke(scheme.foreground);
  pattern.strokeWeight(weight)
  pattern.line(size/2, gap/2, size/2, size-gap/2);
  pattern.line(gap/2, size/2, size-gap/2, size/2);
  return pattern;
}


/**
 * The job: Return something with a line width of 1px, scaled up by SAFETY_ZOOM.
 * If we scale it down by SAFETY_ZOOM, it should draw a 1px line.
 */
export function getLinePattern(p5, cache, scheme: ColorScheme, gap: number, dashLen: number = 0) {
  const weight = 1;
  const width = gap + weight;

  const pattern = initPattern(p5, cache, scheme, width, width + dashLen);
  pattern.stroke(scheme.foreground);
  pattern.strokeWeight(weight)
  pattern.line(width/2, 0, width/2, width);

  return pattern;
}


export function getDashedLinePattern(p5, cache, scheme: ColorScheme, gap: number) {
  return getLinePattern(p5, cache, scheme, gap, 3)
}


export function getCrossHatchPattern(p5, cache, scheme: ColorScheme, gap) {
  const weight = 1;
  const size = gap+weight;

  const pattern = initPattern(p5, cache, scheme, size, size);
  pattern.stroke(scheme.foreground);
  pattern.line(size/2, 0, size/2, size);
  pattern.line(0, size/2, size, size/2);
  return pattern;
}