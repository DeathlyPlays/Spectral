/********************************
 * Chat log viewer plugin by jd	*
 * Rewrote by Insist			*
 ********************************/

"use strict";

const FS = require("../lib/fs.js");
const MAX_LINES = 1000;

exports.commands = {
	viewlogs: function (target, room, user) {
		if (target) {
			let targets = target.split(",").map(p => { return p.trim(); });
			if (!targets[1]) return this.errorReply("Please use /viewlogs with no target.");
			switch (toID(targets[0])) {
			case "month":
				if (!targets[1]) return this.errorReply("Please use /viewlogs with no target.");
				if (!permissionCheck(user, targets[1])) return this.errorReply("/viewlogs - Access denied.");
				let months = FS(`logs/chat/${targets[1]}`).readdirSync();
				user.send(`|popup||html|Choose a month: ${generateTable(months, `/viewlogs date, ${targets[1]},`)}`);
				return;
			case "date":
				if (!targets[2]) return this.errorReply("Please use /viewlogs with no target.");
				if (!permissionCheck(user, targets[1])) return this.errorReply("/viewlogs - Access denied.");
				let days = FS(`logs/chat/${targets[1]}/${targets[2]}`).readdirSync();
				user.send(`|popup||html|Choose a date: ${generateTable(days, `/viewlogspopup ${targets[1]},`)}`);
				return;
			default:
				this.errorReply("/viewlogs - Command not recognized.");
				break;
			}
		}

		let rooms = FS("logs/chat").readdirSync();
		let roomList = [], groupChats = [];

		for (let u in rooms) {
			if (!rooms[u]) continue;
			if (rooms[u] === "README.md") continue;
			if (!permissionCheck(user, rooms[u])) continue;
			(rooms[u].includes("groupchat-") ? groupChats : roomList).push(rooms[u]);
		}
		if (roomList.length < 1) return this.errorReply("You don't have access to view the logs of any rooms.");

		let output = "Choose a room to view the logs:";
		output += generateTable(roomList, "/viewlogs month,");
		output += `<br />Group Chats: ${generateTable(groupChats, "/viewlogs month,")}`;
		user.send(`|popup||wide||html|${output}`);
	},

	viewlogspopup: "viewlogs2",
	viewlogs2: function (target, room, user, connection, cmd) {
		if (!target) return this.sendReply("Usage: /viewlogs [room], [year-month-day / 2014-12-08] - Provides you with a temporary link to view the target rooms chat logs.");
		let [targetRoom, dateOfLogs] = target.split(",").map(p => { return p.trim(); });
		if (!dateOfLogs) return this.sendReply("Usage: /viewlogs [room], [year-month-day / 2014-12-08] -Provides you with a temporary link to view the target rooms chat logs.");
		if (!permissionCheck(user, targetRoom)) return this.errorReply("/viewlogs - Access denied.");
		let date;
		if (toID(dateOfLogs) === "today" || toID(dateOfLogs) === "yesterday") {
			date = new Date();
			if (toID(dateOfLogs) === "yesterday") date.setDate(date.getDate() - 1);
			date = date.toLocaleDateString("en-US", {
				day: "numeric",
				month: "numeric",
				year: "numeric",
			}).split("/").reverse();
			if (date[1] < 10) date[1] = `0${date[1]}`;
			if (date[2] < 10) date[2] = `0${date[2]}`;
			dateOfLogs = `${date[0]}-${date[2]}-${date[1]}`;
		}
		date = dateOfLogs.replace(/\.txt/, "");
		let splitDate = date.split("-");
		if (splitDate.length < 3) return this.sendReply("Usage: /viewlogs [room], [year-month-day / 2014-12-08] - Provides you with a temporary link to view the target rooms chat logs.");

		FS(`logs/chat/${targetRoom.toLowerCase()}/${splitDate[0]}-${splitDate[1]}/${date}.txt`).read().then(data => {
			FS("logs/viewlogs.log").append(`[${new Date().toUTCString()}] ${user.name} viewed the logs of ${toID(targetRoom)}. Date: ${date}\n`);

			if (!user.can("warn", null, Rooms.get(targetRoom))) {
				let lines = data.split("\n");
				for (let line in lines) {
					if (lines[line].substr(9).trim().charAt(0) === "(") lines.slice(line, 1);
				}
				data = lines.join("\n");
			}

			if (cmd === "viewlogspopup") {
				let output = `Displaying room logs of room "${targetRoom}" on ${date}<br />`;
				data = data.split("\n");
				for (let u in data) {
					if (data[u].length < 1) continue;
					let message = parseMessage(data[u], user.userid);
					if (message.length < 1) continue;
					output += `${message}<br />`;
				}
				return user.send(`|popup||wide||html|${output}`);
			}

			data = `${targetRoom}|${date}|${JSON.stringify(Server.customColors)}\n${data}`;
		});
	},

	searchlogs: function (target, room, user) {
		if (!target) return this.parse("/help searchlogs");
		let [roomName, phrase] = target.split(",").map(p => { return p.trim(); });
		if (!phrase) return this.errorReply("Please specify a phrase to search.");

		if (toID(roomName) === "all" && !this.can("hotpatch")) return false;
		if (!permissionCheck(user, toID(roomName))) return false;

		FS("logs/viewlogs.log").append(`[${new Date().toUTCString()}] ${user.name} searched the logs of ${toID(roomName)}" for "${phrase}".\n`);

		let pattern = escapeRegExp(phrase).replace(/\\\*/g, ".*");
		let command = 'grep -Rnw \'./logs/chat/' + (toID(roomName) === 'all' ? '' : toID(roomName)) + '\' -e "' + pattern + '"';

		require("child_process").exec(command, function (error, stdout, stderr) {
			if (error && stderr) {
				user.popup("/searchlogs doesn't support Windows.");
				console.log(`/searchlogs error: ${error}`);
				return false;
			}
			if (!stdout) return user.popup(`Could not find any logs containing "${pattern}".`);
			let output = "";
			stdout = stdout.split("\n");
			for (let i = 0; i < stdout.length; i++) {
				if (stdout[i].length < 1 || i > MAX_LINES) continue;
				let file = stdout[i].substr(0, stdout[i].indexOf(":"));
				let lineNumber = stdout[i].split(":")[1];
				let line = stdout[i].split(":");
				line.splice(0, 2);
				line = line.join(":");
				let message = parseMessage(line, user.userid);
				if (message.length < 1) continue;
				output += `<font color="#970097">${file}</font><font color="#00AAAA">:</font><font color="#008700">${lineNumber}</font><font color="#00AAAA">:</font>${message}<br />`;
			}
			user.send(`|popup||wide||html|Displaying last ${MAX_LINES} lines containing "${pattern}" ${(toID(roomName) === `all` ? `` : ` in "${roomName}"`)}:<br /><br />${output}`);
		});
	},
	searchlogshelp: ["/searchlogs [room / all], [phrase] - Phrase may contain * wildcards."],
};

function permissionCheck(user, room) {
	if (!Rooms.get(room) && !user.can("roomowner")) {
		return false;
	}
	if (!user.can("lock") && !user.can("warn", null, Rooms.get(room))) {
		return false;
	}
	if (Rooms.get(room) && Rooms.get(room).isPrivate && (!user.can("roomowner") && !user.can("warn", null, Rooms.get(room)))) {
		return false;
	}
	if (Rooms.get(room) && Rooms.get(room).isPersonal && (!user.can("roomowner") && !user.can("warn", null, Rooms.get(room)))) {
		return false;
	}
	if (toID(room) === "upperstaff" && !user.can("roomowner")) return false;
	return true;
}

function generateTable(array, command) {
	let output = "<table>";
	let count = 0;
	for (let u in array) {
		if (array[u] === "today.txt") continue;
		if (count === 0) output += "<tr>";
		output += `<td><button style="width: 100%" name="send" value="${command}${array[u]}">${(Rooms.get(array[u]) ? `` : `<font color="red">`)} ${array[u]} ${(Rooms.get(array[u]) ? `` : `</font>`)}</button></td>`;
		count++;
		if (count > 3) {
			output += `<tr />`;
			count = 0;
		}
	}
	output += `</table>`;
	return output;
}

function escapeRegExp(s) {
	return s.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
}

function parseMessage(message, user) {
	let timestamp = message.substr(0, 9).trim();
	message = message.substr(9).trim();
	let lineSplit = message.split("|");

	let name, highlight, div;

	switch (lineSplit[1]) {
	case "c":
		name = lineSplit[2];
		if (name === "~") break;
		highlight = new RegExp(`\\b${toID(user)}\\b`, `gi`);
		div = `chat`;
		if (lineSplit.slice(3).join("|").match(highlight)) div = `chat highlighted`;
		message = `<span class="${div}"><small>[${timestamp}]</small> <small>${name.substr(0, 1)}</small><strong>${Server.nameColor(name.substr(1))}:</font></strong><em>${Server.parseMessage(lineSplit.slice(3).join("|"))}</em></span>`;
		break;
	case "c:":
		name = lineSplit[3];
		if (name === "~") break;
		highlight = new RegExp(`\\b${toID(user)}\\b`, `gi`);
		div = "chat";
		if (lineSplit.slice(4).join("|").match(highlight)) div = `chat highlighted`;

		while (lineSplit[2].length < 13) lineSplit[2] = `${lineSplit[2]}0`;

		let date = new Date(Number(lineSplit[2]));
		let components = [date.getHours(), date.getMinutes(), date.getSeconds()];
		timestamp = components.map(function (x) { return (x < 10) ? "0" + x : x; }).join(":");

		message = `<span class="${div}"><small>[${timestamp}]</small> <small>${name.substr(0, 1)}</small>${Server.nameColor(toID(name), true)}<em>${Server.parseMessage(lineSplit.slice(4).join("|"))}</em></span>`;
		break;
	case "uhtml":
		message = `<span class="notice">${lineSplit.slice(3).join("|").trim()}</span>`;
		break;
	case "raw":
	case "html":
		message = `<span class="notice">${lineSplit.slice(2).join("|").trim()}</span>`;
		break;
	case "":
		message = `<span class="notice">${lineSplit.slice(1).join("|")}</span>`;
		break;
	case "j":
	case "J":
	case "l":
	case "L":
	case "N":
	case "n":
	case "unlink":
	case "userstats":
	case "tournament":
	case "uhtmlchange":
		message = "";
		break;
	default:
		message = `<span class="notice">${message}</span>`;
		break;
	}
	return message;
}
