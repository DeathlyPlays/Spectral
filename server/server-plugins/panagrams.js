/* Panagrams chat-plugin
 * Created by SilverTactic (Siilver) and panpawn
 * This is a plugin that uses the anagrams
 * format that is dedicated to Pokemon
 * names. Winners receive 1 bucks a piece.
 */
'use strict';

if (!Server.pGames) Server.pGames = {};
let pGames = Server.pGames;

function mix(word) {
	let arr = [];
	for (let k = 0; k < word.length; k++) {
		arr.push(word[k]);
	}
	let a, b, i = arr.length;
	while (i) {
		a = Math.floor(Math.random() * i);
		i--;
		b = arr[i];
		arr[i] = arr[a];
		arr[a] = b;
	}
	return arr.join(``);
}

class Panagram {
	constructor(room, sessions) {
		this.sessions = sessions;
		this.room = room;
		let dex = Dex.data.Pokedex;
		do {
			this.answer = dex[Object.keys(dex)[Math.floor(Math.random() * Object.keys(dex).length)]];
		} while (this.answer.num < 1 || this.answer.forme);
		do {
			this.mixed = mix(toID(this.answer.species));
		} while (this.mixed === toID(this.answer.species));

		this.room.add(
			`|html|<div class = "broadcast-purple"><center>A game of Panagram was started! Scrambled Pokemon: <strong>${this.mixed}</strong><br /> (Remaining Sessions: ${this.sessions})<br />` +
			`<small>Use /gp [pokemon] to guess!</small></center>`
		);
		this.guessed = {};
		this.hint = [
			`The scrambled Pokémon is <strong>${this.mixed}</strong>.`,
			`The Pokémon's name is <strong>${this.answer.species.length}</strong> characters long.`,
			`The first letter is <strong>${this.answer.species[0]}</strong>.`,
			`This Pokémon's type is <strong>${this.answer.types.join(`/`)}</strong>.`,
		].join(`<br />`);

		this.room.chat = function (user, message, connection) {
			if (Dex.data.Pokedex[toID(message)] && message.match(/^[a-z ]/i)) message = `/gp ${message}`;
			message = Chat.parse(message, this, user, connection);

			if (message && message !== true) {
				this.add(`|c|${user.getIdentity(this.id)}|${message}`);
			}
			this.update();
		};
	}

	guess(user, guess) {
		if (guess.species === this.answer.species) {
			this.room.add(`|html|${Server.nameColor(user.name, true)} guessed <strong>${guess.species}</strong>, which was the correct answer! This user has also won 1 ${moneyName}!`);
			Economy.writeMoney(user.userid, 1);
			this.end();
		} else {
			this.room.add(`|html|${Server.nameColor(user.name, true)} guessed <strong>${guess.species}</strong>, but was not the correct answer...`);
			this.guessed[toID(guess.species)] = user.userid;
		}
	}

	end(forced) {
		if (forced) this.room.add(`|html|The game of panagram has been forcibly ended. The answer was <strong>${this.answer.species}</strong>.`);
		if (this.sessions > 1 && !forced) {
			pGames[this.room.id] = new Panagram(this.room, this.sessions - 1);
			this.room.update();
		} else {
			delete pGames[this.room.id];
		}
	}
}

exports.commands = {
	panagramrules: 'panagramhelp',
	phelp: 'panagramhelp',
	panagramhelp(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			'<center><strong>Panagram Help</strong><br />' +
			'<i style = "color:gray">By SilverTactic (Siiilver) and panpawn. Revised by Insist.</i></center><br />' +
			'<code>/panagram [session number]</code> - Starts a game of Panagram in the room for [session number] games (Panagrams are just anagrams with Pokemon). Alternate forms and CAP Pokemon won\'t be selected. Requires # or higher.<br />' +
			'<code>/panagramend</code> OR <code>/endp</code> - Ends a game of panagram. Requires @ or higher.<br />' +
			'<code>/panagramskip</code> OR <code>/pskip</code> - Skips the current session of the game of panagram. Requires @ or higher.<br />' +
			'<code>/panagramhint</code> OR <code>/ph</code> - Gives a hint to the answer.<br />' +
			'<code>/gp</code> - Guesses the answer.<br />' +
			'Users can guess answers by simply typing them into the chat as well.'
		);
	},

	panagrams: 'panagram',
	panagram(target, room, user, connection, cmd) {
		if (pGames[room.id]) return this.errorReply("There is currently a game of panagram going on in this room.");
		if (!this.can('declare', null, room)) return this.errorReply("You must be ranked # or higher to start a game of panagram in this room.");
		if (room.id !== 'casino') return this.sendReply('|html|You can only start a game of Panagram in the <button name = "send" value = "/join casino">Casino</button>');
		if (!target || isNaN(target)) return this.errorReply("Usage: /panagram [number of sessions]");
		if (target < 150) return this.errorReply("The minimum number of sessions you can have at a time is 150.");
		if (~target.indexOf('.')) return this.errorReply("The number of sessions cannot be a decimal value.");
		this.privateModAction(`${user.name} has started a game of panagrams set for ${target} sessions.`);
		Rooms.get(`lobby`).add(`|raw|<div class="broadcast-purple"><center>A session of <strong>Panagrams</strong> in <button name="joinRoom" value="${room.id}">"${room.title}"</button> has commenced for "${target}" games!</center></div>`);
		Rooms.get(`lobby`).update();
		pGames[room.id] = new Panagram(room, Number(target));
	},

	ph: 'panagramhint',
	panagramhint(target, room, user) {
		if (!pGames[room.id]) return this.errorReply("There is no game of panagram going on in this room.");
		if (!this.runBroadcast()) return;

		this.sendReplyBox(`Panagram Hint:<br />${pGames[room.id].hint}`);
	},

	guesspanagram: 'gp',
	guessp: 'gp',
	gp(target, room, user, connection, cmd) {
		if (!pGames[room.id]) return this.errorReply("There is no game of panagram going on in this room.");
		if (!this.canTalk()) return;

		if (!target) return this.sendReply(`|html|/${cmd} <em>Pokémon Name</em> - Guesses a Pokémon in a game of Panagram.`);
		if (!Dex.data.Pokedex[toID(target)]) return this.sendReply(`"${target}"" is not a valid Pokémon.`);
		let guess = Dex.data.Pokedex[toID(target)];
		if (guess.num < 1 || guess.forme) return this.sendReply(`${guess.species} is either an alternate form or doesn't exist in the games. They cannot be guessed.`);
		if (toID(guess.species) in pGames[room.id].guessed) return this.sendReply('That Pokémon has already been guessed!');

		pGames[room.id].guess(user, guess);
	},

	pskip: 'panagramend',
	panagramskip: 'panagramend',
	endp: 'panagramend',
	panagramsend: 'panagramend',
	panagramend(target, room, user, connection, cmd) {
		if (!pGames[room.id]) return this.errorReply("There is no game of panagram going on in this room.");
		if (!this.can('ban', null, room)) return this.sendReply("You must be ranked @ or higher to end a game of panagram in this room.");

		let skipCmd = ((cmd === 'panagramskip' || cmd === 'pskip') && pGames[room.id].sessions > 1);
		if (skipCmd) room.add(`|html|The current session of panagram has been ended by ${Server.nameColor(user.name, true)}. The answer was <strong>${pGames[room.id].answer.species}</strong>.`);
		pGames[room.id].end(!skipCmd);
	},
};
