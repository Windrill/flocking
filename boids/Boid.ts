import {Point} from "./QuadTree";
import * as THREE from 'three';
import {Vector2} from 'three';
import {Algebra, RAD2DEG, WRAP} from "../JLibrary/functions/algebra";
import {Accumulator, ForEachArrayItem} from "../JLibrary/functions/functional";
import {
  BackendType,
  CanvasContext,
  D_Rect,
  MidPointToBottomLeft,
  MidPointToTopLeft, MidPointToTopLeftBoxTuple,
  NormalizeX, Quackable, QuackingV2
} from "../JLibrary/functions/structures";
import {R_Canvas} from "../JLibrary/canvas/canvas";
import {CLAMP_VEC2} from "../JLibrary/r_three";
import {castTrace, World} from "./World";
import {MathTypeToNumber, Vec2Ray} from "../JLibrary/geometry/Conversions";
import {Boundary} from "../JLibrary/geometry/Boundary";
import {CRay} from "../JLibrary/geometry/CRay";
import {MathType, multiply} from "mathjs";
import {NormalizeWithinPeriod, RadDiff2D} from "../JLibrary/angle/normalization";

const ORG = new THREE.Vector2(0, 0);
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

  public paused: boolean;
  // If is leader, ????
  // if you follow then maybe primarily follow leader, also give a limit to steering <--naturally by friction so just add friction then
  private leader: Boid | undefined;
  private isLeader: boolean = false;
  // goal direction???
  // private forward: Vector2[];

  // private qt: QuadTree;
  private world: World;
  // Context like a delegate, but actually a reference
  public static ctx: CanvasRenderingContext2D;

  static setCanvas(c: CanvasRenderingContext2D) {
    Boid.ctx = c;
  }

  // can this boid treat 1 and array the same...
  constructor(id: number, world: World, randomRange: number[]) {
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
    this.world = world;

    // automatically assume it's 0, 0, width then height
    this.randomRange = randomRange;
    let velRange = 10;
    this.velocity = new THREE.Vector2(Math.random() * velRange - (velRange/2), Math.random() * velRange - (velRange/2));
    this.acceleration = new THREE.Vector2(0, 0);

    // mark to draw/trace values of this boid
    this.mark = false;
    // Mark2: mouse hover to show green color : TODO fix when it doesn't seem to mark even when you hovered over
    this.markGreen = false;

    this.paused = false;
  }

  // Translate into walls
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

  flocking(rCanvas: R_Canvas) {
    let forceResult = this.threeForces();

    let alignment = forceResult[0];
    alignment.multiplyScalar(this.alignValue);

    let cohesion = forceResult[1];
    cohesion.multiplyScalar(this.cohesionValue);

    let separation = forceResult[2];
    separation.multiplyScalar(this.separateValue);
    this.forceResult = forceResult;

    // Draw force arrows based on magnitudes
    let arrowMagnitudes: number[] = [];
    ForEachArrayItem((item: THREE.Vector2) => {
      arrowMagnitudes.push(item.length());
    }, forceResult);
    let normalizedMagnitudes = NormalizeX(...arrowMagnitudes);
    for (let i = 0; i < 3; i++) {
      rCanvas.carrow(this.pos, forceResult[i], 40 * normalizedMagnitudes[i],
        {fillStyle: boidColors[i], debug: false, lineWidth: 2}
      );
    }

    // Add forces to acceleration
    this.acceleration.add(alignment);
    this.acceleration.add(separation);
    this.acceleration.add(cohesion);

    let direction: THREE.Vector2 = (this.acceleration.clone()).add(this.velocity);
    let traceRay: CRay = Vec2Ray(this.pos, this.pos.clone().add(direction));
    let xx = 0;//offset for texrt
    ForEachArrayItem((b: Boundary) => {
      let traceDone = castTrace(traceRay, b);
      if (traceDone[1]) {
        if (b.name != "mouseBoundary") {
          return;
        }
        let border = traceDone[0];
        let intersection = traceDone[1];
        let directionVector = intersection.clone().sub(this.pos);
        // let directionVector = traceDone[1].clone().sub(this.pos);
        // let intersection = this.pos.clone().add(directionVector).clone();// this == tRACEDONE

        let green = {fillStyle: "#31d08e", debug: false, lineWidth: 4};
        let green2 = {fillStyle: "#487a65", debug: false, lineWidth: 3};
        rCanvas.carrow(this.pos, directionVector, (directionVector).length(), green);
        let redThick = {fillStyle: "#d07931", debug: false, lineWidth: 19};
        let red = {fillStyle: "#d07931", debug: false, lineWidth: 7};
        let purple = {fillStyle: "#6c40d5", debug: false, lineWidth: 5};

        rCanvas.write("Intersect", traceDone[1].x, traceDone[1].y);
        let aAng = RAD2DEG * Algebra.GetRad(border.points[0].clone().sub(intersection)); //
        // I am thinking since these are 2 colliding forces, they ought to be 180 degrees apart.
        // Hence when this points to bottom left, the degrees are negative (-160) while towards the
        // same direction
        // borders are positive (+20)
        let bAng = RAD2DEG * Algebra.GetRad(directionVector);

        rCanvas.cPlate(intersection, directionVector, 25);
        rCanvas.clineo(intersection, border.points[0], redThick);
        rCanvas.clineo(intersection, this.pos, red);

        xx += 15;

        let d1 = NormalizeWithinPeriod(bAng-aAng, 0, 360);
        rCanvas.write(
          `BorderVec: ${aAng.toFixed(0)} `+
          `DirectionVec:${bAng.toFixed(0)} `+
          `Diff:${d1.toFixed(0)} D`, this.pos.x + 10, this.pos.y + 10 + xx);

        console.log(d1>180?360-d1:d1);
          let bottomFlap = Algebra.ProjectP(directionVector, 50, aAng - bAng);
          rCanvas.carrow(this.pos.clone().add(directionVector), bottomFlap, 50, green2);

        { // Same angle as boundary's angle at ray.
          //aAng - bAng
          let bottomFlap = Algebra.ProjectP(directionVector, 50,
            aAng - bAng
            -1* NormalizeWithinPeriod(180-d1, 0, 360)
        );
          rCanvas.carrow(this.pos.clone().add(directionVector), bottomFlap, 50, red);
        }
        {
          let leftover = aAng - bAng;
          if (leftover > 180) leftover -= 180;
          // console.log(leftover);

          let bottomFlap = Algebra.ProjectP(directionVector, 50,
            aAng - bAng+
          // will projectp work with negative angles...
            1*NormalizeWithinPeriod(180 -d1,0,360)
          // NormalizeWithinPeriod(-d1, 0, 360)
          );
          // console.log(NormalizeWithinPeriod(d1 , 0,360), NormalizeWithinPeriod(d1, 0, 360));
          rCanvas.carrow(this.pos.clone().add(directionVector), bottomFlap, 50, purple);
        }
      }
    }, this.world.boundaries);

    // draw bounce-off
    let bottomFlap = Algebra.ProjectP(direction, 50, -90);
    let diffX = this.pos.x - bottomFlap.x;
    let diffY = this.pos.y - bottomFlap.y;

    rCanvas.cline(this.pos.x, this.pos.y, this.pos.x - bottomFlap.x, this.pos.y - bottomFlap.y, //Args[0]
      {fillStyle: "#126cb4", debug: false, lineWidth: 3}
    );
    // let rad = Algebra.GetRad({x: diffX, y: diffY});
    let rad = Algebra.GetRad(traceRay.direction);

    // now draw this .... i guess its non skewing, and resize...
    let rotateFrame = [
      [Math.cos(rad), -Math.sin(rad), this.pos.x],
      [Math.sin(rad), Math.cos(rad), this.pos.y],
      [1, 1, 1]
    ];
    let leastX = -200;
    let leastY = -130;
    let mostY = 130;
    let l1 = multiply(rotateFrame, [leastX, leastY, 1]).flat();
    let l2 = multiply(rotateFrame, [200, leastY, 1]).flat();
    let l3 = multiply(rotateFrame, [200, mostY, 1]).flat();
    let l4 = multiply(rotateFrame, [leastX, mostY, 1]).flat();
    // let l1 = multiply(transpose([-50,0,1]), rotateFrame);
    // let l2 = multiply(transpose([200,0,1]), rotateFrame);
    // console.log(l1, l2);
    // rCanvas.cline(l1[0], l1[1], l1[0] - l2[0], l1[1] - l2[1], //Args[0]
    let boundaryLineStyle = {fillStyle: "#126cb4", debug: false, lineWidth: 3};
    let p1 = {x: MathTypeToNumber(l1[0]), y: MathTypeToNumber(l1[1])};
    let p2 = {x: MathTypeToNumber(l2[0]), y: MathTypeToNumber(l2[1])};
    let p3 = {x: MathTypeToNumber(l3[0]), y: MathTypeToNumber(l3[1])};
    let p4 = {x: MathTypeToNumber(l4[0]), y: MathTypeToNumber(l4[1])};
    rCanvas.clineo(p1, p2, boundaryLineStyle);
    rCanvas.clineo(p2, p3, boundaryLineStyle);
    rCanvas.clineo(p4, p3, boundaryLineStyle);
    rCanvas.clineo(p1, p4, boundaryLineStyle);
  }

  // avoidance
  avoidance() {
    // firstly you draw right bounce and left bounce
    // you need walls to represent rays


    // secondly you draw ball's max angle rotation per delta time, and rotate the velocity by that plus deceleration to avoid touching the wall...

    // if linetrace forwards finds an avoidance obstacle, traverse towards the reflected angle towards that
    // 180 - acos(dot(obstacle, direction)) is the angle, instead of moving forward move your magnitude towards turning direction over time?
    // can you do instantaneous velocity calculation?
  }

  findLeader() {
    // first: use existing leader
    // if (this.leader) {
    //   getAngle(this.leader.pos, this.pos)
    // }
    // second: find natural leader

    // Also make sure you might be a leader
    // frontal steer force?
    let dist = 70;

    let queryResult: Point[] = [];

    let rect = new D_Rect(...MidPointToBottomLeft(this.pos.x, this.pos.y, dist, dist));
    this.world.qt.query(rect, queryResult);
    let haveLeader = false;
    if (queryResult.length > 0) {
      // if anybody forward
    }
    if (haveLeader) {

    }
  }

  threeForces(): Vector2[] {
    // Alignment, Cohesion, Separation
    let perception = [180, 110, 55];
    let forces: Point[][] = []; // Boid
    let steering = [];

    // Add perception boxes, query results, and initiate steer direction
    for (let i = 0; i < perception.length; i++) {
      let rect = new D_Rect(...MidPointToTopLeftBoxTuple(this.pos.x, this.pos.y, perception[i], perception[i]));
      this.markShow();
      let queryResult: Point[] = [];
      this.world.qt.query((rect), queryResult);
      forces.push(queryResult);
      steering.push((new THREE.Vector2(0, 0)));
    }

    let addVelocity = (acc: THREE.Vector2, item: Boid) => acc.add(item.velocity);
    let addLocation = (acc: THREE.Vector2, item: Boid) => acc.add(item.pos);

    // Calculate steer direction for alignment
    if (forces[0].length > 1) {
      steering[0] = Accumulator(addVelocity, forces[0], (new THREE.Vector2(0, 0)));
      CLAMP_VEC2(steering[0], this.maxForce);

      steering[0].divideScalar((forces[0].length));
    }
    // steering[0].setLength(this.maxSpeed);

    // go toward center of flock!
    if (forces[1].length > 1) {
      let cohesiveForce = Accumulator(addLocation, forces[1], (new THREE.Vector2(0, 0)));

      steering[1] = cohesiveForce.divideScalar(forces[1].length);
      steering[1].sub(this.pos);
      CLAMP_VEC2(steering[1], this.maxForce);
    }
    // needs to be: strength inversely proportional to length???, cannot be linear, cannot be too strong

    // separation: distance to close boid, needs to be further away.......
    // Calculate steer direction for separation
    if (forces[2].length > 1) {
      // the force should be facing away
      steering[2] = Accumulator((acc: THREE.Vector2, item: Boid) => {
        // if too close, force is bigger: 5 / 1
        let separationForce = this.pos.clone().sub(item.pos);
        // console.log(separationForce, separationForce.length());
        // 30: length of 25 = very small force
        if (separationForce.length() != 0) {
          return acc.add(
            separationForce.multiplyScalar((8 / separationForce.length()))
          );
        } else {
          return acc;
        }
      }, forces[1], (new THREE.Vector2(0, 0)));
      // steering[2].divideScalar(forces[2].length);
      CLAMP_VEC2(steering[2], this.maxForce);
      // console.log("Total separation force", steering[2]);
    }
    return steering;
  }

  // actually not so interested in this.
//   runningAverage = [];
//   runningLength = 5;
//   runningSize = 0;
  update() {
    if (this.paused) {
      return;
    }
    this.pos.add(this.velocity);
    if (this.mark) {
      //console.log('this.vel', this.vel);
      //console.log('this.acc', this.acc);
    }
    // this.velocity.multiplyScalar(0.9);
    //try to add running average to velocity instead of acceleration directly...
    this.velocity.add(this.acceleration);

    // console.log(this.acceleration);
    CLAMP_VEC2(this.velocity, this.maxSpeed);
    this.wrapPosition();
    this.acceleration.set(0, 0);
    this.world.qt.remove(this);
    this.world.qt.insert(this);
  }

  markShow() {
    if (this.mark) {
      let rect = new D_Rect(
        this.pos.x - 20, this.pos.y - 20, 80, 80);
      rect.show(Boid.ctx);
    }
  }

  markDraw() {
    if (this.mark) {
      // markShow()
      Boid.ctx.fillText(`${(this.forceResult[0].x).toFixed(0)},${(this.forceResult[0].x).toFixed(0)}`, this.pos.x + 15, this.pos.y + 25);
      Boid.ctx.fillText(`${(this.forceResult[1].x).toFixed(0)},${(this.forceResult[1].x).toFixed(0)}`, this.pos.x + 15, this.pos.y + 35);
      Boid.ctx.fillText(`${(this.forceResult[2].x).toFixed(0)},${(this.forceResult[2].x).toFixed(0)}`, this.pos.x + 15, this.pos.y + 45);
      Boid.ctx.fillText(`${((this.pos.x).toFixed(0))},${(this.pos.y).toFixed(0)}`, this.pos.x + 15, this.pos.y + 15);
      Boid.ctx.fillStyle = "#4c2df7";
    } else if (this.markGreen) {
      Boid.ctx.fillStyle = "#35d994";
      this.markGreen = false;
    }
  }

  draw() {
    Boid.ctx.fillStyle = "#33ccff";
    this.markDraw();
    Boid.ctx.fillRect(
      ...MidPointToTopLeftBoxTuple(this.pos.x, this.pos.y, 8, 8)
    );
  }
}


export {
  Boid,

}
export type {}