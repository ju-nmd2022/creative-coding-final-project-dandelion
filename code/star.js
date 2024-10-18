let stars = [];

function setup() {
  createCanvas(800, 600);
  drawGradientBackground();
  initializeStars(200);
  drawMoon(width * 0.7, height * 0.4, 80);
}

function draw() {
  drawGradientBackground();
  drawMoon(width * 0.7, height * 0.4, 80);
  updateAndDrawStars();
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
//solution from chatGPT
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
