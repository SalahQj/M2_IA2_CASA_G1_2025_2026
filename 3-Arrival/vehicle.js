/*
  Calcule la projection orthogonale du point a sur le vecteur b
  a et b sont des vecteurs calculés comme ceci :
  let v1 = p5.Vector.sub(a, pos); soit v1 = pos -> a
  let v2 = p5.Vector.sub(b, pos); soit v2 = pos -> b
*/
function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos); // Vecteur allant du point pos vers le point a
  let v2 = p5.Vector.sub(b, pos); // Vecteur allant du point pos vers le point b
  v2.normalize(); // On normalise le second vecteur pour n'avoir que sa direction
  let sp = v1.dot(v2); // Produit scalaire pour trouver la magnitude de la projection
  v2.mult(sp); // On multiplie la direction par cette magnitude
  v2.add(pos); // On ajoute l'origine pour obtenir les coordonnées du point projeté
  return v2; // On retourne le point projeté résultant
}

class Vehicle { // Définition de la classe de base pour tout objet mobile
  static debug = false; // Variable statique pour activer/désactiver l'affichage de debug

  constructor(x, y) { // Constructeur prenant les coordonnées initiales
    // position du véhicule
    this.pos = createVector(x, y); // Vecteur de position actuelle
    // vitesse du véhicule
    this.vel = createVector(0, 0); // Vecteur de vitesse actuelle (initialement nul)
    // accélération du véhicule
    this.acc = createVector(0, 0); // Vecteur d'accélération (cumul des forces)
    // vitesse maximale du véhicule
    this.maxSpeed = 4; // Vitesse maximale autorisée (réduite à 4 selon votre snippet)
    // force maximale appliquée au véhicule
    this.maxForce = 0.2; // Force de virage (steering) maximale applicable
    this.color = "white"; // Couleur par défaut du véhicule
    // à peu près en secondes
    this.dureeDeVie = 5; // Durée de vie restante

    this.r_pourDessin = 16; // Taille graphique utilisée pour le tracé
    // rayon du véhicule pour l'évitement
    this.r = this.r_pourDessin * 3; // Mise à jour du rayon réel pour l'évitement

    // Pour évitement d'obstacle
    this.largeurZoneEvitementDevantVaisseau = this.r / 2; // Champ de détection frontal

    // chemin derrière vaisseaux
    this.path = []; // Tableau stockant les positions précédentes
    this.pathMaxLength = 30; // Nombre maximum de points stockés

    // Pour wander
    this.distanceCercle = 200; // Distance du centre du cercle wander
    this.wanderRadius = 80; // Rayon du cercle pour le mouvement aléatoire
    this.wanderTheta = -Math.PI / 2; // Angle tournant pour le comportement wander
    this.displaceRange = 0.3; // Variation de l'angle à chaque frame

    // Poids pour les comportements
    this.seekWeight = 0.3; // Poids pour le comportement seek
    this.avoidWeight = 3; // Poids pour l'évitement (prioritaire)
    this.separateWeight = 0.1; // Poids pour la séparation
    this.boundariesWeight = 3; // Poids pour rester dans les bords
    this.wanderForceWeight = 0; // Poids par défaut pour le wander
  }

  applyBehaviors() { // Méthode destinée à être redéfinie dans les sous-classes
    // to be redefined in subclasses
  }

  avoid(obstacles) { // Détection et évitement d'obstacles circulaires
    // calcul d'un vecteur ahead devant le véhicule qui regarde 30 frames devant
    let ahead = this.vel.copy(); // Direction actuelle
    ahead.mult(30); // Projecteur lointain
    // on calcule ahead2 deux fois plus petit
    let ahead2 = ahead.copy(); // Direction actuelle
    ahead2.mult(0.5); // Projecteur proche (mi-distance)

    if (Vehicle.debug) { // Si debug activé, on dessine les rayons
      this.drawVector(this.pos, ahead, "yellow"); // Dessin du radar jaune
    }

    // Calcul des coordonnées des points au bout des vecteurs ahead
    let pointAuBoutDeAhead = this.pos.copy().add(ahead); // Point futur lointain
    let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2); // Point futur proche

    // Detection de l'obstacle le plus proche
    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

    // Si pas d'obstacle, on renvoie un vecteur nul
    if (obstacleLePlusProche == undefined) {
      return createVector(0, 0);
    }

    // On calcule la distance entre l'obstacle et le bout des vecteurs ahead
    let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos); // Écart au point lointain
    let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos); // Écart au point proche
    let distance = min(distance1, distance2); // On retient le danger le plus proche

    if (Vehicle.debug) { // Tracés de debug pour la collision possible
      fill("red");
      circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
      fill("blue");
      circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);

      push();
      stroke(100, 100);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau);
      line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
      pop();
    }

    // Si la distance est inférieure au rayon de l'obstacle + largeur du vaisseau
    if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
      // collision possible : calcul de la force d'évitement
      let force;
      if (distance1 < distance2) { // Force basée sur le point au bout du vecteur ahead
        force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
      }
      else { // Sinon basée sur ahead2
        force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
      }

      if (Vehicle.debug) { // Visualisation de la force corrective
        this.drawVector(obstacleLePlusProche.pos, force, "yellow");
      }

      // Pilotage : calcul de la vitesse désirée et du steering
      force.setMag(this.maxSpeed); // Cap idéal à pleine vitesse
      force.sub(this.vel); // Steering = désirée - actuelle
      force.limit(this.maxForce / 2); // Limitation du braquage
      return force; // Retourne la force d'évitement
    } else {
      return createVector(0, 0); // Pas de collision détectée
    }
  }

  avoidAvecVehicules(obstacles, vehicules) { // Version avancée incluant d'autres véhicules (votre snippet)
    push(); // Début contexte local
    let distanceAhead = 50; // On regarde 50 frames devant
    let ahead = this.vel.copy(); // Direction actuelle
    ahead.mult(distanceAhead); // Longueur du projecteur

    let ahead2 = this.vel.copy(); // Point à mi-distance
    ahead2.mult(distanceAhead * 0.5); // Projecteur moitié

    if (Vehicle.debug) { // Dessin de détection avancée
      this.drawVector(this.pos, ahead, "yellow");
      this.drawVector(this.pos, ahead2, "orange");
    }

    let pointAuBoutDeAhead = p5.Vector.add(this.pos, ahead); // Cible radar 1
    let pointAuBoutDeAhead2 = p5.Vector.add(this.pos, ahead2); // Cible radar 2

    // Cherche les obstacles les plus proches pour chaque point
    let obstacleLePlusProche = this.getClosestObstacle(pointAuBoutDeAhead, obstacles);
    let obstacleLePlusProche2 = this.getClosestObstacle(pointAuBoutDeAhead2, obstacles);
    let obstaceLePlusProche3 = this.getClosestObstacle(this.pos, obstacles);
    let vehiculeLePlusProche = this.getVehiculeLePlusProche(vehicules);

    // Calcul de toutes les distances critiques
    let distance = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
    let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche2.pos);
    let distance3 = this.pos.dist(obstaceLePlusProche3.pos);
    let distance4 = (vehiculeLePlusProche !== undefined) ? this.pos.dist(vehiculeLePlusProche.pos) : Infinity;

    // Détermination du point le plus en danger ("pointUtilise")
    let pointUtilise;
    if (distance <= distance2 && distance <= distance3 && distance <= distance4) {
      pointUtilise = pointAuBoutDeAhead;
    } else if (distance2 <= distance && distance2 <= distance3 && distance2 < distance4) {
      pointUtilise = pointAuBoutDeAhead2;
      obstacleLePlusProche = obstacleLePlusProche2;
      distance = distance2;
    } else if (distance3 <= distance && distance3 <= distance2 && distance3 <= distance4) {
      pointUtilise = this.pos;
      obstacleLePlusProche = obstaceLePlusProche3;
      distance = distance3;
    } else { // Cas où l'obstacle le plus proche est un autre véhicule
      pointUtilise = this.pos;
      obstacleLePlusProche = vehiculeLePlusProche;
      distance = distance4;
    }

    if (Vehicle.debug) { // Rendu debug du point utilisé
      fill("red");
      circle(pointUtilise.x, pointUtilise.y, 10);
      stroke(100, 100);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau);
      line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
    }

    let force;
    if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
      force = p5.Vector.sub(pointUtilise, obstacleLePlusProche.pos); // Direction de fuite
      if (Vehicle.debug) this.drawVector(obstacleLePlusProche.pos, force, "yellow");
      force.setMag(this.maxForce); // Limitation de la puissance
    } else {
      force = createVector(0, 0); // Libre de tout obstacle
    }

    pop(); // Fin contexte
    return force; // Retourne l'impulsion corrective
  }

  wander() { // Comportement erratique (votre snippet)
    let pointDevant = this.vel.copy(); // Direction nez
    pointDevant.setMag(this.distanceCercle); // Projection avant
    pointDevant.add(this.pos); // Centre du cercle wander

    push(); // Bloc dessin
    if (Vehicle.debug) { // Debug du cercle wander
      fill("red");
      noStroke();
      circle(pointDevant.x, pointDevant.y, 8);
      noFill();
      stroke(255);
      circle(pointDevant.x, pointDevant.y, this.wanderRadius * 2);
      strokeWeight(2);
      stroke(255, 255, 255, 80);
      drawingContext.setLineDash([5, 15]);
      line(this.pos.x, this.pos.y, pointDevant.x, pointDevant.y);
    }

    let theta = this.wanderTheta + this.vel.heading(); // Angle global
    let pointSurLeCercle = createVector(0, 0); // Cible sur le cercle
    pointSurLeCercle.x = this.wanderRadius * cos(theta);
    pointSurLeCercle.y = this.wanderRadius * sin(theta);
    pointSurLeCercle.add(pointDevant); // Position absolue de la cible

    if (Vehicle.debug) { // Dessin cible verte et ligne jaune
      fill("green");
      noStroke();
      circle(pointSurLeCercle.x, pointSurLeCercle.y, 16);
      stroke("yellow");
      strokeWeight(1);
      drawingContext.setLineDash([]);
      line(this.pos.x, this.pos.y, pointSurLeCercle.x, pointSurLeCercle.y);
    }

    this.wanderTheta += random(-this.displaceRange, this.displaceRange); // Déplacement de l'angle

    let force = p5.Vector.sub(pointSurLeCercle, this.pos); // Force vers la cible
    force.setMag(this.maxForce); // Limitation puissance
    pop(); // Fin dessin
    return force; // Retourne force wander
  }

  boundaries(bx, by, bw, bh, d) { // Contours rectangulaires (votre snippet)
    let vitesseDesiree = null; // Cap de secours

    const xBordGauche = bx + d;
    const xBordDroite = bx + bw - d;
    const yBordHaut = by + d;
    const yBordBas = by + bh - d;

    if (this.pos.x < xBordGauche) {
      vitesseDesiree = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > xBordDroite) {
      vitesseDesiree = createVector(-this.maxSpeed, this.vel.y);
    }

    if (this.pos.y < yBordHaut) {
      vitesseDesiree = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > yBordBas) {
      vitesseDesiree = createVector(this.vel.x, -this.maxSpeed);
    }

    if (vitesseDesiree !== null) { // Si bord approché (logique exacte de votre snippet)
      vitesseDesiree.setMag(this.maxSpeed); // Force vers l'intérieur
      const force = p5.Vector.sub(vitesseDesiree, this.vel); // Calcul steering
      vitesseDesiree.limit(this.maxForce); // Limitation selon votre logique (note: utilise vitesseDesiree ici)
      return vitesseDesiree; // Retourne vitesseDesiree selon le snippet
    }

    if (Vehicle.debug) { // Cadres rouges de debug
      push();
      noFill();
      stroke("white");
      strokeWeight(2);
      rect(bx, by, bw, bh);
      stroke("red");
      rect(bx + d, by + d, bw - 2 * d, bh - 2 * d);
      pop();
    }

    return createVector(0, 0); // En sécurité, aucune correction
  }

  getObstacleLePlusProche(obstacles) { // Scanne tous les obstacles (votre snippet)
    let plusPetiteDistance = 100000000;
    let obstacleLePlusProche = undefined;

    obstacles.forEach(o => {
      const distance = this.pos.dist(o.pos); // Distance entre vaisseau et obstacle
      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    });
    return obstacleLePlusProche;
  }

  getVehiculeLePlusProche(vehicules) { // Scanne les autres agents
    let plusPetiteDistance = Infinity;
    let vehiculeLePlusProche = undefined;

    vehicules.forEach(v => {
      if (v != this) {
        const distance = this.pos.dist(v.pos);
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          vehiculeLePlusProche = v;
        }
      }
    });
    return vehiculeLePlusProche;
  }

  getClosestObstacle(pos, obstacles) { // Cherche obstacle proche d'un point précis
    let closestObstacle = null;
    let closestDistance = 1000000000;
    for (let obstacle of obstacles) {
      let distance = pos.dist(obstacle.pos);
      if (closestObstacle == null || distance < closestDistance) {
        closestObstacle = obstacle;
        closestDistance = distance;
      }
    }
    return closestObstacle;
  }

  arrive(target) { // Freinage progressif à l'arrivée
    return this.seek(target, true); // Active le mode arrival de seek
  }

  seek(target, arrival = false) { // Poursuite d'une cible statique
    let force = p5.Vector.sub(target, this.pos); // Cap vers la cible
    let desiredSpeed = this.maxSpeed; // Vitesse cible par défaut
    if (arrival) { // Calcul du freinage progressif
      let slowRadius = 100;
      let distance = force.mag();
      if (distance < slowRadius) {
        desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
      }
    }
    force.setMag(desiredSpeed); // Orientation à la bonne vitesse
    force.sub(this.vel); // Steering = désir - actuel
    force.limit(this.maxForce); // Limitation effort
    return force;
  }

  flee(target) { // Fuite d'un point
    return this.seek(target).mult(-1); // Inverse du seek
  }

  pursue(vehicle) { // Interception anticipée
    let target = vehicle.pos.copy();
    let prediction = vehicle.vel.copy();
    prediction.mult(10); // Anticipe 10 frames
    target.add(prediction);
    fill(0, 255, 0); // Point vert d'anticipation
    circle(target.x, target.y, 16);
    return this.seek(target); // Seek vers ce futur
  }

  evade(vehicle) { // Évasion anticipée
    let pursuit = this.pursue(vehicle);
    pursuit.mult(-1); // Fuite du futur intercepteur
    return pursuit;
  }

  separate(boids) { // Répulsion des voisins pour éviter les amas
    let desiredseparation = this.r;
    let steer = createVector(0, 0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < desiredseparation) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d); // Force inversement proportionnelle à la distance
        steer.add(diff);
        count++;
      }
    }
    if (count > 0) steer.div(count);
    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
    }
    return steer;
  }

  applyForce(force) { // Ajout d'une force à l'accélération cumulée
    this.acc.add(force);
  }

  update() { // Intégration physique : position += vitesse += accélération
    this.vel.add(this.acc); // Mise à jour vitesse
    this.vel.limit(this.maxSpeed); // Vitesse max
    this.pos.add(this.vel); // Mise à jour position
    this.acc.set(0, 0); // RAZ accélération
    this.ajoutePosAuPath(); // Trace traînée
    this.dureeDeVie -= 0.01; // Temps qui passe
  }

  ajoutePosAuPath() { // Historique du mouvement
    this.path.push(this.pos.copy());
    if (this.path.length > this.pathMaxLength) this.path.shift();
  }

  show() { // Affichage complet : traînée + vaisseau
    this.drawPath();
    this.drawVehicle();
  }

  drawVehicle() { // Rendu du triangle vaisseau (votre snippet)
    stroke(255); // Bord blanc
    strokeWeight(2); // Épaisseur
    fill(this.color); // Teinte personnalisée
    push(); // Isole transformation
    translate(this.pos.x, this.pos.y); // Position
    rotate(this.vel.heading()); // Orientation
    triangle(-this.r_pourDessin, -this.r_pourDessin / 2, -this.r_pourDessin, this.r_pourDessin / 2, this.r_pourDessin, 0);
    if (Vehicle.debug) { // Cercle détection debug
      stroke(255);
      noFill();
      circle(0, 0, this.r);
    }
    pop(); // Fin transformation
    if (Vehicle.debug) { // Cercle absolu debug
      stroke(255);
      noFill();
      circle(this.pos.x, this.pos.y, this.r);
    }
  }

  drawPath() { // Rendu des points de trace
    push();
    stroke(255);
    noFill();
    strokeWeight(1);
    fill(this.color);
    this.path.forEach((p, index) => {
      if (!(index % 5)) circle(p.x, p.y, 1);
    });
    pop();
  }

  drawVector(pos, v, color) { // Utilitaire dessin flèches
    push();
    strokeWeight(3);
    stroke(color);
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    let arrowSize = 5;
    translate(pos.x + v.x, pos.y + v.y);
    rotate(v.heading());
    translate(-arrowSize / 2, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  edges() { // Téléportation écran Pac-Man
    if (this.pos.x > width + this.r) this.pos.x = -this.r;
    else if (this.pos.x < -this.r) this.pos.x = width + this.r;
    if (this.pos.y > height + this.r) this.pos.y = -this.r;
    else if (this.pos.y < -this.r) this.pos.y = height + this.r;
  }
}

class Target extends Vehicle { // Cible ronde héritant du véhicule
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(5);
  }
  show() {
    push();
    stroke(255);
    strokeWeight(2);
    fill("#F063A4");
    push();
    translate(this.pos.x, this.pos.y);
    circle(0, 0, this.r * 2);
    pop();
    pop();
  }
}
