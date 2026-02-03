let vehicles = [];
let targets = [];
let font;
let mode = 2; // Default to step 2 (two vehicles)
let exploding = false;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Initialize a pool of vehicles
  for (let i = 0; i < 300; i++) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }

  // Robust font loading
  loadFont('./assets/inconsolata.otf', f => {
    font = f;
    console.log("Font loaded successfully.");
  }, err => {
    console.warn("Font loading failed. Check CORS or path.");
  });

  // Default setup for mode 2
  initMode2();
}

function draw() {
  background(0);

  let mouse = createVector(mouseX, mouseY);

  // Update targets if in explosion mode
  if (exploding) {
    targets.forEach(t => {
      if (t.update) t.update(); // If it's a Target object
      else if (t.vel) t.add(t.vel); // If it's a Vector with vel
    });
  }

  switch (mode) {
    case 1:
      runMode1(mouse);
      break;
    case 2:
      runMode2(mouse);
      break;
    case 3:
      runMode3(mouse);
      break;
    case 4:
      runMode4(mouse);
      break;
    case 5:
      runMode5();
      break;
    case 6:
      runMode6();
      break;
  }

  drawUI();
}

// --- MODES ---

function initMode2() { mode = 2; }

function runMode1(mouse) {
  fill(255, 0, 0, 150);
  noStroke();
  circle(mouse.x, mouse.y, 32);

  let v = vehicles[0];
  v.applyForce(v.arrive(mouse));
  v.update();
  v.show(mouse);
}

function runMode2(mouse) {
  fill(255, 0, 0, 150);
  noStroke();
  circle(mouse.x, mouse.y, 32);

  let v1 = vehicles[0];
  let v2 = vehicles[1];

  v1.applyForce(v1.arrive(mouse));
  v1.update();
  v1.show(mouse);

  // v2 follows v1 at distance d=60
  v2.applyForce(v2.arrive(v1.pos, 60));
  v2.update();
  v2.show(v1.pos);
}

function runMode3(mouse) {
  fill(255, 0, 0, 150);
  noStroke();
  circle(mouse.x, mouse.y, 32);

  let n = 20;
  for (let i = 0; i < n; i++) {
    let v = vehicles[i];
    let targetPos = (i === 0) ? mouse : vehicles[i - 1].pos;

    if (i > 0) {
      // Draw line between segments
      push();
      stroke(255, 255, 255, 100);
      strokeWeight(v.r);
      strokeCap(ROUND);
      line(v.pos.x, v.pos.y, targetPos.x, targetPos.y);
      pop();
    }

    v.applyForce(v.arrive(targetPos, i === 0 ? 0 : 40));
    v.update();
    v.show(targetPos);
  }
}

function runMode4(mouse) {
  let leader = vehicles[0];
  leader.applyForce(leader.arrive(mouse));
  leader.update();
  leader.show(mouse);

  // V-Shape offsets around leader
  let offsets = [
    createVector(-60, 60), createVector(60, 60),
    createVector(-120, 120), createVector(120, 120),
    createVector(-180, 180), createVector(180, 180)
  ];

  for (let i = 0; i < 6; i++) {
    let off = offsets[i].copy();
    let angle = leader.vel.heading() - PI / 2;
    off.rotate(angle);
    let t = p5.Vector.add(leader.pos, off);

    // Draw small circles for targets
    fill(255, 255, 0, 150);
    noStroke();
    circle(t.x, t.y, 6);

    let v = vehicles[i + 1];
    v.applyForce(v.arrive(t));
    v.update();
    v.show(t);
  }
}

function initMode5() {
  mode = 5;
  if (font) {
    targets = font.textToPoints('HELLO', 100, height / 2 + 100, 300, { sampleFactor: 0.1 });
  } else {
    targets = [];
    for (let i = 0; i < 50; i++) targets.push({ x: random(width), y: random(height), alpha: 0 });
  }
}

function runMode5() {
  for (let i = 0; i < targets.length; i++) {
    let t = targets[i];
    let v = vehicles[i % vehicles.length];
    v.applyForce(v.arrive(createVector(t.x, t.y)));
    v.update();
    // Use circles for "Michel" as recommended
    v.showCircle();
  }
}

function initMode6() {
  mode = 6;
  exploding = false;
  targets = [];
  let cols = 5;
  let rows = 4;
  let spacing = 120;
  let startX = width / 2 - (cols - 1) * spacing / 2;
  let startY = height / 2 - (rows - 1) * spacing / 2;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      targets.push(new Target(startX + j * spacing, startY + i * spacing));
    }
  }

  setTimeout(() => {
    if (mode === 6) exploding = true;
  }, 2000);
}

function runMode6() {
  targets.forEach((t, i) => {
    t.show(); // Draw red target circle
    let v = vehicles[i];
    v.applyForce(v.arrive(t.pos));
    v.update();
    v.show(t.pos);
  });
}

function keyPressed() {
  if (key === '1') mode = 1;
  if (key === '2') mode = 2;
  if (key === '3') mode = 3;
  if (key === '4') mode = 4;
  if (key === '5') initMode5();
  if (key === '6') initMode6();
  if (key === 'd') Vehicle.debug = !Vehicle.debug;
}

function drawUI() {
  fill(255);
  noStroke();
  textAlign(LEFT);
  textSize(14);
  text("Touches 1-6 pour les exercices. 'd' pour debug.", 20, 30);
  let modeName = ["Simple", "Deux Véhicules", "Serpent", "Formation", "HELLO (Texte)", "Grille & Explosion"][mode - 1];
  text("Mode actuel : " + modeName, 20, 50);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}