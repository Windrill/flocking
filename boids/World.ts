// World Query
// Returns the closest distance to this ray
// if around 90 degrees then move left/right, < 90 then move right > 90 move left... add this after you visualize the collision
import {CRay} from "../JLibrary/geometry/CRay";
import {Boundary} from "../JLibrary/geometry/Boundary";
import {QuadTree} from "./QuadTree";
import {Vector2} from "three";

/**
 * Returns the object and the ray intersection location
 * @param ray
 * @param boundaries
 */
function castTrace(ray : CRay, boundaries : Boundary) : [Boundary, null | THREE.Vector2] {
  let closest = Infinity;
  let closestPoint = null;
  let castRay = ray.cast(boundaries);
    return [boundaries, castRay];
}

class World {
  public boundaries: Boundary[];
  public qt : QuadTree;

  constructor(boundaries : Boundary[], qt : QuadTree) {
    this.boundaries = boundaries;
    this.qt = qt;
  }

}

export {
  castTrace,
  World
}