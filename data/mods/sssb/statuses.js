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
		onSourceFaint() {
			this.add(`c|☢RaginInfernape|Well, if I kill everyone then no one has to know I procrastinated.`);
		},
	},

	volco: {
		noCopy: true,
		onStart() {
			this.add([`c|⚔Volco|Did RaginInfernape break something again? GEEZ!`, `c|⚔Arr⟦ay⟧s|Well, everything __seems__ to be working... for now.`][this.random(2)]);
		},
		onSwitchOut() {
			if (this.random(2) === 1) {
				this.add(`<div class="broadcast-red"><b>The server needs to restart because of a crash.</b><br />No new battles can be started until the server is done restarting.</div>`);
				this.add(`c|⚔Volco|Dammit, something broke badly... I'll return once i fix it.`);
			} else {
				this.add(`c|⚔Arr⟦ay⟧s|I don't feel like fixing stuff, RaginInfernape stop breaking the server.`);
			}
		},
		onFaint() {
			this.add([`c|⚔Volco|Well, if the server breaks... not my problem.`, `c|⚔Arr⟦ay⟧s|Oh, cool now I can be lazy again`][this.random(2)]);
		},
		onSourceFaint() {
			this.add([`c|⚔Volco|Sometimes you just have to kill everyone to fix everything.`, `c|⚔Arr⟦ay⟧s|something... something... too lazy to think of a good message... something... something...`][this.random(2)]);
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
			this.add(`c|~Satori Komeiji|Horrific!`);
			this.add(`c|@Horrific17|I let my guard down... I'm sorry...`);
			this.add(`c|~Satori Komeiji|Oh, no! Horrific! Horrific!`);
			this.add(`c|@Horrific17|Calm yourself, Satori...`);
			this.add(`c|~Satori Komeiji|But... But...`);
			this.add(`c|@Horrific17|This is no time for tears, is it? Unless... Do you plan on the two of us dying here together?`);
			this.add(`c|~Satori Komeiji|Never! That I would never allow! You must not die...`);
			this.add(`c|@Horrific17|And neither should you, my wife. Lend me your shoulder, would you?`);
			this.add(`c|~Satori Komeiji|Yes, of course.`);
		},
		onSourceFaint() {
			this.add(`c|@Horrific17|You? Defeat Me? Laughable.`);
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

	tacticianloki: {
		noCopy: true,
		onStart() {
			this.add(`c|~Tactician Loki|Did you...need something?~`);
		},
		onSwitchOut() {
			this.add(`c|~Tactician Loki|It's your turn dear~`);
		},
		onFaint() {
			this.add(`c|~Tactician Loki|No...more...`);
		},
		onSourceFaint() {
			this.add(`c|~Tactician Loki|Darn, someone else who couldn't handle me, what a pity~`);
		},
	},

	backatmyday: {
		noCopy: true,
		onStart() {
			this.add(`c|%Back At My Day|Let's hope I'm balanced.`);
		},
		onSwitchOut() {
			this.add(`c|%Back At My Day|I don't wanna fight your overpowered staffmon.`);
		},
		onFaint() {
			this.add(`c|%Back At My Day|Remind RaginInfernape to buff me.`);
		},
		onSourceFaint() {
			this.add(`c|%Back At My Day|Guess I gotta nerf myself now.`);
		},
	},

	revivalclair: {
		noCopy: true,
		onStart() {
			this.add(`c|+Revival Clair|Good game, too easy.`);
		},
		onSwitchOut() {
			this.add(`c|+Revival Clair|Good game, too easy.`);
		},
		onFaint() {
			this.add(`c|+Revival Clair|Good game, too easy.`);
		},
		onSourceFaint() {
			this.add(`c|+Revival Clair|Good game, too easy.`);
		},
	},

	revivalxfloatz: {
		noCopy: true,
		onStart() {
			this.add(`c|+Revival xFloatz|I didn't come up with my quotes so my Dad did.`);
		},
		onSwitchOut() {
			this.add(`c|+Revival xFloatz|I didn't come up with my quotes so my Dad did.`);
		},
		onFaint() {
			this.add(`c|+Revival xFloatz|I didn't come up with my quotes so my Dad did.`);
		},
		onSourceFaint() {
			this.add(`c|+Revival xFlaotz|I didn't come up with my quotes so my Dad did.`);
		},
	},
	
	renfur: {
		noCopy: true,
		onStart() {
			this.add(`c|%Renfur⚡⚡|Look behind u it's Me Ren!`);
		},
		onSwitchOut() {
			this.add(`c|%Renfur⚡⚡|That waz a good play by my trainer I can't even lie to ya :U`);
		},
		onFaint() {
			this.add(`c|%Renfur⚡⚡|My death is your fault, No not the opponent i'm talkin bout YOU`);
		},
		onSourceFaint() {
			this.add(`c|%Renfur⚡⚡|That waz a good play by my trainer I can't even lie to ya :U`);
		},
	},
	
	shademaura: {
		noCopy: true,
		onStart() {
			this.add(`c|+shademaura ⌐⚡_|Get ready for a sub-optimal performance`);
		},
		onSwitchOut() {
			this.add(`c|+shademaura ⌐⌐⚡_|Thats good for now`);
		},
		onFaint() {
			this.add(`c|+shademaura ⌐⚡_|fuck`);
		},
		onSourceFaint() {
			this.add(`c|+shademaura ⌐⚡_|PogChamp`);
		},
	},

	chandie: {
		noCopy: true,
		onModifyMove(move) {
			if (move.id === "spectralthief") {
				move.onHit = function (target) {
					target.clearBoosts();
					this.add('-clearboost', target);
				};
				move.stealsBoosts = false;
			}
		},
	},

	// Modified Pre-existing Statuses
	raindance: {
		inherit: true,
		durationCallback(source, effect) {
			if (source && (source.hasItem('damprock') || source.hasItem('environmentalorb'))) {
				return 8;
			}
			return 5;
		},
	},
	sunnyday: {
		inherit: true,
		durationCallback(source, effect) {
			if (source && (source.hasItem('heatrock') || source.hasItem('environmentalorb'))) {
				return 8;
			}
			return 5;
		},
	},
	hail: {
		inherit: true,
		durationCallback(source, effect) {
			if (source && (source.hasItem('icyrock') || source.hasItem('environmentalorb'))) {
				return 8;
			}
			return 5;
		},
	},
};

exports.BattleStatuses = BattleStatuses;
