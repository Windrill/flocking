import {Point, QuadTree} from "../boids/QuadTree";
import {D_Rect} from "../JLibrary/functions/structures";
import {ForEachArrayItem} from "../JLibrary/functions/functional";
// npm test

let testTree = new QuadTree(new D_Rect(0, 0, 800, 800));
testTree.insert(new Point(1, 100, 100));
testTree.insert(new Point(1, 100, 200));

describe('QuadTree Point', () => {
  test('Query Rectangle 1', () => {
    let foundResults: Point[] = [];
    testTree.query(new D_Rect(50, 50, 100, 100), foundResults);
    /*
        ForEachArrayItem((item:any)=>{
          console.log("Point:", item);
        }, foundResults);
    */
    expect(foundResults.length == 1);
    foundResults = [];
    testTree.query(new D_Rect(50, 50, 99, 99), foundResults);
    expect(foundResults.length == 0);
  });

  test('test2', () => {
    expect(true);
  });
})

