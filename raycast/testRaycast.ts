import {R_Canvas} from "../JLibrary/canvas/canvas";
import {Boundary} from "./boundary";
import * as THREE from 'three'
import {Drawable} from "./cray";
import {Listener} from "../JLibrary/canvas/canvas_listener";
import {ForEachArrayItem} from "../JLibrary/functions/functional";
import {Particle} from "./particle";
import {QuackingV2} from "../JLibrary/functions/structures";

let canvas = document.getElementsByTagName("canvas")[0];
let ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

let renderContext: R_Canvas;
let listener: Listener;


function cleanCanvas(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#167a7a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function cleanDraw(...args: any[]) {
  ForEachArrayItem((a: Drawable) => {
    a.draw(renderContext);
  }, args);
}

if (ctx) {
  renderContext = new R_Canvas(ctx);
  listener = new Listener(ctx, canvas);

  cleanCanvas(ctx);

  // Create walls on the left (How canvas represents all these data I won't know for now!)
  let boundaries: Boundary[] = [];
  {
    let b = new Boundary();
    b.set(
      new THREE.Vector2(500, 0),
      new THREE.Vector2(500, 500)
    );
    boundaries.push(b);
  }
  for (let i = 0; i < 5; i++) {
    let randomV = new THREE.Vector2(Math.random() * 500, Math.random() * 500);
    let randomV2 = new THREE.Vector2(Math.random() * 500, Math.random() * 500);
    let b = new Boundary();
    b.set(randomV, randomV2);
    boundaries.push(b);
  }

  // Draw the character who is looking around
  let particle = new Particle();
  particle.setPos(new THREE.Vector2(100, 200));
  particle.draw(renderContext);

  // Draw casted light rays
  let castRes = particle.castBoundaries(...boundaries);
  ForEachArrayItem((cast: QuackingV2) => {
    renderContext.cline(cast.x, cast.y, particle.pos.x, particle.pos.y);
  }, castRes);

  // Repeated rendering
  listener.setListenFunction("mousemove", (e) => {
    if (ctx) {
      cleanCanvas(ctx);
    }
    cleanDraw(...boundaries, particle);

    particle.setPos(new THREE.Vector2(e.clientX, e.clientY));
    let castRes = particle.castBoundaries(...boundaries);
    ForEachArrayItem((cast: QuackingV2) => {
      renderContext.cline(cast.x, cast.y, particle.pos.x, particle.pos.y);
    }, castRes);
  });

  console.log("Rendering");
}