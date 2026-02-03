let nbVehicules = 20;
let target;
let vehicle;
let vehicles = [];
let snakes = [];
// mode = pour changer le comportement de l'application
let mode = "snake";
let font;
let points = [];
let foods = [];

console.log("Sketch.js: Début du chargement...");

function setup() {
  console.log("Sketch.js: Setup démarré");
  createCanvas(windowWidth, windowHeight);

  // on crée un snake
  let snake = new Snake(width / 2, height / 2, 30, 30, 'lime');
  snakes.push(snake);

  // La cible, ce sera la position de la souris
  target = createVector(random(width), random(height));

  // Chargement de la police avec callbacks pour éviter le blocage
  loadFont('./assets/inconsolata.otf', f => {
    font = f;
    // On ne crée les points que si la police est chargée
    points = font.textToPoints('Hello!', 350, 250, 305, { sampleFactor: 0.03 });
    // on cree des vehicules, autant que de points
    creerVehicules(points.length);
  }, err => {
    console.warn("La police n'a pas pu être chargée. Le mode texte sera limité.");
    points = [];
  });

  // Initialiser quelques points de nourriture
  for (let i = 0; i < 10; i++) {
    spawnFood();
  }
}

function spawnFood() {
  foods.push(createVector(random(width), random(height)));
}

function creerVehicules(n) {
  for (let i = 0; i < n; i++) {
    let v = new Vehicle(random(width), random(height));
    vehicles.push(v);
  }
}

// appelée 60 fois par seconde
function draw() {
  // couleur pour effacer l'écran
  background(0);

  // On dessine les snakes instances de la classe Snake
  snakes.forEach(snake => {
    let targetBruitee = target.copy();
    let index = snakes.indexOf(snake);
    let angleOffset = map(index, 0, snakes.length, -PI / 6, PI / 6);
    let distanceFromTarget = 50;
    let offsetX = cos(angleOffset) * distanceFromTarget;
    let offsetY = sin(angleOffset) * distanceFromTarget;
    targetBruitee.x += offsetX;
    targetBruitee.y += offsetY;
    snake.arrive(targetBruitee);
    snake.show();

    // Logique pour manger
    for (let i = foods.length - 1; i >= 0; i--) {
      let f = foods[i];
      let d = p5.Vector.dist(snake.head.pos, f);
      if (d < snake.r) {
        foods.splice(i, 1);
        snake.addRing();
        spawnFood(); // On en rajoute un nouveau
      }
    }
  });

  // Dessiner la nourriture
  fill(0, 255, 0);
  noStroke();
  foods.forEach(f => {
    circle(f.x, f.y, 10);
  });

  if (points && points.length > 0) {
    dessinerLesPointsDuTexte();
  }

  target.x = mouseX;
  target.y = mouseY;

  // dessin de la cible à la position de la souris
  push();
  fill(255, 0, 0);
  noStroke();
  ellipse(target.x, target.y, 32);
  pop();

  // Comportement des véhicules simples
  vehicles.forEach((vehicle, index) => {
    let steeringForce;
    switch (mode) {
      case "snake":
        if (index === 0) {
          steeringForce = vehicle.arrive(target);
        } else {
          let cible = vehicles[index - 1].pos;
          steeringForce = vehicle.arrive(cible, 30);
        };
        break;
      case "text":
        if (points && points.length > 0) {
          let cibleTexte = points[index % points.length];
          let cible = createVector(cibleTexte.x, cibleTexte.y);
          steeringForce = vehicle.arrive(cible);
        }
        break;
    }
    if (steeringForce) {
      vehicle.applyForce(steeringForce);
    }
    vehicle.update();
    vehicle.show();
  });
}

function dessinerLesPointsDuTexte() {
  points.forEach(pt => {
    push();
    fill("grey");
    noStroke();
    circle(pt.x, pt.y, 15);
    pop();
  });
}

function keyPressed() {
  if (key === 'd') {
    Vehicle.debug = !Vehicle.debug;
  } else if (key === 's') {
    mode = "snake";
  } else if (key === 't') {
    mode = "text";
  } else if (key === 'a') {
    let taille = floor(random(10, 50));
    let couleur = color(random(255), random(255), random(255));
    let snake = new Snake(random(width), random(height), taille, 20, couleur);
    snakes.push(snake);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}