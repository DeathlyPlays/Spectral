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
	// Stakataka
	"barriercrush": {
		id: "barriercrush",
		name: "Barrier Crush",
		basePower: 150,
		accuracy: 100,
		category: "Physical",
		shortDesc: "Lowers the user's defense by 1. Goes last.",
		desc: "Lowers the user's defense by 1. Goes last.",
		pp: 5,
		secondary: null,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Bounce', target);
		},
		flags: {protect: 1, mirror: 1, contact: 1},
		self: {
			boosts: {
				def: -1,
			},
		},
		priority: -7,
		target: "normal",
		type: "Steel",
	},
};

exports.BattleMovedex = BattleMovedex;
