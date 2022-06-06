import {Point, QuadTree} from "./QuadTree";
import * as THREE from 'three';
import {WRAP} from "./JLibrary/functions/algebra";
import {Accumulator, CompositeFunc, ForEachArrayIndex, ForEachArrayItem} from "./JLibrary/functions/functional";
import {Vector2} from "three";
import {D_Rect, NormalizeX} from "./JLibrary/functions/structures";
import {R_Canvas} from "./JLibrary/canvas/canvas";
import {CLAMP_VEC2} from "./JLibrary/r_three";

const ORG = new THREE.Vector2(0, 0);
// how to pass more shared context to other modules?
let canvas = document.getElementsByTagName("canvas")[0];
let ctx: CanvasRenderingContext2D = canvas.getContext('2d');

let regularCanvas = new R_Canvas(ctx);

let boidColors = [
  "#d95252",
  "#47af4f",
  "#d7cb69",
  "#f89c34"
];


class Boid extends Point {
  private acceleration: THREE.Vector2;
  private velocity: THREE.Vector2;
  private maxForce: number;
  private maxSpeed: number;
  private randomRange: number[];
  private separateValue: number;
  private cohesionValue: number;
  private alignValue: number;
  private forceResult: Vector2[];


  private qt: QuadTree;
  // Context like a delegate, but actually a reference
  public static ctx: CanvasRenderingContext2D;

  static setCanvas(c: CanvasRenderingContext2D) {
    Boid.ctx = c;
  }

  // can this boid treat 1 and array the same...
  constructor(id: number, qt: QuadTree, randomRange: number[] = [500, 500]) {
    super(id, Math.random() * randomRange[0], Math.random() * randomRange[1]);
    this.maxForce = 3;
    this.maxSpeed = 5;

    this.alignValue = 8;
    this.cohesionValue = 3;
    this.separateValue = 5;

    this.velocity = ORG;
    this.acceleration = ORG;

    this.forceResult = [];
    // Reference
    this.qt = qt;

    // automatically assume it's 0, 0, width then height
    this.randomRange = randomRange;
    this.velocity = new THREE.Vector2(Math.random() * 15 - 7.5, Math.random() * 15 - 7.5);
    this.acceleration = new THREE.Vector2(0, 0);

    // mark to draw/trace values of this boid
    this.mark = false;
    // Mark2: mouse hover to show green color : TODO fix when it doesn't seem to mark even when you hovered over
    this.mark2 = false;
  }

  wrapPosition() {
    this.pos.x = WRAP(this.pos.x, 0, this.randomRange[0]);
    this.pos.y = WRAP(this.pos.y, 0, this.randomRange[1]);
  }

  setSpeedRestraints(parseData: any) {
    this.maxForce = parseData.forceHtml.value;
    this.maxSpeed = parseData.speedHtml.value;
    this.alignValue = parseData.alignHtml.value;
    // console.log(this.alignValue);
    this.cohesionValue = parseData.cohesHtml.value;
    this.separateValue = parseData.separHtml.value;
  }

  flocking() {
    let forceResult = this.threeForces();

    let alignment = forceResult[0];
    alignment.multiplyScalar(this.alignValue);

    let cohesion = forceResult[1];
    cohesion.multiplyScalar(this.cohesionValue);

    let separation = forceResult[2];
    separation.multiplyScalar(this.separateValue);
    this.forceResult = forceResult;

    // Draw force arrows based on magnitudes
    let arrowMagnitudes : number[] = [];
    ForEachArrayItem((item : THREE.Vector2)=> {
      arrowMagnitudes.push(item.length());
    }, forceResult);
    let normalizedMagnitudes = NormalizeX(...arrowMagnitudes);
    // for (let i = 0; i < 3; i++) {
    //   regularCanvas.carrow(this.pos, forceResult[i], 40 * normalizedMagnitudes[i],
    //     {fillStyle: boidColors[i], debug: false, lineWidth: 2}
    //   );
    // }

    regularCanvas.carrow(this.pos, alignment, 10,
      {fillStyle: boidColors[3], debug: false, lineWidth: 2}
    );

    // Add forces to acceleration
    this.acceleration.add(alignment);
    this.acceleration.add(separation);
    this.acceleration.add(cohesion);
  }

  threeForces(): Vector2[] {
    // Alignment, Cohesion, Separation
    let perception = [180, 110, 55];
    let forces: Boid[][] = [];
    let steering = [];

    // Add perception boxes, query results, and initiate steer direction
    for (let i = 0; i < perception.length; i++) {
      let rect = new D_Rect(
        this.pos.x - perception[i] / 2, this.pos.y - perception[i] / 2,
        perception[i], perception[i]);
      if (this.mark) {
        rect.show(Boid.ctx);
      }
      let queryResult: Point[] = [];
        this.qt.query((rect), queryResult);
      forces.push(queryResult);
      steering.push((new THREE.Vector2(0, 0)));
    }

    let funcAddVelocity = (acc: THREE.Vector2, item: Boid) => {
      return acc.add(item.velocity);
    };
    let funcAddLocation = (acc: THREE.Vector2, item: Boid) => {
      return acc.add(item.pos);
    };

    // Calculate steer direction for alignment
    if (forces[0].length > 1) {
      let alignForce = Accumulator(funcAddVelocity, forces[0], (new THREE.Vector2(0, 0)));
      steering[0] = alignForce;
      CLAMP_VEC2(steering[0], this.maxForce);

      steering[0].divideScalar((forces[0].length));
    }
    // steering[0].setLength(this.maxSpeed);

    // go toward center of flock!
    if (forces[1].length > 1) {
      let cohesiveForce = Accumulator(funcAddLocation, forces[1], (new THREE.Vector2(0, 0)));

      steering[1] = cohesiveForce.divideScalar(forces[1].length);
      steering[1].sub(this.pos);
      CLAMP_VEC2(steering[1], this.maxForce);
    }
    // needs to be: strength inversely proportional to length???, cannot be linear, cannot be too strong

    // separation: distance to close boid, needs to be further away.......
    // Calculate steer direction for separation
    if (forces[2].length > 1) {
      // the force should be facing away
      let separationForce = Accumulator((acc: THREE.Vector2, item: Boid) => {
        // if too close, force is bigger: 5 / 1
        let separationForce = this.pos.clone().sub(item.pos);
        // console.log(separationForce, separationForce.length());
        // 30: length of 25 = very small force
        if (separationForce.length() != 0) {
          return acc.add(
            separationForce
              .multiplyScalar((8 / separationForce.length()))
          );
        } else {
          return acc;
        }
      }, forces[1], (new THREE.Vector2(0, 0)));
      steering[2] = separationForce;
      // steering[2].divideScalar(forces[2].length);
      CLAMP_VEC2(steering[2], this.maxForce);
      // console.log("Total separation force", steering[2]);
    }
    return steering;
  }

  // actualy not so intersted in this.
// this.
//   runningAverage = [];
//   runningLength = 5;
//   runningSize = 0;
  update(qt: QuadTree) {
    this.pos.add(this.velocity);
    if (this.mark) {
      //console.log('this.vel', this.vel);
      //console.log('this.acc', this.acc);
    }
    // this.velocity.multiplyScalar(0.9);
    //try to add running average to velocity instead of acceleration directly...
    this.velocity.add(this.acceleration);


    // this.velocity = this.acceleration;
    // console.log(this.acceleration);
    CLAMP_VEC2(this.velocity, this.maxSpeed);
    this.wrapPosition();
    this.acceleration.set(0, 0);
    qt.remove(this);
    qt.insert(this);
  }

  // quickFormatText(...args) {
  //   return ``
  // }

  draw() {
    Boid.ctx.fillStyle = "#33ccff";

    // i suppose this is display only. didn't like it this way though.
    // at least didnt like it in 2 places, bvoids, and in quadtree...needs to query tree for locatiion
    if (this.mark) {
      // let rect = new D_Rect(this.pos.x - 20, this.pos.y - 20, 80, 80);
      // if (this.mark) {
      //   rect.show(Boid.ctx);
      // }
      // Boid.ctx.fillText(`${(this.velocity.x)},${(this.velocity.y)}`, this.pos.x + 15, this.pos.y + 15);
      Boid.ctx.fillText(`${(this.forceResult[0].x).toFixed(0)},${(this.forceResult[0].x).toFixed(0)}`, this.pos.x + 15, this.pos.y + 25);
      Boid.ctx.fillText(`${(this.forceResult[1].x).toFixed(0)},${(this.forceResult[1].x).toFixed(0)}`, this.pos.x + 15, this.pos.y + 35);
      Boid.ctx.fillText(`${(this.forceResult[2].x).toFixed(0)},${(this.forceResult[2].x).toFixed(0)}`, this.pos.x + 15, this.pos.y + 45);
      Boid.ctx.fillText(`${((this.pos.x).toFixed(0))},${(this.pos.y).toFixed(0)}`, this.pos.x + 15, this.pos.y + 15);

      Boid.ctx.fillStyle = "#4c2df7";
    } else if (this.mark2) {
      Boid.ctx.fillStyle = "#35d994";
      this.mark2 = false;
    }
    // try to draw as a midpoint....
    Boid.ctx.fillRect(this.pos.x - 4, this.pos.y - 4, 8, 8);
    //Boid.ctx.fillStyle = "#000000";
  }
}

export {
  Boid,

}
export type {}