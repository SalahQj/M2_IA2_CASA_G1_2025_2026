let nbVehicules = 20; // Nombre initial de véhicules simples (non utilisé actuellement car écrasé par font)
let target; // Vecteur représentant la destination cible (souvent la souris)
let vehicle; // Variable pour un véhicule individuel (legacy)
let vehicles = []; // Tableau contenant tous les véhicules simples du mode "snake/text"
let snakes = []; // Tableau contenant toutes les instances de serpents (Snake ou SnakeWander)
// Variable de contrôle de mode : détermine le comportement des 'vehicles' (suite de points ou texte)
let mode = "snake";
let font; // Variable pour stocker la police de caractères Inconsolata
let points = []; // Tableau stockant les points (x, y) issus de la transformation d'un texte
let foods = []; // Tableau stockant les positions des points de nourriture à manger
let obstacles = []; // Liste globale des obstacles présents sur le canvas

console.log("Sketch.js: Début du chargement..."); // Message informatif dans la console de debug

function setup() { // Fonction d'initialisation appelée une seule fois au lancement
  console.log("Sketch.js: Setup démarré"); // Signal de début de setup
  createCanvas(windowWidth, windowHeight); // Crée la zone de dessin à la taille de la fenêtre

  // Initialisation d'un premier serpent vert lime au centre de l'écran
  let snake = new Snake(width / 2, height / 2, 30, 30, 'lime');
  snakes.push(snake); // Ajout du serpent dans la liste globale

  // Création initiale de la cible à un endroit aléatoire de l'écran
  target = createVector(random(width), random(height));

  // Chargement asynchrone de la police depuis le dossier local assets
  loadFont('./assets/inconsolata.otf', f => {
    font = f; // On garde la police chargée en mémoire
    // On transforme un texte en une série de points pour le mode "text"
    points = font.textToPoints('Hello!', 350, 250, 305, { sampleFactor: 0.03 });
    // On crée autant de véhicules que de points détectés dans le texte
    creerVehicules(points.length);
  }, err => { // Cas d'échec du chargement de la police
    console.warn("La police n'a pas pu être chargée. Le mode texte sera limité.");
    points = []; // On vide les points pour éviter les erreurs
  });

  // Boucle pour générer 10 points de nourriture aléatoires dès le départ
  for (let i = 0; i < 10; i++) {
    spawnFood();
  }

  // Placement d'un gros obstacle statique au milieu de l'écran
  obstacles.push(new Obstacle(width / 2, height / 2, 100));
}

function spawnFood() { // Crée aléatoirement une nouvelle pépite de nourriture
  foods.push(createVector(random(width), random(height)));
}

function creerVehicules(n) { // Instancie n véhicules classiques dans le système
  for (let i = 0; i < n; i++) {
    let v = new Vehicle(random(width), random(height)); // Position aléatoire
    vehicles.push(v); // Stockage dans le tableau
  }
}

// Fonction de boucle infinie (60 images par seconde par défaut)
function draw() {
  background(0); // Efface l'écran avec un fond noir

  // Rendu graphique de tous les obstacles présents sur la scène
  obstacles.forEach(o => o.show());

  // Mise à jour et dessin de chaque serpent dans la liste
  snakes.forEach(snake => {
    let targetBruitee = target.copy(); // On part de la cible principale (souris)
    let index = snakes.indexOf(snake); // Position du serpent dans la liste
    // Légère variation d'angle pour que plusieurs serpents ne se chevauchent pas trop
    let angleOffset = map(index, 0, snakes.length, -PI / 6, PI / 6);
    let distanceFromTarget = 50; // Distance tampon par rapport à la souris
    let offsetX = cos(angleOffset) * distanceFromTarget; // Calcul du décalage X
    let offsetY = sin(angleOffset) * distanceFromTarget; // Calcul du décalage Y
    targetBruitee.x += offsetX; // Application du décalage
    targetBruitee.y += offsetY; // Application du décalage

    // Déclenche le mouvement intelligent du serpent (poursuite + évitement obstacles)
    snake.move(targetBruitee, obstacles);
    snake.show(); // Affiche visuellement le serpent

    // Détection de collision entre la tête du serpent et la nourriture
    for (let i = foods.length - 1; i >= 0; i--) { // On boucle à l'envers car on supprime des éléments
      let f = foods[i]; // Position de la nourriture actuelle
      let d = p5.Vector.dist(snake.head.pos, f); // Calcul de la distance tête-nourriture
      if (d < snake.head.r) { // Si la collision est avérée (serpent "mange")
        foods.splice(i, 1); // Suppression du point de nourriture mangé
        snake.addRing(); // Allongement du serpent d'un anneau
        spawnFood(); // Création immédiate d'une nouvelle nourriture ailleurs
      }
    }
  });

  // Rendu visuel de toutes les nourritures restantes (petits points verts)
  fill(0, 255, 0);
  noStroke();
  foods.forEach(f => {
    circle(f.x, f.y, 10);
  });

  // Affichage des repères gris si le mode texte est activé
  if (points && points.length > 0) {
    dessinerLesPointsDuTexte();
  }

  // Synchronisation de la cible sur les coordonnées réelles de la souris
  target.x = mouseX;
  target.y = mouseY;

  // Dessin d'un repère visuel (gros point rouge) à l'emplacement de la cible
  push();
  fill(255, 0, 0);
  noStroke();
  ellipse(target.x, target.y, 32);
  pop();

  // Gestion de l'IA pour les véhicules simples ("vaisseaux")
  vehicles.forEach((vehicle, index) => {
    let steeringForce;
    switch (mode) { // Détermine la force appliquée selon le mode actif
      case "snake": // Mode où les véhicules forment une file derrière la tête
        if (index === 0) { // Le premier véhicule vise la souris
          steeringForce = vehicle.arrive(target);
        } else { // Les suivants visent la position de celui qui les précède
          let cible = vehicles[index - 1].pos;
          steeringForce = vehicle.arrive(cible, 30);
        };
        break;
      case "text": // Mode où chaque véhicule rejoint un point du texte 'Hello'
        if (points && points.length > 0) {
          let cibleTexte = points[index % points.length]; // Répartition sur les points dispo
          let cible = createVector(cibleTexte.x, cibleTexte.y);
          steeringForce = vehicle.arrive(cible);
        }
        break;
    }

    if (steeringForce) {
      vehicle.applyForce(steeringForce); // Applique le steering de mouvement
    }

    // Application forcée de l'évitement d'obstacles pour tous les véhicules isolés
    let avoidForce = vehicle.avoid(obstacles);
    avoidForce.mult(3); // On amplifie la peur de l'obstacle pour plus de sûreté
    vehicle.applyForce(avoidForce);

    vehicle.update(); // Met à jour la physique
    vehicle.show(); // Affiche le triangle du vaisseau
  });
}

function dessinerLesPointsDuTexte() { // Affiche les points de destination gris du texte
  points.forEach(pt => {
    push();
    fill("grey");
    noStroke();
    circle(pt.x, pt.y, 15);
    pop();
  });
}

function mousePressed() { // Événement de clic de souris : crée un obstacle là où on clique
  obstacles.push(new Obstacle(mouseX, mouseY, random(20, 80)));
}

function keyPressed() { // Gestion des touches clavier
  if (key === 'd') { // Touche 'd' : Bascule l'affichage du mode debug
    Vehicle.debug = !Vehicle.debug;
  } else if (key === 's') { // Touche 's' : Force le mode serpent pour les véhicules simples
    mode = "snake";
  } else if (key === 't') { // Touche 't' : Force le mode texte
    mode = "text";
  } else if (key === 'a') { // Touche 'a' : Ajoute un nouveau serpent complet
    let taille = floor(random(10, 50)); // Taille d'anneau aléatoire
    let couleur = color(random(255), random(255), random(255)); // Teinte aléatoire
    let snake;
    // 50% de chance de créer un serpent qui suit la souris VS un serpent qui erre (Wander)
    if (random(1) < 0.5) {
      snake = new Snake(random(width), random(height), taille, 20, couleur);
    } else {
      snake = new SnakeWander(random(width), random(height), taille, 20, couleur);
    }
    snakes.push(snake);
  }
}

function windowResized() { // Redimensionne le canevas si la fenêtre change de taille
  resizeCanvas(windowWidth, windowHeight);
}