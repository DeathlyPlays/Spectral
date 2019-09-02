"use strict";

/**@type {{[k: string]: ItemData}} */
let BattleItems = {
	"deepseascale": {
		inherit: true,
		onModifySpDPriority: 2,
		onModifySpD(spd, pokemon) {
			if (pokemon.fusion) return;
			if (pokemon.baseTemplate.species === 'Clamperl') {
				return this.chainModify(2);
			}
		},
	},

	"deepseatooth": {
		inherit: true,
		onModifySpAPriority: 1,
		onModifySpA(spa, pokemon) {
			if (pokemon.fusion) return;
			if (pokemon.baseTemplate.species === 'Clamperl') {
				return this.chainModify(2);
			}
		},
	},

	"eviolite": {
		inherit: true,
		onModifyDefPriority: 2,
		onModifyDef(def, pokemon) {
			if (pokemon.baseTemplate.nfe && this.getTemplate(pokemon.fusion).nfe) {
				return this.chainModify(1.5);
			}
		},
		onModifySpDPriority: 2,
		onModifySpD(spd, pokemon) {
			if (pokemon.baseTemplate.nfe && this.getTemplate(pokemon.fusion).nfe) {
				return this.chainModify(1.5);
			}
		},
	},

	"lightball": {
		inherit: true,
		onModifyAtkPriority: 1,
		onModifyAtk(atk, pokemon) {
			if (pokemon.baseTemplate.baseSpecies === 'Pikachu' && pokemon.fusion === "Pikachu") {
				return this.chainModify(2);
			}
		},
		onModifySpAPriority: 1,
		onModifySpA(spa, pokemon) {
			if (pokemon.baseTemplate.baseSpecies === 'Pikachu' && pokemon.fusion === "Pikachu") {
				return this.chainModify(2);
			}
		},
	},

	"souldew": {
		inherit: true,
		onBasePowerPriority: 6,
		onBasePower(basePower, user, target, move) {
			if (user.template.num !== 380 && user.template.num !== 381) return;
			if (move && (this.getTemplate(user.fusion).num === 380 || this.getTemplate(user.fusion).num === 381) && (move.type === 'Psychic' || move.type === 'Dragon')) {
				return this.chainModify([0x1333, 0x1000]);
			}
		},
	},

	"thickclub": {
		inherit: true,
		onModifyAtkPriority: 1,
		onModifyAtk(atk, pokemon) {
			if (pokemon.fusion === 'Cubone' || pokemon.baseTemplate.baseSpecies === 'Marowak' || pokemon.baseTemplate.baseSpecies === 'Cubone' || pokemon.fusion === 'Marowak') {
				return this.chainModify(2);
			}
		},
	},
};

exports.BattleItems = BattleItems;
