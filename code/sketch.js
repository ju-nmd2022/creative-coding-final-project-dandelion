let yoff = 0;
let seed = 5;
let growth = 0;
let maxGrowth = 50;
let a = 50; // Used for the shape
let scaleFactor = 10; // Scale down the shape to fit the branches

function setup() {
  createCanvas(800, 400);
  frameRate(60);
}

function draw() {
  background(111, 148, 96);
  fill(0);
  stroke(0);
  translate(width / 2, height);
  yoff += 0.005;
  randomSeed(seed);

  if (growth < maxGrowth) {
    growth += 0.1; // Slowly increase growth, 0.1 is the effect I want
  }
  branch(growth, 0);
}

function mousePressed() {
  yoff = random(1000);
  seed = millis(); // keeps track of how long a sketch has been running in milliseconds
  growth = 0;
}

function branch(h, xoff) {
  let sw = map(h, 2, maxGrowth, 1, 5); // Thickness of the branch is based on current height
  strokeWeight(sw);

  line(0, 0, 0, -h);
  translate(0, -h); // Move to the end of the branch

  h *= 0.7; // Reduce the branch length for the next recursion

  xoff += 0.1; // Move along noise space

  if (h > 4) {
    let n = floor(random(1, 5)); // Random number of branches
    for (let i = 0; i < n; i++) {
      let theta = map(noise(xoff + i, yoff), 0, 1, -PI / 2, PI / 2); // Randomized angle using noise
      if (n % 2 == 0) theta *= -1;

      push(); // Save the current transformation state
      rotate(theta); // Rotate the branch by angle theta
      branch(h, xoff); // Recursively call the branch function
      pop(); // Restore the previous state
    }
  } else {
    // Draw custom shape at the end of each branch
    drawCustomShape(scaleFactor);
  }
}

function drawCustomShape(scaleFactor) {
  beginShape();
  for (let y = -1; y <= 1; y += 0.01) {
    let xSquared = (Math.pow(1 - y, 3) * (1 + y)) / a;
    if (xSquared >= 0) {
      let x = sqrt(xSquared);
      vertex(x * scaleFactor, y * scaleFactor); // Positive x
    }
  }
  endShape();

  beginShape();
  for (let y = -1; y <= 1; y += 0.01) {
    let xSquared = (Math.pow(1 - y, 3) * (1 + y)) / a;
    if (xSquared >= 0) {
      let x = sqrt(xSquared);
      vertex(-x * scaleFactor, y * scaleFactor); // Negative x
    }
  }
  endShape();
}
