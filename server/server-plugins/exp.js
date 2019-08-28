"use strict";

/**
 * EXP SYSTEM FOR POKEMON SHOWDOWN
 * By Volco, modified by Insist
 */

const DEFAULT_AMOUNT = 0;
let DOUBLE_XP = false;

const minLevelExp = 15;
const multiply = 1.9;

function isExp(exp) {
	let numExp = Number(exp);
	if (isNaN(exp)) return "Must be a number.";
	if (String(exp).includes(".")) return "Cannot contain a decimal.";
	if (numExp < 1) return "Cannot be less than one EXP.";
	return numExp;
}
Server.isExp = isExp;

let EXP = Server.EXP = {
	readExp(userid, callback) {
		userid = toID(userid);

		let amount = Db.exp.get(userid, DEFAULT_AMOUNT);
		if (typeof callback !== "function") {
			return amount;
		} else {
			return callback(amount);
		}
	},

	writeExp(userid, amount, callback) {
		// In case someone forgot to turn `userid` into an actual ID...
		userid = toID(userid);

		// In case someone forgot to make sure `amount` was a Number...
		amount = Number(amount);
		if (isNaN(amount)) {
			throw new Error(`EXP.writeExp: Expected amount parameter to be a Number, instead received ${typeof amount}`);
		}
		let curTotal = Db.exp.get(userid, DEFAULT_AMOUNT);
		Db.exp.set(userid, curTotal + amount);
		let newTotal = Db.exp.get(userid);
		if (callback && typeof callback === "function") {
			// If a callback is specified, return `newTotal` through the callback.
			return callback(newTotal);
		}
	},
};

class ExpFunctions {
	constructor() {
		this.start();
	}

	grantExp() {
		Users.users.forEach(user => {
			if (!user || !user.named || !user.connected || !user.lastPublicMessage) return;
			if (Date.now() - user.lastPublicMessage > 300000) return;
			this.addExp(user, null, 1);
		});
	}

	level(userid) {
		userid = toID(userid);
		let curExp = Db.exp.get(userid, 0);
		return Math.floor(Math.pow(curExp / minLevelExp, 1 / multiply) + 1);
	}

	nextLevel(user) {
		let curExp = Db.exp.get(toID(user), 0);
		let lvl = this.level(toID(user));
		return Math.floor(Math.pow(lvl, multiply) * minLevelExp) - curExp;
	}

	addExp(user, room, amount) {
		if (!user) return;
		if (!room) room = Rooms.get("lobby");
		user = Users.get(toID(user));
		if (!user.registered) return false;
		if (Db.expoff.get(user.userid)) return false;
		if (DOUBLE_XP || user.doubleExp) amount = amount * 2;
		EXP.readExp(user.userid, totalExp => {
			let oldLevel = this.level(user.userid);
			EXP.writeExp(user.userid, amount, newTotal => {
				let level = this.level(user.userid);
				if (oldLevel < level) {
					let reward = ``;
					switch (level) {
					case 5:
						Economy.logTransaction(`${user.name} received a Profile Background and Profile Music for reaching level ${level}.`);
						Monitor.log(`${user.userid} has earned a Profile Background and Profile Music for reaching level ${level}!`);
						if (!user.tokens) user.tokens = {};
						user.tokens.bg = true;
						user.tokens.music = true;
						reward = `a Profile Background and Profile Music. To claim your profile background and profile music, use the command /usetoken bg, [img] and /usetoken music, [song url], [title of the song] respectively.`;
						break;
					case 10:
						Economy.logTransaction(`${user.name} received a Custom Avatar for reaching level ${level}.`);
						Monitor.log(`${user.name} has reached Level ${level} and earned a Custom Avatar.`);
						if (!user.tokens) user.tokens = {};
						user.tokens.avatar = true;
						reward = `a Custom Avatar. To claim your Avatar, use the command /usetoken avatar, [link to the image you want].`;
						break;
					case 15:
						Economy.logTransaction(`${user.name} received a Custom Title for reaching level ${level}.`);
						Monitor.log(`${user.name} has reached Level ${level} and earned a Profile Title.`);
						if (!user.tokens) user.tokens = {};
						user.tokens.title = true;
						reward = `a Profile Title. To claim your Profile Title, use the command /usetoken title, [title], [hex color].`;
						break;
					case 20:
						Economy.logTransaction(`${user.name} received a Custom Icon for reaching level ${level}.`);
						Monitor.log(`${user.name} has reached Level ${level} and earned a Custom Icon.`);
						if (!user.tokens) user.tokens = {};
						user.tokens.icon = true;
						reward = `a Custom Userlist Icon. To claim your Icon, use the command /usetoken icon, [link to the image you want].`;
						break;
					case 25:
						Economy.logTransaction(`${user.name} received an Emote for reaching level ${level}.`);
						Monitor.log(`${user.name} has reached Level ${level} and earned a Custom Emoticon.`);
						if (!user.tokens) user.tokens = {};
						user.tokens.emote = true;
						reward = `an Emote. To claim your Emote, use the command /usetoken emote, [name], [image].`;
						break;
					case 30:
						Economy.logTransaction(`${user.name} received a Custom Color for reaching level ${level}.`);
						Monitor.log(`${user.name} has reached Level ${level} and earned a Custom Color.`);
						if (!user.tokens) user.tokens = {};
						user.tokens.color = true;
						reward = `a Custom Color. To claim your Custom Color, use the command /usetoken color, [hex color].`;
						break;
					case 35:
						Economy.writeMoney(user.userid, 50);
						Economy.logTransaction(`${user.name} received 50 ${moneyPlural} for leveling up to Level 35.`);
						reward = `50 ${moneyPlural}.`;
						break;
					case 40:
						Economy.logTransaction(`${user.name} received a Chatroom for reaching level ${level}.`);
						Server.messageSeniorStaff(`${user.name} has earned a Chatroom for reaching level ${level}!`);
						if (!user.tokens) user.tokens = {};
						user.tokens.room = true;
						reward = `a Chatroom. To claim your Chatroom, use the command /usetoken room, [name of the chatroom].`;
						break;
					case 45:
						Economy.logTransaction(`${user.name} received a Roomshop for reaching level ${level}.`);
						Server.pmStaff(`${user.name} has earned a Roomshop for reaching level ${level}!`);
						if (!user.tokens) user.tokens = {};
						user.tokens.roomshop = true;
						reward = `a Roomshop. To claim your Roomshop, use the command /usetoken roomshop, [room for room shop].`;
						break;
					default:
						Economy.writeMoney(user.userid, Math.ceil(level * 0.5));
						Economy.logTransaction(`${user.name} has received ${Math.ceil(level * 0.5).toLocaleString()} ${(Math.ceil(level * 0.5) === 1 ? moneyName : moneyPlural)} for reaching level ${level.toLocaleString()}.`);
						reward = `${Math.ceil(level * 0.5).toLocaleString()} ${(Math.ceil(level * 0.5) === 1 ? moneyName : moneyPlural)}.`;
					}
					user.sendTo(room, `|html|<center><font size=4><strong><i>Level Up!</i></strong></font><br />You have reached level ${level.toLocaleString()}, and have earned ${reward}</strong></center>`);
				}
			});
		});
	}

	start() {
		this.granting = setInterval(() => this.grantExp(), 30000);
	}

	end() {
		clearInterval(this.granting);
		this.granting = null;
	}
}

if (Server.ExpControl) {
	Server.ExpControl.end();
	delete Server.ExpControl;
}
Server.ExpControl = new ExpFunctions();

exports.commands = {
	"!exp": true,
	level: "exp",
	xp: "exp",
	exp(target, room, user) {
		if (!this.runBroadcast()) return;
		let targetId = toID(target);
		if (target || !target && this.broadcasting) {
			if (!target) targetId = user.userid;
			EXP.readExp(targetId, exp => {
				this.sendReplyBox(`${Server.nameColor(target, true)} has ${exp.toLocaleString()} exp, and is Level ${Server.ExpControl.level(targetId).toLocaleString()} and needs ${Server.ExpControl.nextLevel(targetId).toLocaleString()} to reach the next level.`);
			});
		} else {
			EXP.readExp(user.userid, exp => {
				let expData = `Name: ${Server.nameColor(user.name, true)}<br />Current level: ${Server.ExpControl.level(user.userid).toLocaleString()}<br />Current Exp: ${exp.toLocaleString()}<br />Exp Needed for Next level: ${Server.ExpControl.nextLevel(user.userid).toLocaleString()}`;
				expData += `<br />All rewards have a 1 time use! <br /><br />`;
				expData += `Level 5 unlocks a free Profile Background and Song. <br /><br />`;
				expData += `Level 10 unlocks a free Custom Avatar. <br /><br />`;
				expData += `Level 15 unlocks a free Profile Title. <br /><br />`;
				expData += `Level 20 unlocks a free Custom Userlist Icon. <br /><br />`;
				expData += `Level 25 unlocks a free Emote. <br /><br />`;
				expData += `Level 30 unlocks a free Custom Color.  <br /><br />`;
				expData += `Level 35 unlocks 50 ${moneyPlural}. <br /><br />`;
				expData += `Level 40 unlocks a free Chatroom. <br /><br />`;
				expData += `Level 45 unlocks a free Room Shop.<br /><br />`;
				this.sendReplyBox(expData);
			});
		}
	},

	givexp: "giveexp",
	giveexp(target, room) {
		if (!this.can("exp")) return false;
		let [username, amount] = target.split(",").map(p => { return p.trim(); });
		if (!amount) return this.parse("/help giveexp");

		let uid = toID(username);
		amount = isExp(amount);

		if (amount > 1000) return this.sendReply("You cannot give more than 1,000 exp at a time.");
		if (username.length > 18) return this.sendReply("Usernames are required to be less than 19 characters long.");
		if (typeof amount === "string") return this.errorReply(amount);

		Server.ExpControl.addExp(uid, room, amount);
		this.sendReply(`${uid} has received ${amount.toLocaleString()} EXP.`);
	},
	giveexphelp: ["/giveexp [user], [amount] - Gives [user] [amount] of exp."],

	resetexp: "resetxp",
	confirmresetexp: "resetxp",
	resetxp(target, room, user, conection, cmd) {
		if (!target) return this.errorReply("USAGE: /resetxp (USER)");
		let targetUser = toID(target);
		if (!this.can("exp")) return false;
		if (cmd !== "confirmresetexp") {
			return this.popupReply(`|html|<center><button name="send" value="/confirmresetexp ${targetUser}" style="background-color: red; height: 300px; width: 150px"><strong><font color= "white" size= 3>Confirm EXP reset of ${Server.nameColor(targetUser, true)}; this is only to be used in emergencies, cannot be undone!</font></strong></button>`);
		}
		Db.exp.set(targetUser, 0);
		if (Users.get(target) && Users.get(target).connected) Users.get(target).popup(`Your EXP was reset by an Administrator. This cannot be undone and nobody below the rank of Administrator can assist you or answer questions about this.`);
		user.popup(`|html|You have reset the EXP of ${Server.nameColor(target, true)}.`);
		Monitor.adminlog(`[EXP Monitor] ${user.name} has reset the EXP of ${target}.`);
	},

	doublexp: "doubleexp",
	doubleexp(target, room, user) {
		if (!this.can("exp")) return;
		DOUBLE_XP = !DOUBLE_XP;
		Rooms.rooms.forEach((curRoom, id) => {
			if (id !== "global") curRoom.addRaw(`<div class="broadcast-${(DOUBLE_XP ? "green" : "red")}"><strong>Double XP is turned ${(DOUBLE_XP ? "on! You will now " : "off! You will no longer ")} receive double XP.</strong></div>`).update();
		});
		return this.sendReply(`Double XP was turned ${(DOUBLE_XP ? "ON" : "OFF")}.`);
	},

	expunban(target, room, user) {
		if (!this.can("exp")) return false;
		if (!target) return this.parse("/help expunban");
		let targetId = toID(target);
		if (!Db.expoff.has(targetId)) return this.errorReply(`${target} is not currently exp banned.`);
		Db.expoff.remove(targetId);
		this.globalModlog(`EXPUNBAN`, targetId, ` by ${user.name}`);
		this.addModAction(`${target} was exp unbanned by ${user.name}.`);
		this.sendReply(`${target} is no longer banned from exp.`);
	},
	expunbanhelp: ["/expunban [user] - allows [user] to gain exp, if they were exp banned."],

	expban(target, room, user) {
		if (!this.can("exp")) return false;
		if (!target) return this.parse("/help expban");
		let targetId = toID(target);
		if (Db.expoff.has(targetId)) return this.errorReply(`${target} is currently exp banned.`);
		Db.expoff.set(targetId, true);
		this.globalModlog(`EXPBAN`, targetId, ` by ${user.name}`);
		this.addModAction(`${target} was exp banned by ${user.name}.`);
		this.sendReply(`${target} is now banned from exp.`);
	},
	expbanhelp: ["/expban [user] - bans [user] from gaining exp until removed."],

	"!xpladder": true,
	expladder: "xpladder",
	xpladder(target, room, user) {
		if (!target) target = 100;
		target = Number(target);
		if (isNaN(target)) target = 100;
		if (!this.runBroadcast()) return;
		let keys = Db.exp.keys().map(name => {
			return {name: name, exp: Db.exp.get(name).toLocaleString()};
		});
		if (!keys.length) return this.sendReplyBox("EXP ladder is empty.");
		keys.sort(function (a, b) { return toID(b.exp) - toID(a.exp); });
		this.sendReplyBox(rankLadder("Exp Ladder", "EXP", keys.slice(0, target), "exp") + "</div>");
	},
};
