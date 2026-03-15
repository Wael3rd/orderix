// =====================================================================
// 50 Days Configuration
// Each day: { id, title, type, category, range: [min, max], integer }
// =====================================================================

var CATEGORIES = [
    { name: "Couleurs & Lumière", icon: "🎨", days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { name: "Tailles & Dimensions", icon: "📐", days: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
    { name: "Formes & Géométrie", icon: "🔷", days: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
    { name: "Comptage", icon: "🔢", days: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40] },
    { name: "Effets & Filtres", icon: "✨", days: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50] }
];

var DAYS = [
    // ── Couleurs & Lumière (1-10) ──
    { id: 1,  title: "Luminosité (Sombre → Clair)",        type: "lightness",   range: [15, 85],   integer: false },
    { id: 2,  title: "Saturation (Terne → Vif)",           type: "saturation",  range: [5, 95],    integer: false },
    { id: 3,  title: "Teinte (Rouge → Violet)",            type: "hue",         range: [0, 300],   integer: false },
    { id: 4,  title: "Rouge (Faible → Fort)",              type: "red",         range: [30, 240],  integer: true  },
    { id: 5,  title: "Vert (Faible → Fort)",               type: "green",       range: [30, 240],  integer: true  },
    { id: 6,  title: "Bleu (Faible → Fort)",               type: "blue",        range: [30, 240],  integer: true  },
    { id: 7,  title: "Température (Froid → Chaud)",        type: "warm",        range: [240, 0],   integer: false },
    { id: 8,  title: "Opacité (Transparent → Opaque)",     type: "opacity",     range: [0.1, 1.0], integer: false },
    { id: 9,  title: "Dégradé (Haut → Bas)",               type: "gradient",    range: [5, 95],    integer: false },
    { id: 10, title: "Bicolore (Peu → Beaucoup de vert)",  type: "bicolor",     range: [5, 95],    integer: false },

    // ── Tailles & Dimensions (11-20) ──
    { id: 11, title: "Largeur (Étroit → Large)",           type: "width",       range: [15, 100],  integer: false },
    { id: 12, title: "Hauteur (Court → Haut)",             type: "height",      range: [15, 100],  integer: false },
    { id: 13, title: "Taille (Petit → Grand)",             type: "scale",       range: [0.3, 1.0], integer: false },
    { id: 14, title: "Texte (Petit → Grand)",              type: "fontSize",    range: [8, 40],    integer: true  },
    { id: 15, title: "Bordure (Fine → Épaisse)",           type: "borderWidth", range: [1, 12],    integer: true  },
    { id: 16, title: "Marge interne (Fine → Large)",       type: "padding",     range: [1, 20],    integer: true  },
    { id: 17, title: "Remplissage (Vide → Plein)",         type: "fill",        range: [5, 100],   integer: false },
    { id: 18, title: "Point central (Petit → Grand)",      type: "centerDot",   range: [4, 40],    integer: true  },
    { id: 19, title: "Trait horizontal (Court → Long)",    type: "lineLength",  range: [8, 55],    integer: true  },
    { id: 20, title: "Épaisseur de trait (Fin → Épais)",   type: "lineWidth",   range: [1, 14],    integer: true  },

    // ── Formes & Géométrie (21-30) ──
    { id: 21, title: "Arrondi (Carré → Cercle)",           type: "radius",      range: [0, 50],    integer: false },
    { id: 22, title: "Rotation (0° → 180°)",               type: "rotation",    range: [0, 170],   integer: true  },
    { id: 23, title: "Inclinaison (Droit → Penché)",       type: "skew",        range: [0, 40],    integer: true  },
    { id: 24, title: "Secteur (Petit → Grand)",            type: "pie",         range: [15, 345],  integer: true  },
    { id: 25, title: "Anneau (Fin → Épais)",               type: "ringThick",   range: [2, 22],    integer: true  },
    { id: 26, title: "Encoche (Grande → Petite)",          type: "inset",       range: [22, 2],    integer: true  },
    { id: 27, title: "Losange (Plat → Haut)",              type: "diamond",     range: [10, 50],   integer: true  },
    { id: 28, title: "Croix (Fine → Épaisse)",             type: "crossWidth",  range: [2, 18],    integer: true  },
    { id: 29, title: "Flèche (Petite → Grande)",           type: "arrow",       range: [6, 28],    integer: true  },
    { id: 30, title: "Étoile (Petite → Grande)",           type: "starSize",    range: [10, 50],   integer: true  },

    // ── Comptage (31-40) ──
    { id: 31, title: "Points (Peu → Beaucoup)",            type: "dots",        range: [1, 20],    integer: true  },
    { id: 32, title: "Barres (Peu → Beaucoup)",            type: "bars",        range: [1, 10],    integer: true  },
    { id: 33, title: "Étoiles (Peu → Beaucoup)",           type: "stars",       range: [1, 10],    integer: true  },
    { id: 34, title: "Cœurs (Peu → Beaucoup)",             type: "hearts",      range: [1, 10],    integer: true  },
    { id: 35, title: "Anneaux (Peu → Beaucoup)",           type: "rings",       range: [1, 6],     integer: true  },
    { id: 36, title: "Carrés (Peu → Beaucoup)",            type: "blocks",      range: [1, 16],    integer: true  },
    { id: 37, title: "Lignes (Peu → Beaucoup)",            type: "lines",       range: [1, 10],    integer: true  },
    { id: 38, title: "Triangles (Peu → Beaucoup)",         type: "triangles",   range: [1, 10],    integer: true  },
    { id: 39, title: "Losanges (Peu → Beaucoup)",          type: "diamonds",    range: [1, 10],    integer: true  },
    { id: 40, title: "Croix (Peu → Beaucoup)",             type: "crosses",     range: [1, 10],    integer: true  },

    // ── Effets & Filtres (41-50) ──
    { id: 41, title: "Flou (Net → Flou)",                  type: "blur",        range: [0, 8],     integer: false },
    { id: 42, title: "Luminance (Sombre → Brillant)",      type: "brightness",  range: [0.3, 2.0], integer: false },
    { id: 43, title: "Sépia (Normal → Sépia)",             type: "sepia",       range: [0, 1],     integer: false },
    { id: 44, title: "Niveaux de gris (Couleur → Gris)",   type: "grayscale",   range: [0, 1],     integer: false },
    { id: 45, title: "Contraste (Faible → Fort)",          type: "contrast",    range: [0.3, 2.5], integer: false },
    { id: 46, title: "Ombre portée (Aucune → Grande)",     type: "shadow",      range: [0, 20],    integer: true  },
    { id: 47, title: "Ombre interne (Aucune → Grande)",    type: "insetShadow", range: [0, 18],    integer: true  },
    { id: 48, title: "Halo (Petit → Grand)",               type: "glow",        range: [0, 20],    integer: true  },
    { id: 49, title: "Rayures (Peu → Beaucoup)",           type: "stripes",     range: [1, 12],    integer: true  },
    { id: 50, title: "Damier (Grand → Petit)",             type: "checkers",    range: [30, 5],    integer: true  }
];

function getDayById(id) {
    for (var i = 0; i < DAYS.length; i++) {
        if (DAYS[i].id === id) return DAYS[i];
    }
    return null;
}
