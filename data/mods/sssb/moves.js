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
		},
		secondary: null,
		flags: {protect: 1, mirror: 1},
		priority: 0,
		type: "Electric",
	},

	// Chandie
	"sharpshadow": {
		accuracy: 100,
		basePower: 40,
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
			this.add('-anim', source, 'Sucker Punch', target);
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
		shortDesc: "Switches out opponent. Summons Magic Room. Gives user +1 Attack.",
		basePower: 120,
		accuracy: true,
		isZ: "voidheart",
		pp: 1,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dark Void', target);
			this.add('-anim', source, 'Never-Ending Nightmare', target);
		},
		pseudoWeather: "magicroom",
		secondary: {
			chance: 100,
			self: {
				boosts: {
					atk: 1,
				},
			},
		},
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

	// Zakuree
	"16years": {
		id: "16years",
		name: "16 Years",
		shortDesc: "Only works at 1 HP, user faints after usage.",
		basePower: 200,
		onPrepareHit(target, source) {
			if (source.hp !== 1) return false;
			this.hint(`This move may be only used once the user has 1 HP.`);
			this.add('-anim', source, 'Hex', source);
			this.add('-anim', source, 'Hyper Beam', target);
		},
		accuracy: true,
		pp: 5,
		priority: 0,
		secondary: null,
		selfdestruct: "ifHit",
		category: "Special",
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
		accuracy: 85,
		basePower: 120,
		category: "Special",
		desc: "Power doubles if the target is poisoned, and has a 30% chance to cause the target to flinch.",
		shortDesc: "Power doubles if the target is poisoned. 30% chance to flinch.",
		id: "radiationstench",
		name: "Radiation Stench",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onBasePower(basePower, pokemon, target) {
			if (target.status === 'psn' || target.status === 'tox') {
				return this.chainModify(2);
			}
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
		zMovePower: 120,
		contestType: "Beautiful",
	},
};

exports.BattleMovedex = BattleMovedex;
