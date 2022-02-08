import {BEIGE, BLACK, makeConfig} from "./scripts/makeConfig";
import {mapValueInt} from "./scripts/utils/math";

/**
 * Calculate features for the given token data.
 *
 * $ npx parcel build --target features
 * $ prettier -w dist/featureScript.js
 *
 * - pass (mod) into the global function
 * - write a script like this:

 function calculateFeatures(tokenData) {
  var mod = {};
  __export_code(mod);
  return mod.calculateFeatures(tokenData);
}

 */
export function calculateFeatures(tokenData: {
  tokenId: string,
  hash: string
}) {
  let seed = parseInt(tokenData.hash.substr(-7), 16)
  const config = makeConfig(seed);

  // Paper color
  let paperColor;
  if (config.colors.background == BLACK) {
    paperColor = 'Dark'
  } else if (config.colors.background == BEIGE) {
    paperColor = 'Light'
  }
  else {
    throw new Error("Unexpected paper color")
  }

  // Pen color
  let penColor = {
    [BLACK]: 'Black',
    '#e26d5a': 'Orange',
    '#386641': 'Green',
    '#0353a4': 'Blue',
    '#754db6': 'Purple',
    [BEIGE]: 'Beige',
    '#ffd400': 'Yellow',
    '#fdc5f5': 'Pink',
  }[config.colors.foreground];
  if (!penColor) {
    throw new Error("Unexpected pen color: " + config.colors.foreground)
  }

  const templateNames = {
    'kharraqan': 'Kharraqan',
    'cordoba': 'Cordoba',
    'al-samad': 'Abd al-Samad',
    'ibn-tulun': 'Ibn Tulun',
    'capella-palatina': 'Capella Palatina',
  }
  const templatesWithInterlacing = ['template-hexagon', 'template-square', 'kharraqan', 'capella-palatina'];
  const templateFillPatternCount = {
    'kharraqan': 6,
    'cordoba': 10,
    'al-samad': 7,
    'ibn-tulun': 9,
    'capella-palatina': 5,
  }

  let patternName;
  let fillPatternCount;
  if (config.pattern.name in templateNames) {
    patternName = templateNames[config.pattern.name];
    fillPatternCount = templateFillPatternCount[config.pattern.name];
  }
  else {
    const edgeDesc = config.pattern.mode == '+1' ? '1 edge' : '2 edges';
    if (config.pattern.name == 'template-square') {
      patternName = `Squares in Contact (${edgeDesc})`;
      fillPatternCount = config.pattern.mode == '+1' ? 6 : 6;
    }
    if (config.pattern.name == 'template-hexagon') {
      patternName = `Hexagons in Contact (${edgeDesc})`;
      fillPatternCount = config.pattern.mode == '+1' ? 4 : 7;
    }
  }

  const fillAll = mapValueInt(
      config.pattern.fillPatternIdx ?? 0,
      0, 1, -1, (fillPatternCount ?? 0) -1
  ) == -1;

  const FillsMapping = {
    'dots': 'Dots',
    'lines': 'Lines',
    'dashed-lines': 'Dashed Lines',
    'waves': 'Waves',
    'crosses': 'Crosses',
    'infinite': 'Infinite',
    'solid': 'Solid',
    'none': 'Empty',
  }

  let singleFillProperty;
  if (config.fills.length > 1 && !fillAll) {
    singleFillProperty = 'Multiple';
  } else {
    singleFillProperty = FillsMapping[config.fills[0].patternKind];
  }

  let firstFillProperty = FillsMapping[config.fills[0].patternKind];
  let secondFillProperty;
  if (fillAll) {
    secondFillProperty = 'Same as Primary';
  }
  else if (config.fills.length == 1 || config.fills[1].patternKind == 'none') {
    secondFillProperty = 'Empty';
  }
  else  {
    secondFillProperty = FillsMapping[config.fills[1].patternKind];
  }

  let hasExpandedLine = (config.pattern.expandedStrokeWidth ?? 0) > 0 && (
      config.expandedLineLeftStroke?.show
  );

  let hasRandomAngles = false;
  for (const f of config.fills) {
    if (f.patternAngle == 'random' && f.patternKind != 'solid' && f.patternKind != 'none'
        && f.patternKind != 'infinite' && f.patternKind != 'dots') {
      hasRandomAngles = true;
    }
  }

  let isStrokeless = false;
  if (
      (!config.centerLine?.show || config.centerLine?.style == 'none') &&
      (!config.expandedLineLeftStroke?.show || config.expandedLineLeftStroke?.style == 'none')
  ) {
    isStrokeless = true;
  }

  let hasInterlacing = (config.pattern.interlacing == 'default' && templatesWithInterlacing.indexOf(config.pattern.name) > -1);
  if (!hasExpandedLine) {
    hasInterlacing = false;
  }

  //console.log(JSON.stringify(config, null, 4), fillAll)

  return {
    'Archetype': config.rough.mode == 'on' ? 'Tipsy' : 'Sober',
    'Frame': config.frame == 'full' ? 'Full' : config.frame == 'letterbox' ? "Letterbox" : "None",
    'Paper Color': paperColor,
    'Pen Color': penColor,
    'Pattern': patternName,

    'Interlacing': hasInterlacing ? 'Yes' : 'No',
    'Expanded Stroke': hasExpandedLine ? 'Yes' : 'No',
    //'Fill': singleFillProperty,
    'Primary Fill': firstFillProperty,
    'Secondary Fill': secondFillProperty,

    'Random Angles': hasRandomAngles ? 'Yes' : 'No',
    'Strokeless': isStrokeless ? 'Yes' : 'No',
  }
}

// console.log(calculateFeatures({
//   hash: "0x20f87bc9cfd581f984459115f69fefac6e22bd5f518cf5e947b3a62a46db3b0c",
//   tokenId: '1'
// }));