// import * as THREE from 'three'
import {D_Rect} from "../JLibrary/functions/structures";
import {CObject} from "../JLibrary/geometry/Boundary";

/**
 * QuadPoint: Class with a location that can be a point or range added to a QuadTree
 */
// This needs to support a location, or a range....
// I kind of want this to be internally managed but I can't define the boundaries easily so far...
class QuadPoint extends CObject {
  // I could have x & y the same to create a point.
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

  getId() {
    return this.id;
  }
}

class Point extends CObject {
  id: number; // Boid numbering system for cross reference boids.
  // pos: THREE.Vector2;
  qtp: QuadPoint;

  // boolean set manually so you can trace the path of a boid running around in canvas
  mark: boolean;

  // when your mouse rect hovers over, show green
  markGreen: boolean;

  constructor(id: number, x: number, y: number) {
    super();
    this.id = id;
    this.qtp = new QuadPoint(x, y);
    // this.pos = new THREE.Vector2(x, y);
    this.mark = false;
    this.markGreen = false;
  }

  // add all points: they will all be treated in the same way except pos...???!
  show(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#33ccff";
    if (this.markGreen) {
      ctx.fillStyle = "#35d994";
      this.markGreen = false;
    }
    ctx.fillRect(this.qtp.getLocation().x, this.qtp.getLocation().y, 9, 9);
    //ctx.fillStyle = "#000000";
  }
}

class QuadTree {
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
      // console.log("intersecting bounfary", this.id, Object.keys(this.points));
      for (let i of Object.keys(this.points)) {
        // if (bound.intersects(this.points[Number(i)].pos)) {
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

  removeAll(point: D_Rect): boolean {
    if (!this.boundary.intersects(point)) {
      return false;
    }
    for (let ob of Object.keys(this.points)) {
      if (Number(ob) == this.id) {
        delete this.points[Number(ob)];
        return true;
      }
    }
    if (this.divided) {
      // @ts-ignore
      return (this.tr.remove(point)) || this.tl.remove(point) || this.br.remove(point) || this.bl.remove(point);
    }
    return false;
  }

  // Changing to support a range
  insert(point: D_Rect): QuadPoint | null {
    if (!this.boundary.intersects(point)) {
      return null;
    }

    // console.log('where is insertion!', this.points, point.id);
    let mapLen = Object.keys(this.points).length;
    if (mapLen < QuadTree.capacity) {
      let quadRect = new QuadPoint(point.x, point.y, point.width, point.height);
      this.points[quadRect.getId()] = quadRect;
      // console.log('inserted point!', this.points, point.id);
      return quadRect;
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