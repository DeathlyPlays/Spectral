'use strict';

/**@type {{[k: string]: TemplateData}} */
let BattlePokedex = {
	bidoofgod: {
		num: 399,
		species: "Bidoof",
		baseSpecies: "Bidoof",
		forme: "God",
		formeLetter: "J",
		types: ["Normal"],
		baseStats: {hp: 150, atk: 115, def: 125, spa: 115, spd: 125, spe: 100},
		abilities: {0: "Assisting Finger"},
		heightm: 6.5,
		weightkg: 700,
		color: "Brown",
		eggGroups: ["Water 1", "Field"],
	},
};

exports.BattlePokedex = BattlePokedex;
