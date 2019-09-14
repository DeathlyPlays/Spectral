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

	"soulorb": {
		id: "soulorb",
		name: "Soul Orb",
		spritenum: 249,
		onModifyDamage(damage, source, target, move) {
			return this.chainModify(1.5);
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (source && source !== target && move && move.category !== 'Status') {
				this.damage(source.maxhp / 10, source, source, this.getItem('soulorb'));
			}
		},
		desc: "Holder's attacks do 1.5x damage, and it loses 1/10 its max HP after the attack.",
	},
};

exports.BattleItems = BattleItems;
