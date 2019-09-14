'use strict';

/**@type {{[k: string]: ModdedAbilityData}} */
let BattleAbilities = {
	// RaginInfernape
	"ragingspirit": {
		id: "ragingspirit",
		name: "Raging Spirit",
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
	// Zakuree
	"heartofsteel": {
		id: "heartofsteel",
		name: "Heart of Steel",
		desc: "If the user is hit with an attack that would knock it out, they will survive the hit with 1 HP and receive +1 to Atk, SpA, and Spe.",
		shortDesc: "If hit with an attack that would K.O, survives on 1 HP and raises Spe/Atk/SpA by 1.",
		onDamagePriority: -100,
		onDamage(damage, target, source, effect) {
			if (damage >= target.hp && effect && effect.effectType === 'Move') {
				this.boost({atk: 1}, target, target, null, true);
				this.boost({spa: 1}, target, target, null, true);
				this.boost({spe: 1}, target, target, null, true);
				this.add('-ability', target, 'Sturdy');
				return target.hp - 1;
			}
		},
	},
	// Back At My Day
	"pealofthunder": {
		id: "pealofthunder",
		name: "Peal of Thunder",
		desc: "Volt Absorb and Motor Drive.",
		shortDesc: "Volt Absorb, Motor Drive.",
		onTryHit(target, source, move) {
			if (move.type === 'Electric') {
				if (!this.heal(target.maxhp / 4)) {
					this.add('-immune', target, '[from] ability: Peal of Thunder');
				}
				if (!this.boost({spe: 1})) {
					this.add('-immune', target, '[from] ability: Peal of Thunder');
				}
				return null;
			}
		},
	},
};

exports.BattleAbilities = BattleAbilities;
