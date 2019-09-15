'use strict';

/**@type {{[k: string]: TemplateData}} */
let BattlePokedex = {
	marshadow: {
		num: 802,
		species: "Marshadow",
		types: ["Fighting", "Ghost"],
		gender: "N",
		baseStats: {hp: 100, atk: 100, def: 90, spa: 90, spd: 90, spe: 125},
		abilities: {0: "Technician"},
		heightm: 0.7,
		weightkg: 22.2,
		color: "Gray",
		eggGroups: ["Undiscovered"],
	},
};

exports.BattlePokedex = BattlePokedex;
