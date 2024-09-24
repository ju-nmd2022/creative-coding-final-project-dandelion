let clouds = [];
let numClouds = 10;
let zOffset = 0; // Perlin noise offset

function setup() {
  createCanvas(800, 600);
  pixelDensity(1);
  frameRate(60);

  // Create multiple clouds
  for (let i = 0; i < numClouds; i++) {
    let x = random(-200, width);
    let y = random(height / 4, height / 3);
    clouds.push(new Cloud(x, y));
  }
}

function draw() {
  background(114, 188, 212);

  for (let cloud of clouds) {
    cloud.update();
    cloud.display();
  }

  zOffset += 0.001; // Increase offset for dynamic movement
}

class Cloud {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.cloudParts = [];
    this.createCloud();
  }

  // the solution is from chatGPT
  createCloud() {
    // Create multiple circles to form the cloud
    let numCircles = floor(random(10, 20));
    for (let i = 0; i < numCircles; i++) {
      let angle = random(TWO_PI);
      let radius = random(10, 100);
      let offsetX = cos(angle) * radius;
      let offsetY = (sin(angle) * radius) / 2;
      let size = random(60, 70);
      this.cloudParts.push({
        offsetX: offsetX,
        offsetY: offsetY,
        size: size,
      });
    }
  }

  update() {
    this.x += 0.5; // Horizontal flow speed
    if (this.x > width + 200) {
      this.x = -200; // Reset the cloud's position
      this.y = random(height / 4, height / 2);
    }

    // Apply a bit of vertical movement based on Perlin noise
    this.y += map(noise(this.x * 0.005, zOffset), 0, 1, -0.5, 0.5);
  }

  display() {
    noStroke();
    // Apply blur effect, come from chatGPT
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = "rgba(255, 255, 255, 0.8)"; // Soft white shadow for blurred effect

    fill(255, 255, 255, 225);

    for (let part of this.cloudParts) {
      let px = this.x + part.offsetX;
      let py = this.y + part.offsetY;
      ellipse(px, py, part.size); // Draw each puff of the cloud
    }

    // Reset blur to avoid affecting other drawings
    drawingContext.shadowBlur = 0;
  }
}
