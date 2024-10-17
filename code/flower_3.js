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
    background(135, 206, 235); // Sky blue
    drawSun(700, 100, 150);
    drawRainbow((width * 2) / 3, height, 800, 7);
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
    rainbowMode = true;
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
  sunRotationAngle += 0.005;

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
