"use strict";

const FS = require("../lib/fs.js");
const nani = require("nani").init("niisama1-uvake", "llbgsBx3inTdyGizCPMgExBVmQ5fU");
const https = require("https");
const http = require("http");
const Pokedex = require("../data/pokedex.js").BattlePokedex;

const bubbleLetterMap = new Map([
	["a", "\u24D0"], ["b", "\u24D1"], ["c", "\u24D2"], ["d", "\u24D3"], ["e", "\u24D4"], ["f", "\u24D5"], ["g", "\u24D6"], ["h", "\u24D7"], ["i", "\u24D8"], ["j", "\u24D9"], ["k", "\u24DA"], ["l", "\u24DB"], ["m", "\u24DC"],
	["n", "\u24DD"], ["o", "\u24DE"], ["p", "\u24DF"], ["q", "\u24E0"], ["r", "\u24E1"], ["s", "\u24E2"], ["t", "\u24E3"], ["u", "\u24E4"], ["v", "\u24E5"], ["w", "\u24E6"], ["x", "\u24E7"], ["y", "\u24E8"], ["z", "\u24E9"],
	["A", "\u24B6"], ["B", "\u24B7"], ["C", "\u24B8"], ["D", "\u24B9"], ["E", "\u24BA"], ["F", "\u24BB"], ["G", "\u24BC"], ["H", "\u24BD"], ["I", "\u24BE"], ["J", "\u24BF"], ["K", "\u24C0"], ["L", "\u24C1"], ["M", "\u24C2"],
	["N", "\u24C3"], ["O", "\u24C4"], ["P", "\u24C5"], ["Q", "\u24C6"], ["R", "\u24C7"], ["S", "\u24C8"], ["T", "\u24C9"], ["U", "\u24CA"], ["V", "\u24CB"], ["W", "\u24CC"], ["X", "\u24CD"], ["Y", "\u24CE"], ["Z", "\u24CF"],
	["1", "\u2460"], ["2", "\u2461"], ["3", "\u2462"], ["4", "\u2463"], ["5", "\u2464"], ["6", "\u2465"], ["7", "\u2466"], ["8", "\u2467"], ["9", "\u2468"], ["0", "\u24EA"],
]);

const asciiMap = new Map([
	["\u24D0", "a"], ["\u24D1", "b"], ["\u24D2", "c"], ["\u24D3", "d"], ["\u24D4", "e"], ["\u24D5", "f"], ["\u24D6", "g"], ["\u24D7", "h"], ["\u24D8", "i"], ["\u24D9", "j"], ["\u24DA", "k"], ["\u24DB", "l"], ["\u24DC", "m"],
	["\u24DD", "n"], ["\u24DE", "o"], ["\u24DF", "p"], ["\u24E0", "q"], ["\u24E1", "r"], ["\u24E2", "s"], ["\u24E3", "t"], ["\u24E4", "u"], ["\u24E5", "v"], ["\u24E6", "w"], ["\u24E7", "x"], ["\u24E8", "y"], ["\u24E9", "z"],
	["\u24B6", "A"], ["\u24B7", "B"], ["\u24B8", "C"], ["\u24B9", "D"], ["\u24BA", "E"], ["\u24BB", "F"], ["\u24BC", "G"], ["\u24BD", "H"], ["\u24BE", "I"], ["\u24BF", "J"], ["\u24C0", "K"], ["\u24C1", "L"], ["\u24C2", "M"],
	["\u24C3", "N"], ["\u24C4", "O"], ["\u24C5", "P"], ["\u24C6", "Q"], ["\u24C7", "R"], ["\u24C8", "S"], ["\u24C9", "T"], ["\u24CA", "U"], ["\u24CB", "V"], ["\u24CC", "W"], ["\u24CD", "X"], ["\u24CE", "Y"], ["\u24CF", "Z"],
	["\u2460", "1"], ["\u2461", "2"], ["\u2462", "3"], ["\u2463", "4"], ["\u2464", "5"], ["\u2465", "6"], ["\u2466", "7"], ["\u2467", "8"], ["\u2468", "9"], ["\u24EA", "0"],
]);

let amCache = {
	anime: {},
	manga: {},
};

let regdateCache = {};
let udCache = {};
let defCache = {};

let pmName = `~${Config.serverName} Server`;

Server.img = function (link, height, width) {
	if (!link) return `<font color="maroon">ERROR : You must supply a link.</font>`;
	return `<img src="${link}" ${(height ? `height="${height}"` : ``)} ${(width ? `width="${width}"` : ``)}/>`;
};

Server.font = function (text, color, bold) {
	if (!text) return `<font color="maroon">ERROR : Please provide some text.</font>`;
	return `<font color="${(color ? color : "black")}">${(bold ? "<strong>" : "")}${text}${(bold ? "</strong>" : "")}</font>`;
};

function parseStatus(text, encoding) {
	if (encoding) {
		text = text
			.split("")
			.map(char => bubbleLetterMap.get(char))
			.join("");
	} else {
		text = text
			.split("")
			.map(char => asciiMap.get(char))
			.join("");
	}
	return text;
}

function postAds() {
	if (Rooms.global.ads.length > 0) {
		let ad = Rooms.global.ads.shift();
		Rooms.get("lobby").addRaw(`<div class="infobox"><a href="/${ad["room"]}" class="ilink"><font color="#04B404"> Advertisement <strong>${ad["room"]}</strong>:</font> ${ad["message"]}</a>  -${ad["user"]}</div>`);
		Rooms.get("lobby").update();
	}
}

let monData;
try {
	monData = FS("data/ssb-data.txt").readIfExistsSync().toString().split("\n\n");
} catch (e) {
	console.error(e);
}

function getMonData(target) {
	let returnData = null;
	monData.forEach(function (data) {
		if (toId(data.split("\n")[0].split(" - ")[0] || " ") === target) {
			returnData = data.split("\n").map(function (line) {
				return Chat.escapeHTML(line);
			}).join("<br />");
		}
	});
	return returnData;
}

function clearRoom(room) {
	let len = (room.log.log && room.log.log.length) || 0;
	let users = [];
	while (len--) {
		room.log.log[len] = "";
	}
	for (let u in room.users) {
		users.push(u);
		Users.get(u).leaveRoom(room, Users.get(u).connections[0]);
	}
	len = users.length;
	setTimeout(() => {
		while (len--) {
			Users.get(users[len]).joinRoom(room, Users.get(users[len]).connections[0]);
		}
	}, 1000);
}

Server.regdate = function (target, callback) {
	target = toId(target);
	if (regdateCache[target]) return callback(regdateCache[target]);
	let req = https.get(`https://pokemonshowdown.com/users/${target}.json`, res => {
		let data = "";
		res.on("data", chunk => {
			data += chunk;
		}).on("end", () => {
			data = JSON.parse(data);
			let date = data["registertime"];
			if (date !== 0 && date.toString().length < 13) {
				while (date.toString().length < 13) {
					date = Number(date.toString() + "0");
				}
			}
			if (date !== 0) {
				regdateCache[target] = date;
				saveRegdateCache();
			}
			callback((date === 0 ? false : date));
		});
	});
	req.end();
};

function loadRegdateCache() {
	try {
		regdateCache = JSON.parse(FS("config/regdate.json").readIfExistsSync());
	} catch (e) {}
}
loadRegdateCache();

function saveRegdateCache() {
	FS("config/regdate.json").writeSync(JSON.stringify(regdateCache));
}

let messages = [
	`has vanished into nothingness!`,
	`used Explosion!`,
	`fell into the void.`,
	`went into a cave without a repel!`,
	`has left the building.`,
	`was forced to give StevoDuhHero's mom an oil massage!`,
	`was hit by Magikarp's Revenge!`,
	`ate a bomb!`,
	`is blasting off again!`,
	`(Quit: oh god how did this get here i am not good with computer)`,
	`was unfortunate and didn't get a cool message.`,
	`{{user}}'s mama accidently kicked {{user}} from the server!`,
	`felt Insist's wrath.`,
	`got rekt by Travis CI!`,
	`exited life.exe.`,
	`found a species called "friends" (whatever that means).`,
];

exports.commands = {
	useroftheweek: "uotw",
	uotw: function (target, room, user) {
		if (toId(target.length) >= 19) return this.errorReply("Usernames have to be 18 characters or less");
		if (!this.can("mute", null, room)) return false;
		if (!room.chatRoomData) return;
		if (!target) {
			if (!this.runBroadcast()) return;
			if (!room.chatRoomData.user) return this.errorReply("The User of the Week has not been set.");
			return this.sendReplyBox(`The current <strong>User of the Week</strong> is: ${Server.nameColor(room.chatRoomData.user, true)}`);
		}
		if (this.meansNo(target)) {
			if (!room.chatRoomData.user) return this.errorReply("The User of the Week has already been reset.");
			delete room.chatRoomData.user;
			this.sendReply(`The User of the Week was reset by ${Server.nameColor(user.name, true)}.`);
			this.addModAction(`UOTW Reset: ${user.name} reset the User of the Week.`);
			Rooms.global.writeChatRoomData();
			return;
		}
		room.chatRoomData.user = Chat.escapeHTML(target);
		Rooms.global.writeChatRoomData();
		room.addRaw(`<div class="broadcast-green"><strong>The User of the Week is: ${Server.nameColor(room.chatRoomData.user, true)}.</strong></div>`);
		this.addModAction(`${user.name} updated the User of the Week to "${room.chatRoomData.user}".`);
	},
	useroftheweekhelp: "uotwhelp",
	uotwhelp: [
		`/uotw - View the current User of the Week.
		/uotw [user] - Set the User of the Week. Requires: % or higher.`,
	],

	etour: function (target) {
		if (!target) return this.parse("/help etour");
		this.parse(`/tour create ${target}, elimination`);
	},
	etourhelp: ["/etour [format] - Creates an elimination tournament."],

	rtour: function (target) {
		if (!target) return this.parse("/help rtour");
		this.parse(`/tour create ${target}, roundrobin`);
	},
	rtourhelp: ["/rtour [format] - Creates a round robin tournament."],

	autovoice: "autorank",
	autodriver: "autorank",
	automod: "autorank",
	autoowner: "autorank",
	autopromote: "autorank",
	autorank: function (target, room, user, connection, cmd) {
		switch (cmd) {
		case "autovoice":
			target = "+";
			break;
		case "autodriver":
			target = "%";
			break;
		case "automod":
			target = "@";
			break;
		case "autoleader":
			target = "&";
			break;
		case "autoowner":
			target = "#";
			break;
		}

		if (!target) return this.parse("/autorankhelp");
		if (!this.can("roommod", null, room)) return false;
		if (room.isPersonal) return this.errorReply("Autorank is not currently a feature in groupchats.");
		target = target.trim();

		if (this.meansNo(target) && room.autorank) {
			delete room.autorank;
			delete room.chatRoomData.autorank;
			Rooms.global.writeChatRoomData();
			for (let u in room.users) Users.get(u).updateIdentity();
			return this.privateModAction(`(${user.name} has disabled autorank in this room.)`);
		}
		if (room.autorank && room.autorank === target) return this.errorReply(`Autorank is already set to "${target}".`);

		if (Config.groups[target] && !Config.groups[target].globalonly) {
			if (target === "#" && user.userid !== room.founder) return this.errorReply("You can't set autorank to # unless you're the room founder.");
			room.autorank = target;
			room.chatRoomData.autorank = target;
			Rooms.global.writeChatRoomData();
			for (let u in room.users) Users.get(u).updateIdentity();
			return this.privateModAction(`(${user.name} has set autorank to "${target}" in this room.)`);
		}
		return this.errorReply(`Group "${target}" not found.`);
	},
	autorankhelp: ["/autorank [rank] - Automatically promotes user to the specified rank when they join the room."],

	bonus: "dailybonus",
	checkbonus: "dailybonus",
	dailybonus: function (target, room, user) {
		let nextBonus = Date.now() - Db.DailyBonus.get(user.userid, [1, Date.now()])[1];
		if ((86400000 - nextBonus) <= 0) return Server.giveDailyReward(user.userid, user);
		return this.errorReply(`Your next bonus is ${(Db.DailyBonus.get(user.userid, [1, Date.now()])[0] === 8 ? 7 : Db.DailyBonus.get(user.userid, [1, Date.now()])[0])} ${(Db.DailyBonus.get(user.userid, [1, Date.now()])[0] === 1 ? moneyName : moneyPlural)} in ${Chat.toDurationString(Math.abs(86400000 - nextBonus))}`);
	},

	"!sota": true,
	sota: function () {
		this.parse("feelssotafeelstinitinitinisotalove");
	},

	"!define": true,
	def: "define",
	define: function (target, room, user) {
		if (!target) return this.parse("/help define");
		target = toId(target);
		if (target > 50) return this.errorReply("/define <word> - word can not be longer than 50 characters.");
		if (!this.runBroadcast()) return;

		if (toId(target) !== "constructor" && defCache[toId(target)]) {
			this.sendReplyBox(defCache[toId(target)]);
			if (room) room.update();
			return;
		}

		let options = {
			host: "api.wordnik.com",
			port: 80,
			path: `/v4/word.json/${target}/definitions?limit=3&sourceDictionaries=all&useCanonical=false&includeTags=false&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5`,
			method: "GET",
		};

		http.get(options, res => {
			let data = ``;
			res.on(`data`, chunk => {
				data += chunk;
			}).on(`end`, () => {
				if (data.charAt(1) !== `{`) {
					this.sendReplyBox(`Error retrieving definition for <strong>"${target}"</strong>.`);
					if (room) room.update();
					return;
				}
				data = JSON.parse(data);
				let output = `<font color=#24678d><strong>Definitions for ${target}:</strong></font><br />`;
				if (!data[0] || !data) {
					this.sendReplyBox(`No results for <strong>"${target}"</strong>.`);
					if (room) room.update();
					return;
				} else {
					let count = 1;
					for (let u in data) {
						if (count > 3) break;
						output += `(<strong>${count}</strong>) ${data[u][`text`]}<br />`;
						count++;
					}
					this.sendReplyBox(output);
					defCache[target] = output;
					if (room) room.update();
					return;
				}
			});
		});
	},
	definehelp: ["/define [word] - Gives the definition to a word."],

	"!urbandefine": true,
	u: "urbandefine",
	ud: "urbandefine",
	urbandefine: function (target, room) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse("/help urbandefine");
		if (target.toString() > 50) return this.errorReply("Phrase can not be longer than 50 characters.");

		if (toId(target) !== "constructor" && udCache[toId(target)]) {
			this.sendReplyBox(udCache[toId(target)]);
			if (room) room.update();
			return;
		}

		let options = {
			host: "api.urbandictionary.com",
			port: 80,
			path: `/v0/define?term=${encodeURIComponent(target)}`,
			term: target,
		};

		http.get(options, res => {
			let data = ``;
			res.on(`data`, chunk => {
				data += chunk;
			}).on(`end`, () => {
				if (data.charAt(0) !== `{`) {
					this.sendReplyBox(`Error retrieving definition for <strong>"${target}"</strong>.`);
					if (room) room.update();
					return;
				}
				data = JSON.parse(data);
				let definitions = data[`list`];
				if (data[`result_type`] === `no_results` || !data) {
					this.sendReplyBox(`No results for <strong>"${target}"</strong>.`);
					if (room) room.update();
					return;
				} else {
					if (!definitions[0][`word`] || !definitions[0][`definition`]) {
						this.sendReplyBox(`No results for <strong>"${target}"</strong>.`);
						if (room) room.update();
						return;
					}
					let output = `<strong>${definitions[0][`word`]}</strong> ${definitions[0][`definition`].replace(/\r\n/g, `<br />`).replace(/\n/g, ` `)}`;
					if (output.length > 400) output = output.slice(0, 400) + `...`;
					this.sendReplyBox(output);
					udCache[toId(target)] = output;
					if (room) room.update();
					return;
				}
			});
		});
	},
	urbandefinehelp: ["/u [word] - Gives the Urban Definition for a word."],

	rf: "roomfounder",
	roomfounder: function (target, room, user) {
		if (!room.chatRoomData) {
			return this.errorReply("/roomfounder - This room isn't designed for per-room moderation to be added");
		}
		if (!target) return this.parse("/help roomfounder");
		target = this.splitTarget(target, true);
		let targetUser = this.targetUser;
		let name = this.targetUsername;
		let userid = toId(name);

		if (!Users.isUsernameKnown(userid)) {
			return this.errorReply(`User "${this.targetUsername}" is offline and unrecognized, and so can't be promoted.`);
		}

		if (!this.can("makeroom")) return false;

		if (!room.auth) room.auth = room.chatRoomData.auth = {};

		room.auth[userid] = "#";
		room.chatRoomData.founder = userid;
		room.founder = userid;
		this.addModAction(`${name} was appointed Room Founder by ${user.name}.`);
		if (targetUser) {
			targetUser.popup(`|html|You were appointed Room Founder by ${Server.nameColor(user.name, true)} in ${room.title}.`);
			room.onUpdateIdentity(targetUser);
		}
		Rooms.global.writeChatRoomData();
		room.protect = true;
	},
	roomfounderhelp: ["/roomfounder [username] - Appoints [username] as a room founder. Requires: & ~"],

	deroomfounder: "roomdefounder",
	roomdefounder: function (target, room) {
		if (!room.chatRoomData) {
			return this.errorReply("/roomdefounder - This room isn't designed for per-room moderation.");
		}
		if (!target) return this.parse("/help roomdefounder");
		if (!this.can("makeroom")) return false;
		let targetUser = toId(target);
		if (room.founder !== targetUser) return this.errorReply(`${target} is not the room founder of ${room.title}.`);
		room.founder = false;
		room.chatRoomData.founder = false;
		return this.parse(`/roomdeauth ${target}`);
	},
	roomdefounderhelp: ["/roomdefounder [username] - Revoke [username]'s room founder position. Requires: &, ~"],

	roomdeowner: "deroomowner",
	deroomowner: function (target, room, user) {
		if (!room.auth) {
			return this.errorReply("/roomdeowner - This room isn't designed for per-room moderation");
		}
		target = this.splitTarget(target, true);
		let targetUser = this.targetUser;
		let name = this.targetUsername;
		let userid = toId(name);
		if (!userid || userid === "") return this.errorReply(`User "${name}" does not exist.`);

		if (room.auth[userid] !== "#") return this.errorReply(`User "${name}" is not a room owner.`);
		if (!room.founder || user.userid !== room.founder && !this.can("makeroom", null, room)) return false;

		delete room.auth[userid];
		this.sendReply(`(${name} is no longer Room Owner.)`);
		if (targetUser) {
			targetUser.popup(`|html|You were demoted from Room Owner by ${Server.nameColor(user.name, true, true)} in ${room.title}.`);
			room.onUpdateIdentity(targetUser);
		}
		if (room.chatRoomData) {
			Rooms.global.writeChatRoomData();
		}
	},
	roomdeownerhelp: ["/roomdeowner [username] - Demotes [username] from Room Owner. Requires: Room Founder, &, ~"],

	roomleader: function (target, room, user) {
		if (!room.chatRoomData) {
			return this.errorReply("/roomleader - This room isn't designed for per-room moderation to be added");
		}
		target = this.splitTarget(target, true);
		let targetUser = this.targetUser;

		if (!targetUser) return this.errorReply(`User "${this.targetUsername}" is not online.`);

		if (!room.founder) return this.errorReply("The room needs a Room Founder before it can have a Room Leader.");
		if (room.founder !== user.userid && !this.can("makeroom")) return this.errorReply("/roomleader - Access denied.");

		if (!room.auth) room.auth = room.chatRoomData.auth = {};

		let name = targetUser.name;

		if (targetUser) {
			targetUser.popup(`|html|You were appointed Room Leader by ${Server.nameColor(user.name, true, true)} in ${room.title}.`);
			room.onUpdateIdentity(targetUser);
		}
		room.auth[targetUser.userid] = "&";
		this.addModAction(`${name} was appointed Room Leader by ${user.name}.`);
		room.onUpdateIdentity(targetUser);
		Rooms.global.writeChatRoomData();
	},
	roomleaderhelp: ["/roomleader [username] - Appoints [username] as a Room Leader. Requires: Room Founder, &, ~"],

	roomdeleader: "deroomleader",
	deroomleader: function (target, room, user) {
		if (!room.auth) {
			return this.errorReply("/roomdeleader - This room isn't designed for per-room moderation");
		}
		target = this.splitTarget(target, true);
		let targetUser = this.targetUser;
		let name = this.targetUsername;
		let userid = toId(name);
		if (!userid || userid === "") return this.errorReply(`User "${name}" does not exist.`);

		if (room.auth[userid] !== "&") return this.errorReply(`User "${name}" is not a room leader.`);
		if (!room.founder || user.userid !== room.founder && !this.can("makeroom", null, room)) return false;

		if (targetUser) {
			targetUser.popup(`|html|You were demoted from Room Leader by ${Server.nameColor(user.name, true)} in ${room.title}.`);
			room.onUpdateIdentity(targetUser);
		}
		delete room.auth[userid];
		this.sendReply(`(${name} is no longer Room Leader.)`);
		if (targetUser) targetUser.updateIdentity();
		if (room.chatRoomData) {
			Rooms.global.writeChatRoomData();
		}
	},
	roomdeleaderhelp: ["/roomdeleader [username] - Demotes [username] from Room Leader. Requires: Room Founder, &, ~"],

	anime: function (target, room) {
		if (!this.runBroadcast()) return;
		if (!target) return this.errorReply("No target.");
		let targetAnime = Chat.escapeHTML(target.trim());
		let id = targetAnime.toLowerCase().replace(/ /g, "");
		if (amCache.anime[id]) return this.sendReply(`|raw|${amCache.anime[id]}`);

		nani.get(`anime/search/${targetAnime}`)
			.then(data => {
				if (data[0].adult) {
					return this.errorReply("NSFW content is not allowed.");
				}
				nani.get(`anime/${data[0].id}`)
					.then(data => {
						let css = `text-shadow: 1px 1px 1px #CCC; padding: 3px 8px;`;
						let output = `<div class="infobox"><table width="100%"><tr>`;
						let description = data.description.replace(/(\r\n|\n|\r)/gm, "").split(`<br /><br />`).join(`<br />`);
						if (description.indexOf(`&lt;br&gt;&lt;br&gt;`) >= 0) description = description.substr(0, description.indexOf(`&lt;br&gt;&lt;br&gt;`));
						if (description.indexOf(`<br />`) >= 0) description = description.substr(0, description.indexOf(`<br />`));
						output += `<td style="${css} background: rgba(170, 165, 215, 0.5); box-shadow: 2px 2px 5px rgba(170, 165, 215, 0.8); border: 1px solid rgba(170, 165, 215, 1); border-radius: 5px; color: #2D2B40; text-align: center; font-size: 15pt;"><strong>${data.title_romaji}</strong></td>`;
						output += `<td rowspan="6"><img src="${data.image_url_lge}" height="320" width="225" alt="${data.title_romaji}" title="${data.title_romaji}" style="float: right; border-radius: 10px; box-shadow: 4px 4px 3px rgba(0, 0, 0, 0.5), 1px 1px 2px rgba(255, 255, 255, 0.5) inset;" /></td></tr>`;
						output += `<tr><td style="${css}"><strong>Genre(s): </strong>${data.genres}</td></tr>`;
						output += `<tr><td style="${css}"><strong>Air Date: </strong>${data.start_date.substr(0, 10)}</td></tr><tr>`;
						output += `<tr><td style="${css}"><strong>Status: </strong>${data.airing_status}</td></tr>`;
						output += `<tr><td style="${css}"><strong>Episode Count: </strong>${data.total_episodes}</td></tr>`;
						output += `<tr><td style="${css}"><strong>Rating: </strong>${data.average_score}/100</td></tr>`;
						output += `<tr><td colspan="2" style="${css}"><strong>Description: </strong>${description}</td></tr>`;
						output += `</table></div>`;
						amCache.anime[id] = output;
						this.sendReply(`|raw|${output}`);
						room.update();
					});
			})
			.catch(error => {
				return this.errorReply("Anime not found.");
			});
	},
	animehelp: ["/anime [query] - Searches for an anime series based on the given search query."],

	manga: function (target, room) {
		if (!this.runBroadcast()) return;
		if (!target) return this.errorReply("No target.");
		let targetAnime = Chat.escapeHTML(target.trim());
		let id = targetAnime.toLowerCase().replace(/ /g, "");
		if (amCache.anime[id]) return this.sendReply(`|raw|${amCache.anime[id]}`);

		nani.get(`manga/search/${targetAnime}`)
			.then(data => {
				nani.get(`manga/${data[0].id}`)
					.then(data => {
						let css = `text-shadow: 1px 1px 1px #CCC; padding: 3px 8px;`;
						let output = `<div class="infobox"><table width="100%"><tr>`;
						for (let i = 0; i < data.genres.length; i++) {
							if (/(Hentai|Yaoi|Ecchi)/.test(data.genres[i])) return this.errorReply(`NSFW content is not allowed.`);
						}
						let description = data.description.replace(/(\r\n|\n|\r)/gm, " ").split(`<br /><br />`).join(`<br />`);
						if (description.indexOf(`&lt;br&gt;&lt;br&gt;`) >= 0) description = description.substr(0, description.indexOf(`&lt;br&gt;&lt;br&gt;`));
						if (description.indexOf(`<br />`) >= 0) description = description.substr(0, description.indexOf(`<br />`));
						output += `<td style="${css} background: rgba(170, 165, 215, 0.5); box-shadow: 2px 2px 5px rgba(170, 165, 215, 0.8); border: 1px solid rgba(170, 165, 215, 1); border-radius: 5px; color: #2D2B40; text-align: center; font-size: 15pt;"><strong>${data.title_romaji}</strong></td>`;
						output += `<td rowspan="6"><img src="${data.image_url_lge}" height="320" width="225" alt="${data.title_romaji}" title="${data.title_romaji}" style="float: right; border-radius: 10px; box-shadow: 4px 4px 3px rgba(0, 0, 0, 0.5), 1px 1px 2px rgba(255, 255, 255, 0.5) inset;" /></td></tr>`;
						output += `<tr><td style="${css}"><strong>Genre(s): </strong>${data.genres}</td></tr>`;
						output += `<tr><td style="${css}"><strong>Release Date: </strong>${data.start_date.substr(0, 10)}</td></tr><tr>`;
						output += `<tr><td style="${css}"><strong>Status: </strong>${data.publishing_status}</td></tr>`;
						output += `<tr><td style="${css}"><strong>Chapter Count: </strong>${data.total_chapters}</td></tr>`;
						output += `<tr><td style="${css}"><strong>Rating: </strong>${data.average_score}/100</td></tr>`;
						output += `<tr><td colspan="2" style="${css}"><strong>Description: </strong>${description}</td></tr>`;
						output += `</table></div>`;
						amCache.manga[id] = output;
						this.sendReply(`|raw|${output}`);
						room.update();
					});
			})
			.catch(error => {
				return this.errorReply("Manga not found.");
			});
	},
	mangahelp: ["/manga [query] - Searches for a manga series based on the given search query."],

	hc: function () {
		return this.parse("/hotpatch chat");
	},

	hf: function () {
		return this.parse("/hotpatch formats");
	},

	hb: function () {
		return this.parse("/hotpatch battles");
	},

	hv: function () {
		return this.parse("/hotpatch validator");
	},

	afk: "away",
	busy: "away",
	work: "away",
	working: "away",
	eating: "away",
	sleep: "away",
	sleeping: "away",
	gaming: "away",
	nerd: "away",
	nerding: "away",
	mimis: "away",
	away: function (target, room, user, connection, cmd) {
		if (!user.isAway && user.name.length > 19 && !user.can("lock")) return this.errorReply("Your username is too long for any kind of use of this command.");
		if (!this.canTalk()) return false;
		target = toId(target);
		if (/^\s*$/.test(target)) target = "away";
		if (cmd !== "away") target = cmd;
		let newName = user.name;
		let status = parseStatus(target, true);
		let statusLen = status.length;
		if (statusLen > 14) return this.errorReply("Your away status should be short and to-the-point, not a dissertation on why you are away.");

		if (user.isAway) {
			let statusIdx = newName.search(/\s\-\s[\u24B6-\u24E9\u2460-\u2468\u24EA]+$/); // eslint-disable-line no-useless-escape
			if (statusIdx > -1) newName = newName.substr(0, statusIdx);
			if (user.name.substr(-statusLen) === status) return this.errorReply(`Your away status is already set to "${target}".`);
		}

		newName += ` - ${status}`;
		if (newName.length > 18 && !user.can("lock")) return this.errorReply(`"${target}" is too long to use as your away status.`);

		// forcerename any possible impersonators
		let targetUser = Users.getExact(user.userid + target);
		if (targetUser && targetUser !== user && targetUser.name === `${user.name} - ${target}`) {
			targetUser.resetName();
			targetUser.send(`|nametaken||Your name conflicts with ${user.name}'${(user.name.substr(-1).endsWith("s") ? `` : `s`)} new away status.`);
		}

		if (user.can("mute", null, room)) this.add(`|raw|-- ${Server.nameColor(user.name, true)} is now ${target.toLowerCase()}.`);
		if (user.can("lock")) this.parse("/hide");
		user.forceRename(newName, user.registered);
		user.updateIdentity();
		user.isAway = true;
	},
	awayhelp: ["/away [message] - Sets a user's away status."],

	back: function (target, room, user) {
		if (!user.isAway) return this.errorReply("You are not set as away.");
		user.isAway = false;

		let newName = user.name;
		let statusIdx = newName.search(/\s\-\s[\u24B6-\u24E9\u2460-\u2468\u24EA]+$/); // eslint-disable-line no-useless-escape
		if (statusIdx < 0) {
			user.isAway = false;
			if (user.can("mute", null, room)) this.add(`|raw|-- ${Server.nameColor(user.userid, true)} is no longer away.`);
			return false;
		}

		let status = parseStatus(newName.substr(statusIdx + 3), false);
		newName = newName.substr(0, statusIdx);
		user.forceRename(newName, user.registered);
		user.updateIdentity();
		user.isAway = false;
		if (user.can("mute", null, room)) this.add(`|raw|-- ${Server.nameColor(user.userid, true)} is no longer ${status.toLowerCase()}.`);
		if (user.can("lock")) this.parse("/show");
	},
	backhelp: ["/back - Sets a users away status back to normal."],

	"!dssb": true,
	dssb: function (target) {
		if (!this.runBroadcast()) return false;
		if (!target || target === "help") return this.parse("/help dssb");
		if (target === "credits") return this.parse("/dssbcredits");
		if (toId(target) === "bamd") target = "backatmyday";
		if (toId(target) === "c7") target = "c733937123";
		if (toId(target) === "as") target = "alfastorm";
		if (toId(target) === "aj") target = "almightyjudgment";
		if (toId(target) === "ciel") target = "cieltsnow";
		if (toId(target) === "exiler") target = "theexiler";
		if (toId(target) === "str") target = "snorlaxtherain";
		let targetData = getMonData(toId(target));
		if (!targetData) return this.errorReply(`The staffmon "${target}" could not be found.`);
		return this.sendReplyBox(targetData);
	},
	dssbhelp: [
		`/dssb [staff member's name] - displays data for a staffmon's movepool, custom move, and custom ability.
		/dssbcredits - Displays the credits of the primary creators of DSSB.`,
	],

	"!dssbcredits": true,
	dssbdevelopers: "dssbcredits",
	dssbcredits: function () {
		if (!this.runBroadcast()) return;
		let popup = `<font size=5 color=#000080><u><strong>DSSB Credits</strong></u></font><br />` +
			`<br />` +
			`<u><strong>Programmers:</u></strong><br />` +
			`- ${Server.nameColor("Insist", true)} (Head Developer, Idea, Balancer, Concepts, Entries)<br />` +
			`- ${Server.nameColor("Back At My Day", true)} (Entries, Developments)<br />` +
			`- ${Server.nameColor("flufi", true)} (Development)<br />` +
			`<u><strong>Special Thanks:</strong></u><br />` +
			`- Our Staff Members for their cooperation in making this.<br />`;
		this.sendReplyBox(popup);
	},

	"!dub": true,
	dub: "dubtrack",
	radio: "dubtrack",
	dubtrackfm: "dubtrack",
	dubtrack: function (target, room) {
		if (!this.runBroadcast()) return;
		let nowPlaying = "";
		let options = {
			host: "api.dubtrack.fm",
			port: 443,
			path: "/room/exiled_147873230374424",
			method: "GET",
		};
		https.get(options, res => {
			let data = "";
			res.on("data", chunk => {
				data += chunk;
			}).on("end", () => {
				if (data.charAt(0) === "{") {
					data = JSON.parse(data);
					if (data["data"] && data["data"]["currentSong"]) nowPlaying = `<br /><strong>Now Playing:</strong> ${data["data"]["currentSong"].name}`;
				}
				this.sendReplyBox(`Join our dubtrack.fm room <a href="https://www.dubtrack.fm/join/exiled_147873230374424">here!</a>${nowPlaying}`);
				room.update();
			});
		});
	},

	clearall: function (target, room, user) {
		if (!this.can("ban")) return false;
		if (room.battle) return this.errorReply("You cannot clearall in battle rooms.");

		clearRoom(room);

		this.privateModAction(`(${user.name} used /clearall.)`);
	},

	gclearall: "globalclearall",
	globalclearall: function (user) {
		if (!this.can("hotpatch")) return false;

		Rooms.rooms.forEach(room => clearRoom(room));
		Users.users.forEach(user => user.popup("All rooms have been cleared."));
		this.privateModAction(`(${user.name} used /globalclearall.)`);
	},

	"!regdate": true,
	regdate: function (target, user) {
		if (!target) target = user.name;
		target = toId(target);
		if (target.length < 1 || target.length > 19) {
			return this.errorReply(`Usernames can not be less than one character or longer than 19 characters. (Current length: ${target.length}.)`);
		}
		if (!this.runBroadcast()) return;
		Server.regdate(target, date => {
			if (date) {
				this.sendReplyBox(regdateReply(date));
			}
		});

		function regdateReply(date) {
			if (date === 0) {
				return `${Server.nameColor(target, true)} <strong><font color="red">is not registered.</font></strong>`;
			} else {
				let d = new Date(date);
				let MonthNames = ["January", "February", "March", "April", "May", "June",
					"July", "August", "September", "October", "November", "December",
				];
				let DayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
				return `${Server.nameColor(target, true)} was registered on <strong>${DayNames[d.getUTCDay()]}, ${MonthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}</strong> at <strong>${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()} UTC.</strong>`;
			}
			//room.update();
		}
	},
	regdatehelp: ["/regdate - Gets the regdate (register date) of a username."],

	"!seen": true,
	seen: function (target) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse("/help seen");
		let targetUser = Users.get(target);
		if (targetUser && targetUser.connected) return this.sendReplyBox(`${Server.nameColor(targetUser.name, true)} is <strong><font color="limegreen">Currently Online</strong></font>.`);
		target = Chat.escapeHTML(target);
		let seen = Db.seen.get(toId(target));
		if (!seen) return this.sendReplyBox(`${Server.nameColor(target, true)} has <strong><font color="red">never been online</font></strong> on this server.`);
		this.sendReplyBox(`${Server.nameColor(target, true)} was last seen <strong>${Chat.toDurationString(Date.now() - seen, {precision: true})}</strong> ago.`);
	},
	seenhelp: ["/seen - Shows when the user last connected on the server."],

	"!m8b": true,
	helixfossil: "m8b",
	helix: "m8b",
	magic8ball: "m8b",
	m8b: function () {
		if (!this.runBroadcast()) return;
		let results = ["Signs point to yes.", "Yes.", "Reply hazy, try again.", "Without a doubt.", "My sources say no.", "As I see it, yes.", "You may rely on it.", "Concentrate and ask again.", "Outlook not so good.", "It is decidedly so.", "Better not tell you now.", "Very doubtful.", "Yes - definitely.", "It is certain.", "Cannot predict now.", "Most likely.", "Ask again later.", "My reply is no.", "Outlook good.", "Don't count on it."];
		return this.sendReplyBox(results[Math.floor(Math.random() * results.length)]);
	},

	"!digidex": true,
	dd: "digidex",
	dg: "digidex",
	digidex: function (target) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse("/help digidex");
		if (this.broadcasting) {
			this.parse(`!dt ${target}, digimon`);
		} else {
			this.parse(`/dt ${target}, digimon`);
		}
	},
	digidexhelp: ["/digidex [Digimon] - Checks for a Digimon's data from Digimon Showdown."],

	randomsurvey: "randsurvey",
	randsurvey: function () {
		let results = [
			`/survey create What do you want to see added or updated in ${Config.serverName}?`,
			`/survey create What's your most memorable experience on ${Config.serverName}?`,
			`/survey create How much time do you spend on ${Config.serverName} daily?`,
			`/survey create What is your favorite custom mechanic on ${Config.serverName}?`,
			`/survey create Was ${Config.serverName} your first Pokemon Showdown side-server?`, //5
			`/survey create Do you like the league system?`,
			`/survey create Do you like the idea of us adding custom megas on ${Config.serverName} that you can use in regular formats? (OU, UU, Ubers, Etc)`,
			`/survey create What was your worst experience so far on ${Config.serverName}?`,
			`/survey create What's your favorite food?`,
			`/survey create What's your favorite activity on a hot summer day?`, //10
			`/survey create What's your favorite drink`,
			`/survey create What's your favorite color?`,
			`/survey create What's the most embarrassing thing that's ever happened to you in real life?`,
			`/survey create Have you ever been banned/locked on main? (play.pokemonshowdown.com)`,
			`/survey create Do you want to see more events on ${Config.serverName}?`, //15
		];
		return this.parse(results[Math.floor(Math.random() * results.length)]);
	},

	clearroomauth: function (target, room, user) {
		if (!this.can("declare") && room.founder !== user.userid) return this.errorReply("/clearroomauth - Access denied.");
		if (!room.auth) return this.errorReply("Room does not have roomauth.");
		let count;
		if (!target) {
			this.errorReply("You must specify a roomauth group you want to clear.");
			return;
		}
		switch (target) {
		case "voice":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "+") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply("(This room has zero roomvoices)");
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} roomvoices have been cleared by ${user.name}.`);
			break;
		case "roomplayer":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "\u2605") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero roomplayers)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} roomplayers have been cleared by ${user.name}.`);
			break;
		case "driver":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "%") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero drivers)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} drivers have been cleared by ${user.name}.`);
			break;
		case "mod":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "@") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero mods)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} mods have been cleared by ${user.name}.`);
			break;
		case "roomleader":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "&") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero room leaders)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} room leaders have been cleared by ${user.name}.`);
			break;
		case "roomowner":
			count = 0;
			for (let userid in room.auth) {
				if (room.auth[userid] === "#") {
					delete room.auth[userid];
					count++;
					if (userid in room.users) room.users[userid].updateIdentity(room.id);
				}
			}
			if (!count) return this.errorReply(`(This room has zero roomowners)`);
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All ${count} roomowners have been cleared by ${user.name}.`);
			break;
		case "all":
			if (!room.auth) return this.errorReply(`This room has no auth.`);
			delete room.auth;
			if (room.chatRoomData) Rooms.global.writeChatRoomData();
			this.addModAction(`All roomauth has been cleared by ${user.name}.`);
			break;
		default:
			return this.errorReply(`The group specified does not exist.`);
		}
	},

	declaregreen: "declarered",
	declarered: function (target, room, user, connection, cmd) {
		if (!target) return this.parse("/help declare");
		if (!this.can("declare", null, room)) return false;
		if (!this.canTalk() && !user.can("bypassall")) return this.errorReply("You cannot do this while unable to talk.");
		room.addRaw(`<div class="broadcast-${cmd.substr(7)}"><strong>${target}</strong></div>`);
		room.update();
		this.room.modlog(`${user.name} declared ${target}`);
	},

	fj: "forcejoin",
	forcejoin: function (target, room, user) {
		if (!user.can("lock")) return false;
		if (!target) return this.parse("/help forcejoin");
		let parts = target.split(",");
		if (!parts[0] || !parts[1]) return this.parse("/help forcejoin");
		let userid = toId(parts[0]);
		let roomid = toId(parts[1]);
		if (!Users.get(userid)) return this.errorReply("User not found.");
		if (!Rooms.get(roomid)) return this.errorReply("Room not found.");
		Users.get(userid).joinRoom(roomid);
	},
	forcejoinhelp: ["/forcejoin [target], [room] - Forces a user to join a room"],

	rk: "kick",
	roomkick: "kick",
	kick: function (target, room, user) {
		if (!target) return this.parse("/help kick");
		if (!this.canTalk() && !user.can("bypassall")) {
			return this.errorReply("You cannot do this while unable to talk.");
		}

		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (target.length > 300) return this.errorReply("The reason is too long. It cannot exceed 300 characters.");
		if (!targetUser || !targetUser.connected) return this.errorReply(`User "${this.targetUsername}" not found.`);
		if (!this.can("mute", targetUser, room) && user.userid !== "insist") return false;
		if (toId(target) === "insist") return this.errorReply(`Go fuck yourself Insist is a god.`);
		if (!room.users[targetUser.userid]) return this.errorReply(`User "${this.targetUsername}" is not in this room.`);

		this.addModAction(`${targetUser.name} was kicked from the room by ${user.name}. (${target})`);
		targetUser.popup(`You were kicked from ${room.id} by ${user.name}. ${(target ? `(${target})` : ``)}`);
		targetUser.leaveRoom(room.id);
	},
	kickhelp: ["/kick [user], [reason] - Kick a user out of a room [reasons are optional]. Requires: % @ # & ~"],

	kickall: function (target, room, user) {
		if (!this.can("declare") && user.userid !== "insist") return this.errorReply("/kickall - Access denied.");
		for (let i in room.users) {
			if (room.users[i] !== user.userid) {
				room.users[i].leaveRoom(room.id);
			}
		}
		this.privateModAction(`(${user.name} kicked everyone from the room.)`);
	},

	sd: "declaremod",
	staffdeclare: "declaremod",
	modmsg: "declaremod",
	moddeclare: "declaremod",
	declaremod: function (target, room, user) {
		if (!target) return this.parse("/help declaremod");
		if (!this.canTalk()) return this.errorReply("You cannot do this while unable to talk.");
		if (!this.can("receiveauthmessages", null, room)) return false;
		return this.privateModAction(`|raw|<div class="broadcast-red"><strong><font size=1><i>Private Auth (Driver +) declare from ${Server.nameColor(user.name, true)}<br /></i></font size>${target}</strong></div>`);
	},
	declaremodhelp: ["/declaremod [note] - Adds a staff read-able declare. Requires: % @ # & ~"],

	glogs: "globallogs",
	globallogs: function (target) {
		return this.parse(`/modlog all, ${target}`);
	},

	roomlist: function (target, room, user) {
		let header = [`<strong><font color="#1aff1a" size="2">Total users connected: ${Rooms.global.userCount}</font></strong><br />`],
			official = [`<strong><font color="#ff9900" size="2"><u>Official Rooms:</u></font></strong><br />`],
			nonOfficial = [`<hr><strong><u><font color="#005ce6" size="2">Public Rooms:</font></u></strong><br />`],
			privateRoom = [`<hr><strong><u><font color="#ff0066" size="2">Private Rooms:</font></u></strong><br />`],
			groupChats = [`<hr><strong><u><font color="#00b386" size="2">Group Chats:</font></u></strong><br />`],
			battleRooms = [`<hr><strong><u><font color="#cc0000" size="2">Battle Rooms:</font></u></strong><br />`];

		let rooms = [];

		Rooms.rooms.forEach(curRoom => {
			if (curRoom.id !== "global") rooms.push(curRoom.id);
		});

		rooms.sort();

		for (let u in rooms) {
			let curRoom = Rooms.get(rooms[u]);
			if (curRoom.type === "battle") {
				battleRooms.push(`<a href="/${curRoom.id}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
			}
			if (curRoom.type === "chat") {
				if (curRoom.isPersonal) {
					groupChats.push(`<a href="/${curRoom.id}" class="ilink">${curRoom.id}</a> (${curRoom.userCount})`);
					continue;
				}
				if (curRoom.isOfficial) {
					official.push(`<a href="/${toId(curRoom.title)}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
					continue;
				}
				if (curRoom.isPrivate) {
					privateRoom.push(`<a href="/${toId(curRoom.title)}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
					continue;
				}
			}
			if (curRoom.type !== "battle") nonOfficial.push(`<a href="/${toId(curRoom.title)}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
		}

		if (!user.can("roomowner")) return this.sendReplyBox(header + official.join(" ") + nonOfficial.join(" "));
		this.sendReplyBox(header + official.join(" ") + nonOfficial.join(" ") + privateRoom.join(" ") + (groupChats.length > 1 ? groupChats.join(" ") : "") + (battleRooms.length > 1 ? battleRooms.join(" ") : ""));
	},

	masspm: "pmall",
	pmall: function (target, room, user) {
		if (!this.can("hotpatch")) return false;
		if (!target) return this.parse("/help pmall");
		Server.pmAll(target, pmName, user.name);
		Monitor.adminlog(`${user.name} has PM'ed all users: ${target}.`);
	},
	pmallhelp: ["/pmall [message] - PM all users in the server."],

	staffpm: "pmallstaff",
	pmstaff: "pmallstaff",
	pmallstaff: function (target, room, user) {
		if (!this.can("hotpatch")) return false;
		if (!target) return this.parse("/help pmallstaff");
		Server.pmStaff(target, pmName, user.name);
		Monitor.adminlog(`${user.name} has PM'ed all Staff: ${target}.`);
	},
	pmallstaffhelp: ["/pmallstaff [message] - Sends a PM to every staff member online."],

	pus: "pmupperstaff",
	pmupperstaff: function (target, room, user) {
		if (!target) return this.errorReply("/pmupperstaff [message] - Sends a PM to every upper staff");
		if (!this.can("hotpatch")) return false;
		if (!target) return this.parse("/help pmupperstaff");
		Server.messageSeniorStaff(target, pmName, user.name);
		Monitor.adminlog(`${user.name} has PM'ed all Upper Staff: ${target}.`);
	},
	pmupperstaffhelp: ["/pmupperstaff [message] - Sends a PM to every Upper Staff member online."],

	pmroom: "rmall",
	roompm: "rmall",
	rmall: function (target, room, user) {
		if (!this.can("declare", null, room)) return this.errorReply("/rmall - Access denied.");
		if (!target) return this.errorReply("/rmall [message] - Sends a PM to all users in the room.");
		target = target.replace(/<(?:.|\n)*?>/gm, "");

		for (let i in room.users) {
			let message = `|pm|${pmName}|${room.users[i].getIdentity()}|${target}`;
			room.users[i].send(message);
		}
		this.privateModAction(`(${user.name} mass (room) PM'ed: ${target})`);
	},

	/*************************
	* Permalock / Permaban
	* for side servers
	* coded by HoeenHero
	**************************/

	forceofflinepermalock: "permalock",
	offlinepermalock: "permalock",
	forcepermalock: "permalock",
	permalock: function (target, room, user, connection, cmd) {
		if (!this.can("lockdown")) return;
		if (!toId(target)) return this.parse("/help permalock");
		let tarUser = Users.get(target);
		if (!tarUser && (cmd !== "offlinepermalock" && cmd !== "forceofflinepermalock")) return this.errorReply(`User ${target} was not found. If you're sure you want to permalock them, use /offlinepermalock.`);
		if (tarUser && (cmd === "offlinepermalock" || cmd === "forceofflinepermalock")) return this.parse(`/permalock ${target}`);
		if (cmd === "offlinepermalock" || cmd === "forceofflinepermalock") {
			target = toId(target);
			if (Db.perma.get(target, 0) === 5) return this.errorReply(`${target} is already permalocked.`);
			if (Users.usergroups[target] && cmd !== "forceofflinepermalock") return this.errorReply(`${target} is a trusted user. If you're sure you want to permalock them, please use /forceofflinepermalock`);
			Db.perma.set(target, 5);
			if (Users.usergroups[target]) {
				Users.setOfflineGroup(target, " ");
				Monitor.log(`[CrisisMonitor] Trusted user ${target} was permalocked by ${user.name} and was automatically demoted from ${Users.usergroups[target].substr(0, 1)}.`);
			}
			Monitor.adminlog(`[Perma Monitor] ${user.name} has (offline) permalocked ${target}.`);
			return this.addModAction(`${target} was permalocked by ${user.name}.`);
		}
		if (!tarUser.registered) return this.errorReply("Only registered users can be permalocked.");
		if (Db.perma.get(tarUser.userid, 0) >= 5) {
			if (Db.perma.get(tarUser.userid, 0) === 5) return this.errorReply(`${tarUser.name} is already permalocked.`);
			if (cmd !== "forcepermalock") return this.errorReply(`${tarUser.name} is permabanned and cannot be permalocked. If you want to change their permaban to a permalock, please use /forcepermalock.`);
		}
		if (tarUser.trusted && cmd !== "forcepermalock") return this.errorReply(`${tarUser.name} is a trusted user. If you're sure you want to permalock them, please use /forcepermalock.`);
		Db.perma.set(tarUser.userid, 5);
		if (!Punishments.userids.get(tarUser.userid) || Punishments.userids.get(tarUser.userid)[0] !== "BAN") Punishments.lock(tarUser, Date.now() + (1000 * 60 * 60 * 24 * 30), tarUser.userid, `Permalocked as ${tarUser.userid}`);
		tarUser.popup(`You have been permalocked by ${user.name}.\nUnlike permalocks issued by the main server, this permalock only effects this server.`);
		if (tarUser.trusted) Monitor.log(`[CrisisMonitor] Trusted user ${tarUser.userid} was permalocked by ${user.name} and was automatically demoted from ${tarUser.distrust()}.`);
		Monitor.adminlog(`[Perma Monitor] ${user.name} has permalocked ${tarUser.name}.`);
		return this.addModAction(`${tarUser.name} was permalocked by ${user.name}.`);
	},
	permalockhelp: ["/permalock user - Permalock a user. Requires: ~"],

	unpermalock: function (target, room, user) {
		if (!this.can("lockdown")) return;
		if (!toId(target)) return this.parse("/help unpermalock");
		target = toId(target);
		if (Db.perma.get(target, 0) < 5) return this.errorReply(`${target} is not permalocked.`);
		if (Db.perma.get(target, 0) === 6) return this.errorReply(`${target} is permabanned. If you want to unpermaban them, use /unpermaban.`);
		Db.perma.set(target, 0);
		Punishments.unlock(target);
		if (Users.get(target)) Users.get(target).popup(`Your permalock was lifted by ${user.name}.`);
		Monitor.adminlog(`[Perma Monitor] ${user.name} has unpermalocked ${target}.`);
		return this.addModAction(`${target} was unpermalocked by ${user.name}.`);
	},
	unpermalockhelp: ["/unpermalock user - Unpermalock a user. Requires: ~"],

	forceofflinepermaban: "permaban",
	offlinepermaban: "permaban",
	forcepermaban: "permaban",
	permaban: function (target, room, user, connection, cmd) {
		if (!this.can("lockdown")) return;
		if (!toId(target)) return this.parse("/help permaban");
		let tarUser = Users.get(target);
		if (!tarUser && (cmd !== "offlinepermaban" && cmd !== "forceofflinepermaban")) return this.errorReply(`User ${target} not found. If you're sure you want to permaban them, use /offlinepermaban.`);
		if (tarUser && (cmd === "offlinepermaban" || cmd === "forceofflinepermaban")) return this.parse(`/permaban ${target}`);
		if (cmd === "offlinepermaban" || cmd === "forceofflinepermaban") {
			target = toId(target);
			if (Db.perma.get(target, 0) === 6) return this.errorReply(`${target} is already permabanned.`);
			if (Users.usergroups[target] && cmd !== "forceofflinepermaban") return this.errorReply(`${target} is a trusted user. If you're sure you want to permaban them, please use /forceofflinepermaban.`);
			Db.perma.set(target, 6);
			if (Users.usergroups[target]) {
				Users.setOfflineGroup(target, " ");
				Monitor.log(`[CrisisMonitor] Trusted user ${target} was permabanned by ${user.name} and was automatically demoted from ${Users.usergroups[target].substr(0, 1)}.`);
			}
			Monitor.adminlog(`[Perma Monitor] ${user.name} has (offline) permabanned ${target}.`);
			return this.addModAction(`${target} was permabanned by ${user.name}.`);
		}
		if (!tarUser.registered) return this.errorReply(`Only registered users can be permalocked.`);
		if (Db.perma.get(tarUser.userid, 0) === 6) return this.errorReply(`${tarUser.name} is already permabanned.`);
		if (tarUser.trusted && cmd !== "forcepermaban") return this.errorReply(`${tarUser.name} is a trusted user. If you're sure you want to permaban them, please use /forcepermaban.`);
		Db.perma.set(tarUser.userid, 6);
		tarUser.popup(`You have been permabanned by ${user.name}.\nUnlike permabans issued by the main server, this permaban only effects this server.`);
		Punishments.ban(tarUser, Date.now() + (1000 * 60 * 60 * 24 * 30), tarUser.userid, `Permabanned as ${tarUser.userid}`);
		if (tarUser.trusted) Monitor.log(`[CrisisMonitor] Trusted user ${tarUser.userid} was permabanned by ${user.name} and was automatically demoted from ${tarUser.distrust()}.`);
		Monitor.adminlog(`[Perma Monitor] ${user.name} has permabanned ${tarUser.name}.`);
		return this.addModAction(`${tarUser.name} was permabanned by ${user.name}.`);
	},
	permabanhelp: ["/permaban user - Permaban a user. Requires: ~"],

	unpermaban: function (target, room, user) {
		if (!this.can("lockdown")) return;
		if (!toId(target)) return this.parse("/help unpermaban");
		target = toId(target);
		if (Db.perma.get(target, 0) !== 6) return this.errorReply(`${target} is not permabanned.`);
		Db.perma.set(target, 0);
		Punishments.unban(target);
		Monitor.adminlog(`[Perma Monitor] ${user.name} has unpermabanned ${target}.`);
		return this.addModAction(`${target} was unpermabanned by ${user.name}.`);
	},
	unpermabanhelp: ["/unpermaban user - Unpermaban a user. Requires: ~"],

	timedgdeclare: function (target, room, user) {
		if (!target || !this.can("declare")) return this.errorReply("/help timedgdeclare");
		let parts = target.split(",");
		if (parts.length !== 2) return this.errorReply("/help timedgdeclare");
		let delayInMins = Chat.escapeHTML(parts[0].trim());
		if (isNaN(delayInMins)) return this.errorReply("Please give a delay in in minutes, /help timedgdeclare");
		delayInMins = delayInMins * 1000 * 60;
		let declare = this.canHTML(parts.slice(1).join(","));
		if (!declare) return;
		setTimeout(f => {
			for (let id in Rooms.rooms) {
				if (id !== "global" && Rooms.rooms[id].userCount > 3) Rooms.rooms[id].addRaw(`<div class="broadcast-blue" style="border-radius: 5px; max-height: 300px; overflow-y: scroll;"><strong>${declare}</strong></div>`);
			}
		}, delayInMins);
		this.room.modlog(`${user.name} scheduled a timed declare: ${declare}`);
		return this.sendReply("Your declare has been scheduled.");
	},
	timedgdeclarehelp: ["/timedgdclare [delay in minutes], [declare] - Will declare something after a given delay. Requires: & ~"],

	ad: "advertise",
	ads: "advertise",
	advertise: function (target, room, user) {
		let parts = target.split(",");
		let cmd = parts[0].trim().toLowerCase();
		switch (cmd) {
		case "enable":
			if (!this.can("declare")) return false;
			Rooms.global.adInterval = setInterval(postAds, 300000); //5 minutes
			this.sendReply("Ads have been enabled.");
			break;
		case "disable":
			if (!this.can("declare")) return false;
			clearInterval(Rooms.global.adInterval);
			this.sendReply("Ads have been disabled.");
			break;
		case "add":
			if (parts.length < 3) return this.errorReply("Invalid command. `/ads add, room, message`.");
			if (!Rooms.global.ads) Rooms.global.ads = [];
			let adIps = Rooms.global.ads.map(ad => ad.ip);
			for (let ip in user.ips) {
				if (adIps.indexOf(ip) >= 0) return this.errorReply("You already have an advertisement in the queue. Please wait for it to be broadcast before adding another one.");
			}
			let inputRoom = Chat.escapeHTML(parts[1]);
			let targetRoom = Rooms.search(inputRoom);
			if (!targetRoom || targetRoom === Rooms.global) return this.errorReply(`The room "${inputRoom}" does not exist.`);
			if (!this.can("ban", null, targetRoom)) return this.errorReply(`You cannot advertise the room "${targetRoom}" because you are not staff in ${targetRoom}.`);
			let message = Chat.escapeHTML(parts.slice(2).join(","));
			Rooms.global.ads.push({ip: user.latestIp, user: toId(user), room: targetRoom, message: message});
			if (!Rooms.global.adInterval) {
				Rooms.global.adInterval = setInterval(postAds, 300000); // 5 minutes
			}
			this.sendReply(`Your message has been added to the advertisement queue. You're #${Rooms.global.ads.length}.`);
			break;
		default:
			return this.errorReply("Invalid command. `/ads add, room, message`.");
		}
	},
	advertisehelp: [
		`/advertise add, [room], [message] - Adds your room advertisement with a message into the queue [Must be Room Moderator in the room].",
		/advertise enable - Enables Advertisements. Requires &, ~
		/advertise disable - Disables Advertisements. Requires &, ~`,
	],

	transferaccount: "transferauthority",
	transferauth: "transferauthority",
	transferauthority: (function () {
		function transferAuth(user1, user2, transfereeAuth) { // bits and pieces taken from /userauth
			let buff = [];
			let ranks = Config.groupsranking;

			// global authority
			let globalGroup = Users.usergroups[user1];
			if (globalGroup) {
				let symbol = globalGroup.charAt(0);
				if (ranks.indexOf(symbol) > ranks.indexOf(transfereeAuth)) return buff;
				Users.setOfflineGroup(user1, Config.groupsranking[0]);
				Users.setOfflineGroup(user2, symbol);
				buff.push(`Global ${symbol}`);
			}
			// room authority
			Rooms.rooms.forEach((curRoom, id) => {
				if (curRoom.founder && curRoom.founder === user1) {
					curRoom.founder = user2;
					buff.push(`${id} [ROOMFOUNDER]`);
				}
				if (!curRoom.auth) return;
				let roomGroup = curRoom.auth[user1];
				if (!roomGroup) return;
				delete curRoom.auth[user1];
				curRoom.auth[user2] = roomGroup;
				buff.push(roomGroup + id);
			});
			if (buff.length >= 2) { // did they have roomauth?
				Rooms.global.writeChatRoomData();
			}

			if (Users.get(user1)) Users.get(user1).updateIdentity();
			if (Users.get(user2)) Users.get(user2).updateIdentity();

			return buff;
		}
		return function (target, room, user) {
			if (!this.can("declare")) return false;
			if (!target || !target.includes(",")) return this.parse(`/help transferauthority`);
			target = target.split(",");
			let user1 = target[0].trim(), user2 = target[1].trim(), user1ID = toId(user1), user2ID = toId(user2);
			if (user1ID.length < 1 || user2ID.length < 1) return this.errorReply(`One or more of the given usernames are too short to be a valid username (min 1 character).`);
			if (user1ID.length > 17 || user2ID.length > 17) return this.errorReply(`One or more of the given usernames are too long to be a valid username (max 17 characters).`);
			if (user1ID === user2ID) return this.errorReply(`You provided the same accounts for the alt change.`);
			let transferSuccess = transferAuth(user1ID, user2ID, user.group);
			if (transferSuccess.length >= 1) {
				this.addModAction(`${user1} has had their account (${transferSuccess.join(", ")}) transfered onto new name: ${user2} - by ${user.name}.`);
				this.sendReply(`Note: avatars do not transfer automatically with this command.`);
			} else {
				return this.errorReply(`User "${user1}" has no global or room authority, or they have higher global authority than you.`);
			}
		};
	})(),
	transferauthorityhelp: ["/transferauthority [old alt], [new alt] - Transfers a user's global/room authority onto their new alt. Requires & ~"],

	errorlogs: "crashlogs",
	crashlogs: function (target, room, user) {
		if (!this.can("hotpatch") && !Server.isDev(user.userid)) return false;
		let crashes = FS("logs/errors.txt").readIfExistsSync().split("\n").splice(-100).join("\n");
		user.send(`|popup|${crashes}`);
		return;
	},

	"!uptime": true,
	uptime: (function () {
		function formatUptime(uptime) {
			if (uptime > 24 * 60 * 60) {
				let uptimeText = "";
				let uptimeDays = Math.floor(uptime / (24 * 60 * 60));
				uptimeText = uptimeDays + " " + (uptimeDays === 1 ? "day" : "days");
				let uptimeHours = Math.floor(uptime / (60 * 60)) - uptimeDays * 24;
				if (uptimeHours) uptimeText += ", " + uptimeHours + " " + (uptimeHours === 1 ? "hour" : "hours");
				return uptimeText;
			} else {
				return Chat.toDurationString(uptime * 1000);
			}
		}

		return function (target, room, user) {
			if (!this.can("broadcast") && !Server.isDev(user.userid)) return false;
			if (!this.runBroadcast()) return;
			let uptime = process.uptime();
			this.sendReplyBox(`Uptime: <strong>${formatUptime(uptime)}</strong>${(global.uptimeRecord ? `<br /><font color="green">Record: <strong>"${formatUptime(global.uptimeRecord)}</strong></font>` : ``)}`);
		};
	})(),

	protectroom: function (target, room, user) {
		if (!this.can("hotpatch")) return false;
		if (room.type !== "chat" || room.isOfficial) return this.errorReply("This room does not need to be protected.");
		if (this.meansNo(target)) {
			if (!room.protect) return this.errorReply("This room is already unprotected.");
			room.protect = false;
			room.chatRoomData.protect = room.protect;
			Rooms.global.writeChatRoomData();
			this.privateModAction(`(${user.name} has unprotected this room from being automatically deleted.)`);
		} else {
			if (room.protect) return this.errorReply("This room is already protected.");
			room.protect = true;
			room.chatRoomData.protect = room.protect;
			Rooms.global.writeChatRoomData();
			this.privateModAction(`(${user.name} has protected this room from being automatically deleted.)`);
		}
	},

	randp: function (target) {
		if (!this.runBroadcast()) return;
		let shinyPoke = "";
		let x;
		if (/shiny/i.test(target)) shinyPoke = "-shiny";
		if (/kanto/i.test(target) || /gen 1/i.test(target)) {
			x = Math.floor(Math.random() * (174 - 1));
		} else if (/johto/i.test(target) || /gen 2/i.test(target)) {
			x = Math.floor(Math.random() * (281 - 173)) + 172;
		} else if (/hoenn/i.test(target) || /gen 3/i.test(target)) {
			x = Math.floor(Math.random() * (444 - 280)) + 279;
		} else if (/sinnoh/i.test(target) || /gen 4/i.test(target)) {
			x = Math.floor(Math.random() * (584 - 443)) + 442;
		} else if (/unova/i.test(target) || /gen 5/i.test(target)) {
			x = Math.floor(Math.random() * (755 - 583)) + 582;
		} else if (/kalos/i.test(target) || /gen 6/i.test(target)) {
			x = Math.floor(Math.random() * (834 - 754)) + 753;
		} else if (/alola/i.test(target) || /gen 7/i.test(target)) {
			x = Math.floor(Math.random() * (1000 - 833)) + 832;
		}
		x = x || Math.floor(Math.random() * (1083 - 1));
		let rand;
		let y = x;
		let random = Math.floor(Math.random() * 3);
		if (random === 0) {
			rand = x;
		} else if (random === 1) {
			rand = y;
		} else if (random === 2) {
			rand = y;
		}
		let tarPoke = Object.keys(Pokedex)[rand];
		let pokeData = Pokedex[tarPoke];
		let pokeId = pokeData.species.toLowerCase();
		pokeId = pokeId.replace(/^basculinbluestriped$/i, "basculin-bluestriped").replace(/^pichuspikyeared$/i, "pichu-spikyeared").replace(/^floetteeternalflower$/i, "floette-eternalflower");
		if (pokeId === "pikachu-cosplay") pokeId = ["pikachu-belle", "pikachu-phd", "pikachu-libre", "pikachu-popstar", "pikachu-rockstar"][~~(Math.random() * 6)];
		let spriteLocation = "http://play.pokemonshowdown.com/sprites/xyani" + shinyPoke + "/" + pokeId + ".gif";
		let missingnoSprites = ["http://cdn.bulbagarden.net/upload/9/98/Missingno_RB.png", "http://cdn.bulbagarden.net/upload/0/03/Missingno_Y.png", "http://cdn.bulbagarden.net/upload/a/aa/Spr_1b_141_f.png", "http://cdn.bulbagarden.net/upload/b/bb/Spr_1b_142_f.png", "http://cdn.bulbagarden.net/upload/9/9e/Ghost_I.png"];
		if (pokeId === "missingno") spriteLocation = missingnoSprites[Math.floor(Math.random() * missingnoSprites.length)];

		function getTypeFormatting(types) {
			let text = [];
			for (const type of types) {
				text.push(`<img src="http://play.pokemonshowdown.com/sprites/types/${type}.png" width="32" height="14">`);
			}
			return text.join(` / `);
		}
		this.sendReplyBox(`<div style="background-color: rgba(207, 247, 160, 0.4); border: #000000 solid 3px; border-radius: 10%; color: #0a024a; padding: 30px 30px"><center><table><td><img src="${spriteLocation}"</td><td>&nbsp;&nbsp;<strong>Name: </strong>${pokeData.species}<br/>&nbsp;&nbsp;<strong>Type(s): </strong>${getTypeFormatting(pokeData.types)}<br/>&nbsp;&nbsp;<strong>${(Object.values(pokeData.abilities).length > 1 ? "Abilities" : "Ability")}: </strong>${Object.values(pokeData.abilities).join(" / ")}<br/>&nbsp;&nbsp;<strong>Stats: </strong>${Object.values(pokeData.baseStats).join(" / ")}<br/>&nbsp;&nbsp;<strong>Colour: </strong><font color="${pokeData.color}">${pokeData.color}</font><br/>&nbsp;&nbsp;<strong>Egg Group(s): </strong>${pokeData.eggGroups.join(", ")}</td></table></center></div>`);
	},

	"!authority": true,
	auth: "authority",
	stafflist: "authority",
	globalauth: "authority",
	authlist: "authority",
	authority: function (target, room, user, connection) {
		if (target) {
			let targetRoom = Rooms.search(target);
			let unavailableRoom = targetRoom && targetRoom.checkModjoin(user);
			if (targetRoom && !unavailableRoom) return this.parse(`/roomauth ${target}`);
			return this.parse(`/userauth ${target}`);
		}
		let rankLists = {};
		let ranks = Object.keys(Config.groups);
		for (let u in Users.usergroups) {
			let rank = Users.usergroups[u].charAt(0);
			if (rank === " ") continue;
			// In case the usergroups.csv file is not proper, we check for the server ranks.
			if (ranks.includes(rank)) {
				let name = Users.usergroups[u].substr(1);
				if (!rankLists[rank]) rankLists[rank] = [];
				if (name) rankLists[rank].push(Server.nameColor(name, (Users.get(name) && Users.get(name).connected)));
			}
		}

		let buffer = Object.keys(rankLists).sort((a, b) =>
			(Config.groups[b] || {rank: 0}).rank - (Config.groups[a] || {rank: 0}).rank
		).map(r =>
			(`${Config.groups[r]}` ? `<strong>${Config.groups[r].name}s</strong> (${r})` : `${r}`) + `:\n${rankLists[r].sort((a, b) => toId(a).localeCompare(toId(b))).join(", ")}`
		);

		if (!buffer.length) return connection.popup("This server has no global authority.");
		connection.send(`|popup||html|${buffer.join("\n\n")}`);
	},

	d: "poof",
	cpoof: "poof",
	poof: function (target, room, user) {
		if (Config.poofOff) return this.errorReply("Poof is currently disabled.");
		if (target && !this.can("broadcast")) return false;
		if (room.id !== "lobby") return false;
		let message = target || messages[Math.floor(Math.random() * messages.length)];
		if (message.indexOf(`{{user}}`) < 0) message = `{{user}} ${message}`;
		message = message.replace(/{{user}}/g, user.name);
		if (!this.canTalk(message)) return false;

		let colour = "#" + [1, 1, 1].map(function () {
			let part = Math.floor(Math.random() * 0xaa);
			return (part < 0x10 ? "0" : "") + part.toString(16);
		}).join("");

		room.addRaw(`<strong><font color="${colour}">~~ ${message} ~~</font></strong>`);
		user.disconnectAll();
	},
	poofhelp: ["/poof - Disconnects the user and leaves a message in the room."],

	poofon: function () {
		if (!this.can("hotpatch")) return false;
		Config.poofOff = false;
		return this.sendReply("Poof is now enabled.");
	},
	poofonhelp: ["/poofon - Enable the use /poof command."],

	nopoof: "poofoff",
	poofoff: function () {
		if (!this.can("hotpatch")) return false;
		Config.poofOff = true;
		return this.sendReply("Poof is now disabled.");
	},
	poofoffhelp: ["/poofoff - Disable the use of the /poof command."],

	tell: function (target, room, user, connection) {
		if (!target) return this.parse("/help tell");
		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (!target) {
			this.sendReply("You forgot the comma.");
			return this.parse("/help tell");
		}

		if (targetUser && targetUser.connected) {
			return this.parse(`/pm ${this.targetUsername}, ${target}`);
		}

		if (user.locked) return this.popupReply("You may not send offline messages when locked.");
		if (target.length > 255) return this.popupReply("Your message is too long to be sent as an offline message (>255 characters).");

		if (Config.tellrank === "autoconfirmed" && !user.autoconfirmed) {
			return this.popupReply("You must be autoconfirmed to send an offline message.");
		} else if (!Config.tellrank || Config.groupsranking.indexOf(user.group) < Config.groupsranking.indexOf(Config.tellrank)) {
			return this.popupReply(`You cannot send an offline message because offline messaging is ${(!Config.tellrank ? `disabled` : `only available to users of rank ${Config.tellrank} and above`)}.`);
		}

		let userid = toId(this.targetUsername);
		if (userid.length > 18) return this.popupReply(`"${this.targetUsername}" is not a legal username.`);

		let sendSuccess = Tells.addTell(user, userid, target);
		if (!sendSuccess) {
			if (sendSuccess === false) {
				return this.popupReply(`User ${this.targetUsername} has too many offline messages queued.`);
			} else {
				return this.popupReply("You have too many outgoing offline messages queued. Please wait until some have been received or have expired.");
			}
		}
		return connection.send(`|pm|${user.getIdentity()}|${(targetUser ? targetUser.getIdentity() : this.targetUsername)}|/text This user is currently offline. Your message will be delivered when they are next online.`);
	},
	tellhelp: ["/tell [username], [message] - Send a message to an offline user that will be received when they log in."],

	flogout: "forcelogout",
	forcelogout: function (target, room, user) {
		if (user.userid !== "insist" && user.userid !== "mewth" && user.userid !== "chandie") return false;
		if (!this.canTalk()) return false;
		if (!target) return this.parse("/help forcelogout");
		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (!targetUser) {
			return this.errorReply(`User ${this.targetUsername} not found.`);
		}
		this.sendReply(`You have successfully forcefully logged out ${targetUser.name}.`);
		this.privateModAction(`${targetUser.name} was forcibly logged out by ${user.name}. ${(target ? (target) : ``)}`);
		targetUser.resetName();
	},
	forcelogouthelp: ["/forcelogout [user] - Forcefully logs out [user]."],

	hide: "hideauth",
	hideauth: function (target, room, user) {
		if (!this.can("lock")) return false;
		let tar = " ";
		if (target) {
			target = target.trim();
			if (Config.groupsranking.indexOf(target) > -1 && target !== "#") {
				if (Config.groupsranking.indexOf(target) <= Config.groupsranking.indexOf(user.group)) {
					tar = target;
				} else {
					this.sendReply(`The group symbol you have tried to use is of a higher authority than you have access to. Defaulting to "${tar}" instead.`);
				}
			} else {
				this.sendReply(`You are now hiding your auth symbol as "${tar}"`);
			}
		}
		user.getIdentity = function (roomid) {
			return tar + this.name;
		};
		user.updateIdentity();
		return this.sendReply(`You are now hiding your auth as "${tar}".`);
	},

	show: "showauth",
	showauth: function (target, room, user) {
		if (!this.can("lock")) return false;
		delete user.getIdentity;
		user.updateIdentity();
		return this.sendReply("You are now showing your authority!");
	},

	welcome: "wel",
	wel: function (target, room, user) {
		if (!this.canTalk()) return;
		if (!target) return this.errorReply(`This command requires a target.`);
		if (toId(target) === user.userid) this.add(`${user.name} is a narcisstic person, but hey they want to be welcomed [I guess].`);
		this.parse(`Welcome to ${Config.serverName}, ${target}! Feel free to check out a few of our features by checking out /serverhelp!`);
	},

	"!ship": true,
	ship: function (target, room, user) {
		if (!this.canTalk()) return;
		if (!this.runBroadcast()) return;
		let [first, ...second] = target.split(",").map(p => p.trim());
		if (!first || !second) return this.parse(`/shiphelp`);
		let compatibility = Math.floor(Math.random() * 100);
		this.sendReply(`${first} is ${compatibility}% compatible with ${second}.`);
	},
	shiphelp: [`/ship [first target], [second target] - Gives the compatibility of the two targets.`],

	revive: "summon",
	summon: function () {
		if (!this.can("hotpatch")) return false;
		let names = [`~BloodedKitten`, `@Horrific17`, `%Kevso`, `+Chesnaught90000`, `%Wobbleleez`, `&Back At My Day`, `%HoeenHero`, `+EchoSierra`, `%VXN`, `☥Sota Higurashi`, `☥Jigglykong`, `+LinkCode`, `+Execute`, `&Kraken Mare`, `*Stabby the Krabby`, `*The Exiler`, `*Oblivion Furret`, `~Insist`, `~Mewth`, `~AlfaStorm`, `&flufi`, `&Chandie`, `@Noviex`, `@Perison`, `&Bronze0re`, `~Vivid is a God`, `~Gyaratoast`, `~LassNinetales`];
		names.forEach(revival => {
			this.add(`|j|${revival}`);
			this.add(`|c|${revival}|Hey`);
		});
	},

	devmessage: "devpm",
	devmsg: "devpm",
	devpm: function (target, room, user) {
		if (!Server.isDev(user.userid) && !this.can("bypassall")) return false;
		if (!target) return this.errorReply(`You need to specify the message.`);
		if (target.length > 500) return this.errorReply(`Dev PM messages can be a maximum of 500 characters long.`);
		Server.devPM(`~Developer Chat`, `${Server.nameColor(user.name, true, true)} said: "${target}".`);
	},
};
