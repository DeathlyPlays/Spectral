/******************************
* Icons for Pokemon Showdown  *
* Credits: Lord Haji, panpawn.*
*******************************/
"use strict";

const FS = require("../../.lib-dist/fs").FS;

let icons = FS("config/icons.json").readIfExistsSync();

if (icons !== "") {
	icons = JSON.parse(icons);
} else {
	icons = {};
}

function updateIcons() {
	FS("config/icons.json").writeUpdate(() => (
		JSON.stringify(icons)
	));

	let newCss = "/* ICONS START */\n";

	for (let name in icons) {
		newCss += generateCSS(name, icons[name]);
	}
	newCss += "/* ICONS END */\n";

	let file = FS("config/custom.css").readIfExistsSync().split("\n");
	if (~file.indexOf("/* ICONS START */")) file.splice(file.indexOf("/* ICONS START */"), (file.indexOf("/* ICONS END */") - file.indexOf("/* ICONS START */")) + 1);
	FS("config/custom.css").writeUpdate(() => (
		file.join("\n") + newCss
	));
	Server.reloadCSS();
}

function generateCSS(name, icon) {
	let css = "";
	name = toID(name);
	css = `[id$="-userlist-user-${name}"] {\nbackground: url("${icon}") no-repeat right !important;\n}\n`;
	return css;
}

exports.commands = {
	uli: "icon",
	userlisticon: "icon",
	customicon: "icon",
	icon: {
		set(target, room, user) {
			if (!this.can("profile")) return false;
			target = target.split(",");
			for (let u in target) target[u] = target[u].trim();
			if (target.length !== 2) return this.parse("/help icon");
			if (toID(target[0]).length > 19) return this.errorReply("Usernames are not this long...");
			if (icons[toID(target[0])]) return this.errorReply("This user already has a custom userlist icon.  Do /icon delete [user] and then set their new icon.");
			this.sendReply(`|raw|You have given ${Server.nameColor(target[0], true)} an icon.`);
			Monitor.log(`${target[0]} has received an icon from ${user.name}.`);
			this.privateModAction(`|raw|(${target[0]} has received icon: <img src="${target[1]}" width="32" height="32"> from ${user.name}.)`);
			this.modlog("ICON", target[0], `Set icon to ${target[1]}`);
			if (Users.get(target[0]) && Users.get(target[0]).connected) Users.get(target[0]).popup(`|html|${Server.nameColor(user.name, true)} has set your userlist icon to: <img src="${target[1]}" width="32" height="32"><br /><center>Refresh, If you don't see it.</center>`);
			icons[toID(target[0])] = target[1];
			updateIcons();
		},

		remove: "delete",
		delete(target, room, user) {
			if (!this.can("profile")) return false;
			target = toID(target);
			if (!icons[toID(target)]) return this.errorReply(`/icon - ${target} does not have an icon.`);
			delete icons[toID(target)];
			updateIcons();
			this.sendReply(`You removed ${target}'s icon.`);
			Monitor.log(`${user.name} removed ${target}'s icon.`);
			this.privateModAction(`(${target}'s icon was removed by ${user.name}.)`);
			this.modlog("ICON", target, `Removed icon`);
			if (Users.get(target) && Users.get(target).connected) Users.get(target).popup(`|html|${Server.nameColor(user.name, true)} has removed your userlist icon.`);
		},

		"": "help",
		help(target, room, user) {
			this.parse("/iconhelp");
		},
	},

	iconhelp: [
		"Commands Include:",
		"/icon set [user], [image url] - Gives [user] an icon of [image url]",
		"/icon delete [user] - Deletes a user's icon",
	],
};
