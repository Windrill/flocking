import {R_Canvas} from "../JLibrary/canvas/canvas";
import * as THREE from 'three'
import {Listener} from "../JLibrary/canvas/canvas_listener";
import {ForEachArrayIndex, ForEachArrayItem} from "../JLibrary/functions/functional";
import {QuackingV2} from "../JLibrary/functions/structures";
import {ColorConversions} from "../JLibrary/tools/color_conversions";
import {PlayerParticle} from "../JLibrary/geometry/PlayerParticle";
import {CLAMP} from "../JLibrary/functions/algebra";
// proper added after installing types
import * as dat from 'dat.gui';
import {Drawable} from "../JLibrary/geometry/CRay";
import {Boundary} from "../JLibrary/geometry/Boundary";
const gui = new dat.GUI();

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

// Location distances
function drawPlayerView(castDistance: number[]) {
  let renderStart = {x: 500, y: 0};
  let renderSize = {x: 500, y: 500};
  // this whole thing
  let stripWidth = (renderSize.x / castDistance.length);
  // Draw casted light array distances on the rendered section
  ForEachArrayIndex((i: number) => {
    let dist: number = castDistance[i];
    // 100/dist  is weak perspective projection that 'alleviates' fish0eye
    //100 / dist *
    let stripHeight = CLAMP(renderSize.y - dist, 0, 500);
    let off = (renderSize.y - stripHeight) / 2;
    renderContext.crect(renderStart.x + i * stripWidth, renderStart.y + off,
      stripWidth, stripHeight, {
        fillStyle: ColorConversions.rgbToHex(255 - dist, 255 - dist, 255 - dist),
        debug: false,
        lineWidth: 1
      });
  }, castDistance);
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
  let particle = new PlayerParticle();
  particle.setPos(new THREE.Vector2(100, 200));
  particle.draw(renderContext);

  // Draw casted light rays
  let [castRes, castDist] = particle.castBoundaries(...boundaries);
  ForEachArrayItem((cast: QuackingV2) => {
    renderContext.cline(cast.x, cast.y, particle.pos.x, particle.pos.y);
  }, castRes);

  cleanDraw(...boundaries, particle);
  drawPlayerView(castDist);

  let reDrawLambda = ((_e : EventListenerOptions) => {
    if (ctx) {
      cleanCanvas(ctx);
    }
    cleanDraw(...boundaries, particle);

    let [castRes, castDist] = particle.castBoundaries(...boundaries);
    ForEachArrayItem((cast: QuackingV2) => {
      renderContext.cline(cast.x, cast.y, particle.pos.x, particle.pos.y);
    }, castRes);

    drawPlayerView(castDist);
  });

  let folder1 = gui.addFolder('fov');
  folder1.add(particle, "fov", 0, 360, 15)
    .onChange(()=> {
      particle.updateFOV();
    });

  // Repeated rendering
  listener.setListenFunction("mousemove", (e) => {

    particle.setPos(new THREE.Vector2(e.clientX, e.clientY));
    reDrawLambda(e);
  });

  listener.setListenFunction("keydown", (e) => {
    switch (e.key) {
      case 'a':
        /// this constant just isnt the same as radian translation
        particle.rotate(-.10);
        reDrawLambda(e);
        console.log("a");
        break;
      case 'd':
        particle.rotate(.10);
        reDrawLambda(e);
        console.log("d");
        break;
      case 'w':
        particle.move(1);
        reDrawLambda(e);
        break;
      case 's':
        particle.move(-1);
        reDrawLambda(e);
        console.log("d");
        break;
    }
  });


  console.log("Rendering");
}