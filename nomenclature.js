const CHAINS = [
  "méthane", "éthane", "propane", "butane", "pentane",
  "hexane", "heptane", "octane", "nonane", "décane",
];

const SUBSTITUANTS = [
  "méthyl",
  "éthyl",
  "propyl",
  "isopropyl",
  "butyl",
  "heptyl",
];

const HALO_PREFIXES = {
  F: "fluoro",
  Cl: "chloro",
  Br: "bromo",
  I: "iodo",
};

const GROUPES = [
  { k: "alcane", suffixe: "ane" },
  { k: "alcène", suffixe: "ène" },
  { k: "alcyne", suffixe: "yne" },
  { k: "alcool", suffixe: "ol" },
  { k: "cétone", suffixe: "one" },
  { k: "aldéhyde", suffixe: "al" },
  { k: "halogénure", suffixe: "" },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMolecule() {
  const n = randInt(1, 10);
  const chaine = CHAINS[n - 1];
  const groupe = GROUPES[randInt(0, GROUPES.length - 1)];

  const subs = [];
  const nbSub = randInt(0, 2);
  for (let i = 0; i < nbSub; i++) {
    const sub = SUBSTITUANTS[randInt(0, SUBSTITUANTS.length - 1)];
    const position = randInt(1, n);
    subs.push({ position, sub });
  }
  subs.sort((a, b) => a.position - b.position);

  const halos = [];
  if (groupe.k === "halogénure") {
    const halogens = Object.entries(HALO_PREFIXES);
    const nbHalo = randInt(1, 2);
    for (let i = 0; i < nbHalo; i++) {
      const [_, name] = halogens[randInt(0, halogens.length - 1)];
      const position = randInt(1, n);
      halos.push({ position, name });
    }
    halos.sort((a, b) => a.position - b.position);
  }

  const prefixSub = subs.map((s) => `${s.position}-${s.sub}`).join("-");
  const prefixHalo = halos.map((h) => `${h.position}-${h.name}`).join("-");
  const prefix = [prefixHalo, prefixSub].filter(Boolean).join("-");

  let nom;
  if (groupe.k === "alcane") {
    nom = chaine;
  } else {
    const racine = CHAINS[n - 1].replace(/ane$/, "");
    nom = `${prefix ? prefix + '-' : ''}${racine}${groupe.suffixe}`;
  }

  return {
    description: {
      chaîne: chaine,
      substituants: subs,
      halogènes: halos,
      groupe: groupe.k,
    },
    nom,
  };
}

if (typeof module !== "undefined") {
  module.exports = { generateMolecule };
}
