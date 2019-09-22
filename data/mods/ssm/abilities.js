'use strict';

/**@type {{[k: string]: ModdedAbilityData}} */
let BattleAbilities = {
	// Zakuree
	"crafty": {
		id: "crafty",
		name: "Crafty",
		desc: "Skill Link + Technician.",
		shortDesc: "Moves that have <= 75 BP get 1.5x damage, cannot fall asleep.",
		onBasePowerPriority: 8,
		onBasePower(basePower, attacker, defender, move) {
			if (basePower <= 60) {
				this.debug('Crafty boost');
				return this.chainModify(1.5);
			}
		},
    onModifyMove(move) {
			if (move.multihit && Array.isArray(move.multihit) && move.multihit.length) {
				move.multihit = move.multihit[1];
			}
			if (move.multiaccuracy) {
				delete move.multiaccuracy;
			}
		},
	},
};

exports.BattleAbilities = BattleAbilities;
