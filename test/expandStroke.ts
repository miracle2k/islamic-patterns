import {calculatePointsAt} from "../scripts/patterns/expandStroke";
import {makeCordoba} from "../scripts/patterns/makeCordoba";


function simple() {
  const x = calculatePointsAt(
      [[0, 0], [20, 20]],
      1,
      [
        [[20, 0], [20, 20]],
        [[20, 40], [20, 20]],
        [[40, 20], [20, 20]],
      ]
  );
  console.log('getPoints.first', x.first)
  console.log('getPoints.second', x.second)
}

function foo() {
  const x = calculatePointsAt(
      [
        [100, 91.42135620117188],
        [50, 70.71067810058594],
      ],
      1,
      makeCordoba().lines
  );
  console.log('getPoints.first', x.first) //  [ 50, 71.7930679321289 ]
  console.log('getPoints.second', x.second)  //  [ 50, 69.62828826904297 ]
}

function foo2() {
  const x = calculatePointsAt(
      [
        [50, 29.289321899414062],
        [0, 8.578643798828125]
      ],
      1,
      makeCordoba().lines
  );
  console.log('getPoints.first', x.first) // [ 0, 8.578643798828125 ]
  console.log('getPoints.second', x.second)  //  [ 0, 8.578643798828125 ]
}

foo2();