class Vehicle {
  constructor(x, y) {
    // position du véhicule
    this.pos = createVector(x, y);
    // vitesse du véhicule
    this.vel = createVector(0, 0);
    // accélération du véhicule
    this.acc = createVector(0, 0);
    // vitesse maximale du véhicule
    this.maxSpeed = 10;
    // force maximale appliquée au véhicule
    this.maxForce = 0.25;
    // rayon du véhicule
    this.r = 16;
  }

  /*
   seek est une méthode qui permet de faire se rapprocher le véhicule de la cible passée en paramètre
   */
  seek(target) {
    // on calcule la direction vers la cible
    // C'est l'ETAPE 1 (action : se diriger vers une cible)
    let force = p5.Vector.sub(target, this.pos);

    // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
    // on limite ce vecteur à la longueur maxSpeed
    force.setMag(this.maxSpeed);
    // on calcule la force à appliquer pour atteindre la cible
    force.sub(this.vel);
    // on limite cette force à la longueur maxForce
    force.limit(this.maxForce);
    // on applique la force au véhicule
    return force;
  }

  // inverse de seek !
  flee(target, distanceDeDetection = Infinity) {
    return this.seek(target.pos, distanceDeDetection).mult(-1);
  }

  /* Poursuite d'un point devant la target !
     cette methode renvoie la force à appliquer au véhicule
  */
  pursue(target) {
    // 1 - calcul de la position future de la cible
    let targetAhead = target.vel.copy();

    // 2 - prediction : on regarde 10 frames plus loin (par défaut)
    // On pourrait rendre ça paramétrable
    let prediction = 10;
    targetAhead.mult(prediction);

    // 3 - on positionne la target au bout de ce vecteur
    targetAhead.add(target.pos);

    // 4 - dessin du point devant la target (debug)
    // On le dessine seulement si on est le poursuivant (pour éviter de polluer l'écran)
    // ou on le dessine tout le temps pour le debug
    /*
    push();
    fill("green");
    noStroke();
    circle(targetAhead.x, targetAhead.y, 10);
    pop();
    */

    // 5 - appel à seek avec ce point comme cible 
    return this.seek(targetAhead);
  }

  /* inverse de pursue
     cette methode renvoie la force à appliquer au véhicule
  */
  evade(target) {
    // On prédit où sera le poursuivant
    let pursuerAhead = target.vel.copy();
    let prediction = 10;
    pursuerAhead.mult(prediction);
    pursuerAhead.add(target.pos);

    // Et on fuit ce point !
    // Note: evade c'est fuir la position future du poursuivant
    // Ou simplement fuir le poursuivant avec une logique de prediction inverse
    // La consigne dit : invserer la vitesse désirée renvoyée par pursue
    // Donc on reuse pursue mais on inverse le résultat ?
    // "Comme pour flee, il faut inverser la vitesse désirée et non la force renvoyée par pursuit."

    // Implémentation Reynolds standard Evade :
    // Distance to pursuer
    let distance = p5.Vector.dist(this.pos, target.pos);
    // Look ahead time proportional to distance
    let lookAhead = distance / this.maxSpeed; // ou constant

    let predictedTarget = target.vel.copy().mult(lookAhead).add(target.pos);

    return this.flee(predictedTarget);
  }

  // Surcharge de flee pour qu'elle accepte un vecteur direct (pas forcément un objet Vehicle)
  flee(targetPos) {
    // Cible = position à fuir
    // Si targetPos est un objet avec pos, on prend pos, sinon c'est un vecteur
    let target = (targetPos.pos) ? targetPos.pos : targetPos;

    // Pour fuir, on veut une vitesse désirée qui s'éloigne de la cible
    let desiredSpeed = p5.Vector.sub(this.pos, target);
    desiredSpeed.setMag(this.maxSpeed);

    // Pilotage
    let force = p5.Vector.sub(desiredSpeed, this.vel);
    force.limit(this.maxForce);
    return force;
  }


  // applyForce est une méthode qui permet d'appliquer une force au véhicule
  // en fait on additionne le vecteurr force au vecteur accélération
  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    // on ajoute l'accélération à la vitesse. L'accélération est un incrément de vitesse
    // (accélératiion = dérivée de la vitesse)
    this.vel.add(this.acc);
    // on contraint la vitesse à la valeur maxSpeed
    this.vel.limit(this.maxSpeed);
    // on ajoute la vitesse à la position. La vitesse est un incrément de position, 
    // (la vitesse est la dérivée de la position)
    this.pos.add(this.vel);

    // on remet l'accélération à zéro
    this.acc.set(0, 0);
  }

  // On dessine le véhicule
  show() {
    // formes fil de fer en blanc
    stroke(255);
    // épaisseur du trait = 2
    strokeWeight(2);

    // formes pleines en blanc
    fill(255);

    // sauvegarde du contexte graphique (couleur pleine, fil de fer, épaisseur du trait, 
    // position et rotation du repère de référence)
    push();
    // on déplace le repère de référence.
    translate(this.pos.x, this.pos.y);
    // et on le tourne. heading() renvoie l'angle du vecteur vitesse (c'est l'angle du véhicule)
    rotate(this.vel.heading());

    // Dessin d'un véhicule sous la forme d'un triangle. Comme s'il était droit, avec le 0, 0 en haut à gauche
    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    // Que fait cette ligne ?
    //this.edges();

    // draw velocity vector
    pop();
    this.drawVector(this.pos, this.vel.copy().mult(10));
  }

  drawVector(pos, v) {
    push();
    // Dessin du vecteur depuis pos comme origne
    strokeWeight(3);
    stroke("red");
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    // dessine une petite fleche au bout du vecteur vitesse
    let arrowSize = 5;
    translate(pos.x + v.x, pos.y + v.y);
    rotate(v.heading());
    translate(-arrowSize / 2, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  // que fait cette méthode ?
  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }
}

// draw an arrow for a vector at a given base position
function drawArrow(base, vec, myColor) {
  push();
  stroke(myColor);
  strokeWeight(3);
  fill(myColor);
  translate(base.x, base.y);
  line(0, 0, vec.x, vec.y);
  rotate(vec.heading());
  let arrowSize = 7;
  translate(vec.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}