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

	alfastorm: {
		noCopy: true,
		onStart() {
			this.add(`c|&AlfaStorm|Hello, prepare to face my wrath!`);
		},
		onSwitchOut() {
			this.add(`c|&AlfaStorm|You haven't defeated me yet!`);
		},
		onFaint() {
			this.add(`c|&AlfaStorm|You'll regret doing this to me!`);
		},
	},
};

exports.BattleStatuses = BattleStatuses;
