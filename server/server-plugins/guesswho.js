/**********************************
 * Guess Who for Pokemon Showdown *
 * Created by: Insist			  *
 * Idea by: Mewth				  *
 **********************************/

"use strict";

const guesses = 10;
const prizeMoney = 5;

class GuessWho {
	constructor(room) {
		this.room = room;
		let dex = Dex.data.Pokedex;
		do {
			this.answer = dex[Object.keys(dex)[Math.floor(Math.random() * Object.keys(dex).length)]];
		} while (this.answer.num < 1 || this.answer.forme);
		this.players = [];
		this.state = "signups";
		room.gwNumber = room.gwNumber ? room.gwNumber++ : 1;
		this.gwNumber = room.gwNumber;
		this.guesses = guesses;
		this.guessedPokemon = [];
		this.guessed = {};
		this.hints = [];
		this.prize = prizeMoney;
		this.room.add(`|uhtml|guesswho-${this.gwNumber}|<div class="broadcast-blue"><p style="font-size: 14pt; text-align: center">A new <strong>Guess Who</strong> game is starting!</p><p style="font-size: 9pt; text-align: center"><button name="send" value="/gw join">Join</button></p></div>`, true);
		this.timer = setTimeout(() => {
			if (this.players.length < 2) {
				this.room.add(`|uhtmlchange|guesswho-${this.gwNumber}|<div class="broadcast-red"><p style="text-align: center; font-size: 14pt>This Guess Who game has ended due to lack of users.</p></div>`);
				return this.end();
			}
			this.start();
		}, 1000 * 60 * 30);
	}

	guess(user, guess) {
		if (user.userid === this.questionee) return user.sendTo(this.room, `You are currently the questionee, so you cannot guess your Pokemon.`);
		if (!this.players.includes(user.userid)) return user.sendTo(this.room, `You are not currently in the session of Guess Who in this room.`);
		if (this.guesses === 10 && this.hints.length < 1) return false;
		if (this.guesses === 7 && this.hints.length < 2) return false;
		if (this.guesses === 3 && this.hints.length < 3) return false;
		if (guess.species === this.answer.species) {
			this.room.add(`|html|${Server.nameColor(user.name, true)} guessed <strong>${guess.species}</strong>, which was the correct answer! ${Server.nameColor(user.name, true)} has also won 5 ${moneyPlural}! ${Server.nameColor(user.name, true)} has also won 5 EXP!`);
			Economy.writeMoney(user.userid, prizeMoney);
			Economy.logTransaction(`${user.name} has won ${prizeMoney} ${moneyPlural} from playing a session of Guess Who.`);
			Server.ExpControl.addExp(user.userid, this.room, 5);
			this.end();
		} else {
			this.guessed[toID(guess.species)] = user.userid;
			this.guessedPokemon.push(guess.species);
			this.guesses--;
			this.room.add(`|html|${Server.nameColor(user.name, true)} guessed <strong>${guess.species}</strong>, but that was not the correct answer. <strong>${this.guesses} guesses are left.</strong>`);
			if (this.guesses < 1) {
				this.room.add(`|html|Sorry, the guessers have lost this round. Congratulations to the ${Server.nameColor(this.questionee, true)}! Their Pokemon was ${this.answer.species}! ${Server.nameColor(this.questionee, true)} has won ${this.prize} ${moneyPlural}! ${Server.nameColor(this.questionee, true)} has also won 5 EXP!`);
				Economy.writeMoney(this.questionee, prizeMoney);
				Economy.logTransaction(`${this.questionee} has won ${prizeMoney} ${moneyPlural} from playing a session of Guess Who.`);
				Server.ExpControl.addExp(this.questionee, this.room, 5);
				this.end();
			}
			if (this.guesses === 7 && this.hints.length < 2) {
				this.room.add(`|html|${Server.nameColor(this.questionee, true)}, it is now time for you to give the guessers their 2nd hint.`);
			}
			if (this.guesses === 3 && this.hints.length < 3) {
				this.room.add(`|html|${Server.nameColor(this.questionee, true)}, it is now time for you to give the guessers their 3rd hint.`);
			}
		}
	}

	start() {
		this.state = "started";
		let questionee = this.players[Math.floor(Math.random() * this.players.length)];
		this.questionee = questionee;
		this.players.splice(this.players.indexOf(questionee), 1);
		this.room.add(`|uhtmlchange|guesswho-${this.gwNumber}|<div class="infobox">This Guess Who game has been started! ${Server.nameColor(this.questionee, true)} is the questionee! Begin guessing ${Chat.toListString(this.players)}!`);
		this.room.add(`|html|${Server.nameColor(this.questionee, true)}, check <button name = "send" value = "/guesswho showanswer">here</button> to view the Pok&eacute;mon and begin giving hints.`);
	}

	joinGuessWho(user) {
		if (this.players.includes(user.userid)) return user.sendTo(this.room, "You have already joined the session of Guess Who in this room.");
		this.players.push(user.userid);
		user.sendTo(this.room, "You have joined the ongoing session of Guess Who in this room.");
	}

	leaveGuessWho(user) {
		if (!this.players.includes(user.userid)) return user.sendTo(this.room, `You are not currently in the session of Guess Who in this room.`);
		this.players.splice(this.players.indexOf(user.userid), 1);
		user.sendTo(this.room, `You have successfully left the ongoing session of Guess Who.`);
	}

	giveHint(hint) {
		this.room.add(`|html|${Server.nameColor(this.questionee, true)} has given the hint: <strong>"${hint}"</strong>.`);
		this.hints.push(hint);
	}

	end() {
		this.room.add(`|uhtmlchange|guesswho-${this.gwNumber}|<div class="infobox">This Guess Who game has been ended! The answer was ${this.answer.species}!</div>`).update();
		clearTimeout(this.timer);
		delete this.room.guesswho;
	}
}

exports.commands = {
	guesswho: "gw",
	gw: {
		new: "create",
		make: "create",
		create: function (target, room, user) {
			if (room.guesswho) return this.errorReply("A session of Guess Who is already active.");
			if (room.guessWhoDisabled) return this.errorReply(`Guess Who is currently disabled in ${room.title}.`);
			if (!this.can("minigame", null, room)) return false;
			if (!room.isOfficial) return this.errorReply("Guess Who can only be created in Official Chatrooms.");
			this.privateModAction(`(A new Guess Who game has been created.)`);
			room.guesswho = new GuessWho(room);
		},

		j: "join",
		join: function (target, room, user) {
			if (!room.guesswho) return this.errorReply("There is no ongoing Guess Who game going on right now.");
			if (room.guesswho.state !== "signups") return this.errorReply("This session of Guess Who has already been started.");
			if (!this.canTalk()) return this.errorReply("You must be able to talk to join a game of Guess Who.");
			if (!user.registered) return this.errorReply("To join a Guess Who game, you must be on a registered account.");
			room.guesswho.joinGuessWho(user);
		},

		part: "leave",
		l: "leave",
		leave: function (target, room, user) {
			if (!room.guesswho) return this.errorReply("There is no ongoing game of Guess Who in this room.");
			room.guesswho.leaveGuessWho(user);
		},

		checkplayers: "players",
		list: "players",
		viewplayers: "players",
		players: function (target, room, user) {
			if (!this.runBroadcast()) return;
			if (!room.guesswho) return this.errorReply("There is no ongoing game of Guess Who in this room.");
			return this.sendReplyBox(`<strong>Current Player Count: ${room.guesswho.players.length} ${((room.guesswho.players.length === 1) ? "user is" : "users are")} in this session of Guess Who.<br /> Players: ${room.guesswho.players}.`);
		},

		forcestart: "start",
		begin: "start",
		start: function (target, room, user) {
			if (!this.can("mute", null, room)) return;
			if (!room.guesswho || room.guesswho.players.length < 2 || room.guesswho.state !== "signups") return this.errorReply("There is not any Guess Who session available to be started.");
			this.privateModAction(`(The session of Guess Who has been started early.)`);
			room.guesswho.start();
		},

		g: "guess",
		gp: "guess",
		guessp: "guess",
		guesspokemon: "guesspokemon",
		guess: function (target, room, user, connection, cmd) {
			if (!room.guesswho) return this.errorReply("There is no session of Guess Who going on in this room.");
			if (room.guesswho.state === "signups") return this.errorReply("This session of Guess Who has not been started.");
			if (!this.canTalk()) return;

			if (!target) return this.parse("/guesswhohelp");
			if (!Dex.data.Pokedex[toID(target)]) return this.errorReply(`"${target}" is not a valid Pokémon.`);
			let guess = Dex.data.Pokedex[toID(target)];
			if (guess.num < 1 || guess.forme) return this.errorReply(`${guess.species} is either an alternate form or doesn"t exist in the games. They cannot be guessed.`);
			if (toID(guess.species) in room.guesswho.guessed) return this.errorReply("That Pokémon has already been guessed!");

			room.guesswho.guess(user, guess);
		},

		guesscount: "remainingguesses",
		remaining: "remainingguesses",
		remainingguesses: function (target, room, user, connection, cmd) {
			if (!this.runBroadcast()) return;
			if (!room.guesswho) return this.errorReply("There is no session of Guess Who going on in this room.");
			if (room.guesswho.state === "signups") return this.errorReply("This session of Guess Who has not been started.");
			return this.sendReplyBox(`<strong>Remaining Guesses: ${room.guesswho.guesses}.</strong>`);
		},

		showguess: "guesses",
		showguesses: "guesses",
		guessedpokemon: "guesses",
		guessedpkmn: "guesses",
		guesses: function (target, room, user) {
			if (!this.runBroadcast()) return;
			if (!room.guesswho) return this.errorReply(`There is no ongoing session of Guess Who going on right now.`);
			if (room.guesswho.guessedPokemon.length < 1) return this.errorReply(`No one has guessed a Pokemon yet.`);
			return this.sendReplyBox(`<strong>Guessed Pokemon: ${Chat.toListString(room.guesswho.guessedPokemon)}</strong>`);
		},

		showanswer: function (target, room, user) {
			if (!room.guesswho) return this.errorReply("There is no session of Guess Who going on in this room.");
			if (room.guesswho.questionee !== user.userid) return this.errorReply("You must be the questionee to use this.");
			this.sendReplyBox(`Attention: You must give hints about this Pokemon! Try not to give away too much, because if your Pok&eacute;mon hasn't been guessed after ${guesses} amount of times you win!<br /><strong>Your Pok&eacute;mon is ${room.guesswho.answer.species}</strong>!`);
		},

		cancel: "end",
		end: function (target, room, user) {
			if (!this.can("mute", null, room)) return;
			if (!room.guesswho) return this.errorReply("There is no ongoing session of Guess Who going on right now.");
			this.privateModAction(`(The session of Guess Who was forcefully ended.)`);
			room.guesswho.end();
		},

		givehints: "gh",
		givehint: "gh",
		gh: function (target, room, user) {
			if (!room.guesswho) return this.errorReply(`There is no ongoing session of Guess Who going on right now.`);
			if (room.guesswho.questionee !== user.userid) return this.errorReply(`Only the questionee may provide hints.`);
			if (!target) return this.errorReply(`You must provide a hint.`);
			if (target in room.guesswho.hints) return this.errorReply(`You have already gave "${target}" as a hint.`);

			room.guesswho.giveHint(target);
		},

		showhints: "hints",
		hint: "hints",
		hints: function (target, room, user) {
			if (!this.runBroadcast()) return;
			if (!room.guesswho) return this.errorReply(`There is no ongoing session of Guess Who going on right now.`);
			if (room.guesswho.hints.length < 1) return this.errorReply(`There are currently no hints in this session of Guess Who, request one from the questionee.`);
			return this.sendReplyBox(`<strong>Current Hints: ${Chat.toListString(room.guesswho.hints)}</strong>`);
		},

		off: "disable",
		disable: function (target, room, user) {
			if (!this.can("gamemanagement", null, room)) return;
			if (room.guessWhoDisabled) {
				return this.errorReply("Guess Who is already disabled in this room.");
			}
			room.guessWhoDisabled = true;
			if (room.chatRoomData) {
				room.chatRoomData.guessWhoDisabled = true;
				Rooms.global.writeChatRoomData();
			}
			return this.sendReply("Guess Who has been disabled for this room.");
		},

		on: "enable",
		enable: function (target, room, user) {
			if (!this.can("gamemanagement", null, room)) return;
			if (!room.guessWhoDisabled) {
				return this.errorReply("Guess Who is already enabled in this room.");
			}
			delete room.guessWhoDisabled;
			if (room.chatRoomData) {
				delete room.chatRoomData.guessWhoDisabled;
				Rooms.global.writeChatRoomData();
			}
			return this.sendReply("Guess Who has been enabled for this room.");
		},

		"": "help",
		help: function (target, room, user) {
			this.parse("/guesswhohelp");
		},
	},

	guesswhohelp: [
		`Another alias for /guesswho is /gw.
		/guesswho new - Creates a new session of Guess Who. Requires %, @, &, #, ~
		/guesswho join - Join a session of Guess Who.
		/guesswho leave - Leaves the ongoing session of Guess Who.
		/guesswho start - Starts a session of Guess Who. Requires %, @, &, #, ~
		/guesswho guess [Pokemon] - Guesses what the Pokemon is.
		/guesswho guesses - Shows all the Pokemon players have guessed.
		/guesswho showanswer - Shows the correct answer. You must be the Questionee to view this.
		/guesswho givehint [hint] - Gives a hint about the answer. You must be the Questionee to use this.
		/guesswho hints - Shows all the hints the Questionee has provided.
		/guesswho remaining - Shows how many remaining guesses there are.
		/guesswho players - Shows the current amount of players who have joined the ongoing session of Guess Who.
		/guesswho end - Forcefully ends a session of Guess Who. Requires %, @, &, #, ~
		/guesswho enable - Enables Guess Who in the room, if disabled. Requires &, #, ~
		/guesswho disable - Disables Guess Who in the room, if enabled. Requires &, %, ~
		/guesswho help - Displays a command listing all of the Guess Who commands.`,
	],
};
