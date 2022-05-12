
function areaOfTriangle(a, b) {
  return a * b / 2;
}

function curve(minimumWeight, x) {

  // no fee if x is over the minimum
  if(x >= minimumWeight) return 0;

  // normalize the function so that the area under the curve between 0 and minimumWeight is 100
  // M * minimumWeight / 2 = 100 => M = 2 * 100 / minimumWeight
  const M = 200 / minimumWeight;

  // this function goes linearly from M to 0 as x goes from 0 to minimumWeight
  return M * (minimumWeight - x) / minimumWeight;
}

function fee(minimumWeight, oldWeight, newWeight) {

  // disregard the area under the curve above minimumWeight;
  if(oldWeight > minimumWeight) oldWeight = minimumWeight;

  // no fee in this case
  if(newWeight >= oldWeight) return 0;

  // area under the curve between oldWeight and minimumWeight
  const oldVolume = areaOfTriangle(minimumWeight - oldWeight, curve(minimumWeight, oldWeight));

  // area under the curve bewteen newWeight and minimumWeight
  const newVolume = areaOfTriangle(minimumWeight - newWeight, curve(minimumWeight, newWeight));

  // difference between triangles
  return newVolume - oldVolume;
}

// weights are all in percent

const minimumWeight = 10;
const oldWeight = 7;
const newWeight = 5;
const totalFee = fee(minimumWeight, oldWeight, newWeight);
console.log('total fee:', totalFee);
