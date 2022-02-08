import {FillPatternOpts, Pattern, TilingMode} from "../types";
import {debug} from "../utils/debug";


export function getTilingTranslate(tilingMode: TilingMode, scale: number, tileSize: {x: number, y: number}) {
  let advanceX;
  let advanceY;
  if (tilingMode == 'hex') {
    advanceX = (tileSize.x - (25 * scale));
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
export function runTesselationLoop(
  opts: {
    width: number,
    height: number,
    desiredNumber: number,
    pattern: Pattern,
    fillPatternOpts?: FillPatternOpts
  },
  callback: (x: number, y: number, scale: number, info: {x: number, y: number, cols: number, rows: number}) => void)
{
  const {width, height, desiredNumber, pattern: {tilingMode, tileSize}, fillPatternOpts} = opts;

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
  let repeatX = Math.ceil(width / advanceX) + 1;
  let repeatY = Math.ceil(height / advanceY) + 1;
  if (tilingMode == 'hex') {
    repeatX += 1;
  }

  // We would like to center it, what is the x/y translate?
  let shiftX = (width - repeatX * advanceX) / 2;
  if (tilingMode == 'hex') {
    shiftX -= (realTileSize.x / 2);
  }
  let shiftY = (height - repeatY * advanceY) / 2;

  // We have to include one row more at the beginning
  let startIndex = -1;

  // Run the callback to draw a x/y
  function d(x, y) {
    // Calculate the drawing location
    let posX = x * advanceX + ((fillPatternOpts?.shiftX ?? 0) * advanceX);
    let posY = y * advanceY + ((fillPatternOpts?.shiftY ?? 0) * advanceY);

    if (tilingMode == 'hex2') {
      posX += (y % 2) * (realTileSize.x / 2);
    }
    else if (tilingMode == 'hex') {
      posY += (x % 2) * (realTileSize.y / 2);
    }

    callback(posX + shiftX, posY + shiftY, scale, {x, y, rows: repeatX, cols: repeatY});
  }

  // Due to the way we draw external shapes (those which are shared with adjacent tiles) as part
  // of the drawing process of a single tile, and those need to be drawn in a certain order,
  // we run into trouble with hex patterns; here, drawing a tile that is inset within 3 adjacent
  // ones does does sometimes not give enough edges without overriding a previous tile. The way
  // to fix this is simply to iterate over the grid in a different order.
  if (tilingMode == 'hex') {
    for (let x = startIndex; x < repeatX; x++) {
      for (let y=startIndex; y<repeatY; y++) {
        d(x, y);
      }
      //if (window.DEBUG) { debug(x); }
    }
  }
  else {
    for (let y=startIndex; y<repeatY; y++) {
      for (let x = startIndex; x < repeatX; x++) {
        d(x, y);
      }
      //if (window.DEBUG) { debug(y); }
    }
  }
}