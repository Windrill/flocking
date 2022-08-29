import * as THREE from 'three'
import {R_Canvas} from "../JLibrary/canvas/canvas";
import {ORG2} from "../JLibrary/r_three";

// jlibrary->rthree
class Boundary {
  points : THREE.Vector2[];
  constructor() {
    this.points = [ORG2, ORG2];
  }

  set(x: THREE.Vector2, y: THREE.Vector2) {
    this.points = [x, y];
  }

  draw(canvas : R_Canvas) {
    canvas.cline(this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y);
  }
}

export {
  Boundary
}