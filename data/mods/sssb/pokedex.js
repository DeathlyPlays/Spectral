'use strict';

/**@type {{[k: string]: TemplateData}} */
let BattlePokedex = {
	marshadow: {
		inherit: true,
		baseStats: {hp: 100, atk: 100, def: 90, spa: 90, spd: 90, spe: 125},
	},

	magearna: {
		inherit: true,
		baseStats: {hp: 80, atk: 100, def: 115, spa: 130, spd: 115, spe: 65},
	},
};

exports.BattlePokedex = BattlePokedex;
