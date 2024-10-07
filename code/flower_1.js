let flowers = [];

function setup() {
  createCanvas(800, 400);
  frameRate(60);
}

function draw() {
  background(220);

  // Iterate through all flowers and update/draw them
  for (let i = 0; i < flowers.length; i++) {
    let flower = flowers[i];

    // Grow stem
    if (flower.stemHeight < flower.maxStemHeight) {
      flower.stemHeight += 1; // Increase stem height slowly
    }

    // Draw stem
    stroke(34, 139, 34);
    strokeWeight(4); // Thinner stem for smaller flowers
    line(flower.x, height - 20, flower.x, height - 20 - flower.stemHeight);

    // Once the stem is fully grown, start growing petals
    if (flower.stemHeight >= flower.maxStemHeight) {
      flower.bloom = true;
    }

    // Grow petals
    if (flower.bloom && flower.petalSize < 30) {
      // Reduced max petal size to 30
      flower.petalSize += 0.25; // Slower petal growth
    }

    // Draw flower petals with its own color
    if (flower.bloom) {
      noStroke();
      fill(flower.color); // Use the flower's specific color
      for (let j = 0; j < 8; j++) {
        let angle = (TWO_PI / 8) * j;
        let x = flower.x + cos(angle) * flower.petalSize * 0.5; // Bring petals closer to the center
        let y =
          height - 20 - flower.stemHeight + sin(angle) * flower.petalSize * 0.5; // Bring petals closer to the center
        ellipse(x, y, 30); // Smaller petals with size 30
      }

      // Draw center of flower
      fill(255, 215, 0);
      ellipse(flower.x, height - 20 - flower.stemHeight, 20); // Smaller center of flower
    }
  }
}

function mousePressed() {
  let newFlower = {
    x: random(50, width - 50), // Random X position for the flower
    stemHeight: 0, // Starting stem height
    maxStemHeight: random(50, 100), // Random maximum stem height for each flower (smaller range)
    petalSize: 0, // Starting petal size
    bloom: false, // Flower bloom status
    color: color(random(255), random(255), random(255)), // Assign a random color
  };

  flowers.push(newFlower);
}
