

class OpenNode {
  private isOpened : boolean;
  neighbors : OpenNode[]; // ???

  // position in map
  actualPosition : THREE.Vector2;

  // each node's accompanying shape.


  constructor() {
    this.isOpened = false;
    this.neighbors = [];
  }


  discover(map) {
    // cast rays to that map (uniformly for now) if that map is all convex then ok, otherwise return points that
    // are convex, and points that are not in convex shape
  }

  // draw? this  node's position in actual map.
}

// first step: do you start with a shape??? no...you startw ith nothing inside this graph

interface AStar {

  // astar's exploratioin queue: you first expand one node then you expand the others

  // neighbors
  getNeighbors();

  //
  search() {
    // starting point is the point. now you get neighbors from this pont....
  // from convex point does is matter which position you point towards
}
}