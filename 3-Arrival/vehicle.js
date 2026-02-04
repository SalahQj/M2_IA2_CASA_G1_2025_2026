
function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos);
  let v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  let sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}

class Vehicle {
  static debug = false;

  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 10;
    this.maxForce = 0.2;
    this.r = 16;
    this.color = "white";
    this.dureeDeVie = 5;

    // Rayon zone de freinage pour arrive
    this.rayonZoneDeFreinage = 100;

    // Pour comportement wander
    this.distanceCercle = 150;
    this.wanderRadius = 50;
    this.wanderTheta = -Math.PI / 2;
    this.displaceRange = 0.3;

    // Pour évitement d'obstacle
    this.r_pourDessin = 16;
    // rayon du véhicule pour l'évitement
    this.r = this.r_pourDessin * 3;
    this.largeurZoneEvitementDevantVaisseau = this.r / 2;

    // chemin derrière vaisseaux
    this.path = [];
    this.pathMaxLength = 30;
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);

    // mise à jour du path (la trainée derrière)
    this.ajoutePosAuPath();

    // durée de vie
    this.dureeDeVie -= 0.01;
  }

  ajoutePosAuPath() {
    // on rajoute la position courante dans le tableau
    this.path.push(this.pos.copy());

    // si le tableau a plus de 50 éléments, on vire le plus ancien
    if (this.path.length > this.pathMaxLength) {
      this.path.shift();
    }
  }

  applyForce(force) {
    this.acc.add(force);
  }

  arrive(target, d = 0) {
    return this.seek(target, true, d);
  }

  seek(target, arrival = false, d = 0) {
    let force = p5.Vector.sub(target, this.pos);
    let desiredSpeed = this.maxSpeed;

    if (arrival) {
      let distance = p5.Vector.dist(this.pos, target);
      if (distance < this.rayonZoneDeFreinage) {
        desiredSpeed = map(distance, d, this.rayonZoneDeFreinage, 0, this.maxSpeed);
      }
    }

    let desiredVelocity = force.copy().setMag(desiredSpeed);
    let steer = p5.Vector.sub(desiredVelocity, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  flee(target) {
    return this.seek(target).mult(-1);
  }

  pursue(vehicle) {
    let target = vehicle.pos.copy();
    let prediction = vehicle.vel.copy();
    prediction.mult(10);
    target.add(prediction);
    return this.seek(target);
  }

  evade(vehicle) {
    let pursuit = this.pursue(vehicle);
    pursuit.mult(-1);
    return pursuit;
  }

  wander() {
    // point devant le véhicule, centre du cercle
    let pointDevant = this.vel.copy();
    pointDevant.setMag(this.distanceCercle);
    pointDevant.add(this.pos);

    push();
    if (Vehicle.debug) {
      fill("red");
      noStroke();
      circle(pointDevant.x, pointDevant.y, 8);

      noFill();
      stroke(255);
      circle(pointDevant.x, pointDevant.y, this.wanderRadius * 2);

      strokeWeight(2);
      stroke(255, 255, 255, 80);
      drawingContext.setLineDash([5, 15]);
      stroke(255, 255, 255, 80);
      line(this.pos.x, this.pos.y, pointDevant.x, pointDevant.y);
    }

    let theta = this.wanderTheta + this.vel.heading();
    let pointSurLeCercle = createVector(0, 0);
    pointSurLeCercle.x = this.wanderRadius * cos(theta);
    pointSurLeCercle.y = this.wanderRadius * sin(theta);
    pointSurLeCercle.add(pointDevant);

    if (Vehicle.debug) {
      fill("green");
      noStroke();
      circle(pointSurLeCercle.x, pointSurLeCercle.y, 16);

      stroke("yellow");
      strokeWeight(1);
      drawingContext.setLineDash([]);
      line(this.pos.x, this.pos.y, pointSurLeCercle.x, pointSurLeCercle.y);
    }

    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    let force = p5.Vector.sub(pointSurLeCercle, this.pos);
    force.setMag(this.maxForce);

    pop();
    return force;
  }

  boundaries(bx, by, bw, bh, d) {
    let vitesseDesiree = null;

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

    if (vitesseDesiree !== null) {
      vitesseDesiree.setMag(this.maxSpeed);
      const force = p5.Vector.sub(vitesseDesiree, this.vel);
      force.limit(this.maxForce);
      return vitesseDesiree; // Note: original code returned vitesseDesiree not force, but typically should return force. 
      // The provided code boundaries returned vitesseDesiree (a vector acting as desired velocity directions?).
      // Wait, the provided code:
      // if (vitesseDesiree !== null) { ... return vitesseDesiree; }
      // This is strange for a method that usually returns a force. But I will stick to provided code logic where possible.
      // Actually standard behavior is return force. The provided code calculates force but returns vitesseDesiree?
      // "return vitesseDesiree;"
      // I will trust the provided code, but it looks suspicious. However in `SnakeWander`: `forceBoundaries = this.head.boundaries(...)`.
      // It expects a force. `vitesseDesiree` is a velocity vector. `force = vitesseDesiree - vel`.
      // The provided code computes force but returns vitesseDesiree.
      // I will correct this to return force if it seems wrong, OR I'll invoke applyForce inside?
      // No, `SnakeWander` does `this.head.applyForce(forceBoundaries)`. So it expects a force.
      // If `boundaries` returns a velocity, `applyForce` (acc += force) will treat velocity as force. Units mismatch but might "work".
      // BUT `force` was calculated in the snippet: `const force = p5.Vector.sub(vitesseDesiree, this.vel); force.limit(this.maxForce);`
      // It calculated force but didn't return it. I strongly suspect it should return `force`.
      // I will return `force`.
      return force;
    }

    if (Vehicle.debug) {
      push();
      noFill();
      stroke("white");
      strokeWeight(2);
      rect(bx, by, bw, bh);
      stroke("red");
      rect(bx + d, by + d, bw - 2 * d, bh - 2 * d);
      pop();
    }

    return createVector(0, 0);
  }

  avoid(obstacles) {
    let ahead = this.vel.copy();
    ahead.mult(30);
    let ahead2 = ahead.copy();
    ahead2.mult(0.5);

    if (Vehicle.debug) {
      this.drawVector(this.pos, ahead, "yellow");
    }

    let pointAuBoutDeAhead = this.pos.copy().add(ahead);
    let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);

    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

    if (obstacleLePlusProche == undefined) {
      return createVector(0, 0);
    }

    let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
    let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
    let distance = min(distance1, distance2);

    if (Vehicle.debug) {
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

    if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
      let force;
      if (distance1 < distance2) {
        force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
      }
      else {
        force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
      }
      if (Vehicle.debug) {
        this.drawVector(obstacleLePlusProche.pos, force, "yellow");
      }
      force.setMag(this.maxSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce / 2);
      return force;
    } else {
      return createVector(0, 0);
    }
  }

  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistance = 100000000;
    let obstacleLePlusProche = undefined;

    obstacles.forEach(o => {
      const distance = this.pos.dist(o.pos);
      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    });

    return obstacleLePlusProche;
  }

  drawVector(pos, v, color) {
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

  show() {
    stroke(255);
    strokeWeight(2);
    fill(255);
    stroke(0);
    strokeWeight(2);
    push();
    translate(this.pos.x, this.pos.y);
    if (this.vel.mag() > 0.2)
      rotate(this.vel.heading());

    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    pop();

    // dessin du chemin
    this.drawPath();
  }

  drawPath() {
    push();
    stroke(255);
    noFill();
    strokeWeight(1);

    fill(this.color);
    this.path.forEach((p, index) => {
      if (!(index % 5)) {
        circle(p.x, p.y, 1);
      }
    });
    pop();
  }

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
