'use strict';

/** @typedef {{[name: string]: SSMSet}} SSMSets */
/**
 * @typedef {Object} SSMSet
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

class RandomSSMTeams extends RandomTeams {
	randomSSMTeam(side) {
		let userid = toID(side.name);
		/* alts start */
		/* alts ends */
		/** @type {PokemonSet[]} */
		let team = [];
		/** @type {SSMSets} */
		let sets = {
			"Zakuree": {
				species: "Heracross",
				item: "Fightinium Z",
				ability: "Crafty",
				gender: "M",
				moves: ["Swords Dance", "Close Combat", "Rock Blast"],
				signatureMove: "One Thousand Stings",
				evs: {
					atk: 252,
					spd: 4,
					spe: 252,
				},
				nature: "Jolly",
			},
		};
		let pool = this.shuffle(Object.keys(sets));
		/** @type {{[type: string]: number}} */
		let typePool = {};
		let i = 0;
		while (team.length < 6) {
			if (i === 1) {
				for (let mon in sets) {
					let monIds = pool.slice(0, 6).map(function (p) {
						return toID(p);
					});
					if (toID(mon.toString()) === userid && monIds.indexOf(userid) === -1) {
						pool[1] = mon;
						break;
					}
				}
			}
			let name = pool[i];
			let ssmSet = sets[name];
			i++;
			// Enforce typing limits
			let types = this.getTemplate(ssmSet.species).types;
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
				species: ssmSet.species,
				item: Array.isArray(ssmSet.item) ? this.sampleNoReplace(ssmSet.item) : ssmSet.item,
				ability: Array.isArray(ssmSet.ability) ? this.sampleNoReplace(ssmSet.ability) : ssmSet.ability,
				moves: [],
				nature: Array.isArray(ssmSet.nature) ? this.sampleNoReplace(ssmSet.nature) : ssmSet.nature,
				gender: ssmSet.gender,
				evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
				ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
				level: ssmSet.level || 100,
				shiny: ssmSet.shiny,
			};
			if (ssmSet.ivs) {
				for (let iv in ssmSet.ivs) {
					// IVs from the set override the default of 31, assume the hardcoded IVs are legal
					// @ts-ignore StatsTable has no index signature
					set.ivs[iv] = ssmSet.ivs[iv];
				}
			}
			if (ssmSet.evs) {
				for (let ev in ssmSet.evs) {
					// EVs from the set override the default of 0, assume the hardcoded EVs are legal
					// @ts-ignore StatsTable has no index signature
					set.evs[ev] = ssmSet.evs[ev];
				}
			} else {
				set.evs = {hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84};
			}
			while (set.moves.length < 3 && ssmSet.moves.length > 0) {
				let move = this.sampleNoReplace(ssmSet.moves);
				if (Array.isArray(move)) move = this.sampleNoReplace(move);
				set.moves.push(move);
			}
			set.moves.push(ssmSet.signatureMove);
			team.push(set);
		}
		return team;
	}
}

module.exports = RandomSSMTeams;
