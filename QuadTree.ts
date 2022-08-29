import * as THREE from 'three'
// import {Boid} from "./boid";
import {D_Rect} from "./JLibrary/functions/structures";

// Loll....try to do point??? it's like a different point
class Point {
  id: number;
  pos: THREE.Vector2;// | THREE.Vector2[];
  // boolean set manually so you can trace the path of a boid running around in canvas
  mark: boolean;

  // when your mouse rect hovers over, show green
  mark2: boolean;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.pos = new THREE.Vector2(x, y);
    this.mark = false;
    this.mark2 = false;
  }

  // add all points: they will all be treated in the same way except pos...???!
  show(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#33ccff";
    if (this.mark2) {
      ctx.fillStyle = "#35d994";
      this.mark2 = false;
    }
    ctx.fillRect(this.pos.x, this.pos.y, 9, 9);
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
    [index: number]: Point;
  };
  private static ID: number = 0;
  private id: number;

  constructor(boundary: D_Rect) {
    // console.log("Quad tree instantiated");
    this.boundary = boundary;
    this.points = {};
    this.divided = false;
    this.id = QuadTree.ID++;
  }

  subdivide() {
    let hw = this.boundary.width / 2;
    let hh = this.boundary.height / 2;
    let x = this.boundary.x + this.boundary.width/2;
    let y = this.boundary.y + this.boundary.height/2;
    // i wanted to multiply the width and heigth now w and h is twice the 'half width half height' crazy rectangel, but the code seems corrected
    // console.log("Bundary splitting: ", x, y, hw, hh);
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
  query(bound: D_Rect, found: Point[]): Point[] {
    // let found = [];
    // console.log("Total points ", this.points);
    if (this.boundary.intersects(bound)) {
      // console.log("intersecting bounfary", this.id, Object.keys(this.points));
      for (let i of Object.keys(this.points)) {
        if (bound.contains(this.points[Number(i)].pos)) {
          found.push(this.points[Number(i)]);
        } else {
          // console.log("noncontain:", this.points[Number(i)], bound);
        }
      }
      if (this.divided) {
        this.tr.query(bound, found);
        this.tl.query(bound, found);
        this.br.query(bound, found);
        this.bl.query(bound, found);
      }
    } else {
      // console.log("Out of bound check: ", this.boundary);
    }
    return found;
  }

  remove(point: Point): boolean {
    if (!this.boundary.contains(point.pos)) {
      return false;
    }
    for (let ob of Object.keys(this.points)) {
      if (Number(ob) == this.id) {
        delete this.points[Number(ob)];
        return true;
      }
    }
    if (this.divided) {
      return (this.tr.remove(point)) || this.tl.remove(point) || this.br.remove(point) || this.bl.remove(point);
    }
    return false;
  }

  insert(point: Point): boolean {
    if (!this.boundary.contains(point.pos)) {
      return false;
    }

    // console.log('where is insertion!', this.points, point.id);
    let mapLen = Object.keys(this.points).length;
    //console.log("ready", mapLen);
    if (mapLen < QuadTree.capacity) {
      this.points[point.id] = point;
      // console.log('inseted point!', this.points, point.id);
      return true;
    } else {
      // then if this id divided, points won't register and i'll have to push the points anyways?
      if (!this.divided) {
        this.subdivide();
      }
      if (this.tr && this.tr.insert(point)) {
        return true;
      } else if (this.tl && this.tl.insert(point)) {
        return true;
      } else if (this.br && this.br.insert(point)) {
        return true;
      } else if (this.bl) return (this.bl.insert(point));
    }
    return false;
  }

  show(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#000000";
    ctx.rect(this.boundary.x - this.boundary.width, this.boundary.y - this.boundary.width, this.boundary.width * 2, this.boundary.height * 2);
    ctx.stroke();

    if (this.divided) {
      this.tr.show(ctx);
      this.tl.show(ctx);
      this.br.show(ctx);
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
  QuadTree
}