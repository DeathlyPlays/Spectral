"use strict";

/**@type {{[k: string]: MoveData}} */
let BattleMovedex = {
	"gastroacid": {
		inherit: true,
		effect: {
			// Ability suppression implemented in BattlePokemon.ignoringAbility() within battle-engine.js
			onStart(pokemon) {
				this.add('-endability', pokemon);
				this.singleEvent('End', this.getAbility(pokemon.ability), pokemon.abilityData, pokemon, pokemon, 'gastroacid');
				if (pokemon.hasAbility(pokemon.abilitwo)) pokemon.removeVolatile(pokemon.abilitwo, pokemon);
			},
		},
	},
};

exports.BattleMovedex = BattleMovedex;
