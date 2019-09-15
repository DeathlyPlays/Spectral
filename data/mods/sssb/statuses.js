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

	horrific17: {
		noCopy: true,
		onStart() {
			this.add(`c|@Horrific17|Tell me... Are you afraid to die?`);
		},
		onSwitchOut() {
			this.add(`c|@Horrific17|Forgive me, but I must retreat.`);
		},
		onFaint() {
			this.add(`c|@Horrific17|Eaa...`);
			this.add(`c|~Satori Komeiji|Lord Horrific!`);
			this.add(`c|@Horrific17|I let my guard down... I'm sorry...`);
			this.add(`c|~Satori Komeiji|Oh, no! Lord Horrific! Lord Horrific!`);
			this.add(`c|@Horrific17|Calm yourself, Satori...`);
			this.add(`c|~Satori Komeiji|But... But...`);
			this.add(`c|@Horrific17|This is no time for tears, is it? Unless... Do you plan on the two of us dying here together?`);
			this.add(`c|~Satori Komeiji|Never! That I would never allow! You must not die, milord...`);
			this.add(`c|@Horrific17|And neither should you, my wife. Lend me your shoulder, would you?`);
			this.add(`c|~Satori Komeiji|Yes, of course.`);
		},
	},

	tsardragon: {
		noCopy: true,
		onStart() {
			this.add(`|raw||html|<div class="broadcast-red"><strong>Well, if I have to be added I might as well make the server crash and burn.</strong></div>`);
		},
		onSwitchOut() {
			this.add(`c|~RaginInfernape|So you are using Unown Obama`);
			this.add(`c|+Tsar dragon|what`);
			this.add(`c|~RaginInfernape|No info = Unown`);
			this.add(`c|+Tsar dragon|im not taking part whatsoever`);
			this.add(`c|+Tsar dragon|no mon`);
			this.add(`c|~RaginInfernape|So thats Unown man`);
			this.add(`c|+Tsar dragon|its`);
			this.add(`c|+Tsar dragon|nothing`);
		},
		onFaint() {
			this.add(`c|+Tsar dragon|Oh well, I told Insist I didn't want to be added anyways.`);
		},
	},
};

exports.BattleStatuses = BattleStatuses;
