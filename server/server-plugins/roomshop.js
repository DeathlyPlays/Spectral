/************************************
 * Room Shops for Pokemon Showdown	*
 * Created by: Insist and Volco		*
 ************************************/

"use strict";

const FS = require("../lib/fs.js");

exports.commands = {
	rs: "roomshop",
	rshop: "roomshop",
	roomshop: {
		toggle: function (target, room, user) {
			if (!target) return this.parse(`/help roomshop toggle`);
			if (!this.can("roomshop")) return false;
			if (this.meansYes(toId(target))) {
				if (Db.roomshop.has(room.id)) return this.errorReply(`${room.title} already has a Room Shop.`);
				Db.roomshop.set(room.id);
				this.privateModAction(`${room.title}'s Room Shop has been enabled.`);
				if (room.founder) this.parse(`/roomshop bank set ${room.founder}`);
			} else if (this.meansNo(toId(target))) {
				if (!Db.roomshop.has(room.id)) return this.errorReply(`${room.title} does not have a Room Shop yet.`);
				Db.roomshop.remove(room.id);
				this.privateModAction(`${room.title}'s Room Shop has been disabled.`);
			} else {
				this.parse(`/help roomshop toggle`);
			}
		},
		togglehelp: [`/roomshop toggle (yes/enable/on/true or no/disable/off/false) - enables or disables a Room Shop in the current room.`],

		bank: {
			set: function (target, room, user) {
				if (!this.can("roomshop", null, room)) return false;
				target = toId(target);
				if (!target) return this.parse(`/roomshophelp`);
				let roomshop = Db.roomshop.get(room.id, {items: {}});
				if (!roomshop) return this.errorReply(`${room.title} does not have a Room Shop yet.`);
				if (roomshop.bank) return this.errorReply(`${room.title} already has a Bank.`);
				roomshop.bank = target;
				Db.roomshop.set(room.id, roomshop);
				this.privateModAction(`${room.title}'s Room Shop Bank has been set as "${target}" by ${user.name}.`);
			},

			remove: function (target, room, user) {
				if (!this.can("roomshop", null, room)) return false;
				let roomshop = Db.roomshop.get(room.id, {items: {}});
				if (!roomshop) return this.errorReply(`${room.title} does not have a Room Shop yet.`);
				if (!roomshop.bank) return this.errorReply(`${room.title} has no bank set yet.`);
				delete roomshop.bank;
				Db.roomshop.set(room.id, roomshop);
				this.privateModAction(`${room.title}'s Room Shop Bank has been removed by ${user.name}.`);
			},

			account: "holder",
			holder: function (target, room) {
				if (!this.runBroadcast()) return;
				let roomshop = Db.roomshop.get(room.id, {items: {}});
				if (!roomshop) return this.errorReply(`${room.title} does not have a Room Shop.`);
				if (!roomshop.bank) return this.errorReply(`${room.title} hasn't set a bank yet.`);
				return this.sendReplyBox(`<strong>${room.title}'s Bank:</strong> ${Server.nameColor(roomshop.bank, true)}`);
			},

			"": "atm",
			money: "atm",
			atm: function (target, room) {
				if (!this.runBroadcast()) return;
				let roomshop = Db.roomshop.get(room.id, {items: {}});
				if (!roomshop) return this.errorReply(`${room.title} does not have a Room Shop.`);
				if (!roomshop.bank) return this.errorReply(`${room.title} hasn't set a bank yet.`);
				if (this.broadcasting) {
					this.parse(`!atm ${roomshop.bank}`);
				} else {
					this.parse(`/atm ${roomshop.bank}`);
				}
			},
		},

		additem: "add",
		add: function (target, room, user) {
			if (!this.can("roomshop", null, room)) return false;
			let roomshop = Db.roomshop.get(room.id, {items: {}});
			if (Object.keys(roomshop.items).length > 12) return this.errorReply(`${room.title} has already reached the maximum amount of items allowed.`);
			let [item, price, ...desc] = target.split(",").map(p => p.trim());
			if (!(item && price && desc)) return this.parse("/roomshophelp");
			if (item.length < 1 || item.length > 20) return this.errorReply(`The item name should be between 1-20 characters long.`);
			if (roomshop.items[toId(item)]) return this.errorReply(`${item} is already an item in the room shop.`);
			if (isNaN(price) || price < 1) return this.errorReply(`The price for the item must be an integer above 0.`);
			if (desc.length < 1 || desc.length > 50) return this.errorReply(`The description for an item must be between 1-50 characters long.`);
			roomshop.items[toId(item)] = {id: toId(item), name: item, price: price, desc: desc.join(", ")};
			Db.roomshop.set(room.id, roomshop);
			room.addRaw(`"${item}" was added to the Room Shop by ${Server.nameColor(user.name, true, true)}.`);
			this.privateModAction(`${user.name} has added "${item}" into the Room Shop.`);
		},

		deleteitem: "remove",
		delete: "remove",
		removeitem: "remove",
		remove: function (target, room, user) {
			if (!this.can("roomshop", null, room)) return false;
			if (!target) return this.parse(`/roomshophelp`);
			let roomshop = Db.roomshop.get(room.id, {items: {}});
			if (!roomshop.items[toId(target)]) return this.errorReply(`The item "${target}" does not exist.`);
			delete roomshop.items[toId(target)];
			Db.roomshop.set(roomshop);
			room.addRaw(`"${target}" was removed from the Room Shop by ${Server.nameColor(user.name, true, true)}.`);
			this.privateModAction(`${user.name} has removed "${target}" from the Room Shop.`);
		},

		"": "display",
		shop: "display",
		display: function (target, room) {
			if (!this.runBroadcast()) return;
			let roomshop = Db.roomshop.get(room.id, {items: {}});
			if (!roomshop) return this.errorReply(`${room.title} does not have a Room Shop.`);
			if (Object.keys(roomshop.items).length < 1) return this.errorReply(`${room.title}'s Room Shop currently has no items.`);
			let display = `<div style="max-height: 200px; width: 100%; overflow: scroll;"><center><h1>${room.title}'s Room Shop</h1><table border="1" cellspacing ="0" cellpadding="3"><tr><td>Item</td><td>Description</td><td>Cost</td></tr>`;
			for (let i in roomshop.items) {
				display += `<tr>`;
				display += `<td><button class="button" name="send" value="/roomshop buy ${roomshop.items[i].name}">${roomshop.items[i].name}</button></td>`;
				display += `<td>${roomshop.items[i].desc}</td>`;
				display += `<td>${roomshop.items[i].price.toLocaleString()} ${roomshop.items[i].price !== 1 ? moneyPlural : moneyName}</td>`;
				display += `</tr>`;
			}
			display += `</table></center></div>`;
			return this.sendReplyBox(display);
		},

		purchase: "buy",
		buy: function (target, room, user) {
			if (!Db.roomshop.has(room.id)) return this.errorReply("Room Shop is not enabled here.");
			let roomshop = Db.roomshop.get(room.id, {items: {}});
			if (!roomshop.bank) return this.errorReply(`${room.title} hasn't set a bank yet.`);
			if (!roomshop.items[toId(target)]) return this.errorReply(`The item "${target}" does not exist.`);
			if (roomshop.bank === user.userid) return this.errorReply("Bank cannot purchase from the Room Shop.");
			let bank = roomshop.bank;
			let cost = roomshop.items[toId(target)].price;
			// Take payments and record payments from the user
			Economy.readMoney(user.userid, money => {
				if (money < cost) {
					this.errorReply(`You do not have enough ${moneyName} to purchase ${target}.`);
					return;
				}
				Economy.writeMoney(user.userid, -cost, () => {
					Economy.logTransaction(`${user.name} bought "${target}" from ${room.title}'s roomshop for ${cost.toLocaleString()} ${moneyName}${Chat.plural(cost)}.`);
				});
				Economy.writeMoney(bank, cost, () => {
					Economy.logTransaction(`${user.name} bought "${target}" from ${room.title}'s roomshop for ${cost.toLocaleString()} ${moneyName}${Chat.plural(cost)}.`);
				});

				if (FS("logs/roomshops").readdirSync()) FS("logs/roomshops").mkdirpSync();
				FS(`logs/roomshops/roomshop_${room.id}.txt`).append(`[${new Date().toUTCString()}] ${user.name} has bought "${target}" from the Room Shop.\n`);

				for (let u in room.users) {
					if (room.auth[u] === "#") {
						Users.get(u).send(`|pm|~${room.title}'s Shop Alert|${Users.get(u).getIdentity()}|/raw ${Server.nameColor(user.name, true, true)} has bought "${target}" from your Room Shop in ${room.title}.`);
					}
				}

				return this.sendReply(`You have bought "${target}" for ${cost.toLocaleString()} ${moneyName}${Chat.plural(cost)} from ${room.title}'s Room Shop.`);
			});
		},

		logs: "transactions",
		log: "transactions",
		transactions: function (target, room, user) {
			if (!this.can("roomshop", null, room)) return false;
			if (!Db.roomshop.has(room.id)) return this.errorReply(`Roomshop is not enabled here.`);
			target = toId(target);

			let numLines = 15;
			let matching = true;

			if (target.match(/\d/g) && !isNaN(target)) {
				numLines = Number(target);
				matching = false;
			}

			let topMsg = `Displaying the last ${numLines} lines of transactions:\n`;
			let file = `logs/roomshops/roomshop_${room.id}.txt`;
			if (!FS(file).readIfExistsSync()) return user.popup(`No transactions.`);

			FS(file).read().then(data => {
				data = data.split('\n');
				if (target && matching) {
					data = data.filter(line => line.toLowerCase().includes(target.toLowerCase()));
				}
				user.popup(`|wide|${topMsg + data.slice(-(numLines + 1)).join('\n')}`);
			});
		},

		help: function () {
			this.parse(`/help roomshop`);
		},
	},

	roomshophelp: [
		`/roomshop toggle [enable|on|true] - Enables roomshop in the room. Requires @, &, #, ~, or ~.
		/roomshop toggle [disable|off|false] - Disables roomshop in the room. Requires @, &, #, ~, or ~.
		/roomshop shop - Displays the Room Shop.
		/roomshop add [item], [price], [description] - Adds an item into the Room Shop. Requires @, &, #, or ~.
		/roomshop delete [item] - Removes an item from the Room Shop. Requires @, &, #, or ~.
		/roomshop buy [item] - Purchase an item from the Room Shop.
		/roomshop logs - Shows purchase logs. Requires @, &, #, or ~.
		/roomshop bank set [user] - Sets the room's bank. Requires @, &, #, or ~.
		/roomshop bank remove - Removes the room's bank. Requires @, &, #, or ~.
		/roomshop bank holder - Shows the room's bank.
		/roomshop bank atm - Shows the room's bank ATM.
		/roomshop help - Displays this help command.`,
	],
};
