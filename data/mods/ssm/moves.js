"use strict";

/**@type {{[k: string]: MoveData}} */
let BattleMovedex = {
	// Zakuree
	"onethousandstings": {
		id: "onethousandstings",
		name: "One Thousand Stings",
		basePower: 15,
		accuracy: 100,
		category: "Physical",
		shortDesc: "Hits 10 times.",
		desc: "Hits 10 times.",
		pp: 5,
		secondary: null,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Infestation', target);
		},
		flags: {protect: 1, mirror: 1},
    	multihit: [2, 10],
		priority: 0,
		target: "normal",
		type: "Bug",
	}, 
};

exports.BattleMovedex = BattleMovedex;
