import {Pattern, SimpleGroup} from "../types";
import {makeLinesFromShapes, TileEdges100Square} from "./utils";

export function makeCapellaPalatina(angle?: number): Pattern {
  // From 20 to 45, with the proper one being 35.3553390503
  const B = 20 + angle * 25;
  const A = 100 - B;

  const shapes: SimpleGroup[] = [
    [
      [50, 0],
      [A, 14.64466],
      [85.355339, 14.64466],
      [85.355339, B],
      [100, 50],
      [85.355339, A],
      [85.355339, 85.355339],
      [A, 85.355339],
      [50, 100],
      [B, 85.355339],
      [14.644660, 85.3553],
      [14.64466, A],
      [0, 50],
      [14.64466, B],
      [14.644660, 14.64466],
      [B, 14.64466]
    ],
  ];
  return {
    label: {
      title: 'Capella Palatina',
      location: 'Palermo, Sicily, Italy (AD 1132, AH 526)'
    },
    tilingMode: 'square',
    tileSize: [100, 100],
    tileEdges: TileEdges100Square,
    shapes,
    lines: makeLinesFromShapes(shapes),
    interlacingConfig: [
      [0, 8, 0, -1, 3, 5],
      [4, 12, 1, 0, 3, 5]
    ]
  }
}