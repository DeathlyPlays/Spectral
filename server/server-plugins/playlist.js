/************************************
 * Playlists for Pokemon Showdown	*
 * Created by Execute				*
 * Rewritten by Insist				*
 ************************************/

"use strict";

let blackcss = "background: #3C3B42; padding: 10px; color: white; border: 1px solid black; border-radius: 6px; text-align: center;";

let MAXIMUM_SONGS = 9;

const FS = require("../../.lib-dist/fs").FS

let playlists = FS("config/chat-plugins/playlists.json").readIfExistsSync();

if (playlists !== "") {
	playlists = JSON.parse(playlists);
} else {
	playlists = {};
}

function save() {
	FS("config/chat-plugins/playlists.json").write(JSON.stringify(playlists));
}

function playlistGenerator(user) {
	let playlistData = playlists[user];
	if (!playlists[user] || playlists[user].length < 1) return Server.font(`This user does not have any playlists.`, `maroon`, true);
	let display = `<div style="${blackcss}">`;
	for (let i = 0; i < playlistData.length; i++) {
		display += `<button name="send" value="/playlist play ${playlistData[i][0]}, ${user}">${playlistData[i][1]}</button>`;
	}
	display += `</div>`;
	return display;
}

exports.commands = {
	musicbox: "playlist",
	playlist: {
		add(target, room, user) {
			let parts = target.split(",");
			if (parts.length < 2) return this.parse("/playlist help");
			let link = parts[0].trim();
			let title = parts[1].trim();
			if (!playlists[user.userid]) playlists[user.userid] = [];
			if (playlists[user.userid].length > MAXIMUM_SONGS) return this.errorReply("You already have exceeded the maximum amount of songs a user may have in their playlist.");
			for (let i = 0; i < playlists[user.userid].length; i++) {
				if (playlists[user.userid][i][0] === link) return this.errorReply("You already have this song in your playlist.");
				continue;
			}
			playlists[user.userid].push([link, title]);
			save();
			return this.sendReply("This song has been added to your playlist!");
		},

		remove: "delete",
		delete(target, room, user) {
			let title = toID(target);
			if (!title) return this.parse("/playlist help");
			if (!playlists[user.userid]) playlists[user.userid] = [];
			for (let i = 0; i < playlists[user.userid].length; i++) {
				if (playlists[user.userid][i].titleId === title) {
					playlists[user.userid].splice(playlists[user.userid].indexOf(playlists[user.userid][i]), 1);
					save();
					return this.sendReply("This song has been removed from your playlist.");
				} else {
					continue;
				}
			}
			return this.errorReply(`This song is not in your playlist.`);
		},

		nuke: "reset",
		clearall: "reset",
		reset(target, room, user) {
			if (!target) {
				playlists[user.userid] = [];
				save();
				return this.sendReply(`You have reset your playlist.`);
			} else {
				if (!this.can("lock") && toID(target) !== user.userid) return false;
				playlists[toID(target)] = [];
				save();
				return this.sendReply(`You have reset ${target}'s playlist.`);
			}
		},

		listen: "play",
		play(target, room, user) {
			let parts = target.split(",");
			if (parts.length < 2) return this.parse("/playlist help");
			let userid = toID(parts[1]);
			if (!playlists[userid]) playlists[userid] = [];
			for (let i = 0; i < playlists[userid].length; i++) {
				if (playlists[userid][i][0] === parts[0].trim()) return this.sendReply(`|uhtmlchange|${userid}playlist|<div style="${blackcss}"><audio src="${playlists[userid][i][0]}" controls>${playlists[userid][i][1]}</audio><div style="float: right;"><button name="send" value="/playlist back ${userid}">Playlist</button></div></div>`);
			}
			return this.errorReply("Your playlist does not contain this song.");
		},

		back(target, room, user) {
			if (!target) return this.sendReply(`|uhtmlchange|${user.userid}playlist|${playlistGenerator(user.userid)}`);
			return this.sendReply(`|uhtmlchange|${toID(target)}playlist|${playlistGenerator(toID(target))}`);
		},

		"": "list",
		playlist: "list",
		list(target, room, user) {
			if (!this.runBroadcast()) return;
			if (!target) target = user.userid;
			return this.sendReply(`|uhtml|${toID(target)}playlist|${playlistGenerator(toID(target))}`);
		},

		help(target, room, user) {
			this.parse("/playlisthelp");
		},
	},
	playlisthelp: [
		`/playlist add [song mp3 url], [title of the song] - Adds a song to your playlist [Limit of ${MAXIMUM_SONGS} songs].
		/playlist delete [title of the song] - Deletes a song from your playlist.
		/playlist play [song link], [optional user] - Plays the song from the specified user's playlist; Defaults to yourself.
		/playlist reset [optional target] - Removes all songs from your playlist. If you are a Global % or up ad include a target you can reset the target's playlist.
		/playlist back [optional target] - Returns to the menu of the playlist; Defaults to yourself.
		/playlist list [optional target] - Displays the target's playlist; Defaults to yourself.
		/playlist help - Displays the help command.`,
	],
};
