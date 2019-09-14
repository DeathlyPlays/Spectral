'use strict';

const RandomTeams = require('../../random-teams');

class RandomPetmonsTeams extends RandomTeams {
	randomPetmonsTeam() {
		let team = [];
		let sets = {
			'Bittercold': {
				species: 'Cryogonal',
				ability: 'Frostbite',
				item: 'Leftovers',
				moves: ['blizzard', 'recover', 'earthpower', 'toxic', 'hail', 'auroraveil', 'surf'],
				evs: {
					def: 252,
					spd: 252,
					hp: 4,
				},
				nature: 'Modest',
			},
			'Mimishad': {
				species: 'Mimikyu-Totem',
				ability: 'Magic Guard',
				item: 'Life Orb',
				moves: ['fusionbolt', 'swordsdance', 'shadowclaw', 'shadowsneak', 'boltstrike', 'playrough', 'outrage', 'roost', 'earthquake'],
				evs: {
					atk: 252,
					spd: 4,
					spe: 252,
				},
				nature: 'Jolly',
			},
			'Mimisun': {
				species: 'Mimikyu',
				ability: 'Flame Fence',
				item: 'Life Orb',
				moves: ['fusionflare', 'shadowball', 'chargebeam', 'blueflare', 'roost', 'earthpower','dazzlinggleam', 'thunderbolt', 'dracometeor'],
				evs: {
					spa: 252,
					spe: 252,
					spd: 4,
				},
				nature: 'Timid',
			},
			'Metamite': {
				species: 'Armaldo',
				ability: 'Strong Jaw',
				item: 'Leftovers',
				moves: ['uturn', 'crunch', 'bugbite', 'ironhead', 'honeclaws', 'earthquake','stoneedge','psychicfangs','wildcharge','ironhead','rockpolish'],
				evs: {
					atk: 252,
					spe: 252,
					spd: 4,
				},
				nature: 'Jolly',
			},
			'Globscrab': {
				species: 'Krabby',
				ability: 'Imposter',
				item: 'Eviolite',
				moves: ['toxic', 'protect', 'substitute', 'transform'],
				evs: {
					spa: 252,
					spd: 4,
					spe: 252,
				},
				nature: 'Timid',
			},
			'Globster': {
				species: 'Crawdaunt',
				ability: 'Toxic Claw',
				item: 'Leftovers',
				moves: ['poisonjab', 'crabhammer', 'aquajet', 'xscissor', 'clamp', 'bodyslam'],
				evs: {
					atk: 252,
					hp: 252,
					spd: 4,
				},
				nature: 'Lonely',
			},
			'Megazis': {
				species: 'Whirlipede',
				ability: 'Core Shield',
				item: 'Leftovers',
				moves: ['doubleironbash', 'shiftgear', 'ironhead', 'poisonjab', 'earthquake', 'kingsshield', 'megahorn'],
				evs: {
					atk: 252,
					spe: 252,
					spd: 4,
				},
				nature: 'Adamant',
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

module.exports = RandomPetmonsTeams;
