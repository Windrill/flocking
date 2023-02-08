import {Point, QuadPoint} from "../JLibrary/canvas/structures/QuadTree";
import * as THREE from 'three';
import {Vector2} from 'three';
import {
  Algebra, CAngle, Cartesian2Polar,
  DEG2RAD,
  GetDoubleSidedDegreee,
  Polar2Cartesian,
  RAD2DEG,
  WRAP
} from "../JLibrary/functions/algebra";
import {Accumulator, ForEachArrayItem} from "../JLibrary/functions/functional";
import {
  D_Rect,
  MidPointToBottomLeft,
  MidPointToTopLeftBoxTuple,
  NormalizeX, Quackable, QuackingV2
} from "../JLibrary/functions/structures";
import {R_Canvas} from "../JLibrary/canvas/canvas";
import {CLAMP_VEC2} from "../JLibrary/r_three";
import {castTrace, World} from "./World";
import {MathTypeToNumber, Vec2Ray} from "../JLibrary/geometry/Conversions";
import {Boundary} from "../JLibrary/geometry/Boundary";
import {CRay} from "../JLibrary/geometry/CRay";
import {MathType, multiply} from "mathjs";
import {AngleDiff, NormalizeWithinPeriod, RadDiff2D} from "../JLibrary/angle/normalization";

const ORG = new THREE.Vector2(0, 0);
let boidColors = [
  "#d95252",
  "#47af4f",
  "#d7cb69",
  "#f89c34"
];

let TickLocGen = (pt : Quackable, addable : Quackable) => {
  let ptCounter = pt;
  let adding = () => {
    ptCounter.x += addable.x;
    ptCounter.y += addable.y;
    return ptCounter;
  }
  return adding;
}
// QuadPoint should indicate this has a positional aspect that is queryable.
class Boid extends QuadPoint {
  // These are, pure vectors
  private acceleration: THREE.Vector2;
  private velocity: THREE.Vector2;
  private forceResult: Vector2[];

  private maxForce: number;
  private maxSpeed: number;
  private randomRange: number[];
  private separateValue: number;
  private cohesionValue: number;
  private alignValue: number;

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


  // boolean set manually so you can trace the path of a boid running around in canvas
  // when your mouse rect hovers over, show green
  private mark : boolean;
  public markGreen : boolean;
  private markLogic : ()=> {fillStyle: string};

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
    this.markLogic = () => {
      if (this.markGreen) {
        return {fillStyle: "#35d994"}
      }
      return {fillStyle: "#33ccff"}
    }
  }

  // Translate into walls
  wrapPosition() {
    this.pos.x = WRAP(this.getLocation().x, 0, this.randomRange[0]);
    this.pos.y = WRAP(this.getLocation().y, 0, this.randomRange[1]);
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
      rCanvas.carrow(this.getLocation(), forceResult[i], 40 * normalizedMagnitudes[i],
        {fillStyle: boidColors[i], debug: false, lineWidth: 2}
      );
    }

    // Add forces to acceleration
    this.acceleration.add(alignment);
    this.acceleration.add(separation);
    this.acceleration.add(cohesion);

    let direction: THREE.Vector2 = (this.acceleration.clone()).add(this.velocity);
    let traceRay: CRay = Vec2Ray(this.getLocationTHREEJS(), this.getLocationTHREEJS().clone().add(direction));
    let locTick = TickLocGen({
      x:this.getLocation().x,
      y:this.getLocation().y
    }, {x:0,y:15});

    ForEachArrayItem((b: Boundary) => {
      // Temporary: if not hitting mouse, don't draw yet.
      if (b.name != "mouseBoundary") {
        return;
      }
      let [border, intersection] = castTrace(traceRay, b);
      let [borderFrom, borderTo] = [border.points[0], border.points[1]];
      if (!intersection) {
        return;
      }

      let brightGreen = {fillStyle: "#31d08e", debug: false, lineWidth: 4};
      let darkGreen = {fillStyle: "#365c4c", debug: false, lineWidth: 3};
      let redThick = {fillStyle: "#d03131", debug: false, lineWidth: 19};
      let orange = {fillStyle: "#d07931", debug: false, lineWidth: 7};
      let purple = {fillStyle: "#6c40d5", debug: false, lineWidth: 5};

      // values are mostly correct after verifying using console.log
      let doubleBorderAngles = GetDoubleSidedDegreee(borderTo, borderFrom);


      let CoordinateToDirection = (coord : QuackingV2) => {
        return {
          x: coord.x,
          y: -coord.y
        }
      };
      // it was easy to mix up direction and actual x,y coordinates. so you need to change this getrad y * -1 into a
      // data structure that converts directions into xy coordinates.
      let traceBounceAngle = RAD2DEG*Cartesian2Polar(
        // this is to represent the bouncing back angle! the equal and opposite reaction lol
        // so it's a custom angle, to anble the negative x.
        {
          x: -traceRay.direction.x,
          // as for y, original is -y so - of -y is +y
        y: traceRay.direction.y}
      );

      // x and y needs to be in order so you have to-from, instead of reordering them due to sign.
      let boundaryAngle = RAD2DEG*Cartesian2Polar({
        x: borderTo.x - borderFrom.x,
        y: borderTo.y - borderFrom.y
      }, true);
      let relativeBounceAngle : CAngle = Algebra.ConvertBasis(new CAngle(traceBounceAngle), boundaryAngle)
      let ninetyMinus = (x: number) => 90 - x;
      // does angle diff follow strictly ccw and cw?
      // AngleDiff()
      let nn : number = (relativeBounceAngle.angle > 0 ? 90 : -90); // also need o check out basis i guess.....but it should be 0.
      // have a basis normalization angle?? lol. funny bc its already built into the constructor
      let sameSideNinety = (relativeAngle : number) => relativeAngle < 0  ? -90-relativeAngle : 90-relativeAngle;
      let basisNinetyAdd = (basis : number, relativeAngle : number) => basis < 0  ?-90+relativeAngle : 90+relativeAngle;
      // the x and y that are 90 degrees and 180 degrees based on the intersection
      // let axisAngle = ninetyMinus( relativeBounceAngle.angle);
      let axisAngle = sameSideNinety( relativeBounceAngle.angle);
      let newAngle = basisNinetyAdd(relativeBounceAngle.basis, axisAngle);

      // relative to boundary angle
      rCanvas.writeo(`TraceRay:${traceBounceAngle.toFixed(1)}`, locTick());
      rCanvas.writeo(`Relative:${relativeBounceAngle}`, locTick());
      rCanvas.writeo(`SameSideNinety:${axisAngle} BA: ${boundaryAngle.toFixed(1)}, nn:${nn.toFixed(1)}; total:${(axisAngle + nn + boundaryAngle).toFixed(1)}`, locTick());
      rCanvas.writeo(`Now:${newAngle}`, locTick());
      rCanvas.writeo(`Distance-90-to-relative:${axisAngle.toFixed(1)}`, locTick());

      rCanvas.carrow(intersection, Polar2Cartesian(1,
        NormalizeWithinPeriod(axisAngle + nn + boundaryAngle) * DEG2RAD, true), 30, purple);

      let directionVector = intersection.clone().sub(this.getLocationTHREEJS());
      let directionVectorOppo = this.getLocationTHREEJS().clone().sub(intersection);

      let frameOfReferenceAngle = Algebra.GetRad(borderFrom.clone().sub(borderTo)) * RAD2DEG;
      let frameOfReferenceAngleOppo = Algebra.GetRad(borderTo.clone().sub(borderFrom)) * RAD2DEG;
      let normalizeOpposite = NormalizeWithinPeriod(frameOfReferenceAngle - frameOfReferenceAngleOppo, -360, 360);
      console.assert(Algebra.Approx(Math.abs(normalizeOpposite), 180));

      rCanvas.clineo(intersection, this.getLocation(), brightGreen);
    }, this.world.boundaries);

    // draw bounce-off
    let bottomFlap = Algebra.ProjectP(direction, 50, -90);
    let diffX = this.getLocation().x - bottomFlap.x;
    let diffY = this.getLocation().y - bottomFlap.y;

    rCanvas.cline(this.getLocation().x, this.getLocation().y, this.getLocation().x - bottomFlap.x, this.getLocation().y - bottomFlap.y,
      {fillStyle: "#126cb4", debug: false, lineWidth: 3}
    );
    let rad = Algebra.GetRad(traceRay.direction);

    // now draw this .... i guess its non skewing, and resize...
    let rotateFrame = [
      [Math.cos(rad), -Math.sin(rad), this.getLocation().x],
      [Math.sin(rad), Math.cos(rad), this.getLocation().y],
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
    //   getAngle(this.leader.pos, this.getLocation())
    // }
    // second: find natural leader

    // Also make sure you might be a leader
    // frontal steer force?
    let dist = 70;

    let queryResult: QuadPoint[] = [];

    let rect = new D_Rect(...MidPointToBottomLeft(this.getLocation().x, this.getLocation().y, dist, dist));
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
    let perceptionRadius = [180, 110, 55];
    // These, are also forces.
    let forces: THREE.Vector2[][] = []; // Boid
    let steering : THREE.Vector2[] = [];

    // Add perception boxes, query results, and initiate steer direction
    for (let i = 0; i < perceptionRadius.length; i++) {
      let rect = new D_Rect(...MidPointToTopLeftBoxTuple(this.getLocation().x, this.getLocation().y, perceptionRadius[i], perceptionRadius[i]));
      this.markShow();
      let queryResult: QuadPoint[] = [];
      this.world.qt.query((rect), queryResult);

      let appliedForces : THREE.Vector2[] = [];
      ForEachArrayItem((query : QuadPoint) => {
        appliedForces.push(query.getLocationTHREEJS());
      }, queryResult);
      forces.push(appliedForces);
      steering.push((new THREE.Vector2(0, 0)));
    }

    // let addVelocity = (acc: THREE.Vector2, item: Boid) => acc.add(item.velocity);
    // let addLocation = (acc: THREE.Vector2, item: Boid) => acc.add(item.getThreeVec());
    let addForces = (a : THREE.Vector2, b: THREE.Vector2) => a.add(b);
    // Calculate steer direction for alignment
    if (forces[0].length > 1) {
      steering[0] = Accumulator(addForces, forces[0], (new THREE.Vector2(0, 0)));
      CLAMP_VEC2(steering[0], this.maxForce);

      steering[0].divideScalar((forces[0].length));
    }
    // steering[0].setLength(this.maxSpeed);

    // go toward center of flock!
    if (forces[1].length > 1) {
      let cohesiveForce = Accumulator(addForces, forces[1], (new THREE.Vector2(0, 0)));
      steering[1] = cohesiveForce.divideScalar(forces[1].length);
      steering[1].sub(this.getLocationTHREEJS());
      CLAMP_VEC2(steering[1], this.maxForce);
    }
    // needs to be: strength inversely proportional to length???, cannot be linear, cannot be too strong

    // separation: distance to close boid, needs to be further away.......
    // Calculate steer direction for separation
    if (forces[2].length > 1) {
      // the force should be facing away
      //item: Boid
      steering[2] = Accumulator((acc: THREE.Vector2, item : THREE.Vector2) => {
        // if too close, force is bigger: 5 / 1
        let separationForce = this.getLocationTHREEJS().clone().sub(item);
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
    this.pos.x += this.velocity.x;
    this.pos.y += this.velocity.y;

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
    this.world.qt.removeAll(this);
    this.world.qt.insert(this);
  }

  markShow() {
    if (this.mark) {
      let rect = new D_Rect(
        this.getLocation().x - 20, this.getLocation().y - 20, 80, 80);
      rect.show(Boid.ctx);
    }
  }

  markDraw() {
    if (this.mark) {
      // markShow()
      Boid.ctx.fillText(`${(this.forceResult[0].x).toFixed(0)},${(this.forceResult[0].x).toFixed(0)}`, this.getLocation().x + 15, this.getLocation().y + 25);
      Boid.ctx.fillText(`${(this.forceResult[1].x).toFixed(0)},${(this.forceResult[1].x).toFixed(0)}`, this.getLocation().x + 15, this.getLocation().y + 35);
      Boid.ctx.fillText(`${(this.forceResult[2].x).toFixed(0)},${(this.forceResult[2].x).toFixed(0)}`, this.getLocation().x + 15, this.getLocation().y + 45);
      Boid.ctx.fillText(`${((this.getLocation().x).toFixed(0))},${(this.getLocation().y).toFixed(0)}`, this.getLocation().x + 15, this.getLocation().y + 15);
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
      ...MidPointToTopLeftBoxTuple(this.getLocation().x, this.getLocation().y, 8, 8)
    );
  }
}


export {
  Boid,

}
export type {}