/************************
 * Pass The Bomb for PS	*
 * Created by Wisp Devs	*
 * Refactored by Insist	*
 ************************/

"use strict";

class PassTheBomb {
	constructor(room, seconds) {
		this.players = new Map();
		this.round = 0;
		this.room = room;
		if (this.room.bombCount) {
			this.room.bombCount++;
		} else {
			this.room.bombCount = 1;
		}
		this.timeLeft = Date.now() + seconds * 1000;
		this.room.add(`|uhtml|bomb${this.room.bombCount}${this.round}|<div class="infobox"><center>A game of <strong>Pass The Bomb</strong> has been started!<br />The game will begin in <strong>${seconds}</strong> seconds!<br /><button name="send" value="/passthebomb join">Join!</button></center></div>`);
		this.timer = setTimeout(() => {
			if (this.players.size < 3) {
				this.room.add(`|uhtmlchange|bomb${this.room.bombCount}${this.round}|<div class="infobox"><center>This game of Pass The Bomb has been ended due to the lack of players.</center></div>`).update();
				return this.end();
			}
			this.nextRound();
		}, seconds * 1000);
	}

	updateJoins() {
		let msg = `bomb${this.room.bombCount}${this.round}|<div class="infobox"><center>A game of <strong>Pass The Bomb</strong> has been started!<br />`;
		msg += `The game will begin in <strong>${Math.round((this.timeLeft - Date.now()) / 1000)}</strong> seconds<br />`;
		msg += `<button name="send" value="/passthebomb join">Join!</button></center>`;
		if (this.players.size > 0) {
			msg += `<center><strong>${this.players.size}</strong> ${(this.players.size === 1 ? `user has` : `Users.get( have`)} joined: ${Array.from(this.players).map(player => Server.nameColor(player[1].name).join(", "))}</center>`;
		}
		this.room.add(`|uhtmlchange|${msg}</div>`);
	}

	join(user, self) {
		if (this.round > 0) return self.sendReply(`You cannot join a game of Pass The Bomb after it has been started.`);
		if (!user.named) return self.errorReply(`You must choose a name before joining a game of Pass The Bomb.`);
		if (this.players.has(user.userid)) return self.sendReply(`You have already joined this game of Pass The Bomb.`);
		let players = Array.from(this.players).map(playerinfo => playerinfo[1]);
		let joined = players.filter(player => player.ip === user.latestIp);
		if (joined.length) return self.errorReply(`You have already joined this game of Pass The Bomb under the name "${joined[0].name}". Use that name/alt instead.`);
		this.players.set(user.userid, {"name": user.name, "ip": user.latestIp, "status": "alive", "warnings": 0});
		self.sendReply(`You have joined the game of Pass The Bomb.`);
		this.updateJoins();
	}

	leave(userid, self) {
		if (!this.players.has(userid)) return self.sendReply(`You haven't joined this game of Pass The Bomb yet.`);
		if (!this.round) {
			this.players.delete(userid);
			this.updateJoins();
			self.sendReply("You have left this game of Pass The Bomb.");
		} else {
			this.removeUser(userid, true);
		}
	}

	getSurvivors() {
		return Array.from(this.players).filter(player => player[1].status === "alive");
	}

	setBomb(userid) {
		if (!userid) {
			let players = this.getSurvivors();
			this.holder = players[Math.floor(Math.random() * players.length)][0];
		} else {
			this.holder = userid;
		}
	}

	getMsg() {
		let msg = `bomb${this.room.bombCount}${this.round}|<div class="infobox"><center><strong>Round: ${this.round}</strong><br />`;
		msg += `Players: ${this.getSurvivors().map(player => Server.nameColor(player[1].name).join(", "))}<br />`;
		msg += `<small>Use /pb or /passbomb [player] to Pass The Bomb to another player!</small>`;
		return msg;
	}

	nextRound() {
		clearTimeout(this.timer);
		this.canPass = false;
		if (this.checkWinner()) return this.getWinner();
		this.players.forEach((details, user) => {
			if (this.players.get(user).status === "alive") {
				this.players.get(user).warnings = 0;
			}
		});

		this.round++;
		this.madeMove = false;
		this.room.add(`|uhtml|${this.getMsg()}<br /><i>Wait for it...</i></div>`).update();
		this.release = setTimeout(() => {
			this.setBomb();
			let player = this.players.get(this.holder).name;
			this.room.add(`|uhtmlchange|${this.getMsg()}<br /><strong style="font-size: 10pt;">The bomb has been passed to </strong>${Server.nameColor(player, true)}</div>`).update();
			this.canPass = true;
			this.resetTimer();
		}, (Math.floor(Math.random() * 12) + 3) * 1000);
	}

	pass(user, target, self) {
		let getUser = this.players.get(user.userid);
		if (!getUser) return self.sendReply("You aren't a player in this game of Pass The Bomb.");
		if (!this.round) return self.sendReply("The game hasn't started yet!");
		if (getUser.status === "dead") return self.sendReply("You've already been killed!");
		if (!target || !target.trim()) return self.sendReply("You need to choose a player to Pass The Bomb to.");
		let targetId = toId(target);
		let targetUser = Users.getExact(targetId) ? Users.get(targetId).name : target;
		if (!this.players.has(targetId)) return self.sendReply(`${targetUser} is not a player!`);
		if (this.players.get(targetId).status === "dead") return self.sendReply(`${this.players.get(targetId).name} has already been killed!`);
		if (targetId === user.userid) return self.sendReply(`You're already in possession of the bomb! You can't pass it to yourself!`);
		if (!this.canPass || this.holder !== user.userid) {
			if (getUser.warnings < 2) {
				this.players.get(user.userid).warnings++;
				return self.sendReply("You're not in posession of the bomb yet!");
			}
			this.removeUser(user.userid);
			self.sendReply("You have been disqualified for spamming /passbomb.");
			self.privateModCommand(`(${user.name} was disqualified for spamming /passbomb.)`);
			return;
		}
		this.madeMove = true;
		this.setBomb(targetId);
		this.room.add(`|html|${Server.nameColor(user.name, true)} passed the bomb to ${Server.nameColor(targetId, true)}</strong>!`);
		if (this.checkWinner()) this.getWinner();
	}

	resetTimer() {
		this.timer = setTimeout(() => {
			let player = this.players.get(this.holder).name;
			this.room.add(`|html|The bomb exploded and killed ${Server.nameColor(player, true)}`).update();
			this.players.get(this.holder).status = "dead";
			this.canPass = false;
			setTimeout(() => {
				this.nextRound();
				this.room.update();
			}, 1200);
		}, (Math.floor(Math.random() * 26) + 5) * 1000);
	}

	dq(user, target, self) {
		if (!this.round) return self.sendReply("You can only disqualify a player after the first round has begun.");
		let targetId = toId(target);
		let getUser = this.players.get(targetId);
		if (!getUser) return self.sendReply(`${target} is not a player!`);
		if (getUser.status === "dead") return self.sendReply(`${getUser.name} has already been killed!`);
		self.privateModCommand(`(${getUser.name} was disqualified by ${user.name}.)`);
		this.removeUser(targetId);
	}

	removeUser(userid, left) {
		if (!this.players.has(userid)) return;
		this.room.add(`|html|${Server.nameColor(this.players.get(userid).name, true)} has ${(left ? `left` : `been disqualified from`)} the game.`);
		this.players.delete(userid);
		this.madeMove = true;
		if (this.checkWinner()) {
			this.getWinner();
		} else if (!this.canPass) {
			this.room.add(`|uhtmlchange|${this.getMsg()}<br /><i>Wait for it...</i></div>`).update();
		} else if (this.holder === userid) {
			this.setBomb();
			let player = this.players.get(this.holder).name;
			this.room.add(`|html|The bomb has been passed to ${Server.nameColor(player, true)}!`).update();
		}
	}

	checkWinner() {
		if (this.getSurvivors().length === 1) return true;
	}

	getWinner() {
		let winner = this.getSurvivors()[0][1].name;
		let msg = `|html|<div class="infobox"><center>The winner of this game of Pass The Bomb is ${Server.nameColor(winner, true)}! Congratulations!</center>`;
		if (this.room.isOfficial) {
			Server.ExpControl.addExp(winner, this.room, 5);
			msg += `${Server.nameColor(winner, true)} has also won 5 EXP for winning this game of Pass The Bomb.`;
		}
		this.room.add(msg).update();
		this.end();
	}

	end(user) {
		if (user) {
			let msg = `<div class="infobox"><center>This game of Pass The Bomb has been forcibly ended by ${Server.nameColor(user.name, true)}.</center></div>`;
			if (!this.madeMove) {
				this.room.add(`|uhtmlchange|bomb${this.room.bombCount}${this.round}|${msg}`).update();
			} else {
				this.room.add(`|html|${msg}`).update();
			}
		}
		if (this.release) clearTimeout(this.release);
		clearTimeout(this.timer);
		delete this.room.passthebomb;
	}
}

exports.commands = {
	ptb: "passthebomb",
	passthebomb: {
		new: "create",
		make: "create",
		create: function (target, room) {
			if (room.passthebomb) return this.errorReply("There is already a game of Pass The Bomb going on in this room.");
			if (room.passTheBombDisabled) return this.errorReply(`Pass the Bomb is currently disabled in ${room.title}.`);
			if (!this.canTalk()) return this.errorReply("You cannot use this while unable to speak.");
			if (!this.can("minigame", null, room)) return false;
			if (!target || !target.trim()) target = "60";
			if (isNaN(target)) return this.errorReply(`"${target}" is not a valid number.`);
			if (target.includes(".") || target > 180 || target < 10) return this.errorReply(`The number of seconds needs to be a non-decimal number between 10 and 180.`);
			room.passthebomb = new PassTheBomb(room, Number(target));
		},

		j: "join",
		join: function (target, room, user) {
			if (!room.passthebomb) return this.errorReply("There is no game of Pass The Bomb going on in this room.");
			if (!this.canTalk()) return this.errorReply("You cannot use this while unable to speak.");
			room.passthebomb.join(user, this);
		},

		part: "leave",
		l: "leave",
		leave: function (target, room, user) {
			if (!room.passthebomb) return this.errorReply("There is no game of Pass The Bomb going on in this room.");
			room.passthebomb.leave(user.userid, this);
		},

		start: "proceed",
		begin: "start",
		proceed: function (target, room, user) {
			if (!room.passthebomb) return this.errorReply("There is no game of Pass The Bomb going on in this room.");
			if (!this.canTalk()) return this.errorReply("You cannot use this while unable to speak.");
			if (!this.can("minigame", null, room)) return false;
			if (room.passthebomb.round) return this.errorReply(`This game of Pass The Bomb has already begun!`);
			if (room.passthebomb.players.size < 3) return this.errorReply(`There aren't enough players yet. Wait for more to join!`);
			room.addRaw(`(${Server.nameColor(user.name, true, true)} forcibly started the game of Pass The Bomb.)`);
			room.passthebomb.nextRound();
		},

		eliminate: "dq",
		elim: "dq",
		disqualify: "dq",
		dq: function (target, room, user) {
			if (!room.passthebomb) return this.errorReply("There is no game of Pass The Bomb going on in this room.");
			if (!this.canTalk()) return this.errorReply("You cannot use this while unable to speak.");
			if (!this.can("minigame", null, room)) return false;
			room.passthebomb.dq(user, target, this);
		},

		passbomb: "pass",
		pass: function (target, room, user) {
			if (!room.passthebomb) return this.errorReply("There is no game of Pass The Bomb going on in this room.");
			if (!this.canTalk()) return this.errorReply("You cannot use this while unable to speak.");
			room.passthebomb.pass(user, target, this);
		},

		cancel: "end",
		end: function (target, room, user) {
			if (!room.passthebomb) return this.errorReply("There is no game of Pass The Bomb going on in this room.");
			if (!this.can("minigame", null, room)) return false;
			room.passthebomb.end(user);
		},

		off: "disable",
		disable: function (target, room, user) {
			if (!this.can("gamemanagement", null, room)) return;
			if (room.passTheBombDisabled) {
				return this.errorReply("Pass the Bomb is already disabled in this room.");
			}
			room.passTheBombDisabled = true;
			if (room.chatRoomData) {
				room.chatRoomData.passTheBombDisabled = true;
				Rooms.global.writeChatRoomData();
			}
			return this.sendReply("Pass the Bomb has been disabled for this room.");
		},

		on: "enable",
		enable: function (target, room, user) {
			if (!this.can("gamemanagement", null, room)) return;
			if (!room.passTheBombDisabled) {
				return this.errorReply("Pass the Bomb is already enabled in this room.");
			}
			delete room.passTheBombDisabled;
			if (room.chatRoomData) {
				delete room.chatRoomData.passTheBombDisabled;
				Rooms.global.writeChatRoomData();
			}
			return this.sendReply("Pass the Bomb has been enabled for this room.");
		},

		// Short-Cut Commands
		"": "help",
		help: function () {
			this.parse(`/help passthebomb`);
		},
	},

	pb: "passbomb",
	passbomb: function (target) {
		if (!target) return this.errorReply(`You must specify a target.`);
		this.parse(`/passthebomb pass ${target}`);
	},

	passthebombhelp: [
		`/ptb new [seconds] - Creates a new game of Pass The Bomb that will automatically start after [seconds] seconds; defaults to 60. Requires %, @, &, #, ~
		/ptb join - Joins the game of Pass The Bomb.
		/ptb leave - Leaves the game of Pass The Bomb.
		/ptb pass [user] - Passes the bombs to [user].
		/ptb dq [user] - Forcefully disqualifies [user] in the game of Pass The Bomb. Requires %, @, &, #, ~
		/ptb start - Forcefully begins the game of Pass The Bomb. Requires %, @, &, #, ~
		/ptb end - Forcefully ends the game of Pass The Bomb. Requires %, @, &, #, ~
		/ptb enable - Enables games of Pass the Bomb
		/ptb help - Displays a list of the Pass The Bomb commands.`,
	],
};
