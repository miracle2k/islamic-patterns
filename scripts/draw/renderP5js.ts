import {
  Config, FillConfig,
  FillPatternOpts,
  FillPatternStructure,
  isFillPatternDefinition,
  Pattern,
  TesselationInfo
} from "../types";
import {runTesselationLoop} from "./tesselation";
import {drawShape} from "./drawShape";
import {initRandomizer} from "../utils/random";
import {drawLine} from "./drawLine";
import {polygon} from "./helpers";
import {debug} from "../utils/debug";
import {mapValueInt} from "../utils/math";


function renderTile(opts: {
    pattern: Pattern,
    buffer,
    x: number, y: number,
    scale: number,
    config: Config,
    cache: any,
    info: TesselationInfo,
    p5,
    fillPattern: FillPatternStructure
  }) {
  const {buffer, pattern, x, y, scale, config, cache, info, p5, fillPattern} = opts;

  buffer.push();
  buffer.translate(x, y);
  buffer.scale(scale);

  // Can be a kind of 3d glow kind of effect, or blurry if played right
  // p5.drawingContext.shadowOffsetX = 1;
  // p5.drawingContext.shadowOffsetY = 1;
  // p5.drawingContext.shadowColor = "black";
  // p5.drawingContext.shadowBlur = 3;

  ////////////////////////////// THE SHAPES

  // If there is a fill pattern, apply it.
  if (fillPattern && config.fills.length) {
    let shapes = [...pattern.shapes, ...(pattern.externalShapes ?? [])];

    // Which row are we in?
    const rowIdx = Math.abs(info.y) % fillPattern.length;
    const rowDef = fillPattern[rowIdx];

    // Which column are we in?
    const colIdx = Math.abs(info.x) % rowDef.length;
    let patternDef = rowDef[colIdx];

    // true is a special value meaning all
    const allShapeIdxes = Array.from(Array(shapes.length).keys());
    let shapesToFill: number[] = patternDef === true ? allShapeIdxes : patternDef;

    allShapeIdxes.forEach(shapeIdx => {
      let fillConfig: FillConfig;
      if (shapesToFill.indexOf(shapeIdx) > -1) {
        fillConfig = config.fills[0];
      }
      else if (config.fills.length > 1) {
        fillConfig = config.fills[1];
      }
      else {
        return;
      }


      let shape = shapes[shapeIdx];

      // Cut off a random part of the shape? Kind of looks interesting.
      //shape = [...shape.slice(0, shape.length / 2 + 1)]

      drawShape(buffer, config, pattern, cache, fillConfig, config.rough, shape, scale, info, p5);
    });
  }

  ////////////////////////////// THE LINES

  // None of the caps work really well
  //p5.strokeCap(p5.PROJECT);

  // Fill all the expanded line shapes with the bg color; this is because some
  // of the shape fills are a bit too big, going inside the expanded line fill,
  // usually due to issues with polygon offsetting. Unfortunately this means
  // that in some cases say "dots" appear cut off.
  pattern.lines.forEach((line, idx) => {
    const expandedLine = pattern.expandedLines[idx];
    if (expandedLine) {
      buffer.push();
      buffer.noStroke();
      buffer.fill(config.colors.background);
      polygon(buffer, expandedLine);
      buffer.pop();
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
      // pattern - not in use now
      // if (config.expandedLineFill?.patternKind == 'none') {}
      //
      // else if (config.expandedLineFill?.patternKind == 'solid') {
      //   buffer.fill(config.colors.foreground);
      //   buffer.noStroke();
      //
      //   polygon(buffer, expandedLine);
      // }

      // else if (config.expandedLineFill?.patternKind) {
      //   const shapeSize = sizeOfBounds(boundingBox(pattern.expandedLines[0]));
      //   let p = getPattern(cache, buffer, config.expandedLineFill.patternKind, config.colors, 1);
      //   p.setTransform(
      //       getPatternTransform(shapeSize, scale, 1).rotate(45)
      //   )
      //
      //   buffer.fill("black");
      //   buffer.drawingContext.fillStyle = p;
      //   buffer.noStroke();
      //   polygon(buffer, expandedLine);
      //   buffer.drawingContext.fillStyle = null;
      // }
    }

    // Centerline
    if (config.centerLine) {
      if (config.expandedLineRightStroke?.show) {
        drawLine(buffer, [expandedLine[4], expandedLine[1]], config.centerLine, config.colors, config.rough);
      }
      else {
        drawLine(buffer, [line[0], line[1]], config.centerLine, config.colors, config.rough);
      }
    }

    // Expanded line stroke
    if (expandedLine && config.expandedLineLeftStroke) {
      drawLine(buffer, [expandedLine[5], expandedLine[0]], config.expandedLineLeftStroke, config.colors, config.rough);
    }
    if (expandedLine && config.expandedLineRightStroke) {
      drawLine(buffer, [expandedLine[2], expandedLine[3]], config.expandedLineRightStroke, config.colors, config.rough);
    }
  })

  buffer.pop();
}


/**
 * Draw the full pattern on buffers.
 *
 * This attempts a performance optimization, where you can pass multiple canvases and a zoom factor for each.
 * It will assume that you feel zoom into exactly the center; while all canvases have the same size, the zoomed
 * ones can be used to draw the center in a bette quality; to draw a zoomed out version, you will need to
 * draw all the buffers, with the inner ones scaled down, as each tile is still only drawn a single time, one
 * one of the canvases.
 *
 * Passing just a single buffer with zoom-level = 1 essentially disables this mode. In that case, zooming
 * in while either be somewhat pixelated, or, you'd pass in a very big canvas buffer from the beginning, to
 * account for the amount that you want to scale.
 */
function drawPattern(
    buffers: [number, any][],
    opts: {
      pattern: Pattern,
      p5,
      config: Config,
      cache: any,
    }
) {
  const {config, pattern, cache, p5} = opts;

  // Figure out which fill pattern to use
  let fillPattern: FillPatternStructure|undefined;
  let fillPatternOpts: FillPatternOpts = {};

  const pIndex = mapValueInt(
      config.pattern.fillPatternIdx ?? 0,
      0, 1, -1, (pattern?.fillPatterns?.length ?? 0) -1
  );

  if (pIndex == -1) {
    // ALL
    fillPattern = [[true]]
  } else {
    let def = pattern?.fillPatterns[pIndex];
    fillPattern = isFillPatternDefinition(def) ? def : def[0];
    fillPatternOpts = !isFillPatternDefinition(def) ? def[1] : {};
  }

  // if (window.DEBUG) {
  //   debug(`${pIndex + 1} of ${pattern?.fillPatterns?.length ?? 0}`);
  // }

  let cachedTile;

  // All buffers shall have the same size
  const fullWidth = buffers[0][1].width;
  const fullHeight = buffers[0][1].height;

  runTesselationLoop(
      {
        width: fullWidth,
        height: fullHeight,
        desiredNumber: (config.bufferedNumber ?? 11),
        pattern,
        fillPatternOpts
      }, (x, y, scale, info) => {
        // const rectToBeDrawn: SimpleGroup = [
        //   [x, y].map(x => Math.max(x, 0)) as SimplePoint,
        //   [pattern.tileSize[0] * scale, pattern.tileSize[1] * scale]
        // ];
        //console.log('draw', info.x, info.y, roughMode, rectToBeDrawn)

        let sx = pattern.tileSize[0]*scale;
        let sy = pattern.tileSize[1]*scale;

        // Decide which buffer to draw this tile on. The tiles closer to the center are drawn
        // on the inner buffers, in larger scale, so we can zoom in better quality.
        let bufferToDraw: any = buffers[0][1];
        let zoomToUse: number = buffers[0][0];
        for (const [z, b] of buffers) {
          const horzMargin = (fullWidth - fullWidth / z) / 2;
          const vertMargin = (fullHeight - fullHeight / z) / 2;

          if (
              (x > horzMargin && y > vertMargin) &&
              (x + sx < fullWidth-horzMargin && y + sy < fullHeight-vertMargin)
          ) {
            bufferToDraw = b;
            zoomToUse = z;
          }
        }

        if (!bufferToDraw) {
          return;
        }

        scale = scale * zoomToUse;
        x = (x - (fullWidth - fullWidth / zoomToUse) / 2) * zoomToUse;
        y = (y - (fullHeight - fullHeight / zoomToUse) / 2) * zoomToUse;

        // The fast path is an experimental, unfinished logic that draws tiles to a buffer once, and
        // then flips it for each repeat; the downside is that we lose uniqueness when rough mode.
        let useFastPath = false;

        if (!useFastPath) {
          renderTile({
            pattern, buffer: bufferToDraw, x, y, scale, config, cache, info, p5, fillPattern
          });
          return;
        }

        // TODO: Needs special handling for pattern across tiles + randomness in fill angle + roughness
        else {
          if (!cachedTile) {
            cachedTile = p5.createGraphics(sx*2, sy*2); // *2 so it will also draw any thing "outside" // XXX what about the other "direction" mode?
            renderTile({
              pattern, buffer: cachedTile, x: 0, y: 0, scale, config, cache, info, p5, fillPattern
            });
          }

          bufferToDraw.image(cachedTile, x, y);
        }
      });

  return fillPatternOpts;
}


function drawOverlay(buffer, config: Config, pattern: Pattern, fillPatternOpts: FillPatternOpts) {
  buffer.push();
  buffer.strokeWeight(0.8);
  buffer.stroke(config.colors.overlay);
  buffer.noFill();
  buffer.drawingContext.lineDashOffset = 4 * 3;
  buffer.drawingContext.setLineDash([1, 2]);

  runTesselationLoop(
      {
        width: buffer.width,
        height: buffer.height,
        desiredNumber: (config.bufferedNumber ?? 11),
        pattern: pattern,
        fillPatternOpts
      }, (x, y, scale, info) => {
        buffer.push();
        buffer.translate(x, y);
        buffer.scale(scale);
        pattern.tileEdges?.forEach(tileEdge => {
          buffer.line(...tileEdge[0], ...tileEdge[1])
        })
        buffer.pop();
      });
  buffer.pop();
}


// A multiplication factor causing the buffer to be larger (more pixels) than what we
// actually need to display the fully zoomed out pattern; as a result, when zooming in
// the quality will be a bit better.
// 1.2 appears to be a nice improvement, without enlarging the buffer too much.
const OVERSCALE = 2.2;


export class P5Renderer {
  p5: any;
  r: any;
  config: Config;
  pattern: Pattern;
  showInfo: boolean = false;
  seed: number = 0;
  buffers: [number, any][];
  overlayBuffer: any;
  animationActive: boolean = false;
  currentZoom = 1;
  targetZoom = 1;
  startZoomMillis: number;
  startZoomValue: number;
  size: {width: number, height: number};
  fillPatternOpts: any;

  constructor(
    config: Config,
    pattern: Pattern,
    opts?: {
      parent?: any,
      seed?: number,
      size?: {width: number, height: number},
      noAutoInit?: boolean
    }
  ) {
    this.config = config;
    this.pattern = pattern;
    this.seed = opts?.seed;
    const size = this.size = opts?.size || {width: 650, height: 500};

    let sketch = (p) => {
      this.p5 = p;
      p.disableFriendlyErrors = true;

      p.setup = () => {
        const c = p.createCanvas(size.width, size.height);
        if (opts?.parent) {
          c.parent(opts.parent);
        }

        // debug('[setup] init')
        if (!opts.noAutoInit) {
          this.init();
        }
      };

      p.draw = () => {
        if (this.animationActive) {
          this.draw();
          this.runAnimationLoop();
        }
      }
    };

    // @ts-ignore
    this.p5 = new window.p5(sketch);
  }

  cache: any = {};

  setupInteractiveHandlers(root?: any)  {
    root = root || window;

    const maxZoom = 5;
    const minZoom = 1;

    const handleKeyPress = (e) => {
      if (e.key == 'i') {
        this.showInfo = !this.showInfo;
        this.config.drawTiles = !this.config.drawTiles;
        this.draw();
      }
    };
    const handleKeyDown = (e) => {
      if (e.keyCode == 38) {  // arrow up
        e.preventDefault();
        this.zoomTo(Math.min(maxZoom, this.targetZoom + 0.1));
        this.draw();
      }
      if (e.keyCode == 40) {  // arrow down
        e.preventDefault();
        this.zoomTo(Math.max(minZoom, this.targetZoom - 0.1));
        this.draw();
      }
    };
    const handleWheel = (e) => {
      e.preventDefault();
      const newZoomLevel = this.targetZoom - e.deltaY/1000;
      this.zoomTo(Math.min(maxZoom, Math.max(minZoom, newZoomLevel)));
      this.draw();
    };
    root.addEventListener('keypress', handleKeyPress);
    root.addEventListener('keydown', handleKeyDown);
    root.addEventListener('wheel', handleWheel, {passive: false});
    return () => {
      root.removeEventListener('keypress', handleKeyPress);
      root.removeEventListener('keydown', handleKeyDown);
      root.removeEventListener('wheel', handleWheel);
    }
  }

  zoomTo(newZoom) {
    this.targetZoom = newZoom;
    if (!this.animationActive) {
      this.startZoomMillis = this.p5.millis();
      this.startZoomValue = this.currentZoom;
    }
    this.runAnimationLoop();
  }

  runAnimationLoop() {
    if (this.animationActive) {
      const animProgress = Math.min(1, (this.p5.millis() - this.startZoomMillis) / (0.3 * 1000));
      this.currentZoom = this.startZoomValue + (this.targetZoom - this.startZoomValue) * animProgress;
    }

    this.animationActive = this.targetZoom != this.currentZoom;
  }

    init() {
    const {p5, pattern, config, cache} = this;

    // We use randomness both during generating the config + when
    // drawing; This allows restoring the random state to what it
    // should be post-config creation.
    if (this.seed) {
      initRandomizer(this.seed);
    }

    // Set an initial zoom based on desiredNumber
    this.currentZoom = this.targetZoom = ((config.bufferedNumber ?? 11) / config.desiredNumber);

    // Additional buffers for zoomed-in versions ensure a higher quality rendering for the zoom,
    // as we can replace a scaled version with a more crisp one. This is disabled as there are
    // still some bugs; in addition, the scaled up version is not that bad.
    // Render artifacts that can sometimes appear when scaling down a large buffer too much are
    // also not entirely solved by this, as the inner zoom buffers still need to be scaled down;
    // the buffers are all combined to render the zoom out version. The alternative would be to
    // draw the inner times multiple times on multiple buffers, which would make drawing even slower.
    this.buffers = [
      [1, this.p5.createGraphics(this.size.width * OVERSCALE, this.size.height * OVERSCALE)],   // 1x zoom
      //[2, this.p5.createGraphics(this.size.width * d, this.size.height * d)],   // 2x zoom
      // [3, this.p5.createGraphics(this.size.width * d, this.size.height * d)],   // 3x zoom
    ]
    this.fillPatternOpts = drawPattern(this.buffers, {pattern, config, cache, p5});

    //if (window.DEBUG) { debug("[draw on buffer] done"); }

    this.overlayBuffer = this.p5.createGraphics(this.size.width * OVERSCALE, this.size.height * OVERSCALE);
    drawOverlay(this.overlayBuffer, config, pattern, this.fillPatternOpts);

    //if (window.DEBUG) { debug("[overlay on buffer] done"); }

    // Do the initial draw
    this.draw();
    //if (window.DEBUG) { debug("[initial draw] done"); }
  }

  draw() {
    const {p5, config, buffers} = this;

    // The background
    p5.background(config.colors.background);

    const blip = (buffer, extraZoom?: number) => {
      p5.push();
      // scale from center
      p5.translate(p5.width / 2, p5.height/2);
      p5.scale(this.currentZoom / (extraZoom ?? 1) / OVERSCALE);
      p5.translate(-buffer.width / 2, -buffer.height / 2);

      // XXX it might be possible to scale it here for performance?
      p5.image(buffer, 0, 0);
      p5.pop();
    }

    for (const [z, b] of this.buffers) {
      blip(b, z);
    }

    // The tiling
    if (config.drawTiles) {
      blip(this.overlayBuffer, 1);
    }

    // The frame
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
      const leftDistance = this.config.frame == 'full' ? frameWidth : 15;
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

  drawFrame() {
    const {p5, config} = this;

    p5.noStroke();
    p5.fill(config.colors.background);

    const paddingPct = 0.05;

    const h = Math.max(0, paddingPct * p5.height);
    const w = Math.max(0, paddingPct * p5.width);
    const s = Math.min(h, w);

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