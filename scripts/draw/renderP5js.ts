import {
  ColorScheme,
  Config,
  FillConfig,
  FillPattern,
  Pattern, RoughMode,
  SimpleGroup,
  SimplePoint,
  TesselationInfo
} from "../types";
import {
  boundingBox,
  mapValueInt,
  pointsOfRect,
  polygonIntersectsPoints,
  sizeOfBounds
} from "../utils/math";
import {runTesselationLoop} from "./tesselation";
import {
  getCirclePattern,
  getCrossesPattern,
  getCrossHatchPattern,
  getHeartPattern,
  getLinePattern,
  getWavesPattern,
  SAFETY_ZOOM
} from "./fillPatterns";
import {drawShape} from "./drawShape";
import {initRandomizer, rand, randint} from "../utils/random";
import {drawLine} from "./drawLine";


// TODO: combine infinite with more cross lines, other patterns


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
    'dots': getCirclePattern,
    'hearts': getHeartPattern,
    'waves': getWavesPattern,
    'crosses': getCrossesPattern,
    'crossHatch': getCrossHatchPattern,
  } as {[K in FillPattern as any]: any})[kind];

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
  globalScale:  number,
  desiredScale: number|undefined,
  gapScale?: number
) {
  // Scale down from what every pattern is scaled up
  const scaleToUse = 1/SAFETY_ZOOM
    // Not sure why this required
      /   2
    // The scale the user desires
      * desiredScale
    // Any applied margin (which is anotehr global scale making the the shape smaller)
      * (1/gapScale);

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


function renderWithP5(
  pattern: Pattern,
  p5,
  x: number, y: number,
  scale: number,
  config: Config,
  cache: any,
  info: TesselationInfo
) {
  p5.push();
  p5.translate(x, y);
  p5.scale(scale);


  // Can be a kind of 3d glow kind of effect, or blurry if played right
  // p5.drawingContext.shadowOffsetX = 1;
  // p5.drawingContext.shadowOffsetY = 1;
  // p5.drawingContext.shadowColor = "black";
  // p5.drawingContext.shadowBlur = 3;

  ////////////////////////////// THE SHAPES

  // Figure out which shapes to draw
  let shapes = [...pattern.shapes, ...(pattern.externalShapes ?? [])];
  if (pattern.shapeSets) {
    const shapeSetIndex = mapValueInt(
        config.pattern.shapeSet, 0, 1, 0, pattern.shapeSets.length-1
    );
    const set = pattern.shapeSets[shapeSetIndex];
    shapes = set.map(v => shapes[v]);
  }

  // Figure out which fill to use
  let fillIdx;
  if (config.fillLogic == 'random') {
    fillIdx = randint(0, config.fills.length-1);
  }
  else if (config.fillLogic == 'cols') {
    fillIdx = info.x;
  }
  else if (config.fillLogic == 'rows') {
    fillIdx = info.y;
  }
  else if (config.fillLogic == 'diag') {
    fillIdx = info.y + info.x % 2;
  }
  const fillConfig = config.fills[Math.abs(fillIdx) % config.fills.length];
  shapes.forEach(shape => {
    drawShape(p5, config, pattern, cache, fillConfig, config.rough, shape, scale, info);
  })

  ////////////////////////////// THE LINES

  // None of the caps work really well
  //p5.strokeCap(p5.PROJECT);

  // Fill all the expanded line shapes with the bg color; this is because some
  // of the shape fills are a bit too big, going inside the expanded line fill.
  pattern.lines.forEach((line, idx) => {
    const expandedLine = pattern.expandedLines[idx];
    if (expandedLine) {
      p5.push();
      p5.noStroke();
      p5.fill(config.colors.background);
      polygon(p5, expandedLine);
      p5.pop();
    }
  });

  pattern.lines.forEach((line, idx) => {
    // Helpful for debugging interlacing
    //config.colors.foreground = '#'+(rand() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
    // if (idx == 5) {
    //   return;
    // }
    // if (idx == 11) {
    //   return;
    // }

    const expandedLine = pattern.expandedLines[idx];

    if (expandedLine) {
      if (config.expandedLineFill?.patternKind == 'none') {}

      else if (config.expandedLineFill?.patternKind == 'solid') {
        p5.fill(config.colors.foreground);
        p5.noStroke();

        polygon(p5, expandedLine);
      }

      // pattern
      else if (config.expandedLineFill?.patternKind) {
        const shapeSize = sizeOfBounds(boundingBox(pattern.expandedLines[0]));
        let p = getPattern(cache, p5, config.expandedLineFill.patternKind, config.colors, 1);
        p.setTransform(
            getPatternTransform(shapeSize, scale, 1).rotate(45)
        )

        p5.fill("black");
        p5.drawingContext.fillStyle = p;
        p5.noStroke();
        polygon(p5, expandedLine);
        p5.drawingContext.fillStyle = null;
      }
    }

    // Centerline
    if (config.centerLine) {
      if (config.expandedLineRightStroke?.show) {
        drawLine(p5, [expandedLine[4], expandedLine[1]], config.centerLine, config.colors, config.rough);
      }
      else {
        drawLine(p5, [line[0], line[1]], config.centerLine, config.colors, config.rough);
      }
    }

    // Expanded line stroke
    if (expandedLine && config.expandedLineLeftStroke) {
      drawLine(p5, [expandedLine[5], expandedLine[0]], config.expandedLineLeftStroke, config.colors, config.rough);
    }
    if (expandedLine && config.expandedLineRightStroke) {
      drawLine(p5, [expandedLine[2], expandedLine[3]], config.expandedLineRightStroke, config.colors, config.rough);
    }
  })

  /////////////////////////////////// TILES


  if (config.drawTiles) {
    p5.strokeWeight(0.8);
    p5.stroke(config.colors.overlay);
    p5.noFill();
    p5.drawingContext.lineDashOffset = 4 * 3;
    p5.drawingContext.setLineDash([1, 2]);
    pattern.tileEdges?.forEach(tileEdge => {
      p5.line(...tileEdge[0], ...tileEdge[1])
    })
  }

  p5.pop();
}


export function polygon(p5, points: SimpleGroup) {
  p5.beginShape();
  points.forEach((point, idx) => {
    p5.vertex(point[0], point[1])
  })
  p5.endShape(p5.CLOSE);
}


export class P5Renderer {
  p5: any;
  r: any;
  config: Config;
  pattern: Pattern;
  showInfo: boolean = false;

  constructor(config: Config, pattern: Pattern, parent?: any) {
    this.config = config;
    this.pattern = pattern;

    let sketch = (p) => {
      this.p5 = p;
      p.disableFriendlyErrors = true;

      p.setup = () => {
        const c = p.createCanvas(650*2, 500*2);
        if (parent) {
          c.parent(parent);
        }

        //this.draw();
      };
    };

    // @ts-ignore
    this.p5 = new p5(sketch);
  }

  cache: any = {};

  setupInteractiveHandlers()  {
    const handleInfoKey = (e) => {
      if (e.key == 'i') {
        this.showInfo = !this.showInfo;
        this.config.drawTiles = !this.config.drawTiles;
        this.draw();
      }
    };
    window.addEventListener('keypress', handleInfoKey);
    return () => {
      window.removeEventListener('keypress', handleInfoKey);
    }
  }

  draw() {
    initRandomizer(9);
    const {p5, config} = this;

    p5.background(config.colors.background);

    if (config.rough?.mode == 'split') {
      // this.clipTriangle(true, (clipArea) => this.drawPattern('off', clipArea));
      // this.clipTriangle(false, (clipArea) => this.drawPattern('on', clipArea));
      // if (config.showSplitLine) {
      //   p5.drawingContext.save();
      //   p5.drawingContext.shadowOffsetX = -6;
      //   p5.drawingContext.shadowOffsetY = -6;
      //   p5.drawingContext.shadowColor = "#000000";
      //   p5.drawingContext.shadowBlur = 12;
      //
      //   p5.strokeWeight(1);
      //   //p5.stroke('gray');
      //   p5.stroke('#f5f2e3');
      //   p5.line(0, p5.height, p5.width, 0)
      //   p5.drawingContext.restore();
      // }
    }
    else {
      this.drawPattern(config.rough.mode);
    }

    const frameWidth = this.drawFrame();

    if (this.showInfo && this.pattern.label) {
      p5.push();
      p5.translate(0, -3);
      const fontSize = 0.25 * frameWidth;
      const rowHeight = frameWidth / 4;

      p5.textStyle(p5.ITALIC);
      p5.textSize(fontSize);

      const firstlineBottom = p5.height - rowHeight * 3 + fontSize * 0.8;
      const secondLineBottom = p5.height - rowHeight * 2 + fontSize;
      const leftDistance = this.config.frame == 'full' ? 65 : 15;
      const neededWidth = Math.max(p5.textWidth(this.pattern.label?.title), p5.textWidth(this.pattern.label?.location));

      if (this.config.frame == 'none') {
        p5.fill(config.colors.background);
        p5.stroke(config.colors.foreground);
        p5.rect(leftDistance - 5, firstlineBottom - fontSize - 5, neededWidth + 10, secondLineBottom - firstlineBottom + fontSize * 2);
      }

      p5.fill(config.colors.overlay);
      p5.noStroke();
      p5.text(this.pattern.label?.title, leftDistance, firstlineBottom);
      p5.textStyle(p5.NORMAL);
      p5.text(this.pattern.label?.location, leftDistance, secondLineBottom)
      p5.pop();
    }
  }

  // clipTriangle(top: boolean, f: any) {
  //   const {p5} = this;
  //
  //   let poly;
  //
  //   p5.drawingContext.save();
  //   p5.drawingContext.beginPath();
  //   if (top) {
  //     p5.drawingContext.moveTo(0, 0);
  //     p5.drawingContext.lineTo(p5.width, 0);
  //     p5.drawingContext.lineTo(0, p5.height);
  //     poly = [[0, 0], [p5.width, 0], [0, p5.height]];
  //   } else {
  //     p5.drawingContext.moveTo(p5.width, 0);
  //     p5.drawingContext.lineTo(p5.width, p5.height);
  //     p5.drawingContext.lineTo(0, p5.height);
  //     poly = [[p5.width, 0], [p5.width, p5.height], [0, p5.height]];
  //   }
  //   p5.drawingContext.clip();
  //   f(poly);
  //   p5.drawingContext.restore();
  // }

  drawPattern(roughMode: RoughMode, clipArea?: SimpleGroup) {
    const {p5, config, pattern, cache} = this;

    p5.background(config.colors.background);

    runTesselationLoop(
        {
          width: p5.width,
          height: p5.height,
          desiredNumber: config.desiredNumber,
          pattern
        }, (x, y, scale, info) => {
          const c = {
            ...config,
            rough: {
              ...config.rough,
              mode: roughMode,
            }
          }

          const rectToBeDrawn: SimpleGroup = [
              [x, y].map(x => Math.max(x, 0)) as SimplePoint,
              [pattern.tileSize[0] * scale, pattern.tileSize[1] * scale]
          ];
          if (clipArea && !polygonIntersectsPoints(
              clipArea,
              pointsOfRect(rectToBeDrawn)))
          {
            //console.log('skip', info.x, info.y, roughMode, rectToBeDrawn, clipArea)

            // p5.push();
            // // p5.translate(x, y);
            // // p5.scale(scale);
            //
            // p5.stroke("red");
            // p5.strokeWeight(3);
            // p5.fill("green");
            // p5.rect(...rectToBeDrawn[0], ...rectToBeDrawn[1])
            // p5.pop();
            return;
          }

          //console.log('draw', info.x, info.y, roughMode, rectToBeDrawn)
          renderWithP5(pattern, p5, x, y, scale, c, cache, info);
        });
  }

  drawFrame() {
    const {p5, config} = this;

    p5.noStroke();
    p5.fill(config.colors.background);

    const frameWidth = 0.05;
    const paddingPct = config.animate ? 0.5 - p5.millis() / 4000 * (0.5 - frameWidth) : frameWidth;

    const h = Math.max(0, paddingPct * p5.height);
    const w = Math.max(0, paddingPct * p5.width);
    const s = Math.max(h, w);

    if (config.frame != 'none') {
      p5.rect(0, 0, p5.width, s);
      p5.rect(0, p5.height-s, p5.width, s);

      if (config.frame == 'full') {
        p5.rect(0, 0, s, p5.height);
        p5.rect(p5.width-s, 0, s, p5.height);

        // frame border
        p5.strokeWeight(1);
        p5.noFill();
        p5.stroke(config.colors.foreground);
        p5.rect(s, s, p5.width-(s*2), p5.height-(s*2))
      }
      else {
        p5.strokeWeight(1);
        p5.stroke(config.colors.foreground);
        p5.line(0, s, p5.width, s)
        p5.line(0, p5.height-s, p5.width, p5.height-s)
      }
    }

    return s;
  }
}