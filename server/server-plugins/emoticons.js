/*
Emoticon plugin
This plugin allows you to use emoticons in both chat rooms (as long as they are enabled in the room) and private messages.
*/
"use strict";

const FS = require("../../.lib-dist/fs").FS;

let emoticons = {"feelsbd": "http://i.imgur.com/TZvJ1lI.png"};
let emoteRegex = new RegExp("feelsbd", "g");
Server.ignoreEmotes = {};
try {
	Server.ignoreEmotes = JSON.parse(FS(`config/ignoreemotes.json`).readIfExistsSync());
} catch (e) {}

function loadEmoticons() {
	try {
		emoticons = JSON.parse(FS(`config/emoticons.json`).readIfExistsSync());
		emoteRegex = [];
		for (let emote in emoticons) {
			emoteRegex.push(escapeRegExp(emote));
		}
		emoteRegex = new RegExp(`(${emoteRegex.join(`|`)})`, `g`);
	} catch (e) {}
}
loadEmoticons();

function saveEmoticons() {
	FS(`config/emoticons.json`).writeSync(JSON.stringify(emoticons));
	emoteRegex = [];
	for (let emote in emoticons) {
		emoteRegex.push(emote);
	}
	emoteRegex = new RegExp(`(${emoteRegex.join(`|`)})`, `g`);
}

function parseEmoticons(message, room) {
	if (emoteRegex.test(message)) {
		let size = 50;
		let lobby = Rooms.get(`lobby`);
		if (lobby && lobby.emoteSize) size = lobby.emoteSize;
		message = Server.parseMessage(message).replace(emoteRegex, function (match) {
			return `<img src="${emoticons[match]}" title="${match}" height="${((room && room.emoteSize) ? room.emoteSize : size)}" width="${((room && room.emoteSize) ? room.emoteSize : size)}">`;
		});
		return message;
	}
	return false;
}
Server.parseEmoticons = parseEmoticons;

exports.commands = {
	blockemote: "ignoreemotes",
	blockemotes: "ignoreemotes",
	blockemoticon: "ignoreemotes",
	blockemoticons: "ignoreemotes",
	ignoreemotes(target, room, user) {
		this.parse(`/emoticons ignore`);
	},

	unblockemote: "unignoreemotes",
	unblockemotes: "unignoreemotes",
	unblockemoticon: "unignoreemotes",
	unblockemoticons: "unignoreemotes",
	unignoreemotes(target, room, user) {
		this.parse(`/emoticons unignore`);
	},

	emoticons: "emoticon",
	emote: "emoticon",
	emotes: "emoticon",
	emoticon: {
		add(target, room, user) {
			if (!this.can(`emotes`)) return false;
			if (!target) return this.parse("/emoticonshelp");

			let targetSplit = target.split(",");
			for (let u in targetSplit) targetSplit[u] = targetSplit[u].trim();

			if (!targetSplit[1]) return this.parse("/emoticonshelp");
			if (targetSplit[0].length > 10) return this.errorReply("Emoticons may not be longer than 10 characters.");
			if (targetSplit[0] === "Wtf") return this.errorReply("Fuck off");
			if (emoticons[targetSplit[0]]) return this.errorReply(`${targetSplit[0]} is already an emoticon.`);

			emoticons[targetSplit[0]] = targetSplit[1];
			saveEmoticons();

			let size = 50;
			let lobby = Rooms.get(`lobby`);
			if (lobby && lobby.emoteSize) size = lobby.emoteSize;
			if (room.emoteSize) size = room.emoteSize;

			this.sendReply(`|raw|The emoticon ${Chat.escapeHTML(targetSplit[0])} has been added: <img src="${targetSplit[1]}" width="${size}" height="${size}">`);
			if (Rooms.get("upperstaff")) Rooms.get("upperstaff").add(`|raw|${Server.nameColor(user.name, true)} has added the emoticon ${Chat.escapeHTML(targetSplit[0])}: <img src="${targetSplit[1]}" width="${size}" height="${size}">`);
			Server.messageSeniorStaff(`/html ${Server.nameColor(user.name, true)} has added the emoticon ${Chat.escapeHTML(targetSplit[0])}: <img src="${targetSplit[1]}" width="${size}" height="${size}">`);
		},

		delete: "del",
		remove: "del",
		rem: "del",
		del(target, room, user) {
			if (!this.can(`emotes`)) return false;
			if (!target) return this.parse("/emoticonshelp");
			if (!emoticons[target]) return this.errorReply("That emoticon does not exist.");

			delete emoticons[target];
			saveEmoticons();

			this.sendReply("That emoticon has been removed.");
			if (Rooms.get("upperstaff")) Rooms.get("upperstaff").add(`|raw|${Server.nameColor(user.name, true)} has removed the emoticon ${Chat.escapeHTML(target)}.`);
			Server.messageSeniorStaff(`/html ${Server.nameColor(user.name, true)} has removed the emoticon ${Chat.escapeHTML(target)}.`);
		},

		toggle(target, room, user) {
			if (!this.can("emotes", null, room)) return false;
			if (!room.disableEmoticons) {
				room.disableEmoticons = true;
				Rooms.global.writeChatRoomData();
				this.modlog(`EMOTES`, null, `disabled emoticons`);
				this.privateModAction(`(${user.name} disabled emoticons in this room.)`);
			} else {
				room.disableEmoticons = false;
				Rooms.global.writeChatRoomData();
				this.modlog(`EMOTES`, null, `enabled emoticons`);
				this.privateModAction(`(${user.name} enabled emoticons in this room.)`);
			}
		},

		view: "list",
		list(target, room, user) {
			if (!this.runBroadcast()) return;

			let size = 50;
			let lobby = Rooms.get("lobby");
			if (lobby && lobby.emoteSize) size = lobby.emoteSize;
			if (room.emoteSize) size = room.emoteSize;

			let reply = `<strong><u>Emoticons (${Object.keys(emoticons).length})</u></strong><br />`;
			let sortedEmotes = Object.keys(emoticons).sort().map((e, i) => {
				let emote = emoticons[e];
				return `<button style="border: 1px solid; border-color: skyblue; border-radius: 5px; width: 85px; background-color: transparent"><center><table><tr><td>${'<img src="' + emote + '" title="' + e + '"height="' + size + '" width="' + size + '">'}</td></tr><tr><td><span style="background-color: #ffffff">${e}</span></td></tr></table></center></button>` + (i % 4 === 3 ? "<br />" : "");
			});
			this.sendReply(`|raw|<div class="infobox infobox-limited">${reply}<br />${sortedEmotes.join(' ')}</div>`);
		},

		ignore(target, room, user) {
			if (Server.ignoreEmotes[user.userid]) return this.errorReply(`You are already ignoring emoticons.`);
			Server.ignoreEmotes[user.userid] = true;
			FS(`config/ignoreemotes.json`).writeSync(JSON.stringify(Server.ignoreEmotes));
			this.sendReply(`You are now ignoring emoticons.`);
		},

		unignore(target, room, user) {
			if (!Server.ignoreEmotes[user.userid]) return this.errorReply(`You aren't ignoring emoticons.`);
			delete Server.ignoreEmotes[user.userid];
			FS(`config/ignoreemotes.json`).writeSync(JSON.stringify(Server.ignoreEmotes));
			this.sendReply(`You are no longer ignoring emoticons.`);
		},

		size(target, room, user) {
			if (room.id === `lobby` && !this.can(`emotes`) || room.id !== `lobby` && !this.can(`emotes`, null, room)) return false;
			if (!target) return this.sendReply(`Usage: /emoticons size [number]`);

			let size = Math.round(Number(target));
			if (isNaN(size)) return this.errorReply(`"${target}" is not a valid number.`);
			if (size < 1) return this.errorReply(`Size may not be less than 1.`);
			if (size > 200) return this.errorReply(`Size may not be more than 200.`);

			room.emoteSize = size;
			room.chatRoomData.emoteSize = size;
			Rooms.global.writeChatRoomData();
			this.privateModAction(`${user.name} has changed emoticon size in this room to ${size}.`);
		},

		"": "help",
		help(target, room, user) {
			this.parse(`/emoticonshelp`);
		},
	},

	randomemoticon: "randemote",
	randemoticon: "randemoticon",
	randomemote: "randemote",
	randemote(target, room, user) {
		if (!this.canTalk()) return;
		let e = Object.keys(emoticons)[Math.floor(Math.random() * Object.keys(emoticons).length)];
		this.parse(e);
	},

	emoticonshelp: [
		`Emoticon Commands:
		/emoticon may be substituted with /emoticons, /emotes, or /emote
		/emoticon add [name], [url] - Adds an emoticon. Requires @, &, #, ~
		/emoticon del/delete/remove/rem [name] - Removes an emoticon. Requires @, &, #, ~
		/emoticon toggle - Enables or disables emoticons in the current room depending on if they are already active. Requires @, &, #, ~
		/emoticon view/list - Displays the list of emoticons.
		/emoticon ignore - Ignores emoticons in chat messages.
		/emoticon unignore - Unignores emoticons in chat messages.
		/emoticon size [size] - Changes the size of emoticons in the current room. Requires @, &, #, ~
		/randemote - Randomly sends an emote from the emoticon list.
		/emoticon help - Displays this help command.`,
	],
};

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // eslint-disable-line no-useless-escape
}
