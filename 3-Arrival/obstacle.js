class Obstacle { // Classe définissant des obstacles statiques circulaires sur l'aire de jeu
    constructor(x, y, r, couleur) { // Initialisation avec position, rayon et teinte
        this.pos = createVector(x, y); // Stockage de la position (x,y) sous forme de vecteur p5
        this.r = r; // Le rayon de l'obstacle pour la détection de collision et le dessin
        this.color = couleur || "green"; // Utilisation de la couleur fournie ou vert intense par défaut
    }

    show() { // Fonction de rendu graphique appelée à chaque cycle de dessin
        push(); // Isole le style visuel de cet obstacle pour ne pas polluer les autres
        fill(this.color); // Remplit l'obstacle avec sa couleur spécifique
        stroke(0) // Dessine une bordure noire
        strokeWeight(3); // Épaisseur de bordure bien visible (aspect "cartoon")
        ellipse(this.pos.x, this.pos.y, this.r * 2); // Dessine le disque extérieur de l'obstacle
        fill(0); // Passe au noir pour le détail central
        ellipse(this.pos.x, this.pos.y, 10); // Dessine un petit point noir au centre de l'obstacle
        pop(); // Restitue les styles de dessin par défaut
    }
}
