import {generatePattern, GeneratedPatternTemplate, Tiles} from "./patterns/makeGeneratedPattern";
import {Pattern, PatternConfig} from "./types";
import {expandLineStroke} from "./patterns/expandStroke";
import {makeCordoba} from "./patterns/makeCordoba";
import {clone, fromRanges, lineInterpolate} from "./utils/math";
import {makeCapellaPalatina} from "./patterns/makeCapellaPalatina";
import {makeKharraqan} from "./patterns/makeKharraqan";
import {getTilingTranslate} from "./draw/tesselation";
import {makeIbnTulun} from "./patterns/makeIbnTulun";
import {makeAlSamad} from "./patterns/makeAlSamad";


export function makePatternFromConfig(config: PatternConfig): Pattern {
  let pattern: Pattern;
  const fs = {
    'kharraqan': makeKharraqan,
    'cordoba': makeCordoba,
    'al-samad': makeAlSamad,
    'ibn-tulun': makeIbnTulun,
    'capella-palatina': makeCapellaPalatina,
  }
  if (config.name in fs) {
    pattern = fs[config.name](config.angle);
  }
  else {
    let template: GeneratedPatternTemplate;
    if (config.name == 'template-square') {
      template = Tiles.getRectangle();
    } else if (config.name == 'template-hexagon') {
      template = Tiles.getHexagon();
    }
    else {
      throw new Error("invalid template name")
    }

    // what about the shapes in the middle? probably should return them here as well..
    const angle = fromRanges(template.angleRange[config.mode], config.angle);
    pattern = generatePattern(template, angle, config.mode);
  }

  if (config.expandedStrokeWidth) {
    // Generate and attach the expanded linesq
    pattern.expandedLines = pattern.lines.map((line, idx) => {
      const expandedLine = expandLineStroke(line, idx, pattern.lines, config.expandedStrokeWidth, pattern.tileEdges);
      if (!expandedLine) {
        return;
      }
      return expandedLine;
    }).filter(x => !!x);

    // For interlacing, we have to connect some of the expanded lines to the "tessellated" kind.
    let interlacing = false;
    let interlacingConfig;
    if (pattern.interlacingConfig) {
      interlacing = config.interlacing == 'default';
      interlacingConfig = pattern.interlacingConfig;
    }
    else if (config.name == 'template-square' && config.mode == "+1") {
      interlacing = config.interlacing == 'default';
      interlacingConfig = [
        [0, 4, 0, 1, 0, 2],
        [2, 6, 1, 0, 0, 2]
      ]
    }
    else if (config.name == 'template-square' && config.mode == "+2") {
      interlacing = config.interlacing == 'default';
      interlacingConfig = [
        [15, 14, 0, 0, 5, 5, 0, false],
        [15, 14, 0, 0, 3, 3, 0, false],

        [3, 2, 0, 0, 3, 3, 0, false],
        [3, 2, 0, 0, 5, 5, 0, false],

        [7, 6, 0, 0, 3, 3, 0, false],
        [7, 6, 0, 0, 5, 5, 0, false],

        [11, 10, 0, 0, 3, 3, 0, false],
        [11, 10, 0, 0, 5, 5, 0, false],

        [0, 8, 0, 1, 0, 2, 0, true],
        [4, 12, 1, 0, 0, 2, 0, true]
      ]
    }
    else if (config.name == 'template-hexagon' && config.mode == "+1") {
      interlacing = config.interlacing == 'default';
      interlacingConfig = [
        [7, 1, 0, -1, 0, 2],

        // Those two are a 4-intersection pair (others have this as well). Only one of
        // them should be active.
        //[6, 0, -1, 0, 2, 0, 1],
        [5, 11, -1, 0, 0, 2, 1],

        [3, 9, -1, 0, 0, 2, -1],
      ]
    }
    else if (config.name == 'template-hexagon' && config.mode == "+2") {
      interlacing = config.interlacing == 'default';
      interlacingConfig = [
        // [11, 10, 0, 0, 5, 5, 0, false],
        // [11, 10, 0, 0, 3, 3, 0, false],
        // [4, 16, 0, 1, 2, 0],

        [21, 20,     0, 0,      2, 3,    0, false],
        [21, 20,     0, 0,      0, 5,    0, false],
        [17, 16,     0, 0,      2, 3,    0, false],
        [17, 16,     0, 0,      0, 5,    0, false],
        [13, 12,     0, 0,      2, 3,    0, false],
        [13, 12,     0, 0,      0, 5,    0, false],
        [9, 8,     0, 0,      2, 3,    0, false],
        [9, 8,     0, 0,      0, 5,    0, false],
        [5, 4,     0, 0,      2, 3,    0, false],
        [5, 4,     0, 0,      0, 5,    0, false],
        [1, 0,     0, 0,      2, 3,    0, false],
        [1, 0,     0, 0,      0, 5,    0, false],

        [10, 22, -1, 0, 0, 2, 1],
        [6, 18, -1, 0, 0, 2, -1],
        [2, 14, 0, 1, 0, 2, 0],
      ]
    }
    if (interlacing) {
      const [advanceX, advanceY] = getTilingTranslate(pattern.tilingMode, 1, {x: pattern.tileSize[0], y: pattern.tileSize[1]});
      let extraY = 0;
      if (pattern.tilingMode == 'hex') {
        extraY = pattern.tileSize[1]/2;
      }

      // mx => connects at the horz edge
      // my => connects at the vert edge
      for (const [targetLine, changeLine, mx, my, targetPointFirst, changePointSecond, doExtraY, doReverse] of interlacingConfig) {
        let cpoint;

        // [0] to [5] is one side of the line shape.
        // [2] to [3] the other.
        cpoint = clone(pattern.expandedLines[targetLine][targetPointFirst]);
        pattern.expandedLines[changeLine][changePointSecond][1] += 4
        pattern.expandedLines[changeLine][changePointSecond] = [
          cpoint[0] - advanceX * mx,
          cpoint[1] - advanceY * my + extraY * (doExtraY ?? 0)
        ];

        // Do the other side
        if (doReverse !== false) {
          cpoint = clone(pattern.expandedLines[changeLine][targetPointFirst]);
          pattern.expandedLines[targetLine][changePointSecond] = [
            cpoint[0] + advanceX * mx,
            cpoint[1] + advanceY * my - extraY * (doExtraY ?? 0)
          ]
        }
      }

      // For all others change the middle line to not intersect into the neighbouring band
      // that goes on top.
      let toplines = interlacingConfig.flatMap(c => c.slice(0, 1));

      for (let idx=0; idx<pattern.lines.length; idx++) {
        if (toplines.indexOf(idx) > -1) {
          continue;
        }
        pattern.expandedLines[idx][1] = lineInterpolate([pattern.expandedLines[idx][0], pattern.expandedLines[idx][2]], 0.5);
        pattern.expandedLines[idx][4] = lineInterpolate([pattern.expandedLines[idx][3], pattern.expandedLines[idx][5]], 0.5);
      }
    }
  }
  return pattern;
}
