'use strict';

const fs = require('fs');
const https = require('https');

Server.UCMD = function (obj) {
if (obj.cmdToken === '!') return obj.errorReply(`The command "${obj.message}" was unrecognized.`);
	return obj.errorReply(`The command "${obj.message}" was unrecognized. To send a message starting with "${obj.message}", type "${obj.cmdToken}${obj.message}".`);
};

Server.uploadToHastebin = function (toUpload, callback) {
	let reqOpts = {
		hostname: "hastebin.com",
		method: "POST",
		path: '/documents',
	};
	let req = https.request(reqOpts, res => {
		res.on('data', chunk => {
			try {
				let linkStr = "https://hastebin.com/" + JSON.parse(chunk.toString())['key'];
				if (typeof callback === "function") callback(true, linkStr);
			} catch (e) {
				if (typeof callback === "function") callback(false, e);
			}
		});
	});
	req.on('error', error => {
		if (typeof callback === "function") callback(false, error);
	});
	req.write(toUpload);
	req.end();
};

exports.commands = {
	file: 'getfile',
	fileretrieval: 'getfile',
	retrievefile: 'getfile',
	getfile(target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse('/help getfile');
		if (!user.hasConsoleAccess(user.connections[0]) || !Server.isDev(user.userid)) return Server.UCMD(this);
		let file = target.trim();
		return new Promise((resolve, reject) => {
			fs.readFile(file, (err, data) => {
				if (err) return reject(`Failed to load ${file}: ${err}`);
				resolve(data);
			});
		}).then((data) => {
			Server.uploadToHastebin(data, (pass, response) => {
				if (!pass) return this.errorReply(`An error occurred while attempting to upload to Hastebin: ${response}`); // response will be an error in this case
				this.sendReplyBox(`File: <a href="${response}">${file}</a>`); // this will actually be a link
			});
		}).catch((error) => this.errorReply(error));
		room.update();
	},
	getfilehelp: [`/getfile [file name]: Retrieves data from [file name] and uploads the data to a hastebin.`],

	forcewritefile: 'writefile',
	writefile(target, room, user, connection, cmd) {
		if (!user.hasConsoleAccess(user.connections[0]) || !Server.isDev(user.userid)) return Server.UCMD(this);
		target = target.split(',').map(x => {
			return x.trim();
		});
		if (target.length !== 2) return this.errorReply(`/writefile [hastebin raw link to write from], [file to write too]`);
		if (target[0].substring(0, 25) !== 'https://hastebin.com/raw/') return this.errorReply(`Link must start with https://hastebin.com/raw/`);
		if (target[1].substring(0, 2) === '..') return this.errorReply(`You can't edit files outside of the ${Config.serverName} folder`);
		try {
			fs.readFileSync(target[1], 'utf-8');
		} catch (e) {
			if (cmd !== 'forcewritefile') return this.errorReply(`The file "${target[1]}" was not found. Use /forcewritefile to forcibly create & write to the file.`);
		}
		https.get(target[0], function (res) {
			let data = '';
			res.on('data', function (part) {
				data += part;
			}.bind(this));
			res.on('end', function (end) {
				if (data === '{"message":"Document not found."}') {
					this.errorReply('Document not found');
					return;
				}
				fs.writeFileSync(target[1], data);
				this.sendReply('file written');
			}.bind(this));
			res.on('error', function (end) {
				this.errorReply('An error occured 1');
			}.bind(this));
			}.bind(this)).on('error', function (e) {
			this.errorReply('An error occured 2');
		}.bind(this));
	},

	comlist(target, room, user) {
		if (!this.can('hotpatch') || !Server.isDev(user.userid)) return Server.UCMD(this);
		let data = Object.keys(Chat.commands).join(',\n').toString();
		Server.uploadToHastebin(data, (pass, response) => {
			if (!pass) return this.errorReply(`An error occurred while attempting to upload to Hastebin: ${response}`);
			this.sendReplyBox(`Commands list: <a href="${response}">${response}</a>`);
		});
		room.update();
	},
};
