let flowers = [];
let synth;
let melodyInterval;
const scale = ["C4", "D4", "E4", "G4", "A4"]; // Notes from the C major pentatonic scale

// Setup Tone.js PolySynth
function setupTone() {
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" }, // Soft sine wave for harmonious sound
    envelope: {
      attack: 0.5, // Smooth fade-in
      decay: 1,
      sustain: 0.4, // Hold the note for a while
      release: 2, // Smooth fade-out
    },
  }).toDestination();

  // Set up a rhythmic interval to play the next flower's sound
  melodyInterval = new Tone.Loop((time) => playNextFlowerSound(time), "4n");
  Tone.Transport.bpm.value = 60; // Set BPM (beats per minute)
  Tone.Transport.start();
  melodyInterval.start(0); // Start the loop immediately
}

function setup() {
  createCanvas(800, 400);
  frameRate(60);
  setupTone(); // Initialize Tone.js
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

// Play the sound for the next flower, rhythmically
function playNextFlowerSound(time) {
  if (flowers.length > 0) {
    let flower = flowers.shift(); // Get the next flower to play
    let flowerColor = flower.color;

    let r = red(flowerColor); // Red component
    let g = green(flowerColor); // Green component
    let b = blue(flowerColor); // Blue component

    // Map the red component to select a note from the scale
    let noteIndex = floor(map(r, 0, 255, 0, scale.length));
    let note = scale[noteIndex];

    // Map green to control volume (soft to louder)
    let volume = map(g, 0, 255, -20, -5);

    // Play the selected note
    synth.triggerAttackRelease(note, "2n", time, Tone.dbToGain(volume));

    // Schedule the flower to be removed later, allowing another bloom
    flowers.push(flower); // Recycle the flower back into the list if needed
  }
}

function mousePressed() {
  // Start Tone.js context on first interaction
  if (Tone.context.state !== "running") {
    Tone.start().then(() => {
      console.log("Audio context started");
    });
  }

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
