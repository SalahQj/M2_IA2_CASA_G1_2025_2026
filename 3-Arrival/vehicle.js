// Calcule la projection orthogonale d'un point a sur le segment [pos, b]
function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos); // Vecteur allant de l'origine au point à projeter
  let v2 = p5.Vector.sub(b, pos); // Vecteur représentant la direction de la route
  v2.normalize(); // On garde uniquement la direction (norme 1)
  let sp = v1.dot(v2); // Produit scalaire pour obtenir la longueur sur l'axe
  v2.mult(sp); // On multiplie la direction par la longueur
  v2.add(pos); // On replace le point par rapport à l'origine du segment
  return v2; // On retourne le point sur la ligne
}

class Vehicle { // Classe pilotant les agents mobiles du système
  static debug = false; // Bascule globale pour afficher les rayons de détection

  constructor(x, y) { // Initialisation du véhicule à sa création
    this.pos = createVector(x, y); // Position (x, y) dans l'espace
    this.vel = createVector(0, 0); // Vitesse actuelle
    this.acc = createVector(0, 0); // Accumulation des forces (accélération)
    this.maxSpeed = 10; // Vitesse de pointe autorisée
    this.maxForce = 0.2; // Capacité maximale de virage/freinage
    this.r = 16; // Dimension physique de base
    this.color = "white"; // Couleur de traînée par défaut
    this.dureeDeVie = 5; // Paramètre de longévité du véhicule

    this.rayonZoneDeFreinage = 100; // Rayon à partir duquel l'objet ralentit vers sa cible

    this.distanceCercle = 150; // Distance du centre du cercle wander devant soi
    this.wanderRadius = 50; // Rayon du cercle pour le mouvement aléatoire
    this.wanderTheta = -Math.PI / 2; // Angle tournant pour le comportement wander
    this.displaceRange = 0.3; // Amplitude de changement d'angle par frame

    this.r_pourDessin = 16; // Taille graphique fixe pour l'affichage
    this.r = this.r_pourDessin * 3; // Rayon effectif (zone de collision) élargi
    this.largeurZoneEvitementDevantVaisseau = this.r / 2; // Largeur du champ visuel

    this.path = []; // Historique des positions pour tracer le chemin parcouru
    this.pathMaxLength = 30; // Nombre max de segments dans la traînée
  }

  update() { // Calcule le nouvel état physique du véhicule
    this.vel.add(this.acc); // Vitesse influencée par les forces appliquées
    this.vel.limit(this.maxSpeed); // On bloque la vitesse au maximum autorisé
    this.pos.add(this.vel); // On déplace le véhicule selon sa vitesse
    this.acc.set(0, 0); // On réinitialise l'accélération pour les prochaines forces

    this.ajoutePosAuPath(); // Mise à jour de la traînée visuelle

    this.dureeDeVie -= 0.01; // Érosion naturelle de la durée de vie
  }

  ajoutePosAuPath() { // Enregistre la position pour l'affichage du chemin
    this.path.push(this.pos.copy()); // Sauvegarde une copie de la position actuelle

    if (this.path.length > this.pathMaxLength) { // Si trop de points mémorisés
      this.path.shift(); // On oublie le point le plus ancien
    }
  }

  applyForce(force) { // Reçoit et cumule les différentes impulsions de mouvement
    this.acc.add(force); // Ajoute la force au vecteur d'accélération globale
  }

  arrive(target, d = 0) { // Calcule la force nécessaire pour se poser doucement sur une cible
    return this.seek(target, true, d); // Appelle seek avec paramètre de freinage (arrival)
  }

  seek(target, arrival = false, d = 0) { // Dirige le véhicule vers un point précis
    let force = p5.Vector.sub(target, this.pos); // Direction idéale vers la cible
    let desiredSpeed = this.maxSpeed; // Vitesse cible par défaut (fond de balle)

    if (arrival) { // Si on doit freiner à l'approche
      let distance = p5.Vector.dist(this.pos, target); // Distance restante
      if (distance < this.rayonZoneDeFreinage) { // Si on entre dans la zone de freinage
        desiredSpeed = map(distance, d, this.rayonZoneDeFreinage, 0, this.maxSpeed); // Gradation de vitesse
      }
    }

    let desiredVelocity = force.copy().setMag(desiredSpeed); // Cap idéal à la bonne vitesse
    let steer = p5.Vector.sub(desiredVelocity, this.vel); // Force de braquage (steering)
    steer.limit(this.maxForce); // On borne le braquage pour éviter des virages à 90°
    return steer; // Retourne le vecteur de steering calculé
  }

  flee(target) { // Fuit une position en s'en éloignant au maximum
    return this.seek(target).mult(-1); // Inverse exact du comportement d'approche
  }

  pursue(vehicle) { // Vise l'endroit où sera l'adversaire dans le futur proche
    let target = vehicle.pos.copy(); // Position actuelle de la proie
    let prediction = vehicle.vel.copy(); // Dynamique de mouvement de la proie
    prediction.mult(10); // Multiplication pour estimer le point d'impact futur
    target.add(prediction); // Décalage de la cible vers cette prédiction
    return this.seek(target); // Direction vers cette projection future
  }

  evade(vehicle) { // Fuit l'endroit où le poursuivant risque d'intercepter
    let pursuit = this.pursue(vehicle); // Analyse l'interception adverse
    pursuit.mult(-1); // Fuit à l'opposé de ce calcul
    return pursuit; // Force d'évasion
  }

  wander() { // Comportement de déplacement "curieux" et aléatoire
    let pointDevant = this.vel.copy(); // Orientation du vaisseau
    pointDevant.setMag(this.distanceCercle); // Projection en avant
    pointDevant.add(this.pos); // Point central du cercle de wander

    push(); // Début groupe de dessin
    if (Vehicle.debug) { // Si le mode debug est on
      fill("red"); // Point rouge indicateur
      noStroke(); // Pas de ligne
      circle(pointDevant.x, pointDevant.y, 8); // Centre du cercle de prévision

      noFill(); // Cercle translucide
      stroke(255); // Bordure blanche
      circle(pointDevant.x, pointDevant.y, this.wanderRadius * 2); // Le cercle de wander virtuel

      strokeWeight(2); // Lignes fines
      stroke(255, 255, 255, 80); // Transparence
      drawingContext.setLineDash([5, 15]); // Pointillés
      line(this.pos.x, this.pos.y, pointDevant.x, pointDevant.y); // Rayon visuel
    }

    let theta = this.wanderTheta + this.vel.heading(); // Angle combiné (direction + variation)
    let pointSurLeCercle = createVector(0, 0); // Préparation du point cible sur le cercle
    pointSurLeCercle.x = this.wanderRadius * cos(theta); // Calcul polaire X
    pointSurLeCercle.y = this.wanderRadius * sin(theta); // Calcul polaire Y
    pointSurLeCercle.add(pointDevant); // Position absolue de la cible d'errance

    if (Vehicle.debug) { // Si debug activé
      fill("green"); // Point vert cible
      noStroke(); // Sans trait
      circle(pointSurLeCercle.x, pointSurLeCercle.y, 16); // La cible ponctuelle du wander

      stroke("yellow"); // Trait jaune directionnel
      strokeWeight(1); // Épaisseur minimum
      drawingContext.setLineDash([]); // Ligne pleine
      line(this.pos.x, this.pos.y, pointSurLeCercle.x, pointSurLeCercle.y); // Ligne vers l'objectif
    }

    this.wanderTheta += random(-this.displaceRange, this.displaceRange); // Dérive aléatoire de l'angle

    let force = p5.Vector.sub(pointSurLeCercle, this.pos); // Calcul de la force vers la cible éphémère
    force.setMag(this.maxForce); // Limitation de l'effort de virage

    pop(); // Fin groupe de dessin
    return force; // Retourne l'impulsion de wandering
  }

  boundaries(bx, by, bw, bh, d) { // Contraint le mouvement à l'intérieur d'un rectangle
    let vitesseDesiree = null; // Variable de stockage du cap de retour

    const xBordGauche = bx + d; // Mur virtuel gauche
    const xBordDroite = bx + bw - d; // Mur virtuel droit
    const yBordHaut = by + d; // Mur virtuel haut
    const yBordBas = by + bh - d; // Mur virtuel bas

    if (this.pos.x < xBordGauche) { // Trop à gauche ?
      vitesseDesiree = createVector(this.maxSpeed, this.vel.y); // Pousse vers la droite
    } else if (this.pos.x > xBordDroite) { // Trop à droite ?
      vitesseDesiree = createVector(-this.maxSpeed, this.vel.y); // Pousse vers la gauche
    }

    if (this.pos.y < yBordHaut) { // Trop haut ?
      vitesseDesiree = createVector(this.vel.x, this.maxSpeed); // Pousse vers le bas
    } else if (this.pos.y > yBordBas) { // Trop bas ?
      vitesseDesiree = createVector(this.vel.x, -this.maxSpeed); // Pousse vers le haut
    }

    if (vitesseDesiree !== null) { // Si une correction est nécessaire
      vitesseDesiree.setMag(this.maxSpeed); // Impulsion à pleine vitesse
      const force = p5.Vector.sub(vitesseDesiree, this.vel); // Steering correctif
      force.limit(this.maxForce); // Virage cadré
      return force; // Retourne la force de rebond
    }

    if (Vehicle.debug) { // Tracés de limites pour debug
      push(); // Bloc graphique
      noFill(); // Vide
      stroke("white"); // Blanc pour cadre réel
      strokeWeight(2); // Cadre visible
      rect(bx, by, bw, bh); // Rectangle de l'écran
      stroke("red"); // Rouge pour zone de peur
      rect(bx + d, by + d, bw - 2 * d, bh - 2 * d); // Zone d'alerte active
      pop(); // Fin bloc
    }

    return createVector(0, 0); // Aucune gêne, mouvement libre (force nulle)
  }

  avoid(obstacles) { // Anticipation de collision frontale avec des obstacles ronds
    let ahead = this.vel.copy(); // Direction courante du nez
    ahead.mult(30); // "Feeler" lointain (projecteur de collision)
    let ahead2 = ahead.copy(); // Double vérification plus rapprochée
    ahead2.mult(0.5); // "Feeler" proche (moitié du précédent)

    if (Vehicle.debug) { // Debug visuel des projecteurs
      this.drawVector(this.pos, ahead, "yellow"); // Dessin de la flèche de vision
    }

    let pointAuBoutDeAhead = this.pos.copy().add(ahead); // Coordonnées du radar lointain
    let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2); // Coordonnées du radar proche

    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles); // On cible la plus grosse menace

    if (obstacleLePlusProche == undefined) { // Aucun obstacle connu ?
      return createVector(0, 0); // Rien à éviter
    }

    let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos); // Distance Radar Lointain <-> Obstacle
    let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos); // Distance Radar Proche <-> Obstacle
    let distance = min(distance1, distance2); // Priorité au danger le plus immédiat

    if (Vehicle.debug) { // Indicateurs de collision imminente
      fill("red"); // Danger lointain
      circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10); // Bulle lointaine
      fill("blue"); // Danger proche
      circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10); // Bulle proche
      push(); // Style temporaire
      stroke(100, 100); // Ligne grise radar
      strokeWeight(this.largeurZoneEvitementDevantVaisseau); // Largeur effective du bus de détection
      line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y); // Champ de vision matérialisé
      pop(); // Fin style
    }

    if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) { // Risque d'impact ?
      let force; // Signal de secours
      if (distance1 < distance2) { // Si collision sur le capteur long
        force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos); // Direction de fuite radiale
      }
      else { // Si collision sur le capteur court
        force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos); // Direction de fuite radiale
      }
      if (Vehicle.debug) { // Flèche de sauvetage
        this.drawVector(obstacleLePlusProche.pos, force, "yellow"); // Montre par où on s'éjecte
      }
      force.setMag(this.maxSpeed); // Effort maximal pour s'écarter
      force.sub(this.vel); // Conversion en force de braquage
      force.limit(this.maxForce / 2); // Dosage pour un virage de sécurité élégant
      return force; // Transmet la force d'évitement
    } else { // Pas d'obstacle sur la trajectoire prédite
      return createVector(0, 0); // Navigation sereine
    }
  }

  getObstacleLePlusProche(obstacles) { // Analyse la liste d'obstacles pour isoler le plus gênant
    let plusPetiteDistance = 100000000; // Seuil initial infini
    let obstacleLePlusProche = undefined; // Récipient du résultat

    obstacles.forEach(o => { // Scanne tous les obstacles de l'arène
      const distance = this.pos.dist(o.pos); // Calcule l'écart spatial
      if (distance < plusPetiteDistance) { // Est-ce le plus près jusque là ?
        plusPetiteDistance = distance; // Enregistre ce nouveau record de proximité
        obstacleLePlusProche = o; // Désigne cet obstacle comme ennemi n°1
      }
    });

    return obstacleLePlusProche; // Délivre l'obstacle prioritaire à surveiller
  }

  drawVector(pos, v, color) { // Outil interne de dessin pour schématiser les forces (flèches)
    push(); // Isole le dessin
    strokeWeight(3); // Épaisseur de trait
    stroke(color); // Couleur de la force
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y); // Corps de la flèche
    let arrowSize = 5; // Dimension du triangle de pointe
    translate(pos.x + v.x, pos.y + v.y); // Se déplace à la fin de la flèche
    rotate(v.heading()); // Oriente la pointe vers la direction du vecteur
    translate(-arrowSize / 2, 0); // Ajustement de centrage
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0); // Dessin de la pointe triangulaire
    pop(); // Restitue le contexte global
  }

  show() { // Rendu graphique final du véhicule à chaque cycle d'affichage
    stroke(255); // Bordures
    strokeWeight(2); // Traits marqués
    fill(255); // Intérieur blanc pour les vaisseaux classiques
    stroke(0); // Cerclage noir net
    strokeWeight(2); // Contour propre
    push(); // Début transformation géométrique
    translate(this.pos.x, this.pos.y); // Positionnement spatial exact
    if (this.vel.mag() > 0.2) // Si le mouvement est significatif
      rotate(this.vel.heading()); // Rotation du vaisseau vers son propre cap

    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0); // Dessin de l'aile volante triangulaire
    pop(); // Fin transformation

    this.drawPath(); // Dessin subsidiaire de la traînée de poudre
  }

  drawPath() { // Génère visuellement la trace "ghost" derrière le véhicule
    push(); // Calque de dessin de traînée
    stroke(255); // Points de sillage blancs
    noFill(); // Sans remplissage
    strokeWeight(1); // Très fin

    fill(this.color); // Teinte personnalisée de la poussière stellaire
    this.path.forEach((p, index) => { // Scanne l'historique de positions
      if (!(index % 5)) { // Optimisation : n'affiche un point que tous les 5 enregistrements
        circle(p.x, p.y, 1); // Pose un grain de poussière à cet endroit passé
      }
    });
    pop(); // Fin calque de traînée
  }

  edges() { // Fonction "Pacman" : bouclage infini des bords de l'écran
    if (this.pos.x > width + this.r) { // Sorti à droite
      this.pos.x = -this.r; // Rentre à gauche
    } else if (this.pos.x < -this.r) { // Sorti à gauche
      this.pos.x = width + this.r; // Rentre à droite
    }
    if (this.pos.y > height + this.r) { // Sorti en bas
      this.pos.y = -this.r; // Rentre en haut
    } else if (this.pos.y < -this.r) { // Sorti en haut
      this.pos.y = height + this.r; // Rentre en bas
    }
  }
}

class Target extends Vehicle { // Spécialisation du véhicule pour faire office de cible mouvante
  constructor(x, y) { // Création d'une nouvelle cible au point (x, y)
    super(x, y); // Héritage des propriétés de base d'un Vehicle
    this.vel = p5.Vector.random2D(); // Impulsion directionnelle initiale aléatoire
    this.vel.mult(5); // Intensité du mouvement autonome de la cible
  }

  show() { // Affichage différencié pour une cible (elle est ronde et rose)
    push(); // Isole le dessin de la cible
    stroke(255); // Bordure blanche lumineuse
    strokeWeight(2); // Accentuation du contour
    fill("#F063A4"); // Couleur rose dynamique
    push(); // Sous-bloc de positionnement
    translate(this.pos.x, this.pos.y); // Se place sur la cible
    circle(0, 0, this.r * 2); // Dessine un cercle parfait au lieu d'un triangle
    pop(); // Fin positionnement
    pop(); // Fin dessin cible
  }
}
