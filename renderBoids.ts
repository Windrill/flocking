import {Point, QuadTree} from "./QuadTree";
import {Boid} from "./boid";
import {d} from "./draw_tool";
import {D_Rect, MidPointToD_Rect} from "./JLibrary/functions/structures";
import {ForEachArrayItem} from "./JLibrary/functions/functional";
import {R_Canvas} from "./JLibrary/canvas/canvas";
// import {Listener} from "./JLibrary/canvas/canvas_listener";
// let lastLoop = new Date();

// Main
let canvas = document.getElementsByTagName("canvas")[0];
// let width = canvas.width;
// let height = canvas.height;
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
  static dd = new d(ctx);

  static startClicked() {
    if (MainClass.initialization) {
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
    MainClass.dd.drawBoard(canvas.width, canvas.height);
    let crange = new D_Rect(mouseX - 40, mouseY - 40, 80, 80);
    crange.show(ctx);

    let queries = MainClass.quadTree.query(crange, []);

    for (let q of queries) {
      q.mark2 = true;
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

  // new Listener(ctx, document.querySelector("#start"));

  document.querySelector("#start").addEventListener("mousedown", MainClass.startClicked);

  renderContext = new R_Canvas(ctx);
  // renderContext.cline(100,);

  // document.getElementsByTagName("body")[0].innerHTML += "<br/>red, green, yellow";

  // let tree = new QuadTree(new D_Rect(0,0,800,800));
  // tree.insert(new Point(0, 199,129));
  // tree.insert(new Point(1, 227, 74));
  // let queryResults : Point[]= [];
  // tree.query(
  //   MidPointToD_Rect(199,129,80,80), queryResults
  // );
  // console.log(queryResults);
}
/*

mouse cast:
mouse gives smth to the screen (mouse onclick handler...)
, screen handles it by linking itself to the qt tree

qt tree impleemnts 'select' listener....
 */