'use strict';

const RandomTeams = require('../../random-teams');

class RandomSSSBTeams extends RandomTeams {
	randomSSSBTeam() {
		let team = [];
		let sets = {
			// Breaking Gods
			"☢RaginInfernape": {
				species: "Infernape",
				item: "Life Orb",
				ability: "Raging Spirit",
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
			// Administrators
			// Leaders
			// Moderators
			// Bots
			// Players
			// Drivers
			// Voices
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

module.exports = RandomSSSBTeams;
