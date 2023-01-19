import {QuadTree} from "./QuadTree";
import {Boid} from "./Boid";
import {BackendType, CanvasContext, D_Point, D_Rect} from "../JLibrary/functions/structures";
import {R_Canvas} from "../JLibrary/canvas/canvas";
import {Boundary} from "../JLibrary/geometry/Boundary";
import * as THREE from 'three';
import {World} from "./World";
import {Listener} from "../JLibrary/canvas/canvas_listener";
import {ForEachArrayItem, ForEachObjectItem} from "../JLibrary/functions/functional";
import {Algebra, RAD2DEG} from "../JLibrary/functions/algebra";

// Main
let canvas = document.getElementsByTagName("canvas")[0];

let parseData = {
  alignHtml: document.getElementById("alignment"),
  separHtml: document.getElementById("separation"),
  cohesHtml: document.getElementById("cohesion"),
  forceHtml: document.getElementById("maxforce"),
  speedHtml: document.getElementById("maxspeed")
};
// console.log(parseData.alignHtml);
// console.log(parseData.alignHtml.value);
let mouseX: number;
let mouseY: number;
let ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

let mainInstance: MainClass;
let canvasContext: CanvasContext;

// Custom code to link behavior to object.
function BoidMovementControl(mainC : MainClass, localWorldCanvasContext : CanvasContext, _b: Boid) {
  console.log(mainC.flock);
  let controlledBoid = mainC.flock[0];
  let boidStopLambda = (e : KeyboardEvent) => {
    if (e.key == 's') {
      console.log("Pausing unpausing boid");
      controlledBoid.paused = !controlledBoid.paused;
    }
  }
  controlledBoid.addComponent(localWorldCanvasContext,
    [
      ["keydown", boidStopLambda]
    ]);

}

class MainClass {
  initialization: boolean;
  intervalPlaying: any;

  flock: {
    [index: string]: Boid
  };
  pause = true;
  rCanvas: R_Canvas;
  world: World;

  constructor(world: World, canvasContext: CanvasContext) {
    this.world = world;
    this.initialization = true;
    this.rCanvas = new R_Canvas(canvasContext);
    this.flock = {};
  }

  startClicked() {
    console.log("Start clicked;" +
      "Click to pause rendering, press s to pause boid movement");
    let numBoids = 1;
    if (this.initialization) {
      // Render Boids
      for (let i = 0; i < numBoids; i++) {
        //let nb = new Point(Math.random()*width, Math.random()*height);
        let nb = new Boid(i, this.world, [canvas.width, canvas.height]);
        // nb.mark = true;
        // nb.setSpeedRestraints(parseData);

        this.flock[nb.getId()] = nb;
        this.world.qt.insert(nb);

        // Hacky exposure to different levels of contexts....
        if (i == 0) {
          BoidMovementControl(this, canvasContext, nb);
        }
      }
      //flock[20].mark = true;
      this.initialization = false;
    }

    if (this.pause) {
      this.intervalPlaying = setInterval((this.render).bind(this), 20);
      this.pause = false;
    } else {
      clearInterval(this.intervalPlaying);
      this.pause = true;
    }
  } // trigger play/pause


  render() {
    this.rCanvas.styles.strokeStyle = "#167a7a";
    this.rCanvas.styles.fillStyle = "#167a7a";
    this.rCanvas.drawBoard();
    let crange = new D_Rect(
      mouseX - 40, mouseY - 40, 80, 80);
    if (ctx) {
      crange.show(ctx);
    }

    //
    let queries = this.world.qt.query(crange, []);
    for (let q of queries) {
      this.flock[q.getId()].markGreen = true;
    }
    /*
    for(q of flock){
      q.show(ctx);
    }*/

    ForEachObjectItem((f: Boid) => {
      f.flocking(this.rCanvas);
      f.draw();
      f.update();
    }, this.flock);

    ForEachArrayItem((b: Boundary) => {
      b.draw(this.rCanvas);
    }, this.world.boundaries);
  }
} // End mainClass class

if (ctx) {
  Algebra.OrthoNormal();
  // Map assets
  let b1 = new Boundary(new THREE.Vector2(0, 0), new THREE.Vector2(0, canvas.height));
  b1.name = ("Left");
  let b2 = new Boundary(new THREE.Vector2(canvas.width, 0), new THREE.Vector2(canvas.width, canvas.height));
  b2.name = ("Right");
  let b3 = new Boundary(new THREE.Vector2(0, 0), new THREE.Vector2(canvas.width, 0));
  b3.name = ("Top");
  let b4 = new Boundary(new THREE.Vector2(0, canvas.height), new THREE.Vector2(canvas.width, canvas.height));
  b4.name = ("Bottom");
  let boundaries = [b1, b2, b3, b4];


  let quadTree = new QuadTree((new D_Rect(0, 0, canvas.width, canvas.height)));
  let world = new World(boundaries, quadTree);
  canvasContext = {
    ctx: ctx,
    canvasSize: {W: canvas.width, H: canvas.height},
    element: canvas, // body?
    backendType: BackendType.HTML5Backend
  };
  mainInstance = new MainClass(world, canvasContext);

  // After Canvas Context is initialized, add event listener...
  // Can you swap out contexts....for example set the event listener as a window. Or have the Listener class have
  // a copy of the target element.
  let mouseBoundary = new Boundary(new THREE.Vector2(0, 0), new THREE.Vector2(0, 0));
  mouseBoundary.name = "mouseBoundary";

  // ProjectP is for based on new thing. this is based on 0
  let setBoundary = (b: Boundary) => {
    // Automatic function check if this is valid or not...
    // set boundary based on auto-boundary object.
    let cb = b.contextObject["autoBoundary"];

    let relativeLine = Algebra.ProjectP(new THREE.Vector2(1, 0), cb.lineLength / 2, RAD2DEG * cb.angleRad);
    b.set(
      new THREE.Vector2(cb.lineMidpoint.x - relativeLine.x, cb.lineMidpoint.y - relativeLine.y),
      new THREE.Vector2(cb.lineMidpoint.x + relativeLine.x, cb.lineMidpoint.y + relativeLine.y)
    );
  };

  // Data for boundaries
  mouseBoundary.contextObject["autoBoundary"] = {
    // 1. midpoint, 2. length, 3. angle.
    lineMidpoint: new D_Point(0, 0),
    lineLength: 100,
    angleRad: 0
  };

  // Driver to connect mousemove
  // can't use 'this' with arrow functions.
  let thisBoundMouseLambda = ((e: MouseEvent) => {
    // console.log("Mouse moved, setting boundary");
    mouseBoundary.contextObject["autoBoundary"].lineMidpoint = new D_Point(e.clientX, e.clientY);
    setBoundary(mouseBoundary);
  })

  let thisScrollLambda = (e : WheelEvent) => {
    let scrolled = e.deltaY;
    let constant = 0.003;

    mouseBoundary.contextObject["autoBoundary"].angleRad += scrolled * constant;
    setBoundary(mouseBoundary);
  }

  // Add to component
  mouseBoundary.addComponent(canvasContext,
    [
      ["mousemove", thisBoundMouseLambda],
      ["mousewheel", thisScrollLambda]
    ]);

  world.boundaries.push(mouseBoundary);

  // add function: draw boundary as ray
  // Push custom boundary
  // world.boundaries.push(new Boundary())

  Boid.setCanvas(ctx);
  window.addEventListener("blur", function (_focusEvent) {
    mainInstance.pause = true;
    clearInterval(mainInstance.intervalPlaying);
  }, false);

  document.onmousemove = function (e) {
    mousePos(e);
  };

  function mousePos(e: MouseEvent) {
    mouseX = e.clientX + document.body.scrollLeft;
    mouseY = e.clientY + document.body.scrollTop;
  }

  if (ctx) {
    let startListen = new Listener(canvasContext);
    let startButton = document.querySelector("#start");
    if (startButton) {
      startListen.setElement(startButton);
    }

    startListen.setListenFunction("mousedown",
      (mainInstance.startClicked).bind(mainInstance)
    );
  }
  // document.getElementsByTagName("body")[0].innerHTML += "<br/>red, green, yellow";
}

/*

mouse cast:
(mouse onclick handler...)
, screen handles it checks out the corresponding part of the qt tree

qt tree implements 'select' listener....
 */