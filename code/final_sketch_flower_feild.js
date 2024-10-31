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
let lastGestureTime = 0;
let rainbowMode = false;
let sunRotationAngle = 0;
const maxFlowers = 30;
let nextFlowerTime = 0;
let flowerInterval = 2000;
let synth, melodyInterval, lullabyLoop;
const scale = ["C4", "D4", "E4", "G4", "A4"];
let selectedMedianColor = null;
let lastNoteTime = 0;

function preload() {
  handpose = ml5.handPose();
}
function setup() {
  Tone.start().then(setupTone);
  createCanvas(800, 600);
  pixelDensity(1);
  frameRate(60);

  // Start Tone.js
  document.addEventListener("click", async () => {
    if (Tone.context.state !== "running") {
      await Tone.start();
      setupTone();
      console.log("Audio context started");
    }
  });

  // Rest of setup code
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  handpose.detectStart(video, getHandsData);

  for (let i = 0; i < numClouds; i++) {
    clouds.push(new Cloud(random(-200, width), random(height / 4, height / 3)));
  }
  initializeStars(100);
  lastGestureTime = millis();
}
function setupTone() {
  synth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 1, decay: 1, sustain: 0.5, release: 2 },
  }).toDestination();

  melodyInterval = new Tone.Loop((time) => playNextFlowerSound(time), "4n"); // Ensure time is passed
  Tone.Transport.bpm.value = 60;
  melodyInterval.start(0);
}

// Main draw loop
function draw() {
  rainbowMode ? drawGradientBackground() : background(114, 188, 212);
  updateAndDrawCloudsAndRain();
  if (rainbowMode) {
    drawMoon(width * 0.7, height * 0.4, 80);
    updateAndDrawStars();
  }
  detectSwipeGesture();
  handleFlowerGrowthAndSounds();

  if (millis() - lastGestureTime > 30000) {
    rainbowMode = true;
  }
}

function updateAndDrawCloudsAndRain() {
  if (!rainbowMode) {
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
}

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
  if (flower.stemHeight < flower.maxStemHeight) {
    flower.stemHeight += 1;
  } else if (flower.stemHeight >= flower.maxStemHeight) {
    flower.bloom = true; // Mark the flower as fully bloomed
  }

  // Draw the stem and bloom if applicable
  stroke(34, 139, 34);
  strokeWeight(4);
  line(flower.x, height - 20, flower.x, height - 20 - flower.stemHeight);

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

function getMedianFlowerColor(flowers) {
  if (flowers.length === 0) return color(255);
  // Limit to the last 5 flowers
  const recentFlowers = flowers.slice(-5);
  let reds = recentFlowers.map((f) => red(f.color)).sort((a, b) => a - b);
  let greens = recentFlowers.map((f) => green(f.color)).sort((a, b) => a - b);
  let blues = recentFlowers.map((f) => blue(f.color)).sort((a, b) => a - b);
  const medianIndex = floor(recentFlowers.length / 2);
  const medianColor = color(
    recentFlowers.length % 2 === 0
      ? (reds[medianIndex - 1] + reds[medianIndex]) / 2
      : reds[medianIndex],
    recentFlowers.length % 2 === 0
      ? (greens[medianIndex - 1] + greens[medianIndex]) / 2
      : greens[medianIndex],
    recentFlowers.length % 2 === 0
      ? (blues[medianIndex - 1] + blues[medianIndex]) / 2
      : blues[medianIndex]
  );
  console.log(
    "Median color (latest 5 flowers):",
    red(medianColor),
    green(medianColor),
    blue(medianColor)
  );
  return medianColor;
}

let flowerGrowthCounter = 0;

function handleFlowerGrowthAndSounds() {
  if (
    rainRate > 0 &&
    millis() > nextFlowerTime &&
    flowers.length < maxFlowers
  ) {
    addFlower();
    nextFlowerTime = millis() + flowerInterval;
    flowerGrowthCounter++;

    if (flowerGrowthCounter <= 4) {
      playNextFlowerSound(Tone.now());
    }

    // Select median color at multiples of 5 for the last 5 flowers
    if (flowerGrowthCounter % 5 === 0 && flowers.length >= 5) {
      selectedMedianColor = getMedianFlowerColor(flowers.slice(-5));
      generateLullabyFromColor(selectedMedianColor);
    }
  }

  for (let flower of flowers) {
    growAndDisplayFlower(flower);
  }
}

const eMinorScale = ["E4", "F#4", "G4", "A4", "B4", "C5", "D5", "E5"]; // Define the E minor scale
const minorScale = ["C4", "D4", "D#4", "F4", "G4", "G#4", "A#4", "C5"];
function generateLullabyFromColor(color) {
  if (lullabyLoop) lullabyLoop.stop();
  const r = red(color),
    g = green(color),
    b = blue(color);
  // Select scale based on red dominance for harmonic consistency
  const selectedScale = r > g && r > b ? eMinorScale : minorScale;
  // Map color to determine starting note and volume
  const pitchIndex = floor(map(r, 0, 255, 0, selectedScale.length - 1));
  const baseNote = selectedScale[pitchIndex];
  const interval = map(g, 0, 255, 1, 2);
  const volume = map(b, 0, 255, -20, -5);
  synth.volume.value = volume;
  // Simple chord progression to harmonize melody
  const progression = [
    [baseNote, selectedScale[(pitchIndex + 2) % selectedScale.length]],
    [selectedScale[(pitchIndex + 4) % selectedScale.length], baseNote],
    [selectedScale[(pitchIndex + 5) % selectedScale.length], baseNote],
  ];
  let chordIndex = 0;
  lullabyLoop = new Tone.Loop((time) => {
    const chord = progression[chordIndex % progression.length];
    for (const note of chord) {
      synth.triggerAttackRelease(note, "2n", time);
    }
    chordIndex++;
  }, interval);
  lullabyLoop.start(0);
  Tone.Transport.start();
}
function stopLullaby() {
  if (lullabyLoop) lullabyLoop.stop();
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
  let topColor = color(10, 13, 42);
  let bottomColor = color(45, 60, 90);

  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(topColor, bottomColor, inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawMoon(x, y, radius) {
  noStroke();

  fill(255, 255, 204);
  ellipse(x, y, radius, radius);

  let topColor = color(10, 13, 42);
  let bottomColor = color(45, 60, 90);
  let inter = map(y, 0, height, 0, 1);
  let bgColor = lerpColor(topColor, bottomColor, inter);
  fill(bgColor);
  ellipse(x + radius * 0.2, y, radius * 0.9, radius);
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
      lastGestureTime = millis();
      rainbowMode = false;
    }

    previousX = indexFinger.x;
  }

  rainRate = max(rainRate - 0.5, 0);
}
function playNextFlowerSound(time) {
  const randomNote = scale[floor(random(scale.length))];
  synth.triggerAttackRelease(randomNote, "8n", time);
}
