/****************************************************************************
 * Profiles for Pokemon Showdown											*
 * Displays to users a profile of a given user.								*
 * For order's sake:														*
 * - vip, dev, custom title, friend code, and profile were placed in here.	*
 * Updated and restyled by Mystifi and Insist								*
 * Main Profile credit goes out to panpawn/jd/other contributors.			*
 ****************************************************************************/

"use strict";

let geoip = require("geoip-lite-country");

// fill your server's IP in your config.js for exports.serverIp
const serverIp = Config.serverIp;

function isDev(user) {
	if (!user) return;
	if (typeof user === "object") user = user.userid;
	let dev = Db.devs.get(toId(user));
	if (dev === 1) return true;
	return false;
}
Server.isDev = isDev;

function isVIP(user) {
	if (!user) return;
	if (typeof user === "object") user = user.userid;
	let vip = Db.vips.get(toId(user));
	if (vip === 1) return true;
	return false;
}

function getLastSeen(userid) {
	if (Users.get(userid) && Users.get(userid).connected) return `<font color = "limegreen"><strong>Currently Online</strong></font>`;
	let seen = Db.seen.get(userid);
	if (!seen) return `<font color = "red"><strong>Never</strong></font>`;
	return Chat.toDurationString(Date.now() - seen, {precision: true}) + " ago.";
}

function lastActive(user) {
	if (!Users.get(user)) return false;
	user = Users.get(user);
	return (user && user.lastPublicMessage ? Chat.toDurationString(Date.now() - user.lastPublicMessage, {precision: true}) : "hasn't talked yet");
}

function pColor(user) {
	let color = Db.profile.get(user, {data: {title: {}, music: {}}}).color;
	if (!color) return `<font>`;
	return `<font color="${color}">`;
}

exports.commands = {
	dev: {
		give: function (target, room, user) {
			if (!this.can("hotpatch")) return false;
			if (!target) return this.parse("/help", true);
			let devUsername = toId(target);
			if (devUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (isDev(devUsername)) return this.errorReply(`${target} is already a DEV user.`);
			Db.devs.set(devUsername, 1);
			this.sendReply(`|html|${Server.nameColor(target, true)} has been given DEV status.`);
			if (Users.get(devUsername)) Users.get(devUsername).popup(`|html|You have been given DEV status by ${Server.nameColor(user.name, true)}.`);
		},

		take: function (target, room, user) {
			if (!this.can("hotpatch")) return false;
			if (!target) return this.parse("/help", true);
			let devUsername = toId(target);
			if (devUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (!isDev(devUsername)) return this.errorReply(`${target} isn't a DEV user.`);
			Db.devs.remove(devUsername);
			this.sendReply(`|html|${Server.nameColor(target, true)} has been demoted from DEV status.`);
			if (Users.get(devUsername)) Users.get(devUsername).popup(`|html|You have been demoted from DEV status by ${Server.nameColor(user.name, true)}.`);
		},

		users: "list",
		list: function () {
			if (!Db.devs.keys().length) return this.errorReply("There seems to be no user(s) with DEV status.");
			let display = [];
			Db.devs.keys().forEach(devUser => {
				display.push(Server.nameColor(devUser, (Users.get(devUser) && Users.get(devUser).connected)));
			});
			this.popupReply(`|html|<strong><u><font size="3"><center>DEV Users:</center></font></u></strong>${Chat.toListString(display)}`);
		},

		"": "help",
		help: function () {
			this.parse(`/help dev`);
		},
	},
	devhelp: [
		`/dev give [user] - Gives [user] DEV status. Requires &, ~
		/dev take [user] - Takes away [user]'s DEV status. Requires &, ~
		/dev list - Displays the list of user's with DEV status.
		/dev help - Displays the list of Dev commands.`,
	],

	vip: {
		give: function (target, room, user) {
			if (!this.can("profile")) return false;
			if (!target) return this.parse("/help", true);
			let vipUsername = toId(target);
			if (vipUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (isVIP(vipUsername)) return this.errorReply(`${target} is already a VIP user.`);
			Db.vips.set(vipUsername, 1);
			this.sendReply(`|html|${Server.nameColor(vipUsername, true)} has been given VIP status.`);
			if (Users.get(vipUsername)) Users.get(vipUsername).popup(`|html|You have been given VIP status by ${Server.nameColor(user.name, true)}.`);
		},

		take: function (target, room, user) {
			if (!this.can("profile")) return false;
			if (!target) return this.parse("/help", true);
			let vipUsername = toId(target);
			if (vipUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (!isVIP(vipUsername)) return this.errorReply(`${target} isn't a VIP user.`);
			Db.vips.remove(vipUsername);
			this.sendReply(`|html|${Server.nameColor(vipUsername, true)} has been demoted from VIP status.`);
			if (Users.get(vipUsername)) Users.get(vipUsername).popup(`|html|You have been demoted from VIP status by ${Server.nameColor(user.name, true)}.`);
		},

		users: "list",
		list: function () {
			if (!Db.vips.keys().length) return this.errorReply("There seems to be no user(s) with VIP status.");
			let display = [];
			Db.vips.keys().forEach(vipUser => {
				display.push(Server.nameColor(vipUser, (Users.get(vipUser) && Users.get(vipUser).connected)));
			});
			this.popupReply(`|html|<strong><u><font size="3"><center>VIP Users:</center></font></u></strong>${Chat.toListString(display)}`);
		},

		"": "help",
		help: function () {
			this.parse(`/help vip`);
		},
	},
	viphelp: [
		`/vip give [user] - Gives [user] VIP status. Requires %, @, &, ~
		/vip take [user] - Takes away [user]'s VIP status. Requires %, @, &, ~
		/vip list - Displays the list of user's with VIP status.
		/vip help - Displays the list of VIP commands.`,
	],

	title: "customtitle",
	customtitle: {
		set: "give",
		give: function (target, room, user) {
			if (!this.can("profile")) return false;
			let [userid, titleName, color] = target.split(",").map(p => { return p.trim(); });
			if (!color) return this.parse("/help", true);
			userid = toId(userid);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (color.charAt(0) !== "#") return this.errorReply(`The color needs to be a hex starting with "#".`);
			profile.data.title.title = titleName;
			profile.data.title.color = color;
			Db.profile.set(userid, profile);
			if (Users.get(userid)) Users.get(userid).popup(`|html|You have received a custom title from ${Server.nameColor(user.name, true)}.<br />Title: <font color="${color}">(<strong>${titleName}</strong>)</font><br />Title Hex Color: ${color}`);
			this.privateModAction(`${user.name} set a custom title to ${userid}'s profile.`);
			Monitor.log(`${user.name} set a custom title to ${userid}'s profile.`);
			return this.sendReply(`Title "${titleName}" and color "${color}" for ${userid}'s custom title have been set.`);
		},

		delete: "remove",
		take: "remove",
		remove: function (target, room, user) {
			if (!this.can("profile")) return false;
			if (!target) return this.parse("/help", true);
			let userid = toId(target);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (!(profile.data.title.title || profile.data.title.color)) return this.errorReply(`${target} doesn't have a custom title yet.`);
			delete profile.data.title.title;
			delete profile.data.title.color;
			Db.profile.set(userid, profile);
			if (Users.get(userid)) Users.get(userid).popup(`|html|${Server.nameColor(user.name, true)} has removed your custom title.`);
			this.privateModAction(`${user.name} removed ${target}'s custom title.`);
			Monitor.log(`${user.name} removed ${target}'s custom title.`);
			return this.sendReply(`${target}'s custom title and title color was removed from the server memory.`);
		},

		"": "help",
		help: function () {
			this.parse(`/help customtitle`);
		},
	},
	customtitlehelp: [
		`/customtitle set [user], [title], [hex code] - Sets the [user]'s title as [title] with the hex code [hex code]. Requires %, @, &, ~
		/customtitle take [user] - Deletes the [user]'s custom title. Requires %, @, &, ~
		/customtitle help - Displays a list of help commands about custom titles.`,
	],

	fc: "friendcode",
	friendcode: {
		switch: "nintendoswitch",
		nintendoswitch: {
			add: "set",
			set: function (target, room, user) {
				if (room.battle) return this.errorReply("Please use this command outside of battle rooms.");
				if (!user.autoconfirmed) return this.errorReply("You must be autoconfirmed to use this command.");
				if (!target) return this.parse("/friendcodehelp");
				let fc = target;
				fc = fc.replace(/-/g, "");
				fc = fc.replace(/ /g, "");
				if (isNaN(fc)) {
					return this.errorReply("Your Switch friend code needs to contain only numerical characters (the SW- will be automatically added).");
				}
				if (fc.length < 12) return this.errorReply("Your Switch friend code needs to be 12 digits long.");
				fc = `${fc.slice(0, 4)}-${fc.slice(4, 8)}-${fc.slice(8, 12)}`;
				Db.switchfc.set(user.userid, fc);
				return this.sendReply(`Your Switch friend code: ${fc} has been saved to the server.`);
			},

			remove: "delete",
			delete: function (target, room, user) {
				if (room.battle) return this.errorReply("Please use this command outside of battle rooms.");
				if (!user.autoconfirmed) return this.errorReply("You must be autoconfirmed to use this command.");
				if (!target) {
					if (!Db.switchfc.has(user.userid)) return this.errorReply("Your friend code isn't set.");
					Db.switchfc.remove(user.userid);
					return this.sendReply("Your Switch friend code has been deleted from the server.");
				} else {
					if (!this.can("profile")) return false;
					let userid = toId(target);
					if (!Db.switchfc.has(userid)) return this.errorReply(`${target} hasn't set a friend code.`);
					Db.switchfc.remove(userid);
					return this.sendReply(`${target}'s Switch friend code has been deleted from the server.`);
				}
			},
		},

		"2ds": "ds",
		"3ds": "ds",
		nintendods: "ds",
		nintendo3ds: "ds",
		nintendo2ds: "ds",
		ds: {
			add: "set",
			set: function (target, room, user) {
				if (room.battle) return this.errorReply("Please use this command outside of battle rooms.");
				if (!user.autoconfirmed) return this.errorReply("You must be autoconfirmed to use this command.");
				if (!target) return this.parse("/friendcodehelp");
				let fc = target;
				fc = fc.replace(/-/g, "");
				fc = fc.replace(/ /g, "");
				if (isNaN(fc)) {
					return this.errorReply("Your friend code needs to contain only numerical characters.");
				}
				if (fc.length < 12) return this.errorReply("Your friend code needs to be 12 digits long.");
				fc = `${fc.slice(0, 4)}-${fc.slice(4, 8)}-${fc.slice(8, 12)}`;
				Db.friendcode.set(user.userid, fc);
				return this.sendReply(`Your friend code: ${fc} has been saved to the server.`);
			},

			remove: "delete",
			delete: function (target, room, user) {
				if (room.battle) return this.errorReply("Please use this command outside of battle rooms.");
				if (!user.autoconfirmed) return this.errorReply("You must be autoconfirmed to use this command.");
				if (!target) {
					if (!Db.friendcode.has(user.userid)) return this.errorReply("Your friend code isn't set.");
					Db.friendcode.remove(user.userid);
					return this.sendReply("Your friend code has been deleted from the server.");
				} else {
					if (!this.can("profile")) return false;
					let userid = toId(target);
					if (!Db.friendcode.has(userid)) return this.errorReply(`${target} hasn't set a friend code.`);
					Db.friendcode.remove(userid);
					return this.sendReply(`${target}'s friend code has been deleted from the server.`);
				}
			},
		},

		"": "help",
		help: function () {
			this.parse("/friendcodehelp");
		},
	},
	friendcodehelp: [
		`/fc [switch|ds] set [friendcode] - Sets your friend code of the specified console.
		/fc [switch|ds] delete - Deletes your friend code off the server of the specified console.
		/fc [switch|ds] delete [target] - Deletes the specified user's friend code for the specified console. Requires Global % or higher.
		/fc help - Shows this command.`,
	],

	favoritetype: "type",
	type: {
		add: "set",
		set: function (target, room, user) {
			if (!target) return this.parse("/help type");
			let profile = Db.profile.get(user.userid, {data: {title: {}, music: {}}});
			let type = Dex.getType(target);
			if (!type.exists) return this.errorReply("Not a type. Check your spelling?");
			profile.type = toId(type);
			Db.profile.set(user.userid, profile);
			return this.sendReply(`Your favorite type has been set to "${target}".`);
		},

		del: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			let profile = Db.profile.get(user.userid, {data: {title: {}, music: {}}});
			if (!profile.type) return this.errorReply(`Your profile type hasn't been set yet.`);
			delete profile.type;
			Db.profile.set(user.userid, profile);
			return this.sendReply("Your favorite type has been deleted from your profile.");
		},

		"": "help",
		help: function () {
			this.parse("/help type");
		},
	},
	typehelp: [
		`/type set [type] - Sets your Favorite Type.
		/type delete - Removes your Favorite Type.
		/type help - Displays a list of type commands.`,
	],

	profilecolor: "pcolor",
	pcolor: {
		set: "add",
		add: function (target, room, user) {
			if (!target) return this.parse("/pcolor help");
			let profile = Db.profile.get(user.userid, {data: {title: {}, music: {}}});
			let color = target.trim();
			if (color.charAt(0) !== "#") return this.errorReply(`The color needs to be a hex starting with "#".`);
			profile.color = color;
			Db.profile.set(user.userid, profile);
			this.sendReply(`You have set your profile color to "${color}".`);
		},

		delete: "remove",
		remove: function (target, room, user) {
			if (!this.can("profile")) return false;
			let userid = toId(target);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (!target) return this.parse("/pcolor help");
			if (!profile.color) return this.errorReply(`${target} does not have a profile color set.`);
			delete profile.color;
			Db.profile.set(userid, profile);
			if (Users.get(userid)) Users.get(userid).popup(`|html|${Server.nameColor(user.name, true)} has removed your profile color.`);
			this.sendReply(`You have removed ${target}'s profile color.`);
		},

		"": "help",
		help: function () {
			this.parse(`/help pcolor`);
		},
	},
	pcolorhelp: [
		`/pcolor set [hex code] - Sets your profile color as [hex code].
		/pcolor take [user] - Removes [user]'s profile color. Requires %, @, &, ~
		/pcolor help - Displays the profile color commands.`,
	],

	bg: "background",
	background: {
		set: "setbg",
		setbackground: "setbg",
		setbg: function (target) {
			if (!this.can("profile")) return false;
			let [userid, link] = target.split(",").map(p => { return p.trim(); });
			userid = toId(userid);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (!link) return this.parse(`/help background`);
			if (![".png", ".gif", ".jpg"].includes(link.slice(-4))) return this.errorReply(`Backgrounds must end in an extension like .png, .gif, or .jpg.`);
			profile.background = link;
			Db.profile.set(userid, profile);
			this.sendReplyBox(`This user's background has been set as:<br /><img src="${link}">`);
		},

		removebg: "deletebg",
		remove: "deletebg",
		deletebackground: "deletebg",
		takebg: "deletebg",
		take: "deletebg",
		delete: "deletebg",
		deletebg: function (target) {
			if (!this.can("profile")) return false;
			let targ = toId(target);
			if (!targ) return this.parse("/backgroundhelp");
			let profile = Db.profile.get(targ, {data: {title: {}, music: {}}});
			if (!profile.background) return this.errorReply(`${target} doesn't have a custom background.`);
			delete profile.background;
			Db.profile.set(targ, profile);
			return this.sendReply(`${target}'${target.endsWith("s") ? `` : `s`} custom background was removed.`);
		},

		"": "help",
		help: function () {
			this.parse("/help background");
		},
	},
	backgroundhelp: [
		`/bg set [user], [link] - Sets [user]'s profile background as [link]. Requires %, @, &, ~
		/bg delete [user] - Removes [user]'s profile background. Requires %, @, &, ~
		/bg help - Displays the help command for Profile Backgrounds.`,
	],

	song: "music",
	music: {
		add: "set",
		give: "set",
		set: function (target) {
			if (!this.can("profile")) return false;
			let [userid, link, title] = target.split(",").map(p => { return p.trim(); });
			userid = toId(userid);
			let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
			if (!title) return this.parse("/musichelp");
			if (![".mp3", ".mp4", ".m4a"].includes(link.slice(-4))) return this.errorReply(`Music links must end in an extension like .mp3, .mp4, or .m4a.`);
			profile.data.music.link = link;
			profile.data.music.title = title;
			Db.profile.set(userid, profile);
			this.sendReplyBox(`${userid}'${userid.endsWith("s") ? `` : `s`} song has been set.<br /><acronym title="${profile.data.music.title}"><br /><audio src="${profile.data.music.link}" controls="" style="width:100%;"></audio></acronym>`);
		},

		take: "delete",
		remove: "delete",
		delete: function (target) {
			if (!this.can("profile")) return false;
			target = toId(target);
			let profile = Db.profile.get(target, {data: {title: {}, music: {}}});
			if (!target) return this.parse("/musichelp");
			if (!(profile.data.music.link || profile.data.music.title)) return this.errorReply(`${target} does not have any profile music.`);
			delete profile.data.music.link;
			delete profile.data.music.title;
			Db.profile.set(target, profile);
			return this.sendReply(`You have removed ${target}'${target.endsWith("s") ? `` : `s`} profile music.`);
		},

		"": "help",
		help: function () {
			this.parse("/musichelp");
		},
	},
	musichelp: [
		`/music set [user], [link], [title of song] - Sets a [user]'s profile music as [link] titled [title]. Requires %, @, &, ~
		/music take [user] - Removes a [user]'s profile music. Requires %, @, &, ~
		/music help - Displays help on the profile music commands.`,
	],

	pokemon: {
		add: "set",
		set: function (target, room, user) {
			if (!target) return this.parse("/pokemonhelp");
			let profile = Db.profile.get(user.userid, {data: {title: {}, music: {}}});
			let pkmn = Dex.getTemplate(target);
			if (!pkmn.exists) return this.errorReply("Not a Pokemon. Check your spelling?");
			profile.pokemon = pkmn.species;
			Db.profile.set(user.userid, profile);
			return this.sendReply(`You have successfully set your favorite Pokemon as "${pkmn.species}".`);
		},

		del: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			let profile = Db.profile.get(user.userid, {data: {title: {}, music: {}}});
			if (!profile.pokemon) return this.errorReply("Your favorite Pokemon hasn't been set.");
			delete profile.pokemon;
			Db.profile.set(user.userid, profile);
			return this.sendReply("Your favorite Pokemon has been deleted from your profile.");
		},

		"": "help",
		help: function () {
			this.parse("/pokemonhelp");
		},
	},
	pokemonhelp: [
		`/pokemon set [Pokemon] - Sets your Favorite Pokemon.
		/pokemon delete - Removes your Favorite Pokemon.
		/pokemon help - Displays information on Pokemon commands.`,
	],

	natures: "nature",
	nature: {
		add: "set",
		set: function (target, room, user) {
			let profile = Db.profile.get(user.userid, {data: {title: {}, music: {}}});
			if (!target) return this.parse("/naturehelp");
			let nature = Dex.getNature(target);
			if (!nature.exists) return this.errorReply("This is not a nature. Check your spelling?");
			profile.nature = nature.name;
			Db.profile.set(user.userid, profile);
			return this.sendReply("You have successfully set your nature onto your profile.");
		},

		del: "delete",
		take: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			let profile = Db.profile.get(user.userid, {data: {title: {}, music: {}}});
			if (!profile.nature) return this.errorReply("Your nature has not been set.");
			delete profile.nature;
			Db.profile.set(user.userid, profile);
			return this.sendReply("Your nature has been deleted from your profile.");
		},

		"": "help",
		help: function () {
			this.parse("/naturehelp");
		},
	},
	naturehelp: [
		`/nature set [nature] - Sets your Profile Nature.
		/nature delete - Removes your Profile Nature.
		/nature help - Displays information about Profile Nature commands.`,
	],

	"!lastactive": true,
	checkactivity: "lastactive",
	lastactive: function (target, room, user) {
		if (!target) target = user.userid;
		if (target.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
		if (!this.runBroadcast()) return;
		let targetUser = Users.get(toId(target));
		if (!targetUser || !targetUser.connected) return this.errorReply(`${target} is not online. Use /seen to find out how long ago they left.`);
		return this.sendReplyBox(`${Server.nameColor(targetUser, true, true)} was last active <strong>${Chat.toDurationString(Date.now() - targetUser.lastPublicMessage)} ago.</strong>`);
	},
	lastactivehelp: ["/lastactive - Shows how long ago it has been since a user has posted a message."],

	"!profile": true,
	profile: function (target, room, user) {
		target = toId(target);
		if (!target) target = user.name;
		if (target.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
		if (!this.runBroadcast()) return;
		let targetUser = Users.get(target);
		let online = (targetUser ? targetUser.connected : false);
		let username = (targetUser ? targetUser.name : target);
		let userid = (targetUser ? targetUser.userid : toId(target));
		let profile = Db.profile.get(userid, {data: {title: {}, music: {}}});
		let avatar = (targetUser ? (isNaN(targetUser.avatar) ? `http://${serverIp}:${Config.port}/avatars/${targetUser.avatar}` : `http://play.pokemonshowdown.com/sprites/trainers/${targetUser.avatar}.png`) : (Config.customavatars[userid] ? `http://${serverIp}:${Config.port}/avatars/${Config.customavatars[userid]}` : `http://play.pokemonshowdown.com/sprites/trainers/1.png`));
		if (targetUser && targetUser.avatar[0] === "#") avatar = `http://play.pokemonshowdown.com/sprites/trainers/${targetUser.avatar.substr(1)}.png`;
		let userSymbol = (Users.usergroups[userid] ? Users.usergroups[userid].substr(0, 1) : "Regular User");
		let userGroup = (Config.groups[userSymbol] ? `Global ${Config.groups[userSymbol].name}` : `Regular User`);
		let ip = (Users.get(userid) ? geoip.lookup(Users.get(userid).latestIp) : false);
		let regdate = "(Unregistered)";
		Server.regdate(userid, date => {
			if (date) {
				let d = new Date(date);
				let MonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
				regdate = `${MonthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
			}
		});

		let profileData = ``;
		if (profile.background) {
			profileData += `<div style="background:url(${profile.background}); background-size: 100% 100%; height: 250px">`;
		} else {
			profileData += `<div style="max-height: 250px; overflow-y: scroll">`;
		}
		profileData += `<div style="display: inline-block; width: 6.5em; height: 100%; vertical-align: top"><img src="${avatar}" height="80" width="80" align="left"></div>`;
		profileData += `<div style="display: inline-block">&nbsp;${pColor(userid)}<strong>Name:</strong></font> ${Server.nameColor(username, true)}&nbsp;`;
		if (Users.get(userid) && ip && ip !== null) {
			profileData += ` <img src="http://flags.fmcdn.net/data/flags/normal/${ip.country.toLowerCase()}.png" alt="${ip.country}" title="${ip.country}" width="20" height="10">`;
		}
		if (profile.data.title.title) profileData += ` <font color="${profile.data.title.color}">(<strong>${profile.data.title.title}</strong>)</font>`;
		profileData += `<br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>Group:</strong> ${userGroup}</font>`;
		if (isDev(userid)) profileData += ` <font color="#009320"><strong>Developer</strong></font>`;
		if (isVIP(userid)) profileData += ` <font color="#6390F0"><strong>VIP</strong></font>`;
		if (Server.isCouncilMember(userid)) profileData += ` <font color="#B22222"><strong>Council Member</strong></font>`;
		if (Server.isGenner(userid)) profileData += ` <font color="#F48C04"><strong>Genner</strong></font>`;
		profileData += `<br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>Registered:</strong> ${regdate}</font><br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>${moneyPlural}:</strong> ${Economy.readMoney(userid).toLocaleString()}</font><br />`;
		if (profile.pokemon) profileData += `&nbsp;${pColor(userid)}<strong>Favorite Pokemon:</strong> ${profile.pokemon}</font><br />`;
		if (profile.type) profileData += `&nbsp;${pColor(userid)}<strong>Favorite Type:</strong></font> <img src="https://www.serebii.net/pokedex-bw/type/${profile.type}.gif"><br />`;
		if (profile.nature) profileData += `&nbsp;${pColor(userid)}<strong>Nature:</strong> ${profile.nature}</font><br />`;
		if (Server.getFaction(userid)) profileData += `&nbsp;${pColor(userid)}<strong>Faction:</strong> ${Server.getFaction(userid)}</font><br />`;
		if (Server.getChannel(userid)) profileData += `&nbsp;${pColor(userid)}<strong>DewTube Channel:</strong> ${Server.getChannel(userid)}</font><br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>EXP Level:</strong> ${Server.ExpControl.level(userid)}</font><br />`;
		if (online && lastActive(userid)) profileData += `&nbsp;${pColor(userid)}<strong>Last Activity:</strong> ${lastActive(userid)}</font><br />`;
		profileData += `&nbsp;${pColor(userid)}<strong>Last Seen:</strong> ${getLastSeen(userid)}</font><br />`;
		if (Db.friendcode.has(userid)) profileData += `&nbsp;${pColor(userid)}<strong>Friend Code:</strong> ${Db.friendcode.get(userid)}</font><br />`;
		if (Db.switchfc.has(userid)) profileData += `&nbsp;${pColor(userid)}<strong>Switch Friend Code:</strong> SW-${Db.switchfc.get(userid)}</font><br />`;
		if (profile.data.music.link) profileData += `&nbsp;<acronym title="${profile.data.music.title}"><br /><audio src="${profile.data.music.link}" controls="" style="width: 100%;"></audio></acronym>`;
		profileData += `</div>`;
		this.sendReplyBox(profileData);
	},

	profilehelp: [
		`/profile [user] - Shows a user's profile. Defaults to yourself.
		/pcolor help - Shows profile color commands.
		/pokemon set [Pokemon] - Set your Favorite Pokemon onto your profile.
		/pokemon delete - Delete your Favorite Pokemon from your profile.
		/type set [type] - Set your favorite type.
		/type delete - Delete your favorite type.
		/nature set [nature] - Set your nature.
		/nature delete - Delete your nature.
		/music set [user], [song], [title] - Sets a user's profile song. Requires % or higher.
		/music take [user] - Removes a user's profile song. Requires % or higher.
		/bg set [user], [link] - Sets the user's profile background. Requires % or higher.
		/bg delete [user] - Removes the user's profile background. Requires % or higher.
		/fc [switch|ds] set [friend code] - Sets your Friend Code.
		/fc [switch|ds] delete [friend code] - Removes your Friend Code.
		/dev give [user] - Gives a user Dev Status. Requires & or higher.
		/dev take [user] - Removes a user's Dev Status. Requires & or higher.
		/vip give [user] - Gives a user VIP Status. Requires & or higher.
		/vip take [user] - Removes a user's VIP Status. Requires & or higher.`,
	],
};
