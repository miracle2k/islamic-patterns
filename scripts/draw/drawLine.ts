import {ColorScheme, LineConfig, RoughConfig, SimpleGroup, SimpleLine} from "../types";
import {distributeLinear, lineMagnitude} from "../utils/math";
import {scribbleLine, scribbleEllipse} from "../rough/scribble";
import {randint, random} from "../utils/random";


function drawDottedLine(p5, line: SimpleLine, config: LineConfig, colors: ColorScheme, rough: RoughConfig) {
  let dotSize = config.width ?? 1;

  // Work around a stupid behaviour in p5.js 1.0 wherein a lineWidth of 1 results in a square point
  if (dotSize == 1) {
    dotSize = 1.0001;
  }

  let dotDensity = config.dotDensity ?? 0.4;  // 0.4 is minimum to have a good line
  if (rough?.mode == 'on') {
    dotDensity = 0.9 * dotDensity;
  }
  let lengthOfLine = lineMagnitude(line);
  if (lengthOfLine == Infinity) {
    lengthOfLine = 1;
  }
  const maxPoints = lengthOfLine / dotSize;
  const actualDotCount = Math.round(dotDensity * maxPoints);

  let dots = distributeLinear([line[0], line[1]] as any, actualDotCount);
  if (config.noEndDots) {
    // @ts-ignore
    dots = dots.slice(1, dots.length - 1);
  }

  if (rough?.mode == 'on') {
    p5.strokeWeight(0.2);
  } else {
    p5.strokeWeight(dotSize);
  }
  p5.stroke(colors.foreground);
  p5.drawingContext.linestyle

  if (rough?.mode == 'on') {
    for (const p of dots) {
      scribbleEllipse(p5, p[0], p[1], dotSize, dotSize)
    }
  }
  else {
    const oldFill = p5.drawingContext.fillStyle;
    p5.drawingContext.fillStyle = colors.foreground;
    for (const p of dots) {
      fixedPoint(p5, p[0], p[1]);

      if (config.style == 'double-dotted') {
        // p5.stroke("white");
        // p5.strokeWeight(0.3 * (dotSize ?? 1))
        // fixedPoint(p5, p[0], p[1]);
      }
    }
    p5.drawingContext.fillStyle = oldFill;
  }
}

function fixedPoint(p5, x, y) {
  p5.drawingContext.beginPath();
  p5.drawingContext.arc(x, y, p5.drawingContext.lineWidth / 2, 0, p5.TWO_PI, false);
  p5.drawingContext.fill();
}

function drawSolidLine(p5, line: SimpleLine, config: LineConfig, colors: ColorScheme, rough: RoughConfig) {
  p5.stroke(colors.foreground);
  p5.noFill();
  p5.strokeWeight(config.width ?? 1);

  if (rough?.mode == 'on') {
    p5.strokeWeight((config.width ?? 1) * 1.2)
    scribbleLine(p5, ...line[0], ...line[1], {
      maxRandomnessOffset: 10,
      bowing: 2,
      roughness: .4
    })
  } else {
    p5.line(...line[0], ...line[1]);
  }

}

export function drawLine(p5, line: SimpleGroup, config: LineConfig, colors: ColorScheme, rough: RoughConfig) {
  p5.stroke(colors.foreground);
  p5.noFill();

  if (!config.show || config.style == 'none') {
    return;
  }

  p5.drawingContext.save();

  // if (config.shadow) {
  //   // We might be able to angle this based on the line
  //   p5.drawingContext.shadowOffsetX = 6;
  //   p5.drawingContext.shadowOffsetY = 6;
  //   p5.drawingContext.shadowColor = colors.shadow;
  //   p5.drawingContext.shadowBlur = 8;
  // }

  // In rough mode, very tiny dots don't work. Make them a solid line instead.
  const tooTinyForDots = rough.mode == 'on' && (1-config.dotDensity) * config.width < 0.40;

  if ((config.style == 'dotted' || config.style == 'double-dotted') && !tooTinyForDots) {
    drawDottedLine(p5, line as SimpleLine, config, colors, rough);
  } else {
    if (config.style == 'dashed') {
      let dashOpts;
      if (config.dashConfig == 'random') {
        dashOpts = [randint(1, 6), randint(1, 6)];
      }
      else {
        dashOpts = config.dashConfig;
      }

      p5.drawingContext.setLineDash(dashOpts);
    }

    drawSolidLine(p5, line as SimpleLine, config, colors, rough)}

  p5.drawingContext.restore();
}