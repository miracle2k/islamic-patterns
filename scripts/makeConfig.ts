import {
  ColorScheme,
  Config,
  FillConfig,
  FillPattern,
  LineConfig,
  LineStyle, TemplateNames
} from "./types";
import {initRandomizer, percpick, rand, randint, random} from "./utils/random";


export const BLACK = '#2a2a2a';
export const OVERLAY_ON_BLACK = '#ddd';
export const BEIGE = '#f5f2e3';
export const OVERLAY_ON_BEIGE = '#999';


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
    foreground: '#754db6',
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
    1.8, 'ibn-tulun',        // = 2
    3.5, 'al-samad',         // ~ 3.5
    3, 'template-square',  // ~ 1.5 (+2) and ~ 2 (+1),
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


function getDashConfig(): LineConfig['dashConfig'] {
  if (rand() < 0.2) {
    return 'random';
  } else {
    return [randint(2, 6), randint(2, 6)];
  }
}


export function makeConfig(seed: number): Config {
  //console.log('[make config with seed]', seed)

  initRandomizer(seed);
  const patternName = getRandomPattern();

  let allowDashedLines = true;
  let roughMode = percpick([0.5, 'on', 0.5, 'off']);

  const fills: FillConfig[] = [];
  // Note: There are already some cases where it looks like an empty fills, because the pattern angle
  // makes the shapes to be filled very small.
  for (let idx=0; idx < percpick([0.02, 0, 0.7, 1, 0.3, 2]); idx++) {
    let fillChoices = [
      2.5, 'dots',
      3, 'lines',
      1.5, 'dashed-lines',
      2, 'infinite',
      1, 'solid',
    ];
    if (roughMode == 'off') {
      fillChoices.push.apply(fillChoices, [
        2, 'crosses',
        2, 'waves',
      ]);
    }
    const patternKind = percpick(fillChoices) as FillPattern;

    let patternScale, patternGap, patternIsTiny;
    if (patternKind == 'dots') {
      if (roughMode == 'on') {
        patternScale = random(1.3, 1.8);
        patternGap = random(1, 2.9 - patternScale);
        patternIsTiny = patternGap < 1.5 && patternScale < 1.5;
      }
      else {
        patternScale = random(0.6, 1.2);
        patternGap = random(1, 2.5 - patternScale);
        patternIsTiny = patternGap < 1.7 && patternScale < 0.8;
      }
    }
    else if (patternKind == 'crosses') {
      patternScale = random(0.15, 0.6); // center around 0.45
      patternGap = random(2, 7 - patternScale * 4);
      patternIsTiny = patternGap < 2.7 && patternScale < 0.30;
    }
    else if (patternKind == 'lines') {
      patternScale = random(0.5, 1);
      patternGap = random(1, 5);
      patternIsTiny = patternGap < 2.4 && patternScale < 0.7;
    }
    else {
      patternScale = random(0.15, 0.5);
      patternGap = random(2, 3);
      patternIsTiny = patternGap < 2.2 && patternScale < 0.25;
    }

    let fillMargin;
    // Bigger dots do not work unless they attach directly to the border
    // if (patternKind == 'dots' && patternScale > 0.6) {
    //   fillMargin = 0;
    // }
    // Similar with waves
    if (patternKind == 'waves' && patternScale > 0.2) {
      fillMargin = 0;
    }
    else if (patternKind == 'solid') {
      fillMargin = random(0.5, 0.9);
    }
    else if (patternKind == 'crosses' && patternScale > 0.3) {
      fillMargin = 0;
    }
    else {
      if (rand() < 0.5) {
        fillMargin = 0;
      }
      else {
        fillMargin = random(0.1, 0.8 - (patternScale/1.3));
      }
    }

    const fillConfig: FillConfig = {
      patternKind,
      patternScale,
      patternGap,
      patternIsTiny,
      patternAngle: rand() < 0.13 ? 'random' : rand(),
      infiniteStrokeWeight: 0.2,
      infiniteAlignment: percpick([3, 0, 1, 1, 1, 2]),
      infiniteDensity: random(0.1, 0.9),
      roughSolidDensity: random(0.1, 0.5),
      margin: fillMargin
    };
    fills.push(fillConfig);
  }

  const hasOnlySolidFill = !fills.filter(f => f.patternKind != "solid").length && fills.length > 0
  const hasSmallFillMargin = !!fills.filter(f => f.margin < 0.2).length;
  const hasProblematicFill = !!fills.filter(f => {
    // A fill that would make the pattern lines hard to see, possibly
    if (f.margin > 0.2) { return false; }
    if (f.patternKind == 'infinite') { return false; }
    return !f.patternIsTiny;

  }).length;


  ////////////////////////
  // Pattern Line Style

  const lineShadow = false; //roughMode == 'off' ? rand() < 0.1 : false;

  const patternAngleModifier = rand();
  // The +2 set has a lot less variety.
  const generatedPatternMode = percpick([0.75, '+1', 0.25, '+2']);

  let centerLine: LineConfig;
  let expandedBorderLeft: LineConfig|undefined, expandedBorderRight: LineConfig|undefined;
  let lineFill: FillConfig|undefined;

  let minExpandedLineWidth = 0.7;
  let useExpandedLine;
  if (fills.length <= 0) {
    // If no fills are used, we at least need an expanded line for decoration, for sure
    useExpandedLine = true;
    minExpandedLineWidth = 3;
  }
  else {
    useExpandedLine =  rand() < 0.85;
  }

  let maxExpandedLineWidth;
  if (patternName == 'capella-palatina') {
    maxExpandedLineWidth = 9;
  } else if (patternName == 'template-hexagon' && patternAngleModifier < 0.3) {
    maxExpandedLineWidth = 6;
  } else if (patternName == 'template-hexagon' && generatedPatternMode == '+2') {
    maxExpandedLineWidth = 6 - (1 - patternAngleModifier);
  } else if (patternName == 'template-square' && generatedPatternMode == '+2') {
    maxExpandedLineWidth = 5 - (1 - patternAngleModifier);
  } else if (patternName == 'template-square' && generatedPatternMode == '+1') {
    maxExpandedLineWidth = 5 - (1 - patternAngleModifier);
  } else {
    maxExpandedLineWidth = 5;
  }

  // There are a number of cases where the lines of the pattern become unclear, and it is
  // combination of these factors:
  // - patterns too large
  // - all shape are patterned with the same, or similar pattern (except infinite)
  // - no margin on the shapes, or using a dotted/dashed expanded line
  // - usually the case in rough mode
  // - the expanded line is very thin
  //
  // The fix is changing one or multiple of these factors, in particular:
  // - not using dashed/dotted lines
  // - using a margin
  //
  // A smart way to handle this too would be to test whether the pattern fills all shapes,
  // but to some extend we can see the effect even when only some shapes are filled; and also,
  // due to the way we are setup, we do not know what the fill will be.
  if (hasSmallFillMargin && hasProblematicFill) {
    //console.log('apply fix!')

    // in all cases
    allowDashedLines = false; // fix 1

    // in clean mode, we'd want at least to have an expanded line
    if (roughMode == 'off') {
      useExpandedLine = true;
    }

    if (roughMode == 'on') {
      minExpandedLineWidth = 3; // fix 2
      // fix 3
      fills.forEach(fill => {
        fill.margin = Math.max(0.15, fill.margin);
      })
    }
  }

  // Note: this is used, effectively as a margin, even if the actual lines are not drawn.
  let expandedStrokeWidth = random(minExpandedLineWidth, maxExpandedLineWidth);

  ////////////////////////
  // Expanded line

  let expandedOpts = [
    allowDashedLines ? 0.2 : 0, 'dashed',
    0.3, 'solid',
    allowDashedLines ? 0.4 : 0, 'dotted'
  ];

  // if (centerLine?.style != 'solid') {
  //   // two solid lines are allowed, but nothing else
  //   opts.splice(opts.indexOf(centerLine?.style) - 1, 2);
  // }
  const expandedLineStyle = percpick(expandedOpts) as LineStyle;

  {
    expandedBorderLeft = expandedBorderRight = {
      show: useExpandedLine,
      style: expandedLineStyle,
      width: 0.5,
      shadow: lineShadow,
      dashConfig: getDashConfig()
    };
    lineFill = {
      patternKind: 'none'
    };
  }

  // If we drew a solid fat line, then we can allow dashes for the center line!
  if (expandedBorderLeft?.show && expandedBorderLeft?.style != "none") {
    allowDashedLines = true;
  }

  ////////////////////////
  // Center Line Style

  let centerLineStyle = percpick([
    allowDashedLines ? 0.2 : 0, 'dashed',
    0.3, 'solid',
    allowDashedLines ? 0.4 : 0, 'dotted',
    // Increase the chance of 2x 'none' (center line and expanded line) - a special effect
    fills.length <= 0 ? 0 : (!useExpandedLine ? 0.2 : 0.1), 'none'
  ]) as LineStyle;

  {
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
      // We need this to have a certain minimum density to be effective then.
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

    // This doesn't look good if the lines or very thin, because solid is so overbearing in non-rough mode.
    if (roughMode == 'off' && hasOnlySolidFill) {
      centerLineWidth = 1;
      centerLineStyle = 'solid';
    }

    let centerLineDashConfig = getDashConfig();
    centerLine = {
      // hide it if the expanded line is extremely thin.
      show: (!(useExpandedLine && expandedStrokeWidth < 0.8)),
      style: centerLineStyle,
      width: centerLineWidth,
      dotDensity: centerLineDotDensity,
      dashConfig: centerLineDashConfig,
      shadow: lineShadow
    };
  }

  // If randomness decided that we draw neither a center line, nor an expanded one, then
  // we have to enforce some rules: the fill pattern needs to be w/o margin, and we need to
  // fill *everything*, so either we need a secondary fill, or we need our fill pattern to be "ALL".
  const noLines = (centerLineStyle == 'none' || !centerLine.show) &&
      (expandedLineStyle == 'none' || !expandedBorderLeft.show);

  let fillPatternIdx = rand();

  // If no lines, we have to fill all shapes; if no secondary fill, then make the pattern "ALL".
  if (noLines && (fills.length < 2)) {
    fillPatternIdx = 0;  // 0 will resolve to -1 when drawing indicating "fill all shapes"
  }
  // If no lines at all, a large expanded stroke is risky; keep it down a bit.
  if (noLines) {
    expandedStrokeWidth = Math.min(expandedStrokeWidth, 3)
  }

  // Special case form some fills, if the expanded stroke is large and we do not draw lines;
  // We want to keep the pattern size down
  if (noLines && expandedStrokeWidth > 1.5) {
    fills.forEach(fill => {
      if (fill.patternKind == 'dots') {
        fill.patternGap = 1;
        fill.patternScale = Math.min(fill.patternScale, 1.4);
      }
      if (fill.patternKind == 'lines' || fill.patternKind == 'dashed-lines') {
        fill.patternGap = Math.min(3, fill.patternGap);
        fill.patternScale = Math.min(fill.patternScale, 1.4);
      }
    })
  }
  // When no lines, than we cannot tolerate a margin.
  if (noLines) {
    fills.forEach(fill => {
      fill.margin = 0;
    })
  }

  ////////////////////////
  // Final Assembly

  const colors = ColorSchemes[percpick(colorSelection)];

  let adjustZooom = patternName == 'template-hexagon' || patternName == 'template-square'
      || patternName == 'capella-palatina';
  let desiredNumber = percpick([
    1, (adjustZooom) ? 7 : 5
  ])

  return {
    rough: {
      mode: roughMode,
      roughness: 1
    },
    frame: percpick([0.12, 'letterbox', 0.2, 'none', 0.68, 'full']),
    desiredNumber,
    // How many tiles to render for the buffer; this is essentially the max zoom out view.
    // Careful, higher numbers very quickly become very expensive to draw.
    // NOTE: Changing this messes w/ our alignments!
    bufferedNumber: adjustZooom ? 15 : 11,
    colors,

    pattern: {
      name: patternName,
      expandedStrokeWidth,
      angle: patternAngleModifier,
      mode: generatedPatternMode,
      interlacing: percpick([0.50, 'default', 0.5, 'off']),
      fillPatternIdx,
    },

    drawTiles: false,
    fills,
    centerLine,
    expandedLineLeftStroke: expandedBorderLeft,
    expandedLineRightStroke: expandedBorderRight,
    expandedLineFill: lineFill
  };
}
