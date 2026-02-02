let target, vehicles = [];
let vitesseMaxSlider, forceMaxSlider;
let nbVehicules = 10;

// la fonction setup est appelée une fois au démarrage du programme par p5.js
// la fonction setup est appelée une fois au démarrage du programme par p5.js
function setup() {
  // on crée un canvas de 800px par 800px
  createCanvas(windowWidth, windowHeight);

  // TODO: créer un tableau de véhicules en global
  // ajouter nb vehicules au tableau dans une boucle
  // avec une position random dans le canvas
  creerVehicules(10);

  // Cible qui se déplace aléatoirement, instance Target
  target = new Target(random(width), random(height));

  // Sliders pour régler la vitesse max et la force max
  // On crée le slider et on le positionne
  vitesseMaxSlider = createSlider(1, 20, 10, 1);
  vitesseMaxSlider.position(920, 10);
  vitesseMaxSlider.size(150);

  // je crée un label juste devant en X
  let labelVitesseMax = createDiv('Vitesse Max:')
  labelVitesseMax.position(810, 10);
  labelVitesseMax.style('color', 'white');
  labelVitesseMax.style('font-size', '14px');

  // Slider pour l'accélaration maximale en dessous du précédent
  forceMaxSlider = createSlider(0.1, 5, 0.5, 0.01);
  forceMaxSlider.position(920, 40);
  forceMaxSlider.size(150);
  let labelForceMax = createDiv('Force Max:')
  labelForceMax.position(810, 40);
  labelForceMax.style('color', 'white');
  labelForceMax.style('font-size', '14px');

  // Curseur pour régler le nombre de véhicules
  // en haut à gauche du canvas
  let nbVehiculesSlider = createSlider(1, 500, 10, 1);
  nbVehiculesSlider.position(10, 10);
  nbVehiculesSlider.size(150);
  let labelNbVehicules = createDiv('Nombre de véhicules:')
  labelNbVehicules.position(10, 30);
  labelNbVehicules.style('color', 'white');
  labelNbVehicules.style('font-size', '14px');

  // ecouteur d'événement pour le slider du nombre de véhicules
  nbVehiculesSlider.input(() => {
    nbVehicules = nbVehiculesSlider.value();
    vehicles = []; // on vide le tableau
    creerVehicules(nbVehicules); // on recrée nb véhicules
  });
}

function creerVehicules(nb) {
  for (let i = 0; i < nb; i++) {
    let v = new Vehicle(random(width), random(height));
    vehicles.push(v);
  }
}

// la fonction draw est appelée en boucle par p5.js, 60 fois par seconde par défaut
// Le canvas est effacé automatiquement avant chaque appel à draw
function draw() {
  // fond noir pour le canvas
  background("black");

  // A partir de maintenant toutes les formes pleines seront en rouge
  fill("red");
  // pas de contours pour les formes.
  noStroke();

  // Mise à jour et affichage de la cible
  // La cible se déplace (méthode de Vehicle, ou override dans Target)
  //target.applyBehaviors(createVector(mouseX, mouseY)); // Optionnel si on veut que la cible fuie la souris ou autre
  target.move(); // Si on a juste fait une méthode move simple
  target.edges();
  target.show();

  vehicles.forEach(vehicle => {
    // On règle la vitesse max du véhicule avec la valeur du slider
    vehicle.maxSpeed = vitesseMaxSlider.value();
    // on affiche la valeur du slider à droite du slider
    fill("white");
    textSize(14);
    textAlign(LEFT);
    text(vehicle.maxSpeed, vitesseMaxSlider.x + vitesseMaxSlider.width + 10, vitesseMaxSlider.y + 15);

    // On règle la force max du véhicule avec la valeur du slider
    vehicle.maxForce = forceMaxSlider.value();
    // on affiche la valeur du slider à droite du slider
    fill("white");
    textSize(14);
    textAlign(LEFT);
    text(vehicle.maxForce, forceMaxSlider.x + forceMaxSlider.width + 10, forceMaxSlider.y + 15);

    // afficher le nombre de véhicules en haut à gauche à droite du curseur
    fill("white");
    textSize(14);
    textAlign(LEFT);
    text(nbVehicules, 170, 25);

    // je déplace et dessine le véhicule
    // "f" pour basculer entre seek et flee (défini dans keyPressed dessous, variable globale behaviorMode)
    vehicle.applyBehaviors(target.pos, behaviorMode);
    vehicle.update();

    // Si le vehicule sort de l'écran
    vehicle.edges();

    // On dessine le véhicule
    vehicle.show();

    // Vérification collision avec la cible
    if (vehicle.pos.dist(target.pos) < target.r + vehicle.r) {
      // Le véhicule réapparait aléatoirement
      vehicle.pos = createVector(random(width), random(height));
    }
  });

  // HUD pour le mode
  fill("white");
  textSize(20);
  textAlign(RIGHT);
  text("Mode (appuyer sur 'f'): " + behaviorMode.toUpperCase(), width - 20, height - 20);
}

let behaviorMode = "seek";
function keyPressed() {
  if (key === 'f' || key === 'F') {
    behaviorMode = (behaviorMode === "seek") ? "flee" : "seek";
  }
}
