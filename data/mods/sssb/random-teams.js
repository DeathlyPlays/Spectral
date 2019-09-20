'use strict';

/** @typedef {{[name: string]: SSBSet}} SSBSets */
/**
 * @typedef {Object} SSBSet
 * @property {string} species
 * @property {string | string[]} ability
 * @property {string | string[]} item
 * @property {GenderName} gender
 * @property {(string | string[])[]} moves
 * @property {string} signatureMove
 * @property {{hp?: number, atk?: number, def?: number, spa?: number, spd?: number, spe?: number}=} evs
 * @property {{hp?: number, atk?: number, def?: number, spa?: number, spd?: number, spe?: number}=} ivs
 * @property {string | string[]} nature
 * @property {number=} level
 * @property {boolean=} shiny
 */

const RandomTeams = require('../../random-teams');

class RandomSSSBTeams extends RandomTeams {
	randomSSSBTeam(side) {
		let userid = toID(side.name);
		/* alts start */
		if (userid === 'arrays') userid = 'volco';
		/* alts ends */
		/** @type {PokemonSet[]} */
		let team = [];
		/** @type {SSBSets} */
		let sets = {
			// Breaking Gods
			"☢RaginInfernape": {
				species: "Infernape",
				item: "Life Orb",
				ability: "Raging Spirit",
				shiny: true,
				gender: "M",
				moves: ["Mach Punch", "Knock Off", "Ice Punch"],
				baseSignatureMove: "fireydestruction",
				signatureMove: "Firey Destruction",
				evs: {
					atk: 252,
					spe: 252,
					def: 4,
				},
				nature: "Jolly",
			},
			// Fixing Gods
			"⚔Volco": {
				species: "Volcanion",
				item: "Barrage Vest",
				ability: "Emergency Actions",
				gender: "M",
				moves: [["Ice Beam", "Earth Power"], "Giga Drain", "Steam Eruption"],
				baseSignatureMove: "volcanicflares",
				signatureMove: "Volcanic Flares",
				evs: {
					hp: 76,
					spa: 212,
					spe: 220,
				},
				ivs: {
					atk: 0,
				},
				nature: "Modest",
			},
			// Administrators
			"~Roughskull": {
				species: "Skuntank",
				item: "Crown of TMS",
				ability: "Venom Shock",
				gender: "M",
				moves: ["Sucker Punch", "Flame Charge", "Thousand Waves"],
				baseSignatureMove: "radiationstench",
				signatureMove: "Radiation Stench",
				evs: {
					atk: 252,
					hp: 252,
					spe: 4,
				},
				nature: "Adamant",
			},
			"~Zakuree": {
				species: "Gallade-Mega",
				item: "Soul Orb",
				ability: "Heart of Steel",
				gender: "M",
				moves: ["Cross Chop", "Psycho Cut", "Blaze Kick"],
				baseSignatureMove: "16years",
				signatureMove: "16 Years",
				evs: {
					atk: 252,
					spd: 4,
					spe: 252,
				},
				nature: "Jolly",
			},
			// Leaders
			"&Chandie": {
				species: "Marshadow",
				item: "Void Heart",
				ability: "Shade Seeker",
				gender: "M",
				moves: ["Close Combat", "Spectral Thief", "Ice Punch"],
				baseSignatureMove: "sharpshadow",
				signatureMove: "Sharp Shadow",
				evs: {
					atk: 252,
					def: 4,
					spe: 252,
				},
				nature: "Adamant",
			},
			"&AlfaStorm": {
				species: "Yveltal",
				item: "Life Orb",
				ability: "Dark Aura",
				gender: "M",
				moves: ["Oblivion Wing", "Ice Beam", "Earth Power"],
				baseSignatureMove: "doomstrike",
				signatureMove: "Doom Strike",
				evs: {
					def: 4,
					spa: 252,
					spe: 252,
				},
				nature: "Modest",
			},
			// Moderators
			"@Horrific17": {
				species: "Arcanine",
				item: "Arcanium Z",
				ability: "Reverse Card",
				gender: "M",
				moves: ["Wild Charge", "Extreme Speed", "Play Rough"],
				baseSignatureMove: "meteorcharge",
				signatureMove: "Meteor Charge",
				evs: {
					atk: 252,
					spe: 252,
					def: 4,
				},
				nature: "Jolly",
			},
			"@Tactician Loki": {
				species: "Liepard",
				item: "Thokk",
				ability: "Chaotic Aura",
				shiny: true,
				gender: "F",
				moves: ["Copycat", "Ice Beam", "Spiky Shield"],
				baseSignatureMove: "bloomingchaos",
				signatureMove: "Blooming Chaos",
				evs: {
					spa: 252,
					spe: 252,
					def: 4,
				},
				nature: "Timid",
			},
			// Bots
			/*
			"*Spectral Bot": {
				species: "Magearna",
				item: "Assault Vest",
				ability: "Spectral's Thief",
				gender: "N",
				moves: ["Play Rough", "Sunsteel Strike", "Ice Punch"],
				baseSignatureMove: "angelicspectral",
				signatureMove: "Angelic Spectral",
				evs: {
					atk: 252,
					spd: 4,
					spe: 252,
				},
				nature: "Jolly",
			},
			*/
			// Drivers
			"%Back At My Day": {
				species: "Zapdos",
				item: "Life Orb",
				ability: "Peal of Thunder",
				shiny: true,
				gender: "M",
				moves: ["Aeroblast", "Earth Power", "Secret Sword"],
				baseSignatureMove: "bigthunder",
				signatureMove: "Big Thunder",
				evs: {
					spa: 252,
					spe: 252,
					def: 4,
				},
				nature: "Timid",
			},
			// Voices
			"+Revival Clair": {
				species: "Garchomp",
				item: "Focus Sash",
				ability: "Tough Skin",
				gender: "F",
				moves: ["Earthquake", "Outrage", "Stone Edge"],
				baseSignatureMove: "dragonblitz",
				signatureMove: "Dragon Blitz",
				evs: {
					atk: 252,
					spd: 4,
					spe: 252,
				},
				nature: "Jolly",
			},
			"+La Rascasse": {
				species: "Giratina-Origin",
				item: "Heart of Darkness",
				ability: "Guardian of Sinnoh",
				shiny: true,
				gender: "F",
				moves: ["Calm Mind", "Moonblast", "Focus Blast"],
				baseSignatureMove: "distortiondestruction",
				signatureMove: "Distortion Destruction",
				evs: {
					def: 4,
					spa: 252,
					spd: 252,
				},
				nature: "Modest",
			},
		};
		let pool = Object.keys(sets);
		/** @type {{[type: string]: number}} */
		let typePool = {};
		while (pool.length && team.length < 6) {
			let name = this.sampleNoReplace(pool);
			if (team.length === 5) {
				let included = false;
				for (const pkmn of team) {
					if (toID(pkmn.name.toString()) === toID(userid.toString())) {
						included = true;
						break;
					}
				}
				for (let mon in sets) {
					if (toID(mon.toString()) === userid && !included) {
						let arr = [];
						arr.push(mon);
						name = this.sampleNoReplace(arr);
						break;
					}
				}
			}
			let ssbSet = sets[name];
			// Enforce typing limits
			let types = this.getTemplate(ssbSet.species).types;
			let rejected = false;
			for (let type of types) {
				if (typePool[type] === undefined) typePool[type] = 0;
				if (typePool[type] >= 2) {
					// Reject
					rejected = true;
					break;
				}
			}
			if (rejected) continue;
			// Update type counts
			for (let type of types) {
				typePool[type]++;
			}
			/** @type {PokemonSet} */
			let set = {
				name: name,
				species: ssbSet.species,
				item: Array.isArray(ssbSet.item) ? this.sampleNoReplace(ssbSet.item) : ssbSet.item,
				ability: Array.isArray(ssbSet.ability) ? this.sampleNoReplace(ssbSet.ability) : ssbSet.ability,
				moves: [],
				nature: Array.isArray(ssbSet.nature) ? this.sampleNoReplace(ssbSet.nature) : ssbSet.nature,
				gender: ssbSet.gender,
				evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
				ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
				level: ssbSet.level || 100,
				shiny: ssbSet.shiny,
			};
			if (ssbSet.ivs) {
				for (let iv in ssbSet.ivs) {
					// IVs from the set override the default of 31, assume the hardcoded IVs are legal
					// @ts-ignore StatsTable has no index signature
					set.ivs[iv] = ssbSet.ivs[iv];
				}
			}
			if (ssbSet.evs) {
				for (let ev in ssbSet.evs) {
					// EVs from the set override the default of 0, assume the hardcoded EVs are legal
					// @ts-ignore StatsTable has no index signature
					set.evs[ev] = ssbSet.evs[ev];
				}
			} else {
				set.evs = {hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84};
			}
			while (set.moves.length < 3 && ssbSet.moves.length > 0) {
				let move = this.sampleNoReplace(ssbSet.moves);
				if (Array.isArray(move)) move = this.sampleNoReplace(move);
				set.moves.push(move);
			}
			set.moves.push(ssbSet.signatureMove);
			team.push(set);
		}
		return team;
	}
}

module.exports = RandomSSSBTeams;
