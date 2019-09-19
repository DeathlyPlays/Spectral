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
			if (source && source !== target && move && move.category !== 'Status' && source.hp !== 1) {
				this.damage(source.maxhp / 10, source, source, this.getItem('soulorb'));
			}
		},
		desc: "Holder's attacks do 1.5x damage, and it loses 1/10 its max HP after the attack. At 1 HP, the user takes no recoil.",
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

	// Tactician Loki
	"thokk": {
		id: "thokk",
		name: "Thokk",
		desc: "If held by Tactician Loki gives 50% chance to heal by 1/4th HP, 30% chance to increase a random stat by 1, 10% chance to decrease a random stat by 1, 10% chance to cast Focus Energy. If knocked off heals the holder by 50%, if tricked and is held by another pokemon damages pokemon by 1/8th every turn.",
		shortDesc: "A variety of effects begin to occur every turn.",
		onResidualOrder: 26,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (pokemon.baseTemplate.num === 510) {
				if (this.randomChance(1, 2)) {
					this.heal(pokemon.maxhp / 4);
				}
				if (this.randomChance(3, 10)) {
					let stats = [];
					/**@type {{[k: string]: number}} */
					let boost = {};
					for (let stat in pokemon.boosts) {
						// @ts-ignore
						if (pokemon.boosts[stat] < 6) {
							stats.push(stat);
						}
					}
					let randomStat = stats.length ? this.sample(stats) : "";
					if (stats.length) {
						boost[randomStat] = 2;
						this.boost(boost);
					}
					stats = [];
					for (let statMinus in pokemon.boosts) {
						// @ts-ignore
						if (pokemon.boosts[statMinus] > -6 && statMinus !== randomStat) {
							stats.push(statMinus);
						}
					}
					randomStat = stats.length ? this.sample(stats) : "";
					// @ts-ignore
					if (randomStat) boost[randomStat] = -1;

					this.boost(boost);
				}
				if (this.randomChance(1, 10)) {
					pokemon.addVolatile('focusenergy');
				}
			} else {
				this.damage(pokemon.maxhp / 8);
			}
		},
		onTakeItem(item, pokemon, source) {
			if ((source && source.baseTemplate.num === 510) || pokemon.baseTemplate.num === 510) {
				this.heal(pokemon.maxhp / 2);
			}
		},
	},

	// La Rascasse
	"heartofdarkness": {
		id: "heartofdarkness",
		name: "Heart of Darkness",
		desc: "If this Pokemon is KOed with a move, that move's user loses 3/4 its max HP.",
		shortDesc: "The foe loses 3/4 their max HP after KOing the user.",
		onAfterDamageOrder: 1,
		onAfterDamage(damage, target, source, move) {
			if (source && source !== target && move && move.flags['contact'] && !target.hp) {
				this.damage(source.maxhp * 3 / 4, source, target);
      }
    },
  },

	// Volco
	barragevest: {
		id: "barragevest",
		name: "Barrage Vest",
		desc: "Boosts the defense of the holder by 1.5x. Holder cannot use status moces.",
		shortDesc: "Defense boost of 1.5x. Disables Status moves.",
		onModifyDefPriority: 1,
		onModifyDef(def) {
			return this.chainModify(1.5);
		},
		onDisableMove(pokemon) {
			for (const moveSlot of pokemon.moveSlots) {
				if (this.getMove(moveSlot.move).category === 'Status') {
					pokemon.disableMove(moveSlot.id);
				}
			}
		},
	},
};

exports.BattleItems = BattleItems;
