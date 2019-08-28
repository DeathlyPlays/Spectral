/*
The following commands were coded specifically for Dewdrop
Made by Insist
feelscool
Basically just edits to main's info.js, and adds more, removes stuff, etc.
*/
'use strict';

exports.commands = {

	/*********************************************************
	 * Informational commands
	 *********************************************************/

	'!statset': true,
	statset: function () {
		let statHP = Math.floor(Math.random() * 100) + 30;
		let statAtk = Math.floor(Math.random() * 100) + 70;
		let statDef = Math.floor(Math.random() * 100) + 40;
		let statSpA = Math.floor(Math.random() * 100) + 70;
		let statSpD = Math.floor(Math.random() * 100) + 40;
		let statSpe = Math.floor(Math.random() * 100) + 60;
		let statBst = statHP + statAtk + statDef + statSpA + statSpD + statSpe;
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`Generated Statset: ${statHP} / ${statAtk} / ${statDef} / ${statSpA} / ${statSpD} / ${statSpe} | BST: ${statBst}`);
		if (statBst <= 200) {
			return this.sendReplyBox('Tier: LC');
		} else if (statBst > 200 && statBst < 400) {
			return this.sendReplyBox('Tier: NFE');
		} else if (statBst > 400 && statBst < 500) {
			return this.sendReplyBox('Tier: NU');
		} else if (statBst > 500 && statBst < 600) {
			return this.sendReplyBox('Tier: UU');
		} else if (statBst > 600 && statBst < 680) {
			return this.sendReplyBox('Tier: OU');
		} else if (statBst > 680 && statBst < 800) {
			return this.sendReplyBox('Tier: Ubers');
		} else if (statBst >= 800) {
			return this.sendReplyBox('Tier: AG');
		}
	},
	statsethelp: [
		"/statset - Generates a random spread of stats.",
		"!statset - Broadcasts the generated random spread of stats.",
	],

	"!randtype": true,
	randomtype: "randtype",
	randtype: function () {
		let gen = Math.floor(Math.random() * 18);
		if (!this.runBroadcast()) return;
		if (gen === 0) {
			return this.sendReplyBox('Generated Type: Fire');
		} else if (gen === 1) {
			return this.sendReplyBox('Generated Type: Water');
		} else if (gen === 2) {
			return this.sendReplyBox('Generated Type: Grass');
		} else if (gen === 3) {
			return this.sendReplyBox('Generated Type: Electric');
		} else if (gen === 4) {
			return this.sendReplyBox('Generated Type: Ground');
		} else if (gen === 5) {
			return this.sendReplyBox('Generated Type: Rock');
		} else if (gen === 6) {
			return this.sendReplyBox('Generated Type: Flying');
		} else if (gen === 7) {
			return this.sendReplyBox('Generated Type: Poison');
		} else if (gen === 8) {
			return this.sendReplyBox('Generated Type: Fighting');
		} else if (gen === 9) {
			return this.sendReplyBox('Generated Type: Ice');
		} else if (gen === 10) {
			return this.sendReplyBox('Generated Type: Bug');
		} else if (gen === 11) {
			return this.sendReplyBox('Generated Type: Dragon');
		} else if (gen === 12) {
			return this.sendReplyBox('Generated Type: Psychic');
		} else if (gen === 13) {
			return this.sendReplyBox('Generated Type: Dark');
		} else if (gen === 14) {
			return this.sendReplyBox('Generated Type: Ghost');
		} else if (gen === 15) {
			return this.sendReplyBox('Generated Type: Steel');
		} else if (gen === 16) {
			return this.sendReplyBox('Generated Type: Fairy');
		} else if (gen === 17) {
			return this.sendReplyBox('Generated Type: Normal');
		}
	},
	randomtypehelp: [
		"/randomtype - Generates a random typing.",
		"!randomtype - Broadcasts the generated typing.",
	],

	'!opensource': true,
	github: "opensource",
	os: "opensource",
	git: "opensource",
	opensource: function () {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`${Config.serverName}'s Github's:<br />` +
			`- Language: JavaScript (Node.js)<br />` +
			`- <a href="https://github.com/DeathlyPlays/Exiled">${Config.serverName}'s Server Code</a><br />` +
			`- <a href="https://github.com/DeathlyPlays/Exiled/commits/master">What's new?</a><br />` +
			`- <a href="https://github.com/Zarel/Pokemon-Showdown">Main's source code</a><br />` +
			`- <a href="https://github.com/Zarel/Pokemon-Showdown-Client">Client source code</a><br />` +
			`- <a href="https://github.com/Zarel/Pokemon-Showdown-Dex">Dex source code</a>`
		);
	},
	opensourcehelp: [
		`/opensource - Links to ${Config.serverName}'s source code repository.`,
		`!opensource - Show everyone that information. Requires: + % @ * # & ~`,
	],

	'!forums': true,
	forums: function () {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<a href="http://exiledps.boards.net">${Config.serverName} Forums</a>`);
	},

	'!suggestions': true,
	suggestions: function () {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<a href="http://exiledps.boards.net/board/3/suggestions">Make a suggestion for ${Config.serverName}</a>`);
	},

	'!skype': true,
	skype: function () {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<a href="https://join.skype.com/Eo5DCq8nCh1j">The Official Skype Group</a>`);
	},

	'!discord': true,
	discord: function () {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<a href="https://discord.gg/3UWpXwa">The Official ${Config.serverName} Discord</a>`);
	},

	'!bugs': true,
	bugs: function (target, room) {
		if (!this.runBroadcast()) return;
		if (room && room.battle) {
			this.sendReplyBox(`<center><button name="saveReplay"><i class="fa fa-upload"></i> Save Replay</button> &mdash; <a href="https://www.smogon.com/forums/threads/3520646/">Questions</a> &mdash; <a href="https://www.smogon.com/forums/threads/3469932/">Bug Reports</a></center>`);
		} else {
			this.sendReplyBox(
				`Have a replay showcasing a bug on ${Config.serverName}?<br />` +
				`- <a href="http://exiledps.boards.net/thread/5/bug-reports/">Bug Reports</a>`
			);
		}
	},

	'!roomhelp': true,
	roomhelp: function (target, room) {
		if (!this.canBroadcast('!htmlbox')) return;
		if (this.broadcastMessage && !this.can('declare', null, room)) return false;

		if (!this.runBroadcast('!htmlbox')) return;
		this.sendReplyBox(
			"<strong>Room drivers (%)</strong> can use:<br />" +
			"- /warn OR /k <em>username</em>: warn a user and show the Pok&eacute;mon Showdown rules<br />" +
			"- /mute OR /m <em>username</em>: 7 minute mute<br />" +
			"- /hourmute OR /hm <em>username</em>: 60 minute mute<br />" +
			"- /unmute <em>username</em>: unmute<br />" +
			"- /announce OR /wall <em>message</em>: make an announcement<br />" +
			"- /modlog <em>username</em>: search the moderator log of the room<br />" +
			"- /modnote <em>note</em>: adds a moderator note that can be read through modlog<br />" +
			"- /kick <em>username</em>: kicks the user out of the chatroom<br />" +
			"<br />" +
			"<strong>Room moderators (@)</strong> can also use:<br />" +
			"- /roomban OR /rb <em>username</em>: bans user from the room<br />" +
			"- /roomunban <em>username</em>: unbans user from the room<br />" +
			"- /roomvoice <em>username</em>: appoint a room voice<br />" +
			"- /roomdevoice <em>username</em>: remove a room voice<br />" +
			"- /staffintro <em>intro</em>: sets the staff introduction that will be displayed for all staff joining the room<br />" +
			"- /roomsettings: change a variety of room settings, namely modchat<br />" +
			"<br />" +
			"<strong>Room leaders (&)</strong> can also use: <br />" +
			"- /roommdriver <em>username</em>: appoints someone to room driver<br />" +
			"- /roommod <em>username</em>: appoints user to room mod<br />" +
			"- /roomdedriver /roomdemod <em>username</em>: removes user room driver/moderator<br />" +
			"<br />" +
			"<strong>Room owners (#)</strong> can also use:<br />" +
			"- /roomintro <em>intro</em>: sets the room introduction that will be displayed for all users joining the room<br />" +
			"- /rules <em>rules link</em>: set the room rules link seen when using /rules<br />" +
			"- /roomdeauth <em>username</em>: remove all room auth from a user<br />" +
			"- /declare <em>message</em>: make a large blue declaration to the room<br />" +
			"- !htmlbox <em>HTML code</em>: broadcasts a box of HTML code to the room<br />" +
			"- !showimage <em>[url], [width], [height]</em>: shows an image to the room<br />" +
			"- /roomsettings: change a variety of room settings, including modchat, capsfilter, etc<br />" +
			"<br />" +
			"More detailed help can be found in the <a href=\"https://www.smogon.com/forums/threads/3570628/#post-6774654\">roomauth guide</a><br />" +
			"<br />" +
			"Tournament Help:<br />" +
			"- /tour create <em>format</em>, elimination: Creates a new single elimination tournament in the current room.<br />" +
			"- /tour create <em>format</em>, roundrobin: Creates a new round robin tournament in the current room.<br />" +
			"- /tour end: Forcibly ends the tournament in the current room<br />" +
			"- /tour start: Starts the tournament in the current room<br />" +
			"<br />" +
			"More detailed help can be found in the <a href=\"https://www.smogon.com/forums/threads/3570628/#post-6777489\">tournaments guide</a><br />" +
			"</div>"
		);
	},

	'!rules': true,
	rule: 'rules',
	rules: function (target, room, user) {
		if (!target) {
			if (!this.runBroadcast()) return;
			this.sendReplyBox("Please follow the rules:<br />" +
				(room && room.rulesLink ? "- <a href=\"" + Chat.escapeHTML(room.rulesLink) + "\">" + Chat.escapeHTML(room.title) + " room rules</a><br />" : "") +
				"- <a href=\"https://pastebin.com/4MtrsP8p\">" + (room && room.rulesLink ? "Global rules" : "Rules") + "</a>");
			return;
		}
		if (!room) {
			this.errorReply("This is not a room you can set the rules of.");
		}
		if (!this.can('editroom', null, room)) return;
		if (target.length > 100) {
			return this.errorReply("Error: Room rules link is too long (must be under 100 characters). You can use a URL shortener to shorten the link.");
		}

		room.rulesLink = target.trim();
		this.privateModAction(`(${user.name} changed the room rules link to: ${target})`);

		if (room.chatRoomData) {
			room.chatRoomData.rulesLink = room.rulesLink;
			Rooms.global.writeChatRoomData();
		}
	},
	ruleshelp: ["/rules - Show links to room rules and global rules.",
		"!rules - Show everyone links to room rules and global rules. Requires: + % @ * # & ~",
		"/rules [url] - Change the room rules URL. Requires: # & ~"],

	servercredits: 'credits',
	credits: function (user) {
		let popup = `|html|<font size=5 color=#F7189F><u><strong>${Config.serverName} Credits:</strong></u></font><br />` +
			`<br />` +
			`<u><strong>Server Maintainers:</u></strong><br />` +
			`- ${Server.nameColor('Mewth', true)} (Owner, Sysadmin, Developer)<br />` +
			`- ${Server.nameColor('Insist', true)} (Main Developer)<br />` +
			`<br />` +
			`<u><strong>Major Contributors:</strong></u><br />` +
			`- ${Server.nameColor('AlfaStorm', true)} (Developer)<br />` +
			`- ${Server.nameColor('Back At My Day', true)} (Developer)<br />` +
			`- ${Server.nameColor('flufi', true)} (Code Breaker, Developer)<br />` +
			`- ${Server.nameColor('HoeenHero', true)} (Developer)<br />` +
			`- ${Server.nameColor('megas4ever', true)} (Developer)<br />` +
			`- ${Server.nameColor('Volco', true)} (Former Owner, and Developer)<br />` +
			`<br />` +
			`<u><strong>Retired Staff:</strong></u><br />` +
			`- ${Server.nameColor('Alpha Hawk', true)} (Former Developer)<br />` +
			`<br />` +
			`<u><strong>Special Thanks:</strong></u><br />` +
			`- Our Staff Members<br />` +
			`- Our Regular Users<br />`;
		this.sendReplyBox(popup);
	},

	servercommands: 'customcommands',
	serverhelp: 'customcommands',
	customcommands: function () {
		if (!this.runBroadcast()) return;
		let display = `<div class="infobox-limited"><strong><h1>Custom Commands on ${Config.serverName}</h1></strong>`;
		display += `<h2>Game Commands:</h2><ul>`;
		display += `<li><button class="button" name="send" value="/ambushhelp">Ambush</button></li>`;
		display += `<li><button class="button" name="send" value="/dicegamehelp">Dice Game</button></li>`;
		display += `<li><button class="button" name="send" value="/draft">Draft</button></li>`;
		display += `<li><button class="button" name="send" value="/guesswhohelp">Guess Who</button></li>`;
		display += `<li><button class="button" name="send" value="/lotteryhelp">Lottery</button></li>`;
		display += `<li><button class="button" name="send" value="/panagramhelp">Panagrams</button></li>`;
		display += `<li><button class="button" name="send" value="/passthebombhelp">Pass The Bomb</button></li>`;
		display += `<li><button class="button" name="send" value="/pingponghelp">Ping Pong</button></li>`;
		display += `<li><button class="button" name="send" value="/rpshelp">Rock Paper Scissors (Lizard Spock)</button></li>`;
		display += `<li><button class="button" name="send" value="/sentencehelp">Sentence Game</button></li>`;
		display += `<li><button class="button" name="send" value="/slotshelp">Slots</button></li>`;
		display += `<li><button class="button" name="send" value="/tdihelp">TDI</button></li>`;
		display += `</ul>`;
		display += `<h2>Chat Features:</h2><ul>`;
		display += `<li><button class="button" name="send" value="/advertisehelp">Advertise A Room</button></li>`;
		display += `<li><button class="button" name="send" value="/animehelp">Anime</button></li>`;
		display += `<li><button class="button" name="send" value="/awayhelp">Away</button></li>`;
		display += `<li><button class="button" name="send" value="/psgohelp">Cards</button></li>`;
		display += `<li><button class="button" name="send" value="/committeehelp">Committee</button></li>`;
		display += `<li><button class="button" name="send" value="/definehelp">Define</button></li>`;
		display += `<li><button class="button" name="send" value="/dewtubehelp">DewTube</button></li>`;
		display += `<li><button class="button" name="send" value="/digidexhelp">Digidex</button></li>`;
		display += `<li><button class="button" name="send" value="/atm">Economy</button></li>`;
		display += `<li><button class="button" name="send" value="/emotes help">Emotes</button></li>`;
		display += `<li><button class="button" name="send" value="/essbhelp">ESSB Data</button></li>`;
		display += `<li><button class="button" name="send" value="/exphelp">EXP</button></li>`;
		display += `<li><button class="button" name="send" value="/factionshelp">Factions</button></li>`;
		display += `<li><button class="button" name="send" value="/friendshelp">Friends</button></li>`;
		display += `<li><button class="button" name="send" value="/genrequesthelp">Gen Requests</button></li>`;
		display += `<li><button class="button" name="send" value="/hexhelp">Hex Code</button></li>`;
		display += `<li><button class="button" name="send" value="/lastactivehelp">Last Active</button></li>`;
		display += `<li><button class="button" name="send" value="/mangahelp">Manga</button></li>`;
		display += `<li><button class="button" name="send" value="/meme">Meme Randomizer</button></li>`;
		display += `<li><button class="button" name="send" value="/serverannouncementshelp">News</button></li>`;
		display += `<li><button class="button" name="send" value="/ontimehelp">Ontime</button></li>`;
		display += `<li><button class="button" name="send" value="/playlisthelp">Playlist</button></li>`;
		display += `<li><button class="button" name="send" value="/profilehelp">Profile</button></li>`;
		display += `<li><button class="button" name="send" value="/quotehelp">Quotes</button></li>`;
		display += `<li><button class="button" name="send" value="/regdatehelp">Regdate</button></li>`;
		display += `<li><button class="button" name="send" value="/roomlist">Room List</button></li>`;
		display += `<li><button class="button" name="send" value="/roomshophelp">Room Shop</button></li>`;
		display += `<li><button class="button" name="send" value="/seenhelp">Seen</button></li>`;
		display += `<li><button class="button" name="send" value="/shiphelp">Ship</button></li>`;
		display += `<li><button class="button" name="send" value="/shop">Shop</button></li>`;
		display += `<li><button class="button" name="send" value="/splatoonhelp">Splatoon</button></li>`;
		display += `<li><button class="button" name="send" value="/ssbhelp">SSBFFA</button></li>`;
		display += `<li><button class="button" name="send" value="/suggestionhelp">Suggestions</button></li>`;
		display += `<li><button class="button" name="send" value="/surveyhelp">Surveys</button></li>`;
		display += `<li><button class="button" name="send" value="/taskshelp">Tasks</button></li>`;
		display += `<li><button class="button" name="send" value="/tellhelp">Tells</button></li>`;
		display += `<li><button class="button" name="send" value="/urbandefinehelp">Urban Define</button></li>`;
		display += `</ul>`;
		display += `<h2>Social Medias/Links:</h2><ul>`;
		display += `<li><a href="https://discord.gg/chfz65A" target="_blank"><button style="cursor: url(&quot;&quot;), auto;">Discord</button></a>`;
		display += `<li><a href="http://exiledps.boards.net/" target="_blank"><button style="cursor: url(&quot;&quot;), auto;">Forums</button></a>`;
		display += `<li><a href="https://github.com/DeathlyPlays/Exiled" target="_blank"><button style="cursor: url(&quot;&quot;), auto;">GitHub</button></a>`;
		display += `<li><a href="https://join.skype.com/Eo5DCq8nCh1j" target="_blank"><button style="cursor: url(&quot;&quot;), auto;">Join Our Skype</button></a>`;
		display += `</ul>`;
		if (this.can("lock")) {
			display += `<h2>Staff Commands:</h2>`;
			display += `<details><summary>Global Drivers (%) Commands:</summary>`;
			display += `<button class="button" name="send" value="/customavatarhelp">Custom Avatar</button>`;
			display += `<button class="button" name="send" value="/customcolorhelp">Custom Color</button>`;
			display += `<button class="button" name="send" value="/kickhelp">Kick</button>`;
			display += `<button class="button" name="send" value="/iconhelp">Icons</button>`;
			display += `<button class="button" name="send" value="/declaremodhelp">Staff Declare</button>`;
			display += `<button class="button" name="send" value="/symbolcolor help">Symbol Color</button>`;
			display += `<button class="button" name="send" value="/viewlogs">Viewlogs</button>`;
			display += `</details>`;
		}
		if (this.can("ban")) {
			display += `<details><summary>Global Moderator (@) Commands:</summary>`;
			display += `<button class="button" name="send" value="/clearall">Clear All</button>`;
			display += `</details>`;
		}
		if (this.can("hotpatch")) {
			display += `<details><summary>Global Leader (&) Commands:</summary>`;
			display += `<button class="button" name="send" value="/crashlogs">Crashlogs</button>`;
			display += `<button class="button" name="send" value="/globalclearall">Global Clear All</button>`;
			display += `<button class="button" name="send" value="/kickall">Kick All</button>`;
			display += `<button class="button" name="send" value="/pmallhelp">PM All</button>`;
			display += `<button class="button" name="send" value="/pmallstaffhelp">PM Staff</button>`;
			display += `<button class="button" name="send" value="/pmupperstaffhelp">PM Upper Staff</button>`;
			display += `<button class="button" name="send" value="/protectroom">Protect Room</button>`;
			display += `<button class="button" name="send" value="/timedgdeclare">Timed Declare</button>`;
			display += `</details>`;
		}
		if (this.can("lockdown")) {
			display += `<details><summary>Global Administrator (~) Commands:</summary>`;
			display += `<button class="button" name="send" value="/permabanhelp">Permaban</button>`;
			display += `<button class="button" name="send" value="/permalockhelp">Permalock</button>`;
			display += `</details>`;
		}
		display += `</div>`;
		return this.sendReplyBox(display);
	},
};
