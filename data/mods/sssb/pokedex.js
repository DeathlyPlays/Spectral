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
	skuntank: {
		inherit: true,
		baseStats: {hp: 103, atk: 93, def: 97, spa: 71, spd: 90, spe: 90},
	},
};

exports.BattlePokedex = BattlePokedex;
