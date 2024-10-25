let flowers = [];
let clouds = [];
let raindrops = [];
let stars = [];
let numClouds = 10;
let zOffset = 0;
let video,
  handpose,
  hands = [];
let previousX = 0;
let rainRate = 0;
let lastSwipeTime = 0;
let rainbowMode = false;
let sunRotationAngle = 0;
const maxFlowers = 30;
let nextFlowerTime = 0;
let flowerInterval = 2000;
let synth, melodyInterval, lullabyLoop; // Tone.js elements
const scale = ["C4", "D4", "E4", "G4", "A4"];
let selectedMedianColor = null;

function preload() {
  handpose = ml5.handPose();
}

function setup() {
  createCanvas(800, 600);
  frameRate(60);
  Tone.start().then(setupTone); // Initialize Tone.js audio context

  // Webcam and hand tracking setup
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  handpose.detectStart(video, getHandsData);

  // Initialize clouds and stars
  for (let i = 0; i < numClouds; i++)
    clouds.push(new Cloud(random(-200, width), random(height / 4, height / 3)));
  initializeStars(200);

  lastSwipeTime = millis();
}

// Setup Tone.js synth and melody interval
function setupTone() {
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 1, decay: 1, sustain: 0.5, release: 2 },
  }).toDestination();

  melodyInterval = new Tone.Loop((time) => playNextFlowerSound(time), "4n");
  Tone.Transport.bpm.value = 60;
  melodyInterval.start(0);
}

// Main draw loop
function draw() {
  // Toggle background and star effects based on rainbow mode
  rainbowMode ? drawGradientBackground() : background(114, 188, 212);

  // Display elements
  updateAndDrawCloudsAndRain();
  if (rainbowMode) {
    drawMoon(width * 0.7, height * 0.4, 80);
    updateAndDrawStars();
  }

  detectSwipeGesture(); // Controls rain intensity via hand gestures
  handleFlowerGrowthAndSounds();
  drawMedianColorCircle(); // Displays a circle for selected median color
}

// Helper functions for elements in draw

function updateAndDrawCloudsAndRain() {
  for (let cloud of clouds) {
    cloud.update();
    cloud.display();
    cloud.rain();
  }

  for (let i = raindrops.length - 1; i >= 0; i--) {
    raindrops[i].update();
    raindrops[i].display();
    if (raindrops[i].offScreen()) raindrops.splice(i, 1);
  }
  zOffset += 0.001;
}

function handleFlowerGrowthAndSounds() {
  if (
    rainRate > 0 &&
    millis() > nextFlowerTime &&
    flowers.length < maxFlowers
  ) {
    addFlower();
    nextFlowerTime = millis() + flowerInterval;
  }

  for (let flower of flowers) {
    growAndDisplayFlower(flower);
  }

  if (selectedMedianColor) {
    generateLullabyFromColor(selectedMedianColor);
  }
}

// Flower management
function addFlower() {
  flowers.push({
    x: random(50, width - 50),
    stemHeight: 0,
    maxStemHeight: random(50, 120),
    petalSize: 0,
    bloom: false,
    color: color(random(255), random(255), random(255)),
  });
}

function growAndDisplayFlower(flower) {
  if (flower.stemHeight < flower.maxStemHeight) flower.stemHeight += 1;

  stroke(34, 139, 34);
  strokeWeight(4);
  line(flower.x, height - 20, flower.x, height - 20 - flower.stemHeight);

  if (flower.stemHeight >= flower.maxStemHeight) flower.bloom = true;
  if (flower.bloom && flower.petalSize < 30) flower.petalSize += 0.25;

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

// Median color and lullaby generation
function drawMedianColorCircle() {
  if (selectedMedianColor) {
    fill(selectedMedianColor);
    ellipse(100, 100, 100, 100);
  }
}

function mousePressed() {
  const medianColor = getMedianFlowerColor(flowers);
  if (!selectedMedianColor) {
    selectedMedianColor = medianColor;
    generateLullabyFromColor(selectedMedianColor);
  } else {
    selectedMedianColor = null;
    stopLullaby();
  }
  addFlower(); // Optionally add a new flower on click
}

function getMedianFlowerColor(flowers) {
  if (flowers.length === 0) return color(255);

  let reds = flowers.map((f) => red(f.color)).sort((a, b) => a - b);
  let greens = flowers.map((f) => green(f.color)).sort((a, b) => a - b);
  let blues = flowers.map((f) => blue(f.color)).sort((a, b) => a - b);

  const medianIndex = floor(flowers.length / 2);
  return color(
    flowers.length % 2 === 0
      ? (reds[medianIndex - 1] + reds[medianIndex]) / 2
      : reds[medianIndex],
    flowers.length % 2 === 0
      ? (greens[medianIndex - 1] + greens[medianIndex]) / 2
      : greens[medianIndex],
    flowers.length % 2 === 0
      ? (blues[medianIndex - 1] + blues[medianIndex]) / 2
      : blues[medianIndex]
  );
}

const minorScale = ["C4", "D4", "D#4", "F4", "G4", "G#4", "A#4", "C5"];

function generateLullabyFromColor(color) {
  if (lullabyLoop) lullabyLoop.stop();

  const r = red(color),
    g = green(color),
    b = blue(color);
  const pitchIndex = floor(map(r, 0, 255, 0, minorScale.length - 1));
  const baseNote = minorScale[pitchIndex];
  const interval = map(g, 0, 255, 0.5, 2);
  const volume = map(b, 0, 255, -20, -5);

  synth.volume.value = volume;

  const melody = [
    baseNote,
    minorScale[(pitchIndex + 2) % minorScale.length],
    minorScale[(pitchIndex + 4) % minorScale.length],
    baseNote,
  ];

  lullabyLoop = new Tone.Loop((time) => {
    const note = melody.shift();
    melody.push(note);
    synth.triggerAttackRelease(note, "4n", time);
  }, interval);

  lullabyLoop.start(0);
  Tone.Transport.start();
}

function stopLullaby() {
  if (lullabyLoop) lullabyLoop.stop();
}

// Starry sky and background functions
function initializeStars(numStars) {
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.8),
      size: random(1, 4),
      twinkleSpeed: random(0.01, 0.05),
      phase: random(TWO_PI),
    });
  }
}

function updateAndDrawStars() {
  noStroke();
  fill(255);
  for (let star of stars) {
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
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(10, 13, 42), color(45, 60, 90), inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawMoon(x, y, radius) {
  noStroke();
  fill(255, 255, 204);
  ellipse(x, y, radius, radius);
  fill(45, 60, 90);
  ellipse(x - radius / 6, y - radius / 6, radius * 0.75, radius * 0.75);
}

// Rain-related classes
class Cloud {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(0.3, 1.2);
  }

  display() {
    noStroke();
    fill(255);
    ellipse(this.x, this.y, 100, 50);
  }

  update() {
    this.x += this.speed;
    if (this.x > width + 100) this.x = -100;
  }

  rain() {
    if (random() < rainRate)
      raindrops.push(new Raindrop(this.x + random(-20, 20), this.y + 25));
  }
}

class Raindrop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(2, 5);
  }

  display() {
    stroke(138, 43, 226);
    line(this.x, this.y, this.x, this.y + 10);
  }

  update() {
    this.y += this.speed;
  }

  offScreen() {
    return this.y > height;
  }
}

// Gesture recognition for swipe
function detectSwipeGesture() {
  if (hands.length > 0) {
    let x = hands[0].landmarks[9][0];
    let deltaX = x - previousX;
    previousX = x;

    if (abs(deltaX) > 20 && millis() - lastSwipeTime > 500) {
      rainRate = constrain(rainRate + deltaX * 0.005, 0, 0.1);
      lastSwipeTime = millis();
    }
  }
}

// Get hand pose data
function getHandsData(results) {
  hands = results;
}
