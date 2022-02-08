import {SimplePoint} from "../scripts/types";
import {reflectAtEdge, rotatePoints} from "../scripts/rough/hachure";
import {cloneGroup, intersectLine} from "../scripts/utils/math";

const A: SimplePoint = [100, 91.42135620117188];
const B: SimplePoint = [91.42135620117188, 100];

const a: SimplePoint = [0, 50];
const b: SimplePoint = [35.35533905029297, 64.64466094970703];
const c: SimplePoint = [50, 100];
const d: SimplePoint = [64.64466094970703, 64.64466094970703];
const e: SimplePoint = [100, 50];
const f: SimplePoint = [64.64466094970703, 35.35533905029297];
const g: SimplePoint = [50,0];
const h: SimplePoint = [35.35533905029297, 35.35533905029297];
const i: SimplePoint = [14.644660949707031, 14.644660949707031];
const j: SimplePoint = [14.644660949707031, 85.35533905029297];
const k: SimplePoint = [85.35533905029297, 85.35533905029297];
const l: SimplePoint = [85.35533905029297, 14.644660949707031];
const m: SimplePoint = [29.289321899414062, 50];
const n: SimplePoint = [50, 29.289321899414062];
const o: SimplePoint = [70.71067810058594, 50];
const p: SimplePoint = [50, 70.71067810058594];
const x = intersectLine([l,n],[g,f])
const q = intersectLine([l,o],[e,f])
const r = intersectLine([k,o],[e,d])
const s = intersectLine([k,p],[c,d])
const t = intersectLine([c,b],[j,p])
const u = intersectLine([j,m],[a,b])
const v = intersectLine([a,h],[i,m])
const w = intersectLine([i,n],[g,h])

const final = [
...reflectAtEdge([[100, 20], [80, 50], [80, 60], [100,80]], [[100, 0], [100, 100]])
];

console.log(final);