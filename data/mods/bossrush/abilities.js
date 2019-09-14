'use strict';

/**@type {{[k: string]: ModdedAbilityData}} */
let BattleAbilities = {
	"assistingfinger": {
		id: "assistingfinger",
		name: "Assisting Finger",
		desc: "Uses Metronome automatically each turn.",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual: function (pokemon) {
			this.useMove('Metronome', pokemon, pokemon);
		},
	},
	"ceasarswish": {
		desc: "If this Pokemon is a Gallade, it changes to Mega Forme when it has 1/2 or less of its maximum HP at the end of the turn.",
		shortDesc: "If Gallade, changes to Mega if at 1/2 max HP or less at end of turn.",
		onResidualOrder: 27,
		onResidual: function (pokemon) {
			if (pokemon.baseTemplate.baseSpecies !== 'Gallade' || pokemon.transformed || !pokemon.hp) return;
			if (pokemon.template.speciesid === 'gallademega' || pokemon.hp > pokemon.maxhp / 2) return;
			this.add('-activate', pokemon, 'ability: Ceasars Wish');
			let template = this.getTemplate('Gallade-Mega');
			pokemon.formeChange(template);
			pokemon.baseTemplate = template;
			pokemon.details = template.species + (pokemon.level === 100 ? '' : ', L' + pokemon.level) + (pokemon.gender === '' ? '' : ', ' + pokemon.gender) + (pokemon.set.shiny ? ', shiny' : '');
			this.add('detailschange', pokemon, pokemon.details);
			pokemon.setAbility(template.abilities['0']);
			pokemon.baseAbility = pokemon.ability;
			let newHP = Math.floor(Math.floor(2 * pokemon.template.baseStats['hp'] + pokemon.set.ivs['hp'] + Math.floor(pokemon.set.evs['hp'] / 4) + 100) * pokemon.level / 100 + 10);
			pokemon.hp = newHP - (pokemon.maxhp - pokemon.hp);
			pokemon.maxhp = newHP;
			this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
		},
		id: "ceasarswish",
		name: "Ceasars Wish",
		rating: 4,
		num: -211,
	},
};

exports.BattleAbilities = BattleAbilities;
