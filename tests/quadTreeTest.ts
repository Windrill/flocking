import {Point, QuadTree} from "../boids/QuadTree";
import {D_Rect} from "../JLibrary/functions/structures";
import {ForEachArrayItem} from "../JLibrary/functions/functional";

// can't even test without modifying vite, sad : (
let testTree = new QuadTree(new D_Rect(0, 0, 800, 800));

testTree.insert(new Point(1, 100, 100));
// testTree.insert(new Point(1, 100, 200));
let foundResults : Point[] = [];
testTree.query(new D_Rect(50, 50, 100, 100), foundResults);

ForEachArrayItem((item:any)=>{
  console.log(item);
}, foundResults);


// let tree = new QuadTree(new D_Rect(0,0,800,800));
// tree.insert(new Point(0, 199,129));
// tree.insert(new Point(1, 227, 74));
// let queryResults : Point[]= [];
// tree.query(
//   MidPointToD_Rect(199,129,80,80), queryResults
// );
// console.log(queryResults);