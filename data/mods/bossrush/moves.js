"use strict";

/**@type {{[k: string]: MoveData}} */
let BattleMovedex = {
	"oblivionbanisher": {
		num: -246,
		accuracy: 100,
		basePower: 120,
		category: "Special",
		desc: "Has a 100% chance to raise the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage.",
		shortDesc: "100% chance to raise all stats by 1 (not acc/eva).",
		id: "oblivionbanisher",
		isViable: true,
		name: "Oblivion Banisher",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1, recharge: 1},
		onPrepareHit(target, source) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Agility", source);
			this.add('-anim', source, "Dark Void", target);
			this.add('-anim', source, "Spectral Thief", target);
		},
		secondary: {
			chance: 100,
			self: {
				volatileStatus: 'mustrecharge',
				boosts: {
					atk: 1,
					def: 1,
					spa: 1,
					spd: 1,
					spe: 1,
				},
			},
		},
		target: "normal",
		type: "Ghost",
		zMovePower: 200,
		contestType: "Tough",
	},
};

exports.BattleMovedex = BattleMovedex;
