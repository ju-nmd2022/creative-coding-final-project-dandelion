let a = 1; // You can change the value of 'a' to manipulate the shape
let scaleFactor = 150; // Scaling factor to adjust the size of the shape

function setup() {
  createCanvas(400, 400);
  background(255);
  noLoop(); // Prevent continuous redrawing
}

function draw() {
  translate(width / 2, height / 2); // Center the shape in the middle of the canvas
  stroke(0);
  noFill();

  beginShape();
  // Loop over values of y from -1 to 1
  for (let y = -1; y <= 1; y += 0.01) {
    let xSquared = (Math.pow(1 - y, 3) * (1 + y)) / a; // Replaced ** with Math.pow
    if (xSquared >= 0) {
      let x = sqrt(xSquared);

      // Plot the two points (one for positive x, one for negative x)
      vertex(x * scaleFactor, y * scaleFactor); // Positive x
    }
  }
  endShape();

  beginShape();
  // Loop over values of y from -1 to 1 for the negative x part
  for (let y = -1; y <= 1; y += 0.01) {
    let xSquared = (Math.pow(1 - y, 3) * (1 + y)) / a; // Replaced ** with Math.pow
    if (xSquared >= 0) {
      let x = sqrt(xSquared);

      // Plot the two points (one for positive x, one for negative x)
      vertex(-x * scaleFactor, y * scaleFactor); // Negative x
    }
  }
  endShape();
}
