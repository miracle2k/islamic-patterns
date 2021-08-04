// Make a random line config
import {Config, FillPatterns, LineConfig, TemplateNames} from "./types";
import {rand, randint, random, randpick} from "./utils/random";
import {ColorSchemes, getRandomPattern, LineStyles} from "./makeConfig";


function generateLineConfig(): LineConfig {
  return {
    show: true,
    style: LineStyles[randint(0, LineStyles.length - 1)] as any,
    dotDensity: 1,

    shadow: false,
    width: 0.4
  }
}

// Decide how to render the infinite lines making up the pattern
function generateLinesDecoration(): Partial<Config> {
  const mode = randint(1, 2)

  // We can either do a simple center line
  if (mode == 1) {
    return {
      centerLine: generateLineConfig()
    }
  }

  if (mode == 2) {
    const lf = generateLineConfig();

    const result: Partial<Config> = {
      expandedLineLeftStroke: lf,
      expandedLineRightStroke: lf,
    }

    const dec = randint(0, 2);

    // A center line fill
    if (dec == 0) {
      if (randint(0, 1)) {
        result.centerLine = lf;
      } else {
        result.centerLine = generateLineConfig();
      }
    }

    // A solid fill
    else if (dec == 1) {
      result.expandedLineFill = {}
    } else if (dec == 2) {
      result.expandedLineFill = {
        patternKind: FillPatterns[randint(0, FillPatterns.length - 1)],
      }
    }

    return result;
  }

  if (mode == 3) {
  }
}

type DecorationKind = 'pattern-fill-only' | 'lines-only' | 'pattern-and-lines';


export function makeRandomConfig(): Config {
  let decorationKind: DecorationKind = 'lines-only';

  let decoration: Partial<Config>;
  if (decorationKind == 'lines-only') {
    decoration = generateLinesDecoration();
  }

  return {
    animate: false,

    frame: randpick([0.12, 'letterbox', 0.8, 'none', 'full']),

    desiredNumber: random(1, 8), // 8 is a good max, 2 is a good value (for a 500x500)
    colors: Object.values(ColorSchemes)[randint(0, Object.values(ColorSchemes).length - 1)],
    pattern: {
      name: getRandomPattern(),
      expandedStrokeWidth: random(0.7, 2.6),
      angle: rand()
    },

    drawTiles: false,

    // TODO: Vary the fills, or leave some empty.
    // TODO: Either fix angle + patterns, or randomize them for each!
    fills: [
      {
        patternKind: FillPatterns[randint(0, FillPatterns.length - 1)],
        patternScale: random(0.2, 0.8),
        patternAngle: random(0, 360)
      }
    ],

    ...decoration as any
  }
}