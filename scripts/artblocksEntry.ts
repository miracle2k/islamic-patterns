import {makeConfig} from "./makeConfig";
import {makePatternFromConfig} from "./makePatternFromConfig";
import {P5Renderer} from "./draw/renderP5js";

declare const tokenData: { hash: string, tokenId: number  };
let seed = parseInt(tokenData.hash.substr(-7), 16)
const config = makeConfig(seed);

// Something like this is yseful as a hack when doing controlled screenshotting
// config.pattern.fillPatternIdx = tokenData.tokenId;

const pattern = makePatternFromConfig(config.pattern);
const p5 = new P5Renderer(config, pattern, {size: {width: window.innerWidth, height: window.innerHeight}});
p5.setupInteractiveHandlers();
