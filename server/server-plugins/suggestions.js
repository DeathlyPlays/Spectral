/********************************************
 * Suggestions Index for Pokemon Showdown	*
 * Created by: flufi						*
 ********************************************/

"use strict";

const FS = require("../lib/fs.js");

let suggestions = FS("config/chat-plugins/suggestion-index.json").readIfExistsSync();

if (suggestions !== "") {
	suggestions = JSON.parse(suggestions);
} else {
	suggestions = {};
}

function write() {
	FS("config/chat-plugins/suggestion-index.json").writeUpdate(() => (
		JSON.stringify(suggestions)
	));
	let data = "{\n";
	for (let u in suggestions) {
		data += '\t"' + u + '": ' + JSON.stringify(suggestions[u]) + ",\n";
	}
	data = data.substr(0, data.length - 2);
	data += "\n}";
	FS("config/chat-plugins/suggestion-index.json").writeUpdate(() => (
		data
	));
}

exports.commands = {
	suggestions: "suggestion",
	suggestion: {
		suggest: "submit",
		request: "submit",
		submit: function (target, room, user) {
			let [suggestion, title] = target.split(",").map(p => p.trim());
			if (!suggestion[1]) return this.errorReply("/suggestion submit [title], [suggestion]");
			if (title.length > 30) return this.errorReply("Please make sure your suggestion title is 30 characters or less.");
			if (suggestion.length > 500) return this.errorReply("Please make your suggestion 500 characters or less.");
			if (Rooms.get("staff")) Rooms.get("staff").add(`/raw <div style="border: #000000 solid 2px;"><center><br><font size="1">${Server.nameColor(user.name, true, true)} has submitted a suggestion:</font>"${suggestion}"</center><br /></div>`);
			suggestions[toId(title)] = {
				user: user.userid,
				title: title,
				id: toId(title),
				desc: suggestion,
			};
			write();
			return this.sendReply(`Your suggestion has been submitted to the index and will be reviewed soon.`);
		},

		remove: "delete",
		delete: function (target) {
			if (!this.can("ban")) return false;
			if (!target) return this.errorReply("Please enter a valid suggestion ID.");
			let suggestionid = toId(target);
			if (!suggestions[suggestionid]) return this.errorReply(`${target} is not currently registered as a suggestion.`);
			delete suggestions[suggestionid];
			write();
			this.sendReply(`Suggestion "${target}" has been deleted.`);
		},

		viewindex: "list",
		index: "list",
		suggestions: "list",
		list: function (target, room) {
			if (!this.can("ban")) return false;
			if (!this.runBroadcast()) return;
			if (this.broadcasting && room.id !== "staff") return this.errorReply(`You cannot broadcast the suggestions index outside of the Staff room.`);
			if (Object.keys(suggestions).length < 1) return this.errorReply(`There are no suggestions on ${Config.serverName} yet.`);
			let output = `<strong><u>Suggestions (${Object.keys(suggestions).length})</u></strong><br />`;
			for (let suggestion in suggestions) output += `<strong>${suggestion}</strong> <button class="button" name="send" value="/suggestions view ${suggestion}">View ${suggestion}</button><br />`;
			this.sendReplyBox(output);
		},

		display: "view",
		view: function (target, room) {
			if (!this.can("ban")) return false;
			if (room && room.id === "staff" && !this.runBroadcast()) return;
			let suggestion = toId(target);
			if (!suggestions[suggestion]) return this.errorReply(`The suggestion "${target}" is not currently a suggestion on ${Config.serverName}.`);
			this.sendReplyBox(`<strong>"${suggestions[suggestion].title}"</strong> was suggested by ${Server.nameColor(suggestions[suggestion].user, true, true)}:<br /> ${suggestions[suggestion].desc}`);
		},

		"": "help",
		help: function () {
			this.parse("/help suggestion");
		},
	},

	suggestionhelp: [
		`/suggestions submit [title], [suggestion] - Submits a suggestion to the index.
		/suggestions remove [suggestion id] - Deletes a suggestion from the index. Requires @ and up.
		/suggestions index - Displays all the suggestions in the index. Requires @ and up.
		/suggestions view [suggestion] - Views [suggestion]. Requires @ and up.
		/suggestions help - Shows available suggestion commands.`,
	],
};
