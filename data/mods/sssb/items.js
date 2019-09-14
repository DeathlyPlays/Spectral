'use strict';

/**@type {{[k: string]: ItemData}} */
let BattleItems = {
	"arcaniumz": {
		id: "arcaniumz",
		name: "Arcanium Z",
		spritenum: 632,
		onTakeItem: false,
		zMove: "Eternal Flames",
		zMoveFrom: "Meteor Charge",
		zMoveUser: ["Arcanine"],
		desc: "If held by an Arcanine with Meteor Charge, it can use Eternal Flames.",
	},
	"voidheart": {
		id: "voidheart",
		name: "Void Heart",
		spritenum: 689,
		onTakeItem: false,
		zMove: "Embrace the Void",
		zMoveFrom: "Sharp Shadow",
		zMoveUser: ["Marshadow"],
		gen: 7,
		desc: "If held by a Marshadow with Sharp Shadow, it can use Embrace the Void.",
	},
};

exports.BattleItems = BattleItems;
