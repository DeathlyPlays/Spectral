'use strict';

/**@type {{[k: string]: ModdedAbilityData}} */
let BattleAbilities = {
	// RaginInfernape
	"ragingspirit": {
		id: "ragingspirit",
		name: "Raging Spirits",
		desc: "Any moves that have 75 or less base power get boosted by 1.5x, cannot fall asleep.",
		shortDesc: "Moves that have <= 75 BP get 1.5x damage, cannot fall asleep.",
		onBasePowerPriority: 8,
		onBasePower(basePower, attacker, defender, move) {
			if (basePower <= 75) {
				this.debug('Raging Spirit boost');
				return this.chainModify(1.5);
			}
		},
		onUpdate(pokemon) {
			if (pokemon.status === 'slp') {
				this.add('-activate', pokemon, 'ability: Raging Spirit');
				pokemon.cureStatus();
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'slp') return;
			if (!effect || !effect.status) return false;
			this.add('-immune', target, '[from] ability: Raging Spirit');
			return false;
		},
	},
	// Back At My Day
	"pealofthunder": {
		id: "pealofthunder",
		name: "Peal of Thunder",
		desc: "Volt Absorb and Motor Drive.",
		shortDesc: "Volt Absorb, Motor Drive.",
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				if (!this.heal(target.maxhp / 4)) {
					this.add('-immune', target, '[from] ability: Peal of Thunder');
				}
				return null;
			}
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				if (!this.boost({spe: 1})) {
					this.add('-immune', target, '[from] ability: Peal of Thunder');
				}
				return null;
			}
		},
	},
};

exports.BattleAbilities = BattleAbilities;
