// Injecte la configuration d'environnement dans www/scripts/env.js
// Usage : node set-env.js staging | node set-env.js prod
const fs = require('fs');
const path = require('path');

const env = process.argv[2];
if (!['staging', 'prod'].includes(env)) {
    console.error('Usage : node set-env.js <staging|prod>');
    process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', `orderix.${env}.json`), 'utf8'));

const out = `// ─── Configuration d'environnement (GÉNÉRÉ par set-env.js, ne pas éditer) ───
// Environnement actif : ${cfg.envName}
// La clé Supabase "anon" est publique par design (la sécurité vient des
// policies RLS côté base, pas du secret de cette clé).
const ORDERIX_ENV = ${JSON.stringify(cfg, null, 4)};
`;

fs.writeFileSync(path.join(__dirname, 'www', 'scripts', 'env.js'), out, 'utf8');
console.log(`✓ www/scripts/env.js → environnement « ${cfg.envName} »`);
