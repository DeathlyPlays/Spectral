/****************************************
 * Symbol Colors for Pokemon Showdown	*
 * Created by Prince Sky				*
 * Based off of Icons					*
 ****************************************/

"use strict";

const FS = require("../lib/fs.js");

let sc = FS("config/symbolcolors.json").readIfExistsSync();

if (sc !== "") {
	sc = JSON.parse(sc);
} else {
	sc = {};
}

function updateSC() {
	FS("config/symbolcolors.json").writeUpdate(() => (
		JSON.stringify(sc)
	));

	let newCss = `/* Symbol Colors START */\n`;

	for (let name in sc) {
		newCss += generateCSS(name, sc[name]);
	}
	newCss += `/* Symbol Colors END */\n`;

	let file = FS("config/custom.css").readIfExistsSync().split("\n");
	if (~file.indexOf("/* Symbol Colors START */")) file.splice(file.indexOf("/* Symbol Colors START */"), (file.indexOf("/* Symbol Colors END */") - file.indexOf("/* Symbol Colos START */")) + 1);
	FS("config/custom.css").writeUpdate(() => (
		file.join("\n") + newCss
	));
	Server.reloadCSS();
}

function generateCSS(name, sc) {
	let css = ``;
	name = toID(name);
	css = `[id*="-userlist-user-${name}"] button > em.group {/ncolor: ${sc} !important;/n}/n`;
	return css;
}

exports.commands = {
	symbolcolor: "sc",
	sc: {
		give: "set",
		set: function (target, room, user) {
			if (!this.can("profile")) return false;
			target = target.split(",");
			for (let u in target) target[u] = target[u].trim();
			if (target.length !== 2) return this.parse("/sc help");
			if (toID(target[0]).length > 19) return this.errorReply("Usernames are not this long...");
			if (sc[toID(target[0])]) return this.errorReply("This user already has a custom sc.  Do /sc delete [user] and then set their new symbol color.");
			this.sendReply(`|raw|You have given ${Server.nameColor(target[0], true)} an symbol color.`);
			Monitor.log(`${target[0]} has received an symbol color from ${user.name}.`);
			this.privateModAction(`|raw|(${Server.nameColor(target[0], true)} has received a symbol color: <font color="${target[1]}">${target[1]}</font> from ${user.name}.)`);
			if (Users.get(target[0]) && Users.get(target[0]).connected) Users.get(target[0]).popup(`|html|${Server.nameColor(user.name, true)} has set your symbol color to: <font color="${target[1]}">${target[1]}</font>.<br /><center>Refresh, If you don't see it.</center>`);
			sc[toID(target[0])] = target[1];
			updateSC();
		},

		take: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			if (!this.can("profile")) return false;
			target = toID(target);
			if (!sc[target]) return this.errorReply(`/sc - ${target} does not have an symbol color.`);
			delete sc[target];
			updateSC();
			this.sendReply(`You removed ${target}'s symbol color.`);
			Monitor.log(`${user.name} removed ${target}'s symbol color.`);
			this.privateModAction(`(${target}'s symbol color was removed by ${user.name}.)`);
			if (Users.get(target) && Users.get(target).connected) Users.get(target).popup(`|html|${Server.nameColor(user.name, true)} has removed your symbol color.`);
		},

		'': 'help',
		help: function (target, room, user) {
			this.sendReplyBox(
				'<div style="padding: 3px 5px;"><center>' +
				'<code>/sc</code> commands.<br />These commands are nestled under the namespace <code>sc</code>.</center>' +
				'<hr width="100%">' +
				'<code>set [username], [color]</code>: Gives <code>username</code> custom symbol color. Requires: & ~' +
				'<br />' +
				'<code>delete [username]</code>: Takes <code>username</code>\'s custom symbol color. Requires: & ~' +
				'<br />' +
				'<code>help</code>: Shows this command.' +
				'</div>'
			);
		},
	},
};
