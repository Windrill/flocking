import {CRay} from "../JLibrary/geometry/cray";
import {Boundary} from "../JLibrary/geometry/boundary";

interface MapStatic {
  getLines() : Boundary[];
}

class MappedRect implements MapStatic {
  //
  boundaries : Boundary[];

  constructor() {
    this.boundaries = [];
  }

  getLines() {
    // return lines....
    return this.boundaries;
  }
}


class Map {




  // map of ??? which is consisted of lines which can be traversible
}

export {
  MapStatic
}