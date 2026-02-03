class Snake extends Vehicle {
    constructor(x, y, length, taille, couleur) {
        super(x, y);
        this.anneaux = [];
        this.couleur = couleur;
        this.r = taille;
        this.voirLangue = false;

        // On crée la tête du snake
        this.head = new Vehicle(x, y, this.couleur);
        this.anneaux.push(this.head);

        // On crée les anneaux suivants
        for (let i = 1; i < length; i++) {
            let anneau = new Vehicle(x - i * 20, y, this.couleur);
            this.anneaux.push(anneau);
        }
    }

    arrive(target) {
        // La tête arrive à la cible
        let force = this.head.arrive(target);
        this.head.applyForce(force);
        this.head.update();

        // Chaque anneau suit l'anneau précédent
        for (let i = 1; i < this.anneaux.length; i++) {
            let cible = this.anneaux[i - 1].pos;
            let force = this.anneaux[i].arrive(cible, 30);
            this.anneaux[i].applyForce(force);
            this.anneaux[i].update();
        }
    }

    show() {
        this.dessineTete();
        this.dessineLesAnneaux();
    }

    addRing() {
        // On ajoute un anneau à la fin du serpent
        let dernierAnneau = this.anneaux[this.anneaux.length - 1];
        let nouvelAnneau = new Vehicle(dernierAnneau.pos.x, dernierAnneau.pos.y, this.couleur);
        this.anneaux.push(nouvelAnneau);
    }

    dessineTete() {
        // On dessine la tête comme un cercle avec deux yeux
        push();
        translate(this.head.pos.x, this.head.pos.y);
        rotate(this.head.vel.heading());

        fill(this.couleur);
        noStroke();
        circle(0, 0, this.r);

        // La langue (flickering tongue)
        if (frameCount % 30 < 15) {
            stroke(255, 0, 0);
            strokeWeight(2);
            line(this.r / 2, 0, this.r, 0);
            line(this.r, 0, this.r + 5, 5);
            line(this.r, 0, this.r + 5, -5);
        }

        // yeux
        let eyeOffset = this.r / 4;
        let eyeSize = this.r / 5;
        fill(255); // blanc des yeux
        circle(eyeOffset, -eyeOffset, eyeSize);
        circle(eyeOffset, eyeOffset, eyeSize);
        fill(0); // pupilles
        circle(eyeOffset + 1, -eyeOffset, eyeSize / 2);
        circle(eyeOffset + 1, eyeOffset, eyeSize / 2);
        pop();
    }

    dessineLesAnneaux() {
        // On dessine les anneaux du corps du snake
        this.anneaux.forEach((anneau, index) => {
            if (index === 0) return; // on ne redessine pas la tête
            // On veut que la couleur aille de this.couleur à une couleur plus foncée
            let inter = map(index, 0, this.anneaux.length - 1, 0, 1);
            let couleurAnneau = lerpColor(color(this.couleur), color(0, 100, 0), inter);

            push();
            fill(couleurAnneau);
            noStroke();
            circle(anneau.pos.x, anneau.pos.y, this.r * 0.9); // anneaux un peu plus petits que la tête
            pop();
        });
    }
}
