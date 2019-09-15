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

	"crownoftms": {
		id: "crownoftms",
		name: "Crown of TMS",
		desc: "On switch-in, the user raises its Attack or Special Attack depending on if the opponent's Defense or Special Defense is lower, and raises either Defense or Special Defense the Pokemon's highest Attack stat (Physical or Special).  At full HP, this Pokemon reduces the damage of the first hit by half.",
		shortDesc: "Raises Atk or SpA based on lower Def, Raises Def or SpD based on higher Atk, halves damage taken if at full HP.",
		onStart(pokemon) {
			let totaldef = 0;
			let totalspd = 0;
			let totalatk = 0;
			let totalspa = 0;
			for (const target of pokemon.side.foe.active) {
				if (!target || target.fainted) continue;
				totaldef += target.getStat('def', false, true);
				totalspd += target.getStat('spd', false, true);
				totalatk += target.getStat('atk', false, true);
				totalspa += target.getStat('spa', false, true);
			}
			if (totaldef && totaldef >= totalspd) {
				this.boost({spa: 1});
			} else if (totalspd) {
				this.boost({atk: 1});
			}
			if (totalatk && totalatk >= totalspa) {
				this.boost({def: 1});
			} else if (totalspd) {
				this.boost({spd: 1});
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (target.hp >= target.maxhp) {
				this.debug('Crown of TMS weaken');
				return this.chainModify(0.5);
			}
		},
	},
};

exports.BattleItems = BattleItems;
