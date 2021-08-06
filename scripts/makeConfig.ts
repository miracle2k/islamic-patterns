import {
  ColorScheme,
  Config,
  FillConfig,
  FillLogicOption,
  FillPattern,
  LineConfig,
  LineStyle, TemplateNames
} from "./types";
import {initRandomizer, percpick, rand, randint, random, randpick} from "./utils/random";


const BLACK = '#2a2a2a';
const OVERLAY_ON_BLACK = '#ddd';
const BEIGE = '#f5f2e3';
const OVERLAY_ON_BEIGE = '#999';


export const ColorSchemes: {[name: string]: ColorScheme} = {
  blackOnBeige: {
    background: BEIGE,
    foreground: BLACK,
    overlay: OVERLAY_ON_BEIGE,
    shadow: BLACK,
  },
  orangeOnBeige: {
    background: BEIGE,
    foreground: '#e26d5a',
    overlay: OVERLAY_ON_BEIGE,
    shadow: BLACK,
  },
  greenOnBeige: {
    background: BEIGE,
    foreground: '#386641',
    overlay: OVERLAY_ON_BEIGE,
    shadow: BLACK,
  },
  blueOnBeige: {
    background: BEIGE,
    foreground: '#0353a4',
    overlay: OVERLAY_ON_BEIGE,
    shadow: BLACK,
  },
  purpleOnBeige: {
    background: BEIGE,
    foreground: '#754db6', // #6603A4
    overlay: OVERLAY_ON_BEIGE,
    shadow: BLACK,
  },
  beigeOnBlack: {
    background: BLACK,
    foreground: BEIGE,
    overlay: OVERLAY_ON_BLACK,
    shadow: BLACK,
  },
  yellowOnBlack: {
    background: BLACK,
    foreground: '#ffd400',
    overlay: OVERLAY_ON_BLACK,
    shadow: BLACK,
  },
  pinkOnBlack: {
    background: BLACK,
    foreground: '#fdc5f5',
    overlay: OVERLAY_ON_BLACK,
    shadow: BLACK,
  },
}


export function getRandomPattern(): TemplateNames {
  return percpick([
    1.2, 'kharraqan',        // ~ 1.5
    3, 'cordoba',            // ~ 3
    3, 'capella-palatina',   // ~ 3
    1, 'ibn-tulun',          // = 1
    3.5, 'al-samad',         // ~ 3.5
    4.5, 'template-square',  // ~ 1.5 (+2) and ~ 4 (+1),
    9, 'template-hexagon' // ~ 4 (+2) and ~ 5 (+1),
  ]);
}


const colorSelection = [
  0.04, 'beigeOnBlack',
  0.02, 'yellowOnBlack',
  0.02, 'pinkOnBlack',

  0.4, 'blackOnBeige',
  0.135, 'orangeOnBeige',
  0.135, 'greenOnBeige',
  0.135, 'blueOnBeige',
  0.135, 'purpleOnBeige',
]

export const LineStyles = ['solid', 'dashed', 'dotted', 'dashed', 'double-dotted']


export function makeConfig(seed?: number): Config {
  initRandomizer(seed);
  const patternName = getRandomPattern();

  let roughMode = randpick([0.5, 'on', 'off']);

  // const possibleFills = ['infinite', 'pattern'];
  // if (patternName == 'one') {
  //   possibleFills.push('solid')
  // }

  const fills = [];
  for (let idx=0; idx < randpick([0.15, 3, 0.3, 2, 1]); idx++) {
    let fillChoices = [
      3, 'dots',
      3, 'lines',
      2, 'infinite',
      1, 'solid',
      idx == 0 ? 0.1 : 0.3 * idx, 'none',
    ];
    if (roughMode != 'on') {
      fillChoices.push.apply(fillChoices, [
        2, 'crosses',
        2, 'waves',
      ]);
    }
    const patternKind = percpick(fillChoices) as FillPattern;

    let patternScale, patternGap;
    if (patternKind == 'dots') {
      if (roughMode == 'on') {
        patternScale = random(1.3, 1.8);
        patternGap = random(1, 2.9 - patternScale);
      }
      else {
        patternScale = random(0.3, 1.2);
        patternGap = random(1, 2.9 - patternScale);
      }
    }
    else if (patternKind == 'hearts') {
      patternScale = random(0.7, 1.5);
      patternGap = random(1, 2.9 - patternScale);
    }
    else if (patternKind == 'crosses') {
      patternScale = random(0.15, 0.6); // center around 0.45
      patternGap = random(2, 7 - patternScale * 4);
    }
    else if (patternKind == 'lines') {
      patternScale = random(0.15, 0.5);
      patternGap = random(2, 6);
    }
    else {
      patternScale = random(0.15, 0.5);
      patternGap = random(2, 3);
    }

    // XXX make this different (so we do not influence rough mode selection)
    if (patternKind == 'crosses' || patternKind == 'waves') {
      roughMode = 'off';
    }

    let fillMargin;
    // Bigger dots do not work unless they attach directly to the border
    if (patternKind == 'dots' && patternScale > 0.6) {
      fillMargin = 0;
    }
    // Similar with waves
    else if (patternKind == 'waves' && patternScale > 0.2) {
      fillMargin = 0;
    }
    else if (patternKind == 'hearts') {
      fillMargin = 0;
    }
    else if (patternKind == 'solid') {
      fillMargin = random(0.5, 0.9);
    }
    else if (patternKind == 'crosses' && patternScale > 0.3) {
      fillMargin = 0;
    }
    else {
      if (random(0, 1) < 0.5) {
        fillMargin = 0;
      }
      else {
        fillMargin = random(0.1, 0.8 - (patternScale/1.3));
      }
    }

    const fillConfig = {
      // todo: change only the angles, per quadrant
      patternKind,
      patternScale,
      patternGap,
      patternAngle: random(0, 360),
      infiniteStrokeWeight: 0.2,
      infiniteDensity: random(0.1, 0.9),
      roughSolidDensity: randint(0.1, 0.5),
      margin: fillMargin
    };
    fills.push(fillConfig);
  }

  const hasBigDotsFill = !!fills.filter(f => f.patternKind == 'dots' && f.patternScale > 0.7).length;
  const onlyNoneFill = fills.length == 1 && fills[0].patternKind == 'none';
  const onlySolidFill = fills.length == 1 && fills[0].patternKind == 'solid';
  const hasSmallFillMargin = !!fills.filter(f => f.fillMargin < 0.1).length;

  let fillLogic;
  if (onlySolidFill) {
    fillLogic = ['rows', 'cols', 'diag'][randint(0, 2)] as FillLogicOption;
  } else {
    fillLogic = ['random', 'rows', 'cols', 'diag'][randint(0, 3)] as FillLogicOption;
  }

  ////////////////////////
  // Pattern Line Style

  const lineShadow = roughMode == 'off' ? rand() < 0.1 : false;

  const patternAngle = rand();
  // The +2 set has a lot less variety.
  const generatedPatternMode = randpick([0.75, '+1', '+2']);

  let centerLine: LineConfig;
  let expandedBorderLeft, expandedBorderRight;
  let lineFill: FillConfig|undefined;

  let minExpandedLineWidth = 0.7;
  let useExpandedLine;
  if ((hasBigDotsFill) && patternName != 'capella-palatina') {
    useExpandedLine = true;
  } else if (onlyNoneFill) {
    useExpandedLine = true;
    minExpandedLineWidth = 1.8;
  }
  else {
    useExpandedLine =  random(0, 1) < 0.7;
  }

  let maxExpandedLineWidth;
  if (patternName == 'capella-palatina') {
    maxExpandedLineWidth = 9;
  } else if (patternName == 'template-hexagon' && patternAngle < 0.3) {
    maxExpandedLineWidth = 3;
  } else if (patternName == 'template-hexagon' && generatedPatternMode == '+2') {
    maxExpandedLineWidth = 3 - (1 - patternAngle);
  } else if (patternName == 'template-square' && generatedPatternMode == '+2') {
    maxExpandedLineWidth = 2.5 - (1 - patternAngle);
  } else {
    maxExpandedLineWidth = 5;
  }
  const expandedStrokeWidth = random(minExpandedLineWidth, maxExpandedLineWidth);

  ////////////////////////
  // Center Line Style

  {
    const centerLineStyle = randpick([
      0.2, 'dashed',
      0.3, 'solid',
      0.4, 'dotted',
      0.1, 'none'
    ]) as LineStyle;
    let centerLineWidth;
    if (!useExpandedLine) {
      if (centerLineStyle == 'solid' || centerLineStyle == 'dashed') {
        centerLineWidth = 0.5;   // Single center lines should have a fixed width.
      }
      if (centerLineStyle == 'dotted') {
        // Smaller dots make no sense if the line has to carry the pattern
        centerLineWidth = random(0.6, 1);
      }
    }
    else {
      // In rough mode, a solid center line within an expanded line doesn't look that great if very thin
      if (roughMode == 'on') {
        centerLineWidth = random(0.3, 0.5);
      }
      // Within an expanded line, allow a wide variety from very thing to very thick
      else {
        centerLineWidth = random(0.1, centerLineStyle == 'dotted' ? 1 : 0.8);
      }
    }

    let centerLineDotDensity;
    if (hasSmallFillMargin && !useExpandedLine) {
      centerLineDotDensity = 0.8;
    }
    else if (!useExpandedLine) {
      centerLineDotDensity = random(0.5, 0.8)
    } else {
      if (roughMode == 'on') {
        // In rough mode, we don't really want very dense dots (they would become a line anway)
        centerLineDotDensity = random(0.1, 0.6)
      } else {
        centerLineDotDensity = random(0.1, 0.9)
      }
    }

    let centerLineDashConfig;
    if (rand() < 0.2) {
      centerLineDashConfig = 'random';
    } else {
      centerLineDashConfig = [randint(2, 6), randint(2, 6)];
    }

    centerLine = {
      show: (useExpandedLine && expandedStrokeWidth < 0.8) ? false : true,
      style: centerLineStyle,
      width: centerLineWidth,
      dotDensity: centerLineDotDensity,
      dashConfig: centerLineDashConfig,
      shadow: lineShadow
    };
  }

  ////////////////////////
  // Expanded line

  if (!useExpandedLine) {
    expandedBorderLeft = {};
    expandedBorderRight = {};
  }
  else {
    expandedBorderLeft = expandedBorderRight = {
      show: true,
      style: 'solid',  // xxx try different ones
      width: 0.5,
      shadow: lineShadow
    };
    lineFill = {
      patternKind: 'none'
    };
  }

  ////////////////////////
  // Final Assembly

  const colors = ColorSchemes[percpick(colorSelection)];

  let desiredNumber = randpick([
    0.7, 6.5,
    0.22, 4.7,
    9.5
  ])
  // This pattern has sa lot of details, so it always looks much smaller.
  if (patternName == 'cordoba') {
    desiredNumber *= 0.7;
  }
  if (patternName == 'kharraqan') {
    desiredNumber *= 0.8;
  }
  if (patternName == 'al-samad') {
    desiredNumber *= 0.8;
  }

  return {
    animate: false,
    rough: {
      mode: roughMode,
      roughness: 1
    },
    frame: randpick([0.12, 'letterbox', 0.2, 'none', 'full']),
    desiredNumber,
    colors,

    pattern: {
      name: patternName,
      expandedStrokeWidth: expandedStrokeWidth,
      angle: patternAngle,
      mode: generatedPatternMode,
      interlacing: randpick([0.50, 'default', 'off']),
      shapeSet: rand()
    },

    drawTiles: false,
    showSplitLine: random(0, 1) > 0.5,
    fills,
    fillLogic,
    centerLine,
    expandedLineLeftStroke: expandedBorderLeft,
    expandedLineRightStroke: expandedBorderRight,
    expandedLineFill: lineFill
  };
}
