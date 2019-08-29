/**
 * Custom avatars plugin.
 *
 * Credits to CreaturePhil and other contributors.
 * See: https://github.com/CreaturePhil/Showdown-Boilerplate/blob/master/chat-plugins/customavatar.js
*/

"use strict";

/* eslint no-restricted-modules: [0] */

const FS = require("fs");
const path = require("path");
const request = require("request");

// The path where custom avatars are stored.
const AVATAR_PATH = path.join(__dirname, "../../config/avatars/");

// The valid file extensions allowed.
const VALID_EXTENSIONS = [".jpg", ".png", ".gif"];

function downloadImage(image_url, name, extension) {
	request
		.get(image_url)
		.on("error", err => {
			console.error(err);
		})
		.on("response", response => {
			if (response.statusCode !== 200) return;
			let type = response.headers["content-type"].split("/");
			if (type[0] !== "image") return;

			response.pipe(FS.createWriteStream(AVATAR_PATH + name + extension));
		});
}

function loadCustomAvatars() {
	FS.readdir(AVATAR_PATH, (err, files) => {
		if (err) console.log(`Error loading custom avatars: ${err}`);
		if (!files) files = [];
		files
			.filter(file => VALID_EXTENSIONS.includes(path.extname(file)))
			.forEach(file => {
				let name = path.basename(file, path.extname(file));
				Config.customavatars[name] = file;
			});
	});
}

loadCustomAvatars();

exports.commands = {
	ca: "customavatar",
	customavatar: {
		set(target, room, user) {
			if (!this.can("profile")) return false;
			let parts = target.split(",").map(param => param.trim());
			if (parts.length < 2) return this.parse("/help customavatar");

			let name = toID(parts[0]);
			let avatarUrl = parts[1];
			if (!/^https?:\/\//i.test(avatarUrl)) avatarUrl = `http://${avatarUrl}`;
			let ext = path.extname(avatarUrl);

			if (!VALID_EXTENSIONS.includes(ext)) {
				return this.errorReply("Image url must have .jpg, .png, or .gif extension.");
			}

			Config.customavatars[name] = name + ext;

			downloadImage(avatarUrl, name, ext);
			this.sendReplyBox(`${Server.nameColor(name, true)}'s avatar was successfully set. Avatar:<br /><img src="${avatarUrl}" width="80" height="80">`);
			if (Users.get(name) && Users.get(name).connected) Users.get(name).popup(`|html|${Server.nameColor(user.name, true)} set your custom avatar.<br /><center><img src="${avatarUrl}" width="80" height="80"></center><br />Refresh your page if you don't see it.`);
		},

		remove: "delete",
		delete(target, room, user) {
			if (!this.can("profile")) return false;

			let userid = toID(target);
			let image = Config.customavatars[userid];

			if (!image) return this.errorReply(`${target} does not have a custom avatar.`);

			delete Config.customavatars[userid];
			FS.unlink(AVATAR_PATH + image, err => {
				if (err && err.code === "ENOENT") {
					this.errorReply(`${target}'s avatar does not exist.`);
				} else if (err) {
					console.error(err);
				}

				if (Users.get(userid) && Users.get(userid).connected) Users.get(userid).popup(`|html|${Server.nameColor(user.name, true)} has deleted your custom avatar.`);
				this.sendReply(`${target}'s avatar has been successfully removed.`);
			});
		},

		"": "help",
		help(target, room, user) {
			this.parse("/help customavatar");
		},
	},

	customavatarhelp: [
		`Commands for /customavatar are:
		/customavatar set [username], [image link] - Set a user's avatar.
		/customavatar delete [username] - Delete a user's avatar.`,
	],
};
