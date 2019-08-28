/**************************
 * Quotes Plug-in for PS! *
 * Created by Insist      *
 **************************/

"use strict";

const FS = require("../lib/fs.js");

let quotes = FS("config/chat-plugins/quotes.json").readIfExistsSync();

if (quotes !== "") {
	quotes = JSON.parse(quotes);
} else {
	quotes = {};
}

function write() {
	FS("config/chat-plugins/quotes.json").writeUpdate(() => (
		JSON.stringify(quotes)
	));
	let data = "{\n";
	for (let u in quotes) {
		data += '\t"' + u + '": ' + JSON.stringify(quotes[u]) + ",\n";
	}
	data = data.substr(0, data.length - 2);
	data += "\n}";
	FS("config/chat-plugins/quotes.json").writeUpdate(() => (
		data
	));
}

exports.commands = {
	quotes: "quote",
	quote: {
		add(target, room, user) {
			if (!this.can("quotes")) return false;
			let [name, ...quote] = target.split(",").map(p => p.trim());
			if (!quote) return this.parse("/quotehelp");
			if (name.length > 18) return this.errorReply("Quote names must be 18 characters or less!");
			if (quote.length > 300) return this.errorReply("Quotes should remain 300 characters long or less.");
			quotes[toID(name)] = {
				name: name,
				id: toID(name),
				quote: quote.join(", "),
			};
			write();
			return this.sendReply(`Quote ${name} created!\n${name}: ${quote.join(", ")}.`);
		},

		delete(target, room, user) {
			if (!this.can("quotes")) return false;
			if (!target) return this.parse("/quotehelp");
			let quoteid = toID(target);
			if (!quotes[quoteid]) return this.errorReply(`${target} is not currently registered as a quote.`);
			delete quotes[quoteid];
			write();
			this.sendReply(`Quote ${target} has been deleted.`);
		},

		view: "show",
		display: "show",
		search: "show",
		show(target, room, user) {
			if (!this.runBroadcast()) return;
			if (Object.keys(quotes).length < 1) return this.errorReply(`There are no quotes on ${Config.serverName}.`);
			if (!target) {
				let randQuote = Object.keys(quotes)[Math.floor(Math.random() * Object.keys(quotes).length)];
				let title = quotes[randQuote].name;
				let randomQuote = quotes[randQuote].quote;
				this.sendReply(`${title}: "${randomQuote}"`);
			} else {
				let quoteid = toID(target);
				if (!quotes[quoteid]) return this.errorReply('That quote does not exist.');
				this.sendReply(`${quotes[quoteid].name}: "${quotes[quoteid].quote}"`);
			}
		},

		listquotes: "viewquotes",
		list: "viewquotes",
		viewquotes(target, room, user) {
			if (!this.runBroadcast()) return;
			if (Object.keys(quotes).length < 1) return this.errorReply(`There are no quotes on ${Config.serverName}.`);
			let reply = `<strong><u>Quotes (${Object.keys(quotes).length.toLocaleString()})</u></strong><br />`;
			for (let quote in quotes) reply += `<strong>${quote}</strong> <button class="button" name="send" value="/quotes view ${quote}">View ${quote}</button><br />`;
			this.sendReplyBox(`<div class="infobox infobox-limited">${reply}</div>`);
		},

		"": "help",
		help(target, room, user) {
			this.parse("/help quote");
		},
	},

	quotehelp: [
		`/quote add [name], [quote] - Adds a quote into the server database. Requires % and up.
		/quote delete [name] - Deletes a quote from the server database.  Requires % and up.
		/quote show - Randomly generates a quote from the database.
		/quote show [name] - Displays a specific quote from the database.
		/quote list - Shows all the existing quote names.
		/quote help - Shows this command.`,
	],
};
