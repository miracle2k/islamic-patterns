import {ColorScheme, LineConfig, RoughConfig, SimpleGroup, SimpleLine} from "../types";
import {distributeLinear, lineMagnitude} from "../utils/math";
import {scribbleEllipse, scribbleLine} from "../rough/scribble";
import {randint, random} from "../utils/random";


function drawDottedLine(p5, line: SimpleLine, config: LineConfig, colors: ColorScheme, rough: RoughConfig) {
  let dotSize = config.width ?? 1;
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
  for (const p of dots) {
    if (rough?.mode == 'on') {
      scribbleEllipse(p5, p[0], p[1], dotSize, dotSize, {roughness: 0.15})
    } else {
      p5.point(p[0], p[1]);
    }

    if (config.style == 'double-dotted') {
      p5.stroke("white");
      p5.strokeWeight(0.3 * (dotSize ?? 1))
      p5.point(p[0], p[1]);
    }
  }
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

  if (!config.show) {
    return;
  }

  p5.drawingContext.save();

  if (config.shadow) {
    // XXX We might be able to angle this based on the line
    p5.drawingContext.shadowOffsetX = 6;
    p5.drawingContext.shadowOffsetY = 6;
    p5.drawingContext.shadowColor = colors.shadow;
    p5.drawingContext.shadowBlur = 8;
  }

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