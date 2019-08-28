/********************************
 * Pokemon Gen Requests for PS! *
 * Created by Insist			*
 ********************************/

"use strict";

const FS = require("./../lib/fs");
const REQUESTS_FILE = "config/chat-plugins/gen-requests.json";

let requests = FS(REQUESTS_FILE).readIfExistsSync();

if (requests !== "") {
	requests = JSON.parse(requests);
} else {
	requests = {};
}

function updateRequests() {
	FS(REQUESTS_FILE).writeUpdate(() => (
		JSON.stringify(requests)
	));
	let data = "{\n";
	for (let u in requests) {
		data += '\t"' + u + '": ' + JSON.stringify(requests[u]) + ",\n";
	}
	data = data.substr(0, data.length - 2);
	data += "\n}";
	FS(REQUESTS_FILE).writeUpdate(() => (
		data
	));
}

function alertGenners(message) {
	let genners = Db.genners.keys();
	for (let genner of genners) {
		genner = Users.get(genner);
		if (!genner || !genner.connected) continue;
		genner.send(`|pm|~Genner Alert|~|/raw ${message}`);
	}
	if (Rooms.get(`genrequests`)) {
		Rooms.get(`genrequests`).add(`|c|~Genner Alert|/raw ${message}`).update();
	}
}

function isGenner(user) {
	if (!user) return;
	if (typeof user === "object") user = user.userid;
	if (Db.genners.has(user)) return true;
	return false;
}
Server.isGenner = isGenner;

exports.commands = {
	genner: "genreq",
	genners: "genreq",
	genreqs: "genreq",
	requestgen: "genreq",
	genrequest: "genreq",
	genreq: {
		addgenner: "add",
		addgen: "add",
		approve: "add",
		give: "add",
		add(target, room, user) {
			if (!this.can("genrequest")) return false;
			let approvedGenner = toID(target);
			if (!approvedGenner || approvedGenner.length > 18) return this.errorReply(`This command requires a target with a maximum of 18 characters.`);
			if (isGenner(approvedGenner)) return this.errorReply(`${target} is already an approved genner.`);
			Db.genners.set(approvedGenner, 1);
			this.sendReply(`|html|${Server.nameColor(approvedGenner, true)} has been successfully been approved as a genner.`);
			if (Users.get(approvedGenner)) Users.get(approvedGenner).popup(`|html|You have been approved as a genner by ${Server.nameColor(user.name, true)}.`);
		},

		req: "request",
		request(target, room, user) {
			let [reward, description] = target.split(",").map(p => p.trim());
			reward = parseInt(reward);
			if (!user.autoconfirmed) return this.errorReply(`Only autoconfirmed Users.get( may use this command to prevent spam.`);
			if (!description) return this.parse("/genrequesthelp");
			if (isNaN(reward)) return this.errorReply(`The reward must be an integer.`);
			Economy.readMoney(user.userid, money => {
				if (money < reward) {
					this.errorReply(`You do not have enough ${moneyPlural} to give ${reward.toLocaleString()} as a reward.`);
					return;
				}

				requests[user.userid] = {
					user: user.userid,
					reward,
					description,
					lastUpdated: Date.now(),
					status: "active",
				};
				updateRequests();
				alertGenners(`${Server.nameColor(user.name, true)} has requested the following: "${description}"${reward > 0 ? `, and has offered ${reward.toLocaleString()} ${reward === 1 ? moneyName : moneyPlural} for your services` : ``}.`);
				this.sendReply(`Your request has been sent, check /genreq list to contact genners and to verify if they are approved.`);
			});
		},

		removegenner: "ban",
		bangenner: "ban",
		remove: "ban",
		unconfirm: "ban",
		kick: "ban",
		take: "ban",
		ban(target, room, user) {
			if (!this.can("genrequest")) return false;
			if (!target || target.length > 18) return this.parse("/genrequesthelp");
			let targetId = toID(target);
			if (!isGenner(targetId)) return this.errorReply(`${target} is not currently an approved genner.`);
			Db.genners.remove(targetId);
			this.sendReply(`|html|${Server.nameColor(target, true)} has been officially removed from being a genner.`);
			if (Users.get(targetId)) Users.get(targetId).popup(`|html|You have been approved as a genner by ${Server.nameColor(user.name, true)}.`);
		},

		users: "list",
		genner: "list",
		genners: "list",
		list(target, room, user) {
			if (!Db.genners.keys().length) return this.errorReply("There are currently zero approved genners.");
			let display = [];
			for (const approvedGenners of Db.genners.keys()) {
				 display.push(Server.nameColor(approvedGenners, Users.get(approvedGenners) && Users.get(approvedGenners).connected));
			}
			this.popupReply(`|html|<strong><u><font size="3"><center>Approved Genners:</center></font></u></strong>${Chat.toListString(display)}`);
		},

		cancel(target, room, user) {
			if (!requests[user.userid]) return this.errorReply(`You don't have any requests to cancel.`);
			delete requests[user.userid];
			updateRequests();
			return this.sendReply(`You have cancelled your gen request.`);
		},

		updatestatus: "update",
		update(target, room, user) {
			if (!isGenner(user)) return this.errorReply(`You are not an Approved Genner on ${Config.serverName}.`);
			if (!target) return this.parse("/genrequesthelp");
			let [requestee, status] = target.split(",").map(p => { return p.trim(); });
			let requesteeId = toID(requestee);
			if (!requests[requesteeId]) return this.errorReply(`${requestee} does not appear to have a request.`);
			let statuses = ["genning", "finished"];
			if (!statuses.includes(status)) return this.errorReply(`${status} isn't a valid status. Valid statuses are: ${Chat.toListString(statuses)}.`);
			requests[requesteeId].status = status;
			if (status === "genning") {
				if (Users.get(requesteeId) && Users.get(requesteeId).connected) Users.get(requesteeId).send(`|pm|${user.getIdentity()}|${Users.get(requesteeId).getIdentity()}|/raw ${Server.nameColor(user.name, true)} is currently genning your request.`);
			} else {
				if (Users.get(requesteeId) && Users.get(requesteeId).connected) Users.get(requesteeId).send(`|pm|${user.getIdentity()}|${Users.get(requesteeId).getIdentity()}|/raw ${Server.nameColor(user.name, true)} has finished your gen request.${requests[requesteeId].reward > 0 ? `<br />You owe ${Server.nameColor(user.name, true)} ${requests[requesteeId].reward} ${requests[requesteeId].reward === 1 ? moneyName : moneyPlural}, failure to do so may result in punishment.` : ``}`);
				delete requests[requesteeId];
			}
			updateRequests();
			return this.sendReply(`You have successfully marked ${requestee}'${requestee.endsWith("s") ? `` : `s`} request as ${status}.`);
		},

		viewreqs: "requests",
		reqs: "requests",
		viewrequests: "requests",
		requests(target, room, user) {
			if (!isGenner(user)) return this.errorReply(`You must be an approved genner to view requests.`);
			if (Object.keys(requests).length < 1) return this.errorReply(`There are currently no Gen Requests on ${Config.serverName}.`);
			let sortedReqs = Object.keys(requests).sort(function (a, b) {
				return requests[a].lastUpdated - requests[b].lastUpdated;
			});
			let reqList = `<h2 style="text-align: center; font-weight: bold">${Config.serverName} Gen Requests:</h2>`;
			reqList += `<table border="1" cellspacing ="0" cellpadding="5"><tr style="font-weight: bold"><td>User:</td><td>Description:</td><td>Status:</td><td>Reward:</td><td>Last Updated:</td></tr><tr>`;
			for (let req of sortedReqs) {
				req = requests[req];
				reqList += `<td style="border: 2px solid #000000; width: 20%; text-align: center"><button class="button" name="parseCommand" value="/user ${req.user}">${Server.nameColor(req.user, true, true)}</button></td>`;
				reqList += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${req.description}</td>`;
				reqList += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${req.status}</td>`;
				reqList += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${req.reward.toLocaleString()}</td>`;
				reqList += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${new Date(req.lastUpdated)}</td>`;
			}
			reqList += `</tr></table>`;
			return this.sendReplyBox(reqList);
		},

		"": "help",
		help(target, room, user) {
			this.parse("/genrequesthelp");
		},
	},

	genrequesthelp: [
		`Gen Req Commands: [Made by Insist]
		/genreq request [reward], [request] - Requests [request] to be genned and alerts all active approved genners, and offers [reward] ${moneyPlural} for the reward.
		/genreq approve [user] - Approves [user] as a genner. Requires % and up.
		/genreq ban [user] - Bans [user] from being a genner. Requires % and up.
		/genreq list - Displays all of ${Config.serverName}'s approved genners.
		/genreq update [user], [genning | finished] - Updates [user]'s request status.
		/genreq requests - Views all of the requests on ${Config.serverName}. Must be an Approved Genner.
		/genrequest help - Displays this command.`,
	],
};
