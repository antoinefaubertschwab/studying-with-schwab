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
const HALO_SYMBOLS = {
  fluoro: "F",
  chloro: "Cl",
  bromo: "Br",
  iodo: "I",
};

const SUB_FORMULES = {
  "méthyl": "CH3",
  "éthyl": "CH2CH3",
  "propyl": "CH2CH2CH3",
  "isopropyl": "CH(CH3)2",
  "butyl": "CH2CH2CH2CH3",
  "heptyl": "CH2CH2CH2CH2CH2CH2CH3",
};

const MULTIPLICATIVE_PREFIXES = ["", "mono", "di", "tri", "tétr", "penta", "hexa"]; // limited


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
function groupBy(list, key) {
  const map = {};
  for (const item of list) {
    const k = item[key];
    if (!map[k]) map[k] = [];
    map[k].push(item.position);
  }
  return Object.entries(map).map(([name, positions]) => ({ name, positions: positions.sort((a, b) => a - b) }));
}

function buildPrefix(groups) {
  return groups
    .map((g) => {
      const pos = g.positions.join(",");
      const count = g.positions.length;
      const multi = count > 1 ? MULTIPLICATIVE_PREFIXES[count] || "" : "";
      return `${pos}-${multi}${g.name}`;
    })
    .join("-");
}

function attach(base, formula) {
  if (base.startsWith("CH3")) {
    return base.replace("CH3", `CH2(${formula})`);
  }
  if (base.startsWith("CH2")) {
    return base.replace("CH2", `CH(${formula})`);
  }
  if (base.startsWith("CH(") || base.startsWith("C(")) {
    return base.replace("(", `(${formula},`);
  }
  if (base.startsWith("CHO")) {
    return base.replace("CHO", `C(${formula})O`);
  }
  return base;
}

function buildSemiDeveloped(n, subs, halos, groupe, positionsFG) {
  const carbons = [];
  for (let i = 1; i <= n; i++) {
    carbons.push(i === 1 || i === n ? "CH3" : "CH2");
  }

  if (groupe === "alcool") {
    for (const p of positionsFG) {
      carbons[p - 1] = p === 1 || p === n ? "CH2(OH)" : "CH(OH)";
    }
  } else if (groupe === "cétone") {
    for (const p of positionsFG) {
      carbons[p - 1] = "CO";
    }
  } else if (groupe === "aldéhyde") {
    carbons[0] = "CHO";
  }

  for (const s of subs) {
    const f = SUB_FORMULES[s.sub];
    carbons[s.position - 1] = attach(carbons[s.position - 1], f);
  }
  for (const h of halos) {
    const sym = HALO_SYMBOLS[h.name];
    carbons[h.position - 1] = attach(carbons[h.position - 1], sym);
  }

  let result = "";
  for (let i = 0; i < carbons.length; i++) {
    result += carbons[i];
    if (i < carbons.length - 1) {
      let bond = "-";
      if (groupe === "alcène" && positionsFG[0] === i + 1) bond = "=";
      if (groupe === "alcyne" && positionsFG[0] === i + 1) bond = "≡";
      result += bond;
    }
  }
  return result;
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
  

  const halos = [];
  if (groupe.k === "halogénure") {
    const halogens = Object.entries(HALO_PREFIXES);
    const nbHalo = randInt(1, 2);
    for (let i = 0; i < nbHalo; i++) {
      const [_, name] = halogens[randInt(0, halogens.length - 1)];
      const position = randInt(1, n);
      halos.push({ position, name });
    }
  }
  // positions of functional group
  let positionsFG = [];
  if (groupe.k === "alcool") {
    const nb = randInt(1, 2);
    const set = new Set();
    while (set.size < nb) set.add(randInt(1, n));
    positionsFG = [...set].sort((a, b) => a - b);
  } else if (groupe.k === "cétone") {
    positionsFG = [randInt(2, n - 1)];
  } else if (groupe.k === "aldéhyde") {
    positionsFG = [1];
  } else if (groupe.k === "alcène" || groupe.k === "alcyne") {
    positionsFG = [randInt(1, n - 1)];
  }

  subs.sort((a, b) => a.position - b.position);
  halos.sort((a, b) => a.position - b.position);

  const prefixSub = buildPrefix(groupBy(subs, "sub"));
  const prefixHalo = buildPrefix(groupBy(halos, "name"));
  const prefix = [prefixHalo, prefixSub].filter(Boolean).join("-");

  let nom;
    if (groupe.k === "alcane" || groupe.k === "halogénure") {
    nom = `${prefix ? prefix + '-' : ''}${chaine}`;
  } else if (groupe.k === "alcène" || groupe.k === "alcyne") {
    const racine = CHAINS[n - 1].replace(/ane$/, "");
       nom = `${prefix ? prefix + '-' : ''}${racine}-${positionsFG[0]}-${groupe.suffixe}`;
  } else if (groupe.k === "alcool") {
    const count = positionsFG.length;
    const base = count === 1 ? chaine.replace(/e$/, "") : chaine;
    const multi = MULTIPLICATIVE_PREFIXES[count];
    const pos = positionsFG.join(",");
    const suf = count === 1 ? `${pos}-${groupe.suffixe}` : `${pos}-${multi}${groupe.suffixe}`;
    nom = `${prefix ? prefix + '-' : ''}${base}-${suf}`;
  } else if (groupe.k === "cétone") {
    const base = chaine.replace(/e$/, "");
    const pos = positionsFG.join(",");
    nom = `${prefix ? prefix + '-' : ''}${base}-${pos}-one`;
  } else if (groupe.k === "aldéhyde") {
    const base = chaine.replace(/e$/, "");
    nom = `${prefix ? prefix + '-' : ''}${base}al`;
  }

   const formule = buildSemiDeveloped(n, subs, halos, groupe.k, positionsFG);

  return {
    description: {
    formule,
    },
    nom,
  };
}

if (typeof module !== "undefined") {
  module.exports = { generateMolecule };
}
