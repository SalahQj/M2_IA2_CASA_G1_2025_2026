class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(5); // Arbitrary speed for target
    this.r = 32; // Radius matches the circle drawing in sketch.js
  }

  show() {
    push();
    stroke(255);
    strokeWeight(2);
    fill("red");
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }

  // Override applyBehaviors if needed, or just let it move straight
  // For now, let's just make it move linearly and bounce or wrap
  move() {
      this.pos.add(this.vel);
  }
}
