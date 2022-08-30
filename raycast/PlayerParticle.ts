import {CRay} from "./cray";
import {Cartesian2Polar, DEG2RAD, Polar2Cartesian} from "../JLibrary/functions/algebra";
import * as THREE from 'three'
import {ArrayAlloc, ForEachArrayIndex, ForEachArrayItem} from "../JLibrary/functions/functional";
import {R_Canvas} from "../JLibrary/canvas/canvas";
import {Boundary} from "./boundary";
import {diag} from "mathjs";

class PlayerParticle {
  public pos: THREE.Vector2;
  private rays: any[];
  private rotation: number;

  constructor() {
    this.pos = new THREE.Vector2(0, 0);
    this.rays = [];
    this.rotation = 0;
    for (let i = -22.5; i < 22.5; i += 1) {
      let newRay = new CRay(this.pos, DEG2RAD * (i));
      newRay.drawDebug = false;
      this.rays.push(newRay);
    }
  }

  rotate(rot : number) {
    // for record purposes only
    this.rotation += rot;

    ForEachArrayItem((ray: CRay) => {
      let lolRandomP = Polar2Cartesian(1, rot);
      let newRot = Cartesian2Polar(ray.direction) + rot;
      let newDirection = Polar2Cartesian(1, newRot);
      // {x: ray.direction.x + lolRandomP.x, y: ray.direction.y + lolRandomP.y}
// ray.direction.normalize()
      ray.setDirection(new THREE.Vector2(newDirection.x, newDirection.y));
    console.log(ray.direction);
    }, this.rays);
  }


  setPos(pos: THREE.Vector2) {
    this.pos = pos;
    ForEachArrayItem((ray: CRay) => {
      ray.setPos(this.pos);
    }, this.rays);
  }

  draw(canvas: R_Canvas) {
    canvas.cpoint(this.pos);
    ForEachArrayItem((ray: CRay) => {
      ray.draw(canvas);
    }, this.rays);
  }

  // Let castBoundaries return the point, and the distance
  castBoundaries(...args: Boundary[]) {
    let allRes: THREE.Vector2[] = [];
    let allDistances: number[] = ArrayAlloc(this.rays.length);
    // Need to be for each ray look at the nearest boundary
    ForEachArrayIndex((rayI: number) => {
      let ray: CRay = this.rays[rayI];
      let closest = Infinity;
      let closestPoint = null;
      ForEachArrayItem((boundary: Boundary) => {
        let castRes = ray.cast(boundary);

        if (castRes) {
          let dist = castRes.distanceTo(this.pos);
          if (dist < closest) {
            closest = dist;
            closestPoint = castRes;
          }
        }
      }, args);

      if (closestPoint) {
        allRes.push(closestPoint);
      }
      allDistances[rayI] = closest;
    }, this.rays);
    return [allRes, allDistances];
  }

  // castBoundaries
  cast(boundary: Boundary) {
    let allRes: THREE.Vector2[] = [];
    ForEachArrayItem((ray: CRay) => {
      let castRes = ray.cast(boundary);
      if (castRes) {
        allRes.push(castRes);
      }
    }, this.rays);
    return allRes;
  }

  move(amount: number) {
    // this.pos.ad
    this.pos.add(Polar2Cartesian(amount, this.rotation));
  }
}

export {
  PlayerParticle
}