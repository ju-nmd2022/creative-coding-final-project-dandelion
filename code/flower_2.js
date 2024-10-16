let flowers = [];
let clouds = [];
let raindrops = [];
let numClouds = 10;
let zOffset = 0;
let handpose;
let video;
let hands = [];
let previousX = 0; // To track hand movement
let rainRate = 0; // Controls how many raindrops to add
let lastSwipeTime = 0; // Track time of last swipe
let rainbowMode = false; // Flag to toggle rainbow mode
let sunRotationAngle = 0;
const maxFlowers = 30; // Maximum number of flowers
let nextFlowerTime = 0; // Tracks when to add the next flower
let flowerInterval = 2000; // Minimum time interval between flower additions in milliseconds

function preload() {
  handpose = ml5.handPose();
}

function setup() {
  createCanvas(800, 600);
  pixelDensity(1);
  frameRate(60);

  // Initialize webcam
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handpose.detectStart(video, getHandsData);

  // Create multiple clouds
  for (let i = 0; i < numClouds; i++) {
    let x = random(-200, width);
    let y = random(height / 4, height / 3);
    clouds.push(new Cloud(x, y));
  }

  lastSwipeTime = millis(); // Initialize last swipe time to the start of the sketch
}

function draw() {
  if (rainbowMode) {
    // Display rainbow background if no hand swipe detected for a certain time
    background(135, 206, 235); // Sky blue background
    drawSun(700, 100, 150); // Draw sun
    drawRainbow((width * 2) / 3, height, 800, 7); // Draw rainbow
  } else {
    // Normal background with clouds and rain
    background(114, 188, 212);

    // Update and display clouds
    for (let cloud of clouds) {
      cloud.update();
      cloud.display();
      cloud.rain(); // Trigger rain generation
    }

    // Update and display raindrops
    for (let i = raindrops.length - 1; i >= 0; i--) {
      raindrops[i].update();
      raindrops[i].display();

      if (raindrops[i].offScreen()) {
        raindrops.splice(i, 1); // Remove raindrop when it is off-screen
      }
    }

    zOffset += 0.001; // Increment offset for dynamic movement
  }

  // Detect hand swipes and control rain intensity
  detectSwipeGesture(); // <-- Move this outside of the conditional blocks

  // Check if 10 seconds (10,000 milliseconds) have passed since last swipe
  if (millis() - lastSwipeTime > 20000) {
    rainbowMode = true;
  }

  // Gradually add flowers based on rain
  if (
    rainRate > 0 &&
    millis() > nextFlowerTime &&
    flowers.length < maxFlowers
  ) {
    addFlower(); // Add a flower
    nextFlowerTime = millis() + flowerInterval; // Schedule next flower addition
  }

  // Draw and grow flowers
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

// Cloud class that also triggers rain and flower growth
class Cloud {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.cloudParts = [];
    this.createCloud();
  }

  createCloud() {
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
    this.x += 0.5;
    if (this.x > width + 200) {
      this.x = -200;
      this.y = random(height / 4, height / 2);
    }

    this.y += map(noise(this.x * 0.005, zOffset), 0, 1, -0.5, 0.5);
  }

  display() {
    noStroke();
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = "rgba(255, 255, 255, 0.8)"; // Soft white shadow for blurred effect

    fill(255, 255, 255, 225);

    for (let part of this.cloudParts) {
      let px = this.x + part.offsetX;
      let py = this.y + part.offsetY;
      ellipse(px, py, part.size); // Draw each puff of the cloud
    }

    drawingContext.shadowBlur = 0; // Reset blur effect
  }

  rain() {
    if (rainRate > 0) {
      // Only rain if a swipe is detected
      let numRaindrops = floor(rainRate / 2);
      for (let i = 0; i < numRaindrops; i++) {
        let part = this.cloudParts[floor(random(this.cloudParts.length))];
        let px = this.x + part.offsetX;
        let py = this.y + part.offsetY;
        raindrops.push(new Raindrop(px, py));
      }
    }
  }
}

class Raindrop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(2, 5);
    this.alpha = 255;
  }

  update() {
    this.y += this.speed;
    this.alpha -= 2; // Fade out as it falls
  }

  display() {
    noStroke();
    fill(255, 255, 255, this.alpha);
    ellipse(this.x, this.y, 5, 10);
  }

  offScreen() {
    return this.y > height || this.alpha <= 0; // Remove raindrop when off-screen or fully faded
  }
}

// Hand tracking function
function getHandsData(results) {
  hands = results;
}

function detectSwipeGesture() {
  if (hands.length > 0) {
    let indexFinger = hands[0].index_finger_tip;

    // Detect significant hand movement (swipe gesture)
    let swipeDistance = abs(indexFinger.x - previousX);

    if (swipeDistance > 30) {
      rainRate = map(swipeDistance, 30, 100, 2, 10);
      lastSwipeTime = millis(); // Reset the timer on hand swipe
      rainbowMode = false;
    }

    // Update the previous hand position for the next frame
    previousX = indexFinger.x;
  }

  // Gradually decrease the rain rate over time to stop rain after the swipe
  rainRate = max(rainRate - 0.5, 0);
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

  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = "rgba(255, 255, 255, 0.5)";

  for (let i = 0; i < numBands; i++) {
    stroke(colors[i]);
    strokeWeight(20);
    arc(x, y, radius - i * 30, radius - i * 30, PI, TWO_PI);
  }

  drawingContext.shadowBlur = 0;
}

function drawSun(x, y, size) {
  push();
  translate(x, y);
  rotate(sunRotationAngle);
  sunRotationAngle += 0.005; // Adjust this value for speed of rotation (smaller for slower)

  for (let i = 0; i < 12; i++) {
    let angle = radians(i * 30);
    let rayLength = size * 0.6;
    let x1 = (cos(angle) * size) / 2;
    let y1 = (sin(angle) * size) / 2;
    let x2 = cos(angle) * rayLength;
    let y2 = sin(angle) * rayLength;
    stroke(255, 204, 0, 220);
    strokeWeight(20);
    line(x1, y1, x2, y2);
  }

  noStroke();
  fill(255, 204, 0);
  ellipse(0, 0, size);

  pop();
}

// Function to add new flower
function addFlower() {
  let newFlower = {
    x: random(50, width - 50), // Random X position for the flower
    stemHeight: 0, // Starting stem height
    maxStemHeight: random(50, 120), // Random maximum stem height for each flower
    petalSize: 0, // Starting petal size
    bloom: false, // Flower bloom status
    color: color(random(255), random(255), random(255)), // Assign a random color
  };
  flowers.push(newFlower);
}
