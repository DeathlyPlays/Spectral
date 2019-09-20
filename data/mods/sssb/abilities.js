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

	// Volco
	"emergencyactions": {
		id: "emergencyactions",
		name: "Emergency Actions",
		desc: "Grants a silent speed boost of 1.5x and STAB moves have a boost of 2x instead of 1.5x",
		shortDesc: "Silent 1.5x spe & STAB is 2x instead of 1.5x",
		onStart(pokemon) {
			this.add('-message', pokemon.name + "'s Emergency Actions has multiplied their speed by 1.5x (silently) and boosted their STAB bonus to 2x.");
		},
		onModifyMove(move) {
			move.stab = 2;
		},
		onModifySpe(spe) {
			return this.chainModify(1.5);
		},
	},

	// Zakuree
	"heartofsteel": {
		id: "heartofsteel",
		name: "Heart of Steel",
		desc: "If the user is hit with an attack that would knock it out, they will survive the hit with 1 HP and receive +1 to Atk and Spe.",
		shortDesc: "If hit with an attack that would K.O, survives on 1 HP and raises Spe/Atk by 1.",
		onDamagePriority: -100,
		onDamage(damage, target, source, effect) {
			if (damage >= target.hp && effect && effect.effectType === 'Move' && target.hp !== 1) {
				this.boost({atk: 1}, target, target, null, true);
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
		desc: "Immune to Electric attacks and if hit by one, recover 25% of max HP and boost Speed by 1 stage.",
		shortDesc: "Electric immunity, 25% of max HP recovery and +1 Speed if hit by an Electric attack.",
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
			if (pokemon.hp <= pokemon.maxhp / 2) {
				return this.chainModify(2);
			}
		},
	},

	// Chandie
	"shadeseeker": {
		id: "shadeseeker",
		name: "Shade Seeker",
		desc: "The user ignores target's stat changes, and their Ghost type moves get +1 priority if the user or target have any stat boosts.",
		shortDesc: "Ignores target's stat changes, Ghost moves get +1 priority if user/target have stat boosts.",
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
					if (pokemon.boosts[stats] > 0 || target.boosts[stats] > 0) {
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

	// Tactician Loki
	"chaoticaura": {
		id: "chaoticaura",
		name: "Chaotic Aura",
		desc: "Status moves are given +1 priority, and every turn at the end the user raises one stat up by two stages and lowers one stat by one stage.",
		shortDesc: "Status moves are given +1 priority, every turn +2 random stat & -1 random stat.",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			let stats = [];
			let boost = {};
			for (let statPlus in pokemon.boosts) {
				// @ts-ignore
				if (pokemon.boosts[statPlus] < 6) {
					stats.push(statPlus);
				}
			}
			let randomStat = stats.length ? this.sample(stats) : "";
			// @ts-ignore
			if (randomStat) boost[randomStat] = 2;

			stats = [];
			for (let statMinus in pokemon.boosts) {
				// @ts-ignore
				if (pokemon.boosts[statMinus] > -6 && statMinus !== randomStat) {
					stats.push(statMinus);
				}
			}
			randomStat = stats.length ? this.sample(stats) : "";
			// @ts-ignore
			if (randomStat) boost[randomStat] = -1;

			this.boost(boost);
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move && move.category === 'Status') {
				move.chaoticAuraBoosted = true;
				return priority + 1;
			}
		},
	},

	// Revival Clair
	"toughskin": {
		id: "toughskin",
		name: "Tough Skin",
		desc: "Neutral damage from Ice attacks.",
		shortDesc: "1x damage from Ice.",
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ice') {
				this.debug('Tough Skin weaken');
				return this.chainModify(0.25);
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ice') {
				this.debug('Tough Skin weaken');
				return this.chainModify(0.25);
			}
		},
	},

	// Spectral Bot
	"spectralsthief": {
		id: "spectralsthief",
		name: "Spectral's Thief",
		desc: "Before every move, the user checks if the user has any positive boosts, if so, the user steals said stats.",
		shortDesc: "The user steals the target's boosts, if any, before every move.",
		onBeforeMovePriority: 0.5,
		onBeforeMove(attacker, defender, move) {
			if (!defender) return;
			let steal = [];
			for (let stats in defender.boosts) {
				for (const target of defender.side.foe.active) {
					if (defender.boosts[stats] > 0 || target.boosts[stats] > 0) {
						steal.push(stats);
						defender.boosts[stats] = 0;
					}
				}
				if (steal.length > 0) {
					this.boost(steal);
				}
			}
		},
	},
	
	// La Rascasse
	"guardianofsinnoh": {
		id: "guardianofsinnoh",
		name: "Guardian of Sinnoh",
		desc: "0.5x damage from Dark and Psychic and 20% chance to use Wish and Heal Bell after switching in.",
		shortDesc: "Half damage from Dark and Psychic, 20% chance to use Wish and Heal Bell after switching in.",
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Dark' || move.type === 'Psychic') {
				this.debug('Guardian of Sinnoh weaken');
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Dark' || move.type === 'Psychic') {
				this.debug('Guardian of Sinnoh weaken');
				return this.chainModify(0.5);
			}
		},
		onStart(pokemon) {
			if (this.random(5)) {
				this.useMove("wish", pokemon);
				this.useMove("healbell", pokemon);
			}
		},
	},
	
	// Revival xFloatz
	"xfz": {
		id: "xfz",
		name: "XFZ",
		desc: "This Pokemon is immune to Fire attacks and does 1.5x damage with Steel attacks if hit by a Fire attack. Status moves gain +1 priority.",
		shortDesc: "Fire immunity, 1.5x damage with Steel if hit by Fire, +1 priority to Status.",
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Fire') {
				move.accuracy = true;
				if (!target.addVolatile('xfz')) {
					this.add('-immune', target, '[from] ability: XFZ');
				}
				return null;
			}
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('xfz');
		},
		effect: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(target) {
				this.add('-start', target, 'ability: XFZ');
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, attacker, defender, move) {
				if (move.type === 'Steel') {
					this.debug('XFZ boost');
					return this.chainModify(1.5);
				}
			},
			onModifySpAPriority: 5,
			onModifySpA(atk, attacker, defender, move) {
				if (move.type === 'Steel') {
					this.debug('XFZ boost');
					return this.chainModify(1.5);
				}
			},
			onEnd(target) {
				this.add('-end', target, 'ability: XFZ', '[silent]');
			},
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move && move.category === 'Status') {
				move.xfzBoosted = true;
				return priority + 1;
			}
		},
	},
};

exports.BattleAbilities = BattleAbilities;
