class Snake extends Vehicle { // Classe Snake héritant de Vehicle (le serpent est une collection de véhicules)
    constructor(x, y, length, taille, couleur) { // Initialisation du serpent
        super(x, y); // Appel au constructeur parent avec les coordonnées de départ
        this.anneaux = []; // Tableau contenant tous les segments (anneaux) du corps
        this.couleur = couleur; // Couleur principale du serpent
        this.r = taille; // Diamètre des anneaux du corps
        this.voirLangue = false; // Optionnel : affiche ou non la langue (non utilisé ici)
        this.avoidWeight = 3; // Importance donnée à l'évitement d'obstacles sur le mouvement

        // On crée la tête du snake qui est un véhicule intelligent
        this.head = new Vehicle(x, y, this.couleur); // Instance de Vehicle pour piloter le tout
        // Configuration des rayons de détection pour l'évitement d'obstacles
        this.head.r = taille; // Rayon physique pour les collisions
        this.head.r_pourDessin = taille; // Rayon utilisé pour l'affichage graphique
        this.head.largeurZoneEvitementDevantVaisseau = taille; // Champ de détection frontal

        this.anneaux.push(this.head); // La tête est le premier anneau du corps

        // On crée les anneaux suivants (le corps)
        for (let i = 1; i < length; i++) { // Boucle pour créer 'length - 1' anneaux supplémentaires
            let anneau = new Vehicle(x - i * 20, y, this.couleur); // Chaque anneau démarre décalé vers la gauche
            anneau.maxForce = 2; // Les anneaux du corps sont très réactifs pour coller au précédent
            anneau.maxSpeed = 10; // Ils peuvent aller vite pour rattraper le mouvement

            // Configuration pour évitement d'obstacle aussi pour le corps
            anneau.r = taille;
            anneau.r_pourDessin = taille;
            anneau.largeurZoneEvitementDevantVaisseau = taille;

            this.anneaux.push(anneau); // Ajout du segment au tableau des anneaux
        }
    }

    move(target, obstacles) { // Gère toute la logique de déplacement du serpent complet
        // La tête calcule son mouvement vers la cible (ex: souris)
        let forceArrive = this.head.arrive(target); // Force pour arriver à la destination
        this.head.applyForce(forceArrive); // On applique cette force de direction à la tête

        // Comportement d'évitement d'obstacles pour la tête
        if (obstacles && obstacles.length > 0) { // S'il y a des obstacles sur la carte
            let forceAvoid = this.head.avoid(obstacles); // Calcul du cap d'évitement
            forceAvoid.mult(this.avoidWeight); // On amplifie cette force selon son poids
            this.head.applyForce(forceAvoid); // On l'applique pour dévier la trajectoire si besoin
        }

        this.head.update(); // Met à jour la position physique réelle de la tête

        // Propagation du mouvement : Chaque anneau suit le segment qui le précède
        for (let i = 1; i < this.anneaux.length; i++) { // On commence au segment après la tête
            let anneau = this.anneaux[i]; // Segment actuel à déplacer
            let anneauPrecedent = this.anneaux[i - 1]; // Guide vers lequel tendre
            // On ordonne au segment actuel de rejoindre l'avant avec une zone de freinage de 15px
            let forceSuivi = anneau.arrive(anneauPrecedent.pos, 15);
            anneau.applyForce(forceSuivi); // Application de la force de cohésion du corps

            // Évitement d'obstacles pour le corps aussi !
            if (obstacles && obstacles.length > 0) {
                let forceAvoid = anneau.avoid(obstacles);
                // On applique la meme force d'évitement aux anneaux
                forceAvoid.mult(this.avoidWeight);
                anneau.applyForce(forceAvoid);
            }

            anneau.update(); // Met à jour physiquement la position du segment
        }
    }

    // Fonction legacy pour assurer la compatibilité avec un appel simplifié 'arrive'
    arrive(target) { // Version courte sans gestion d'obstacles
        this.move(target, []); // Appelle move avec un tableau d'obstacles vide
    }

    addRing() { // Ajoute manuellement un anneau au bout du corps (croissance du serpent)
        // On crée un nouveau véhicule à la position courante de la tête
        let anneau = new Vehicle(this.head.pos.x, this.head.pos.y, this.couleur);
        anneau.maxForce = 2; // Réactivité maximale
        anneau.maxSpeed = 10; // Vitesse maximale

        // Configuration pour évitement
        anneau.r = this.r;
        anneau.r_pourDessin = this.r;
        anneau.largeurZoneEvitementDevantVaisseau = this.r;

        this.anneaux.push(anneau); // Le serpent s'allonge d'un segment
    }

    show() { // Fonction d'affichage global invoquée à chaque frame
        this.dessineTete(); // Appel du rendu spécifique de la tête
        this.dessineLesAnneaux(); // Appel du rendu de tous les segments du corps
    }

    dessineTete() { // Rendu visuel soigné pour la tête du serpent
        push(); // On isole les styles de la tête
        fill(this.couleur); // Utilise la couleur du serpent
        noStroke(); // Sans bordure pour un aspect lisse
        circle(this.head.pos.x, this.head.pos.y, this.r); // Dessin du dôme principal de la tête

        // Dessin des deux yeux
        let eyeOffsetX = this.r / 6; // Décalage horizontal relatif à la taille
        let eyeOffsetY = this.r / 6; // Décalage vertical vers le haut
        let eyeSize = this.r / 5; // Diamètre des yeux
        fill(255); // Couleur blanche pour le globe oculaire
        circle(this.head.pos.x - eyeOffsetX, this.head.pos.y - eyeOffsetY, eyeSize); // Œil gauche
        circle(this.head.pos.x + eyeOffsetX, this.head.pos.y - eyeOffsetY, eyeSize); // Œil droit
        pop(); // Restauration des styles précédents
    }

    dessineLesAnneaux() { // Rendu artistique du corps avec un dégradé de couleur
        this.anneaux.forEach((anneau, index) => { // Boucle sur tous les segments
            if (index === 0) return; // On ignore la tête qui a déjà son propre rendu
            // Calcul d'un facteur d'interpolation entre 0 (tête) et 1 (queue)
            let inter = map(index, 0, this.anneaux.length - 1, 0, 1);
            // Calcul de la couleur dégradée : passage de la couleur vive au vert foncé vers la queue
            let couleurAnneau = lerpColor(color(this.couleur), color(0, 100, 0), inter);

            push(); // Début style anneau
            fill(couleurAnneau); // Applique la couleur calculée
            noStroke(); // Pas de contour pour un corps fluide
            circle(anneau.pos.x, anneau.pos.y, this.r * 0.9); // Cercles légèrement plus petits que la tête
            pop(); // Fin style anneau
        });
    }
}
