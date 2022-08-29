import {R_Canvas} from "../JLibrary/canvas/canvas";
import {Boundary} from "./boundary";
import * as THREE from 'three'
import {CRay, Drawable} from "./cray";
import {Listener} from "../JLibrary/canvas/canvas_listener";
import {ForEachArrayItem} from "../JLibrary/functions/functional";
import {Particle} from "./particle";
import {QuackingV2} from "../JLibrary/functions/structures";

let canvas = document.getElementsByTagName("canvas")[0];
let ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

let renderContext: R_Canvas;
let listener: Listener;



function cleanCanvas() {
  if (ctx) {
    ctx.fillStyle = "#167a7a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function oneBoundary() {
  let b = new Boundary();
  b.set(
    new THREE.Vector2(300, 100),
    new THREE.Vector2(300, 300)
  );
  b.draw(renderContext);

  let ray = new CRay();
  ray.setPos(new THREE.Vector2(100, 200));
  ray.setDirection(new THREE.Vector2(1, 0));
  ray.draw(renderContext);

  cleanDraw(b, ray);

  // Is this listen fucntion unique or can be heaped upon?
  listener.setListenFunction("mousemove", (e) => {
    // console.log(e);
    ray.pointTowards(new THREE.Vector2(e.clientX, e.clientY));
    let castCollision = (ray.cast(b));
    if (castCollision) {
      renderContext.cpoint(castCollision);
    }
  });
}

function cleanDraw(...args: any[]) {
  cleanCanvas();
  ForEachArrayItem((a : Drawable) => {
    a.draw(renderContext);
  }, args);
}

if (ctx) {
  renderContext = new R_Canvas(ctx);
  listener = new Listener(ctx, canvas);

  cleanCanvas();

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
  // console.log(boundaries); // <-- valid

  let particle = new Particle();
  particle.setPos(new THREE.Vector2(100, 200));
  particle.draw(renderContext);

  // let castRes = particle.cast(b);
  let castRes = particle.castBoundaries(...boundaries);
  ForEachArrayItem((cast: QuackingV2) => {
    renderContext.cline(cast.x, cast.y, particle.pos.x, particle.pos.y);
  }, castRes);

  listener.setListenFunction("mousemove", (e) => {
    cleanCanvas();
    cleanDraw(...boundaries, particle);

    particle.setPos(new THREE.Vector2(e.clientX, e.clientY));
    let castRes = particle.castBoundaries(...boundaries);
    // let castRes = particle.cast(b);
    ForEachArrayItem((cast: QuackingV2) => {
      renderContext.cline(cast.x, cast.y, particle.pos.x, particle.pos.y);
    }, castRes);

  });
  // console.log(ray.cast(b));
  console.log("Rendering");

}