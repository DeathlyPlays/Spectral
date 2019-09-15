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
			if (damage >= target.hp && effect && effect.effectType === 'Move' && target.hp !== 1) {
				this.boost({atk: 1}, target, target, null, true);
				this.boost({spa: 1}, target, target, null, true);
				this.boost({spe: 1}, target, target, null, true);
				this.add('-ability', target, 'Heart of Steel');
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

	// Horrific17
	"reversecard": {
		id: "reversecard",
		name: "Reverse Card",
		desc: "Sets up Magic Room, and when the user's health drops below 25% of its maximum HP the user's Attack raises two stages.",
		shortDesc: "Sets up Magic Room & user's Atk +2 when max HP < 25%.",
		onStart(pokemon) {
			this.useMove("magicroom", pokemon);
		},
		onModifyAtkPriority: 5,
		onModifyAtk(atk, pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4) {
				return this.chainModify(2);
			}
		},
	},

	// Chandie
	"shadeseeker": {
		id: "shadeseeker",
		name: "Shade Seeker",
		desc: "The user ignores target's stat changes, and their Ghost type moves get +1 priority if the user or target have any stat changes.",
		shortDesc: "Ignores target's stat changes, Ghost moves get +1 priority if user/target have stat changes.",
		onAnyModifyBoost(boosts, target, move) {
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
		onModifyPriority(priority, pokemon, target, move) {
			let changed = false;
			for (let stats in pokemon.boosts) {
				for (const target of pokemon.side.foe.active) {
					if (pokemon.boosts[stats] !== 0 || target.boosts[stats] !== 0) {
						changed = true;
						break;
					}
				}
				if (changed) break;
			}
			if (changed && move && move.type === 'Ghost') {
				move.shadeSeekerBoosted = true;
				return priority + 1;
			}
		},
	},

	// Roughskull
	"venomshock": {
		id: "venomshock",
		name: "Venom Shock",
		desc: "Every move the user uses has a 30% chance to badly poison or paralyze the target.",
		shortDesc: "Every move has a 30% chance to toxicate or paralyze target.",
		onModifyMove(move) {
			if (!move || move.target === 'self') return;
			if (!move.secondaries) {
				move.secondaries = [];
			}
			move.secondaries.push({
				chance: 30,
				status: 'tox',
				ability: this.getAbility('venomshock'),
			});
			move.secondaries.push({
				chance: 30,
				status: 'par',
				ability: this.getAbility('venomshock'),
			});
		},
	},
};

exports.BattleAbilities = BattleAbilities;
