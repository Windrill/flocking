import {Boundary} from "../../JLibrary/geometry/Boundary";
import * as THREE from "three";
import {CRay, Drawable} from "../../JLibrary/geometry/CRay";
import {R_Canvas} from "../../JLibrary/canvas/canvas";
import {Listener} from "../../JLibrary/canvas/canvas_listener";
import {ForEachArrayItem} from "../../JLibrary/functions/functional";

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

function oneBoundary(ctx: CanvasRenderingContext2D) {
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

  cleanCanvas(ctx);
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

if (ctx) {
  renderContext = new R_Canvas(ctx);
  listener = new Listener(ctx, canvas);

  oneBoundary(ctx);
}