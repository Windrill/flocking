import {QuadTree} from "./QuadTree";
import {Boid} from "./Boid";
import {BackendType, CanvasContext, D_Rect, MidPointToTopLeftBoxTuple} from "../JLibrary/functions/structures";
import {R_Canvas} from "../JLibrary/canvas/canvas";
import {Boundary} from "../JLibrary/geometry/Boundary";
import * as THREE from 'three';
import {World} from "./World";
import {Listener} from "../JLibrary/canvas/canvas_listener";
import {ForEachArrayItem} from "../JLibrary/functions/functional";

// let lastLoop = new Date();

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

class MainClass {
  initialization: boolean;
  intervalPlaying: any;

  flock: Boid[] = [];
  pause = true;
  renderContext: R_Canvas;
  world: World;

  constructor(world: World, canvasContext: CanvasContext) {
    this.world = world;
    this.initialization = true;
    this.renderContext = new R_Canvas(canvasContext);
  }

  startClicked() {
    console.log("Start clicked;");
    let numBoids = 18;
    if (this.initialization) {
      // Render Boids
      for (let i = 0; i < numBoids; i++) {
        //let nb = new Point(Math.random()*width, Math.random()*height);
        let nb = new Boid(i, this.world, [canvas.width, canvas.height]);
        // nb.mark = true;
        // nb.setSpeedRestraints(parseData);

        this.flock.push(nb);
        this.world.qt.insert(nb);
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
    // let thisLoop = new Date();
    // let fps = 1000 / (thisLoop - lastLoop);
    // lastLoop = thisLoop;
    // console.log("Rendering at: ", fps);
    this.renderContext.styles.strokeStyle = "#167a7a";
    this.renderContext.styles.fillStyle = "#167a7a";
    this.renderContext.drawBoard();
    let crange = new D_Rect(
      mouseX - 40, mouseY - 40, 80, 80);
    if (ctx) {
      crange.show(ctx);
    }

    //
    let queries = this.world.qt.query(crange, []);
    for (let q of queries) {
      q.markGreen = true;
    }
    /*
    for(q of flock){
      q.show(ctx);
    }*/

    ForEachArrayItem((f : Boid) => {
      f.flocking();
      f.draw();
      f.update();
    }, this.flock);

    ForEachArrayItem((b : Boundary) => {
      b.draw(this.renderContext);
    }, this.world.boundaries);
  }
} // End mainClass class

if (ctx) {
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

  // if (castTrace()) {
  //
  // }
}


/*

mouse cast:
mouse gives smth to the screen (mouse onclick handler...)
, screen handles it by linking itself to the qt tree

qt tree implements 'select' listener....
 */