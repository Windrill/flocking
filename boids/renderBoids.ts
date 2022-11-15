import {Point, QuadTree} from "./QuadTree";
import {Boid} from "./boid";
import {d} from "../draw_tool";
import {BackendType, CanvasContext, D_Rect} from "../JLibrary/functions/structures";
import {ForEachArrayItem} from "../JLibrary/functions/functional";
import {R_Canvas} from "../JLibrary/canvas/canvas";
import {Boundary} from "../JLibrary/geometry/Boundary";
import * as THREE from 'three';
import {Cartesian2Polar} from "../JLibrary/functions/algebra";
import {CRay} from "../JLibrary/geometry/CRay";

// import {Listener} from "./JLibrary/canvas/canvas_listener";
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
let mouseX: number;
let mouseY: number;
let ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
let renderContext: R_Canvas;
// console.log(parseData.alignHtml);
// console.log(parseData.alignHtml.value);

class MainClass {
  static initialization: boolean = true;
  static intervalPlaying: any;

  static flock: Boid[] = [];
  static pause = true;
  static quadTree = new QuadTree((new D_Rect(0, 0, canvas.width, canvas.height)));

  static startClicked() {
    if (MainClass.initialization && ctx) {
      // Initialize context
      // ctx?: CanvasRenderingContext2D
      // canvasSize?: WidthHeight // W, H
      // element?: HTMLElement // optional to assign eventListener inputs on; you could put a default of 'body', that
      // // listens to some global numbers such as mouseX and mouseY locations
      //
      // // Currently mixing HTML5 backend and THREE backend....organize into 2 types in the near future
      // camera?: any // dont want any three.js dependencies here
      // backendType: BackendType;// = BackendType::HTML5Backend;

      let canvasContext : CanvasContext = {
        ctx: ctx,
        canvasSize: {W: canvas.width, H: canvas.height},
        element: canvas, // body?
        backendType: BackendType.HTML5Backend
      };
      renderContext = new R_Canvas(canvasContext);


      for (let i = 0; i < 18; i++) {
        //let nb = new Point(Math.random()*width, Math.random()*height);
        let nb = new Boid(i, MainClass.quadTree, [canvas.width, canvas.height]);
        // nb.mark = true;
        // nb.setSpeedRestraints(parseData);

        MainClass.flock.push(nb);
        MainClass.quadTree.insert(nb);
      }
      //flock[20].mark = true;
      MainClass.initialization = false;
    }

    if (MainClass.pause) {
      MainClass.intervalPlaying = setInterval(MainClass.render, 20);
      MainClass.pause = false;
    } else {
      clearInterval(MainClass.intervalPlaying);
      MainClass.pause = true;
    }
  } // trigger play/pause


  static render() {
    // let thisLoop = new Date();
    // let fps = 1000 / (thisLoop - lastLoop);
    // lastLoop = thisLoop;
    // console.log("Rendering at: ", fps);
    renderContext.drawBoard();
    let crange = new D_Rect(mouseX - 40, mouseY - 40, 80, 80);
    if (ctx) {
      crange.show(ctx);
    }

    //
    let queries = MainClass.quadTree.query(crange, []);
    for (let q of queries) {
      q.markGreen = true;
    }
    /*
    for(q of flock){
      q.show(ctx);
    }*/
    for (let i = 0; i < MainClass.flock.length; i++) {
      MainClass.flock[i].flocking();
      MainClass.flock[i].draw();

      //for(let i=0;i<flock.length;i++){
      MainClass.flock[i].update(MainClass.quadTree);
    }
  }
}

if (ctx) {
  Boid.setCanvas(ctx);
  window.addEventListener("blur", function (_focusEvent) {
    MainClass.pause = true;
    clearInterval(MainClass.intervalPlaying);
  }, false);

  document.onmousemove = function (e) {
    mousePos(e);
  };

  function mousePos(e: MouseEvent) {
    mouseX = e.clientX + document.body.scrollLeft;
    mouseY = e.clientY + document.body.scrollTop;
  }

  let startEle = document.querySelector("#start");
  if (startEle) {
    startEle.addEventListener("mousedown", MainClass.startClicked);
  }

  // document.getElementsByTagName("body")[0].innerHTML += "<br/>red, green, yellow";

  let b1 = new Boundary(new THREE.Vector2(0,0), new THREE.Vector2(0, canvas.height));
  let b2 = new Boundary(new THREE.Vector2(canvas.width,0), new THREE.Vector2(0, canvas.height));
  let b3 = new Boundary(new THREE.Vector2(0,0), new THREE.Vector2(canvas.width, 0));
  let b4 = new Boundary(new THREE.Vector2(0,canvas.height), new THREE.Vector2(canvas.width, 0));
  let boundaries = [b1, b2, b3, b4];


}

// Returns the closest's distance to this ray
// if around 90 degrees then move left/right, < 90 then move right > 90 move left... add this after you visualize the collision
function castTrace(ray : CRay, boundary : Boundary) {
  let closest = Infinity;
  let closestPoint = null;

  ForEachArrayItem((boundary: Boundary) => {
    // line line?
    let castResult = ray.cast(boundary);

    if (castResult) {
      let dist = castResult.distanceTo(pos);
      // to negate fish-eye more: get angle of the ray relative to direction of the camera
      // optionally make fish-eye unproject a boolean!
      const a = Cartesian2Polar(ray.direction) - rotation;
      // then cosine of this angle...
      dist *= Math.cos(a); // project rays's vector onto camera vector
      if (dist < closest) {
        closest = dist;
        closestPoint = castResult;
      }
    }
  }, boundary);
  return [closestPoint, closest];
}

/*

mouse cast:
mouse gives smth to the screen (mouse onclick handler...)
, screen handles it by linking itself to the qt tree

qt tree implements 'select' listener....
 */