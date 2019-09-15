'use strict';

exports.BattleAbilities = {
	"frostbite": {
		shortDesc: "20% chance a Pokemon making contact with this Pokemon will be frozen.",
		onAfterDamage(damage, target, source, move) {
			if (move && move.flags['contact']) {
				if (this.random(10) < 2) {
					source.trySetStatus('frz', target);
				}
			}
		},
		id: "frostbite",
		name: "Frostbite",
		rating: 5,
		num: -1009,
	},

	"voltfence": {
		desc: "Prevents adjacent opposing Electric-type Pokemon from choosing to switch out unless they are immune to trapping.",
		shortDesc: "Prevents adjacent Electric-type foes from choosing to switch.",
		onFoeTrapPokemon(pokemon) {
			if (pokemon.hasType('Electric') && this.isAdjacent(pokemon, this.effectData.target)) {
				pokemon.tryTrap(true);
			}
		},
		onFoeMaybeTrapPokemon(pokemon, source) {
			if (!source) source = this.effectData.target;
			if ((!pokemon.knownType || pokemon.hasType('Electric')) && this.isAdjacent(pokemon, source)) {
				pokemon.maybeTrapped = true;
			}
		},
		id: "voltfence",
		name: "Volt Fence",
		rating: 4.5,
		num: -1010,
	},

	"flamefence": {
		desc: "Prevents adjacent opposing Fire-type Pokemon from choosing to switch out unless they are immune to trapping.",
		shortDesc: "Prevents adjacent Fire-type foes from choosing to switch.",
		onFoeTrapPokemon(pokemon) {
			if (pokemon.hasType('Fire') && this.isAdjacent(pokemon, this.effectData.target)) {
				pokemon.tryTrap(true);
			}
		},
		onFoeMaybeTrapPokemon(pokemon, source) {
			if (!source) source = this.effectData.target;
			if ((!pokemon.knownType || pokemon.hasType('Fire')) && this.isAdjacent(pokemon, source)) {
				pokemon.maybeTrapped = true;
			}
		},
		id: "flamefence",
		name: "Flame Fence",
		rating: 4.5,
		num: -1011,
	},

	"toxicclaw": {
		shortDesc: "This Pokemon's contact moves have a 30% chance of badly poisoning",
		// upokecenter says this is implemented as an added secondary effect
		onModifyMove(move) {
			if (!move || !move.flags['contact']) return;
			if (!move.secondaries) {
				move.secondaries = [];
			}
			move.secondaries.push({
				chance: 30,
				status: 'tox',
				ability: this.getAbility('toxicclaw'),
			});
		},
		id: "toxicclaw",
		name: "Toxic Claw",
		rating: 3,
		num: -1012,
	},

	"metallicluster": {
		shortDesc: "Pokemon takes 3/4 from contact moves. Target takes 1/2 damage.",
		onSourceModifyDamage(damage, source, target, move) {
			let mod = 1;
			if (move.flags['contact']) mod /= 3;
			return this.chainModify(mod);
		},
		onAfterDamageOrder: 1,
		onAfterDamage(damage, target, source, move) {
			if (source && source !== target && move && move.flags['contact']) {
				this.damage(source.maxhp / 2, source, target);
			}
	    },
	    id: "metallicluster",
	    name: "Metallic Luster",
	    rating: 4.5,
	    num: -1013,
	},

	"spiritualjudgement": {
		desc: "When this Pokemon faints, attacker is Cursed.",
		shortDesc: "When this Pokemon faints, attacker is Cursed.",
		onFaint(target, source, effect) {
			if (effect && effect.effectType === 'Move' && source) {
				source.addVolatile('curse');
			}
		},
		id: "spiritualjudgement",
		name: "Spiritual Judgement",
		rating: 3,
		num: -1014,
	},

	"spirithold": {
		desc: "Prevents adjacent opposing Pokemon from choosing to switch out unless they are immune to trapping or are airborne.",
		shortDesc: "Prevents adjacent foes from choosing to switch unless they are airborne.",
		onFoeTrapPokemon(pokemon) {
			if (!this.isAdjacent(pokemon, this.effectData.target)) return;
			if (pokemon.isGrounded()) {
				pokemon.tryTrap(true);
			}
		},
		onFoeMaybeTrapPokemon(pokemon, source) {
			if (!source) source = this.effectData.target;
			if (!this.isAdjacent(pokemon, source)) return;
			if (pokemon.isGrounded(!pokemon.knownType)) { // Negate immunity if the type is unknown
				pokemon.maybeTrapped = true;
			}
		},
		id: "spirithold",
		name: "Spirit Hold",
		rating: 4.5,
		num: -1015,
	},

	"coreshield": {
		desc: "The user is immune to Ground-type attacks, and if a Fire-type attack is used against the user the attacker loses 1/4 of their maximum health.",
		shortDesc: "Immune to Ground-type attacks and Fire-type attacks on the user make the attacker lose 1/4th of max HP.",
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Ground') {
				this.add('-immune', target, '[msg]', '[from] ability: Core Shield');
				return null;
			}
		},
		onAfterDamageOrder: 1,
		onAfterDamage(damage, target, source, move) {
			if (source && source !== target && move && move.type === 'Fire') {
				this.damage(source.maxhp / 4, source, target);
			}
		},
		id: "coreshield",
		name: "Core Shield",
		rating: 4.5,
		num: -1016,
	},

	"nighttimehorror": {
		shortDesc: "50% chance a Pokemon making contact with this Pokemon will be put to sleep.",
		onAfterDamage(damage, target, source, move) {
			if (move && move.flags['contact']) {
				if (this.random(10) < 5) {
					source.trySetStatus('slp', target);
				}
			}
		},
		id: "nighttimehorror",
		name: "Nighttime Horror",
		rating: 3.5,
		num: -1017,
	},
};
