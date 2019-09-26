/********************
 * Nightclub
 * The party never stops.
********************/
'use strict';

// let urlify = function (str) { return str.replace(/(https?\:\/\/[a-z0-9-.]+(\/([^\s]*[^\s?.,])?)?|[a-z0-9]([a-z0-9-\.]*[a-z0-9])?\.(com|org|net|edu|tk)((\/([^\s]*[^\s?.,])?)?|\b))/ig, '<a href="$1" target="_blank">$1</a>').replace(/<a href="([a-z]*[^a-z:])/g, '<a href="http://$1').replace(/(\bgoogle ?\[([^\]<]+)\])/ig, '<a href="http://www.google.com/search?ie=UTF-8&q=$2" target="_blank">$1</a>').replace(/(\bgl ?\[([^\]<]+)\])/ig, '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=$2" target="_blank">$1</a>').replace(/(\bwiki ?\[([^\]<]+)\])/ig, '<a href="http://en.wikipedia.org/w/index.php?title=Special:Search&search=$2" target="_blank">$1</a>').replace(/\[\[([^< ]([^<`]*?[^< ])?)\]\]/ig, '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=$1" target="_blank">$1</a>'); };
if (!Server.nightclub) Server.nightclub = {};

function colorify(given_text) {
	if (!given_text) return false;
	given_text = Chat.escapeHTML(given_text);
	let sofar = ``;
	let splitting = given_text.split("");
	let colorification = true;
	let beginningofend = false;
	for (let i = 0; i < splitting.length; i++) {
		if (splitting[i] === "<" && splitting[i + 1] !== "/") {
			//open tag <>
			//colorification = false;
		}
		if (splitting[i] === "/" && splitting[i - 1] === "<") {
			//closing tag </>
			//find exact spot
			//beginningofend = i;
		}
		if (beginningofend && splitting[i - 1] === ">") {
			//colorification = true;
			//beginningofend = false;
		}
		let letters = 'ABCDE'.split('');
		let color = "";
		for (let f = 0; f < 6; f++) {
			color += letters[Math.floor(Math.random() * letters.length)];
		}
		if (colorification) {
			if (splitting[i] === " ") {
				sofar += ` `;
			} else {
				sofar += `<font color="#${color}">${splitting[i]}</font>`;
			}
		} else {
			sofar += splitting[i];
		}
	}
	return sofar;
}

/*function colorify_absolute(given_text) {
	let sofar = "";
	let splitting = given_text.split("");
	let text_length = given_text.length;
	for (let i = 0; i < text_length; i++) {
		let color = (Math.random() * (0xFFFFFF + 1) << 0).toString(16);
		if (splitting[i] == " ") sofar += " "; else sofar += "<font color='" + "#" + color + "'>" + splitting[i] + "</font>";
	}
	return sofar;
}*/
Server.nightclubify = colorify;

exports.commands = {
	nightclub(target, room, user) {
		if (!this.can('declare', null, room)) return false;
		if (Server.nightclub[room.id]) return this.errorReply('This room is already engulfed in nightclubness.');
		Server.nightclub[room.id] = true;
		room.addRaw(`<div class="nightclub"><font size="6">${Server.nightclubify(`LETS GET FITZY!! nightclub mode: ON!!!`)}</font><font size="2"> started by: ${Server.nameColor(user.name, true, true)}</font></div>`);
	},

	dayclub(target, room, user) {
		if (!this.can('declare', null, room)) return false;
		if (!Server.nightclub[room.id]) return this.errorReply('This room is already in broad daylight.');
		delete Server.nightclub[room.id];
		room.addRaw(`<div class="nightclub"><font size="6">${Server.nightclubify(`sizzle down now... nightclub mode: off.`)}</font><font size="2"> ended by: ${Server.nameColor(user.name, true, true)}</font></div>`);
	},
};
