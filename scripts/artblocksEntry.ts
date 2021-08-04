import {makeConfig} from "./makeConfig";
import {makePatternFromConfig} from "./makePatternFromConfig";
import {P5Renderer} from "./draw/renderP5js";

declare const tokenData: { hash: string  };

const canvas = document.getElementsByTagName("canvas")[0]
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
canvas.getContext('2d').imageSmoothingEnabled = true;
canvas.getContext('2d').imageSmoothingQuality = "high";
let seed = parseInt(tokenData.hash.substr(-7), 16)
const config = makeConfig(seed);
const pattern = makePatternFromConfig(config.pattern);
const p5 = new P5Renderer(config, pattern, canvas);
p5.setupInteractiveHandlers();
p5.draw();