'use strict';

const RandomTeams = require('../../random-teams');

class RandomFakemonsTeams extends RandomTeams {
	randomFakemonsTeam() {
		let team = [];
		let sets = {
			'Heracross': {
				species: 'Heracross',
				ability: 'Crafty',
				item: 'Fightinium Z',
				moves: ['swordsdance', 'closecombat', 'rockblast'],
				baseSignatureMove: "onethousandstings",
				signatureMove: "One Thousand Stings",
				evs: {
					atk: 252,
					spd: 4,
					spe: 252,
				},
				nature: 'Jolly',
			},
			'Frostorus': {
				species: 'Frostorus',
				ability: 'Snow Warning',
				item: 'Leftovers',
				moves: ['calmmind', 'icebeam', 'thunderbolt', 'focusblast', 'uturn', 'defog', 'auroraveil'],
				evs: {
					spa: 252,
					spd: 4,
					spe: 252,
				},
				nature: 'Timid',
			},
			'Frostorus-Therian': {
				species: 'Frostorus-Therian',
				ability: 'Refrigerate',
				item: 'Life Orb',
				moves: ['hypervoice', 'thunderbolt', 'focusblast', 'uturn'],
				evs: {
					spa: 252,
					spe: 252,
					spd: 4,
				},
				nature: 'Timid',
			},
			'Semighoul': {
				species: 'Semighoul',
				ability: 'Shadow Tag',
				item: 'Leftovers',
				moves: ['hypervoice', 'shadowball', 'perishsong', 'protect'],
				evs: {
					spa: 252,
					spe: 252,
					spd: 4,
				},
				nature: 'Timid',
			},
			'Dynamouse': {
				species: 'Dynamouse',
				ability: 'Unburden',
				item: 'Focus Sash',
				moves: ['hypervoice', 'fireblast', 'hiddenpowergrass', 'willowisp'],
				evs: {
					spa: 252,
					spd: 4,
					spe: 252,
				},
				nature: 'Timid',
			},
			'Moshka': {
				species: 'Moshka',
				ability: 'Wonder Guard',
				item: 'Focus Sash',
				moves: ['calmmind', 'dazzlinggleam', 'hex', 'thunderwave'],
				evs: {
					spa: 252,
					spe: 252,
					def: 4,
				},
				nature: 'Timid',
			},
			'Protokkol': {
				species: 'Protokkol',
				ability: 'Galvanize',
				item: 'Choice Specs',
				moves: ['flashcannon', 'hyperbeam', 'hiddenpowerice', 'voltswitch'],
				evs: {
					hp: 252,
					spa: 252,
					spd: 4,
				},
				nature: 'Modest',
			},
		};
		// convert moves to ids.
		for (let k in sets) {
			sets[k].moves = sets[k].moves.map(toID);
			sets[k].baseSignatureMove = toID(sets[k].baseSignatureMove);
		}

		// Generate the team randomly.
		let pool = this.shuffle(Object.keys(sets));
		for (let i = 0; i < 6; i++) {
			let set = sets[pool[i]];
			set.level = 100;
			set.name = pool[i];
			if (!set.ivs) {
				set.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
			} else {
				for (let iv in {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}) {
					set.ivs[iv] = set.ivs[iv] || set.ivs[iv] === 0 ? set.ivs[iv] : 31;
				}
			}
			// Assuming the hardcoded set evs are all legal.
			if (!set.evs) set.evs = {hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84};
			set.moves = [this.sampleNoReplace(set.moves), this.sampleNoReplace(set.moves), this.sampleNoReplace(set.moves)].concat(set.signatureMove);
			team.push(set);
		}
		return team;
	}
}

module.exports = RandomFakemonsTeams;
