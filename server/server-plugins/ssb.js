"use strict";

const FS = require("../../.lib-dist/fs").FS

let ssbWrite = true; //if false, do not write to JSON
let noRead = false; //if true, do not read from JSON

const MAX_MOVEPOOL_SIZE = 4;

let customMovepool = ["Stretch", "Flame Tower", "Rain Spear", "Healing Herbs", "Electro Drive", "Hailstorm", "Beat Down", "Nuclear Waste", "Terratremor", "Ventilation", "Psychic Shield", "Swarm Charge", "Rock Cannon", "Spook", "Imperial Rampage", "Shadow Run", "Magnorang", "Majestic Dust"]; //Add default custom move names here.
let typeList = ["Normal", "Fire", "Water", "Grass", "Electric", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];

const BANS = {
	moves: ["Baton Pass"],
	abilities: ["Shadow Tag", "Arena Trap", "Power Construct", "Moody"],
	items: [],
	pokemon: [],
	tiers: ["Uber", "AG"],
};

global.writeSSB = function () {
	if (!ssbWrite) return false; //Prevent corruptions
	FS("config/chat-plugins/ssb.json").write(JSON.stringify(Server.ssb));
};

//Shamelessly ripped from teambuilder client.
function getStat(stat, set, evOverride, natureOverride) {
	if (!set) set = this.curSet;
	if (!set) return 0;

	if (!set.ivs) {
		set.ivs = {
			hp: 31,
			atk: 31,
			def: 31,
			spa: 31,
			spd: 31,
			spe: 31,
		};
	}
	if (!set.evs) set.evs = {};

	// do this after setting set.evs because it's assumed to exist
	// after getStat is run
	let template = Dex.getTemplate(set.species);
	if (!template.exists) return 0;

	if (!set.level) set.level = 100;
	if (typeof set.ivs[stat] === "undefined") set.ivs[stat] = 31;

	let baseStat = Dex.getTemplate(set.species).baseStats[stat];
	let iv = (set.ivs[stat] || 0);
	let ev = set.evs[stat];
	if (evOverride !== undefined) ev = evOverride;
	if (ev === undefined) ev = (this.curTeam.gen > 2 ? 0 : 252);

	if (stat === "hp") {
		if (baseStat === 1) return 1;
		return Math.floor(Math.floor(2 * baseStat + iv + Math.floor(ev / 4) + 100) * set.level / 100 + 10);
	}
	let val = Math.floor(Math.floor(2 * baseStat + iv + Math.floor(ev / 4)) * set.level / 100 + 5);
	if (natureOverride) {
		val *= natureOverride;
	} else if (Dex.getNature(set.nature) && Dex.getNature(set.nature).plus === stat) {
		val *= 1.1;
	} else if (Dex.getNature(set.nature) && Dex.getNature(set.nature).minus === stat) {
		val *= 0.9;
	}
	return Math.floor(val);
}

function buildMenu(userid) {
	if (!Server.ssb[userid]) return `<span style="color: red"><strong>Error: </strong>User "${userid}" not found in ssb.</span>`;
	let speciesName = toID(Server.ssb[userid].species);
	let split = Server.ssb[userid].species.split("-");
	if (split.length > 1) {
		speciesName = `${toID(split[0])}-${speciesName.substring(toID(split[0]).length)}`;
	}
	let output = ``;
	output += `<div class="setchart" style="height: 155px; background-image:url(//play.pokemonshowdown.com/sprites/${(Dex.getTemplate(toID(Server.ssb[userid].species)).gen === 7 ? `bw` : `xydex`)}${(Server.ssb[userid].shiny ? `-shiny` : ``)}/${speciesName}.png); background-position: -2px -3px; background-repeat: no-repeat;">`;
	output += `<div class="setcol setcol-icon"><div class="setcell-sprite"></div><div class="setcell setcell-pokemon"><label>Pokémon</label><button class="textbox chartinput" style="width: 104px; height: 20px; text-align: left" name="send" value="/ssb edit species">${Server.ssb[userid].species}</button></div></div>`;
	output += `<div class="setcol setcol-details"><div class="setrow"><div class="setcell setcell-details"><label>Details</label><button class="textbox setdetails" tabindex="-1" name="send" value="/ssb edit details"><span class="detailcell detailcell-first"><label>Level</label>${Server.ssb[userid].level}</span><span class="detailcell"><label>Gender</label>${(Server.ssb[userid].gender === `random` ? `-` : Server.ssb[userid].gender)}</span><span class="detailcell"><label>Happiness</label>${Server.ssb[userid].happiness}</span><span class="detailcell"><label>Shiny</label>${(Server.ssb[userid].shiny ? `Yes` : `No`)}</span></button><span class="itemicon" style="background: none"></span></div></div><div class="setrow"><div class="setcell setcell-item"><label>Item</label><button class="textbox chartinput" style="width:104px; height: 20px; text-align: left" name="send" value="/ssb edit item">${(Server.ssb[userid].item ? Server.ssb[userid].item : ``)}</button></div><div class="setcell setcell-ability"><label>Ability</label><button class="textbox chartinput" style="width:104px; height: 20px; text-align: left" name="send" value="/ssb edit ability">${Server.ssb[userid].ability}</button></div></div></div>`;
	output += `<div class="setcol setcol-moves"><div class="setcell"><label>Moves</label><button class="textbox chartinput" style="width:129px; height: 20px; text-align: left; overflow: hidden" name="send" value="/ssb edit move">${(Server.ssb[userid].movepool[0] ? Server.ssb[userid].movepool[0] : ``)}</button></div><div class="setcell"><button class="textbox chartinput" style="width:129px; height: 20px; text-align: left; overflow: hidden" name="send" value="/ssb edit move">${(Server.ssb[userid].movepool[1] ? Server.ssb[userid].movepool[1] : ``)}</button></div><div class="setcell"><button class="textbox chartinput" style="width:129px; height: 20px; text-align: left; overflow: hidden" name="send" value="/ssb edit move">${(Server.ssb[userid].movepool[2] ? Server.ssb[userid].movepool[2] : ``)}</button></div><div class="setcell"><button class="textbox chartinput" style="width:129px; height: 20px; text-align: left; overflow: hidden" name="send" value="/ssb edit move">${(Server.ssb[userid].cMove ? Server.ssb[userid].cMove : (Server.ssb[userid].movepool[3] ? Server.ssb[userid].movepool[3] : ``))}</button></div></div>`;
	output += `<div class="setcol setcol-stats"><div class="setrow"><label>Stats</label><button class="textbox setstats" name="send" value="/ssb edit stats"><span class="statrow statrow-head"><label></label><span class="statgraph"></span> <em>EV</em></span>`;
	let statNames = [`HP`, `Atk`, `Def`, `SpA`, `SpD`, `Spe`];
	let stats = {};
	for (let i = 0; i < statNames.length; i++) {
		stats[toID(statNames[i])] = getStat(toID(statNames[i]), {
			species: Server.ssb[userid].species,
			evs: Server.ssb[userid].evs,
			ivs: Server.ssb[userid].ivs,
			nature: Server.ssb[userid].nature,
			level: Server.ssb[userid].level,
		});
		let evBuf = `<em>${(Server.ssb[userid].evs[toID(statNames[i])] === 0 ? `` : Server.ssb[userid].evs[toID(statNames[i])])}</em>`;
		if (Dex.getNature(Server.ssb[userid].nature).plus === toID(statNames[i])) {
			evBuf += `<small>+</small>`;
		} else if (Dex.getNature(Server.ssb[userid].nature).minus === toID(statNames[i])) {
			evBuf += `<small>&minus;</small>`;
		}
		let width = stats[toID(statNames[i])] * 75 / 504;
		if (statNames[i] === `HP`) width = stats[toID(statNames[i])] * 75 / 704;
		if (width > 75) width = 75;
		let color = Math.floor(Server.ssb[userid].evs[toID(statNames[i])] * 180 / 714);
		if (color > 360) color = 360;
		output += `<span class="statrow"><label>${statNames[i]}</label> <span class="statgraph"><span style="width: ${width}px; background: hsl(${color}, 40%, 75%);"></span></span> ${evBuf}</span>`;
	}
	output += `</div></div>`;
	output += `<div style="text-align:center"><button class="button" name="send" value="/ssb custom">Custom Move List</button> | <button class="button" name="send" value="/ssb toggle">${(Server.ssb[userid].active ? `Deactivate your Pokemon` : `Activate your Pokemon`)}</button></div></div>`;
	return output;
}

function moveMenu(userid) {
	let output = ``;
	output += `<div class="setchart" style="text-align:center"><h3><u>Move Menu</u></h3><div style="padding-bottom: 2px"><i>Current Moves:</i> `;
	for (let i = 0; i < Server.ssb[userid].movepool.length; i++) {
		if (Server.ssb[userid].movepool.length === 0) break;
		output += (`${(i + 1 === Server.ssb[userid].movepool.length && !Server.ssb[userid].cMove) ? Server.ssb[userid].movepool[i] : Server.ssb[userid].movepool[i]}, `);
	}
	if (Server.ssb[userid].cMove) output += Server.ssb[userid].cMove;
	output += `</div><div style="padding-bottom: 2px"><i>Custom-made Custom Move:</i> ${(Server.ssb[userid].selfCustomMove ? Server.ssb[userid].selfCustomMove : `<button name="send" value="/shop" class="button">Purchase</button>`)}</div>`;
	output += `<button name="send" class="button" value="/ssb edit move help">Set Moves</button> | <button class="button" name="send" value="/ssb custom">Set a Custom Move</button> | <button name="send" class="button" value="/ssb edit moveq custom, ${(Server.ssb[userid].selfCustomMove ? Server.ssb[userid].selfCustomMove : ``)}">Set Custom-made Custom Move</button> | <button name="send" class="button" value="/ssb edit main">Main Menu</button></div>`;
	return output;
}

function itemMenu(userid) {
	return `<div class="setchart" style="text-align:center"><h3><u>Item Menu</u></h3><div style="padding-bottom: 2px"><i>Current Item:</i> ${(Server.ssb[userid].item ? Server.ssb[userid].item : `None`)}</div><div style="padding-bottom: 2px"><i>Custom Item:</i> ${(Server.ssb[userid].cItem ? Server.ssb[userid].cItem : `<button name="send" value="/shop" class="button">Purchase</button>`)}</div><button name="send" class="button" value="/ssb edit item help">Set Item</button> | <button name="send" class="button" value="/ssb edit itemq reset">Reset Item</button> | <button name="send" class="button" value="/ssb edit itemq ${(Server.ssb[userid].cItem ? Server.ssb[userid].cItem : `help`)}">Set Custom Item</button> | <button name="send" class="button" value="/ssb edit main">Main Menu</button></div>`;
}

function abilityMenu(userid) {
	let output = `<div class="setchart" style="text-align:center"><h3><u>Ability Menu</u></h3><div style="padding-bottom: 2px"><i>Current Ability:</i> ${Server.ssb[userid].ability}</div><div style="padding-bottom: 2px"><i>Custom Ability:</i> ${(Server.ssb[userid].cAbility ? Server.ssb[userid].cAbility : `<button name="send" value="/shop" class="button">Purchase</button>`)}</div>`;
	let pokemon = Dex.getTemplate(Server.ssb[userid].species);
	for (let i in pokemon.abilities) {
		output += `<button name="send" value="/ssb edit abilityq ${pokemon.abilities[i]}" class="button">Set to ${pokemon.abilities[i]}</button> | `;
	}
	if (Server.ssb[userid].cAbility) output += `<button name="send" value="/ssb edit abilityq ${Server.ssb[userid].cAbility}" class="button">Set to ${Server.ssb[userid].cAbility}</button> | `;
	output += `<button name="send" value="/ssb edit main" class="button">Main Menu</button></div>`;
	return output;
}

function statMenu(userid) {
	let output = `<div class="setchart" style="text-align:center; height: 200px">`;
	output += `<table style="border:1px solid black; display: inline-block; float: left"><tr><th colspan="3" style="border-right: 1px solid black;">EVs</th><th colspan="3" style="border-left: 1px solid black;">IVs</th></tr>`;
	let values = [`HP`, `Atk`, `Def`, `SpA`, `SpD`, `Spe`];
	for (let i = 0; i < values.length; i++) {
		output += `<tr><td><button class="button" name="send" value="/ssb edit statsq ev, ${values[i]}, 0">Set 0</button></td><th>${values[i]}: ${Server.ssb[userid].evs[toID(values[i])]}</th><td style="border-right:1px solid black"><button class="button" name="send" value="/ssb edit statsq ev, ${values[i]}, 252">Set 252</button></td>`;
		output += `<td style="border-left:1px solid black"><button class="button" name="send" value="/ssb edit statsq iv, ${values[i]}, 0">Set 0</button></td><th>${values[i]}: ${Server.ssb[userid].ivs[toID(values[i])]}</th><td><button class="button" name="send" value="/ssb edit statsq iv, ${values[i]}, 31">Set 31</button></td></tr>`;
	}
	output += `<div style="float: right; display: inline-block; width: 40%"><strong><u>Stat Menu</u></strong><br /><br /><button class="button" name="send" value="/ssb edit stats help">Set EVs or IVs to a custom value</button><br /><br /><i>Current Nature:</i> ${Server.ssb[userid].nature}<br /><br /><button class="button" name="send" value="/ssb edit stats nature help">Set Nature</button><br /><br /><button class="button" name="send" value="/ssb edit main">Main Menu</button></div></div>`;
	return output;
}

function detailMenu(userid) {
	let output = `<div class="setchart" style="text-align:center; height:140px"><h3><u>Details Menu</u></h3>`;
	output += `<i>Level: </i>${Server.ssb[userid].level} | <button name="send" value="/ssb edit detailsq level, 1" class="button">Set to 1</button> <button name="send" value="/ssb edit detailsq level, 50" class="button">Set to 50</button> <button class="button" name="send" value="/ssb edit detailsq level, 100">Set to 100</button><br />`;
	output += `<i>Gender: </i>${Server.ssb[userid].gender} | <button name="send" value="/ssb edit detailsq gender, male" class="button">Set to Male</button> <button name="send" value="/ssb edit detailsq gender, female" class="button">Set to Female</button> <button class="button" name="send" value="/ssb edit detailsq gender, random">Set to Random</button> <button name="send" value="/ssb edit detailsq gender, genderless" class="button">Set to Genderless</button><br />`;
	output += `<i>Happiness: </i>${Server.ssb[userid].happiness} | <button name="send" value="/ssb edit details happiness, 0" class="button">Set to 0</button> <button class="button" name="send" value="/ssb edit details happiness, 255">Set to 255</button> <button name="send" value="/ssb edit details happiness" class="button">Set to custom value</button><br />`;
	output += `<i>Shiny?:</i> | ${(Server.ssb[userid].canShiny ? `<button name="send" value="/ssb edit details shiny" class="button">Toggle Shiny</button>` : `<button name="send" value="/shop" class="button">Purchase</button>`)} | <i>Custom Symbol: </i>${(Server.ssb[userid].cSymbol ? (`${Server.ssb[userid].symbol} <button class="button" name="send" value="/ssb edit details symbol">Change</button>`) : `<button class="button" name="send value="/shop">Purchase</button>`)} | <button class="button" name="send" value="/ssb edit main">Main Menu</button></div>`;
	return output;
}

function customMenu() {
	let output = `<div class="setchart" style="text-align:center; height:140px"><div style="max-height: 135px; overflow-y: scroll"><h3><u>Custom Moves</u></h3><button class="button" name="send" value="/ssb edit main">Main Menu</button>`;
	for (let i = 0; i < customMovepool.length; i++) {
		output += `<div><strong><u>${customMovepool[i]}</u></strong>: Type: <i>${typeList[i]}</i>, Description: <button class="button" name="send" value="/dt ${customMovepool[i]}, ssbffa">Effects</button><button class="button" name="send" value="/ssb edit move custom, ${customMovepool[i]}">Set as custom move</button></div><br />`;
	}
	output += `<button class="button" name="send" value="/ssb edit main">Main Menu</button></div></div>`;
	return output;
}

class SSB {
	constructor(userid, name) {
		this.userid = userid;
		this.name = name; //exact name of the user's, and name that appears in battle.
		this.symbol = " ";
		this.cSymbol = (Users.get(userid) ? Users.get(userid).group === "+" || Users.get(userid).isStaff : false); //Can the user set a custom symbol? Global auth get this free.
		this.gender = "random"; //M, F, random (M or F), N
		this.shiny = false;
		this.canShiny = false; //Can the user set their Pokemon as shiny?
		this.happiness = 255; //max is default
		this.level = 100; //max is default
		this.species = "Unown";
		this.item = false; //false = no item
		this.cItem = false; //set this to the user's cItem when its purchased and implemented.
		this.bought = {}; //Did you buy something, but not receive it yet? prevents duplicate purchases.
		this.ability = "Levitate"; //Default to the first ability of the selected species
		this.cAbility = false; //set this to the user's cAbility when its purchased and implemented.
		this.movepool = []; //Pool of normal moves, draw 3 from here (4 if no c move).
		this.cMove = false; //Custom move
		this.selfCustomMove = false; //set this to the user's custom-made custom move when its purchased and implemented.
		this.evs = {
			hp: 0,
			atk: 0,
			def: 0,
			spa: 0,
			spd: 0,
			spe: 0,
		};
		this.ivs = {
			hp: 31,
			atk: 31,
			def: 31,
			spa: 31,
			spd: 31,
			spe: 31,
		};
		this.nature = "Serious";
		this.active = false; //If true, this Pokemon can appear in the tier.
	}

	setSpecies(species) {
		let speciesId = toID(species);
		let speciesNum = parseInt(speciesId);
		if (!isNaN(speciesNum)) {
			for (let p in Dex.data.Pokedex) {
				let pokemon = Dex.getTemplate(p);
				if (pokemon.num === speciesNum) {
					species = pokemon.species;
					speciesId = pokemon.id;
					break;
				}
			}
		}
		species = Dex.getTemplate(speciesId);
		if (!species.exists) return false;
		if (!species.learnset && species.id !== "oricoriosensu" && species.id !== "oricoriopau" && species.id !== "oricoriopompom") return false;
		if (species.gen < 1) return false;
		if (species.battleOnly) return false;
		if (BANS.tiers.includes(species.tier)) return false;
		this.species = species.species;
		//Reset Everything
		//Force legal ability
		if (species.id === "wynaut" || species.id === "wobbuffet") {
			this.ability = species.abilities["H"];
		} else {
			this.ability = species.abilities["0"];
		}
		this.movepool = []; //force legal normal moves
		for (let i in this.evs) this.evs[i] = 0;
		for (let j in this.ivs) this.ivs[j] = 31;
		this.level = 100;
		this.happiness = 255;
		this.nature = "Serious";
		this.item = false;
		this.cMove = false;
		this.active = false;
		return true;
	}

	updateName(name) {
		this.name = name;
	}

	setGender(gender) {
		switch (toID(gender)) {
		case "m":
		case "boy":
		case "male":
			this.gender = "M";
			break;
		case "f":
		case "girl":
		case "female":
			this.gender = "F";
			break;
		case "n":
		case "genderless":
		case "neutral":
		case "neither":
		case "none":
			this.gender = "N";
			break;
		case "random":
		case "rand":
		case "r":
			this.gender = "random";
			break;
		default:
			return false;
		}
		return true;
	}

	setSymbol(symbol) {
		if (!this.cSymbol) return false;
		if (symbol === " " || !symbol) {
			symbol = "none";
		} else {
			symbol = symbol.trim();
			symbol = symbol.substring(0, 1);
		}
		if (symbol.length !== 1 && symbol !== "none") return false;
		let bannedSymbols = [`+`, `%`, `@`, `*`, `\u2605`, `#`, `&`, `~`, `|`, `,`, `'`, `"`, `\u5350`, `\u534D`, `\u2030`, `\u005C`];
		let rmt = bannedSymbols.indexOf(Users.get(this.userid).group);
		if (rmt > -1) {
			for (rmt; rmt > -1; rmt--) bannedSymbols.splice(rmt, 1); //G staff may use equal or lower ranked symbols
		}
		if (bannedSymbols.indexOf(symbol) > -1) return false;
		if (symbol === "none") symbol = " ";
		this.symbol = symbol;
		return true;
	}

	setShiny() {
		if (!this.canShiny) return false;
		this.shiny = !this.shiny;
		return true;
	}

	setHappiness(lvl) {
		if (lvl < 0 || lvl > 255) return false;
		this.happiness = lvl;
		return true;
	}

	setLevel(lvl) {
		if (lvl < 1 || lvl > 100) return false;
		this.level = lvl;
		return true;
	}

	setItem(item) {
		item = Dex.getItem(toID(item));
		if (!item.exists) {
			//check custom
			if (this.cItem && toID(this.cItem) === item.id && this.bought.cItem) {
				this.item = this.cItem;
				return true;
			} else {
				return false;
			}
		} else {
			this.item = item.name;
		}
		return true;
	}

	setAbility(ability) {
		ability = Dex.getAbility(toID(ability));
		if (!ability.exists) {
			//check custom
			if (this.cAbility && toID(this.cAbility) === ability.id && this.bought.cAbility) {
				this.ability = this.cAbility;
				return true;
			} else {
				return false;
			}
		} else {
			for (let i in Dex.getTemplate(this.species).abilities) {
				if (toID(Dex.getTemplate(this.species).abilities[i]) === ability.id) {
					this.ability = ability.name;
					return true;
				}
			}
			return false;
		}
	}

	async addMove(move, self) {
		move = Dex.getMove(toID(move));
		if (!move.exists) return self.errorReply(`The move "${move.name}" does not exist.`); //Only normal moves here.
		if (this.movepool.length + (this.cMove === false ? 0 : 1) >= MAX_MOVEPOOL_SIZE) return self.errorReply(`You already have ${MAX_MOVEPOOL_SIZE} moves.`);
		let result = await TeamValidatorAsync("gen7ou").validateTeam(Dex.packTeam([{species: this.species, moves: [move]}]));
		if (result.substring(0, 1) === "0") return self.errorReply(`${this.species} cannot learn "${move.name}".`);
		if (this.movepool.indexOf(move.name) > -1) return self.errorReply(`${this.species} already knows "${move.name}".`);
		this.movepool.push(move.name);
		writeSSB();
		if (self.cmd !== "moveq") self.sendReply(`Added the move "${move.name}" to your movepool.`);
		return self.user.sendTo(self.room, `|uhtmlchange|ssb${self.user.userid}${buildMenu(self.user.userid)}`);
	}

	removeMove(move) {
		move = Dex.getMove(toID(move));
		if (move.exists) {
			if (this.movepool.length < 1) return false;
			if (this.movepool.indexOf(move.name) === -1) return false;
			this.movepool.splice(this.movepool.indexOf(move.name), 1);
			return true;
		} else {
			//check custom
			if (move.id !== toID(this.cMove)) return false;
			this.cMove = false;
			return true;
		}
	}

	setCustomMove(move) {
		move = toID(move);
		let customIds = customMovepool.map(move => { return toID(move); });
		if (customIds.indexOf(move) < 0) {
			//check for self-made custom move
			if (this.selfCustomMove && toID(this.selfCustomMove) === move && this.bought.cMove) {
				this.cMove = this.selfCustomMove;
				return true;
			} else {
				return false;
			}
		}
		this.cMove = customMovepool[customIds.indexOf(move)];
		return true;
	}

	setEvs(ev, value) {
		ev = toID(ev);
		value = parseInt(value);
		if (isNaN(value)) return false;
		if (!this.evs[ev] && this.evs[ev] !== 0) return false;
		let currentVal = 0;
		for (let i in this.evs) {
			if (i === ev) continue;
			currentVal += this.evs[i];
		}
		if (value > 255 || value < 0 || currentVal + value > 510) return false;
		this.evs[ev] = value;
		return true;
	}

	setIvs(iv, value) {
		iv = toID(iv);
		value = parseInt(value);
		if (isNaN(value)) return false;
		if (!this.ivs[iv] && this.ivs[iv] !== 0) return false;
		if (value < 0 || value > 31) return false;
		this.ivs[iv] = value;
		return true;
	}

	setNature(nature) {
		nature = Dex.getNature(toID(nature));
		if (!nature.exists) return false;
		this.nature = nature.name;
		return true;
	}

	async activate(self) {
		let valid = await this.validate(self, true);
		if (valid.length === 0) {
			this.active = !this.active;
			if (this.active) {
				self.user.sendTo(self.room, `|uhtmlchange|ssb${self.user.userid}|${buildMenu(self.user.userid)}`);
				self.sendReply("Your Pokemon was activated! Your Pokemon will appear in battles once the server restarts.");
			} else {
				self.user.sendTo(self.room, `|uhtmlchange|ssb${self.user.userid}|${buildMenu(self.user.userid)}`);
				self.sendReply("Your Pokemon was deactivated. Your Pokemon will no longer appear in battles once the server restarts.");
			}
			return true;
		}
		this.active = false;
		self.user.sendTo(self.room, `|uhtmlchange|ssb${self.user.userid}|${buildMenu(self.user.userid)}`);
		self.sendReply("Your Pokemon was deactivated. Your Pokemon will no longer appear in battles once the server restarts.");
		return false;
	}

	async validate(self, quiet) {
		let dex = Dex.mod("ssbffa");
		let msg = [];
		// Species
		let pokemon = dex.getTemplate(this.species);
		if (!pokemon.exists) {
			msg.push(`The Pokemon "${this.species}" does not exist.`);
			this.setSpecies("Unown");
			this.active = false;
			writeSSB();
			return msg;
		}
		if (BANS.pokemon.includes(pokemon.species) || BANS.tiers.includes(pokemon.tier)) {
			msg.push((BANS.pokemon.includes(pokemon.species) ? `${pokemon.species} is banned.` : `${pokemon.species} is in ${pokemon.tier} which is banned.`));
			this.setSpecies("Unown");
			this.active = false;
			writeSSB();
			return msg;
		}
		// Ability
		let ability = dex.getAbility(this.ability);
		if (!ability.exists || BANS.abilities.includes(this.ability) ||
		(!Dex.getAbility(this.ability).exists && toID(this.cAbility) !== ability.id)) {
			msg.push((!ability.exists ? `The ability ${ability.id} does not exist.` : (BANS.abilities.includes(this.ability) ? `The ability ${ability.name} is banned.` : `${ability.name} is not your custom ability.`)));
			this.ability = pokemon.abilities[0];
		}
		// Item
		if (toID(this.item)) {
			let item = dex.getItem(this.item);
			if (!item.exists || BANS.items.includes(this.item) || (!Dex.getItem(this.item).exists && toID(this.cItem !== item.id))) {
				msg.push((!item.exists ? `The item ${item.id} does not exist.` : (BANS.items.includes(this.item) ? `The item ${item.name} is banned.` : `${item.name} is not your custom item.`)));
				this.item = "";
			}
			// Mega evolution check
			if (item.megaStone && item.megaEvolves === pokemon.species) {
				let mega = dex.getTemplate(item.megaStone);
				if (BANS.pokemon.includes(mega.species) || BANS.tiers.includes(mega.tier)) {
					msg.push((BANS.pokemon.includes(mega.species) ? `${mega.name} is banned.` : `${mega.name} is in ${mega.tier} which is banned.`));
					this.item = "";
				}
			}
		}
		// Level, Symbol, Shiny, Gender, and Happiness
		if (this.level < 1 || this.level > 100) {
			this.level = (this.level < 0 ? 0 : 100);
			msg.push(`${pokemon.species}'s level was invalid.`);
		}
		if (this.symbol !== " " && !this.cSymbol) this.symbol = " ";
		if (this.shiny && !this.canShiny) this.shiny = false;
		if (!["M", "F", "N", "random"].includes(this.gender)) this.gender = "random";
		if (this.happiness < 0 || this.happiness > 255) {
			this.happiness = (this.happiness < 0 ? 0 : 255);
			msg.push(`${pokemon.species}'s happiness was invalid.`);
		}
		// Moves
		if (this.movepool.length) {
			for (let i = 0; i < this.movepool.length; i++) {
				let move = dex.getMove(this.movepool[i]);
				if (!move.exists) {
					msg.push(`The move "${move.id}" does not exist.`);
					this.movepool.splice(i, 1);
					i--;
					continue;
				}
				let result = await TeamValidatorAsync("gen7ou").validateTeam(Dex.packTeam([{species: this.species, moves: [move]}]));
				if (result.startsWith("0")) {
					result = result.slice(1);
					msg.push(result.split("\n"));
					this.movepool.splice(i, 1);
					i--;
					continue;
				}
				if (BANS.moves.includes(move.name) || move.ohko) {
					msg.push(`The move "${move.name}" is banned from SSBFFA.`);
					this.movepool.splice(i, 1);
					i--;
					continue;
				}
			}
		}
		// Custom move
		if (this.cMove) {
			let move = dex.getMove(this.cMove);
			if (!move.exists || Dex.getMove(move.name).exists) {
				msg.push(`${move.name} is not a custom move.`);
				this.cMove = "";
			} else if (!customMovepool.includes(move.name)) {
				// Purchased custom move
				if (this.selfCustomMove !== move.name) {
					msg.push(`${pokemon.species}'s custom move "${move.name}" is not your custom move.`);
					this.cMove = "";
				}
			}
		}
		// EVs
		let edited = false;
		let totalEvs = 0;
		for (let ev in this.evs) {
			if (this.evs[ev] < 0 || this.evs[ev] > 252) {
				this.evs[ev] = (this.evs[ev] < 0 ? 0 : 252);
				edited = true;
			}
			totalEvs += this.evs[ev];
		}
		if (totalEvs > 510) msg.push(`${pokemon.species} has more than 510 EVs.`);
		if (edited) msg.push(`${pokemon.species}'s EVs were invalid.`);
		edited = false;
		// IVs
		for (let iv in this.ivs) {
			if (this.ivs[iv] < 0 || this.ivs[iv] > 31) {
				this.ivs[iv] = (this.ivs[iv] < 0 ? 0 : 31);
				edited = true;
			}
		}
		if (edited) msg.push(`${pokemon.species}'s IVs were invalid.`);
		if (msg.length) {
			this.active = false;
			if (Users.get(toID(this.name))) Users.get(toID(this.name)).popup(`Your SSBFFA Pokemon was deactivated for the following reasons:\n${msg.join("\n")}`);
			if (!quiet) self.errorReply(`Done! ${this.name}'s SSBFFA Pokemon was deactivated, and its invalid parts were reset to their defaults.`);
		} else {
			if (!quiet) self.sendReply(`Done! ${this.name}'s SSBFFA Pokemon is valid.`);
		}
		writeSSB();
		return msg;
	}
}

//Load JSON
try {
	FS("config/chat-plugins/ssb.json").readIfExistsSync();
} catch (e) {
	FS("config/chat-plugins/ssb.json").write("{}", function (err) {
		if (err) {
			console.error(`Error while loading SSBFFA: ${err}`);
			ssbWrite = false;
		} else {
			console.log("config/chat-plugins/ssb.json not found, creating a new one...");
		}
	});
	noRead = true;
}

//We need to load data after the SSB class is declared.
try {
	Server.ssb = global.ssb = {};
	Server.ssb = FS("config/chat-plugins/ssb.json").readIfExistsSync();
	if (!Server.ssb) {
		FS("config/chat-plugins/ssb.json").write("{}");
		Server.ssb = {};
	} else {
		Server.ssb = JSON.parse(Server.ssb);
	}
} catch (e) {
	if (e.code !== "ENOENT") throw e;
}

exports.commands = {
	ssbffa: "ssb",
	ssb: {
		edit: {
			"": "main",
			main(target, room, user, connection, cmd, message) {
				if (!user.named) return this.errorReply("You must choose a name first.");
				if (user.locked) return this.errorReply("You cannot edit your SSB Pokemon while locked.");
				if (!Server.ssb[user.userid]) {
					this.sendReply("Could not find your SSB Pokemon, creating a new one...");
					Server.ssb[user.userid] = new SSB(user.userid, user.name);
					writeSSB();
				}
				let targetUser = Server.ssb[user.userid];
				targetUser.updateName(user.name);
				if (cmd === "") {
					return user.sendTo(room, `|uhtml|ssb${user.userid}|${buildMenu(user.userid)}`);
				} else {
					return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${buildMenu(user.userid)}`);
				}
			},

			speciesq: "species",
			species(target, room, user, connection, cmd, message) {
				if (!user.named) return this.errorReply("You must choose a name first.");
				if (user.locked) return this.errorReply("You cannot edit your SSB Pokemon while locked.");
				if (!Server.ssb[user.userid]) {
					this.sendReply("Could not find your SSB Pokemon, creating a new one...");
					Server.ssb[user.userid] = new SSB(user.userid, user.name);
					writeSSB();
				}
				let targetUser = Server.ssb[user.userid];
				if (toID(target) === "") return this.sendReply("/ssb edit species [species] - change the species of your SSB Pokemon.");
				let active = targetUser.active;
				if (!targetUser.setSpecies(target)) {
					return this.errorReply(`The Pokemon "${target}" does not exist or is banned from SSBFFA. Check your spelling?`);
				} else {
					writeSSB();
					if (active) this.sendReply("Your Pokemon was deactivated because it now has 0 moves.");
					if (cmd !== "speciesq") this.sendReply(`Your Pokemon was set as a ${targetUser.species}`);
					return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${buildMenu(user.userid)}`);
				}
			},

			moveq: "move",
			move(target, room, user, connection, cmd, message) {
				if (!user.named) return this.errorReply("You must choose a name first.");
				if (user.locked) return this.errorReply("You cannot edit your SSB Pokemon while locked.");
				if (!Server.ssb[user.userid]) {
					this.sendReply("Could not find your SSB Pokemon, creating a new one...");
					Server.ssb[user.userid] = new SSB(user.userid, user.name);
					writeSSB();
				}
				let targetUser = Server.ssb[user.userid];
				target = target.split(",");
				if (!toID(target[0])) return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${moveMenu(user.userid)}`);
				if (toID(target[0]) === "help") return this.sendReply("/ssb edit move [set|remove|custom], [move name] - Set or remove moves. Maximum of 4 moves (3 regular + 1 custom OR 4 regular).");
				switch (target[0]) {
				case "set":
					//set a normal move
					return targetUser.addMove(target[1], this);
				case "remove":
					//remove a move
					if (targetUser.removeMove(target[1])) {
						writeSSB();
						if (cmd !== "moveq") this.sendReply(`Removed the move ${target[1]} from your movepool.`);
						if (targetUser.movepool.length === 0 && !targetUser.cMove && targetUser.active) {
							targetUser.active = false;
							this.sendReply(`Your Pokemon was deactivated because it now has 0 moves.`);
						}
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${buildMenu(user.userid)}`);
					} else {
						return this.errorReply(`You do not have the move ${target[1]} in your movepool, or set as your custom move.`);
					}
				case "custom":
					//set the custom move
					if (targetUser.setCustomMove(target[1])) {
						writeSSB();
						if (cmd !== "moveq") this.sendReply(`Your custom move has been set to ${target[1]}.`);
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${buildMenu(user.userid)}`);
					} else {
						return this.errorReply(`${target[1]} is either not a custom move, or not a custom move you can use.`);
					}
				default:
					return this.sendReply("/ssb edit move [set|custom], movename. Or use /ssb edit move to access the move menu.");
				}
			},

			statsq: "stats",
			stats(target, room, user, connection, cmd, message) {
				if (!user.named) return this.errorReply("You must choose a name first.");
				if (user.locked) return this.errorReply("You cannot edit your SSB Pokemon while locked.");
				if (!Server.ssb[user.userid]) {
					this.sendReply("Could not find your SSB Pokemon, creating a new one...");
					Server.ssb[user.userid] = new SSB(user.userid, user.name);
					writeSSB();
				}
				let targetUser = Server.ssb[user.userid];
				//temp
				if (toID(target) === "") return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${statMenu(user.userid)}`);
				if (toID(target) === "help") return this.sendReply(`/ssb edit stats [ev|iv|nature], [stat|nature], (value) - Set your Pokemon's EVs, IVs, or nature.`);
				if (toID(target) === "naturehelp") return this.sendReply(`/ssb edit stats nature, [nature] - Set your Pokemon's nature.`);
				target = target.split(",");
				if (!target[1] && !target[2]) return this.sendReply(`/ssb edit stats [ev|iv|nature], [stat|nature], (value) - Set your Pokemon's EVs, IVs, or nature.`);
				switch (toID(target[1])) {
				case "healthpoints":
					target[1] = "hp";
					break;
				case "attack":
					target[1] = "atk";
					break;
				case "defense":
					target[1] = "def";
					break;
				case "specialattack":
					target[1] = "spa";
					break;
				case "specialdefense":
					target[1] = "spd";
					break;
				case "speed":
					target[1] = "spe";
					break;
				}
				switch (toID(target[0])) {
				case "ev":
				case "evs":
					if (!target[2]) return this.sendReply(`/ssb edit stats [ev|iv|nature], [stat|nature], (value) - Set your Pokemon's EVs, IVs, or nature.`);
					if (targetUser.setEvs(target[1], target[2])) {
						writeSSB();
						if (cmd !== "statsq") this.sendReply(`${target[1]} EV was set to ${target[2]}.`);
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${statMenu(user.userid)}`);
					} else {
						return this.errorReply(`Unable to set ${target[1]} EV to ${target[2]}. Check to make sure your EVs don't exceed 510 total.`);
					}
				case "iv":
				case "ivs":
					if (!target[2]) return this.sendReply(`/ssb edit stats [ev|iv|nature], [stat|nature], (value) - Set your Pokemon's EVs, IVs, or nature.`);
					if (targetUser.setIvs(target[1], target[2])) {
						writeSSB();
						if (cmd !== "statsq") this.sendReply(`${target[1]} IV was set to ${target[2]}.`);
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${statMenu(user.userid)}`);
					} else {
						return this.errorReply("Make sure your IVs are between 0 and 31 and that you spelled the stat name correctly.");
					}
				case "nature":
					if (targetUser.setNature(target[1])) {
						writeSSB();
						if (cmd !== "statsq") this.sendReply(`Your Pokemon's nature was set to ${target[1]}.`);
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${statMenu(user.userid)}`);
					} else {
						return this.errorReply(`${target[1]} is not a valid nature.`);
					}
				default:
					return this.sendReply(`/ssb edit stats [ev|iv|nature], [stat|nature], (value) - Set your Pokemon's EVs, IVs, or nature.`);
				}
			},

			abilityq: "ability",
			ability(target, room, user, connection, cmd, message) {
				if (!user.named) return this.errorReply("You must choose a name first.");
				if (user.locked) return this.errorReply("You cannot edit your SSB Pokemon while locked.");
				if (!Server.ssb[user.userid]) {
					this.sendReply("Could not find your SSB Pokemon, creating a new one...");
					Server.ssb[user.userid] = new SSB(user.userid, user.name);
					writeSSB();
				}
				let targetUser = Server.ssb[user.userid];
				if (toID(target) === "") return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${abilityMenu(user.userid)}`);
				if (toID(target) === "help") return this.sendReply(`/ssb edit ability [ability] - Set your Pokemon's ability.`);
				if (targetUser.setAbility(target)) {
					writeSSB();
					if (cmd !== "abilityq") this.sendReply(`Your Pokemon's ability is now ${target}.`);
					return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${buildMenu(user.userid)}`);
				} else {
					this.errorReply(`${target} could not be set as your Pokemon's ability because it is not a legal ability for ${targetUser.species}, and it is not your custom ability.`);
				}
			},

			itemq: "item",
			item(target, room, user, connection, cmd, message) {
				if (!user.named) return this.errorReply("You must choose a name first.");
				if (user.locked) return this.errorReply("You cannot edit your SSB Pokemon while locked.");
				if (!Server.ssb[user.userid]) {
					this.sendReply("Could not find your SSB Pokemon, creating a new one...");
					Server.ssb[user.userid] = new SSB(user.userid, user.name);
					writeSSB();
				}
				let targetUser = Server.ssb[user.userid];
				if (toID(target) === "") return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${itemMenu(user.userid)}`);
				if (toID(target) === "help") return this.sendReply(`/ssb edit item [item] - Sets your Pokemon's item.`);
				if (toID(target) === "reset") {
					targetUser.item = false;
					writeSSB();
					if (cmd !== "itemq") this.sendReply("Your item was reset.");
					return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${buildMenu(user.userid)}`);
				}
				if (!targetUser.setItem(target)) {
					return this.errorReply(`The item "${target}" does not exist or is banned from SSBFFA.`);
				} else {
					writeSSB();
					if (cmd !== "itemq") return this.sendReply(`Your Pokemon's item was set to ${target}.`);
					return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${buildMenu(user.userid)}`);
				}
			},

			detailsq: "details",
			details(target, room, user, connection, cmd, message) {
				if (!user.named) return this.errorReply("You must choose a name first.");
				if (user.locked) return this.errorReply("You cannot edit your SSB Pokemon while locked.");
				if (!Server.ssb[user.userid]) {
					this.sendReply("Could not find your SSB Pokemon, creating a new one...");
					Server.ssb[user.userid] = new SSB(user.userid, user.name);
					writeSSB();
				}
				let targetUser = Server.ssb[user.userid];
				if (toID(target) === "") return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${detailMenu(user.userid)}`);
				if (toID(target) === "help") return this.sendReply(`/ssb edit details [level|gender|happiness|shiny], (argument) - edit your Pokemon's details.`);
				target = target.split(",");
				switch (toID(target[0])) {
				case "level":
				case "lvl":
					if (!target[1]) return this.parse(`/ssb edit details help`);
					if (targetUser.setLevel(target[1])) {
						writeSSB();
						if (cmd !== "detailsq") this.sendReply(`Your Pokemon's level was set to ${target[1]}.`);
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${detailMenu(user.userid)}`);
					} else {
						return this.errorReply("Levels must be greater than or equal to 1, and less than or equal to 100.");
					}
				case "gender":
					if (!target[1]) return this.parse(`/ssb edit details help`);
					if (targetUser.setGender(target[1])) {
						writeSSB();
						if (cmd !== "detailsq") this.sendReply(`Your Pokemon's gender was set to ${target[1]}.`);
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${detailMenu(user.userid)}`);
					} else {
						return this.errorReply("Valid Pokemon genders are: Male, Female, random, and genderless.");
					}
				case "happiness":
				case "happy":
					if (!target[1]) return this.parse(`/ssb edit details help`);
					if (targetUser.setHappiness(target[1])) {
						writeSSB();
						if (cmd !== "detailsq") this.sendReply(`Your Pokemon's happiness level was set to ${target[1]}.`);
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${detailMenu(user.userid)}`);
					} else {
						return this.errorReply("Happiness levels must be greater than or equal to 0, and less than or equal to 255.");
					}
				case "shinyness":
				case "shiny":
					if (targetUser.setShiny()) {
						writeSSB();
						if (cmd !== "detailsq") this.sendReply(`Your Pokemon's shinyness was toggled.`);
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${buildMenu(user.userid)}`);
					} else {
						return this.errorReply("You must purchase this from the shop first!");
					}
				case "symbol":
				case "csymbol":
				case "customsymbol":
					if (!target[1]) return this.sendReply(`/ssb edit details symbol, [symbol] - Change your Pokemon's custom symbol, global auth can use auth symbols of equal or lower ranks.`);
					if (targetUser.setSymbol(target[1])) {
						writeSSB();
						if (cmd !== "detailsq") this.sendReply(`Your symbol is now ${target[1]}.`);
						return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${detailMenu(user.userid)}`);
					} else {
						return this.errorReply("Unable to set your custom symbol. Be sure your not using an illegal staff symbol.");
					}
				default:
					return this.sendReply(`/ssb edit details [level|gender|happiness|shiny], (argument) - edit your Pokemon's details.`);
				}
			},
		},

		toggle(target, room, user, connection, cmd, message) {
			if (!user.named) return this.errorReply("You must choose a name first.");
			if (user.locked) return this.errorReply("You cannot edit your SSB Pokemon while locked.");
			if (!Server.ssb[user.userid]) {
				this.sendReply("Could not find your SSB Pokemon, creating a new one...");
				Server.ssb[user.userid] = new SSB(user.userid, user.name);
				writeSSB();
				return this.sendReply("Your new SSB Pokemon is not active, you should edit it before activating.");
			}
			Server.ssb[user.userid].activate(this);
		},

		custommoves: "custom",
		cmoves: "custom",
		custom(target, room, user, connection, cmd, message) {
			if (!user.named) return this.errorReply("You must choose a name first.");
			if (user.locked) return this.errorReply("You cannot edit your SSB Pokemon while locked.");
			if (!Server.ssb[user.userid]) {
				this.sendReply("Could not find your SSB Pokemon, creating a new one...");
				Server.ssb[user.userid] = new SSB(user.userid, user.name);
				writeSSB();
			}
			return user.sendTo(room, `|uhtmlchange|ssb${user.userid}|${customMenu()}`);
		},

		log(target, room, user, connection, cmd, message) {
			if (!target) target = (user.can("ssbffa") ? `view, all` : `view, ${user.userid}`);
			target = target.split(",");
			switch (target[0]) {
			case "view":
				if (!target[1]) target[1] = (user.can("ssbffa") ? "all" : user.userid);
				if (toID(target[1]) !== user.userid && !user.can("ssbffa")) return this.errorReply("You can only view your own SSBFFA purchases.");
				let output = `<div style="max-height: 300px; overflow: scroll; width: 100%"><table><tr><th style="border: 1px solid black">Name</th><th style="border: 1px solid black">Item</th><th style="border: 1px solid black">Status</th>`;
				if (toID(target[1]) === "all") {
					output += `<th style="border: 1px solid black">Options</th><tr/>`;
					for (let i in Server.ssb) {
						for (let j in Server.ssb[i].bought) {
							let buttons = `<button class="button" name="send" value="/ssb log mark, ${Server.ssb[i].userid}, ${j}, complete">Mark as Complete</button><button class="button" name="send" value="/ssb log mark, ${Server.ssb[i].userid}, ${j}, pending">Mark as Pending</button><button class="button" name="send" value="/ssb log mark, ${Server.ssb[i].userid}, ${j}, remove"><span style="color: red">Remove this purchase</span</button>`;
							output += `<tr><td style="border: 1px solid black">${Server.ssb[i].name}</td><td style="border: 1px solid black">${j}</td><td style="border: 1px solid black">${(Server.ssb[i].bought[j] ? (Server.ssb[i].bought[j] === `complete` ? `Complete` : `Pending`) : `Removed`)}</td><td style="border: 1px solid black">${buttons}</td></tr>`;
						}
					}
				} else {
					target[1] = toID(target[1]);
					if (!Server.ssb[target[1]]) return this.errorReply(`${target[1]} does not have a SSBFFA Pokemon yet.`);
					if (user.can("ssbffa")) {
						output += `<th style="border: 1px solid black">Options</th><tr/>`;
						for (let j in Server.ssb[target[1]].bought) {
							let buttons = `<button class="button" name="send" value="/ssb log mark, ${Server.ssb[target[1]].userid}, ${j}, complete">Mark as Complete</button><button class="button" name="send" value="/ssb log mark, ${Server.ssb[target[1]].userid}, ${j}, pending">Mark as Pending</button><button class="button" name="send" value="/ssb log mark, ${Server.ssb[target[1]].userid}, ${j}, remove"><span style="color:red">Remove this purchase</span</button>`;
							output += `<tr><td style="border: 1px solid black">${Server.ssb[target[1]].name}</td><td style="border: 1px solid black">${j}</td><td style="border: 1px solid black">${(Server.ssb[target[1]].bought[j] ? (Server.ssb[target[1]].bought[j] === `complete` ? `Complete` : `Pending`) : `Removed`)}</td><td style="border: 1px solid black">${buttons}</td></tr>`;
						}
					} else {
						output += `</tr>`;
						for (let j in Server.ssb[target[1]].bought) {
							output += `<tr><td style="border: 1px solid black">${Server.ssb[target[1]].name}</td><td style="border: 1px solid black">${j}</td><td style="border: 1px solid black">${(Server.ssb[target[1]].bought[j] ? (Server.ssb[target[1]].bought[j] === `complete` ? `Complete` : `Pending`) : `Removed`)}</td></tr>`;
						}
					}
				}
				return this.sendReplyBox(output);
			case "mark":
				if (!user.can("ssbffa")) return this.errorReply(`/ssb mark - Access Denied.`);
				if (!target[3]) return this.parse("/help ssb log");
				target[1] = toID(target[1]);
				target[2] = target[2].trim();
				target[3] = toID(target[3]);
				if (!Server.ssb[target[1]]) return this.errorReply(`${target[1]} does not have a SSBFFA Pokemon yet.`);
				if (Server.ssb[target[1]].bought[target[2]] === undefined) return this.parse("/help ssb log");
				switch (target[3]) {
				case "complete":
					if (Server.ssb[target[1]].bought[target[2]] === target[3]) return this.errorReply(`${target[1]}'s ${target[2]} is already ${target[3]}`);
					Server.ssb[target[1]].bought[target[2]] = "complete";
					writeSSB();
					return this.sendReply(`${target[1]}'s ${target[2]} was marked as complete.`);
				case "pending":
					if (Server.ssb[target[1]].bought[target[2]] === true) return this.errorReply(`${target[1]}'s ${target[2]} is already ${target[3]}.`);
					Server.ssb[target[1]].bought[target[2]] = true;
					writeSSB();
					return this.sendReply(`${target[1]}'s ${target[2]} was marked as pending.`);
				case "remove":
					if (Server.ssb[target[1]].bought[target[2]] === false) return this.errorReply(`${target[1]}'s ${target[2]} is already removed.`);
					if (!target[4] || toID(target[4]) !== "force") return this.sendReply(`WARNING. If you remove this purchase the user will not be able to use their ${target[2]} and the user will not be refunded (unless you provide it). If you are sure you want to do this, run: /ssb log mark, ${target[1]}, ${target[2]}, ${target[3]}, force`);
					Server.ssb[target[1]].bought[target[2]] = false;
					writeSSB();
					return this.sendReply(`${target[1]}'s ${target[2]} was removed.`);
				default:
					return this.parse("/help ssb log");
				}
			default:
				return this.parse("/help ssb log");
			}
		},
		loghelp: [
			`/ssb log - Accepts the following commands:
			/ssb log view, [all|user] - View the purchases of a user or all user's. Requires &, ~ unless viewing your own.
			/ssb log mark, [user], [cItem|cAbility|cMove], [complete|pending|remove] - Update the status for a user's SSBFFA purchase. Requires &, ~.`,
		],

		forceupdate: "validate",
		validateall: "validate",
		validate(target, room, user, connection, cmd, message) {
			if (!this.can("ssbffa")) return;
			if (!target && toID(cmd) !== "validateall") return this.parse("/help ssb validate");
			let targetUser = Server.ssb[toID(target)];
			if (!targetUser && toID(cmd) !== "validateall") return this.errorReply(`${target} does not have a SSBFFA Pokemon yet.`);
			//Start validation.
			if (toID(cmd) !== "validateall") {
				this.sendReply(`Validating ${targetUser.name}'s SSBFFA Pokemon...`);
				targetUser.validate(this);
			} else {
				for (let key in Server.ssb) {
					Server.ssb[key].validate(this, true);
				}
				return this.sendReply("All SSBFFA Pokemon have been validated.");
			}
		},
		validatehelp: [`/ssb validate [user] - Validate a user's SSBFFA Pokemon and if anything invalid is found, set it to its default value. Requires: &, ~.`],

		setcustommove: "setcmove",
		givemove: "setcmove",
		setmove: "setcmove",
		setcmove(target, room, user, connection, message) {
			if (!this.can("ssbffa")) return false;
			if (!target) return this.parse("/help ssb setcmove");
			let targets = target.split(",");
			let userid = toID(targets[0]);
			if (!userid) return this.parse("/help ssb setcmove");
			let customMove = Dex.mod("ssbffa").getMove(targets[1]);
			if (!customMove) return this.errorReply("Must include a move!");
			if (!customMove.exists) return this.errorReply("Move doesn't exist in the SSBFFA mod!");
			if (!Server.ssb[userid].bought.cMove) return this.errorReply("They have not bought a custom move!");
			Server.ssb[userid].selfCustomMove = customMove.name;
			writeSSB();
			return this.sendReply(`Move set for ${userid}!`);
		},
		setcmovehelp: [`/ssb setcmove [user], [move]`],

		setcustomability: "setcability",
		giveability: "setcability",
		setability: "setcability",
		setcability(target, room, user, connection, message) {
			if (!this.can("ssbffa")) return false;
			if (!target) return this.parse("/help ssb setcability");
			let targets = target.split(",");
			let userid = toID(targets[0]);
			if (!userid) return this.errorReply("/help ssb setcability");
			let customAbility = Dex.mod("ssbffa").getAbility(targets[1]);
			if (!customAbility) return this.errorReply(`/ssb giveability [target], [ability]`);
			if (!customAbility.exists) return this.errorReply("Ability doesn't exist in the SSBFFA mod!");
			if (!Server.ssb[userid].bought.cAbility) return this.errorReply("They have not bought a custom ability!");
			Server.ssb[userid].cAbility = customAbility.name;
			writeSSB();
			return this.sendReply(`Ability set for ${userid}!`);
		},
		setcabilityhelp: [`/ssb setcmove [user], [ability]`],

		setcustomitem: "setcitem",
		giveitem: "setcitem",
		setitem: "setcitem",
		setcitem(target, room, user, connection, cmd, message) {
			if (!this.can("ssbffa")) return false;
			if (!target) return this.parse("/help ssb setcitem");
			let targets = target.split(",");
			let userid = toID(targets[0]);
			if (!userid) return this.errorReply("/help ssb givecitem");
			let item = Dex.mod("ssbffa").getItem(targets[1]);
			if (!item) return this.errorReply("Must include an item.");
			if (!item.exists) return this.errorReply("Item doesn't exist in the SSBFFA mod!");
			if (!Server.ssb[userid].bought.cItem) return this.errorReply("They have not bought a custom item!");
			Server.ssb[userid].cItem = item.name;
			writeSSB();
			return this.sendReply(`Item set for ${userid}!`);
		},
		setcitemhelp: [`/ssb setcitem [user], [item]`],

		"": "start", // just making it easier due to function changes
		start(target, room, user, connection, cmd, message) {
			return this.parse("/help ssb");
		},
	},
	ssbhelp: [
		`/ssb - Commands for editing your custom super staff bros Pokemon. Includes the following commands:
		/ssb edit - pulls up the general menu, allowing you to edit species and contains buttons to access other menus.
		/ssb edit species - change the Pokemon's species, not a menu.
		/ssb edit move - pulls up the move selection menu, allowing selection of 16 pre-created custom moves (1 per type) and (if purchased) your own custom-made custom move, as well as instructions for selecting normal moves.
		/ssb edit stats - pulls up the stat selection menu, allowing edits of EVs, IVs, and nature.
		/ssb edit ability - pulls up the ability selection menu, showing the Pokemon's legal abilities and (if purchased) your custom ability for you to choose from.
		/ssb edit item - pulls up the item editing menu, giving instructions for setting a normal item, and (if purchased) a button to set your custom item.
		/ssb edit details - pulls up the editing menu for level, gender, (if purchased) shinyness, and (if purchased or if global auth) symbol.
		/ssb toggle - Attempts to active or deactive your Pokemon. Active Pokemon can be seen in the tier. If your Pokemon cannot be activated, you will see a popup explaining why.
		/ssb custom - Shows all the default custom moves, with details.
		/ssb log - Shows purchase details for SSBFFA.
		/ssb [setcmove|setcability|setcitem] [user], [move|ability|item] - Sets the user's custom.
		/ssb [validate|validateall] (user) - validates a user's SSBFFA Pokemon, or validates all SSBFFA Pokemon. If the Pokemon is invalid it will be fixed and deactivated. Requires: &, ~.
		Programmed by HoeenHero.`,
	],
};
