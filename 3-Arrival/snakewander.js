class SnakeWander extends Snake { // Extension de Snake pour un comportement autonome (mouvement exploratoire)
    constructor(x, y, length, taille, couleur) { // Initialisation du serpent explorateur
        super(x, y, length, taille, couleur); // Appel du constructeur Snake de base

        this.wanderWeight = 0.5; // Influence du mouvement aléatoire sur la direction totale
        this.boundariesWeight = 0.2; // Influence de la force de "peur" des bords de l'écran
        this.avoidWeight = 3; // Influence majeure du radar d'évitement d'obstacles

        // On pourrait augmenter this.head.distanceCercle ici pour des virages plus amples
    }

    move(obstacles) { // Redéfinition du mouvement pour être géré par l'IA au lieu de la souris
        // Calcul des forces individuelles pour la tête
        let forceWander = this.head.wander(); // Force pour errer sans but précis
        // Force pour rester dans le cadre délimité (0,0 -> width,height) avec marge de 50px
        let forceBoundaries = this.head.boundaries(0, 0, width, height, 50);

        // Pondération des forces calculées
        forceWander.mult(this.wanderWeight); // On dose l'impulsion de wandering
        forceBoundaries.mult(this.boundariesWeight); // On dose l'impulsion de retour du bord

        // Application des forces directionnelles à la tête
        this.head.applyForce(forceWander); // Ajoute le désir d'explorer
        this.head.applyForce(forceBoundaries); // Ajoute le réflexe de rester sur l'aire de jeu

        // Gestion dynamique des obstacles s'ils sont présents
        if (obstacles && obstacles.length > 0) { // Analyse du radar si la carte contient des obstacles
            let forceAvoid = this.head.avoid(obstacles); // Calcul du cap d'évitement
            forceAvoid.mult(this.avoidWeight); // On donne une priorité absolue à la survie
            this.head.applyForce(forceAvoid); // On applique l'évitement
        }

        this.head.update(); // Finalise le déplacement physique de la tête pour cette frame

        // Gestion de la chaîne : chaque segment suivant imite le précédent
        for (let i = 1; i < this.anneaux.length; i++) { // Itération sur l'ensemble du corps
            let anneau = this.anneaux[i]; // Segment actuel à déplacer
            let anneauPrecedent = this.anneaux[i - 1]; // Guide vers lequel tendre
            // On ordonne au segment actuel de rejoindre l'avant avec une zone de freinage de 15px
            let forceSuivi = anneau.arrive(anneauPrecedent.pos, 15);
            anneau.applyForce(forceSuivi); // Application de la force de cohésion du corps

            // Évitement d'obstacles pour les segments du corps en mode Wander également
            if (obstacles && obstacles.length > 0) {
                let forceAvoid = anneau.avoid(obstacles);
                forceAvoid.mult(this.avoidWeight);
                anneau.applyForce(forceAvoid);
            }

            anneau.update(); // Mise à jour de la position de l'anneau
        }
    }
}
