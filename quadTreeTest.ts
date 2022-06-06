import {Point, QuadTree} from "./QuadTree";
import {D_Rect} from "./JLibrary/functions/structures";
import {ForEachArrayItem} from "./JLibrary/functions/functional";

// can't even test without modifying vite, sad : (
let testTree = new QuadTree(new D_Rect(0, 0, 800, 800));

testTree.insert(new Point(1, 100, 100));
// testTree.insert(new Point(1, 100, 200));
let foundResults : Point[] = [];
testTree.query(new D_Rect(50, 50, 100, 100), foundResults);

ForEachArrayItem((item:any)=>{
  console.log(item);
}, foundResults);