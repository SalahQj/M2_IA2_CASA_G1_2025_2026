class Vaisseau extends Vehicle {
    constructor(x, y, couleur) {
        super(x, y);
        this.couleur = couleur;
        // Poids pour les comportements
        this.seekWeight = 0.5;
        this.avoidWeight = 3;
        this.separateWeight = 2;
        this.boundariesWeight = 1;
        this.wanderForceWeight = 0;
    }

    // on fait une méthode applyBehaviors qui applique les comportements
    // seek et avoid
    applyBehaviors(target, obstacles, vehicules) {

        let seekForce = this.arrive(target);
        let avoidForce = this.avoid(obstacles);
        //let avoidForce = this.avoidAvecVehicules(obstacles, vehicules);
        let separateForce = this.separate(vehicules);
        let boudariesForce = this.boundaries(0, 0, width, height, 50);
        //let wanderForce = this.wander();

        seekForce.mult(this.seekWeight);
        avoidForce.mult(this.avoidWeight);
        separateForce.mult(this.separateWeight);
        boudariesForce.mult(this.boundariesWeight);
        //wanderForce.mult(this.wanderForceWeight);

        this.applyForce(seekForce);
        this.applyForce(avoidForce);
        this.applyForce(separateForce);
        this.applyForce(boudariesForce);
        //this.applyForce(wanderForce);
    }
}
