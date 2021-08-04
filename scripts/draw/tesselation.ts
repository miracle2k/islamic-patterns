import {Pattern, TilingMode} from "../types";


export function getTilingTranslate(tilingMode: TilingMode, scale: number, tileSize: {x: number, y: number}) {
  let advanceX;
  let advanceY;
  if (tilingMode == 'hex') {
    advanceX = (tileSize.x - (12.5 * scale));
    advanceY = tileSize.y;
  }
  else if (tilingMode == 'hex2') {
    advanceX = (tileSize.x);
    advanceY = tileSize.y -  (25 * scale);
  }
  else {
    advanceX = tileSize.x;
    advanceY = tileSize.y;
  }
  return [advanceX, advanceY];
}

/**
 * The pattern you want to loop is assumed to be 50x50
 */
export function runTesselationLoop(opts: {
  width: number,
  height: number,
  desiredNumber: number,
  pattern: Pattern
}, callback: (x: number, y: number, scale: number, info: {x: number, y: number, cols: number, rows: number}) => void) {
  const {width, height, desiredNumber, pattern: {tilingMode, tileSize}} = opts;

  // Given the desired number of repetitions, who much do we have to scale the tile size?
  const scaleX = width / desiredNumber / tileSize[0];
  const scaleY = height / desiredNumber / tileSize[1];
  const scale = Math.min(scaleX, scaleY);

  const realTileSize = {
    x: tileSize[0] * scale,
    y: tileSize[1] * scale,
  }

  // How much would we advance each loop based on the type?
  const [advanceX, advanceY] = getTilingTranslate(tilingMode, scale, realTileSize);

  // And so how often do we have to repeat the tile size to fill the canvas?
  let repeatX = Math.ceil(width / advanceX);
  let repeatY = Math.ceil(height / advanceY);
  if (tilingMode == 'hex') {
    repeatX += 1;
  }

  // We would like to center it, what is the x/y translate?
  let shiftX = (width - repeatX * advanceX) / 2;
  if (tilingMode == 'hex') {
    shiftX -= (realTileSize.x / 2);
  }
  let shiftY = (height - repeatY * advanceY) / 2;

  // For hex tiling, we have to include one row more
  let startIndex = (tilingMode == 'square') ? 0 : -1;

  // Always start in negative space
  for (let x=startIndex; x<repeatX; x++) {
    for (let y=startIndex; y<repeatY; y++) {
      let posX, posY;

      // Calculate the drawing location
      if (tilingMode == 'hex2') {
        posX = x * advanceX   + (y % 2) * (realTileSize.x / 2);
        posY = y * advanceY;
      }
      else if (tilingMode == 'hex') {
        posX = x * advanceX;
        posY = y * advanceY  + (x % 2) * (realTileSize.y / 2);
      }
      else {
        posX = x * advanceX;
        posY = y * advanceY;
      }

      callback(posX + shiftX, posY + shiftY, scale, {x, y, rows: repeatX, cols: repeatY});
    }
  }
}