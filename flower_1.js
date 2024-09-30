let stemHeight = 0;
let petalSize = 0;
let bloom = false;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Draw seed
  if (stemHeight === 0 && petalSize === 0) {
    fill(139, 69, 19);
    ellipse(width / 2, height - 20, 10, 10); // Seed
  }

  // Grow stem
  if (stemHeight < 150) {
    stemHeight += 1; // Increase stem height slowly
  }

  // Draw stem
  stroke(34, 139, 34);
  strokeWeight(4);
  line(width / 2, height - 20, width / 2, height - 20 - stemHeight);

  // Once the stem is fully grown, start growing petals
  if (stemHeight >= 150) {
    bloom = true;
  }

  // Grow petals
  if (bloom && petalSize < 50) {
    petalSize += 0.5; // Increase petal size slowly
  }

  // Draw flower petals
  if (bloom) {
    fill(255, 192, 203); // Pink color for petals
    for (let i = 0; i < 8; i++) {
      let angle = (TWO_PI / 8) * i;
      let x = width / 2 + cos(angle) * petalSize;
      let y = height - 20 - stemHeight + sin(angle) * petalSize;
      ellipse(x, y, 30, 30); // Petals
    }

    // Draw center of flower
    fill(255, 215, 0); // Yellow for the center
    ellipse(width / 2, height - 20 - stemHeight, 30, 30);
  }
}
