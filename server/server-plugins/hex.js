"use strict";

let https = require("https");
const Autolinker = require("autolinker");

Server.nameColor = function (name, bold, userGroup) {
	let userGroupSymbol = `${Users.usergroups[toID(name)] ? `<strong><font color=#948A88>${Users.usergroups[toID(name)].substr(0, 1)}</font></strong>` : ``}`;
	return `${(userGroup ? userGroupSymbol : ``)}${(bold ? `<strong>` : ``)}<font color=${Server.hashColor(name)}>${(Users.get(name) && Users.get(name).connected && Users.getExact(name) ? Chat.escapeHTML(Users.getExact(name).name) : Chat.escapeHTML(name))}</font>${(bold ? `</strong>` : ``)}`;
};

// usage: Server.nameColor(user.name, true) for bold OR Server.nameColor(user.name, false) for non-bolded.

Server.pmAll = function (message, pmName) {
	pmName = (pmName ? pmName : `~${Config.serverName} Server`);
	Users.users.forEach(curUser => {
		curUser.send(`|pm|${pmName}|${curUser.getIdentity()}|${message}`);
	});
};

// format: Server.pmAll("message", "person")
//
// usage: Server.pmAll("Event in Lobby in 5 minutes!", "~Server")
//
// this makes a PM from ~Server stating the message.

Server.pmStaff = function (message, pmName, from) {
	pmName = (pmName ? pmName : `~${Config.serverName} Server`);
	from = (from ? ` (PM from ${from})` : ``);
	Users.users.forEach(curUser => {
		if (!curUser.isStaff) return;
		curUser.send(`|pm|${pmName}|${curUser.getIdentity()}|${message}`);
	});
};

// format: Server.pmStaff("message", "person")
//
// usage: Server.pmStaff("Hey, Staff Meeting time", "~Server")
//
// this makes a PM from ~Server stating the message.

Server.messageSeniorStaff = function (message, pmName, from) {
	pmName = (pmName ? pmName : `~${Config.serverName} Server`);
	from = (from ? ` (PM from ${from})` : ``);
	Users.users.forEach(curUser => {
		if (curUser.group === "~" || curUser.group === "☥" || curUser.group === "&") {
			curUser.send(`|pm|${pmName}|${curUser.getIdentity()}|${message}${from}`);
		}
	});
};

// format: Server.messageSeniorStaff("message", "person")
//
// usage: Server.messageSeniorStaff("Mystifi is a confirmed user and they were banned from a public room. Assess the situation immediately.", "~Server")
//
// this makes a PM from ~Server stating the message.

function devPM(user, message) {
	let developers = Db.devs.keys();
	for (const name of developers) {
		const u = Users.get(name);
		if (!(u && u.connected) || (u.userid !== name)) continue;
		u.send(`|pm|${user}|${u.group}${u.name}|/raw ${message}\n<small style="font-style="italic">You can message DEV chat by using /devmsg [msg].</small>`);
	}
}
Server.devPM = devPM;

// Format: Server.devPM("person", "message")
// Usage: Server.devPM("~Insist", "Hey, dev meeting in 10 minutes!");
// This makes a PM from Insist stating the message.

Server.parseMessage = function (message) {
	if (message.substr(0, 5) === "/html") {
		message = message.substr(5);
		message = message.replace(/\_\_([^< ](?:[^<]*?[^< ])?)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>'); // italics
		message = message.replace(/\*\*([^< ](?:[^<]*?[^< ])?)\*\*/g, '<strong>$1</strong>'); // bold
		message = message.replace(/\~\~([^< ](?:[^<]*?[^< ])?)\~\~/g, '<strike>$1</strike>'); // strikethrough
		message = message.replace(/&lt;&lt;([a-z0-9-]+)&gt;&gt;/g, '&laquo;<a href="/$1" target="_blank">$1</a>&raquo;'); // <<roomid>>
		message = Autolinker.link(message.replace(/&#x2f;/g, '/'), {stripPrefix: false, phone: false, twitter: false});
		return message;
	}
	message = Chat.escapeHTML(message).replace(/&#x2f;/g, '/');
	message = message.replace(/\_\_([^< ](?:[^<]*?[^< ])?)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>'); // italics
	message = message.replace(/\*\*([^< ](?:[^<]*?[^< ])?)\*\*/g, '<strong>$1</strong>'); // bold
	message = message.replace(/\~\~([^< ](?:[^<]*?[^< ])?)\~\~/g, '<strike>$1</strike>'); // strikethrough
	message = message.replace(/&lt;&lt;([a-z0-9-]+)&gt;&gt;/g, '&laquo;<a href="/$1" target="_blank">$1</a>&raquo;'); // <<roomid>>
	message = Autolinker.link(message, {stripPrefix: false, phone: false, twitter: false});
	return message;
};

Server.randomString = function (length) {
	return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
};

Server.reloadCSS = function () {
	const cssPath = ' '; // This should be the server id if Config.serverid doesn't exist. Ex: 'serverid'
	let req = https.get('https://play.pokemonshowdown.com/customcss.php?server=' + (Config.serverid || cssPath), () => {});
	req.end();
};

//Daily Rewards System for PS by Lord Haji
Server.giveDailyReward = function (user) {
	if (!user) return false;
	let reward = 0, time = Date.now();
	for (let ip in user.ips) {
		let cur = Db.DailyBonus.get(ip);
		if (!cur) {
			cur = [1, Date.now()];
			Db.DailyBonus.set(ip, cur);
		}
		if (cur[0] < reward || !reward) reward = cur[0];
		if (cur[1] < time) time = cur[1];
	}
	if (Date.now() - time < 86400000) return;
	reward++;
	if (reward > 7 || Date.now() - time > 172800000) reward = 1;
	// Loop again to set the ips values
	for (let ip in user.ips) {
		Db.DailyBonus.set(ip, [reward, Date.now()]);
	}
	Economy.writeMoney(user.userid, reward);
	user.send(`|popup||wide||html|<center><u><strong><font size="3">${Config.serverName} Daily Bonus</font></strong></u><br />You have been awarded ${reward} ${reward === 1 ? moneyName : moneyPlural}.<br />${showDailyRewardAni(reward)}<br />Because you have connected to the server for the ${(reward === 1 ? "first time" : `past ${reward} days`)}.</center>`);
};


function showDailyRewardAni(userid) {
	userid = toID(userid);
	let streak = Db.DailyBonus.get(userid)[0];
	let output = ``;
	for (let i = 1; i <= streak; i++) {
		output += `<img src="https://www.mukuru.com/media/img/icons/new_order.png" width="16" height="16" />`;
	}
	return output;
}
