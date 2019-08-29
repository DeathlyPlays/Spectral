"use strict";

exports.BattleMovedex = {
	// DEFAULT CUSTOM MOVES
	// Normal
	stretch: {
		category: "Status",
		accuracy: 100,
		id: "stretch",
		name: "Stretch",
		isNonstandard: true,
		flags: {
			snatch: 1,
		},
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Wrap", source);
		},
		pp: 10,
		boosts: {
			atk: 1,
			spa: 1,
			spe: 1,
		},
		zMoveEffect: 'heal',
		target: "self",
		type: "Normal",
		desc: "Raises the user's Attack, Special Attack and Speed by 1.",
		shortDesc: "+1 Atk, SpA, and Spe.",
	},

	// Fire
	flametower: {
		category: "Special",
		accuracy: 100,
		basePower: 80,
		id: "flametower",
		name: "Flame Tower",
		isNonstandard: true,
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Fire Spin", target);
		},
		pp: 15,
		priority: 0,
		flags: {
			protect: 1,
			mirror: 1,
		},
		volatileStatus: 'partiallytrapped',
		secondary: {
			chance: 50,
			status: 'brn',
		},
		zMovePower: 140,
		target: "normal",
		type: "Fire",
		desc: "Traps the target for 4-5 turns and 50% chance to burn the target.",
		shortDesc: "Traps target; 50% chance to burn.",
	},

	// Water
	rainspear: {
		category: "Special",
		accuracy: 100,
		basePower: 50,
		id: "rainspear",
		name: "Rain Spear",
		isNonstandard: true,
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Icicle Spear", target);
		},
		pp: 15,
		priority: 1,
		flags: {
			protect: 1,
			mirror: 1,
		},
		weather: 'raindance',
		secondary: {
			chance: 20,
			volatileStatus: 'flinch',
		},
		zMovePower: 110,
		target: "normal",
		type: "Water",
		desc: "Summons Rain Dance and has 20% chance to flinch the target.",
		shortDesc: "Sets Rain Dance; 20% chance to flinch.",
	},

	// Grass
	healingherbs: {
		category: "Status",
		accuracy: 100,
		id: "healingherbs",
		name: "Healing Herbs",
		isNonstandard: true,
		flags: {
			mirror: 1,
			snatch: 1,
			heal: 1,
		},
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Recover", source);
		},
		onHit(target, pokemon, move) {
			this.useMove('Aromatherapy', pokemon);
		},
		heal: [1, 2],
		pp: 5,
		priority: 0,
		target: "self",
		type: "Grass",
		zMoveEffect: 'heal',
		desc: "Cures the user's party of all status conditions and heals the user by 50% of its max HP.",
		shortDesc: "Heals 1/2 of max HP; uses Aromatherapy.",
	},

	// Electric
	electrodrive: {
		category: "Special",
		accuracy: 100,
		basePower: 0,
		id: "electrodrive",
		name: "Electro Drive",
		isNonstandard: true,
		basePowerCallback(pokemon, target) {
			let ratio = (pokemon.getStat('spe') / target.getStat('spe'));
			this.debug([40, 60, 80, 120, 150][(Math.floor(ratio) > 4 ? 4 : Math.floor(ratio))] + ' bp');
			if (ratio >= 4) {
				return 150;
			}
			if (ratio >= 3) {
				return 120;
			}
			if (ratio >= 2) {
				return 80;
			}
			if (ratio >= 1) {
				return 60;
			}
			return 40;
		},
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Electro Ball", target);
		},
		flags: {
			bullet: 1,
			protect: 1,
			mirror: 1,
		},
		self: {
			boosts: {
				spe: 1,
			},
		},
		zMovePower: 120,
		pp: 10,
		priority: 0,
		target: "normal",
		type: "Electric",
		desc: "More power the faster the user is than the target and raises the user's speed by 1.",
		shortDesc: "More power faster user is; raises Spe by 1.",
	},

	//Ice
	hailstorm: {
		category: "Status",
		accuracy: 100,
		id: "hailstorm",
		name: "Hailstorm",
		isNonstandard: true,
		flags: {
			protect: 1,
			mirror: 1,
		},
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Blizzard", source);
		},
		onHit(target, pokemon, move) {
			this.useMove('Blizzard', pokemon);
		},
		pp: 10,
		weather: 'hail',
		priority: 0,
		target: "normal",
		type: "Ice",
		zMoveEffect: 'heal',
		desc: "Summons Hail and uses Blizzard.",
	},

	// Fighting
	beatdown: {
		category: "Physical",
		basePower: 200,
		accuracy: 80,
		id: "beatdown",
		name: "Beat Down",
		isNonstandard: true,
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Dynamic Punch", target);
		},
		flags: {
			recharge: 1,
			protect: 1,
			mirror: 1,
		},
		self: {
			volatileStatus: 'mustrecharge',
		},
		secondary: {
			chance: 50,
			status: 'par',
		},
		pp: 5,
		priority: -1,
		target: "normal",
		type: "Fighting",
		zMovePower: 250,
		desc: "50% chance to paralyze the target. User must recharge next turn, if this move is successful.",
		shortDesc: "50% chance to par; must recharge.",
	},

	// Poison
	nuclearwaste: {
		category: "Status",
		accuracy: 95,
		id: "nuclearwaste",
		name: "Nuclear Waste",
		isNonstandard: true,
		flags: {
			protect: 1,
			reflectable: 1,
			snatch: 1,
		},
		status: 'tox',
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Toxic", target);
			this.add('-anim', target, "Fire Blast", target);
		},
		boosts: {
			atk: -1,
		},
		pp: 20,
		priority: 0,
		target: "normal",
		type: "Poison",
		zMoveEffect: 'heal',
		desc: "Badly poisons the target and lowers the foe's attack by 1.",
		shortDesc: "Badly poisons target; lowers Atk by 1.",
	},

	// Ground
	terratremor: {
		category: "Physical",
		accuracy: 75,
		basePower: 140,
		id: "terratremor",
		name: "Terratremor",
		isNonstandard: true,
		flags: {
			protect: 1,
			mirror: 1,
		},
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Precipice Blades", target);
		},
		pp: 5,
		priority: 0,
		secondary: {
			chance: 15,
			volatileStatus: 'flinch',
		},
		target: "normal",
		type: "Ground",
		zMovePower: 190,
		desc: "15% chance to flinch the target.",
	},

	// Flying
	ventilation: {
		category: "Status",
		accuracy: 100,
		id: "ventilation",
		name: "Ventilation",
		isNonstandard: true,
		flags: {
			protect: 1,
			reflectable: 1,
			mirror: 1,
			authentic: 1,
			snatch: 1,
		},
		priority: 0,
		pp: 15,
		onHit(target, source, move) {
			if (!target.volatiles['substitute'] || move.infiltrates) {
				this.boost({
					evasion: -1,
				});
				let removeTarget = {
					reflect: 1,
					lightscreen: 1,
					safeguard: 1,
					mist: 1,
				};
				let removeAll = {
					spikes: 1,
					toxicspikes: 1,
					stealthrock: 1,
					stickyweb: 1,
				};
				for (let targetCondition in removeTarget) {
					if (target.side.removeSideCondition(targetCondition)) {
						if (!removeAll[targetCondition]) continue;
						this.add('-sideend', target.side, this.getEffect(targetCondition).name, '[from] move: Ventilation', '[of] ' + target);
					}
				}
				for (let sideCondition in removeAll) {
					if (source.side.removeSideCondition(sideCondition)) {
						this.add('-sideend', source.side, this.getEffect(sideCondition).name, '[from] move: Ventilation', '[of] ' + source);
					}
				}
				this.clearWeather();
			}
		},
		target: "normal",
		type: "Flying",
		zMoveEffect: 'heal',
		desc: "Clears user and target side's hazards and removes weather. This move infiltrates substitutes.",
		shortDesc: "Removes hazards, and weather.",
	},

	// Psychic
	psychicshield: {
		category: "Status",
		accuracy: 100,
		id: "psychicshield",
		name: "Psychic Shield",
		isNonstandard: true,
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Protect", source);
		},
		onHit(target, pokemon, move) {
			this.useMove('Light Screen', pokemon);
			this.useMove('Reflect', pokemon);
		},
		flags: {
			snatch: 1,
		},
		pp: 5,
		target: "self",
		type: "Psychic",
		zMoveEffect: 'heal',
		desc: "Sets Light Screen and Reflect.",
	},

	// Bug
	swarmcharge: {
		category: "Physical",
		basePower: 100,
		accuracy: 90,
		id: "swarmcharge",
		name: "Swarm Charge",
		isNonstandard: true,
		flags: {
			protect: 1,
			mirror: 1,
		},
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Attack Order", target);
		},
		secondary: {
			chance: 30,
			self: {
				boosts: {
					atk: 1,
					spe: 1,
				},
			},
		},
		pp: 10,
		target: "normal",
		type: "Bug",
		zMovePower: 180,
		shortDesc: "30% chance to raise Atk & Spe by 1.",
		desc: "30% chance to raise the user's Attack and Speed by 1.",
	},

	// Rock
	rockcannon: {
		category: "Special",
		basePower: 110,
		accuracy: 100,
		id: "rockcannon",
		name: "Rock Cannon",
		isNonstandard: true,
		flags: {
			protect: 1,
			mirror: 1,
		},
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Power Gem", target);
		},
		secondary: {
			chance: 30,
			volatileStatus: 'flinch',
		},
		pp: 10,
		priority: 0,
		target: "normal",
		type: "Rock",
		zMovePower: 195,
		desc: "30% chance to flinch the target.",
	},

	// Ghost
	spook: {
		category: "Special",
		basePower: 80,
		accuracy: 100,
		id: "spook",
		name: "Spook",
		isNonstandard: true,
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Trick-or-Treat", source);
		},
		flags: {
			protect: 1,
			mirror: 1,
		},
		willCrit: true,
		secondary: {
			chance: 30,
			volatileStatus: 'flinch',
		},
		pp: 10,
		priority: 0,
		target: "normal",
		type: "Ghost",
		zMovePower: 160,
		desc: "30% chance to flinch the target and always crits.",
		shortDesc: "30% chance to flinch; always crits.",
	},

	// Dragon
	imperialrampage: {
		category: "Physical",
		basePower: 175,
		accuracy: 100,
		id: "imperialrampage",
		name: "Imperial Rampage",
		isNonstandard: true,
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Outrage", target);
		},
		self: {
			volatileStatus: 'lockedmove',
		},
		onAfterMove(pokemon) {
			if (pokemon.volatiles['lockedmove'] && pokemon.volatiles['lockedmove'].duration === 1) {
				pokemon.removeVolatile('lockedmove');
				this.boost({
					atk: -2,
				});
			}
		},
		pp: 10,
		flags: {
			contact: 1,
			protect: 1,
			mirror: 1,
		},
		priority: 0,
		target: "normal",
		type: "Dragon",
		zMovePower: 220,
		desc: "Lasts 2-3 turns, confuses the user afterwards and lowers the user's Attack by 2.",
		shortDesc: "2-3 turns, confuses user, lowers Atk by 2.",
	},

	// Dark
	shadowrun: {
		category: "Physical",
		basePower: 100,
		accuracy: 95,
		id: "shadowrun",
		name: "Shadow Run",
		isNonstandard: true,
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Shadow Sneak", target);
			this.add('-anim', target, "Knock Off", target);
		},
		onAfterHit(target, source) {
			if (source.hp) {
				let item = target.takeItem();
				if (item) {
					this.add('-enditem', target, item.name, '[from] move: Shadow Run', '[of] ' + source);
				}
			}
		},
		pp: 10,
		flags: {
			contact: 1,
			protect: 1,
			mirror: 1,
		},
		priority: 1,
		target: "normal",
		type: "Dark",
		zMovePower: 180,
		desc: "1.5x damage if foe holds an item. Removes item.",
	},

	// Steel
	magnorang: {
		category: "Physical",
		accuracy: 90,
		basePower: 120,
		id: "magnorang",
		name: "Magnorang",
		isNonstandard: true,
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Magnet Bomb", target);
		},
		onHit(target, source, move) {
			if (target.types.indexOf('Steel') > -1) {
				if (!target.addVolatile('trapped', source, move, 'trapper')) {
					this.add('-fail', target);
				}
			}
		},
		pp: 10,
		flags: {
			protect: 1,
			mirror: 1,
		},
		target: "normal",
		type: "Steel",
		zMovePower: 210,
		desc: "Traps Steel Types from choosing to switch.",
	},

	// Fairy
	majesticdust: {
		category: "Special",
		accuracy: 100,
		basePower: 120,
		id: "majesticdust",
		name: "Majestic Dust",
		isNonstandard: true,
		flags: {
			protect: 1,
			powder: 1,
		},
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Powder", target);
		},
		secondary: {
			chance: 30,
			status: 'par',
		},
		pp: 10,
		target: "normal",
		zMovePower: 210,
		type: "Fairy",
		desc: "30% chance to paralyze the target.",
	},

	// Insist
	debugging: {
		id: "debugging",
		name: "Debugging",
		priority: 1,
		isNonstandard: true,
		self: {
			boosts: {
				spa: 1,
				spe: 1,
			},
		},
		flags: {
			protect: 1,
			mirror: 1,
		},
		desc: "Boosts user's Special Attack and Speed by 1 stage.",
		shortDesc: "Boosts user's SpA & Spe by 1.",
		secondary: false,
		category: "Special",
		onHit(target, source, move) {
			this.add('c|@Insist|``npm test``');
		},
		onPrepareHit(target, source) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Hydro Pump", target);
		},
		basePower: 90,
		pp: 15,
		accuracy: 100,
		target: "normal",
		type: "Water",
		zMovePower: 140,
		contestType: "Cool",
	},

	//Insist
	"exiledfromallothers": {
		id: "exiledfromallothers",
		name: "Exiled From All Others",
		basePower: 150,
		accuracy: 100,
		pp: 1,
		noPPBoosts: true,
		secondary: false,
		category: "Special",
		isNonstandard: true,
		isZ: "playniumz",
		priority: 1,
		flags: {
			protect: 1,
		},
		onHit(target, source, move) {
			this.add('c|@Insist|Exiled from all others, we shall become greater than ever before.');
		},
		onPrepareHit(target, source) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Hydro Pump", target);
		},
		target: "normal",
		type: "Water",
	},
};
