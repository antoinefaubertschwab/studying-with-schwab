const CHAINS = [
  "méthane", "éthane", "propane", "butane", "pentane",
  "hexane", "heptane", "octane", "nonane", "décane",
  "undécane", "dodécane",
];

const SUBSTITUANTS = (() => {
  const subs = CHAINS.map((c, i) => {
    const len = i + 1;
    const name = c.replace(/ane$/, "yl");
    const formula = len === 1 ? "CH3" : "CH2".repeat(len - 1) + "CH3";
    return { name, formula, len };
  });
  subs.push({ name: "isobutyl", formula: "CH2CH(CH3)2", len: 4 });
  subs.push({ name: "sec-butyl", formula: "CH(CH3)CH2CH3", len: 4 });
  subs.push({ name: "tert-butyl", formula: "C(CH3)3", len: 4 });
  return subs;
})();

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

const SUB_FORMULES = Object.fromEntries(
  SUBSTITUANTS.map((s) => [s.name, s.formula])
);

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

function lexCompare(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function shouldReverse(n, subs, halos, positionsFG) {
  const mirror = (p) => n + 1 - p;
  const seq = [
    [...positionsFG].sort((a, b) => a - b),
    subs.map((s) => s.position).sort((a, b) => a - b),
    halos.map((h) => h.position).sort((a, b) => a - b),
  ];
  const seqRev = [
    positionsFG.map(mirror).sort((a, b) => a - b),
    subs.map((s) => mirror(s.position)).sort((a, b) => a - b),
    halos.map((h) => mirror(h.position)).sort((a, b) => a - b),
  ];
  const flatSeq = [].concat(...seq);
  const flatRev = [].concat(...seqRev);
  return lexCompare(flatRev, flatSeq) < 0;
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
  if (base.startsWith("C(=O)H")) {
    return base.replace("C(=O)H", `C(${formula})(=O)H`);
  }
  if (base.startsWith("C(=O)")) {
    return base.replace("C(=O)", `C(${formula})(=O)`);
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
    carbons[p - 1] = "C(=O)";
    }
  } else if (groupe === "aldéhyde") {
    carbons[0] = "C(=O)H";
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
  const n = randInt(1, 12);
  const chaine = CHAINS[n - 1];
    let groupe = GROUPES[randInt(0, GROUPES.length - 1)];
  if (groupe.k !== "aldéhyde" && Math.random() < 0.2) {
    groupe = GROUPES.find((g) => g.k === "aldéhyde");
  }

  const subs = [];
    const possibleSubs = SUBSTITUANTS.filter((s) => n >= 2 * s.len + 1);
  if (possibleSubs.length > 0) {
    const nbSub = randInt(1, Math.min(2, possibleSubs.length));
    for (let i = 0; i < nbSub; i++) {
      const sub = possibleSubs[randInt(0, possibleSubs.length - 1)];
      const position = randInt(sub.len + 1, n - sub.len);
      subs.push({ position, sub: sub.name });
    }
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
    const nb = randInt(1, Math.min(2, n));
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
 
   
    if (shouldReverse(n, subs, halos, positionsFG)) {
    const mirror = (p) => n + 1 - p;
    subs.forEach((s) => (s.position = mirror(s.position)));
    halos.forEach((h) => (h.position = mirror(h.position)));
    positionsFG = positionsFG.map(mirror).sort((a, b) => a - b);
  }


  subs.sort((a, b) => a.position - b.position);
  halos.sort((a, b) => a.position - b.position);

  const prefixSub = buildPrefix(groupBy(subs, "sub"));
  const prefixHalo = buildPrefix(groupBy(halos, "name"));
  const prefix = [prefixHalo, prefixSub].filter(Boolean).join("-");

  let nom;
     if (groupe.k === "alcane" || groupe.k === "halogénure") {
    nom = `${prefix}${chaine}`;
  } else if (groupe.k === "alcène" || groupe.k === "alcyne") {
    const racine = CHAINS[n - 1].replace(/ane$/, "");
          nom = `${prefix}${racine}-${positionsFG[0]}-${groupe.suffixe}`;
  } else if (groupe.k === "alcool") {
    const count = positionsFG.length;
    const base = count === 1 ? chaine.replace(/e$/, "") : chaine;
    const multi = MULTIPLICATIVE_PREFIXES[count];
    const pos = positionsFG.join(",");
    const suf = count === 1 ? `${pos}-${groupe.suffixe}` : `${pos}-${multi}${groupe.suffixe}`;
       nom = `${prefix}${base}-${suf}`;
  } else if (groupe.k === "cétone") {
    const base = chaine.replace(/e$/, "");
    const pos = positionsFG.join(",");
    nom = `${prefix}${base}-${pos}-one`;
  } else if (groupe.k === "aldéhyde") {
    const base = chaine.replace(/e$/, "");
    nom = `${prefix}${base}al`;
  }

  const formule = buildSemiDeveloped(n, subs, halos, groupe.k, positionsFG);
  
  return {
    description: { formule },
    nom,
    struct: { n, subs, halos, groupe: groupe.k, positionsFG },
  };
}

if (typeof module !== "undefined") {
  module.exports = { generateMolecule };
}
