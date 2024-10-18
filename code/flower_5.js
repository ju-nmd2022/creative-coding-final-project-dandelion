let flowers = [];
let clouds = [];
let raindrops = [];
let numClouds = 10;
let zOffset = 0;
let handpose;
let video;
let hands = [];
let previousX = 0;
let rainRate = 0;
let lastSwipeTime = 0;
let rainbowMode = false;
let sunRotationAngle = 0;
const maxFlowers = 30;
let nextFlowerTime = 0;
let flowerInterval = 2000;
let synth; // Synthesizer for sound
let melodyInterval; // Timer for rhythm
const scale = ["C4", "D4", "E4", "G4", "A4"]; // Musical notes

let stars = []; // Array for stars

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

  // Initialize the synth for music
  setupTone();

  // Create clouds
  for (let i = 0; i < numClouds; i++) {
    let x = random(-200, width);
    let y = random(height / 4, height / 3);
    clouds.push(new Cloud(x, y));
  }

  initializeStars(200); // Initialize stars for the starry background

  lastSwipeTime = millis();
}

function setupTone() {
  // Setup Tone.js synth for soft, harmonic music
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: {
      attack: 1,
      decay: 1,
      sustain: 0.5,
      release: 2,
    },
  }).toDestination();

  // Set up a rhythmic interval to play the next flower's sound
  melodyInterval = new Tone.Loop((time) => playNextFlowerSound(time), "4n");
  Tone.Transport.bpm.value = 60;
  Tone.Transport.start();
  melodyInterval.start(0);
}

function draw() {
  if (rainbowMode) {
    // Instead of the rainbow, draw the starry sky and moon
    drawGradientBackground();
    drawMoon(width * 0.7, height * 0.4, 80);
    updateAndDrawStars();
  } else {
    background(114, 188, 212); // Normal background

    // Update and display clouds and rain
    for (let cloud of clouds) {
      cloud.update();
      cloud.display();
      cloud.rain();
    }

    for (let i = raindrops.length - 1; i >= 0; i--) {
      raindrops[i].update();
      raindrops[i].display();

      if (raindrops[i].offScreen()) {
        raindrops.splice(i, 1);
      }
    }

    zOffset += 0.001;
  }

  detectSwipeGesture(); // Hand swipes control rain intensity

  if (millis() - lastSwipeTime > 20000) {
    rainbowMode = true; // Activate starry mode after 20 seconds of inactivity
  }

  if (
    rainRate > 0 &&
    millis() > nextFlowerTime &&
    flowers.length < maxFlowers
  ) {
    addFlower(); // Add new flower
    nextFlowerTime = millis() + flowerInterval;
  }

  // Draw and grow flowers
  for (let i = 0; i < flowers.length; i++) {
    let flower = flowers[i];

    if (flower.stemHeight < flower.maxStemHeight) {
      flower.stemHeight += 1;
    }

    stroke(34, 139, 34);
    strokeWeight(4);
    line(flower.x, height - 20, flower.x, height - 20 - flower.stemHeight);

    if (flower.stemHeight >= flower.maxStemHeight) {
      flower.bloom = true;
    }

    if (flower.bloom && flower.petalSize < 30) {
      flower.petalSize += 0.25;
    }

    if (flower.bloom) {
      noStroke();
      fill(flower.color);
      for (let j = 0; j < 8; j++) {
        let angle = (TWO_PI / 8) * j;
        let x = flower.x + cos(angle) * flower.petalSize * 0.5;
        let y =
          height - 20 - flower.stemHeight + sin(angle) * flower.petalSize * 0.5;
        ellipse(x, y, 30);
      }

      fill(255, 215, 0);
      ellipse(flower.x, height - 20 - flower.stemHeight, 20);
    }
  }
}

function initializeStars(numStars) {
  for (let i = 0; i < numStars; i++) {
    let star = {
      x: random(width),
      y: random(height * 0.8),
      size: random(1, 4),
      twinkleSpeed: random(0.01, 0.05),
      phase: random(TWO_PI),
    };
    stars.push(star);
  }
}

function updateAndDrawStars() {
  noStroke();
  fill(255);

  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];
    let twinkleFactor = map(
      sin(frameCount * star.twinkleSpeed + star.phase),
      -1,
      1,
      0.5,
      1
    );
    fill(255, 255, 255, twinkleFactor * 255);
    ellipse(
      star.x,
      star.y,
      star.size * twinkleFactor,
      star.size * twinkleFactor
    );
  }
}

function drawGradientBackground() {
  let topColor = color(10, 13, 42); // Dark navy blue for the night sky
  let bottomColor = color(45, 60, 90); // Lighter blue towards the bottom

  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(topColor, bottomColor, inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawMoon(x, y, radius) {
  noStroke();

  fill(255, 255, 204); // Light yellow for the moon
  ellipse(x, y, radius, radius);

  // Create crescent effect by using background color to simulate shadow
  let topColor = color(10, 13, 42);
  let bottomColor = color(45, 60, 90);
  let inter = map(y, 0, height, 0, 1);
  let bgColor = lerpColor(topColor, bottomColor, inter);
  fill(bgColor); // Fill shadow with the background color
  ellipse(x + radius * 0.2, y, radius * 0.9, radius); // Crescent shadow
}

function playNextFlowerSound(time) {
  if (flowers.length > 0) {
    let flower = flowers.shift(); // Get the next flower
    let flowerColor = flower.color;

    let r = red(flowerColor);
    let g = green(flowerColor);
    let b = blue(flowerColor);

    let noteIndex = floor(map(r, 0, 255, 0, scale.length));
    let note = scale[noteIndex];

    let volume = map(g, 0, 255, -20, -5);
    synth.triggerAttackRelease(note, "2n", time, Tone.dbToGain(volume));

    flowers.push(flower); // Recycle flower for future sounds
  }
}

function mousePressed() {
  if (Tone.context.state !== "running") {
    Tone.start().then(() => {
      console.log("Audio context started");
    });
  }

  let newFlower = {
    x: random(50, width - 50),
    stemHeight: 0,
    maxStemHeight: random(50, 120),
    petalSize: 0,
    bloom: false,
    color: color(random(255), random(255), random(255)),
  };

  flowers.push(newFlower);
}

// Cloud class to handle cloud drawing and rain generation
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
      this.cloudParts.push({ offsetX, offsetY, size });
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
    drawingContext.shadowColor = "rgba(255, 255, 255, 0.8)";

    fill(255, 255, 255, 225);

    for (let part of this.cloudParts) {
      let px = this.x + part.offsetX;
      let py = this.y + part.offsetY;
      ellipse(px, py, part.size);
    }

    drawingContext.shadowBlur = 0;
  }

  rain() {
    if (rainRate > 0) {
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
    this.alpha -= 2;
  }

  display() {
    noStroke();
    fill(255, 255, 255, this.alpha);
    ellipse(this.x, this.y, 5, 10);
  }

  offScreen() {
    return this.y > height || this.alpha <= 0;
  }
}

function getHandsData(results) {
  hands = results;
}

function detectSwipeGesture() {
  if (hands.length > 0) {
    let indexFinger = hands[0].index_finger_tip;
    let swipeDistance = abs(indexFinger.x - previousX);

    if (swipeDistance > 30) {
      rainRate = map(swipeDistance, 30, 100, 2, 10);
      lastSwipeTime = millis();
      rainbowMode = false;
    }

    previousX = indexFinger.x;
  }

  rainRate = max(rainRate - 0.5, 0);
}

function addFlower() {
  let newFlower = {
    x: random(50, width - 50),
    stemHeight: 0,
    maxStemHeight: random(50, 120),
    petalSize: 0,
    bloom: false,
    color: color(random(255), random(255), random(255)),
  };
  flowers.push(newFlower);
}
