"use strict";

const FS = require("../../.lib-dist/fs").FS;

let adWhitelist = ["dewdrop"]; //Put your Server name here!

let adRegex = new RegExp("(play.pokemonshowdown.com\\/~~)(?!(" + adWhitelist.join("|") + "))", "g");

Config.chatfilter = function (message, user, room, connection, targetUser) {
	if (!room && !Users.get(targetUser)) targetUser = {name: "unknown user"};
	let pre_matches = (message.match(/psim|psim.us|psim us/g) || []).length;
	let final_check = (pre_matches >= 1 ? adWhitelist.filter(server => ~message.indexOf(server)).length : 0);
	if (!user.can("lock") && (pre_matches >= 1 && final_check === 0 || pre_matches >= 2 && final_check >= 1 || message.match(adRegex))) {
		if (user.locked) return false;
		if (!user.advWarns) user.advWarns = 0;
		user.advWarns++;
		if (user.advWarns > 1) {
			Punishments.lock(user, Date.now() + 7 * 24 * 60 * 60 * 1000, null, "Advertising");
			FS("logs/modlog/modlog_staff.txt").append(`[${(new Date().toJSON())}] (staff) ${user.name} was locked from talking by the Server. (Advertising) (${connection.ip})\n`);
			connection.sendTo(room, `|raw|<strong class="message-throttle-notice">You have been locked for attempting to advertise.</strong>`);
			Monitor.log(`[AdMonitor] ${user.name} has been locked for attempting to advertise ${(room ? `. **Room:** ${room.id}` : ` in a private message to ${targetUser.name}.`)} **Message:** ${message}`);
			return false;
		}
		Monitor.log(`[AdMonitor] ${user.name} has attempted to advertise ${(room ? `. **Room:** ${room.id}` : ` in a private message to ${targetUser.name}.`)} **Message:** ${message}`);
		connection.sendTo(room, `|raw|<strong class="message-throttle-notice">Advertising detected, your message has not been sent and the ${Config.serverName}'s global authorities have been notified.<br />Further attempts to advertise in a chat OR PMs will result in being locked.</strong>`);
		connection.user.popup(`|modal|Advertising detected, your message has not been sent and the ${Config.serverName}'s global authorities have been notified.\n Further attempts to advertise in a chat OR in PMs will result in being locked.`);
		return false;
	}
	return message;
};
