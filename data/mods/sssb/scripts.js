'use strict';

/**@type {BattleScriptsData} */
let BattleScripts = {
	setMove(pokemon, oldMove, moveid) {
		let index = pokemon.moves.indexOf(oldMove);
		if (index === -1) return;
		let move = this.getMove(moveid);
		let sketchedMove = {
			move: move.name,
			id: move.id,
			pp: move.pp,
			maxpp: move.pp,
			target: move.target,
			disabled: false,
			used: false,
		};
		Monitor.adminlog(index);
		pokemon.moveset[index] = sketchedMove;
		pokemon.moves[index] = move.id;
	},
};

exports.BattleScripts = BattleScripts;
