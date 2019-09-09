/*
The following commands were coded specifically for our server
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
	statset(target, room, user) {
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
	randtype(target, room, user) {
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
	opensource(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`${Config.serverName}'s Github's:<br />` +
			`- Language: JavaScript (Node.js)<br />` +
			`- <a href="https://github.com/DeathlyPlays/Spectral">${Config.serverName}'s Server Code</a><br />` +
			`- <a href="https://github.com/DeathlyPlays/Spectral/commits/master">What's new?</a><br />` +
			`- <a href="https://github.com/Zarel/Pokemon-Showdown">Main's source code</a><br />` +
			`- <a href="https://github.com/Zarel/Pokemon-Showdown-Client">Client source code</a><br />` +
			`- <a href="https://github.com/Zarel/Pokemon-Showdown-Dex">Dex source code</a>`
		);
	},
	opensourcehelp: [
		`/opensource - Links to ${Config.serverName}'s source code repository.`,
		`!opensource - Show everyone that information. Requires: + % @ * # & ~`,
	],

	'!discord': true,
	discord(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<a href="https://discord.gg/chZgHQZ">The Official ${Config.serverName} Discord</a>`);
	},

	servercredits: 'credits',
	credits(target, room, user) {
		if (!this.runBroadcast()) return;
		let credits = `<font size=5 color=#F7189F><u><strong>${Config.serverName} Credits:</strong></u></font><br />` +
			`<hr />` +
			`<u><strong>Server Maintainers:</u></strong><br />` +
			`- ${Server.nameColor('Roughskull', true)} (Owner, Sysadmin, Developer)<br />` +
			`- ${Server.nameColor('RaginInfernape', true)} (Host, Main Developer)<br />` +
			`- ${Server.nameColor('Volco', true)} (Sysadmin, and Emergency Developer)<br />` +
			`<hr />` +
			`<u><strong>Major Contributors:</strong></u><br />` +
			`- ${Server.nameColor('AlfaStorm', true)} (Developer)<br />` +
			`- ${Server.nameColor('Back At My Day', true)} (Developer)<br />` +
			`- ${Server.nameColor('flufi', true)} (Developer)<br />` +
			`- ${Server.nameColor('Chanter', true)} (Developer of our CSS)<br />` +
			`<hr />` +
			`<u><strong>Special Thanks:</strong></u><hr />` +
			`- Our Staff Members<br />` +
			`- Our Regular Users<br />`;
		this.sendReplyBox(credits);
	},

	servercommands: 'customcommands',
	serverhelp: 'customcommands',
	customcommands(target, room, user) {
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
		//display += `<li><button class="button" name="send" value="/ontimehelp">Ontime</button></li>`;
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
		display += `<li><a href="https://discord.gg/chZgHQZ" target="_blank"><button style="cursor: url(&quot;&quot;), auto;">Discord</button></a>`;
		display += `<li><a href="https://github.com/DeathlyPlays/Spectral" target="_blank"><button style="cursor: url(&quot;&quot;), auto;">GitHub</button></a>`;
		display += `</ul>`;
		if (user.isStaff && !this.broadcasting) {
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
			if (user.group === "@" || user.group === "&" || user.group === "~") {
				display += `<details><summary>Global Moderator (@) Commands:</summary>`;
				display += `<button class="button" name="send" value="/clearall">Clear All</button>`;
				display += `</details>`;
			}
			if (user.group === "&" || user.group === "~") {
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
			if (user.group === "~") {
				display += `<details><summary>Global Administrator (~) Commands:</summary>`;
				display += `<button class="button" name="send" value="/permabanhelp">Permaban</button>`;
				display += `<button class="button" name="send" value="/permalockhelp">Permalock</button>`;
				display += `</details>`;
			}
		}
		display += `</div>`;
		return this.sendReplyBox(display);
	},
};
