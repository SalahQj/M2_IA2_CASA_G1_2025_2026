let pursuer;
let targets = [];
let sliderVitesseMaxCible;

// Variables globales pour les sliders
let sliderPrediction;
let sliderRayonDetection;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Poursuiveur
  pursuer = new Vehicle(random(width), random(height));
  pursuer.maxSpeed = 6; // Un peu plus lent que la cible en mode fuite pour que ça dure
  pursuer.maxForce = 0.2;
  pursuer.r = 24; // Plus gros

  // Cible
  // On crée plusieurs cibles (balles rebondissantes)
  let nbTargets = 5;
  for (let i = 0; i < nbTargets; i++) {
    let t = new BouncingBall(random(width), random(height));
    t.maxSpeed = 6;
    t.maxForce = 0.5;
    t.r = 16;
    targets.push(t);
  }

  // --- Sliders ---

  // Slider Prediction
  let labelPred = createDiv('Prédiction (frames):');
  labelPred.position(10, 10);
  labelPred.style('color', 'white');
  sliderPrediction = createSlider(0, 100, 20, 1);
  sliderPrediction.position(150, 10);

  // Slider Rayon Detection
  let labelVision = createDiv('Rayon Vision:');
  labelVision.position(10, 40);
  labelVision.style('color', 'white');
  sliderRayonDetection = createSlider(10, 300, 100, 1);
  sliderRayonDetection.position(150, 40);
}

function draw() {
  background(0);

  // Mise à jour des targets
  // On trouve la cible la plus proche pour le poursuiveur
  let target = cibleLaPlusProche(pursuer, targets);

  if (target) {
    // Le poursuiveur poursuit la cible la plus proche
    // On pourrait passer la sliderPrediction à la méthode pursue si on modifie la signature
    // Pour l'instant on va modifier le code de pursue directement ou le faire ici si on avait accès
    // On va dessiner le debug ici

    // Debug prediction visuelle (on le fait ici pour utiliser la valeur du slider)
    let prediction = sliderPrediction.value();
    let predictedPos = target.vel.copy().mult(prediction).add(target.pos);

    // Dessin du point de prédiction (cible virtuelle)
    fill("green");
    noStroke();
    circle(predictedPos.x, predictedPos.y, 10);

    // Application de la force de poursuite "custom" (seek sur le point prédit)
    let force = pursuer.seek(predictedPos);
    pursuer.applyForce(force);
  }

  // Déplacement et dessin du poursuiveur
  pursuer.update();
  pursuer.edges();
  pursuer.show();

  // Gestion des cibles
  targets.forEach((t, index) => {
    // Comportement de BouncingBall interne (rebonds)
    // t.edges() est appelé dans BouncingBall.update() en théorie, vérifions.
    // BouncingBall.js a sa propre update qui appelle testeCollisionAvecBordsDuCanvas

    // Mise à jour du rayon de détection depuis le slider
    t.rayonDetection = sliderRayonDetection.value();

    // Logique d'évasion
    let d = p5.Vector.dist(pursuer.pos, t.pos);
    if (d < t.rayonDetection) {
      // Fuite !
      // On utilise le slider prediction aussi pour evade ? ou un fixe ?
      // Utilisons une logique d'évitement simple ou evade implémenté
      // Evade a besoin d'une cible (le poursuiveur)

      // Petite astuce : evade dans vehicle.js calcule une prédiction sur la cible donnée
      // Ici la cible est le poursuiveur.
      // Donc t.evade(pursuer) va fuir la future position du poursuiveur.
      let force = t.evade(pursuer);
      t.applyForce(force);

      // Stress : change de couleur ?
      fill("red");
    } else {
      // Promène toi tranquillement (Wander ? ou juste inertie)
      // Pas de force spéciale, juste inertie
      fill("pink");
    }

    t.update();
    t.show();

    // Collision (Miam !)
    if (d < pursuer.r + t.r) {
      console.log("Miam !");
      targets.splice(index, 1);
    }
  });

  // HUD text
  fill(255);
  noStroke();
  text(sliderPrediction.value(), 300, 25);
  text(sliderRayonDetection.value(), 300, 55);
}

function cibleLaPlusProche(vehicle, targets) {
  let cibleProche = null;
  let distanceMin = Infinity;

  targets.forEach(target => {
    let d = p5.Vector.dist(vehicle.pos, target.pos);
    if (d < distanceMin) {
      distanceMin = d;
      cibleProche = target;
    }
  });

  return cibleProche;
}