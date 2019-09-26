'use strict';

exports.BattleAbilities = {
	"crafty": {
		shortDesc: "Skill Link + Technician.",
		onBasePowerPriority: 8,
		onBasePower(basePower, attacker, defender, move) {
			if (basePower <= 60) {
				this.debug('Crafty boost');
				return this.chainModify(1.5);
			}
		},
		onModifyMove(move) {
			if (move.multihit && Array.isArray(move.multihit) && move.multihit.length) {
				move.multihit = move.multihit[1];
			}
			if (move.multiaccuracy) {
				delete move.multiaccuracy;
			}
		},
		id: "crafty",
		name: "Crafty",
		rating: 5,
		num: -1009,
	},

	"holypreservation": {
		shortDesc: "Magic Guard + Unaware.",
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		onAnyModifyBoost(boosts, target) {
			let source = this.effectData.target;
			if (source === target) return;
			if (source === this.activePokemon && target === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (target === this.activePokemon && source === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['spa'] = 0;
				boosts['accuracy'] = 0;
			}
		},
		id: "holypreservation",
		name: "Holy Preservation",
		rating: 4.5,
		num: -1010,
	},

	"hardened": {
		shortDesc: "Multiplies user's Def/SpD by x1.3.",
		onModifyDefPriority: 6,
		onModifyDef(def) {
			return this.chainModify(1.3);
		},
		onModifySpDPriority: 6,
		onModifySpD(spd) {
			return this.chainModify(1.3);
		},
		id: "hardened",
		name: "Hardened",
		rating: 4.5,
		num: -1011,
	},

	"brickwall": {
		shortDesc: "Triples the user's defense.",
		onModifyDefPriority: 6,
		onModifyDef(def) {
			return this.chainModify(3);
		},
		id: "brickwall",
		name: "Brick Wall",
		rating: 4.5,
		num: -1012,
	},
};
