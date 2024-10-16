// in this version, rain only starts when a swipe is detected.
// Removed random rain timings so clouds don't rain automatically.
// Swipe distance dynamically controls rain intensity — the faster or larger the swipe, the more raindrops are created.

let clouds = [];
let raindrops = [];
let numClouds = 10;
let zOffset = 0; // Perlin noise offset
let handpose;
let video;
let hands = [];
let previousX = 0; // To track hand movement
let rainRate = 0; // Controls how many raindrops to add

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
}

function draw() {
  background(114, 188, 212);

  // Update and display clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.display();
    cloud.rain(); // Trigger rain generation only when hand swipes
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

  // Check for hand swipes and control rain intensity
  detectSwipeGesture();
}

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
    this.x += 0.5; // Horizontal flow speed
    if (this.x > width + 200) {
      this.x = -200; // Reset cloud's position
      this.y = random(height / 4, height / 2);
    }

    // Apply vertical movement based on Perlin noise
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
      // Only rain when a swipe is detected
      for (let i = 0; i < rainRate / 2; i++) {
        // Reduce the number of raindrops
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
    fill(255, 255, 255, this.alpha); // White raindrops with transparency
    ellipse(this.x, this.y, 5, 10); // Raindrop shape
  }

  offScreen() {
    return this.y > height || this.alpha <= 0; // Remove raindrop when off-screen or fully faded
  }
}

// Hand tracking function
function getHandsData(results) {
  hands = results;
}

// Detect hand swipe gestures and adjust the rain intensity
function detectSwipeGesture() {
  if (hands.length > 0) {
    let indexFinger = hands[0].index_finger_tip;

    // Detect significant hand movement (swipe gesture)
    let swipeDistance = abs(indexFinger.x - previousX);

    if (swipeDistance > 30) {
      // Adjust this threshold for swipe sensitivity
      rainRate = map(swipeDistance, 30, 100, 2, 10); // Map swipe distance to rain intensity
    }

    // Update the previous hand position for the next frame
    previousX = indexFinger.x;
  }

  // Gradually decrease the rain rate over time to stop rain after the swipe
  rainRate = max(rainRate - 0.5, 0);
}
