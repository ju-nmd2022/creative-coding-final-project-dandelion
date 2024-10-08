// let zOffset = 0; // Perlin noise offset

function setup() {
  createCanvas(800, 600);
  pixelDensity(1);
  frameRate(60);
}

function draw() {
  background(135, 206, 235);
  drawSun(700, 100, 150);
  drawRainbow((width * 2) / 3, height, 800, 7);
  // zOffset += 0.001; // Increment Perlin noise offset (if needed for any future use)
}

function drawSun(x, y, size) {
  for (let i = 0; i < 12; i++) {
    let angle = radians(i * 30); // Dividing the circle into 12 parts
    let rayLength = size * 0.6;
    let x1 = x + (cos(angle) * size) / 2;
    let y1 = y + (sin(angle) * size) / 2;
    let x2 = x + cos(angle) * rayLength;
    let y2 = y + sin(angle) * rayLength;
    stroke(255, 204, 0, 220);
    strokeWeight(20);
    line(x1, y1, x2, y2);

    noStroke();
    fill(255, 204, 0);
    ellipse(x, y, size);
  }
}

function drawRainbow(x, y, radius, numBands) {
  noFill();

  let colors = [
    color(255, 99, 71),
    color(255, 140, 0),
    color(255, 215, 90),
    color(144, 238, 144),
    color(100, 149, 237),
    color(123, 104, 238),
    color(216, 191, 216),
  ];
  //this part is from chatGPT
  // Apply blur effect using drawingContext's shadow properties
  drawingContext.shadowBlur = 20; // Set the blur amount
  drawingContext.shadowColor = "rgba(255, 255, 255, 0.5)"; // Light shadow to soften edges

  for (let i = 0; i < numBands; i++) {
    stroke(colors[i]);
    strokeWeight(20); // Thickness of each band
    arc(x, y, radius - i * 30, radius - i * 30, PI, TWO_PI); // Concentric arcs
  }

  // Reset blur after drawing rainbow
  drawingContext.shadowBlur = 0; // Remove blur so it doesn't affect other drawings
}
