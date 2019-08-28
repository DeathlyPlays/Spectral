/*Dice Game plugin by SilverTactic (Silveee)*/

"use strict";

const INACTIVE_END_TIME = 1 * 60 * 1000; // 1 minute
const TAX = 0;
const FS = require("../lib/fs.js");

function diceImg(num) {
	switch (num) {
	case 0:
		return "http://i.imgur.com/nUbpLTD.png";
	case 1:
		return "http://i.imgur.com/BSt9nfV.png";
	case 2:
		return "http://i.imgur.com/eTQMVhY.png";
	case 3:
		return "http://i.imgur.com/3Y2hCAJ.png";
	case 4:
		return "http://i.imgur.com/KP3Za7O.png";
	case 5:
		return "http://i.imgur.com/lvi2ZZe.png";
	}
}

class Dice {
	constructor(room, amount, starter) {
		this.room = room;
		if (!this.room.diceCount) this.room.diceCount = 0;
		this.bet = amount;
		this.players = [];
		this.timer = setTimeout(() => {
			this.room.add(`|uhtmlchange|${this.room.diceCount}|<div class="infobox">(This game of dice has been ended due to inactivity.)</div>`).update();
			delete this.room.dice;
		}, INACTIVE_END_TIME);

		let buck = (this.bet === 1 ? moneyName : moneyPlural);
		this.startMessage = `<div class="infobox"><strong style="font-size: 14pt; color: #24678d"><center>${Server.nameColor(starter, true)} has started a game of dice for <span style = "color: green">${amount.toLocaleString()}</span> ${buck}!</center></strong><br /><center><img style="margin-right: 30px;" src = "http://i.imgur.com/eywnpqX.png" width="80" height="80"><img style="transform:rotateY(180deg); margin-left: 30px;" src="http://i.imgur.com/eywnpqX.png" width="80" height="80"><br /><button name="send" value="/joindice">Click to join!</button></center>`;
		this.room.add(`|uhtml|${(++this.room.diceCount)}|${this.startMessage}</div>`).update();
	}

	join(user, self) {
		if (this.players.length >= 2) return self.errorReply("Two users have already joined this game of dice.");
		Economy.readMoney(user.userid, money => {
			if (money < this.bet) return self.sendReply("You don't have enough money for this game of dice.");
			if (this.players.includes(user)) return self.sendReply("You have already joined this game of dice.");
			if (this.players.length && this.players[0].latestIp === user.latestIp) return self.errorReply(`You have already joined this game of dice under the alt "${this.players[0].name}".`);
			if (this.players.length >= 2) return self.errorReply("Two users have already joined this game of dice.");

			this.players.push(user);
			this.room.add(`|uhtmlchange|${this.room.diceCount}|${this.startMessage}<center>${Server.nameColor(user.name, true)} has joined the game!</center></div>`).update();
			if (this.players.length === 2) this.play();
		});
	}

	leave(user, self) {
		if (!this.players.includes(user)) return self.sendReply(`You haven't joined this game of dice yet.`);
		if (this.players.length >= 2) return self.errorReply("You cannot leave a game of dice once it has been started.");
		this.players.splice(this.players.indexOf(user), 1);
		this.room.add(`|uhtmlchange|${this.room.diceCount}|${this.startMessage}</div>`);
	}

	play() {
		let p1 = this.players[0],
			p2 = this.players[1];
		Economy.readMoney(p1.userid, money1 => {
			Economy.readMoney(p2.userid, money2 => {
				if (money1 < this.bet || money2 < this.bet) {
					let user = (money1 < this.bet ? p1 : p2);
					let other = (user === p1 ? p2 : p1);
					user.sendTo(this.room, "You have been removed from this game of dice, as you do not have enough money.");
					other.sendTo(this.room, `${user.name} has been removed from this game of dice, as they do not have enough money. Wait for another user to join.`);
					this.players.splice(this.players.indexOf(user), 1);
					this.room.add(`|uhtmlchange|${this.room.diceCount}|${this.startMessage}<center>${this.players.map(user => Server.nameColor(user.name, true))} has joined the game!</center>`).update();
					return;
				}
				let players = this.players.map(user => Server.nameColor(user.name, true)).join(" and ");
				this.room.add(`|uhtmlchange|${this.room.diceCount}|${this.startMessage}<center>${players} have joined the game!</center></div>`).update();
				let roll1, roll2;
				do {
					roll1 = Math.floor(Math.random() * 6);
					roll2 = Math.floor(Math.random() * 6);
				} while (roll1 === roll2);
				if (roll2 > roll1) this.players.reverse();
				let winner = this.players[0],
					loser = this.players[1];

				let taxedAmt = Math.round(this.bet * TAX);
				setTimeout(() => {
					let buck = (this.bet === 1 ? moneyName : moneyPlural);
					let msg = `<div class="infobox"><center>${players} have joined the game!<br /><br />`;
					msg += `The game has been started! Rolling the dice...<br />`;
					msg += `<img src = "${diceImg(roll1)}" align = "left" title = "${Server.nameColor(p1.name, true)}'s roll">`;
					msg += `<img src = "${diceImg(roll2)}" align = "right" title = "${Server.nameColor(p2.name, true)}'s roll"><br />`;
					msg += `${Server.nameColor(p1.name, true)} rolled ${(roll1 + 1)}!<br />`;
					msg += `${Server.nameColor(p2.name, true)} rolled ${(roll2 + 1)}!<br />`;
					msg += `${Server.nameColor(winner.name, true)} has won <strong style="color: green">${(this.bet - taxedAmt).toLocaleString()}</strong> ${buck}!<br />`;
					msg += `Better luck next time, ${Server.nameColor(loser.name, true)}!`;
					this.room.add(`|uhtmlchange|${this.room.diceCount}|${msg}`).update();
					Economy.writeMoney(winner.userid, (this.bet - taxedAmt), () => {
						Economy.writeMoney(loser.userid, -this.bet, () => {
							Economy.readMoney(winner.userid, winnerMoney => {
								Economy.readMoney(loser.userid, loserMoney => {
									Economy.logDice(`${winner.userid} has won a dice against ${loser.userid}. They now have ${winnerMoney.toLocaleString()} ${(winnerMoney === 1 ? moneyName : moneyPlural)}.`);
									Economy.logDice(`${loser.userid} has lost a dice against ${winner.userid}. They now have ${loserMoney.toLocaleString()} ${(loserMoney === 1 ? moneyName : moneyPlural)}.`);
									this.end();
								});
							});
						});
					});
				}, 800);
			});
		});
	}

	end(user) {
		if (user) this.room.add(`|uhtmlchange|${this.room.diceCount}|<div class="infobox">(This game of dice has been forcibly ended by ${Server.nameColor(user.name, true, true)}.)</div>`).update();
		clearTimeout(this.timer);
		delete this.room.dice;
	}
}

exports.commands = {
	startdice: "dicegame",
	dicegame: function (target, room, user) {
		if (room.id === "lobby") return this.errorReply("This command cannot be used in the Lobby.");
		if (!user.can("broadcast", null, room) && room.id !== "casino") return this.errorReply("You must be ranked + or higher in this room to start a game of dice outside the Casino.");
		if (!this.canTalk()) return;
		if (room.dice) return this.errorReply("There is already a game of dice going on in this room.");
		if (room.diceDisabled) return this.errorReply(`Dice is currently disabled in ${room.title}.`);

		let amount = Number(target) || 1;
		if (isNaN(target)) return this.errorReply(`"${target}" isn't a valid number.`);
		if (target.includes(".") || amount < 1 || amount > 5000) return this.errorReply(`The number of ${moneyPlural} must be between 1 and 5,000 and cannot contain a decimal.`);
		Economy.readMoney(user.userid, money => {
			if (money < amount) return this.errorReply(`You don't have ${amount.toLocaleString()} ${money === 1 ? moneyName : moneyPlural}.`);
			room.dice = new Dice(room, amount, user.name);
			this.parse("/joindice");
		});
	},

	dicejoin: "joindice",
	joindice: function (target, room, user) {
		if (room.id === "lobby") return this.errorReply("This command cannot be used in the Lobby.");
		if (!this.canTalk()) return;
		if (!room.dice) return this.errorReply("There is no game of dice going on in this room.");

		room.dice.join(user, this);
	},

	diceleave: "leavedice",
	leavedice: function (target, room, user) {
		if (room.id === "lobby") return this.errorReply("This command cannot be used in the Lobby.");
		if (!room.dice) return this.errorReply("There is no game of dice going on in this room.");

		room.dice.leave(user, this);
	},

	diceend: "enddice",
	enddice: function (target, room, user) {
		if (room.id === "lobby") return this.errorReply("This command cannot be used in the Lobby.");
		if (!this.canTalk()) return;
		if (!room.dice) return this.errorReply("There is no game of dice going on in this room.");
		if (!user.can("broadcast", null, room) && !room.dice.players.includes(user)) return this.errorReply("You must be ranked + or higher in this room to end a game of dice.");

		room.dice.end(user);
	},

	viewdice: "dicelog",
	dicelog: function (target, room, user) {
		if (!this.can("money")) return false;
		if (!target) return this.sendReply("Usage: /dicelog [number] to view the last x lines OR /dicelog [text] to search for text.");
		let word = false;
		if (isNaN(Number(target))) word = true;
		let lines = FS("logs/dice.log").readIfExistsSync().split("\n").reverse();
		let output = "";
		let count = 0;
		let regex = new RegExp(target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "gi"); // eslint-disable-line no-useless-escape

		if (word) {
			output += `Displaying last 50 lines containing "${target}":\n`;
			for (let line in lines) {
				if (count >= 50) break;
				if (!~lines[line].search(regex)) continue;
				output += `${lines[line]}\n`;
				count++;
			}
		} else {
			if (target > 100) target = 100;
			output = lines.slice(0, (lines.length > target ? target : lines.length));
			output.unshift(`Displaying the last ${lines.length > target ? target : lines.length} lines:`);
			output = output.join(`\n`);
		}
		user.popup(`|wide|${output}`);
	},

	disabledice: "dicedisable",
	diceoff: "dicedisable",
	dicedisable: function (target, room, user) {
		if (!this.can("gamemanagement", null, room)) return;
		if (room.id === "casino") return this.errorReply(`Casino cannot disable Dice.`);
		if (room.diceDisabled) {
			return this.errorReply("Dice is already disabled in this room.");
		}
		room.diceDisabled = true;
		if (room.chatRoomData) {
			room.chatRoomData.diceDisabled = true;
			Rooms.global.writeChatRoomData();
		}
		return this.sendReply("Dice has been disabled for this room.");
	},

	enabledice: "diceenable",
	diceon: "diceenable",
	diceenable: function (target, room, user) {
		if (!this.can("gamemanagement", null, room)) return;
		if (!room.diceDisabled) {
			return this.errorReply("Dice is already enabled in this room.");
		}
		delete room.diceDisabled;
		if (room.chatRoomData) {
			delete room.chatRoomData.diceDisabled;
			Rooms.global.writeChatRoomData();
		}
		return this.sendReply("Dice has been enabled for this room.");
	},

	dicegamehelp: [
		`/startdice or /dicegame [amount] - Starts a game of dice in the room for a given number of ${global.moneyPlural}, 1 ${global.moneyName} by default.
		/joindice - Joins the game of dice. You cannot use this command if you don't have the number of ${global.moneyPlural} the game is for.
		/leavedice - Leaves the game of dice.
		/enddice - Ends the game of dice. Requires + or higher to use.
		/dicelog - Views Dice-related logs. Requires @, &, ~
		/disabledice - Disables Dice Games in the room, if enabled. Requires &, #, ~
		/enabledice - Enables Dice Games in the room, if disabled. Requires &, #, ~`,
	],
};
