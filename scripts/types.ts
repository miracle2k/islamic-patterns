import {Depth} from "./patterns/makeGeneratedPattern";

export type SimplePoint = [number, number];
export type SimpleLine = [SimplePoint, SimplePoint];
export type SimpleGroup = SimplePoint[];

export type TesselationInfo = {x: number, y: number};
export type TilingMode = 'square'|'hex'|'hex2';


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
  shapeSets?: number[][],
  edgeSet?: any,
  externalShapes?: SimpleGroup[]
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
  shapeSet?: number,
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

//  'hearts', 'waves', 'crosses', 'crossHatch'
export const FillPatterns = ['dots', 'lines', 'waves', 'crosses', 'hearts', 'infinite', 'solid', 'none'] as const;
export type FillPattern = typeof FillPatterns[number];


export type FillConfig = {
  patternKind?: FillPattern,
  patternAngle?: number,
  patternScale?: number,
  patternGap?: number,

  infiniteStrokeWeight?: number,
  infiniteDensity?: number,
  roughSolidDensity?: number,
  infiniteStrokeWeightMode?: "same"|"dropoff",

  margin?: number
}

export type FrameType = 'letterbox'|'full'|'none';


export type FillLogicOption = 'random'|'rows'|'cols'|'diag';

export type RoughMode = 'on'|'off'|'split';
export type RoughConfig = {
  mode?: RoughMode,
  roughness?: number,
  bowing?: number,
  maxOffset?: number,
}


export type Config = {
  animate?: boolean,
  rough?: RoughConfig,

  frame: FrameType,

  // Which pattern to use
  pattern: PatternConfig,

  // How often to repeat the pattern.
  desiredNumber: number,
  // the color scheme to use
  colors: ColorScheme,
  // Draw underlying tiles?
  drawTiles?: boolean,
  showSplitLine?: boolean,

  fills: FillConfig[],
  fillLogic?: FillLogicOption,
  expandedLineFill?: FillConfig,

  centerLine?: LineConfig,
  expandedLineLeftStroke?: LineConfig,
  expandedLineRightStroke?: LineConfig
}
