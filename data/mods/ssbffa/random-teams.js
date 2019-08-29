'use strict';

const RandomTeams = require('../../data/random-teams');

const fs = require('fs');

function extend(obj, src) {
	for (let key in src) {
		if (src.hasOwnProperty(key)) obj[key] = src[key];
	}
	return obj;
}

let SSBFFA = JSON.parse(fs.readFileSync('config/chat-plugins/ssb.json', 'utf-8'));

class RandomCustomSSBTeams extends RandomTeams {
	randomCustomSSBTeam() {
		//let SSBFFA = JSON.parse(fs.readFileSync('config/chat-plugins/ssb.json', 'utf-8'));
		let team = [];
		let variant = this.random(2);

		//Parse player objects into sets.
		let ssbSets = {};
		for (let key in SSBFFA) {
			if (!SSBFFA[key].active) continue; //This pokemon is not to be used yet.
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)] = {};
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].name = SSBFFA[key].name;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].species = SSBFFA[key].species;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].ability = SSBFFA[key].ability;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].item = SSBFFA[key].item;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].gender = (SSBFFA[key].gender === 'random' ? ((variant === 1) ? 'M' : 'F') : SSBFFA[key].gender);
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].moves = SSBFFA[key].movepool;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].signatureMove = SSBFFA[key].cMove;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].evs = SSBFFA[key].evs;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].ivs = SSBFFA[key].ivs;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].nature = SSBFFA[key].nature;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].level = parseInt(SSBFFA[key].level);
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].shiny = SSBFFA[key].shiny;
			ssbSets[(SSBFFA[key].symbol + SSBFFA[key].name)].happiness = SSBFFA[key].happiness;
		}

		//var sets = extend(baseSets, ssbSets);
		let backupSet = {
			'Unown': {
				species: 'Unown',
				ability: 'Levitate',
				item: 'Choice Specs',
				moves: ['Hidden Power'],
				evs: {
					spa: 252,
					spd: 252,
					hp: 4,
				},
				nature: 'Modest',
			},
		};
		let sets;
		if (Object.keys(ssbSets).length === 0) {
			sets = extend(ssbSets, backupSet);
		} else {
			sets = ssbSets;
		}

		for (let k in sets) {
			sets[k].moves = sets[k].moves.map(toId);
			if (sets[k].baseSignatureMove) sets[k].baseSignatureMove = toId(sets[k].baseSignatureMove);
		}

		// Generate the team randomly.
		let pool = Object.keys(sets);
		for (let i = 0; i < (Object.keys(sets).length < 6 ? Object.keys(sets).length : 6); i++) {
			let name = this.sampleNoReplace(pool);
			/*if (i === 1 && SSBFFA[toId(side.name)] && SSBFFA[toId(side.name)].active && sets[(SSBFFA[toId(side.name)].symbol + SSBFFA[toId(side.name)].name)] && pool.indexOf((SSBFFA[toId(side.name)].symbol + SSBFFA[toId(side.name)].name)) !== -1) {
				pool.push(name); //re-add
				name = pool[pool.indexOf((SSBFFA[toId(side.name)].symbol + SSBFFA[toId(side.name)].name))];
				pool.splice(pool.indexOf(name), 1);
			}*/
			let set = sets[name];
			set.name = name;
			if (!set.level) set.level = 100;
			if (!set.ivs) {
				set.ivs = {
					hp: 31,
					atk: 31,
					def: 31,
					spa: 31,
					spd: 31,
					spe: 31,
				};
			} else {
				for (let iv in {
					hp: 31,
					atk: 31,
					def: 31,
					spa: 31,
					spd: 31,
					spe: 31,
				}) {
					set.ivs[iv] = iv in set.ivs ? set.ivs[iv] : 31;
				}
			}
			// Assuming the hardcoded set evs are all legal.
			if (!set.evs) {
				set.evs = {
					hp: 84,
					atk: 84,
					def: 84,
					spa: 84,
					spd: 84,
					spe: 84,
				};
			}
			if (set.signatureMove) {
				set.moves = [this.sampleNoReplace(set.moves), this.sampleNoReplace(set.moves), this.sampleNoReplace(set.moves)].concat(set.signatureMove);
			}
			team.push(set);
		}
		return team;
	}
}

module.exports = RandomCustomSSBTeams;
