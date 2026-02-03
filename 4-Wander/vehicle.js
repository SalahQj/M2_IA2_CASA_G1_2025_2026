class Vehicle {
    constructor(x, y, color) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.acc = createVector(0, 0);
        this.maxSpeed = 4;
        this.maxForce = 0.1;
        this.r = 6;
        this.color = color || [255, 255, 255];

        // Wander parameters
        this.wanderTheta = random(TWO_PI);

        // Limited trail
        this.history = [];
        this.maxHistory = 20;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update(maxSpeed, maxForce) {
        this.maxSpeed = maxSpeed || this.maxSpeed;
        this.maxForce = maxForce || this.maxForce;

        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.set(0, 0);

        // Add to history for limited trail
        this.history.push(this.pos.copy());
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    wander(distance, radius, thetaChange, usePerlin) {
        // 1. Calculate the circle center
        let wanderCenter = this.vel.copy();
        wanderCenter.setMag(distance);
        wanderCenter.add(this.pos);

        // 2. Calculate the displacement on the circle
        if (usePerlin) {
            // Use Perlin noise for smoother variation
            this.wanderTheta = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01) * TWO_PI * 2;
        } else {
            // Random displacement
            this.wanderTheta += random(-thetaChange, thetaChange);
        }

        let displacement = createVector(radius * cos(this.wanderTheta), radius * sin(this.wanderTheta));

        // 3. Target is center + displacement
        let wanderTarget = p5.Vector.add(wanderCenter, displacement);

        // Debug visualization
        if (Vehicle.debug) {
            push();
            noFill();
            stroke(255, 100);
            circle(wanderCenter.x, wanderCenter.y, radius * 2);
            line(this.pos.x, this.pos.y, wanderCenter.x, wanderCenter.y);
            fill(255, 0, 0);
            circle(wanderTarget.x, wanderTarget.y, 8);
            pop();
        }

        // 4. Seek the target
        return this.seek(wanderTarget);
    }

    seek(target) {
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    show() {
        // Draw trail (and handle wrapping correctly)
        noFill();
        stroke(this.color[0], this.color[1], this.color[2], 100);
        strokeWeight(2);

        beginShape();
        for (let i = 0; i < this.history.length; i++) {
            let p = this.history[i];

            // Check for wrapping: if distance to previous point is too big, break the shape
            if (i > 0) {
                let prev = this.history[i - 1];
                let d = p5.Vector.dist(p, prev);
                if (d > 100) { // Threshold for wrapping
                    endShape();
                    beginShape();
                }
            }
            vertex(p.x, p.y);
        }
        endShape();

        // Draw vehicle (triangle)
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        fill(this.color);
        noStroke();
        triangle(-this.r * 2, -this.r, -this.r * 2, this.r, 0, 0);
        pop();
    }

    edges() {
        if (this.pos.x > width + this.r * 2) this.pos.x = -this.r * 2;
        if (this.pos.x < -this.r * 2) this.pos.x = width + this.r * 2;
        if (this.pos.y > height + this.r * 2) this.pos.y = -this.r * 2;
        if (this.pos.y < -this.r * 2) this.pos.y = height + this.r * 2;
    }
}

Vehicle.debug = false;
