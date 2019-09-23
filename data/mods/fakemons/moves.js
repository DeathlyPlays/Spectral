"use strict";

/**@type {{[k: string]: MoveData}} */
let BattleMovedex = {
	// Heracross
	"onethousandstings": {
		id: "onethousandstings",
		name: "One Thousand Stings",
		basePower: 15,
		accuracy: 100,
		category: "Physical",
		shortDesc: "Hits 5 to 10 times.",
		desc: "Hits 5 to 10 times.",
		pp: 10,
		secondary: null,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Poison Sting', target);
		},
		flags: {protect: 1, mirror: 1, contact: 1},
    multihit: [5, 10],
		priority: 0,
		target: "normal",
		type: "Bug",
	},
};

exports.BattleMovedex = BattleMovedex;
