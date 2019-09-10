'use strict';

/**@type {{[k: string]: ModdedPureEffectData}} */
let BattleStatuses = {
	ragininfernape: {
		noCopy: true,
		onStart() {
			this.add(`c|☢RaginInfernape|I'm just here procrastinating so let's get this bread gamers.  The server being killed with crashes is just a nice meme anyways.`);
		},
		onSwitchOut() {
			this.add(`c|☢RaginInfernape|I guess I should finally get to work on those errors.`);
		},
		onFaint() {
			this.add(`c|☢RaginInfernape|Well, now I'm dead... That's the perfect excuse to not fix that yet.`);
		},
	},
};

exports.BattleStatuses = BattleStatuses;
