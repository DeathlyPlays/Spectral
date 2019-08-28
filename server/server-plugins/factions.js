/******************************
*         Factions            *
*      Idea by Desokoro       *
*  Coded by WGC and Bladicon  *
*Credits to jd for League file*
*******************************/

"use strict";

/****** General Faction Functions Start ******/
const FS = require("../../.lib-dist/fs").FS;

let factions = FS("config/chat-plugins/factions.json").readIfExistsSync();

if (factions !== "") {
	factions = JSON.parse(factions);
} else {
	factions = {};
}

function write() {
	FS("config/chat-plugins/factions.json").writeUpdate(() => (
		JSON.stringify(factions)
	));
	let data = "{\n";
	for (let u in factions) {
		data += '\t"' + u + '": ' + JSON.stringify(factions[u]) + ",\n";
	}
	data = data.substr(0, data.length - 2);
	data += "\n}";
	FS("config/chat-plugins/factions.json").writeUpdate(() => (
		data
	));
}

function getFaction(user) {
	user = toID(user);
	let reply;
	for (let faction in factions) {
		if (factions[faction].users.includes(user)) {
			reply = factions[faction].name;
			break;
		}
	}
	return reply;
}
Server.getFaction = getFaction;

if (factions !== "") {
	for (let u in factions) {
		if (!factions[u].joinDate) factions[u].joinDate = {};
		for (let i in factions[u].users) {
			if (factions[u].joinDate[factions[u].users[i]]) continue;
			factions[u].joinDate[factions[u].users[i]] = Date.now() - 7100314200;
		}
		if (factions[u].bank) delete factions[u].bank;
		if (factions[u].nowipe) continue;
		let coins = Db.factionbank.get(factions[u]);
		factions[u].nowipe = true;
		if (!coins) continue;
		let remainder = Db.factionbank.get(factions[u]) % 20;
		if (remainder !== 0) {
			coins = coins - remainder;
			let owner = factions[u].ranks["owner"].users[0];
			Economy.writeMoney(toID(owner), remainder);
			Economy.logTransaction(`${owner} has earned ${remainder} ${moneyName}${Chat.plural(moneyPlural)}!`);
		}
		Db.factionbank.remove(factions[u].id);
		Db.factionbank.set(factions[u].id, coins / 20);
	}
	write();
}

function getFactionRank(user) {
	user = toID(user);
	let faction = toID(getFaction(user));
	if (!factions[faction]) return false;
	if (!faction) return false;
	for (let rank in factions[faction].ranks) {
		if (factions[faction].ranks[rank].users.includes(user)) return factions[faction].ranks[rank].title;
	}
}

/****** General Faction Functions End ******/

/****** Faction vs Faction Functions Start ******/

if (!Rooms.global.FvF) Rooms.global.FvF = {};

function isFvFBattle(p1, p2, id, status, types, score) {
	let factionId = toID(getFaction(p1));
	if (!factionId) return;
	let targetFactionid = toID(getFaction(p2));
	if (!targetFactionid) return;

	if (!Rooms.global.FvF[factionId]) return;
	if (Rooms.global.FvF[factionId] && Rooms.global.FvF[factionId].challenger && Rooms.global.FvF[factionId].challenger === targetFactionid || Rooms.global.FvF[factionId] && Rooms.global.FvF[factionId].challenging && Rooms.global.FvF[factionId].challenging === targetFactionid) {
		let room = Rooms.get(Rooms.global.FvF[factionId].room);
		if (!room.fvf.started) return;
		if (room.fvf.mode === "normal") {
			if (room.fvf.factions[0].players[room.fvf.statusNumber] !== p1 && room.fvf.factions[1].players[room.fvf.statusNumber] !== p1 || room.fvf.factions[0].players[room.fvf.statusNumber] !== p2 && room.fvf.factions[1].players[room.fvf.statusNumber] !== p2) return;
		} else {
			if ((!room.fvf.factions[0].players.includes(p1) && !room.fvf.factions[1].players.includes(p2)) && (!room.fvf.factions[0].players.includes(p2) && !room.fvf.factions[1].players.includes(p1))) return;
		}

		if (status === "start") {
			if (room.fvf.mode === "normal") {
				if (room.fvf.status[room.fvf.statusNumber] !== 2) return;
				room.fvf.status[room.fvf.statusNumber] = id;
			} else {
				let statusNumber = room.fvf.factions[(room.fvf.factions[0].players.includes(p1) ? 0 : 1)].players.indexOf(p1);
				room.fvf.status[statusNumber] = id;
			}
			fvfDisplay(room);
			room.addRaw(`<a href="/${id}">The Faction vs Faction battle between ${Server.nameColor(p1, true)} (${factions[factionId].name}) and ${Server.nameColor(p2, true)} (${factions[targetFactionid].name}) has begun.</a>`).update();
		} else if (status === "types") {
			if (room.fvf.mode === "normal") {
				room.fvf.types[room.fvf.statusNumber] = types;
			} else {
				let statusNumber = room.fvf.factions[(room.fvf.factions[0].players.includes(p1) ? 0 : 1)].players.indexOf(p1);
				room.fvf.types[statusNumber] = types;
			}
			fvfDisplay(room);
		} else if (status.substr(0, 2) === "p-") {
			status = status.slice(2);
			if (room.fvf.mode === "normal") {
				if (room.fvf.status[room.fvf.statusNumber] !== id) return;
				let player = (room.fvf.factions[0].players[room.fvf.statusNumber] === status ? 0 : 1);
				room.fvf.status[room.fvf.statusNumber] = player;
				room.fvf.factions[room.fvf.status[room.fvf.statusNumber]].wins++;
				room.fvf.statusNumber++;

				if (!(room.fvf.factions[0].wins > room.fvf.factions[1].wins && room.fvf.factions[0].wins === Math.ceil(room.fvf.size / 4 + 0.5) || room.fvf.factions[1].wins > room.fvf.factions[0].wins && room.fvf.factions[1].wins === Math.ceil(room.fvf.size / 4 + 0.5))) {
					room.fvf.status[room.fvf.statusNumber] = true;
				} else {
					room.fvf.status[room.fvf.statusNumber] = false;
				}
				if (room.fvf.status[room.fvf.statusNumber]) {
					room.fvf.status[room.fvf.statusNumber] = room.fvf.statusNumber;
					fvfDisplay(room);
				} else {
					room.fvf.status[room.fvf.statusNumber] = room.fvf.statusNumber;
					fvfDisplay(room);
					// end
					let winner = room.fvf.factions[0].name;
					let prize1 = 5 * room.fvf.size;
					let prize2 = 1 * room.fvf.size;
					if (room.fvf.factions[1].wins > room.fvf.factions[0].wins) {
						winner = room.fvf.factions[1].name;
						prize2 = prize1;
						prize1 = 1 * room.fvf.size;
					}
					Db.factionbank.set(room.fvf.factions[0].id, Db.factionbank.get(room.fvf.factions[0].id, 0) + prize1);
					Db.factionbank.set(room.fvf.factions[1].id, Db.factionbank.get(room.fvf.factions[1].id, 0) + prize2);
					for (let u in room.fvf.factions[0].players) {
						if (room.fvf.factions[0].name === winner) Db.factionCoins.set(room.fvf.factions[0].players[u], Db.factionCoins.get(room.fvf.factions[0].players[u], 0) + (prize1 / 3));
						Server.ExpControl.addExp(room.fvf.factions[0].players[u], room.id, prize1);
					}
					for (let u in room.fvf.factions[1].players) {
						if (room.fvf.factions[1].name === winner) Db.factionCoins.set(room.fvf.factions[1].players[u], Db.factionCoins.get(room.fvf.factions[1].players[u], 0) + (prize2 / 3));
						Server.ExpControl.addExp(room.fvf.factions[1].players[u], room.id, prize2);
					}
					factions[toID(winner)].tourwins += 1;
					write();
					room.addRaw(`<div class="infobox">Congratulations ${winner}. You have won the Faction vs Faction!</div>`);
					room.update();
					delete Rooms.global.FvF[toID(room.fvf.factions[0].name)];
					delete Rooms.global.FvF[toID(room.fvf.factions[1].name)];
					delete room.fvf;
				}
			} else {
				let statusNumber = room.fvf.factions[(room.fvf.factions[0].players.includes(p1) ? 0 : 1)].players.indexOf(p1);
				if (room.fvf.status[statusNumber] !== id) return;
				let player = (room.fvf.factions[0].players[statusNumber] === status ? 0 : 1);
				room.fvf.status[statusNumber] = player;
				room.fvf.factions[room.fvf.status[statusNumber]].wins++;

				if (!(room.fvf.factions[0].wins > room.fvf.factions[1].wins && room.fvf.factions[0].wins === Math.ceil(room.fvf.size / 4 + 0.5) || room.fvf.factions[1].wins > room.fvf.factions[0].wins && room.fvf.factions[1].wins === Math.ceil(room.fvf.size / 4 + 0.5))) {
					room.fvf.status[room.fvf.statusNumber] = true;
				} else {
					room.fvf.status[room.fvf.statusNumber] = false;
				}
				if (room.fvf.status[room.fvf.statusNumber]) {
					room.fvf.status[room.fvf.statusNumber] = room.fvf.statusNumber;
					fvfDisplay(room);
				} else {
					room.fvf.status[room.fvf.statusNumber] = room.fvf.statusNumber;
					fvfDisplay(room);
					// end
					let winner = room.fvf.factions[0].name;
					let prize1 = 5 * room.fvf.size;
					let prize2 = 1 * room.fvf.size;
					if (room.fvf.factions[1].wins > room.fvf.factions[0].wins) {
						winner = room.fvf.factions[1].name;
						prize2 = prize1;
						prize1 = 1 * room.fvf.size;
					}
					Db.factionbank.set(room.fvf.factions[0].id, Db.factionbank.get(room.fvf.factions[0].id, 0) + prize1);
					Db.factionbank.set(room.fvf.factions[1].id, Db.factionbank.get(room.fvf.factions[1].id, 0) + prize2);
					for (let u in room.fvf.factions[0].players) {
						if (room.fvf.factions[0].name === winner) Db.factionCoins.set(room.fvf.factions[0].players[u], Db.factionCoins.get(room.fvf.factions[0].players[u], 0) + (prize1 / 3));
						Server.ExpControl.addExp(room.fvf.factions[0].players[u], room.id, prize1);
					}
					for (let u in room.fvf.factions[1].players) {
						if (room.fvf.factions[1].name === winner) Db.factionCoins.set(room.fvf.factions[1].players[u], Db.factionCoins.get(room.fvf.factions[1].players[u], 0) + (prize2 / 3));
						Server.ExpControl.addExp(room.fvf.factions[1].players[u], room.id, prize2);
					}
					factions[toID(winner)].tourwins += 1;
					write();
					room.addRaw(`<div class="infobox">Congratulations ${winner}. You have won the Faction vs Faction!</div>`);
					room.update();
					delete Rooms.global.FvF[toID(room.fvf.factions[0].name)];
					delete Rooms.global.FvF[toID(room.fvf.factions[1].name)];
					delete room.fvf;
				}
			}
		} else if (status === "tie") {
			if (room.fvf.mode === "normal") {
				room.fvf.status[room.fvf.statusNumber] = 2;
			} else {
				let statusNumber = room.fvf.factions[(room.fvf.factions[0].players.includes(p1) ? 0 : 1)].players.indexOf(p1);
				room.fvf.status[statusNumber] = 2;
			}
			fvfDisplay(room);
			room.addRaw(`The Faction vs Faction battle between ${Server.nameColor(p1, true)} and ${Server.nameColor(p2, true)} ended with a tie. They have to have a rematch.`);
			room.update();
		}
	}
}
Server.isFvFBattle = isFvFBattle;

function fvfDisplay(room) {
	let output = ``;
	output += `<center><font size="6">Faction vs Faction</font><br /> Tier - ${room.fvf.tier}<br />`;
	output += `<font color="grey"><small>(experimental - report any bugs to an admin!)</small></font>`;
	output += `<font color="grey"><small>(${room.fvf.size} v ${room.fvf.size}) (mode: ${room.fvf.mode})</small></font><br /><br />`;
	output += `<table><tr><th><font size="5">${room.fvf.factions[0].name}</font></th><td>vs</td><th><font size="5">${room.fvf.factions[1].name}</font></th></tr>`;

	if (room.fvf.factions[0].players.length === room.fvf.size && room.fvf.factions[1].players.length === room.fvf.size && !room.fvf.started) {
		let notOnline = [];
		for (let u = 0; u < room.fvf.factions[0].players.length; u++) {
			let curPlayer = room.fvf.factions[0].players[u];
			if (!Users.get(curPlayer) || !Users.get(curPlayer).connected) {
				notOnline.push(curPlayer);
				continue;
			}
		}

		for (let u = 0; u < room.fvf.factions[1].players.length; u++) {
			let curPlayer = room.fvf.factions[1].players[u];
			if (!Users.get(curPlayer) || !Users.get(curPlayer).connected) {
				notOnline.push(curPlayer);
				continue;
			}
		}

		if (notOnline.length > 0) {
			for (let u = 0; u < notOnline.length; u++) {
				if (room.fvf.factions[0].players.includes(notOnline[u])) {
					room.fvf.factions[0].players.splice(room.fvf.factions[0].players.indexOf(notOnline[u]), 1);
				} else {
					room.fvf.factions[1].players.splice(room.fvf.factions[1].players.indexOf(notOnline[u]), 1);
				}
			}
			room.add(`The following players have been removed from the Faction vs Faction due to not being online: ${Chat.toListString(notOnline)}`);
		} else {
			room.fvf.started = true;
			Dex.shuffle(room.fvf.factions[0].players);
			Dex.shuffle(room.fvf.factions[1].players);
			room.add("The Faction vs Faction has started!");
			room.fvf.status[0] = 2;
		}
	}

	if (!room.fvf.started) {
		output += `<tr><td>Joined: ${room.fvf.factions[0].players.length}</td><td><td>Joined: ${room.fvf.factions[1].players.length}</td></tr>`;
		output += `<tr><td colspan="3"><center><button name="send" value="/fvf join">Join</button></center></td></tr>`;
	} else {
		for (let u = 0; u < room.fvf.factions[0].players.length; u++) {
			output += `<tr>`;
			switch (room.fvf.status[u]) {
			case 0:
				output += `<td><font color="green"><center>${room.fvf.factions[0].players[u]}</center></font></td>`;
				output += `<td>vs</td>`;
				output += `<td><font color="red"><center>${room.fvf.factions[1].players[u]}</center></font></td>`;
				break;
			case 1:
				output += `<td><font color="red"><center>${room.fvf.factions[0].players[u]}</center></font></td>`;
				output += `<td>vs</td>`;
				output += `<td><font color="green"><center>${room.fvf.factions[1].players[u]}</center></font></td>`;
				break;
			case 2:
				output += `<td><center><strong>${room.fvf.factions[0].players[u]}</strong></center></td>`;
				output += `<td>vs</td>`;
				output += `<td><center><b>${room.fvf.factions[1].players[u]}</b></center></td>`;
				break;
			case 3:
				output += `<td><center>${room.fvf.factions[0].players[u]}</center></td>`;
				output += `<td>vs</td>`;
				output += `<td><center>${room.fvf.factions[1].players[u]}</center></td>`;
				break;
			default:
				output += `<td><center><a href="/${room.fvf.status[u]}"> ${room.fvf.factions[0].players[u]}</a></center></td>`;
				output += `<td>vs</td>`;
				output += `<td><center><a href="/${room.fvf.status[u]}"> ${room.fvf.factions[1].players[u]}</a></center></td>`;
				break;
			}
			output += `</tr>`;
		}
	}
	output += `</table>`;

	room.add(`|uhtmlchange|fvf-${room.fvf.fvfId}|`);
	room.add(`|uhtml|fvf-${room.fvf.fvfId}|<div class="infobox">${output}</div>`);
	room.update();
}
Server.fvfDisplay = fvfDisplay;

function factionPM(message, faction) {
	let factionid = toID(faction);
	if (!factions[factionid]) return;
	for (let u in factions[factionid].users) {
		if (!Users.get(factions[factionid].users[u]) || !Users.get(factions[factionid].users[u]).connected) continue;
		Users.get(factions[factionid].users[u]).send(`|pm|~Faction PM [Do Not Reply]${factions[factionid].name}|~|/raw ${message}`);
	}
}


/****** Faction vs Faction Functions End ******/

exports.commands = {
	faction: "factions",
	factions: {
		new: "create",
		make: "create",
		create(target, room, user) {
			let [name, desc, tag] = target.split(",").map(p => { return p.trim(); });
			if (!tag) return this.errorReply("/factions create (name), (description), (tag [4 char])");
			if (desc.length > 100) return this.errorReply("Faction descriptions must be 100 characters or less!");
			if (tag.length > 4) return this.errorReply("Faction tags must be 4 characters at most!");
			if (factions[toID(name)]) return this.errorReply("That faction exists already!");
			for (let faction of factions) {
				if (faction.tag === tag) return this.errorReply("That faction tag exists already!");
			}
			let userid = user.userid;
			if (getFaction(userid)) return this.errorReply("You are already in a faction!");

			let priv = false;
			let approve = true;
			if (!user.can("broadcast")) {
				priv = true;
				approve = false;
			}

			factions[toID(name)] = {
				name: name,
				id: toID(name),
				desc: desc,
				tag: tag,
				users: [userid],
				userwins: {},
				tourwins: 0,
				invites: [],
				bans: [],
				private: priv,
				approved: approve,
				joinDate: {userid: Date.now()},
				ranks: {
					"owner": {
						title: "Owner",
						users: [userid],
					},
					"noble": {
						title: "Noble",
						users: [],
					},
					"commoner": {
						title: "Commoner",
						users: [],
					},
				},
			};
			write();
			Monitor.adminlog(`Faction ${name} was just created by ${user.name}! If you wish to approve this faction please use /faction approve (${name})`);
			return this.sendReply(`Faction ${name} created!`);
		},

		joindate(target, room, user) {
			if (!this.runBroadcast()) return;
			if (!target) target = user.userid;
			let factionId = toID(getFaction(user.userid));
			if (factionId !== toID(getFaction(toID(target)))) return this.errorReply(`You are not in the same faction as the target user!`);
			let date = new Date(factions[factionId].joinDate[toID(target)]);
			if (!date) return this.errorReply(`That user doesn't appear to have a join date.`);
			return this.sendReplyBox(`"${target}" joined ${factionId} on ${date}.`);
		},

		remove: "delete",
		delete(target, room, user) {
			if (!target) return this.errorReply("/factions delete (name)");
			if (!factions[toID(target)]) return this.errorReply("Doesn't exist!");
			if (!this.can("faction") && factions[toID(target)].ranks["owner"].users.indexOf(user.userid) === -1) return false;

			delete factions[toID(target)];
			write();
			this.sendReply(`Faction "${target}"" has been deleted.`);
		},

		description: "desc",
		desc(target, room, user) {
			if (!getFaction(user.userid)) return this.errorReply("You are not in a faction.");
			let factionDesc = factions[toID(getFaction(user.user))].desc;
			if (toID(getFactionRank(user.userid) !== "owner")) return this.errorReply("You do not own this faction.");
			if (!target) return this.errorReply("Needs a target no more than 100 characters.");
			if (target.length > 100) return this.errorReply("Faction descriptions must be 100 characters or less!");
			factionDesc = target;
			write();
			return this.sendReplyBox(`Your faction description is now set to: <br /> ${factionDesc}.`);
		},

		avatar(target, room, user) {
			let factionId = toID(getFaction(user.userid));
			if (!factionId) return this.errorReply("You are not in a faction!");
			if (toID(getFactionRank(user.userid)) !== "owner") return this.errorReply("You are not the faction owner!");
			if (!target) return false;
			if (![".png", ".gif", ".jpg"].includes(target.slice(-4))) return this.errorReply("Not an image link!");
			factions[factionId].pendingAVI = target;
			write();
			if (Rooms.get("upperstaff")) Rooms.get("upperstaff").add(`|html|Faction ${factionId} has requested a faction avatar <br /><img src="${target}" height="80" width="80"><br /><button name="send" value="/faction aa ${factionId}, ${factions[factionId].pendingAVI}">Set it!</button> <button name="send" value="/faction da ${factionId}">Deny it!</button>`).update();
			return this.sendReply("Upper Staff have been notified of your faction avatar request!");
		},

		aa: "approveavatar",
		approveavatar(target, room, user) {
			if (!this.can("faction")) return false;
			let [factionId, factAvi] = target.split(",").map(p => { return p.trim(); });
			if (!factAvi) return this.errorReply("Usage: /faction approveavatar factionid, link");
			factionId = toID(factionId);
			if (!factions[factionId]) return this.errorReply("Not a faction!");
			if (factAvi !== factions[factionId].pendingAVI) return this.errorReply("The image does not match the requested image!");
			factions[factionId].avatar = factAvi;
			delete factions[factionId].pendingAVI;
			write();
			Monitor.adminlog(`${user.name} has set a faction avatar for ${factions[factionId].name}`);
			return this.sendReply(`The faction avatar has been set for ${factions[factionId].name}`);
		},

		da: "denyavatar",
		denyavatar(target, room, user) {
			if (!this.can("faction")) return false;
			let factionId = toID(target);
			if (!factions[factionId]) return this.errorReply("That faction does not exist!");
			if (!factions[factionId].pendingAVI) return this.errorReply("That faction has not requested a faction avatar!");
			delete factions[factionId].pendingAVI;
			write();
			Monitor.adminlog(`${user.name} has denied a faction avatar for ${factions[factionId].name}`);
			return this.sendReply(`The faction avatar has been denied for ${factions[factionId].name}`);
		},

		pa: "pendingavatars",
		pendingavatars(target, room, user) {
			if (!this.can("faction")) return false;
			let output = `<center><table border="1" cellspacing ="0" cellpadding="3"><tr><td>Faction</td><td>Image</td><td>Approve</td><td>Deny</td</tr>`;
			for (let faction in factions) {
				if (factions[faction].pendingAVI) {
					output += `<tr>`;
					output += `<td>${factions[faction].name}</td>`;
					output += `<td><img src="${factions[faction].pendingAVI}" height="80" width="80"></td>`;
					output += `<td><button name="send" value="/faction aa ${faction}, ${factions[faction].pendingAVI}">Approve faction avatar!</button></td>`;
					output += `<td><button name="send" value="/faction da ${faction}">Deny faction avatar!</button></td>`;
				}
			}
			output += `</table></center>`;
			this.sendReplyBox(output);
		},

		list(target, room, user) {
			if (!this.runBroadcast()) return;
			if (Object.keys(factions).length < 1) return this.errorReply(`There are no factions on ${Config.serverName}.`);
			let output = `<center><table border="1" cellspacing ="0" cellpadding="3"><tr><td>Faction</td><td>Description</td><td>FvF Wins</td><td>Members</td></tr>`;
			let sortedFactions = Object.keys(factions).sort(function (a, b) {
				return factions[b].tourwins - factions[a].tourwins;
			});

			for (let faction = 0; faction < sortedFactions.length; faction++) {
				let curFaction = factions[sortedFactions[faction]];
				let desc = curFaction.desc;
				if (desc.length > 50) desc = `${desc.substr(0, 50)}<br />${desc.substr(50)}`;
				if (!curFaction.private) {
					output += `<tr>`;
					output += `<td>${curFaction.name}</td>`;
					output += `<td>${desc}</td>`;
					output += `<td>${curFaction.tourwins.toLocaleString()}</td>`;
					output += `<td><button name="send" value="/faction profile ${curFaction.id}">${curFaction.users.length.toLocaleString()}</button></td>`;
					output += `</tr>`;
				}
			}
			output += `</table></center>`;
			this.sendReplyBox(output);
		},

		profile(target, room, user) {
			if (!this.runBroadcast()) return;
			if (!target && getFaction(user.userid)) target = getFaction(user.userid);
			let factionId = toID(target);
			if (!factions[factionId] || factions[factionId] && factions[factionId].private === true) return this.errorReply("There is no faction by that name! If you are not in a faction, please specify one!");
			let output = (factions[factionId].avatar ? `<img src="${factions[factionId].avatar}" height="80" width="80" align="left">` : ``) + `&nbsp;${factions[factionId].name}</br>`;
			output += `<br />&nbsp;Faction Vs Faction wins: ${factions[factionId].tourwins}<br /> &nbsp;Usercount: ${factions[factionId].users.length.toLocaleString()}<br />`;
			output += `&nbsp;Description: ${factions[factionId].desc}<br />`;
			output += `&nbsp;Owners: ${factions[factionId].ranks["owner"].users.map(p => { return Server.nameColor(p, true, true); })}<br />`;
			output += `&nbsp;Nobles: ${factions[factionId].ranks["noble"].users.map(p => { return Server.nameColor(p, true, true); })}<br />`;
			output += `&nbsp;Commoners: ${factions[factionId].ranks["commoner"].users.map(p => { return Server.nameColor(p, true, true); })}<br />`;
			this.sendReplyBox(output);
		},

		private: "privatize",
		public: "privatize",
		privatize(target, room, user, connection, cmd) {
			let factionId = toID(getFaction(user.userid));
			if (!factionId) return this.errorReply("You are not in a faction!");
			if (toID(getFactionRank(user.userid)) !== "owner") return false;
			if (!factions[factionId].approved) return this.errorReply("Your faction is not approved!");
			if (this.meansYes(target) || cmd === "privatize") {
				if (factions[factionId].private) return this.errorReply("Faction is already private.");
				factions[factionId].private = true;
				write();
				return this.sendReply("Faction is now private!");
			} else if (this.meansNo(target) || cmd === "public") {
				if (!factions[factionId].private) return this.errorReply("Faction is not private.");
				factions[factionId].private = false;
				write();
				return this.sendReply("Faction is now public!");
			} else {
				return this.errorReply("Valid targets are: on, true, off, false, public, privatize, private.");
			}
		},

		approve(target, room, user) {
			if (!this.can("faction")) return false;
			if (!target) return this.errorReply("/factions approve (faction)");
			if (!factions[toID(target)]) return this.errorReply("Not a faction!");
			if (factions[toID(target)].approved) return this.errorReply("Already approved!");
			factions[toID(target)].approved = true;
			factions[toID(target)].private = false;
			write();
			Monitor.adminlog(`The faction ${factions[toID(target)].name} has been approved by ${user.name}.`);
			this.parse(`/makechatroom ${factions[toID(target)].name}`);
			this.parse(`/join ${factions[toID(target)].name}`);
			this.sendReply("Don't forget to promote the requester to Room Founder!");
			return user.popup("Faction approved!");
		},

		j: "join",
		join(target, room, user) {
			if (!target) this.errorReply("/faction join (faction)");
			let factionid = toID(target);
			if (!factions[factionid] || (factions[factionid] && !factions[factionid].approved) || (factions[factionid] && factions[factionid].private)) return this.errorReply("That faction does not exist.");
			if (getFaction(user.userid)) return this.errorReply("You're already in a faction!");
			if (factions[factionid].bans.indexOf(user.userid) > -1) return this.errorReply("You are banned from this faction!");
			let sortedRanks = Object.keys(factions[factionid].ranks).sort(function (a, b) { return factions[factionid].ranks[b].rank - factions[factionid].ranks[a].rank; });
			let rank = sortedRanks.pop();
			factions[factionid].users.push(user.userid);
			factions[factionid].ranks[rank].users.push(user.userid);
			write();

			user.popup(`You've joined ${factions[factionid].name}.`);
		},

		inv: "invite",
		invite(target, room, user) {
			if (!target) return this.errorReply("/factions invite (user)");
			let faction = toID(getFaction(user.userid));
			let targetUser = Users.get(target);
			if (!targetUser) return this.errorReply("Needs a target!");
			const factionid = toID(faction);
			if (factions[factionid] && !factions[factionid].approved) return this.errorReply("Your faction is not approved!");
			if (Db.blockedinvites.get(targetUser.userid)) return this.errorReply("User is currently blocking faction invites!");
			if (!factions[factionid]) return this.errorReply("You are not in a faction.");
			if (!targetUser || !targetUser.connected) return this.errorReply("That user isn't online!");
			if (factions[factionid].bans.indexOf(targetUser.userid) > -1) return this.errorReply(`${targetUser.name} is banned from this faction!`);
			if (factions[factionid].users.includes(targetUser.userid)) return this.errorReply("That user is already in a faction!");
			if (factions[factionid].invites.includes(targetUser.userid)) return this.errorReply("That user already has a pending invite for this faction!");
			for (let faction = 0; faction < factions.length; faction++) {
				if (factions[faction].id === faction) continue;
				if (factions[faction].users.includes(targetUser.userid)) return this.errorReply(`That user is a member of ${factions[faction].name}.`);
			}
			if (toID(getFactionRank(user.userid)) !== "noble" && toID(getFactionRank(user.userid)) !== "owner") return this.errorReply("You can't invite people!");

			factions[factionid].invites.push(targetUser.userid);
			write();
			let message = `/html has invited you to join the faction ${factions[factionid].name}. <br />` +
				`<button name="send" value="/faction accept ${factionid}">Click to accept</button> | <button name="send" value="/faction decline ${factionid}` +
				`">Click to decline</button>`;
			targetUser.send(`|pm|${user.getIdentity()}|${targetUser.getIdentity()}|${message}`);
			this.sendReply(`You've invited ${targetUser.name} to join ${factions[factionid].name}.`);
		},

		blockinvites(target, room, user) {
			if (Db.blockedinvites.get(user.userid)) return this.errorReply("You are already blocking faction invites!");
			Db.blockedinvites.set(user.userid, true);
			return this.sendReply("Faction invites are now blocked!");
		},

		unblockinvites(target, room, user) {
			if (!Db.blockedinvites.get(user.userid)) return this.errorReply("You are currently not blocking faction invites!");
			Db.blockedinvites.remove(user.userid);
			return this.sendReply("Faction invites are now allowed!");
		},

		accept(target, room, user) {
			if (!target) return this.errorReply("/faction accept [faction]");
			let factionid = toID(target);
			if (!factions[factionid]) return this.errorReply("This faction does not exist.");
			if (!factions[factionid].invites.includes(user.userid)) return this.errorReply("You have no pending invites!");
			if (getFaction(user.userid)) return this.errorReply("You're already in a faction!");

			let sortedRanks = Object.keys(factions[factionid].ranks).sort(function (a, b) { return factions[factionid].ranks[b].rank - factions[factionid].ranks[a].rank; });
			let rank = sortedRanks.pop();
			factions[factionid].users.push(user.userid);
			factions[factionid].ranks[rank].users.push(user.userid);
			factions[factionid].invites.splice(factions[factionid].invites.indexOf(user.userid), 1);
			write();

			user.popup(`You've accepted the invitation to join ${factions[factionid].name}.`);
		},

		decline(target, room, user) {
			if (!target) return this.errorReply("/faction decline [faction]");
			let factionid = toID(target);
			if (!factions[factionid]) return this.errorReply("This faction does not exist.");
			if (!factions[factionid].invites.includes(user.userid)) return this.errorReply("You have no pending invites!");
			if (getFaction(user.userid)) return this.errorReply("You're already in a faction!");

			factions[factionid].invites.splice(factions[factionid].invites.indexOf(user.userid), 1);
			write();

			user.popup(`You've declined the invitation to join ${factions[factionid].name}.`);
		},

		leave(target, room, user) {
			let factionid = toID(getFaction(user.userid));
			if (!factions[factionid]) return this.errorReply("You're not in a faction.");
			if (factions[factionid].ranks["owner"].users.includes(user.userid)) return this.errorReply("You can't leave a faction, if you're the owner.");

			if (Db.factionCoins.get(user.userid, 0) > 0) {
				Db.factionbank.set(toID(getFaction(user.userid)), Db.factionbank.get(toID(getFaction(user.userid)), 0) + Db.factionCoins.set(user.userid, 0));
				Db.factionCoins.set(user.userid, 0);
			}

			for (let rank in factions[factionid].ranks) {
				if (!factions[factionid].ranks[rank].users.includes(user.userid)) continue;
				factions[factionid].ranks[rank].users.splice(factions[factionid].ranks[rank].users.indexOf(user.userid), 1);
			}
			factions[factionid].users.splice(factions[factionid].users.indexOf(user.userid), 1);
			write();
			this.sendReply(`You have left ${factions[factionid].name}.`);
		},

		kick(target, room, user) {
			if (!target) return this.errorReply("/factions kick [user]");
			let factionName = getFaction(user.userid);
			let factionid = toID(factionName);
			let targetid = toID(target);
			if (user.userid === targetid) return this.errorReply("You cannot kick yourself!");
			if (!factions[factionid]) return this.errorReply("You aren't in a faction!");
			if (!factions[factionid].users.includes(targetid)) return this.errorReply("This user is not in a faction!");

			if (toID(getFactionRank(user.userid)) !== "noble" && toID(getFactionRank(user.userid)) !== "owner") return this.errorReply(`You don't have permission to kick users from "${factionName}".`);
			if (toID(getFactionRank(user.userid)) === "noble" && toID(getFactionRank(targetid)) === "noble" || toID(getFactionRank(user.userid)) === "noble" && toID(getFactionRank(targetid)) === "owner" || toID(getFactionRank(user.userid)) === "owner" && toID(getFactionRank(targetid)) === "owner") return this.errorReply("You cannot kick them from the faction!");

			for (let rank in factions[factionid].ranks) {
				if (factions[factionid].ranks[rank].users.includes(targetid)) {
					factions[factionid].ranks[rank].users.splice(factions[factionid].ranks[rank].users.indexOf(targetid), 1);
				}
			}
			factions[factionid].users.splice(factions[factionid].users.indexOf(targetid), 1);
			write();
			if (Db.factionCoins.get(toID(target), 0) > 0) {
				Db.factionbank.set(toID(getFaction(user.userid)), Db.factionbank.get(toID(getFaction(user.userid)), 0) + Db.factionCoins.set(toID(target), 0));
				Db.factionCoins.set(toID(target), 0);
			}
			if (Users.get(targetid) && Users.get(targetid).connected) Users.get(target).send(`|popup||html|${Server.nameColor(user.name, true, true)} has kicked you from the faction ${factions[factionid].name}.`);
			this.sendReply(`You've kicked ${target} from ${factions[factionid].name}.`);
		},

		blacklist: "ban",
		bl: "ban",
		ban(target, room, user) {
			if (!getFaction(user.userid)) return false;
			if (!target) return this.errorReply("/faction ban (target)");
			if (toID(getFactionRank(user.userid)) !== "noble" && toID(getFactionRank(user.userid)) !== "owner") return false;
			if (toID(getFactionRank(user.userid)) === "noble" && toID(getFactionRank(toID(target))) === "noble" || toID(getFactionRank(user.userid)) === "noble" && toID(getFactionRank(toID(target))) === "owner" || toID(getFactionRank(user.userid)) === "owner" && toID(getFactionRank(toID(target))) === "owner") return this.errorReply("You cannot ban them from the faction!");
			if (factions[toID(getFaction(user.userid))].bans.includes(toID(target))) return this.errorReply(`${target} is already banned!`);
			factions[toID(getFaction(user.userid))].bans.push(toID(target));
			if (factions[toID(getFaction(user.userid))].users.includes(toID(target))) factions[toID(getFaction(user.userid))].users.splice(factions[toID(getFaction(user.userid))].users.indexOf(toID(target)), 1);
			for (let rank in factions[toID(getFaction(user.userid))].ranks) {
				if (factions[toID(getFaction(user.userid))].ranks[rank].users.includes(toID(target))) factions[toID(getFaction(user.userid))].ranks[rank].users.splice(factions[toID(getFaction(user.userid))].ranks[rank].users.indexOf(toID(target)), 1);
			}
			write();
			if (Db.factionCoins.get(toID(target), 0) > 0) {
				Db.factionbank.set(toID(getFaction(user.userid)), Db.factionbank.get(toID(getFaction(user.userid)), 0) + Db.factionCoins.set(toID(target), 0));
				Db.factionCoins.set(toID(target), 0);
			}
			return this.sendReply(`${target} is now banned from your faction!`);
		},

		unblacklist: "unban",
		unbl: "unban",
		unban(target, room, user) {
			if (!getFaction(user.userid)) return false;
			if (!target) return this.errorReply("/faction unban (target)");
			if (toID(getFactionRank(user.userid)) !== "noble" && toID(getFactionRank(user.userid)) !== "owner") return false;
			if (!factions[toID(getFaction(user.userid))].bans.includes(toID(target))) return this.errorReply(`${toID(target)} is not banned from your faction!`);
			factions[toID(getFaction(user.userid))].bans.splice(factions[toID(getFaction(user.userid))].bans.indexOf(toID(target)), 1);
			write();
			return this.sendReply(`${target} is now unbanned from your faction.`);
		},

		shop(target, room, user) {
			if (!getFaction(user.userid)) return false;
			if (toID(getFactionRank(user.userid)) !== "owner") return false;
			let userCount = factions[toID(getFaction(user.userid))].users.length;
			let display = `<div style="max-height:300px; width: 100%; overflow: scroll"><table style="border:2px solid #101ad1; border-radius: 5px; width: 100%;"><tr><th colspan="3" style="border: 2px solid #070e96; border-radius: 5px">Faction Shop</th></tr>`;
			display += `<tr><td style="border: 2px solid #070e96; width: 20%; text-align: center"><button name="send" value="/factions buy icons">Icons</button></td><td style="border: 2px solid #070e96; width: 70%; text-align: center">Buys Icons for everyone in the faction</td><td style="border: 2px solid #070e96; width: 10%; text-align: center">${(userCount <= 15 ? 10 * userCount : (10 * userCount) + (-2 * userCount))}</td></tr>`;
			display += `<tr><td style="border: 2px solid #070e96; width: 20%; text-align: center"><button name="send" value="/factions buy backgroundmusic">Background and music tokens</button></td><td style="border: 2px solid #070e96; width: 70%; text-align: center">Buys background and music tokens for everyone in the faction</td><td style="border: 2px solid #070e96; width: 10%; text-align: center">${(userCount <= 15 ? 10 * userCount : (10 * userCount) + (-2 * userCount))}</td></tr>`;
			display += `<tr><td style="border: 2px solid #070e96; width: 20%; text-align: center"><button name="send" value="/factions buy avatars">Avatars</button></td><td style="border: 2px solid #070e96; width: 70%; text-align: center">Buys Avatars for everyone in the faction</td><td style="border: 2px solid #070e96; width: 10%; text-align: center">${(userCount <= 15 ? 20 * userCount : (20 * userCount) + (-2 * userCount))}</td></tr>`;
			display += `<tr><td style="border: 2px solid #070e96; width: 20%; text-align: center"><button name="send" value="/factions buy xpbooster2x">XP booster 2x</button></td><td style="border: 2px solid #070e96; width: 70%; text-align: center">Buys 2x XP booster for everyone in the faction</td><td style="border: 2px solid #070e96; width: 10%; text-align: center">${(userCount <= 15 ? 50 * userCount : (50 * userCount) + (-8 * userCount))}</td></tr>`;
			display += `</table></div>`;
			return this.sendReplyBox(display);
		},

		buy(target, room, user) {
			let factionId = toID(getFaction(user.userid));
			if (!getFaction(user.userid)) return false;
			if (toID(getFactionRank(user.userid)) !== "owner") return false;
			let userCount = factions[toID(getFaction(user.userid))].users.length;
			let items = ["icons", "backgroundmusic", "avatars", "xpbooster2x"];
			if (items.indexOf(toID(target)) === -1) return this.errorReply(`Shop items are ${Chat.toListString(items)}.`);
			let price = 1; // place holder price that is changed
			if (toID(target) === "icons" && userCount < 15) {
				price = 10 * userCount;
			} else if (toID(target) === "icons" && userCount > 15) {
				price = (10 * userCount) + (-2 * userCount);
			}
			if (toID(target) === "backgroundmusic" && userCount < 15) {
				price = 10 * userCount;
			} else if (toID(target) === "backgroundmusic" && userCount > 15) {
				price = (10 * userCount) + (-2 * userCount);
			}
			if (toID(target) === "avatars" && userCount < 15) {
				price = 20 * userCount;
			} else if (toID(target) === "avatars" && userCount > 15) {
				price = (20 * userCount) + (-2 * userCount);
			}
			if (toID(target) === "xpbooster2x" && userCount < 15) {
				price = 50 * userCount;
			} else if (toID(target) === "xpbooster2x" && userCount > 15) {
				price = (50 * userCount) + (-8 * userCount);
			}
			if (Db.factionbank.get(factionId, 0) < price) return this.errorReply(`You do not have enough faction coins in the bank!`);
			if (!factions[factionId].boughtItems) factions[factionId].boughtItems = {};
			let broke = false;
			for (let u in factions[factionId].users) {
				if (!factions[factionId].boughtItems[factions[factionId].users[u]]) factions[factionId].boughtItems[factions[factionId].users[u]] = {};
				if (factions[factionId].boughtItems[factions[factionId].users[u]][toID(target)] && !user.buyAgain) {
					broke = true;
					break;
				}
				factions[factionId].boughtItems[factions[factionId].users[u]][toID(target)] = "not claimed";
			}
			write();
			if (broke) {
				user.buyAgain = true;
				return this.errorReply(`Someone in your faction still has not claimed the last of ${target}! Please buy again if you wish to overwrite their current one! They will not be able to claim the last one.`);
			}
			Db.factionbank.set(factionId, Db.factionbank.get(factionId, 0) - price);
			if (user.buyAgain) delete user.buyAgain;
			factionPM(`Your faction has just bought ${target} for the entire faction! Please claim it with /faction claim item. To view your pending claim list use /faction claimlist`, factionId);
			if (toID(target) === "xpbooster3x") {
				factions[factionId].xpBoost = Date.now();
				write();
				factionPM(`The XP BOOSTER 3x will expire in 3 days! It only applies to FvFs (factions vs factions). Please use it wisely!`, factionId);
			}
			return this.sendReplyBox(`${target} was purchased for the faction.`);
		},

		claimlist(target, room, user) {
			if (!getFaction(user.userid)) return false;
			let factionId = toID(getFaction(user.userid));
			if (!factions[factionId].boughtItems) factions[factionId].boughtItems = {}; // safety catch!
			if (!factions[factionId].boughtItems[user.userid]) return this.errorReply(`You have no items waiting to be claimed.`);
			let list = Object.keys(factions[factionId].boughtItems[user.userid]);
			return this.sendReplyBox(`List of unclaimed items: ${Chat.toListString(list)}<br /><br /> Claim the items with /factions claim item.`);
		},

		claim(target, room, user) {
			if (!getFaction(user.userid)) return false;
			let factionId = toID(getFaction(user.userid));
			if (!factions[factionId].boughtItems) factions[factionId].boughtItems = {}; // safety catch!
			if (!factions[factionId].boughtItems[user.userid]) return this.errorReply(`You have no items to be claimed.`);
			if (!factions[factionId].boughtItems[user.userid][toID(target)]) return this.errorReply(`That item was never bought or you already claimed it.`);
			delete factions[factionId].boughtItems[user.userid][toID(target)];
			write();
			if (toID(target) === "backgroundmusic") {
				user.tokens["background"] = true;
				user.tokens["music"] = true;
				return this.sendReply(`You now have tokens for profile music and background please refer to /help usetoken for more information on how to claim them.`);
			} else if (toID(target) === "avatars" || toID(target) === "icons") {
				user.tokens[toID(target)] = true;
				return this.sendReply(`You now have tokens for ${target} please refer to /help usetoken for more information on how to claim it.`);
			} else if (toID(target) === "xpbooster2x") {
				user.doubleExp = true;
				setTimeout(() => {
					delete user.doubleExp;
				}, 60000);
				return this.sendReply(`You will now have doubleExp for the next hour!`);
			}
		},

		coins: {
			"": "atm",
			coins: "atm",
			atm(target, room, user) {
				if (!getFaction(user.userid)) return this.errorReply(`You are not in a faction!`);
				let coins = Db.factionCoins.get(user.userid, 0);
				this.sendReplyBox(`You currently have ${coins.toLocaleString()} ${coins === 1 ? `coin` : `coins`}.`);
			},

			give: "donate",
			donate(target, room, user) {
				if (!getFaction(user.userid)) return this.errorReply(`You are not in a faction!`);
				if (Db.factionCoins.get(user.userid, 0) <= 0) return this.errorReply(`You don't have any coins to donate!`);
				Db.factionbank.set(toID(getFaction(user.userid)), Db.factionbank.get(toID(getFaction(user.userid)), 0) + Db.factionCoins.get(user.userid, 0));
				return this.sendReply(`Your faction coins are now in ${getFaction(user.userid)}'s bank.`);
			},
		},

		reserve: "bank",
		bank: {
			balance: "atm",
			bal: "atm",
			atm(target) {
				if (!this.runBroadcast()) return;
				if (!target) return this.errorReply("/faction bank atm [faction]");
				let targetId = toID(target);
				if (!factions[targetId]) return this.errorReply(`${target} is not a faction.`);
				let bank = Db.factionbank.get(targetId, 0);
				return this.sendReplyBox(`${factions[targetId].name} has ${bank.toLocaleString()} ${bank === 1 ? `coin` : `coins`} in their reserve.`);
			},

			give(target) {
				let [faction, amount] = target.split(",").map(p => { return p.trim(); });
				if (!amount) return this.errorReply("/faction bank give [faction], [amount]");
				let name = toID(faction);
				if (!factions[name]) return this.errorReply(`${faction} is not a faction.`);
				if (!this.can("faction")) return false;
				amount = parseInt(amount);
				if (isNaN(amount)) return this.errorReply("That is not a number!");
				Db.factionbank.set(name, Db.factionbank.get(name, 0) + amount);
				return this.sendReply(`You have added ${amount.toLocaleString()} to ${factions[name].name}'s bank!`);
			},

			take(target) {
				let [faction, amount] = target.split(",").map(p => { return p.trim(); });
				if (!amount) return this.errorReply("/faction bank take [faction], [amount");
				let name = toID(faction);
				if (!factions[name]) return this.errorReply(`${faction} is not a faction.`);
				if (!this.can("faction")) return false;
				amount = parseInt(amount);
				if (isNaN(amount)) return this.errorReply("That is not a number!");
				Db.factionbank.set(name, Db.factionbank.get(name, 0) - amount);
				return this.sendReply(`You have taken ${amount.toLocaleString()} from ${factions[name].name}'s bank!`);
			},

			ladder(target) {
				if (!target) target = 100;
				target = Number(target);
				if (isNaN(target)) target = 100;
				if (!this.runBroadcast()) return;
				let keys = Db.factionbank.keys().map(name => {
					return {name: name, coins: Db.factionbank.get(name).toLocaleString()};
				});
				if (!keys.length) return this.sendReplyBox("Faction Bank Ladder is empty.");
				keys.sort(function (a, b) { return b.atm - a.atm; });
				this.sendReplyBox(rankLadder("Richest Factions", "Faction Coins", keys.slice(0, target), "coins") + "</div>");
			},

			reset(target) {
				if (!this.can("faction")) return false;
				let factionId = toID(target);
				if (!factions[factionId]) return this.errorReply(`${factionId} is not a faction!`);
				Db.factionbank.remove(factionId);
				return this.sendReply(`You have reset ${factionId}'s reserve!`);
			},
		},

		promote(target, room, user) {
			let [targetUser, rank] = target.split(",").map(p => { return p.trim(); });
			if (!rank) return this.errorReply("Usage: /faction promote [user], [rank]");

			let factionid = toID(getFaction(user.userid));
			targetUser = Users.getExact(targetUser);

			if (!factions[factionid]) return this.errorReply("You're not in a faction.");
			if (!targetUser || !targetUser.connected) return this.errorReply("That user is not online.");
			if (!factions[factionid].users.includes(targetUser.userid)) return this.errorReply("That user is not in your faction.");
			if (!factions[factionid].ranks[toID(rank)]) return this.errorReply("That rank does not exist.");
			if (factions[factionid].ranks[toID(rank)].users.includes(targetUser.userid)) return this.errorReply("That user already has that rank.");

			if (toID(getFactionRank(user.userid)) !== "owner") return this.errorReply("You don't have permission to change user's rank.");

			if (toID(rank) !== "owner") {
				for (let rank in factions[factionid].ranks) {
					if (rank === "owner") continue;
					if (factions[factionid].ranks[rank].users.includes(targetUser.userid)) {
						factions[factionid].ranks[rank].users.splice(factions[factionid].ranks[rank].users.indexOf(targetUser.userid), 1);
					}
				}
			}

			factions[factionid].ranks[toID(rank)].users.push(targetUser.userid);
			write();
			rank = factions[factionid].ranks[toID(rank)].title;
			targetUser.send(`|popup||html|${Server.nameColor(user.name, true, true)} has set your faction rank in ${factions[factionid].name} to ${rank}.`);
			this.sendReply(`You've set ${targetUser.name}'s faction rank to ${rank}.`);
		},

		demote(target, room, user) {
			let [targetUser, rank] = target.split(",").map(p => { return p.trim(); });
			if (!rank) return this.errorReply("Usage: /faction demote [user], [rank]");
			let factionid = toID(getFaction(user.userid));

			if (!factions[factionid]) return this.errorReply("You're not in a faction.");
			if (!toID(targetUser) || toID(targetUser).length > 18) return this.errorReply("That's not a valid username.");
			if (!factions[factionid].users.includes(toID(targetUser))) return this.errorReply("That user is not in your faction.");
			if (!factions[factionid].ranks[toID(rank)]) return this.errorReply("That rank does not exist.");
			if (!factions[factionid].ranks[toID(rank)].users.includes(targetUser)) return this.errorReply("That user does not have that rank.");
			if (toID(rank) === "owner" && toID(targetUser) === user.userid) return this.errorReply("You can't remove owner from yourself. Give another user owner and have them remove it if you're transfering ownership of the faction.");

			if (toID(getFactionRank(user.userid)) !== "owner") return this.errorReply("You don't have permission to change user's ranks.");

			let hasOtherRanks;
			for (let r in factions[factionid].ranks) {
				if (r === toID(rank)) continue;
				if (factions[factionid].ranks[r].users.includes(targetUser)) {
					hasOtherRanks = true;
				}
			}
			if (!hasOtherRanks) factions[factionid].ranks["commoner"].users.push(toID(targetUser));
			factions[factionid].ranks[toID(rank)].users.splice(factions[factionid].ranks[toID(rank)].users.indexOf(toID(targetUser)), 1);
			write();
			if (Users.get(targetUser) && Users.get(targetUser).connected) {
				Users.get(targetUser).send(`|popup||html|${Server.nameColor(user.name, true, true)} has removed you from the faction rank ${rank} in ${factions[factionid].name}.`);
			}
			this.sendReply(`You've removed ${targetUser} from the faction rank ${rank}.`);
		},

		pending() {
			if (!this.can("faction")) return false;
			let output = `<center><table border="1" cellspacing ="0" cellpadding="3"><tr><td>Faction</td><td>Description</td><td>Approve</td></tr>`;
			for (let faction in factions) {
				if (!factions[faction].approved) {
					output += `<tr>`;
					output += `<td>${factions[faction].name}</td>`;
					output += `<td>${factions[faction].desc}</td>`;
					output += `<td><button name="send" value="/faction approve ${faction}">Approve ${factions[faction].name}</button></td>`;
				}
			}
			output += `</table></center>`;
			this.sendReplyBox(output);
		},

		"": "help",
		help() {
			this.parse("/help faction");
		},
	},
	factionhelp: [
		`Faction Help Commands:
		/faction create (name), (description), (tag[4 char]) - Creates a faction.
		/faction delete (name)  - Deletes [faction] from the server. Requires Faction Owner or Global Moderator or higher.
		/faction list - List all of the factions on ${Config.serverName}.
		/faction shop - Displays the faction's shop.
		/faction claimlist - Displays what you still have left to claim from the faction shop.
		/faction claim [item] - Claims [item] from your faction's claim list.
		/faction privatize - Privatizes your faction.
		/faction profile (optional faction) - Displays [faction]'s profile; defaults to your own faction.
		/faction join (faction) - Joins a non-private [faction].
		/faction invite (user) - Invites [user] to your faction.
		/faction blockinvites - Block invites from factions.
		/faction unblockinvites - Unblock invites from factions.
		/faction accept (faction) - Accepts an invite from [faction].
		/faction decline (faction) - Decline an invite from [faction].
		/faction leave - Leaves the faction you're in.
		/faction bank atm (optional faction) - Shows [faction]'s bank; defaults to your faction.
		/faction bank give (faction), (amount) - Adds [amount] to [faction]'s bank.
		/faction bank take (faction), amount - Takes [amount] from [faction]'s bank.
		/faction ban (name) - Bans [user] from your faction.
		/faction unban (name) - Unbans [user] from your faction.
		/faction promote (user), (rank) - Promotes [user] to [rank] in your faction.
		/faction demote (user), (rank) - Demotes [user] to [rank] in your faction.
		/faction avatar (image)  - Requests [image] as the faction avatar for your faction profile. Must be Faction Owner.
		/faction approveavatar (faction), (the requested avatar) - Approves [faction]'s avatar [avatar].  You must be a Global Moderator or higher to use this!
		/faction denyavatar (faction) - Denys [faction]'s avatar.  You must be a Global Moderator or higher to use this!
		/faction pendingavatars - Shows pending faction avatars. You must be a Global Moderator or higher to use this!
		/faction pending - Displays a list of pending factions waiting for approval. You must be a Global Moderator or higher to use this!`,
	],

	fvf: {
		challenge(target, room, user) {
			if (!target) return this.errorReply("Usage: /fvf challenge [faction], [mode], [size], [tier]");
			let [faction, mode, size, tier] = target.split(",").map(p => { return p.trim(); });

			if (!tier) return this.errorReply("Usage: /fvf challenge [faction], [mode], [size], [tier]");
			if (!getFaction(user.userid)) return this.errorReply("You're not in a faction.");

			let targetFactionid = toID(faction);
			let factionId = toID(getFaction(user.userid));
			if (factionId === targetFactionid) return this.errorReply("You can't challenge your own faction.");
			if (!mode) {
				mode = "normal";
			} else {
				mode = toID(mode);
			}
			size = Number(size);
			tier = toID(tier);
			if (!Dex.getFormat(tier).exists) return this.errorReply("That is not a tier!");
			if (!factions[targetFactionid]) return this.errorReply("That faction does not exist.");
			if (mode !== "normal" && mode !== "quick") return this.errorReply("That's not a valid mode. Valid modes: normal, quick.");
			if (isNaN(size) || size < 3 || size > 15) return this.errorReply("Please specify a size of at least 3 and no larger than 15.");
			if (size % 2 === 0) return this.errorReply("Size must be an odd number.");

			if (Rooms.global.FvF[factionId] && Rooms.global.FvF[factionId].challenging) return this.errorReply(`You're already challenging ${factions[Rooms.global.FvF[factionId].challenging].name}.`);
			if (Rooms.global.FvF[factionId] && Rooms.global.FvF[factionId].challenger) return this.errorReply(`Your faction is being challenged by ${factions[Rooms.global.FvF[factionId].challenger].name}. Please accept or deny it before challenging a faction.`);
			if (room.fvf) return this.errorReply("There's currently a faction vs faction running in this room.");
			if (toID(getFactionRank(user.userid)) !== "noble" && toID(getFactionRank(user.userid)) !== "owner") return this.errorReply("You don't have permission to start a faction vs faction.");
			if (!user.can("faction", null, room)) return this.errorReply("You don't have permission to start a faction vs faction in that room.");

			let fvfId = Server.randomString(10);

			Rooms.global.FvF[factionId] = {
				challenging: targetFactionid,
				room: room.id,
			};
			Rooms.global.FvF[targetFactionid] = {
				challenger: factionId,
				room: room.id,
			};

			room.fvf = {
				fvfId: fvfId,
				factions: [
					{
						id: factionId,
						name: factions[factionId].name,
						players: [],
						invites: [],
						wins: 0,
					},
					{
						id: targetFactionid,
						name: factions[targetFactionid].name,
						players: [],
						invites: [],
						wins: 0,
						pending: true,
					},
				],
				tier: tier,
				size: size,
				started: false,
				status: [],
				types: {},
				statusNumber: 0,
				accepted: false,
				mode: mode,
			};

			for (let i = 0; i < size.length; i++) room.fvf.status.push((mode === "normal" ? 3 : 2));
			if (factions[factionId].xpBoost + 259200000 >= Date.now()) delete factions[factionId].xpBoost;
			if (factions[targetFactionid].xpBoost + 259200000 >= Date.now()) delete factions[targetFactionid].xpBoost;

			factionPM(
				`${Server.nameColor(user.name, true, true)} (${getFaction(user.userid)}) has challenged your faction to a Faction vs Faction (${size} v ${size}) in` +
				`<button name="joinRoom" value="${room.id}">${room.title}</button>.<br />` +
				`<button name="send" value="/fvf accept">Accept</button> | <button name="send" value="/fvf deny">Decline</button>`, targetFactionid
			);
			factionPM(
				`${Server.nameColor(user.name, true, true)} has challenged ${factions[targetFactionid].name} to a Faction vs Faction (` +
				`${size} v ${size}) in <button name="joinRoom" value="${room.id}">${room.title}</button>`
			);
			room.add(`|uhtml|fvf-${fvfId}|<div class="infobox"><center>${Server.nameColor(user.name, true, true)} has challenged ${factions[targetFactionid].name} to a Faction vs Faction. (${size} v ${size})<br />Waiting for a response...</center></div>`);
		},

		accept(target, room, user) {
			if (!getFaction(user.userid)) return this.errorReply("You're not in a faction.");
			if (toID(getFactionRank(user.userid)) !== "noble" && toID(getFactionRank(user.userid)) !== "owner") return this.errorReply("You don't have permission to accept Faction vs Factions.");
			let factionId = toID(getFaction(user.userid));
			if (!Rooms.global.FvF[factionId] || !Rooms.global.FvF[factionId].challenger) return this.errorReply("Your faction doesn't have any pending challenges.");
			let targetFactionid = Rooms.global.FvF[factionId].challenger;
			let targetRoom = Rooms.get(Rooms.global.FvF[factionId].room);

			targetRoom.fvf.accepted = true;
			fvfDisplay(targetRoom);

			factionPM(`${Server.nameColor(user.name, true, true)} has accepted the Faction vs Faction challenge against ${factions[targetFactionid].name}`, factionId);
			factionPM(`${Server.nameColor(user.name, true, true)} (${factions[factionId].name}) has accepted the Faction vs Faction challenge against your faction.`, targetFactionid);

			this.sendReply(`You've accepted the Faction vs Faction against ${factions[targetFactionid].name}.`);
		},

		deny(target, room, user) {
			if (!getFaction(user.userid)) return this.errorReply("You're not in a faction.");
			if (toID(getFactionRank(user.userid)) !== "noble" && toID(getFactionRank(user.userid)) !== "owner") return this.errorReply("You don't have permission to deny Faction vs Factions.");
			let factionId = toID(getFaction(user.userid));
			if (!Rooms.global.FvF[factionId] || !Rooms.global.FvF[factionId].challenger) return this.errorReply("Your faction doesn't have any pending challenges.");
			let targetFactionid = Rooms.global.FvF[factionId].challenger;
			let targetRoom = Rooms.get(Rooms.global.FvF[factionId].room);
			targetRoom.add(`|uhtmlchange|fvf-${targetRoom.fvf.fvfId}|`);
			targetRoom.add(`|uhtml|fvf-${targetRoom.fvf.fvfId}|<div class="infobox">(${factions[factionId].name} has declined the Faction vs Faction challenge.)</div>`);

			factionPM(`${Server.nameColor(user.name, true, true)} has declined the Faction vs Faction challenge against ${factions[targetFactionid].name}.`, factionId);
			factionPM(`${Server.nameColor(user.name, true, true)} (${factions[factionId].name}) has declined the Faction vs Faction challenge against your faction.`, targetFactionid);

			delete Rooms.global.FvF[targetFactionid];
			delete Rooms.global.FvF[factionId];
			delete targetRoom.fvf;
			this.sendReply(`You've declined the Faction vs Faction against ${factions[targetFactionid].name}.`);
		},

		invite(target, room, user) {
			if (!target) return this.errorReply("Usage: /fvf invite [user] - Invites a faction member to the join a Faction vs Faction.");
			if (!getFaction(user.userid)) return this.errorReply("You're not in a faction.");
			if (toID(getFactionRank(user.userid)) !== "noble" && toID(getFactionRank(user.userid)) !== "owner") return this.errorReply("You don't have permission to invite users to join a Faction vs Faction.");

			let factionId = toID(getFaction(user.userid));
			let targetUser = Users.get(target);
			let targetUserFaction = getFaction(target);

			if (!Rooms.global.FvF[factionId]) return this.errorReply("Your faction is not in a Faction vs Faction.");
			if (!targetUser || !targetUser.connected) return this.errorReply("That user is not online.");
			let targetRoom = Rooms.get(Rooms.global.FvF[factionId].room);
			let faction = targetRoom.fvf.factions[0];
			let targetFaction = targetRoom.fvf.factions[1];
			if (targetRoom.fvf.factions[1].id === factionId) {
				faction = targetRoom.fvf.factions[1];
				targetFaction = targetRoom.fvf.factions[0];
			}
			if (!targetUserFaction || toID(targetUserFaction) !== factionId);
			if (faction.players.includes(targetUser.userid)) return this.errorReply("That user has already joined this Faction vs Faction.");
			if (faction.invites.includes(targetUser.userid)) return this.errorReply("That user has already been invited to join the Faction vs Faction.");

			faction.invites.push(targetUser.userid);
			factionPM(`${Server.nameColor(user.name, true, true)} has invited ${Server.nameColor(targetUser.name, true, true)} to join the Faction vs Faction against ${factions[targetFaction.id].name}`, factionId);
			targetUser.send(`|popup||modal||html|${Server.nameColor(user.name, true, true)} has invited you to join the Faction vs Faction against ${factions[targetFaction.id].name} in the room <button name="joinRoom" value="${targetRoom.id}">${targetRoom.title}</button>`);
			this.sendReply(`You've invited ${targetUser.name} to join the Faction vs Faction.`);
		},

		join(target, room, user) {
			if (!room.fvf) return this.errorReply("There's no Faction vs Faction in this room.");
			if (!getFaction(user.userid)) return this.errorReply("You're not in a faction.");
			if (!room.fvf.accepted) return this.errorReply("This Faction vs Faction hasn't been accepted yet.");

			let factionId = toID(getFaction(user.userid));
			if (room.fvf.factions[0].id !== factionId && room.fvf.factions[1].id !== factionId) return this.errorReply("Your faction is not apart of this Faction vs Faction.");

			let faction = room.fvf.factions[0];

			if (room.fvf.factions[1].id === factionId) faction = room.fvf.factions[1];

			if (!faction.invites.includes(user.userid)) return this.errorReply("You haven't been invited to join this Faction vs Faction.");
			if (faction.players.length >= room.fvf.size) return this.errorReply("Your faction's team is already full.");
			if (faction.players.includes(user.userid)) return this.errorReply("You've already joined this Faction vs Faction.");

			faction.players.push(user.userid);
			room.addRaw(`${Server.nameColor(user.name, true, true)} has joined the Faction vs Faction for ${getFaction(user.userid)}.`);
			fvfDisplay(room);
		},

		leave(target, room, user) {
			if (!room.fvf) return this.errorReply("There's no Faction vs Faction in this room.");
			if (!getFaction(user.userid)) return this.errorReply("You're not in a faction.");
			if (!room.fvf.accepted) return this.errorReply("This Faction vs Faction hasn't been accepted yet.");

			let factionId = toID(getFaction(user.userid));
			if (room.fvf.factions[0].id !== factionId && room.fvf.factions[0].id !== factionId) return this.errorReply("Your faction is not apart of this Faction vs Faction.");

			let faction = room.fvf.factions[0];

			if (room.fvf.factions[1].id === factionId) faction = room.fvf.factions[1];
			if (!faction.players.includes(user.userid)) return this.errorReply("You haven't joined this Faction vs Faction.");
			if (room.fvf.started) return this.errorReply("You can't leave a Faction vs Faction after it starts.");

			faction.players.splice(faction.players.indexOf(user.userid), 1);
			room.addRaw(`${Server.nameColor(user.name, true, true)} has left the Faction vs Faction.`);
			fvfDisplay(room);
		},

		end(target, room, user) {
			if (!target) return this.errorReply("Usage: /fvf end [room]");
			if (!getFaction(user.userid)) return this.errorReply("You're not in a faction.");

			if (toID(getFactionRank(user.userid)) !== "noble" && toID(getFactionRank(user.userid)) !== "owner") return this.errorReply("You don't have permission to end Faction vs Factions.");

			let targetRoom = Rooms.get(toID(target));
			if (!targetRoom) return this.errorReply("That room does not exist.");
			if (!targetRoom.fvf) return this.errorReply("There's no Faction vs Faction in that room.");

			let factionId = toID(getFaction(user.userid));
			if (targetRoom.fvf.factions[0].id !== factionId && targetRoom.fvf.factions[1].id !== factionId) return this.errorReply("Your faction is not apart of this Faction vs Faction.");

			let targetFactionid = room.fvf.factions[0].id;
			if (targetRoom.fvf.factions[1].id !== factionId) targetFactionid = targetRoom.fvf.factions[1].id;

			targetRoom.add(`|uhtmlchange|fvf-${targetRoom.fvf.fvfId}|`);
			targetRoom.add(`|uhtml|fvf-${targetRoom.fvf.fvfId}|(The Faction vs Faction has been forcibly ended by ${Server.nameColor(user.name, true, true)} (${factions[factionId].name}))`);

			factionPM(`${Server.nameColor(user.name)} has forcibly ended the Faction vs Faction with ${factions[targetFactionid].name}.`, factionId);

			delete Rooms.global.FvF[targetFactionid];
			delete Rooms.global.FvF[factionId];
			delete targetRoom.fvf;
		},

		"": "help",
		help() {
			this.parse("/help fvf");
		},
	},
	fvfhelp: [
		`Faction vs Faction Commands:
		/fvf challenge [faction], [mode (normal or quick)], [size (must be odd number)], [tier] - Challenges a faction to a Faction vs Faction in the current room.
		(Quick mode lets players battle each other at the same time, normal mode limits it to one battle at a time.)
		/fvf accept - Accepts a challenge from a faction.
		/fvf deny - Denies a challenge from a faction.
		/fvf invite [user] - Invites a faction member to join the Faction vs Faction.
		/fvf join - Joins a Faction vs Faction. Must be invited with /fvf invite first.
		/fvf leave - Leaves a Faction vs Faction after you join. May not be used once the Faction vs Faction starts.
		/fvf end - Forcibly ends a Faction vs Faction.`,
	],
};
