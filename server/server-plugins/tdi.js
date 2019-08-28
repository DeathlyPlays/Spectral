/************************
 * Total Drama Showdown *
 * Created by: Insist   *
 *   Idea by: Mewth		*
 ************************/

"use strict";

const timer = 1800; //defaults to 30 minutes

class TDI {
	constructor(room) {
		this.players = [];
		this.room = room;
		room.tdiNumber = room.tdiNumber ? room.tdiNumber++ : 1;
		this.tdiNumber = room.tdiNumber;
		this.state = "signups";
		this.prizeMoney = 0;
		this.room.add(`|uhtml|tdi-${this.tdiNumber}|<div class="broadcast-green"><center><p style="font-size: 14pt">Do you wanna be famous?</p><br /><p style="font-size: 10pt><strong>A new Total Drama Island season is casting!</strong></p><br /><p style="font-size: 9pt"><button name="send" value="/tdi join">Yeah!</button><br /></p><small><p>Every user that joins raises the prize money by 100 ${moneyPlural}.<br />Disclaimer: Seasons of Total Drama Island may take a(n) hour(s) to complete.</div>`, true);
		this.timer = setTimeout(() => {
			if (this.players.length < 2) {
				this.room.add(`|uhtmlchange|tdi-${this.tdiNumber}|<div class="broadcast-red"><p style="text-align: center; font-size: 14pt>This season of Total Drama Island has been cancelled.</p></div>`);
				return this.end();
			}
			this.start();
		}, 1000 * timer);
	}

	join(user) {
		if (this.state !== "signups") return user.sendTo(this.room, `Sorry, the season of Total Drama Island going on in this room is already airing.`);
		if (this.players.includes(user.userid)) return user.sendTo(this.room, `You have already joined this season of Total Drama Island.`);
		this.players.push(user.userid);
		user.sendTo(this.room, "You have joined the cast of Total Drama Island.");
	}

	leave(user) {
		if (!this.players.includes(user.userid)) return user.sendTo(this.room, `You have not joined this season of Total Drama Island yet.`);
		if (this.state !== "signups") {
			this.room.add(`|raw|${Server.nameColor(user.name, true)} has left this season of Total Drama Island.`);
			this.eliminate(user);
		} else {
			this.players.splice(this.players.indexOf(user.userid), 1);
			user.sendTo(this.room, "You have left the cast of Total Drama Island.");
		}
	}

	start() {
		this.room.add(`|uhtmlchange|tdi-${this.tdiNumber}|<div><strong><p style= 14pt>A new season of Total Drama Island has begun airing.</p></strong></div>`);
		this.state = "started";
		this.prizeMoney = this.players.length * 100;
		this.room.add(`The prize money has been locked in at a total of ${this.prizeMoney} ${moneyPlural}.`);
		this.decideTeams();
	}

	decideTeams() {
		let contestants = Dex.shuffle(this.players.slice());
		let team1 = [];
		let team2 = [];
		for (let i = 0; i < contestants.length; i++) {
			if (i % 2 === 0) {
				team1.push(contestants[i]);
				this.team1 = team1;
			} else {
				team2.push(contestants[i]);
				this.team2 = team2;
			}
		}
		this.room.add(`${Chat.toListString(this.team1)} are our first team of contestants :D`);
		this.room.add(`${Chat.toListString(this.team2)} are our second team of contestants :D`);
		this.room.add(`|html|<strong>Good luck!</strong>`);
		this.giveChallenge();
	}

	giveChallenge() {
		let challenges = ["Uno", "Tournament of Team 1's choice", "Tournament of Team 2's choice", "Ambush", "Hangman", "Pass The Bomb", "Guess Who"];
		let challenge = challenges[Math.floor(Math.random() * challenges.length)];
		this.room.add(`Hello contestants, your challenge for this round is ${challenge}.  Good luck!`);
	}

	eliminate(user) {
		this.players.splice(this.players.indexOf(user.userid), 1);
		if (this.team1.includes(user.userid)) {
			this.team1.splice(this.team1.indexOf(user.userid), 1);
		}
		if (this.team2.includes(user.userid)) {
			this.team2.splice(this.team2.indexOf(user.userid), 1);
		}
		if (this.players.length === 1) {
			return this.win();
		}
		this.giveChallenge();
		clearTimeout(this.timer);
	}

	win() {
		let winner = this.players[0];
		Economy.writeMoney(winner, this.prizeMoney);
		Economy.logTransaction(`${Users.get(winner)} has won a season of Total Drama Island worth ${this.prizeMoney}.`);
		this.room.add(`|html|${Server.nameColor(Users.get(winner))} has won this season of Total Drama Island and got the ${this.prizeMoney} prize! Thanks all for playing!`);
		this.end();
	}

	end() {
		clearTimeout(this.timer);
		this.room.add(`|uhtmlchange|tdi-${this.tdiNumber}|This season of Total Drama Island has ended.`);
		delete this.room.tdi;
	}
}

exports.commands = {
	totaldramashowdown: "tdi",
	totaldramaisland: "tdi",
	tds: "tdi",
	tdi: {
		create: "new",
		make: "new",
		new(target, room, user) {
			if (!this.can("ban", null, room)) return false;
			if (!this.canTalk()) return this.errorReply("You cannot use this while unable to speak.");
			if (room.id !== "totaldramaisland") return this.errorReply("This command only works in Total Drama Island.");
			if (room.tdi) return this.errorReply("There is an ongoing season of Total Drama Island in here.");
			room.tdi = new TDI(room);
		},

		j: "join",
		join(target, room, user) {
			if (!this.canTalk()) return this.errorReply("You cannot join a season of Total Drama Island while unable to speak.");
			if (!user.registered) return this.errorReply("You cannot join a season of Total Drama Island on unregistered accounts.");
			if (!room.tdi) return this.errorReply(`There is not a season of Total Drama Island airing right now.`);
			if (room.tdi.players.length === 12) return this.errorReply(`The ongoing season of Total Drama Island is currently at its player cap.`);
			room.tdi.join(user);
		},

		l: "leave",
		leave(target, room, user) {
			if (!room.tdi) return this.errorReply(`There is not a season of Total Drama Island airing right now.`);
			room.tdi.leave(user);
		},

		begin: "start",
		proceed: "start",
		start(target, room, user) {
			if (!this.can("ban", null, room)) return false;
			if (!room.tdi || room.tdi.state !== "signups") return this.errorReply("There is not a Total Drama Island season ready to start.");
			if (room.tdi.players.length < 2 || room.tdi.players.length > 12 || room.tdi.players.length % 2 !== 0) return this.errorReply(`We must have an even amount of contestants between the range of 2-12 to begin airing.`);
			room.tdi.start();
			this.privateModAction(`(${user.name} has started the season of Total Drama Island early.)`);
		},

		remove: "disqualify",
		dq: "disqualify",
		elim: "disqualify",
		eliminate: "disqualify",
		disqualify(target, room, user) {
			if (!this.can("ban", null, room)) return false;
			if (!room.tdi || room.tdi.state === "signups") return this.errorReply("A season of Total Drama Island must be airing to use this command.");
			if (!target) return this.errorReply("This command requires a target.");
			if (!this.room.tdi.players.includes(toID(target))) return this.errorReply(`This player is not in the season of Total Drama Island.`);
			room.tdi.eliminate(toID(target));
			this.privateModAction(`(${user.name} has disqualified ${target} from this season of Total Drama Island.)`);
			room.add(`|html|${Server.nameColor(target, true, true)} has been disqualified from this season of Total Drama Island.`).update();
		},

		stop: "end",
		cancel: "end",
		end(target, room, user) {
			if (!this.can("ban", null, room)) return false;
			if (!room.tdi) return this.errorReply("There is not an ongoing Total Drama Island season right now.");
			room.tdi.end();
			this.privateModAction(`(${user.name} has cancelled the season of Total Drama Island.)`);
		},

		checkplayers: "players",
		list: "players",
		viewplayers: "players",
		players(target, room, user) {
			if (!this.runBroadcast()) return;
			if (!room.tdi) return this.errorReply("There is not an ongoing Total Drama Island season currently.");
			return this.sendReplyBox(`There is currently ${this.room.tdi.players.length} player${this.room.tdi.players.length > 1 ? "s" : ""} in this season of Total Drama Island.<br /> Players: ${Chat.toListString(this.room.tdi.players)}.`);
		},

		as: "autostart",
		timer: "autostart",
		autostart(target, room, user) {
			if (!this.can("minigame", null, room)) return;
			if (!room.tdi) return this.errorReply("There is not an ongoing Total Drama Island session right now.");
			if (!timer || timer < 60 || timer > 300000) return this.errorReply("The amount must be a number between 60 and 300,000.");

			room.tdi.timer = timer;
			this.addModAction(`${user.name} has set the TDI automatic start timer to ${timer} seconds.`);
			this.modlog("TDI TIMER", null, `${timer} seconds`);
		},

		mv: "mustvote",
		mustvote(target, room, user) {
			if (!this.can("ban", null, room)) return false;
			if (!room.tdi || room.tdi.state === "signups") return this.errorReply("A season of Total Drama Island must be airing to use this command.");
			target = toID(target);
			if (!target && target !== "team1" && target !== "team2") return this.errorReply(`This command accepts the following arguments: Team 1 or Team 2.`);
			room.add(`Sorry ${target} but you must vote to cast a teammate off.`);
			// Make a poll of all of the team's members
			if (target === "team1" && room.tdi.team1.length > 1) {
				let poll = `Team 1 please vote to cast off one of your teammates!,`;
				poll += `${room.tdi.team1.join(", ")}`;
				this.parse(`/poll create ${poll}`);
			}
			if (target === "team2" && room.tdi.team2.length > 1) {
				let poll = `Team 2 please vote to cast off one of your teammates!,`;
				poll += `${room.tdi.team2.join(", ")}`;
				this.parse(`/poll create ${poll}`);
			}
		},

		"": "help",
		help(target, room, user) {
			this.parse(`/tdihelp`);
		},
	},

	tdihelp: [
		`/tdi new - Creates a Total Drama Island game. Requires Room Moderator or higher in the Total Drama Island room.
		/tdi start - Starts the Total Drama Island game. Requires Room Moderator or higher in the Total Drama Island room.
		/tdi autostart [amount of seconds until start] - Sets the auto-start timer. Requires Room Voice or higher in the Total Drama Island room.
		/tdi dq [user] - Disqualifies a user from the session of Total Drama Island. Requires Room Moderator or higher in the Total Drama Island room.
		/tdi mv [team1|team2] - Requires the specified team to vote to cast out one of their teammates. Requires Room Moderator or higher in the Total Drama Island.
		/tdi end - Ends the season of Total Drama Island. Requires Room Moderator or higher in the Total Drama Island room.
		/tdi join - Joins the season of Total Drama Island. Must be non-muted/locked and registered.
		/tdi leave - Leaves a season of Total Drama Island.
		/tdi players - Lists the players in the season of Total Drama Island.
		/tdi help - Displays this help command.`,
	],
};
