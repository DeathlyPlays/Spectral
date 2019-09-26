/*
 * Poll chat plugin
 * By bumbadadabum and Zarel.
 * Redone by Volco and WGC for Collapsible Multi-Polls
 */

'use strict';

/** @typedef {{source: string, supportHTML: boolean}} QuestionData */
/** @typedef {{name: string, votes: number, correct?: boolean}} Option */
/** @typedef {Poll} PollType */

class Poll {
	constructor(room, questionData, options, name) {
		if (room.pollNumber) {
			room.pollNumber++;
		} else {
			room.pollNumber = 1;
		}
		this.room = room;
		this.pollArray = [{
			room: room,
			pollNum: room.pollNumber,
			question: questionData.source,
			supportHTML: questionData.supportHTML,
			/** @type {{[k: string]: number}} */
			voters: {},
			/** @type {{[k: string]: number}} */
			voterIps: {},
			totalVotes: 0,
			/** @type {NodeJS.Timer?} */
			timeout: null,
			timeoutMins: 0,
			startTime: Date.now(),
			startedUser: Server.nameColor(name, true, true),
			/** @type {Map<number, Option>} */
			options: new Map(),
		}];
		for (let i = 0; i < options.length; i++) {
			this.pollArray[0].options.set(i + 1, {name: options[i], votes: 0});
		}
	}

	/**
	 * @param {User} user
	 * @param {number} option
	 * @param {number} number
	 */
	vote(user, option, number) {
		let ip = user.latestIp;
		let userid = user.userid;
		if (userid in this.pollArray[number].voters || ip in this.pollArray[number].voterIps) {
			return user.sendTo(this.room, "You have already voted for this poll.");
		}
		this.pollArray[number].voters[userid] = option;
		this.pollArray[number].voterIps[ip] = option;
		// @ts-ignore this is never undefined since we checked this earlier.
		this.pollArray[number].options.get(option).votes++;
		this.pollArray[number].totalVotes++;
		this.update(number);
	}

	/**
	 * @param {User} user
	 * @param {number} number
	 */
	blankvote(user, number) {
		let ip = user.latestIp;
		let userid = user.userid;

		if (!(userid in this.pollArray[number].voters) || !(ip in this.pollArray[number].voterIps)) {
			this.pollArray[number].voters[userid] = 0;
			this.pollArray[number].voterIps[ip] = 0;
		}
		this.updateTo(user, number);
	}

	/**
	 * @param {number} num
	 */
	generateVotes(num) {
		let output = `<div class="infobox"><details><summary style="margin: 2px 0 5px 0"><span style="border:1px solid #6A6;color:#484;border-radius:4px;padding:0 3px"><i class="fa fa-bar-chart"></i> Poll-${this.pollArray[num].pollNum}</span> <strong style="font-size:11pt">${this.getQuestionMarkup(num)}</strong><psicon pokemon="magearna"></summary>`;
		this.pollArray[num].options.forEach((option, number) => {
			output += `<div style="margin-top: 5px"><button class="button" style="text-align: left" value="/poll vote ${number}, ${this.pollArray[num].pollNum}" name="send" title="Vote for ${number}. ${Chat.escapeHTML(option.name)}">${number}. <strong>${this.getOptionMarkup(option, num)}</strong></button></div>`;
		});
		output += `<div style="margin-top: 7px; padding-left: 12px"><button value="/poll results ${this.pollArray[num].pollNum}" name="send" title="View results - you will not be able to vote after viewing results"><small>(View results)</small></button></div>`;
		output += `</details></div>`;
		return output;
	}

	/**
	 * @param {boolean} [ended]
	 * @param {number?} [option]
	 * @param {number} num
	 */
	generateResults(ended = false, option = 0, num) {
		let icon = `<span style="border: 1px solid #${(ended ? '777;color:#555' : '6A6;color:#484')}; border-radius: 4px; padding: 3px"><i class="fa fa-bar-chart"></i> ${(ended ? `Poll-${this.pollArray[num].pollNum} ended` : `Poll-${this.pollArray[num].pollNum}`)}</span>`;
		let totalVotes = `<br /><span style="font-style: italic; font-size: 9pt; color: #79330A;">[Total Votes: ${this.pollArray[num].totalVotes}] (Started by ${this.pollArray[num].startedUser} Started on: ${new Date(this.pollArray[num].startTime)})</span>`;
		let output = `<div class="infobox"><details open><summary style="margin: 2px 0 5px 0">${icon} <strong style="font-size: 11pt">${this.getQuestionMarkup(num)}</strong><psicon pokemon="marshadow"></summary>`;
		output += totalVotes;
		output += `<div style="padding: 8px 15px;"><font color="red"><small><center>(Options with 0 votes are not shown)</center></small></font>`;
		output += `<table cellspacing="0" style="width: 100%; margin-top: 3px;">`;
		let iter = this.pollArray[num].options.entries();

		let i = iter.next();
		let c = 0;
		let colors = ['#00FFFF', '#66CCCC', '#388E8E'];
		while (!i.done) {
			if (i.value[1].votes && i.value[1].votes !== 0) {
				let percentage = Math.round((i.value[1].votes * 100) / (this.pollArray[num].totalVotes || 1));
				output += `<tr><td><strong>${(i.value[0] === option ? '<em>' : '')} ${Chat.escapeHTML(i.value[1].name)} ${(i.value[0] === option ? '</em>' : '')}</strong> <small>(${i.value[1].votes} vote${(i.value[1].votes === 1 ? '' : 's')})</small></td><td><span style="font-size: 7pt; background: ${colors[c % 3]}; padding-right: ${(percentage * 3)}px; border-radius: 20px;"></span><small>&nbsp;${percentage}%</small></td></tr>`;
			}
			i = iter.next();
			c++;
		}
		if (option === 0 && !ended) output += `<div style="text-align:center; color:red;"><small>(You can't vote after viewing results)</small></div>`;
		output += `</table></details></div>`;

		return output;
	}

	/**
	 * @param {number} num
	 */
	getQuestionMarkup(num) {
		if (this.pollArray[num].supportHTML) return this.pollArray[num].question;
		return Chat.escapeHTML(this.pollArray[num].question);
	}

	/**
	 * @param {Option} option
	 * @param {number} num
	 */
	getOptionMarkup(option, num) {
		if (this.pollArray[num].supportHTML) return option.name;
		return Chat.escapeHTML(option.name);
	}

	/**
	 * @param {number} num
	 */
	update(num) {
		let results = [];
		for (let i = 0; i <= this.pollArray[num].options.size; i++) {
			results.push(this.generateResults(false, i, num));
		}
		// Update the poll results for everyone that has voted
		for (let i in this.room.users) {
			let user = this.room.users[i];
			if (user.userid in this.pollArray[num].voters) {
				user.sendTo(this.room, '|uhtmlchange|poll' + this.pollArray[num].pollNum + '|' + results[this.pollArray[num].voters[user.userid]]);
			} else if (user.latestIp in this.pollArray[num].voterIps) {
				user.sendTo(this.room, '|uhtmlchange|poll' + this.pollArray[num].pollNum + '|' + results[this.pollArray[num].voterIps[user.latestIp]]);
			}
		}
	}
	/**
	 * @param {User} user
	 * @param {Connection?} [connection]
	 * @param {number} num
	 */
	updateTo(user, num, connection) {
		if (!connection) connection = user;
		if (user.userid in this.pollArray[num].voters) {
			connection.sendTo(this.room, '|uhtmlchange|poll' + this.pollArray[num].pollNum + '|' + this.generateResults(false, this.pollArray[num].voters[user.userid], num));
		} else if (user.latestIp in this.pollArray[num].voterIps) {
			connection.sendTo(this.room, '|uhtmlchange|poll' + this.pollArray[num].pollNum + '|' + this.generateResults(false, this.pollArray[num].voterIps[user.latestIp], num));
		} else {
			connection.sendTo(this.room, '|uhtmlchange|poll' + this.pollArray[num].pollNum + '|' + this.generateVotes(num));
		}
	}

	/**
	 * @param {User} user
	 */
	updateFor(user) {
		for (let u in this.pollArray) {
			if (user.userid in this.pollArray[u].voters) user.sendTo(this.room, '|uhtmlchange|poll' + this.pollArray[u].pollNum + '|' + this.generateResults(false, this.pollArray[u].voters[user.userid], u));
		}
	}

	display() {
		for (let u in this.pollArray) {
			let votes = this.generateVotes(u);

			let results = [];

			for (let i = 0; i <= this.pollArray[u].options.size; i++) {
				results.push(this.generateResults(false, i, u));
			}

			for (let i in this.room.users) {
				let thisUser = this.room.users[i];
				if (thisUser.userid in this.pollArray[u].voters) {
					thisUser.sendTo(this.room, '|uhtml|poll' + this.pollArray[u].pollNum + '|' + results[this.pollArray[u].voters[thisUser.userid]]);
				} else if (thisUser.latestIp in this.pollArray[u].voterIps) {
					thisUser.sendTo(this.room, '|uhtml|poll' + this.pollArray[u].pollNum + '|' + results[this.pollArray[u].voterIps[thisUser.latestIp]]);
				} else {
					thisUser.sendTo(this.room, '|uhtml|poll' + this.pollArray[u].pollNum + '|' + votes);
				}
			}
		}
	}

	/**
	 * @param {User} user
	 * @param {Connection?} [connection]
	 */
	displayTo(user, connection) {
		if (!connection) connection = user;
		for (let u in this.pollArray) {
			if (user.userid in this.pollArray[u].voters) {
				connection.sendTo(this.room, '|uhtml|poll' + this.pollArray[u].pollNum + '|' + this.generateResults(false, this.pollArray[u].voters[user.userid], u));
			} else if (user.latestIp in this.pollArray[u].voterIps) {
				connection.sendTo(this.room, '|uhtml|poll' + this.pollArray[u].pollNum + '|' + this.generateResults(false, this.pollArray[u].voterIps[user.latestIp], u));
			} else {
				connection.sendTo(this.room, '|uhtml|poll' + this.pollArray[u].pollNum + '|' + this.generateVotes(u));
			}
		}
	}

	/**
	 * @param {number} num
	 */
	displaySpecific(num) {
		let votes = this.generateVotes(num);

		let results = [];

		for (let i = 0; i <= this.pollArray[num].options.size; i++) {
			results.push(this.generateResults(false, i, num));
		}

		for (let i in this.room.users) {
			let thisUser = this.room.users[i];
			if (thisUser.userid in this.pollArray[num].voters) {
				thisUser.sendTo(this.room, '|uhtml|poll' + this.pollArray[num].pollNum + '|' + results[this.pollArray[num].voters[thisUser.userid]]);
			} else if (thisUser.latestIp in this.pollArray[num].voterIps) {
				thisUser.sendTo(this.room, '|uhtml|poll' + this.pollArray[num].pollNum + '|' + results[this.pollArray[num].voterIps[thisUser.latestIp]]);
			} else {
				thisUser.sendTo(this.room, '|uhtml|poll' + this.pollArray[num].pollNum + '|' + votes);
			}
		}
	}

	/**
	 * @param {User} user
	 * @param {Connection?} [connection]
	 * @param {number} num
	 */
	displaySpecificTo(user, connection, num) {
		if (!connection) connection = user;
		if (user.userid in this.pollArray[num].voters) {
			connection.sendTo(this.room, '|uhtml|poll' + this.pollArray[num].pollNum + '|' + this.generateResults(false, this.pollArray[num].voters[user.userid], num));
		} else if (user.latestIp in this.pollArray[num].voterIps) {
			connection.sendTo(this.room, '|uhtml|poll' + this.pollArray[num].pollNum + '|' + this.generateResults(false, this.pollArray[num].voterIps[user.latestIp], num));
		} else {
			connection.sendTo(this.room, '|uhtml|poll' + this.pollArray[num].pollNum + '|' + this.generateVotes(num));
		}
	}

	/**
	 * @param {User} user
	 * @param {Connection?} [connection]
	 */
	onConnect(user, connection = null) {
		this.displayTo(user, connection);
	}

	/**
	 * @param {number} num
	 */
	end(number) {
		let results = this.generateResults(true, null, number);
		this.room.send('|uhtmlchange|poll' + this.pollArray[number].pollNum + '|<div class="infobox">(The poll has ended &ndash; scroll down to see the results)</div>');
		this.room.add('|html|' + results);
	}

	/**
	 * @param {number} num
	 */
	obtain(number) {
		for (let u in this.pollArray) {
			if (this.pollArray[u].pollNum === number) return u;
		}
	}
}

exports.Poll = Poll;

/** @type {ChatCommands} */
const commands = {
	poll: {
		htmlcreate: 'new',
		create: 'new',
		new(target, room, user, connection, cmd, message) {
			if (!target) return this.parse('/help poll new');
			target = target.trim();
			if (target.length > 1024) return this.errorReply("Poll too long.");
			if (room.battle) return this.errorReply("Battles do not support polls.");

			let text = this.filter(target);
			if (target !== text) return this.errorReply("You are not allowed to use filtered words in polls.");

			const supportHTML = cmd === 'htmlcreate';
			if (room.poll && room.poll.pollArray.length >= 5) return this.errorReply('There can only be up to 5 polls at a time.');
			let separator = '';
			if (text.includes('\n')) {
				separator = '\n';
			} else if (text.includes('|')) {
				separator = '|';
			} else if (text.includes(',')) {
				separator = ',';
			} else {
				return this.errorReply("Not enough arguments for /poll new.");
			}

			let params = text.split(separator).map(param => param.trim());

			if (!this.can('minigame', null, room)) return false;
			if (supportHTML && !this.can('declare', null, room)) return false;
			if (!this.canTalk()) return;
			if (room.poll && room.poll.pollArray[0] && room.poll.pollArray[1] && room.poll.pollArray[2] && room.poll.pollArray[3] && room.poll.pollArray[4]) return this.errorReply("Only 5 polls at a time!");
			if (params.length < 3) return this.errorReply("Not enough arguments for /poll new.");

			// @ts-ignore In the case that any of these are null, the function is terminated, and the result never used.
			if (supportHTML) params = params.map(parameter => this.canHTML(parameter));
			if (params.some(parameter => !parameter)) return;

			const options = params.splice(1);
			if (options.length > 16) {
				return this.errorReply("Too many options for poll (maximum is 16).");
			}
			if (room.poll && room.pollNumber) room.pollNumber++;
			if (room.poll) {
				room.poll.pollArray.push({
					room: room,
					pollNum: room.pollNumber,
					question: params[0],
					supportHTML: supportHTML,
					voters: {},
					voterIps: {},
					totalVotes: 0,
					timeout: null,
					timeoutMins: 0,
					startTime: Date.now(),
					startedUser: Server.nameColor(user.name, true, true),
					options: new Map(),
				});
				for (let i = 0; i < options.length; i++) {
					room.poll.pollArray[room.poll.pollArray.length - 1].options.set(i + 1, {name: options[i], votes: 0});
				}
				room.poll.displaySpecific(room.poll.pollArray.length - 1);
			} else {
				room.poll = new Poll(room, {source: params[0], supportHTML: supportHTML}, options, user.name);
				room.poll.display();
			}

			this.roomlog(`${user.name} used ${message}`);
			this.modlog('POLL');
			return this.privateModAction(`(A poll was started by ${user.name}.)`);
		},
		newhelp: [`/poll create [question], [option1], [option2], [...] - Creates a poll. Allows up to 5 polls at once. Requires: % @ * # & ~`],

		vote(target, room, user) {
			if (!room.poll) return this.errorReply("There is no poll running in this room.");
			let targets = target.split(',');
			if (!targets[1]) return this.parse('/help poll vote');
			for (let u = 0; u < targets.length; u++) targets[u] = targets[u].trim();
			let number = parseInt(targets[1]);
			let num = room.poll.obtain(number);
			if (!num) return this.errorReply("Not a poll number!");
			if (targets[0] === 'blank') {
				room.poll.blankvote(user, num);
				return;
			}

			let parsed = parseInt(targets[0]);
			if (isNaN(parsed)) return this.errorReply("To vote, specify the number of the option.");
			if (!room.poll.pollArray[num].options.has(parsed)) return this.sendReply("Option not in poll.");

			room.poll.vote(user, parsed, num);
		},
		votehelp: [`/poll vote [option number], [poll number] - Votes for option [number] on poll [poll number].`],

		timer(target, room, user) {
			if (!room.poll) return this.errorReply("There is no poll running in this room.");
			let targets = target.split(",");
			for (let u = 0; u < targets.length; u++) targets[u] = targets[u].trim();
			if (!targets[1]) return this.errorReply("/poll timer (clear/ time amount), (poll number)");
			let num = room.poll.obtain(parseInt(targets[1]));
			if (!room.poll.pollArray[num]) return this.errorReply('That poll number is not currently a poll!');
			if (targets[0]) {
				if (!this.can('minigame', null, room)) return false;
				if (targets[0] === 'clear') {
					if (room.poll.pollArray[num] && !room.poll.pollArray[num].timeout) return this.errorReply("There is no timer to clear.");
					clearTimeout(room.poll.pollArray[num].timeout);
					room.poll.pollArray[num].timeout = null;
					room.poll.pollArray[num].timeoutMins = 0;
					return this.add("The poll timer was turned off.");
				}
				let timeout = parseFloat(target);
				if (isNaN(timeout) || timeout <= 0 || timeout > 0x7FFFFFFF) return this.errorReply("Invalid time given.");
				if (room.poll.pollArray[num] && room.poll.pollArray[num].timeout) clearTimeout(room.poll.pollArray[num].timeout);
				room.poll.pollArray[num].timeoutMins = timeout;
				room.poll.pollArray[num].timeout = setTimeout(() => {
					room.poll.end(num);
					room.poll.pollArray.splice(num, 1);
				}, (timeout * 60000));
				room.add("The poll timer was turned on: the poll " + room.poll.pollArray[num].pollNum + " will end in " + timeout + " minute(s).");
				this.modlog('POLL TIMER', null, `#${room.poll.pollArray[num].pollNum} ${timeout} minutes`);
				return this.privateModAction("(The poll timer for poll " + room.poll.pollArray[num].pollNum + " was set to " + timeout + " minute(s) by " + user.name + ".)");
			} else {
				if (!this.runBroadcast()) return;
				if (room.poll.pollArray[num].timeout) {
					return this.sendReply("The poll timer for " + room.poll.pollArray[num].pollNum + " is on and will end in " + room.poll.pollArray[num].timeoutMins + " minute(s).");
				} else {
					return this.sendReply("The poll timer for " + room.poll.pollArray[num].pollNum + " is off.");
				}
			}
		},
		timerhelp: [
			`/poll timer [minutes], [poll id number] - Sets the poll to automatically end after [minutes] minutes. Requires: % @ * # & ~`,
			`/poll timer clear - Clears the poll's timer. Requires: % @ * # & ~`,
		],

		results(target, room, user) {
			if (!room.poll) return this.errorReply("There is no poll running in this room.");
			let num = room.poll.obtain(parseInt(target));
			if (!num) return this.errorReply("Not a poll number!");
			if (room.poll.pollArray[num].pollNum === parseInt(target)) return room.poll.blankvote(user, num);
		},
		resultshelp: [`/poll results [poll id number] - Shows the results of the poll without voting. NOTE: you can't go back and vote after using this.`],

		close: 'end',
		stop: 'end',
		end(target, room, user) {
			if (!this.can('minigame', null, room)) return false;
			if (!this.canTalk()) return;
			if (!room.poll) return this.errorReply("There is no poll running in this room.");
			let num = room.poll.obtain(parseInt(target));
			if (!num) return this.errorReply("Not a poll number!");

			if (room.poll.pollArray[num].pollNum === parseInt(target) && room.poll.pollArray[num].timeout) clearTimeout(room.poll.pollArray[num].timeout);
			if (room.poll.pollArray[num].pollNum === parseInt(target)) room.poll.end(num);
			if (room.poll.pollArray[num].pollNum === parseInt(target)) room.poll.pollArray.splice(num, 1);

			this.modlog('POLL END');
			return this.privateModAction(`(The poll was ended by ${user.name}.)`);
		},
		endhelp: [`/poll end [poll id number] - Ends a poll and displays the results. Requires: % @ * # & ~`],

		show: 'display',
		display(target, room, user, connection) {
			if (!room.poll) return this.errorReply("There is no poll running in this room.");
			if (!this.runBroadcast()) return;
			room.update();
			let num = room.poll.obtain(parseInt(target));
			if (num) {
				if (this.broadcasting) {
					room.poll.displayTo(user, connection);
				} else {
					room.poll.displaySpecificTo(user, connection, num);
				}
			} else {
				if (!num && this.broadcasting) {
					room.poll.display();
				} else {
					room.poll.displayTo(user, connection);
				}
			}
		},
		displayhelp: [`/poll display [poll id number] - Displays the poll. Id number is optional and only displays the poll with the id number.`],

		''(target, room, user) {
			this.parse('/help poll');
		},
	},

	tpoll: 'tierpoll',
	tierpoll: function (target, room, user, connection, cmd, message) {
		if (!this.can('minigame', null, room)) return false;
		if (room.poll && room.poll.pollArray.length >= 5) return this.errorReply("The maximum amount of polls is 5.");
		let options = [];
		for (let key in Dex.formats) {
			if (!Dex.formats[key].mod) continue;
			if (!Dex.formats[key].searchShow) continue;
			if (toID(target) !== 'all') {
				let commonMods = ['bossrush', 'gen7', 'fakemons', 'franticfusions', 'mixandmega', 'pet', 'slowtown', 'ssb', 'ssbffa', 'sssb', 'zfrenzy'];
				if (commonMods.indexOf(Dex.formats[key].mod) === -1) continue;
			}
			options.push(Dex.formats[key].name);
		}
		room.poll = new Poll(room, {
			source: 'What should the next tournament tier be?',
			supportHTML: false,
			username: user.name,
		}, options);
		room.poll.display();
		this.roomlog(`${user.name} used ${message}`);
		return this.privateModAction(`(A tier poll was started by ${user.name}.)`);
	},
	tierpollhelp: ["/tierpoll - (all) Creates a poll with all the common formats as options. All all to use all formats Requires: % @ * # & ~"],

	pollhelp: [
		`/poll allows rooms to run their own polls. These polls are limited to five polls at a time per room.`,
		`Accepts the following commands:`,
		`/poll create [question], [option1], [option2], [...] - Allows up to 5 polls at once per room. Creates a poll. Requires: % @ * # & ~`,
		`/poll htmlcreate [question], [option1], [option2], [...] - Allows up to 5 polls at once per room. Creates a poll, with HTML allowed in the question and options. Requires: # & ~`,
		`/poll vote [number], [poll id number] - Votes for option [number] in the poll [poll id number].`,
		`/poll timer [minutes], [poll id number] - Sets the poll to automatically end after [minutes]. Requires: % @ * # & ~`,
		`/poll results, [poll id number] - Shows the results of the poll without voting. NOTE: you can't go back and vote after using this.`,
		`/poll display [poll id number] - Displays the poll. The poll id number is optional for this command and displays only the poll with the matching id number.`,
		`/poll end [poll id number] - Ends a poll and displays the results. The poll id number is optional for this command and ends only the poll with the matching id number. and Requires: % @ * # & ~`,
		`/tierpoll - Creates a poll with a list of tiers on the server for users to vote for the next tournament.`,
	],
};

exports.commands = commands;

process.nextTick(() => {
	Chat.multiLinePattern.register('/poll (new|create|htmlcreate) ');
});
