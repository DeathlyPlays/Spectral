/****************************************
 * Lottery Plug-in for Pokémon Showdown
 *            Created by:
 *         HoeenHero and Insist
 ****************************************/

"use strict";

let costToJoin = 3;

class Lottery {
	constructor(room) {
		this.players = [];
		this.room = room;
		room.lottoNumber = room.lottoNumber ? room.lottoNumber++ : 1;
		this.lottoNumber = room.lottoNumber;
		this.costToJoin = costToJoin;
		this.room.add(`|uhtml|lottery-${this.lottoNumber}|<div class="broadcast-blue"><p style="font-size: 14pt; text-align: center">A new <strong>Lottery drawing</strong> is starting!</p><p style="font-size: 9pt; text-align: center"><button name="send" value="/lotto join">Join</button><br /><strong>Joining costs ${this.costToJoin} ${moneyPlural}.</strong></p></div>`);
		this.timer = setTimeout(() => {
			if (this.players.length < 2) {
				this.room.add(`|uhtmlchange|lottery-${this.lottoNumber}|<div class="broadcast-red"><p style="text-align: center; font-size: 14pt>This Lottery drawing has ended due to lack of users.</p></div>`);
				return this.end();
			}
			this.drawWinner();
		}, 1000 * 60 * 60 * 24);
	}

	onConnect(user, connection) {
		user.sendTo(this.room, `|uhtml|lottery-${this.lottoNumber}|<div class="broadcast-blue"><p style="font-size: 14pt; text-align: center">A new <strong>Lottery drawing</strong> is starting!</p><p style="font-size: 9pt; text-align: center"><button name="send" value="/lotto join">Join</button><br /><strong>Joining costs ${this.costToJoin} ${moneyPlural}.</strong></p></div>`);
	}

	drawWinner() {
		let winner = this.players[Math.floor(Math.random() * this.players.length)];
		let lottoPrize = 5 + this.players.length + this.costToJoin;
		this.room.add(`|html|<div class="infobox"><center><strong>Congratulations</strong> ${Server.nameColor(winner, true, true)}!!! You have won the reward of ${lottoPrize} ${moneyPlural}!</center></div>`);
		Economy.writeMoney(winner, lottoPrize);
		Economy.logTransaction(`${winner} has won the Lottery prize of ${lottoPrize} ${moneyPlural}.`);
		this.end();
	}

	joinLottery(user) {
		if (this.players.includes(user.userid)) return user.sendTo(this.room, "You have already joined the lottery.");
		Economy.readMoney(user.userid, money => {
			if (money < this.costToJoin) {
				user.sendTo(this.room, `You do not have enough ${moneyPlural} to join.`);
				return;
			}
			Economy.writeMoney(user.userid, -this.costToJoin, () => {
				Economy.readMoney(user.userid, money => {
					Economy.logTransaction(`${user.name} entered a Lottery drawing for ${this.costToJoin} ${moneyPlural}.`);
				});
			});
			this.players.push(user.userid);
			user.sendTo(this.room, "You have joined the lottery.");
		});
	}

	leaveLottery(user) {
		if (!this.players.includes(user.userid)) return user.sendTo(this.room, `You are not currently in the Lottery drawing in this room..`);
		Economy.writeMoney(user.userid, this.costToJoin, () => {
			this.players.splice(this.players.indexOf(user.userid), 1);
			user.sendTo(this.room, `You have left the lottery and have been refunded ${this.costToJoin} ${moneyPlural}.`);
			Economy.logTransaction(`${user.name} has left the Lottery drawing, and has been refunded their ${this.costToJoin} ${moneyPlural}.`);
		});
	}

	end(user) {
		if (user) {
			this.room.add(`|uhtmlchange|lottery-${this.lottoNumber}|<div class="infobox">This Lottery Drawing has been ended by ${Server.nameColor(user.name, true)}. All players have had their ${this.costToJoin} ${moneyPlural} join fee refunded.</div>`).update();
			Economy.writeMoneyArr(this.players, this.costToJoin);
			Economy.logTransaction(`${Chat.toListString(this.players)} have all been refunded their ${this.costToJoin} ${moneyPlural} join fee due to an early ended Lottery drawing.`);
		}
		clearTimeout(this.timer);
		delete this.room.lottery;
	}
}

exports.commands = {
	lotto: "lottery",
	lottery: {
		create: "new",
		make: "new",
		new(target, room, user) {
			if (room.lottery) return this.errorReply("A join-able Lottery drawing is already active.");
			if (!this.can("mute", null, room)) return false;
			if (!room.isOfficial) return this.errorReply("Lottery drawings can only be created in Official Chatrooms.");
			this.modlog(`LOTTERY`, null, `created`);
			this.privateModAction(`(A new Lottery drawing has been created.)`);
			room.lottery = new Lottery(room);
		},

		j: "join",
		join(target, room, user) {
			if (!room.lottery) return this.errorReply("There is no join-able Lottery drawing going on right now.");
			if (!this.canTalk()) return this.errorReply("You must be able to talk to join a Lottery drawing.");
			if (!user.registered) return this.errorReply("To join the Lottery, you must be on a registered account.");
			room.lottery.joinLottery(user);
		},

		part: "leave",
		l: "leave",
		leave(target, room, user) {
			if (!room.lottery) return this.errorReply("There is no active Lottery drawing in this room.");
			room.lottery.leaveLottery(user);
		},

		checkplayers: "players",
		list: "players",
		viewplayers: "players",
		players(target, room, user) {
			if (!this.runBroadcast()) return;
			if (!room.lottery) return this.errorReply("There is no active Lottery drawing in this room.");
			if (room.lottery.players.length < 1) return this.errorReply(`There are currently no players in this Lottery drawing.`);
			return this.sendReplyBox(`<strong>Current Player Count:</strong> ${room.lottery.players.length} user${(room.lottery.players.length === 1 ? `` : `s`)} in the Lottery drawing.<br /><strong>Players:</strong> ${Chat.toListString(room.lottery.players)}.`);
		},

		forcestart: "start",
		begin: "start",
		start(target, room, user) {
			if (!this.can("mute", null, room)) return;
			if (!room.lottery) return this.errorReply("There is not any Lottery drawing available to be started.");
			if (room.lottery.players.length < 2) return this.errorReply("You can't start a Lottery drawing without at least two users joining.");
			this.modlog(`LOTTERY`, null, `started early`);
			this.privateModAction(`(The Lottery drawing has been started early.)`);
			room.lottery.drawWinner();
		},

		cancel: "end",
		end(target, room, user) {
			if (!this.can("mute", null, room)) return;
			if (!room.lottery) return this.errorReply("There is no Lottery drawing going on right now.");
			this.modlog(`LOTTERY`, null, `forcefully ended`);
			this.privateModAction(`(The Lottery drawing was forcefully ended.)`);
			room.lottery.end(user);
		},

		viewpot: "pot",
		showpot: "pot",
		pot(target, room, user) {
			if (!this.runBroadcast()) return;
			if (!room.lottery) return this.errorReply("There is no Lottery drawing going on right now.");
			let pot = room.lottery.players.length + 5 + costToJoin;
			return this.sendReplyBox(`<strong>The Current Pot is: ${pot} ${moneyPlural}.</strong>`);
		},

		"": "help",
		help(target, room, user) {
			this.parse(`/lotteryhelp`);
		},
	},

	lotteryhelp: [
		`Another alias for /lottery is /lotto. (Only works in Official Chatrooms)
		/lottery new - Creates a new Lottery drawing. Requires %, @, &, #, ~
		/lottery join - Join a Lottery drawing. Requires ${costToJoin} ${moneyPlural}.
		/lottery leave - Leaves a Lottery drawing.
		/lottery start - Forcefully starts a Lottery drawing (instead of starting automatically in 24 hours from creation). Requires %, @, &, #, ~
		/lottery players - Shows the current amount of players who have joined the ongoing Lottery drawing (and who).
		/lottery end - Forcefully ends a Lottery drawing. Requires %, @, &, #, ~
		/lottery help - Displays a list of the Lottery commands.`,
	],
};
