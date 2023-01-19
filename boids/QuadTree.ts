import * as THREE from 'three'
import {D_Point, D_Rect} from "../JLibrary/functions/structures";
import {CObject} from "../JLibrary/geometry/Boundary";
import {ForEachObjectItem, ForEachObjectKey} from "../JLibrary/functions/functional";

/**
 * QuadPoint: Class with a location that can be a point or range added to a QuadTree
 *
 * Supports a point, or a rectangle.
 */
// I kind of want this to be internally managed but I can't define the boundaries easily so far...
  // quadpoint vs drect????
class QuadPoint extends CObject {
  // To represent point from rectangle: have the same point numbers
  pos: D_Rect;
  id: number;

  constructor(x: number, y: number, w = 0, h = 0) {
    super();
    this.pos = new D_Rect(x, y, w, h);
    this.id = QuadTree.tickId();
  }

  getLocation() {
    return {x: this.pos.x, y: this.pos.y};
  }
  getThreeVec() {
    return new THREE.Vector2(this.pos.x, this.pos.y);
  }

  add(other : QuadPoint) {
    this.pos.x += other.pos.x;
    this.pos.y += other.pos.y;
  }

  sub(other : QuadPoint) {
    this.pos.x -= other.pos.x;
    this.pos.y -= other.pos.y;
  }

  getId() {
    return this.id;
  }
}
// Conversion, so that 'points' can still have convenient pos indicators.
function Point2Quad(point : Point) {
  return new QuadPoint(point.pos.x, point.pos.y);
}


class Point extends CObject {
  id: number; // Boid numbering system for cross reference boids.

  // Why should you choose D_Rect over THREE.Vector2?
  // Maybe you want compatibility across QuadTrees.
  // To let Point fit in a QuadPoint.
  pos: THREE.Vector2;
  qtp: QuadPoint;

  constructor(id: number, x: number, y: number) {
    super();
    this.id = id;
    this.qtp = new QuadPoint(x, y);
    // TODO: replace this with something else
    this.pos = new THREE.Vector2(x, y);
  }

  // add all points: they will all be treated in the same way except pos...???!
  show(ctx: CanvasRenderingContext2D, {fillstyle} : {fillstyle : string}) {
    ctx.fillStyle = fillstyle;
    ctx.fillRect(this.qtp.getLocation().x, this.qtp.getLocation().y, 9, 9);
    //ctx.fillStyle = "#000000";
  }
}

class QuadTree {
  public isQuadTree : boolean;
  static capacity = 10;
  private boundary: D_Rect;
  private tr: QuadTree | undefined;
  private tl?: QuadTree;
  private br?: QuadTree;// | undefined;
  private bl?: QuadTree;// | undefined;
  private divided: boolean;

  private points: {
    // object's keys are string[]....
    // specifies index's type for object
    [index: number]: QuadPoint;
  };

  private static PointID: number = 0;

  static tickId() {
    return this.PointID++;
  }

  private static ID: number = 0;
  private id: number;

  constructor(boundary: D_Rect) {
    this.isQuadTree = true;
    // console.log("Quad tree instantiated");
    this.boundary = boundary;
    this.points = {};
    this.divided = false;
    this.id = QuadTree.ID++;
  }

  getBoundary() {
    return this.boundary;
  }

  subdivide() {
    let hw = this.boundary.width / 2;
    let hh = this.boundary.height / 2;
    let x = this.boundary.x + this.boundary.width / 2;
    let y = this.boundary.y + this.boundary.height / 2;
    // i wanted to multiply the width and height now w and h is twice the 'half width half height' crazy rectangel, but the code seems corrected
    // console.log("Boundary splitting: ", x, y, hw, hh);
    let tr = new D_Rect(x, y - hh, hw, hh);
    this.tr = new QuadTree(tr);
    let tl = new D_Rect(x - hw, y - hh, hw, hh);
    this.tl = new QuadTree(tl);
    let br = new D_Rect(x, y, hw, hh);
    this.br = new QuadTree(br);
    let bl = new D_Rect(x - hw, y + hh, hw, hh);
    this.bl = new QuadTree(bl);
    this.divided = true;
  }

  // looks like query got some problem
  // btw for 'found' don't do this, just have a new array returned
  query(bound: D_Rect, found: QuadPoint[] | null = null): QuadPoint[] {
    let returns = found ? found : [];
    // console.log("Total points ", this.points);
    if (this.boundary.intersects(bound)) {
      for (let i of Object.keys(this.points)) {
        if (bound.intersects(this.points[Number(i)].pos)) {
          returns.push(this.points[Number(i)]);
        } else {
          // console.log("noncontain:", this.points[Number(i)], bound);
        }
      }
      if (this.divided) {
        // @ts-ignore
        this.tr.query(bound, found);
        // @ts-ignore
        this.tl.query(bound, found);
        // @ts-ignore
        this.br.query(bound, found);
        // @ts-ignore
        this.bl.query(bound, found);
      }
    } else {
      // console.log("Out of bound check: ", this.boundary);
    }
    return returns;
  }

  removeAll(tempPoint: QuadPoint): boolean {
    if (!this.boundary.intersects(tempPoint.pos)) {
      return false;
    }

    for (let ob of Object.keys(this.points)) {
      if (this.points[Number(ob)].pos.intersects(tempPoint.pos)) {
        delete this.points[Number(ob)];
      }
    }
    if (this.divided) {
      // @ts-ignore
      return (this.tr.remove(tempPoint)) || this.tl.remove(tempPoint) || this.br.remove(tempPoint) || this.bl.remove(tempPoint);
    }
    return false;
  }

  // Looks like you already created the point, not doing alot of work here.
  insert(point: QuadPoint): QuadPoint | null {
    if (!this.boundary.intersects(point.pos)) {
      return null;
    }

    // console.log('where is insertion!', this.points, point.id);
    let mapLen = Object.keys(this.points).length;
    if (mapLen < QuadTree.capacity) {
      // let quadRect = new QuadPoint(point.x, point.y, point.width, point.height);
      this.points[point.id] = point;
      // this.points[quadRect.getId()] = quadRect;
      return point;
      // return quadRect;
    }
    // then if this id divided, points won't register and i'll have to push the points anyways?
    if (!this.divided) {
      this.subdivide();
    }
    if (this.tr) {
      let trRect = (this.tr.insert(point));
      if (trRect) {
        return trRect;
      }
    }
    if (this.tl) {
      let tlRect = this.tl.insert(point);
      if (tlRect) {
        return tlRect;
      }
    }
    if (this.br) {
      let brRect = this.br.insert(point);
      if (brRect) {
        return brRect;
      }
    }
    if (this.bl) {
      return (this.bl.insert(point));
    }
    return null;
  }

  show(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#000000";
    ctx.rect(this.boundary.x - this.boundary.width, this.boundary.y - this.boundary.width, this.boundary.width * 2, this.boundary.height * 2);
    ctx.stroke();

    if (this.divided) {
      // @ts-ignore
      this.tr.show(ctx);
      // @ts-ignore
      this.tl.show(ctx);
      // @ts-ignore
      this.br.show(ctx);
      // @ts-ignore
      this.bl.show(ctx);
    }
    // let mapLen = Object.keys(this.points).length;
    for (let i of Object.keys(this.points)) {
      let thisPoint = this.points[Number(i)];
      ctx.beginPath();
      ctx.fillStyle = "#000000";
      ctx.arc(thisPoint.pos.x, thisPoint.pos.y, 3, 0, 2 * Math.PI);
      // ctx.arc(i.x, i.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }


} // end class

export {
  Point,
  QuadTree,
  QuadPoint
}