import {R_Canvas} from "../JLibrary/canvas/canvas";
import {Boundary} from "../JLibrary/geometry/boundary";
import * as THREE from 'three'
import {Drawable} from "../JLibrary/geometry/cray";
import {Listener} from "../JLibrary/canvas/canvas_listener";
import {ForEachArrayIndex, ForEachArrayItem} from "../JLibrary/functions/functional";
import {QuackingV2} from "../JLibrary/functions/structures";
import {ColorConversions} from "../JLibrary/tools/color_conversions";
import {PlayerParticle} from "../JLibrary/geometry/PlayerParticle";
import {CLAMP} from "../JLibrary/functions/algebra";
// proper added after installing types
import * as dat from 'dat.gui';
const gui = new dat.GUI();

let canvas = document.getElementsByTagName("canvas")[0];
let ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

let renderContext: R_Canvas;
let listener: Listener;

function cleanCanvas(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#167a7a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

if (ctx) {
  renderContext = new R_Canvas(ctx);
  listener = new Listener(ctx, canvas);

  cleanCanvas(ctx);

  /*



   */
}