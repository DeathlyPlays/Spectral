'use strict';

/**@type {{[k: string]: MoveData}} */
let BattleMovedex = {
	"powertrick": {
		inherit: true,
		desc: "The user swaps its Attack and Defense stats and Special Attack and Special Defense, and stat stage changes remain on their respective stats. This move can be used again to swap the stats back. If the user uses Baton Pass, the replacement will have its Attack and Defense stats swapped if the effect is active. If the user has its stats recalculated by changing forme while its stats are swapped, this effect is ignored but is still active for the purposes of Baton Pass.",
		shortDesc: "Switches user's Attack and Defense and Special Attack and Special Defense stats.",
		effect: {
			onStart(pokemon) {
				this.add('-start', pokemon, 'Power Trick');
				let newatk = pokemon.storedStats.def;
				let newdef = pokemon.storedStats.atk;
				let newspa = pokemon.storedStats.spd;
				let newspd = pokemon.storedStats.spa;
				pokemon.storedStats.atk = newatk;
				pokemon.storedStats.def = newdef;
				pokemon.storedStats.spa = newspd;
				pokemon.storedStats.spd = newspa;
			},
			onCopy(pokemon) {
				let newatk = pokemon.storedStats.def;
				let newdef = pokemon.storedStats.atk;
				let newspa = pokemon.storedStats.spd;
				let newspd = pokemon.storedStats.spa;
				pokemon.storedStats.atk = newatk;
				pokemon.storedStats.def = newdef;
				pokemon.storedStats.spa = newspd;
				pokemon.storedStats.spd = newspa;
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'Power Trick');
				let newatk = pokemon.storedStats.def;
				let newdef = pokemon.storedStats.atk;
				let newspa = pokemon.storedStats.spd;
				let newspd = pokemon.storedStats.spa;
				pokemon.storedStats.atk = newatk;
				pokemon.storedStats.def = newdef;
				pokemon.storedStats.spa = newspd;
				pokemon.storedStats.spd = newspa;
			},
			onRestart(pokemon) {
				pokemon.removeVolatile('Power Trick');
			},
		},
	},
};
