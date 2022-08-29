import {CRay} from "./cray";
import {DEG2RAD} from "../JLibrary/functions/algebra";
import * as THREE from 'three'
import {ForEachArrayItem} from "../JLibrary/functions/functional";
import {R_Canvas} from "../JLibrary/canvas/canvas";
import {Boundary} from "./boundary";

class Particle {
  public pos: THREE.Vector2;
  private rays: any[];

  constructor() {
    this.pos = new THREE.Vector2(0, 0);
    this.rays = [];
    for (let i = 40; i < 80; i += 2) {
      let newRay = new CRay(this.pos, DEG2RAD * (i));
      newRay.drawDebug = false;
      this.rays.push(newRay);
    }
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

  castBoundaries(...args: Boundary[]) {
    let allRes: THREE.Vector2[] = [];
    // Need to be for each ray look at the nearest boundary
    ForEachArrayItem((ray: CRay) => {
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
    }, this.rays);
    return allRes;
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
}

export {
  Particle
}