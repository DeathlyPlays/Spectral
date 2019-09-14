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
	"distortion": {
		num: -547,
		accuracy: 100,
		basePower: 75,
		category: "Special",
		desc: "Has a 20% chance to cause the target to fall asleep. If this move is successful on at least one target and the user is a Meloetta, it changes to Pirouette Forme if it is currently in Aria Forme, or changes to Aria Forme if it is currently in Pirouette Forme. This forme change does not happen if the Meloetta has the Sheer Force Ability. The Pirouette Forme reverts to Aria Forme when Meloetta is not active.",
		shortDesc: "20% chance to freeze foe(s). Giratina transforms.",
		id: "distortion",
		name: "Distortion",
		pp: 10,
		priority: 1,
		flags: {protect: 1, mirror: 1, sound: 1, authentic: 1},
	},
		onPrepareHit: function (target, source) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Explosion", target);
		},
		secondary: {
			chance: 20,
			status: 'frz',
		},
		onHit(target, pokemon, move) {
			if (pokemon.baseTemplate.baseSpecies === 'Giratina' && !pokemon.transformed) {
				move.willChangeForme = true;
			}
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (move.willChangeForme) {
				pokemon.formeChange(pokemon.template.speciesid === 'giratinaorigin' ? 'Giratina' : 'Giratina-Origin', this.effect, false, '[msg]');
			}
		},
		target: "allAdjacentFoes",
		type: "Ghost",
		zMovePower: 140,
		contestType: "Beautiful",
	},
};

exports.BattleMovedex = BattleMovedex;
