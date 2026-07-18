// Injecte la configuration d'environnement dans www/scripts/env.js
// Usage : node set-env.js staging | node set-env.js prod
//
// Secrets locaux : si config/orderix.<env>.local.json existe (gitignoré),
// il est fusionné par-dessus la config de base. C'est là que vit le jeton
// GitHub « issues-only » qui permet à l'app d'envoyer les commentaires de
// test sans passer par le formulaire GitHub. env.js est gitignoré pour
// que ce jeton ne soit jamais commité.
const fs = require('fs');
const path = require('path');

const env = process.argv[2];
if (!['staging', 'prod'].includes(env)) {
    console.error('Usage : node set-env.js <staging|prod>');
    process.exit(1);
}

// strip BOM : les fichiers écrits sous Windows/PowerShell peuvent en avoir un
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));

const cfg = readJson(path.join(__dirname, 'config', `orderix.${env}.json`));

const localPath = path.join(__dirname, 'config', `orderix.${env}.local.json`);
let hasLocal = false;
if (fs.existsSync(localPath)) {
    Object.assign(cfg, readJson(localPath));
    hasLocal = true;
}

const out = `// ─── Configuration d'environnement (GÉNÉRÉ par set-env.js, ne pas éditer) ───
// Environnement actif : ${cfg.envName}
const ORDERIX_ENV = ${JSON.stringify(cfg, null, 4)};
`;

fs.writeFileSync(path.join(__dirname, 'www', 'scripts', 'env.js'), out, 'utf8');
console.log(`✓ www/scripts/env.js → environnement « ${cfg.envName} »${hasLocal ? ' (+ secrets locaux)' : ''}`);
