import {Depth} from "./patterns/makeGeneratedPattern";

export type SimplePoint = [number, number];
export type SimpleLine = [SimplePoint, SimplePoint];
export type SimpleGroup = SimplePoint[];

export type TesselationInfo = {x: number, y: number};
export type TilingMode = 'square'|'hex'|'hex2';

export type FillPatternStructure = (number[]|true)[][];
export type FillPatternOpts = {shiftX?: number, shiftY?: number};
export type FillPatternDefinition = FillPatternStructure|[FillPatternStructure, FillPatternOpts]


export function isFillPatternDefinition(d: FillPatternDefinition): d is FillPatternStructure {
  return !(d.length == 2 && typeof d[1] == 'object' && !Array.isArray(d[1]));

}

export type Pattern = {
  label?: {
    title: string,
    location: string,
  }
  // This controls tesselation
  tilingMode: TilingMode,
  tileSize: SimplePoint,

  // The shape of the construction tile - only used for drawing the tile
  tileEdges?: SimpleLine[],

  // The actual lines of the pattern
  lines: SimpleLine[],
  expandedLines?: SimpleGroup[],

  // targetLine, changeLine, mx, my, targetPointFirst, changePointSecond, doExtraY, doReverse
  interlacingConfig?: [number, number, number, number, number, number, number?, boolean?][],

  shapes: SimpleGroup[],
  externalShapes?: SimpleGroup[]
  fillPatterns?: FillPatternDefinition[]
}

enum InterlacingMode {
  off = 'off',
  default = 'default'
}

export type TemplateNames = 'template-square'|'template-hexagon'|'cordoba'|'capella-palatina'|'kharraqan'|'ibn-tulun'|'al-samad';

export type PatternConfig = {
  name: TemplateNames,
  mode: Depth,
  // A number between 0 and 1, within the range allowed by the template.
  angle: number,
  expandedStrokeWidth?: number,
  interlacing?: InterlacingMode,
  fillPatternIdx?: number,
}

export type ColorScheme = {
  foreground: string,
  background: string,
  overlay: string,
  shadow: string,
};

export type LineStyle = 'solid'|'dashed'|'dotted'|'double-dotted'|'none';

export type LineConfig = {
  show: boolean,
  style: LineStyle,

  dotDensity?: number,
  dashConfig?: [number, number]|'random',

  shadow?: boolean,
  width?: number,

  noEndDots?: boolean
}

export const FillPatterns = ['dots', 'lines', 'dashed-lines', 'waves', 'crosses', 'infinite', 'solid', 'none'] as const;
export type FillPattern = typeof FillPatterns[number];


export type FillConfig = {
  patternKind?: FillPattern,
  patternAngle?: number|'random',
  patternScale?: number,
  patternGap?: number,
  patternIsTiny?: boolean,

  infiniteStrokeWeight?: number,
  infiniteDensity?: number,
  infiniteAlignment?: number,
  roughSolidDensity?: number,
  infiniteStrokeWeightMode?: "same"|"dropoff",

  margin?: number
}

export type FrameType = 'letterbox'|'full'|'none';


export type RoughMode = 'on'|'off';
export type RoughConfig = {
  mode?: RoughMode,
  roughness?: number,
  bowing?: number,
  maxOffset?: number,
}


export type Config = {
  rough?: RoughConfig,

  frame: FrameType,

  // Which pattern to use
  pattern: PatternConfig,

  // How often to repeat the pattern in the  standard view
  bufferedNumber: number,
  desiredNumber: number,
  // the color scheme to use
  colors: ColorScheme,
  // Draw underlying tiles?
  drawTiles?: boolean,

  fills: FillConfig[],
  expandedLineFill?: FillConfig,

  centerLine?: LineConfig,
  expandedLineLeftStroke?: LineConfig,
  expandedLineRightStroke?: LineConfig
}
