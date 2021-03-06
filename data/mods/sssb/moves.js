"use strict";

/**@type {{[k: string]: MoveData}} */
let BattleMovedex = {
	// RaginInfernape
	"fireydestruction": {
		id: "fireydestruction",
		name: "Firey Destruction",
		basePower: 100,
		accuracy: true,
		category: "Physical",
		shortDesc: "50% chance to burn.",
		desc: "50% chance to burn the opponent.",
		pp: 15,
		secondary: {
			chance: 50,
			status: "brn",
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Fiery Dance', target);
			this.add('-anim', source, 'Flare Blitz', target);
			this.add(`c|☢RaginInfernape|!git gud nerd`);
			let gitGud =
				 `${Config.serverName}'s Github's:<br />` +
				 `- Language: JavaScript (Node.js)<br />` +
				`- <a href="https://github.com/DeathlyPlays/Spectral">${Config.serverName}'s Server Code</a><br />` +
				`- <a href="https://github.com/DeathlyPlays/Spectral/commits/master">What's new?</a><br />` +
				`- <a href="https://github.com/Zarel/Pokemon-Showdown">Main's source code</a><br />` +
				`- <a href="https://github.com/Zarel/Pokemon-Showdown-Client">Client source code</a><br />` +
				`- <a href="https://github.com/Zarel/Pokemon-Showdown-Dex">Dex source code</a>`;
			this.add(`raw|${gitGud}`);
		},
		flags: {protect: 1, mirror: 1, contact: 1, defrost: 1},
		priority: 0,
		target: "normal",
		type: "Fire",
	},

	// Volco
	"volcanicflares": {
		id: "volcanicflares",
		name: "Volcanic Flares",
		basePower: 130,
		accuracy: 95,
		category: "Special",
		shortDesc: "30% to burn the foe or self-boost SpA by 1 stage.",
		desc: "Has 30% chance of burning the foe or boost the user's SpD by 1 stage.",
		pp: 10,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Eruption', target);
			this.add('-anim', source, 'Rock Tomb', target);
			this.add('-anim', source, 'Blue Flare', target);
		},
		onHit(target, source) {
			let rand = this.random(100);
			if (rand <= 30) {
				let effect = this.random(2);
				if (effect === 1) {
					target.trySetStatus('brn');
				} else {
					this.boost({spd: 1}, source);
				}
			}
		},
		secondary: false,
		flags: {protect: 1, mirror: 1},
		priority: 0,
		target: "normal",
		type: "Fire",
	},

	// Back At My Day
	"bigthunder": {
		id: "bigthunder",
		name: "Big Thunder",
		basePower: 120,
		accuracy: true,
		category: "Special",
		shortDesc: "50% chance to target self or foe.",
		desc: "50% chance to target user or the opponent.",
		pp: 10,
		onModifyMove(move, target, pokemon) {
			let newTarget = Math.floor(Math.random() * 100);
			if (newTarget > 50) {
				move.target = "normal";
			} else {
				move.target = "self";
			}
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Thunder', target);
			this.add(`c|%Back At My Day|Who's gonna get hit?`);
		},
		secondary: null,
		flags: {protect: 1, mirror: 1},
		priority: 0,
		type: "Electric",
	},

	// Chandie
	"sharpshadow": {
		accuracy: 100,
		basePower: 70,
		category: "Physical",
		desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button or through the effect of the Emergency Exit or Wimp Out Abilities.",
		shortDesc: "User switches out after damaging the target.",
		id: "sharpshadow",
		name: "Sharp Shadow",
		pp: 20,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		selfSwitch: true,
		secondary: null,
		onPrepareHit(target, source) {
			this.add('-anim', target, 'Sucker Punch', target);
		},
		target: "normal",
		type: "Ghost",
		zMovePower: 100,
		contestType: "Cool",
	},

	// Chandie
	"embracethevoid": {
		id: "embracethevoid",
		name: "Embrace the Void",
		shortDesc: "Summons Magic Room. Switches out opponent.",
		basePower: 120,
		accuracy: true,
		isZ: "voidheart",
		pp: 1,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onPrepareHit(target, source) {
			this.add('-anim', target, 'Black Hole Eclipse', target);
			this.add('-anim', target, 'Dark Void', target);
		},
		pseudoWeather: "magicroom",
		secondary: null,
		target: "normal",
		forceSwitch: true,
		category: "Physical",
		type: "Ghost",
	},

	// Horrific17
	"meteorcharge": {
		id: "meteorcharge",
		name: "Meteor Charge",
		desc: "Sets the weather to Sunny Day, and deals 1/3rd of the user's maximum health in recoil.",
		shortDesc: "Weather becomes sunny, 1/3 recoil of max HP.",
		basePower: 100,
		accuracy: 100,
		pp: 5,
		priority: 0,
		recoil: [1, 3],
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Flare Blitz', target);
			this.add(`c|@Horrific17|Pick a God and pray!`);
		},
		flags: {protect: 1, mirror: 1, contact: 1, defrost: 1},
		weather: "sunnyday",
		category: "Physical",
		type: "Fire",
		secondary: null,
		target: "normal",
	},

	// Horrific17
	"eternalflames": {
		id: "eternalflames",
		name: "Eternal Flames",
		shortDesc: "Burns and traps the target.",
		basePower: 150,
		accuracy: true,
		isZ: "arcaniumz",
		pp: 1,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Extreme Evoboost', source);
			this.add('-anim', source, 'Flare Blitz', target);
			this.add('-anim', source, 'Magma Storm', target);
			this.add(`c|@Horrific17|See you in the Eternal Flames.`);
		},
		priority: 0,
		secondary: null,
		category: "Physical",
		type: "Fire",
		volatileStatus: "partiallytrapped",
		status: "brn",
		target: "normal",
	},

	// flufi
	"16years": {
		id: "16years",
		name: "16 Years",
		shortDesc: "Only works at 1 HP, user faints after usage.",
		basePower: 180,
		onPrepareHit(target, source) {
			if (source.hp !== 1) {
				this.hint(`This move may be only used once the user has 1 HP.`);
				return false;
			}
			this.add('-anim', source, 'Hex', source);
			this.add('-anim', source, 'Spectral Thief', source);
			this.add('-anim', source, 'Hyper Beam', target);
		},
		accuracy: true,
		pp: 5,
		priority: 0,
		secondary: null,
		selfdestruct: "ifHit",
		category: "Physical",
		type: "Dark",
		target: "normal",
	},

	// AlfaStorm
	"doomstrike": {
		id: "doomstrike",
		name: "Doom Strike",
		desc: "User switches out after damaging the target.",
		shortDesc: "Switches out after damaging.",
		basePower: 90,
		accuracy: 100,
		pp: 10,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Shadow Strike', target);
			this.add('-anim', source, 'U-Turn', target);
		},
		priority: 0,
		selfSwitch: true,
		secondary: null,
		category: "Special",
		type: "Dark",
		target: "normal",
	},

	// Roughskull
	"radiationstench": {
		accuracy: 100,
		basePower: 120,
		category: "Physical",
		desc: "Power doubles if the target is poisoned, and has a 30% chance to cause the target to flinch.",
		shortDesc: "Power doubles if the target is poisoned. 30% chance to flinch.",
		id: "radiationstench",
		name: "Radiation Stench",
		pp: 10,
		priority: 0,
		volatileStatus: 'gastroacid',
		flags: {protect: 1, mirror: 1},
		onBasePower(basePower, pokemon, target) {
			if (target.status === 'psn' || target.status === 'tox') {
				return this.chainModify(2);
			}
		},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Steel') return 1;
		},
		secondary: {
			chance: 30,
			volatileStatus: 'flinch',
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Acid Downpour', target);
		},
		target: "normal",
		type: "Poison",
		zMovePower: 200,
		contestType: "Beautiful",
	},

	// Tactician Loki
	"bloomingchaos": {
		id: "bloomingchaos",
		name: "Blooming Chaos",
		basePower: 80,
		accuracy: true,
		desc: "Casts Heart Swap, then casts Topsy Turvy on opponent, 30% to cause burn to opponent, 30% chance to badly poison opponent, 10% chance to cause Confusion on caster and opponent, 10% chance to cause opponent to fall in love, 10% chance for opponent to flinch, 10% chance to freeze opponent.",
		shortDesc: "A variety of curses begin.",
		pp: 20,
		priority: 2,
		category: "Special",
		onHit(target, source) {
			let targetBoosts = {};
			let sourceBoosts = {};

			for (let i in target.boosts) {
				// @ts-ignore
				targetBoosts[i] = target.boosts[i];
				// @ts-ignore
				sourceBoosts[i] = source.boosts[i];
			}

			target.setBoost(sourceBoosts);
			source.setBoost(targetBoosts);

			this.add('-swapboost', source, target, '[from] move: Blooming Chaos');

			let success = false;
			for (let i in target.boosts) {
				// @ts-ignore
				if (target.boosts[i] === 0) continue;
				// @ts-ignore
				target.boosts[i] = -target.boosts[i];
				success = true;
			}
			if (!success) return false;
			this.add('-invertboost', target, '[from] move: Blooming Chaos');
		},
		secondaries: [
			{
				chance: 30,
				status: "brn",
			}, {
				chance: 30,
				status: "tox",
			}, {
				chance: 10,
				volatileStatus: "confusion",
			}, {
				chance: 10,
				volatileStatus: "attract",
			}, {
				chance: 10,
				status: "frz",
			}, {
				chance: 10,
				volatileStatus: "flinch",
			},
		],
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Black Hole Eclipse', target);
			this.add(`c|~Tactician Loki|I love sending people into a tizzy.`);
		},
		flags: {reflectable: 1, protect: 1, mirror: 1},
		target: "normal",
		type: "Dark",
	},

	// Revival Clair
	"dragonblitz": {
		id: "dragonblitz",
		name: "Dragon Blitz",
		basePower: 80,
		accuracy: 100,
		desc: "Nearly always goes first and has 33% chance of boosting Attack by 1 stage, and does neutral damage towards Fairies.",
		shortDesc: "33% chance of boosting Atk by 1 stage, neutral damage to Fairy types.",
		pp: 5,
		priority: 2,
		category: "Physical",
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dragon Rush', target);
			this.add(`c|+Revival Clair|Good game, too easy.`);
		},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Fairy') return 0;
		},
		flags: {protect: 1, mirror: 1, contact: 1},
		secondary: {
			chance: 33,
			self: {
				boosts: {
					atk: 1,
				},
			},
		},
		target: "normal",
		type: "Dragon",
	},

	// Spectral Bot
	"angelicspectral": {
		isNonstandard: true,
		accuracy: 100,
		category: "Physical",
		id: "angelicspectral",
		desc: "Transforms into Marshadow if Magearna or vice versa.",
		name: "Angelic Spectral",
		pp: 10,
		priority: 1,
		basePower: 110,
		onHit(target, pokemon, move) {
			if (pokemon.baseTemplate.baseSpecies === 'Magearna' && !pokemon.transformed) {
				move.willChangeForme = true;
			}
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (move.willChangeForme) {
				pokemon.formeChange(pokemon.template.speciesid === 'marshadow' ? 'Magearna' : 'Marshadow', this.effect, false, '[msg]');
			}
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Boomburst', target);
		},
		flags: {
			protect: 1,
			distance: 1,
		},
		secondary: null,
		target: "normal",
		type: "Ghost",
	},

	// Auroura
	"climatecast": {
		id: "climatecast",
		name: "Climate Cast",
		basePower: 120,
		accuracy: 100,
		desc: "Type changes to match weather condition.",
		shortDesc: "Type changes to match weather condition.",
		pp: 20,
		priority: 1,
		category: "Special",
		flags: {protect: 1, mirror: 1},
		secondary: null,
		onModifyMove(move) {
			switch (this.field.effectiveWeather()) {
			case 'sunnyday':
			case 'desolateland':
				move.type = 'Fire';
				break;
			case 'raindance':
			case 'primordialsea':
				move.type = 'Water';
				break;
			case 'hail':
				move.type = 'Ice';
				break;
			}
		},
		onPrepareHit(target, source, move) {
			if (move.type === 'Fire') {
				this.add('-anim', source, 'Searing Shot', target);
			} else if (move.type === 'Water') {
				this.add('-anim', source, 'Brine', target);
			} else if (move.type === 'Ice') {
				this.add('-anim', source, 'Icy Wind', target);
			} else {
				this.add('-anim', source, 'Swift', target);
			}
		},
		target: "normal",
		type: "Normal",
	},
	
	// Renfur⚡⚡
	"desertdragon": {
		id: "desertdragon",
		name: "Desert Dragon",
		basePower: 90,
		accuracy: 100,
		desc: "User switches out after damaging the target and doubles allies' speed for 4 turns. Hits adjacent Pokemon.",
		shortDesc: "Switches out after damaging, doubles allies' speed for 4 turns and hits adjacent Pokemon.",
		pp: 10,
		priority: 0,
		selfSwitch: true,
		category: "Special",
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Boomburst', target);
			this.add(`c|%Renfur⚡⚡|This move ain't even that broke Obama`);
		},
		flags: {protect: 1, mirror: 1, sound: 1, authentic: 1},
		self: {
			sideCondition: 'tailwind',
			effect: {
				duration: 4,
				onStart(side) {
					this.add('-sidestart', side, 'move: Desert Dragon');
				},
				onModifySpe(spe, pokemon) {
					return this.chainModify(2);
				},
				onResidualOrder: 21,
				onResidualSubOrder: 4,
				onEnd(side) {
					this.add('-sideend', side, 'move: Desert Dragon');
				},
			},
		},
		secondary: null,
		target: "allAdjacent",
		type: "Bug",
	},
	
	// shademaura ⌐⚡_
	"sarcasmovertext": {
		id: "sarcasmovertext",
		name: "Sarcasm Over Text",
		basePower: 100,
		accuracy: 100,
		desc: "Hits adjacent Pokemon and has 100% chance to Taunt.",
		shortDesc: "Hits adjacent Pokemon and always Taunts.",
		pp: 5,
		priority: 0,
		category: "Physical",
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Earthquake', target);
			this.add(`c|+shademaura ⌐⚡_|Oh ur SSB is so good`);
		},
		flags: {protect: 1, mirror: 1},
		volatileStatus: 'taunt',
		secondary: null,
		target: "allAdjacent",
		type: "Poison",
	},
};

exports.BattleMovedex = BattleMovedex;
