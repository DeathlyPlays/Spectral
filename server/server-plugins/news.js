/********************************************************************************************************************************
 * News System for Pokemon Showdown																								*
 * This Shows News via the /news view command and sends news in PMs when users connect to the server if they have subscribed	*
 * Credits: Lord Haji, HoeenHero																								*
 * @license MIT license																											*
 ********************************************************************************************************************************/

"use strict";

const FS = require("../../.lib-dist/fs").FS;

let newsRequests = FS("config/newsrequests.json").readIfExistsSync();

if (newsRequests !== "") {
	newsRequests = JSON.parse(newsRequests);
} else {
	newsRequests = {};
}

function generateNews(user) {
	let newsData, newsDisplay = [];
	user = toID(user);
	Db.news.keys().forEach(announcement => {
		newsData = Db.news.get(announcement);
		newsDisplay.push(`<h4>${announcement}</h4>${newsData[1]}<br /><br />—${Server.nameColor(newsData[0], true)} <small>on ${newsData[2]}</small>`);
	});
	return newsDisplay;
}

function hasSubscribed(user) {
	if (typeof user === "object") user = user.userid;
	if (Db.NewsSubscribers.has(toID(user))) return true;
	return false;
}

function showSubButton(user) {
	user = toID(user);
	let output;
	output = `<hr /><center><button class = "button" name= "send" value= "/news ${(hasSubscribed(user) ? "unsubscribe" : "subscribe")}">${(hasSubscribed(user) ? "Unsubscribe from the news" : "Subscribe to the news")}</button></center>`;
	return output;
}

Server.showNews = function (userid, user) {
	if (!user || !userid) return false;
	userid = toID(userid);
	let newsDisplay = generateNews(user);
	if (!hasSubscribed(userid)) return false;
	if (newsDisplay.length > 0) {
		if (newsDisplay.length > 2) newsDisplay.splice(0, newsDisplay.length - 2);
		newsDisplay = newsDisplay.join("<hr />");
		newsDisplay += showSubButton(userid);
		return user.send(`|pm|~${Config.serverName} News|${user.getIdentity()}|/raw ${newsDisplay}`);
	}
};

function saveNewsRequests() {
	FS("config/newsrequests.json").write(JSON.stringify(newsRequests));
}

exports.commands = {
	news: "serverannouncements",
	announcements: "serverannouncements",
	serverannouncements: {
		"": "view",
		display: "view",
		view(target, room, user) {
			if (!this.runBroadcast()) return;
			let output = `<center><strong>${Config.serverName} News:</strong></center>`;
			output += generateNews().join("<hr />") + showSubButton(user.userid);
			if (this.broadcasting) return this.sendReplyBox(`<div class ="infobox-limited" ${output}</div>`);
			return user.send(`|popup||wide||html|${output}`);
		},

		remove: "delete",
		delete(target, room, user) {
			if (!this.can("news")) return false;
			if (!target) return this.parse("/help serverannouncements");
			if (!Db.news.has(target)) return this.errorReply("News with this title doesn't exist.");
			Db.news.remove(target);
			this.modlog(`NEWS`, null, `deleted announcement titled: ${target}.`);
			this.privateModAction(`(${user.name} deleted server announcement titled: ${target}.)`);
		},

		announce: "add",
		add(target, room, user) {
			if (!this.can("news")) return false;
			if (!target) return this.parse("/help serverannouncements");
			let parts = target.split(",");
			if (parts.length < 2) return this.errorReply("Usage: /news add [title], [desc]");
			let descArray = [];
			if (parts.length - 2 > 0) {
				for (let j = 0; j < parts.length; j++) {
					if (j < 1) continue;
					descArray.push(parts[j]);
				}
				parts[1] = descArray.join();
			}
			let title = parts[0], desc = parts[1], postedBy = user.name;
			let d = new Date();
			const MonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
				"July", "Aug", "Sep", "Oct", "Nov", "Dec",
			];
			let postTime = (`${MonthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`);
			Db.news.set(title, [postedBy, desc, postTime]);
			this.privateModAction(`(${user.name} added server announcement: ${parts[0]})`);
		},

		subscribe(target, room, user) {
			if (!user.named) return this.errorReply("You must choose a name before subscribing.");
			if (hasSubscribed(user.userid)) return this.errorReply(`You are already subscribed to the ${Config.serverName} News.`);
			Db.NewsSubscribers.set(user.userid, true);
			this.sendReply(`You have subscribed to the ${Config.serverName} News.`);
			this.popupReply(`|wide||html|You will receive the ${Config.serverName} News automatically once you connect to ${Config.serverName} next time.<br><hr><button class="button" name = "send" value = "/news">Go Back</button>`);
		},

		unsubscribe(target, room, user) {
			if (!user.named) return this.errorReply("You must choose a name before unsubscribing.");
			if (!hasSubscribed(user.userid)) return this.errorReply(`You have not subscribed to ${Config.serverName} News.`);
			Db.NewsSubscribers.remove(user.userid);
			this.sendReply(`You have unsubscribed to the ${Config.serverName} News.`);
			this.popupReply(`|wide||html|You will no longer automatically receive the ${Config.serverName} News.<br /><hr /><button class="button" name="send" value="/news">Go Back</button>`);
		},

		request(target, room, user) {
			if (!user.named) return this.errorReply("You must have a name before requesting an announcement.");
			if (!this.canTalk()) return this.errorReply("You can't use this command while unable to speak.");
			if (!target) return this.sendReply(`/news request [message] - Requests a news announcement from the ${Config.serverName} Staff.`);
			if (target.length < 1) return this.sendReply(`/news request [message] - Requests a news announcement from the ${Config.serverName} Staff.`);
			let newsId = (Object.keys(newsRequests).length + 1);
			let d = new Date();
			let MonthNames = ["January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December",
			];
			while (newsRequests[newsId]) newsId--;
			newsRequests[newsId] = {};
			newsRequests[newsId].reporter = user.name;
			newsRequests[newsId].message = target.trim();
			newsRequests[newsId].id = newsId;
			newsRequests[newsId].status = 'Pending';
			newsRequests[newsId].reportTime = MonthNames[d.getUTCMonth()] + ' ' + d.getUTCDate() + "th, " + d.getUTCFullYear() + ", " + (d.getUTCHours() < 10 ? "0" + d.getUTCHours() : d.getUTCHours()) + ":" + (d.getUTCMinutes() < 10 ? "0" + d.getUTCMinutes() : d.getUTCMinutes()) + " UTC";
			saveNewsRequests();
			Monitor.log(`A news request has been submitted by ${user.name}. ID: ${newsId} Request Message: ${target.trim()}`);
			Server.messageSeniorStaff(`A news requested has been submitted by ${user.name}. ID: ${newsId} Request Message: ${target.trim()}`);
			return this.sendReply(`Your request has been sent to the ${Config.serverName} global authorities.`);
		},

		help(target, room, user) {
			this.parse(`/help serverannouncements`);
		},
	},

	newshelp: "serverannouncementshelp",
	serverannouncementshelp: [
		`/news view - Views current ${Config.serverName} News.
		/news delete [news title] - Deletes announcement with the [title]. Requires @, &, ~.
		/news add [news title], [news desc] - Adds [news]. Requires @, &, ~.
		/news subscribe - Subscribes to the ${Config.serverName} News.
		/news unsubscribe - Unsubscribes from the ${Config.serverName} News.
		/news request [message] - A user may request for a news announcement to be made.`,
	],
};
