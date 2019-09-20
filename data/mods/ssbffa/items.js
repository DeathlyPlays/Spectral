'use strict';

/**@type {{[k: string]: ItemData}} */
let BattleItems = {
	"riotshield": {
		id: "riotshield",
		name: "Riot Shield",
		spritenum: 581,
		fling: {
			basePower: 80,
		},
		onModifySpDPriority: 1,
		onModifySpD(spd) {
			return this.chainModify(1.5);
		},
		num: -1,
		desc: "Holder's Special Defense is 1.5x.",
	},
};

exports.BattleItems = BattleItems;
