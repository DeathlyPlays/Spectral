"use strict";

/**@type {{[k: string]: MoveData}} */
let BattleMovedex = {
	// RaginInfernape
	"fireydestruction": {
		id: "fireydestruction",
		name: "Firey Destruction",
		basePower: 100,
		accuracy: true,
		category: "Physical",
		shortDesc: "50% chance to burn.",
		desc: "50% chance to burn the opponent.",
		pp: 15,
		secondary: {
			chance: 50,
			status: "brn",
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Fiery Dance', source);
			this.add('-anim', source, 'Flare Blitz', source);
			this.add(`c|☢RaginInfernape|!git gud nerd`);
			let gitGud =
				 `${Config.serverName}'s Github's:<br />` +
				 `- Language: JavaScript (Node.js)<br />` +
				`- <a href="https://github.com/DeathlyPlays/Spectral">${Config.serverName}'s Server Code</a><br />` +
				`- <a href="https://github.com/DeathlyPlays/Spectral/commits/master">What's new?</a><br />` +
				`- <a href="https://github.com/Zarel/Pokemon-Showdown">Main's source code</a><br />` +
				`- <a href="https://github.com/Zarel/Pokemon-Showdown-Client">Client source code</a><br />` +
				`- <a href="https://github.com/Zarel/Pokemon-Showdown-Dex">Dex source code</a>`;
			this.add(`raw|${gitGud}`);
		},
		flags: {protect: 1, mirror: 1, contact: 1},
		priority: 0,
		target: "normal",
		type: "Fire",
	},
	// Back At My Day
	"bigthunder": {
		id: "bigthunder",
		name: "Big Thunder",
		basePower: 120,
		accuracy: true,
		category: "Special",
		shortDesc: "50% chance to target self or foe.",
		desc: "50% chance to target user or the opponent.",
		pp: 10,
		onModifyMove(move, pokemon, target) {
			if (this.random(1)) {
				move.target = "normal";
			} else {
				move.target = "self";
			}
		},
		secondary: false,
		flags: {protect: 1, mirror: 1},
		priority: 0,
		type: "Electric",
	},
};

exports.BattleMovedex = BattleMovedex;
