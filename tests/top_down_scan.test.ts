import {SortNode, StringRepresentationInterface} from "../JLibrary/canvas/grid/sort_precedence";
import {StrIndexable} from "../JLibrary/functions/algebra";
import {ArrToString, BinarySearchNonUniform, ObjectEqual, ObjToString} from "../JLibrary/functions/array";
import {ForEachArrayIndex, ForEachArrayItem, ForEachObjectKey} from "../JLibrary/functions/functional";
import {QuadPoint, QuadTree} from "../JLibrary/canvas/structures/QuadTree";
import {D_Rect} from "../JLibrary/functions/structures";
import {number} from "mathjs";


// User defined.
class InteractionsCData {
  // quadTree, ySortTree, xSortTree
  spots : any[];
  constructor(dRect : D_Rect = new D_Rect(0, 0, 500, 500)) {
    this.spots = [];
    let compareNodeTopLeftDim = (dim: string) => (a: SortNode<CData>, b: CData): number =>
      a.nodeData.topLeft[dim] - b.topLeft[dim];
    let none = new CData(defaultFactory([0, 0]), defaultFactory([0, 0]));

    let quadTree = new QuadTree(dRect);
    let ySortTree = new SortNode<CData>(none, compareNodeTopLeftDim, ['y', 'x'], -1);
    let xSortTree = new SortNode<CData>(none, compareNodeTopLeftDim, ['x', 'y'], -1);
    ySortTree.optionalFactory = CDataFactory;
    xSortTree.optionalFactory = CDataFactory;
    this.spots.push(quadTree);
    this.spots.push(ySortTree);
    this.spots.push(xSortTree);
  }

  check(_point : StrIndexable) {
    // No width/height
    let pointData = new CData(_point, _point);
    let xx : SortNode<CData> = this.spots[1];
    // xx.sortedTree();
    let similarPoint = xx.searchData(pointData);
    // If tree has a pointt that starts at this point, check this point.
    if (ObjectEqual(similarPoint, _point)) {
      return true;
    }
    // Weird logic.
    // Wait you will be looking for Range!!! So...
    let quad : QuadTree = this.spots[0];
    // Hardcoded spacial representation
    let lookForward = new CData(_point.topLeft, _point.bottomRight);
    lookForward.topLeft.x += 1;
    lookForward.topLeft.y += 1;
    lookForward.bottomRight.x += lookForward.topLeft.x;
    lookForward.bottomRight.y += lookForward.topLeft.y;

    let pointResults = quad.query(lookForward.getDRect());
    if (pointResults.length > 1) {
      console.log("How come you have more than 1 point returned in a point map?");
      console.log(ArrToString(pointResults));
      return;
    }
    if (pointResults.length > 0) {
      console.log("Found this point belonging to a drect" + pointResults[0]);
      return false;
    }
    return true;
  }

  addPoint(data : CData) {
    const isQuadTree = (_s : any) : _s is QuadTree => true;
    const isNodeData = (_s : any) : _s is SortNode<CData> => true;

    ForEachArrayItem((s : any ) => {
      if (isQuadTree(s) && s.isQuadTree) {
        // console.log("QT adding ", data.toString());
        s.insert(new QuadPoint(data.getPoint()["x"], data.getPoint().y,
          data.bottomRight.x - data.topLeft.x, data.bottomRight.y - data.topLeft.y));
      } else if (isNodeData(s)) {
        s.add(data);
      }
    }, this.spots);
  }
/*
  look(startPoint : StrIndexable) {
    let yst : SortNode<CData> = this.spots[1];
    let xst : SortNode<CData> = this.spots[2];
    //
    let right = yst.find(startPoint);
    let br = xst.find(startPoint);
    let expandBox = expandBox() <- find the longer x. y is OK because you just found the soonest x (xst = same x, soonest y)
    // so for yst, since it's sorted by y, the next one is a bigger x
    // since xst is sorted by x, if x is the same you have the next y. if x is not the same you take the next x. which is like
    // flat box over tall box
    / **
     * . -----------------> | (is this yst or xst?)
     *
     *       .    .
     *       .    .
     *
     *
     * .                    |
     *   \                  |
     *    -->.    .         | i think this is xst.
     *       .    .         |
     *                      |
     *  --------------------
     * /
    }
  }*/

// This is specifically for 2D
  boxLoop(tempPoint: CData) : [CData[], CData[]] {
    let xst = this.spots[2];
    let yst = this.spots[1];
    let qt : QuadTree = this.spots[0];

    // is there a situation where temppoint is suupposed to be teh boundary?
    let closestDown = yst.findClosest(tempPoint, true);

// if closestdown equals current point, abort
    if (closestDown.equal(tempPoint)) {
      console.log("Couldnt find anything that has any spaces????");
    }
    // console.log(closestDown.toString());
    // let closestDown = xst.findClosest(tempPoint, false);
    let rightToThat = xst.findClosest(closestDown, false);
    // Box:  (x:0)(y:0)->(x:0)(y:0) (x:300)(y:200)->(x:200)(y:0) (x:500)(y:0)->(x:0)(y:0)
    console.log("Box: ",
      tempPoint.toString(), // topleft
      closestDown.toString(), //bottomleft
      rightToThat.toString()); // bottomright

    let newData = new CData(tempPoint.topLeft, closestDown.topLeft);
    let validNewSpace = [newData];


    let searchPoints : CData[] = [];
    console.assert(closestDown.topLeft.y == rightToThat.topLeft.y);
    // we use tempPoint's y because origin point is the tallest point on top.
    // i thought this is the rightmost point? so this is exapnded section
    // otherwise, it's the normal section. you originally have closestdown.topleft.x but you
    // can also keep the middle part, content of closestDown
    // let tentativeSearchTR = [rightToThat.topLeft.x, tempPoint.topLeft.y];
    let tentativeSearchTR = [closestDown.bottomRight.x, tempPoint.topLeft.y];
    // right
    let areaOccupied = qt.query(newData.getDRect());
    if (areaOccupied.length > 0) {
      validNewSpace = [];
      console.log("clearing all search points ", searchPoints);
      searchPoints = []; // is clearing all search points logical here?
    }

    // a boolean decision, since i don't have ability to query at a range yet.
    if (validNewSpace.length > 0 && rightToThat.topLeft.x > closestDown.topLeft.x) {
      let bottomRight = [rightToThat.topLeft.x, closestDown.topLeft.y];
      let bottomLeft = [tempPoint.topLeft.x, closestDown.topLeft.y];
      let expandedBox = new CData(tempPoint.topLeft, defaultFactory(bottomRight));
      let isEnlargedAreaAvailable = qt.query(expandedBox.getDRect());
      if (isEnlargedAreaAvailable) {
        validNewSpace = [expandedBox];
        // actually it shouldnt be the bottom right poiint, it should be the point to your right.
        searchPoints.push(new CData(defaultFactory(bottomLeft), defaultFactory([0,0])));
        tentativeSearchTR[0] = rightToThat.topLeft.x;
      } else {
        console.log("There isn't enough space to the right of your measured 'first obstacle' that has space");
      }
    }
    // for closedown, you need to find this bounding box's y.
    if (areaOccupied.length == 0) {
      let expandSpace = new CData(defaultFactory(tentativeSearchTR), defaultFactory([0,0]));
      searchPoints.push(expandSpace);
    }
    // need 0, 200 and 500, 0. for searchPoints
    console.log("Returning found points: ", validNewSpace, searchPoints);
    return [
      validNewSpace,
      searchPoints
      ];
  }
  // for each addition of a box, query all in the first and last line, if they match then update left & right for these points.
  // By default looks for 2 dimension
  box(startLocation: number[] = [0, 0]): CData[] {
    let tempPoint = new CData(defaultFactory(startLocation), defaultFactory(startLocation));
    let result : CData[] = [];
    let stack : CData[] = [];
    [result, stack] = this.boxLoop(tempPoint);
    let maxIterations = 20;
    let currIteration = 0;
    while (stack.length > 0 && currIteration++ < maxIterations) {
      let topPoint = stack.pop();
      if (!topPoint) {
        break;
      }
      let tresult : CData[] = [];
      let tstack : CData[] = [];
      [tresult, tstack] = this.boxLoop(topPoint);

      console.log("[while loop] Processing point: ", topPoint, " results ", tresult[0].toString());
      result = result.concat(tresult);
      // I think you won't find a loop, at most duplicate values.
      stack.push(...tstack);
    }
/*
   // Look right: if you hit something on the right, x = their start x, y = look down from there
   // if you didn't hit anything on the right that == 0,
   // Actually, need association between right, 0 and hitting function. Hard to see through the abstraction
   // in code but we could look at how to optimize the parser to achieve this.
   let hitRight = LookRight();
   let hitDown = lookDown();
   // how come i see 4 values gotten here. one to look down for the stretch of width
   // one to look down for the narrowest width as far as you can go starting from x=0. which means
   // you need to sort in multiple different ways.
   // i think you only satisfy look-right with the current graph, because you ort bby lookright=closest y value
   // that you can fit into the left.
   // why you look down when you lookright? because you want much right as possible, so you limit the down.
   if (hitRightt != maxBorder[0]) {
     // it means it's blocked. then just split into 2.
     searchStack.push(
       // can you change this to a DRect.
       hitRight.getRect.mainPoint.x + mainPoint.width,
       currentY
     );
   } else {
     // It's not directly blocked by another. so add the border
     result.push(
       new CData(
         current point,
         500, "top-y""==lookdown"
       )
     )
   }*/
    return result;
  }

}
/*
Assume that there are no 2 points that are exactly the same, because that's the correctness of the graph.
That's because you can't have 2 bboxes' startpoint the same, as long as they are not trivial size.
Hence, having binarysearch to false will only skip over your node yourself, and won't skip anything >=2?? No it will, because it's just 1 dimension
// now what will you do? y = 100, x=100,200,300. it means you just take something that's not you. actually this will
never happen because by definition you put all y=100 in the next layer. which means it's always in the next layer

root -> sortedTree[100]
              |
              v
              -> sortedTree [100,200,300] for sure they will not overlap.
this just means, you should put false in your thing. for >=. for <= use 5-1. assuming you correctly kept track of all ur dimensions
 */
// it means for n dimensions you have n copies of cdata for each point.
// Change this to DRect.
class CData implements StringRepresentationInterface<StrIndexable> {
  bottomRight: StrIndexable;
  topLeft: StrIndexable;

  constructor(topLeft: StrIndexable, bottomRight: StrIndexable) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
  }

  toString() {
    return `${ObjToString(this.topLeft)}->${ObjToString(this.bottomRight)}`;
  }

  // make this into your....point representation
  getPoint(): StrIndexable {
    return this.topLeft;
  }

  // A full set from strindexable
  setPoint(pt : StrIndexable) {
    ForEachObjectKey((p : string) => {
      this.topLeft[p] = pt[p];
    }, pt);
  }

  // D_Rect
  getDRect() : D_Rect {
    return new D_Rect(
      this.topLeft.x,
      this.topLeft.y,
      // In the end I needed this.
      this.bottomRight.x - this.topLeft.x,
      this.bottomRight.y - this.topLeft.y);
    }
}

let compareNodeTopLeftDim = (dim: string) => (a: SortNode<CData>, b: CData): number =>
  a.nodeData.topLeft[dim] - b.topLeft[dim];

let findCDataInArr = (arr: CData[], data: CData): boolean => {
  let arrIdx = -1;
  ForEachArrayIndex((i: number) => {
    if (arrIdx == -1 && ObjectEqual(arr[i], data)) {
      arrIdx = i;
    }
  }, arr);
  return arrIdx > -1;
};

  // retrieves the axes, x or y, and the < or > direcion
  // if can find out of bounds then -1 (user preparewith their own bounds)
  // no equal configured assumed all items are unique
// If exceed bounds then use graph's bounds
// first down finds the first rightwards rectangle....
function queryRight<T extends StringRepresentationInterface<any>>(node: SortNode<T>, curr: T, comparator: (x: SortNode<T>, y: T) => number) {
  // see if you have any nodes on this exact y. if you don't then -1
  let exactY = BinarySearchNonUniform<SortNode<T>, T>(node.sortedTree, curr, true, comparator);

  //@ts-ignore
  if (exactY >= 0 && exactY < node.sortedTree.length && compareNodeTopLeftDim('y')(node.sortedTree[exactY], curr)) {
    return queryDown<T>(node.sortedTree[exactY], curr, comparator);
    // there are actually 2 conditions. you are too low or you are too high above range.
  } else {
    return -1;
  }
}

// this can find the first downwards rectangle
function queryDown<T extends StringRepresentationInterface<any>>(node: SortNode<T>, curr: T, comparator: (x: SortNode<T>, y: T) => number) {
  let firstToR = BinarySearchNonUniform<SortNode<T>, T>(node.sortedTree, curr, false, comparator);
  if (firstToR == node.sortedTree.length) {
    return -1;
  }
  return firstToR;
}

function DownRectangle() {
  // lookright, iff lookright = -1, then find a downard motion. then start with y=that-y-location, x=0 with  next in stack
  // if lookright is valid then you find the node at that position, and use that as a rectangle, or scan further downards
  // to find the largest space available. then you add to stack the 2 cornders of the rectangle?
}

let lookMapping: StrIndexable = {
  //(node : SortNode<T>, curr : T, comparator : (x: SortNode<T>, y: T) => number)
  "right": queryRight,
  "down": queryDown
}
let defaultFactory = ([x, y]: number[]) => {
  return {
    x: x,
    y: y
  }
};

// do you want the order to include the sides???
function look<T extends StringRepresentationInterface<any>>(node: SortNode<T>, curr: T, comparator: (ord: string) => (x: SortNode<T>, y: T) => number, order: string[]) {
  // assert order has at least 2?
  // right, then...down...then...
  let debug = false;
// look at the next in order,
  let idx = 0;
  let lookAtFirst = lookMapping[order[0]];
  // it means that the next number is valid.
  // if (lookAtFirst(node, curr, comparator(order[0])) != currSortTree.length) {
  // }
  // TODO assert every point added is exactly x dimensions!!!!!
  let currNode: SortNode<T> = node;
  let nodeTree: SortNode<T>[] = []; // goes depth
  ForEachArrayIndex((_i: number) => {
    nodeTree.push(currNode);
    currNode = currNode.sortedTree[0];
  }, node.dimPrecedence);

  let foundOk = false;
  for (let i = 0; i < order.length; i++) {
    if (lookMapping[order[i]](node, curr, comparator(order[i])) != nodeTree[i].sortedTree.length) {
      foundOk = true;
      break;
    }
  }
  // if it's not valid then i should move to the next lookat?
  // Assuming sortnode is  ordered from Left to Right!! Actually you should rename this. look 'inc/dec in priority'
  ForEachArrayItem((o: string) => {
    // y, x.
    let firstToR = BinarySearchNonUniform<SortNode<T>, T>(node.sortedTree, curr, true, comparator(o));

  }, order);
}

function CDataFactory() : CData {
  return new CData(defaultFactory([0, 0]), defaultFactory([0, 0]));
}

// Equal comparator... that javascript still doesn't have
let CDataComp = (a: CData, b: CData) : boolean => {
  console.log("Equalling : ", ObjectEqual(a.bottomRight, b.bottomRight), ObjectEqual(a.topLeft, b.topLeft), ObjectEqual(a.bottomRight, b.bottomRight) && ObjectEqual(a.topLeft, b.topLeft));
  console.log("source data: ", a.toString(), b.toString());
  return ObjectEqual(a.bottomRight, b.bottomRight) && ObjectEqual(a.topLeft, b.topLeft);
};

/**
 * Staircase points:
 * (300, 30) -> (400, 60)
 * (200, 60) -> (400, 90)
 * (100, 90) -> (400, 100)
 * Significant (recorded) points:
 * Y: 30, 60, 90
 * X: 300, 200, 100
 */
let makeStaircaseNode = () => {
  let p1 = new CData(defaultFactory([300, 30]), defaultFactory([400, 60]));
  let p2 = new CData(defaultFactory([200, 60]), defaultFactory([400, 90]));
  let p3 = new CData(defaultFactory([100, 90]), defaultFactory([400, 100]));

  let defaultOrder = ['y', 'x'];
  let none = new CData(defaultFactory([0, 0]), defaultFactory([0, 0]));

  let graph = new SortNode<CData>(
    none,
    compareNodeTopLeftDim,
    defaultOrder, -1);
  graph.add(p1);
  graph.add(p2);
  graph.add(p3);
  // bounds: 500, 100
  return graph;
}
let noCData = new CData(defaultFactory([0, 0]), defaultFactory([0, 0]));
describe('xx', ()=> {
  test('a', ()=> {

    // Check that 'non-truthy' values are still valid comparisons
    let zeroA = {
      x: 0,
      y: 0
    };
    let zeroB = {
      x: 0,
      y: 0
    };
    expect(ObjectEqual(zeroA, zeroB)).toBe(true);
  });
});

describe('Top Down Scan', () => {
  test('Testing adding 2 points to graph', () => {
    let defaultOrder = ['y', 'x'];

    let p1 = new CData(defaultFactory([400, 30]), defaultFactory([450, 60]));
    let p2 = new CData(defaultFactory([450, 30]), defaultFactory([500, 90]));
    let graph = new SortNode<CData>(noCData, compareNodeTopLeftDim, defaultOrder, -1);
    graph.add(p1);
    graph.add(p2);
    expect(graph.sortedTree.length).toBe(1);
    // make sure this is also correct......
    expect(CDataComp(graph.sortedTree[0].nodeData, p1)).toBe(true);
    expect(CDataComp(graph.sortedTree[0].sortedTree[1].nodeData, p2)).toBe(true);
    expect(graph.sortedTree[0].sortedTree.length == 2).toBe(true);
  });

  test("yst vs xst", ()=> {
    let boundaries = {'x': 600, 'y': 600};
    let yst = new SortNode<CData>(noCData, compareNodeTopLeftDim, ['y', 'x'], -1, boundaries);
    let xst = new SortNode<CData>(noCData, compareNodeTopLeftDim, ['x', 'y'], -1, boundaries);
    yst.optionalFactory = CDataFactory;
    xst.optionalFactory = CDataFactory;
    let points : CData[] = [
      new CData(defaultFactory([100,100]), defaultFactory([0,0])), // a == 0
      new CData(defaultFactory([400,200]), defaultFactory([0,0])), // b == 1
      new CData(defaultFactory([500,100]), defaultFactory([0,0])), // c == 2
      new CData(defaultFactory([300,300]), defaultFactory([0,0])),
      new CData(defaultFactory([200,400]), defaultFactory([0,0])),
      new CData(defaultFactory([300,500]), defaultFactory([0,0])) // shouldnt influence anything
    ];
    ForEachArrayItem((p : CData) => {
      yst.add(p);
      xst.add(p, true);
    }, points);
    /**
     *  a   c
     *     b
     *    d
     *   b
     */
    let xBoundary = new CData(defaultFactory([600, 0]), defaultFactory([0, 0]));
    let yBoundary = new CData(defaultFactory([0, 600]), defaultFactory([0, 0]));
    // this is 'find closest'
    expect(CDataComp(xst.findClosest(points[0], false), xBoundary)).toBe(true);
    // shouldn't realy be this.
    // expect(CDataComp(xst.findClosest(points[0], true), points[1])).toBe(true);

    expect(CDataComp(yst.findClosest(points[2], false), yBoundary)).toBe(true);
    expect(CDataComp(yst.findClosest(points[2], true), points[1])).toBe(true);
    expect(CDataComp(yst.findClosest(points[0]), points[2])).toBe(true);
    // b (4) is left of c (2) but it doesn't matter for me for now, since the rest of the box is still valid?
    // if it ends before, then it does mean you actually have more space potentially.
    // hence if you do a YST first search, you'll have an error
    // this actually intends to not work because this is actually yst's job --> to look for anything on the down side, after this is rightmost.
    // expect(CDataComp(xst.findClosest(points[2]), points[4])).toBe(true);
  });

  test("", ()=> {
    // yst.find(0,0_ = 500, 0);
  });

  test('Testing how the graph sorts points: by y then x axis.', () => {
    let staircaseGraph = makeStaircaseNode();
    let pointToRight = new CData(defaultFactory([400, 30]), defaultFactory([450, 60]));
    let pointToRight1 = new CData(defaultFactory([400, 60]), defaultFactory([450, 90]));
    let pointToRight2 = new CData(defaultFactory([400, 90]), defaultFactory([450, 100]));
    staircaseGraph.add(pointToRight);
    staircaseGraph.add(pointToRight1);
    staircaseGraph.add(pointToRight2);
    // All points:
    // console.log(staircaseGraph.toString());
    expect(staircaseGraph.sortedTree.length).toBe(3);
    expect(staircaseGraph.sortedTree[0].sortedTree.length).toBe(2);
    expect(CDataComp(staircaseGraph.sortedTree[0].sortedTree[1].nodeData, pointToRight)).toBe(true);
    expect(staircaseGraph.sortedTree[1].sortedTree.length).toBe(2);
    expect(CDataComp(staircaseGraph.sortedTree[1].sortedTree[1].nodeData, pointToRight1)).toBe(true);
    expect(staircaseGraph.sortedTree[2].sortedTree.length).toBe(2);
    expect(CDataComp(staircaseGraph.sortedTree[2].sortedTree[1].nodeData, pointToRight2)).toBe(true);
  });

  // let p1 = new CData(defaultFactory([300, 30]), defaultFactory([400, 60]));
  // let p2 = new CData(defaultFactory([200, 60]), defaultFactory([400, 90]));
  // let p3 = new CData(defaultFactory([100, 90]), defaultFactory([400, 100]));
  test('Testing lookdown & lookright', () => {
    let staircaseGraph = makeStaircaseNode();
    // Right of 0, 0
    let currPoint = new CData(defaultFactory([0, 0]), defaultFactory([0, 0]));
    // looks like for searching, cdata only needs the starting point!!
    // it'll returne undefined for many points because it only checks for corners of certain rectangles
    // but... the y is matching for this....why doesnt it find 300, 30
    let anotherPoint = new CData(defaultFactory([200, 30]), defaultFactory([0, 0]));
    let rightIndex = queryRight<CData>(staircaseGraph, currPoint, compareNodeTopLeftDim('x'));
    // i think you'll find some... 500, 0 which is -1
    let rightIndex2 = queryRight<CData>(staircaseGraph, anotherPoint, compareNodeTopLeftDim('x'));
    // i want to find the point 300, 30.

    console.log("Right of point 0, 0:", rightIndex);
    console.log("Right of point 200, 30:", rightIndex2);
    let downIndex = queryDown<CData>(staircaseGraph, currPoint, compareNodeTopLeftDim('y'));
    // 0, 500
    let downIndex2 = queryDown<CData>(staircaseGraph, anotherPoint, compareNodeTopLeftDim('y'));
    // 200, 60

    console.log("Down of point 0, 0:", downIndex);
    console.log("Down of point 200, 30:", downIndex2);
  });

  test ('bst', () => {
    let aa = [0,1];
    let foundIndex = BinarySearchNonUniform<number, number>(
      aa,
      0,
      false,
      (b: number, a: number)=>{return b-a;});
    expect(foundIndex).toBe(1);
  })

  /*
      root(-1):  (x:0)(y:0)->(x:0)(y:0)
    	tree: y: (x:300)(y:200)->(x:200)(y:0)
    	tree: x: (x:300)(y:200)->(x:200)(y:0)
    	tree: y: (x:200)(y:300)->(x:100)(y:100)
    	tree: x: (x:200)(y:300)->(x:100)(y:100)
    	tree:
   */
  test('Add yst 2', ()=> {
    let none = new CData(defaultFactory([0, 0]), defaultFactory([0, 0]));
    let p1 = new CData(defaultFactory([200, 300]), defaultFactory([100, 100]));
    let p2 = new CData(defaultFactory([300, 200]), defaultFactory([200, 0]));
    let defaultOrder = ['y', 'x'];
    let graph = new SortNode<CData>(
      none,
      compareNodeTopLeftDim,
      defaultOrder, -1);

    graph.add(p1, true);
    graph.add(p2, true);
    console.log(graph.toString());

  });
  test('Trying to scan all significant points', () => {
    /*
    Points:
    100, 100 to 200, 300
    200, 0 to 300, 200
    find 200, 100 places
     */
    // How to define boundaries??
    let none = new CData(defaultFactory([0, 0]), defaultFactory([0, 0]));
    // By absolute pixels instead of width/height offset
    let p1 = new CData(defaultFactory([200, 300]), defaultFactory([300, 400]));
    let p2 = new CData(defaultFactory([300, 200]), defaultFactory([500, 300]));

    /*
    Resulting boxes of all available spaces:
    0, 0 -> 200, 100
    0, 0 -> 100, 500
    0, 200 -> 500, 500
    300, 0 -> 500, 500
     */
    let b1 = new CData(defaultFactory([1, 1]), defaultFactory([200, 100]));
    let b2 = new CData(defaultFactory([1, 1]), defaultFactory([200, 500]));
    let b3 = new CData(defaultFactory([0, 200]), defaultFactory([500, 500]));
    let b4 = new CData(defaultFactory([300, 0]), defaultFactory([500, 500]));

    let customLogic = new InteractionsCData();
    customLogic.addPoint(p1);
    customLogic.addPoint(p2);

    // console.log(`YST: ${customLogic.spots[1].toString()}`);
    // console.log(`XST: ${customLogic.spots[2].toString()}`);

    let allAvailablePoints: CData[] = customLogic.box();
    expect(findCDataInArr(allAvailablePoints, b1)).toBe(true);
    expect(findCDataInArr(allAvailablePoints, b2)).toBe(true);
    expect(findCDataInArr(allAvailablePoints, b3)).toBe(true);
    expect(findCDataInArr(allAvailablePoints, b4)).toBe(true);
  });
});