import {QuadPoint, QuadTree} from "../boids/QuadTree";
import {D_Rect} from "../JLibrary/functions/structures";
// npm test

let testTree = new QuadTree(new D_Rect(0, 0, 800, 800));
testTree.insert(new D_Rect(0, 0, 80, 80));
testTree.insert(new D_Rect(0, 0, 100, 200));
testTree.insert(new D_Rect(100, 100, 0, 0));

describe('QuadTree Point', () => {
  test('Query Point 1', () => {
    let foundResults: QuadPoint[] = [];
    testTree.query(new D_Rect(99, 99, 100, 100), foundResults);
    /*
        ForEachArrayItem((item:any)=>{
          console.log("Point:", item);
        }, foundResults);
    */
    expect(foundResults.length == 1);
    foundResults = [];
    testTree.query(new D_Rect(98, 98, 99, 99), foundResults);
    expect(foundResults.length == 0);
  });

  test('Query Rectangle 1', () => {
    let foundResults: QuadPoint[] = [];
    testTree.query(new D_Rect(79, 79, 100, 100), foundResults);
    expect(foundResults.length == 2);

  });
})

