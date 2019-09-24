"use strict";

/**@type {{[k: string]: MoveData}} */
let BattleMovedex = {
	// Heracross
	"onethousandstings": {
		id: "onethousandstings",
		name: "One Thousand Stings",
		basePower: 18,
		accuracy: 100,
		category: "Physical",
		shortDesc: "Hits 3 to 8 times.",
		desc: "Hits 3 to 8 times.",
		pp: 10,
		secondary: null,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Poison Sting', target);
		},
		flags: {protect: 1, mirror: 1, contact: 1},
		multihit: [3, 8],
		priority: 0,
		target: "normal",
		type: "Bug",
	},
	// Camerupt
	"abrasivecombustion": {
		id: "abrasivecombustion",
		name: "Abrasive Combustion",
		basePower: 130,
		accuracy: 70,
		category: "Special",
		shortDesc: "Cannot be resisted. Hits neutrally on resistant types.",
		desc: "Cannot be resisted. Damage is dealt neutrally on types that resist the move's type.",
		pp: 10,
		secondary: null,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Searing Shot', target);
		},
		flags: {protect: 1, mirror: 1},
		priority: 0,
		target: "normal",
		type: "Fire",
	},
};

exports.BattleMovedex = BattleMovedex;
