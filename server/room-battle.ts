/**
 * Room Battle
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This file wraps the simulator in an implementation of the RoomGame
 * interface. It also abstracts away the multi-process nature of the
 * simulator.
 *
 * For the actual battle simulation, see sim/
 *
 * @license MIT
 */

import {execSync} from "child_process";
import {FS} from "../lib/fs";
import {StreamProcessManager} from "../lib/process-manager";
import {Repl} from "../lib/repl";
import {BattleStream} from "../sim/battle-stream";
import * as RoomGames from "./room-game";

type ChannelIndex = 0 | 1 | 2 | 3 | 4;
type PlayerIndex = 1 | 2 | 3 | 4;

interface BattleRequestTracker {
	rqid: number;
	request: string;
	// true = user has decided, false = user has yet to decide, 'cantUndo' = waiting on other user (U-turn, faint-switch) or uncancellable (trapping ability)
	isWait: 'cantUndo' | true | false;
	choice: string;
}

/** 5 seconds */
const TICK_TIME = 5;
const SECONDS = 1000;

// Timer constants: In seconds, should be multiple of TICK_TIME
const STARTING_TIME = 150;
const MAX_TURN_TIME = 150;
const STARTING_TIME_CHALLENGE = 300;
const STARTING_GRACE_TIME = 60;
const MAX_TURN_TIME_CHALLENGE = 300;

const DISCONNECTION_TIME = 60;
const DISCONNECTION_BANK_TIME = 300;

// time after a player disabling the timer before they can re-enable it
const TIMER_COOLDOWN = 20 * SECONDS;

export class RoomBattlePlayer extends RoomGames.RoomGamePlayer {
	slot: SideID;
	channelIndex: ChannelIndex;
	request: BattleRequestTracker;
	wantsTie: boolean;
	active: boolean;
	eliminated: boolean;
	/**
	 * Total timer.
	 *
	 * Starts at 210 per player in a ladder battle. Goes down by 5
	 * every tick. Goes up by 10 every turn (with some complications -
	 * see `nextRequest`), capped at starting time. The player loses if
	 * this reaches 0.
	 *
	 * The equivalent of "Your Time" in VGC.
	 *
	 */
	secondsLeft: number;
	/**
	 * Turn timer.
	 *
	 * Set equal to the player's overall timer, but capped at 150
	 * seconds in a ladder battle. Goes down by 5 every tick.
	 * Tracked separately from the overall timer, and the player also
	 * loses if this reaches 0.
	 */
	turnSecondsLeft: number;
	/**
	 * Disconnect timer.
	 * Starts at 60 seconds. While the player is disconnected, this
	 * will go down by 5 every tick. Tracked separately from the
	 * overall timer, and the player also loses if this reaches 0.
	 *
	 * Mostly exists so impatient players don't have to wait the full
	 * 150 seconds against a disconnected opponent.
 	*/
	dcSecondsLeft: number;
	/**
	 * Used to track a user's last known connection status, and display
	 * the proper message when it changes.
	 */
	connected: boolean;
	constructor(user: User | string | null, game: RoomBattle, num: PlayerIndex) {
		super(user, game, num);
		if (typeof user === 'string') user = null;

		this.slot = `p${num}` as SideID;
		this.channelIndex = (game.gameType === 'multi' && num > 2 ? num - 2 : num) as ChannelIndex;

		this.request = {rqid: 0, request: '', isWait: 'cantUndo', choice: ''};
		this.wantsTie = false;
		this.active = true;
		this.eliminated = false;

		this.secondsLeft = 1;
		this.turnSecondsLeft = 1;
		this.dcSecondsLeft = 1;

		this.connected = true;

		if (user) {
			user.games.add(this.game.id);
			user.updateSearch();
			for (const connection of user.connections) {
				if (connection.inRooms.has(game.id)) {
					Sockets.channelMove(connection.worker, this.game.id, this.channelIndex, connection.socketid);
				}
			}
		}
	}
	getUser() {
		return (this.userid && Users.get(this.userid)) || null;
	}
	unlinkUser() {
		const user = this.getUser();
		if (user) {
			for (const connection of user.connections) {
				Sockets.channelMove(connection.worker, this.game.id, 0, connection.socketid);
			}
			user.games.delete(this.game.id);
			user.updateSearch();
		}
		this.connected = false;
		this.active = false;
	}
	updateChannel(user: User | Connection) {
		if (user instanceof Users.Connection) {
			// "user" is actually a connection
			Sockets.channelMove(user.worker, this.game.id, this.channelIndex, user.socketid);
			return;
		}
		for (const connection of user.connections) {
			Sockets.channelMove(connection.worker, this.game.id, this.channelIndex, connection.socketid);
		}
	}

	toString() {
		return this.userid;
	}
	send(data: string) {
		const user = this.getUser();
		if (user) user.send(data);
	}
	sendRoom(data: string) {
		const user = this.getUser();
		if (user) user.sendTo(this.game.id, data);
	}
}

export class RoomBattleTimer {
	battle: RoomBattle;
	timer: NodeJS.Timer | null;
	timerRequesters: Set<ID>;
	isFirstTurn: boolean;
	/**
	 * Last tick, as milliseconds since UNIX epoch.
	 * Represents the last time a tick happened.
	 */
	lastTick: number;
	/** Debug mode; true to output detailed timer info every tick */
	debug: boolean;
	lastDisabledTime: number;
	lastDisabledByUser: null | ID;
	settings: GameTimerSettings;
	constructor(battle: RoomBattle) {
		this.battle = battle;

		this.timer = null;
		this.timerRequesters = new Set();
		this.isFirstTurn = true;

		this.lastTick = 0;

		this.debug = false;

		this.lastDisabledTime = 0;
		this.lastDisabledByUser = null;

		const hasLongTurns = Dex.getFormat(battle.format, true).gameType !== 'singles';
		const isChallenge = (!battle.rated && !battle.room.tour);
		const timerEntry = Dex.getRuleTable(Dex.getFormat(battle.format, true)).timer;
		const timerSettings = timerEntry && timerEntry[0];

		// so that Object.assign doesn't overwrite anything with `undefined`
		for (const k in timerSettings) {
			// @ts-ignore
			if (timerSettings[k] === undefined) delete timerSettings[k];
		}

		this.settings = Object.assign({
			dcTimer: !isChallenge,
			dcTimerBank: isChallenge,
			starting: isChallenge ? STARTING_TIME_CHALLENGE : STARTING_TIME,
			grace: STARTING_GRACE_TIME,
			addPerTurn: hasLongTurns ? 25 : 10,
			maxPerTurn: isChallenge ? MAX_TURN_TIME_CHALLENGE : MAX_TURN_TIME,
			maxFirstTurn: isChallenge ? MAX_TURN_TIME_CHALLENGE : MAX_TURN_TIME,
			timeoutAutoChoose: false,
			accelerate: !timerSettings,
		}, timerSettings);
		if (this.settings.maxPerTurn <= 0) this.settings.maxPerTurn = Infinity;

		for (const player of this.battle.players) {
			player.secondsLeft = this.settings.starting + this.settings.grace;
			player.turnSecondsLeft = -1;
			player.dcSecondsLeft = this.settings.dcTimerBank ? DISCONNECTION_BANK_TIME : DISCONNECTION_TIME;
		}
	}
	start(requester?: User) {
		const userid = requester ? requester.userid : 'staff' as ID;
		if (this.timerRequesters.has(userid)) return false;
		if (this.timer) {
			this.battle.room.add(`|inactive|${requester ? requester.name : userid} also wants the timer to be on.`).update();
			this.timerRequesters.add(userid);
			return false;
		}
		if (requester && this.battle.playerTable[requester.userid] && this.lastDisabledByUser === requester.userid) {
			const remainingCooldownMs = (this.lastDisabledTime || 0) + TIMER_COOLDOWN - Date.now();
			if (remainingCooldownMs > 0) {
				this.battle.playerTable[requester.userid].sendRoom(
					`|inactiveoff|The timer can't be re-enabled so soon after disabling it (${Math.ceil(remainingCooldownMs / SECONDS)} seconds remaining).`
				);
				return false;
			}
		}
		this.timerRequesters.add(userid);
		const requestedBy = requester ? ` (requested by ${requester.name})` : ``;
		this.battle.room.add(`|inactive|Battle timer is ON: inactive players will automatically lose when time's up.${requestedBy}`).update();

		this.nextRequest();
		return true;
	}
	stop(requester: User) {
		if (requester) {
			if (!this.timerRequesters.has(requester.userid)) return false;
			this.timerRequesters.delete(requester.userid);
			this.lastDisabledByUser = requester.userid;
			this.lastDisabledTime = Date.now();
		} else {
			this.timerRequesters.clear();
		}
		if (this.timerRequesters.size) {
			this.battle.room.add(`|inactive|${requester.name} no longer wants the timer on, but the timer is staying on because ${[...this.timerRequesters].join(', ')} still does.`).update();
			return false;
		}
		if (this.end()) {
			this.battle.room.add(`|inactiveoff|Battle timer is now OFF.`).update();
			return true;
		}
		return false;
	}
	end() {
		this.timerRequesters.clear();
		if (!this.timer) return false;
		clearTimeout(this.timer);
		this.timer = null;
		return true;
	}
	nextRequest() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		if (!this.timerRequesters.size) return;
		const players = this.battle.players;
		if (players.some(player => player.secondsLeft <= 0)) return;

		/** false = U-turn or single faint, true = "new turn" */
		let isFull = true;
		let isEmpty = true;
		for (const player of players) {
			if (player.request.isWait) isFull = false;
			if (player.request.isWait !== 'cantUndo') isEmpty = false;
		}
		if (isEmpty) {
			// there are no active requests
			return;
		}
		const isFirst = this.isFirstTurn;
		this.isFirstTurn = false;

		const maxTurnTime = (isFirst ? this.settings.maxFirstTurn : 0) || this.settings.maxPerTurn;

		let addPerTurn = isFirst ? 0 : this.settings.addPerTurn;
		if (this.settings.accelerate && addPerTurn) {
			// after turn 100ish: 15s/turn -> 10s/turn
			if (this.battle.requestCount > 200 && addPerTurn > TICK_TIME) {
				addPerTurn -= TICK_TIME;
			}
			// after turn 200ish: 10s/turn -> 7s/turn
			if (this.battle.requestCount > 400 && Math.floor(this.battle.requestCount / 2) % 2) {
				addPerTurn = 0;
			}
		}

		if (!isFull && addPerTurn > TICK_TIME) {
			addPerTurn = TICK_TIME;
		}

		const room = this.battle.room;
		for (const player of players) {
			if (!isFirst) {
				player.secondsLeft = Math.min(player.secondsLeft + addPerTurn, this.settings.starting);
			}
			player.turnSecondsLeft = Math.min(player.secondsLeft, maxTurnTime);

			const secondsLeft = player.turnSecondsLeft;
			let grace = player.secondsLeft - this.settings.starting;
			if (grace < 0) grace = 0;
			if (player) {
				player.sendRoom(`|inactive|Time left: ${secondsLeft} sec this turn | ${player.secondsLeft - grace} sec total` + (grace ? ` | ${grace} sec grace` : ``));
			}
			if (secondsLeft <= 30 && secondsLeft < this.settings.starting) {
				room.add(`|inactive|${player.name} has ${secondsLeft} seconds left this turn.`);
			}
			if (this.debug) {
				room.add(`||${player.name} | Time left: ${secondsLeft} sec this turn | ${player.secondsLeft} sec total | +${addPerTurn} seconds`);
			}
		}
		room.update();
		this.lastTick = Date.now();
		this.timer = setTimeout(() => this.nextTick(), TICK_TIME * SECONDS);
	}
	nextTick() {
		if (this.timer) clearTimeout(this.timer);
		if (this.battle.ended) return;
		const room = this.battle.room;
		for (const player of this.battle.players) {
			if (player.request.isWait) continue;
			if (player.connected) {
				player.secondsLeft -= TICK_TIME;
				player.turnSecondsLeft -= TICK_TIME;
			} else {
				player.dcSecondsLeft -= TICK_TIME;
				if (!this.settings.dcTimerBank) {
					player.secondsLeft -= TICK_TIME;
					player.turnSecondsLeft -= TICK_TIME;
				}
			}

			const dcSecondsLeft = player.dcSecondsLeft;
			if (dcSecondsLeft <= 0) player.turnSecondsLeft = 0;
			const secondsLeft = player.turnSecondsLeft;
			if (!secondsLeft) continue;

			if (!player.connected && (dcSecondsLeft <= secondsLeft || this.settings.dcTimerBank)) {
				// dc timer is shown only if it's lower than turn timer or you're in timer bank mode
				if (dcSecondsLeft % 30 === 0 || dcSecondsLeft <= 20) {
					room.add(`|inactive|${player.name} has ${dcSecondsLeft} seconds to reconnect!`);
				}
			} else {
				// regular turn timer shown
				if (secondsLeft % 30 === 0 || secondsLeft <= 20) {
					room.add(`|inactive|${player.name} has ${secondsLeft} seconds left.`);
				}
			}
			if (this.debug) {
				room.add(`||[${player.name} has ${player.turnSecondsLeft}s this turn / ${player.secondsLeft}s total]`);
			}
		}
		room.update();
		if (!this.checkTimeout()) {
			this.timer = setTimeout(() => this.nextTick(), TICK_TIME * 1000);
		}
	}
	checkActivity() {
		if (this.battle.ended) return;
		for (const player of this.battle.players) {
			const isConnected = !!(player && player.active);

			if (isConnected === player.connected) continue;

			if (!isConnected) {
				// player has disconnected
				player.connected = false;
				if (!this.settings.dcTimerBank) {
					// don't wait longer than 6 ticks (1 minute)
					if (this.settings.dcTimer) {
						player.dcSecondsLeft = DISCONNECTION_TIME;
					} else {
						// arbitrary large number
						player.dcSecondsLeft = DISCONNECTION_TIME * 10;
					}
				}

				if (this.timerRequesters.size) {
					let msg = `!`;

					if (this.settings.dcTimer) {
						msg = ` and has a minute to reconnect!`;
					}
					if (this.settings.dcTimerBank) {
						if (player.dcSecondsLeft > 0) {
							msg = ` and has ${player.dcSecondsLeft} seconds to reconnect!`;
						} else {
							msg = ` and has no disconnection time left!`;
						}
					}
					this.battle.room.add(`|inactive|${player.name} disconnected${msg}`).update();
				}
			} else {
				// player has reconnected
				player.connected = true;
				if (this.timerRequesters.size) {
					let timeLeft = ``;
					if (!player.request.isWait) {
						timeLeft = ` and has ${player.turnSecondsLeft} seconds left`;
					}
					this.battle.room.add(`|inactive|${player.name} reconnected${timeLeft}.`).update();
				}
			}
		}
	}
	checkTimeout() {
		const players = this.battle.players;
		if (players.every(player => player.turnSecondsLeft <= 0)) {
			if (!this.settings.timeoutAutoChoose || players.every(player => player.secondsLeft <= 0)) {
				this.battle.room.add(`|-message|All players are inactive.`).update();
				this.battle.tie();
				return true;
			}
		}
		let didSomething = false;
		for (const player of players) {
			if (player.turnSecondsLeft > 0) continue;
			if (this.settings.timeoutAutoChoose && player.secondsLeft > 0 && player.connected) {
				this.battle.stream.write(`>${player.slot} default`);
				didSomething = true;
			} else {
				this.battle.forfeitPlayer(player, ' lost due to inactivity.');
				return true;
			}
		}
		return didSomething;
	}
}

export class RoomBattle extends RoomGames.RoomGame {
	gameid: ID;
	room: GameRoom;
	title: string;
	allowRenames: boolean;
	format: string;
	gameType: string | undefined;
	/**
	 * The lower player's rating, for searching purposes.
	 * 0 for unrated battles. 1 for unknown ratings.
	 */
	rated: number;
	missingBattleStartMessage: boolean;
	started: boolean;
	ended: boolean;
	active: boolean;
	replaySaved: boolean;
	playerTable: {[userid: string]: RoomBattlePlayer};
	players: RoomBattlePlayer[];
	p1: RoomBattlePlayer;
	p2: RoomBattlePlayer;
	p3: RoomBattlePlayer;
	p4: RoomBattlePlayer;
	/**
	 * userid that requested extraction -> playerids that accepted the extraction
	 */
	allowExtraction: {[k: string]: Set<ID>};
	logData: AnyObject | null;
	endType: string;
	/**
	 * If the battle is ended: an array of the number of Pokemon left for each side.
	 */
	score: number[] | null;
	inputLog: string | null;
	turn: number;
	rqid: number;
	requestCount: number;
	stream: Streams.ObjectReadWriteStream<string>;
	timer: RoomBattleTimer;
	constructor(room: GameRoom, formatid: string, options: AnyObject) {
		super(room);
		const format = Dex.getFormat(formatid, true);
		this.gameid = 'battle' as ID;
		this.room = room;
		this.title = format.name;
		if (!this.title.endsWith(" Battle")) this.title += " Battle";
		this.allowRenames = options.allowRenames !== undefined ? !!options.allowRenames : (!options.rated && !options.tour);

		this.format = formatid;
		this.gameType = format.gameType;
		this.rated = options.rated || 0;
		// true when onCreateBattleRoom has been called
		this.missingBattleStartMessage = !!options.inputLog;
		this.started = false;
		this.ended = false;
		this.active = false;
		this.replaySaved = false;

		// TypeScript bug: no `T extends RoomGamePlayer`
		this.playerTable = Object.create(null);
		// TypeScript bug: no `T extends RoomGamePlayer`
		this.players = [];

		this.playerCap = this.gameType === 'multi' || this.gameType === 'free-for-all' ? 4 : 2;
		this.p1 = null!;
		this.p2 = null!;
		this.p3 = null!;
		this.p4 = null!;

		// data to be logged
		this.allowExtraction = {};

		this.logData = null;
		this.endType = 'normal';
		this.score = null;
		this.inputLog = null;
		this.turn = 0;

		this.rqid = 1;
		this.requestCount = 0;

		this.stream = PM.createStream();

		let ratedMessage = '';
		if (options.ratedMessage) {
			ratedMessage = options.ratedMessage;
		}
		if (this.rated) {
			ratedMessage = 'Rated battle';
		} else if (this.room.tour) {
			ratedMessage = 'Tournament battle';
		}

		this.room.battle = this;

		const battleOptions = {
			formatid: this.format,
			id: this.id,
			rated: ratedMessage,
			seed: options.seed,
		};
		if (options.inputLog) {
			this.stream.write(options.inputLog);
		} else {
			this.stream.write(`>start ` + JSON.stringify(battleOptions));
		}

		// tslint:disable-next-line: no-floating-promises
		this.listen();

		this.addPlayer(options.p1, options.p1team || '', options.p1rating);
		this.addPlayer(options.p2, options.p2team || '', options.p2rating);
		if (this.playerCap > 2) {
			this.addPlayer(options.p3, options.p3team || '', options.p3rating);
			this.addPlayer(options.p4, options.p4team || '', options.p4rating);
		}
		this.timer = new RoomBattleTimer(this);
		if (Config.forcetimer) this.timer.start();
		this.start();
	}

	checkActive() {
		let active = true;
		if (this.ended || !this.started) {
			active = false;
		} else if (!this.p1 || !this.p1.active) {
			active = false;
		} else if (!this.p2 || !this.p2.active) {
			active = false;
		} else if (this.playerCap > 2) {
			if (!this.p3 || !this.p3.active) {
				active = false;
			} else if (!this.p4 || !this.p4.active) {
				active = false;
			}
		}
		Rooms.global.battleCount += (active ? 1 : 0) - (this.active ? 1 : 0);
		this.room.active = active;
		this.active = active;
		if (Rooms.global.battleCount === 0) Rooms.global.automaticKillRequest();
	}
	choose(user: User, data: string) {
		const player = this.playerTable[user.userid];
		const [choice, rqid] = data.split('|', 2);
		if (!player) return;
		const request = player.request;
		if (request.isWait !== false && request.isWait !== true) {
			player.sendRoom(`|error|[Invalid choice] There's nothing to choose`);
			return;
		}
		const allPlayersWait = this.players.every(p => !!p.request.isWait);
		if (allPlayersWait || // too late
			(rqid && rqid !== '' + request.rqid)) { // WAY too late
			player.sendRoom(`|error|[Invalid choice] Sorry, too late to make a different move; the next turn has already started`);
			return;
		}
		user.lastDecision = Date.now();
		request.isWait = true;
		request.choice = choice;

		this.stream.write(`>${player.slot} ${choice}`);
	}
	undo(user: User, data: string) {
		const player = this.playerTable[user.userid];
		const [, rqid] = data.split('|', 2);
		if (!player) return;
		const request = player.request;
		if (request.isWait !== true) {
			player.sendRoom(`|error|[Invalid choice] There's nothing to cancel`);
			return;
		}
		const allPlayersWait = this.players.every(p => !!p.request.isWait);
		if (allPlayersWait || // too late
			(rqid && rqid !== '' + request.rqid)) { // WAY too late
			player.sendRoom(`|error|[Invalid choice] Sorry, too late to cancel; the next turn has already started`);
			return;
		}
		request.isWait = false;

		this.stream.write(`>${player.slot} undo`);
	}
	joinGame(user: User, slot?: SideID) {
		if (!user.can('joinbattle', null, this.room)) {
			user.popup(`You must be a set as a player to join a battle you didn't start. Ask a player to use /addplayer on you to join this battle.`);
			return false;
		}

		if (user.userid in this.playerTable) {
			user.popup(`You have already joined this battle.`);
			return false;
		}

		const validSlots: SideID[] = [];
		for (const player of this.players) {
			if (!player.userid) validSlots.push(player.slot);
		}

		if (slot && !validSlots.includes(slot)) {
			user.popup(`This battle already has a user in slot ${slot}.`);
			return false;
		}

		if (!validSlots.length) {
			user.popup(`This battle already has two players.`);
			return false;
		}

		if (!slot && validSlots.length > 1) {
			user.popup(`Which slot would you like to join into? Use something like \`/joingame ${validSlots[0]}\``);
			return false;
		}

		if (!slot) slot = validSlots[0];

		this.updatePlayer(this[slot], user);
		if (validSlots.length - 1 < 1 && this.missingBattleStartMessage) {
			const users = this.players.map(player => {
				const u = player.getUser();
				if (!u) throw new Error(`User ${player.name} not found on ${this.id} battle creation`);
				return u;
			});
			Rooms.global.onCreateBattleRoom(users, this.room, {rated: this.rated});
			this.missingBattleStartMessage = false;
		}
		if (user.inRooms.has(this.id)) this.onConnect(user);
		this.room.update();
		return true;
	}
	leaveGame(user: User) {
		if (!user) return false; // ...
		if (this.room.rated || this.room.tour) {
			user.popup(`Players can't be swapped out in a ${this.room.tour ? "tournament" : "rated"} battle.`);
			return false;
		}
		const player = this.playerTable[user.userid];
		if (!player) {
			user.popup(`Failed to leave battle - you're not a player.`);
			return false;
		}

		this.updatePlayer(player, null);
		this.room.auth[user.userid] = '+';
		this.room.update();
		return true;
	}

	async listen() {
		let next;
		// tslint:disable-next-line: no-conditional-assignment
		while ((next = await this.stream.read())) {
			this.receive(next.split('\n'));
		}
		if (!this.ended) {
			this.room.add(`|bigerror|The simulator process has crashed. We've been notified and will fix this ASAP.`);
			Monitor.crashlog(new Error(`Process disconnected`), `A battle`);
			this.started = true;
			this.ended = true;
			this.checkActive();
		}
	}
	receive(lines: string[]) {
		for (const player of this.players) player.wantsTie = false;

		switch (lines[0]) {
		case 'update':
			for (const line of lines.slice(1)) {
				if (line.startsWith('|turn|')) {
					this.turn = parseInt(line.slice(6));
				}
				this.room.add(line);
			}
			this.room.update();
			if (!this.ended) this.timer.nextRequest();
			this.checkActive();
			break;

		case 'sideupdate': {
			const slot = lines[1] as SideID;
			const player = this[slot];
			if (lines[2].startsWith(`|error|[Invalid choice] Can't do anything`)) {
				// ... should not happen
			} else if (lines[2].startsWith(`|error|[Invalid choice]`)) {
				const request = this[slot].request;
				request.isWait = false;
				request.choice = '';
			} else if (lines[2].startsWith(`|request|`)) {
				this.rqid++;
				const request = JSON.parse(lines[2].slice(9));
				request.rqid = this.rqid;
				const requestJSON = JSON.stringify(request);
				this[slot].request = {
					rqid: this.rqid,
					request: requestJSON,
					isWait: request.wait ? 'cantUndo' : false,
					choice: '',
				};
				this.requestCount++;
				if (player) player.sendRoom(`|request|${requestJSON}`);
				break;
			}
			if (player) player.sendRoom(lines[2]);
			break;
		}

		case 'end':
			this.logData = JSON.parse(lines[1]);
			this.score = this.logData!.score;
			this.inputLog = this.logData!.inputLog;
			this.started = true;
			if (!this.ended) {
				this.ended = true;
				// tslint:disable-next-line: no-floating-promises
				this.onEnd(this.logData!.winner);
				this.clearPlayers();
			}
			this.checkActive();
			break;
		}
	}
	async onEnd(winner: any) {
		this.timer.end();
		// Declare variables here in case we need them for non-rated battles logging.
		let p1score = 0.5;
		const winnerid = toID(winner);

		// Check if the battle was rated to update the ladder, return its response, and log the battle.
		const p1name = this.p1.name;
		const p2name = this.p2.name;
		const p1id = toID(p1name);
		const p2id = toID(p2name);
		if (this.room.rated) {
			this.room.rated = 0;

			if (winnerid === p1id) {
				p1score = 1;
			} else if (winnerid === p2id) {
				p1score = 0;
			}

			winner = Users.get(winnerid);
			if (winner && !winner.registered) {
				this.room.sendUser(winner, '|askreg|' + winner.userid);
			}
			const [score, p1rating, p2rating] = await Ladders(this.format).updateRating(p1name, p2name, p1score, this.room);
			// tslint:disable-next-line: no-floating-promises
			this.logBattle(score, p1rating, p2rating);
		} else if (Config.logchallenges) {
			if (winnerid === p1id) {
				p1score = 1;
			} else if (winnerid === p2id) {
				p1score = 0;
			}
			// tslint:disable-next-line: no-floating-promises
			this.logBattle(p1score);
		} else {
			this.logData = null;
		}
		// If a replay was saved at any point or we were configured to autosavereplays,
		// reupload when the battle is over to overwrite the partial data (and potentially
		// reflect any changes that may have been made to the replay's hidden status).
		if (this.replaySaved || Config.autosavereplays) {
			const uploader = Users.get(winnerid || p1id);
			if (uploader && uploader.connections[0]) {
				Chat.parse('/savereplay', this.room, uploader, uploader.connections[0]);
			}
		}
		const parentGame = this.room.parent && this.room.parent.game;
		// @ts-ignore - Tournaments aren't TS'd yet
		if (parentGame && parentGame.onBattleWin) {
			// @ts-ignore
			parentGame.onBattleWin(this.room, winnerid);
		}
		// If the room's replay was hidden, disable users from joining after the game is over
		if (this.room.hideReplay) {
			this.room.modjoin = '%';
			this.room.isPrivate = 'hidden';
		}
		this.room.update();
	}
	async logBattle(
		p1score: number, p1rating: AnyObject | null = null, p2rating: AnyObject | null = null,
		p3rating: AnyObject | null = null, p4rating: AnyObject | null = null
		) {
		if (Dex.getFormat(this.format, true).noLog) return;
		const logData = this.logData;
		if (!logData) return;
		this.logData = null; // deallocate to save space
		logData.log = this.room.getLog(-1).split('\n'); // replay log (exact damage)

		// delete some redundant data
		for (const rating of [p1rating, p2rating, p3rating, p4rating]) {
			if (rating) {
				delete rating.formatid;
				delete rating.username;
				delete rating.rpsigma;
				delete rating.sigma;
			}
		}

		logData.p1rating = p1rating;
		logData.p2rating = p2rating;
		if (this.playerCap > 2) {
			logData.p3rating = p3rating;
			logData.p4rating = p4rating;
		}
		logData.endType = this.endType;
		if (!p1rating) logData.ladderError = true;
		const date = new Date();
		logData.timestamp = '' + date;
		logData.id = this.room.id;
		logData.format = this.room.format;

		const logsubfolder = Chat.toTimestamp(date).split(' ')[0];
		const logfolder = logsubfolder.split('-', 2).join('-');
		const tier = this.room.format.toLowerCase().replace(/[^a-z0-9]+/g, '');
		const logpath = `logs/${logfolder}/${tier}/${logsubfolder}/`;
		await FS(logpath).mkdirp();
		await FS(logpath + this.room.id + '.log.json').write(JSON.stringify(logData));
		// console.log(JSON.stringify(logData));
	}
	onConnect(user: User, connection: Connection | null = null) {
		// this handles joining a battle in which a user is a participant,
		// where the user has already identified before attempting to join
		// the battle
		const player = this.playerTable[user.userid];
		if (!player) return;
		player.updateChannel(connection || user);
		const request = player.request;
		if (request) {
			let data = `|request|${request.request}`;
			if (request.choice) data += `\n|sentchoice|${request.choice}`;
			(connection || user).sendTo(this.id, data);
		}
		if (!player.active) this.onJoin(user);
	}
	onUpdateConnection(user: User, connection: Connection | null = null) {
		this.onConnect(user, connection);
	}
	onRename(user: User, oldUserid: ID, isJoining: boolean, isForceRenamed: boolean) {
		if (user.userid === oldUserid) return;
		if (!this.playerTable) {
			// !! should never happen but somehow still does
			user.games.delete(this.id);
			return;
		}
		if (!(oldUserid in this.playerTable)) {
			if (user.userid in this.playerTable) {
				// this handles a user renaming themselves into a user in the
				// battle (e.g. by using /nick)
				this.onConnect(user);
			}
			return;
		}
		if (!this.allowRenames) {
			const player = this.playerTable[oldUserid];
			if (player) {
				const message = isForceRenamed ? " lost by having an inappropriate name." : " forfeited by changing their name.";
				this.forfeitPlayer(player, message);
			}
			if (!(user.userid in this.playerTable)) {
				user.games.delete(this.id);
			}
			return;
		}
		if (!user.named) {
			this.onLeave(user, oldUserid);
			return;
		}
		if (user.userid in this.playerTable) return;
		const player = this.playerTable[oldUserid];
		if (player) {
			this.updatePlayer(player, user);
		}
		const options = {
			name: user.name,
			avatar: user.avatar,
		};
		this.stream.write(`>player ${player.slot} ` + JSON.stringify(options));
	}
	onJoin(user: User) {
		const player = this.playerTable[user.userid];
		if (player && !player.active) {
			player.active = true;
			this.timer.checkActivity();
			this.room.add(`|player|${player.slot}|${user.name}|${user.avatar}`);
		}
	}
	onLeave(user: User, oldUserid?: ID) {
		const player = this.playerTable[oldUserid || user.userid];
		if (player && player.active) {
			player.sendRoom(`|request|null`);
			player.active = false;
			this.timer.checkActivity();
			this.room.add(`|player|${player.slot}|`);
		}
	}

	win(user: User) {
		if (!user) {
			this.tie();
			return true;
		}
		const player = this.playerTable[user.userid];
		if (!player) return false;
		this.stream.write(`>forcewin ${player.slot}`);
	}
	tie() {
		this.stream.write(`>forcetie`);
	}
	tiebreak() {
		this.stream.write(`>tiebreak`);
	}
	forfeit(user: User | string, message = '') {
		if (typeof user !== 'string') user = user.userid;
		else user = toID(user);

		if (!(user in this.playerTable)) return false;
		return this.forfeitPlayer(this.playerTable[user], message);
	}

	forfeitPlayer(player: RoomBattlePlayer, message = '') {
		if (this.ended || !this.started) return false;

		if (!message) message = ' forfeited.';
		this.room.add(`|-message|${player.name}${message}`);
		this.endType = 'forfeit';
		const otherids = ['p2', 'p1'];
		this.stream.write(`>forcewin ${otherids[player.num - 1]}`);
		return true;
	}

	/**
	 * Team should be '' for random teams. `null` should be used only if importing
	 * an inputlog (so the player isn't recreated)
	 */
	addPlayer(user: User | null, team: string | null, rating = 0) {
		// TypeScript bug: no `T extends RoomGamePlayer`
		const player = super.addPlayer(user) as RoomBattlePlayer;
		if (!player) return null;
		const slot = player.slot;
		this[slot] = player;

		if (team !== null) {
			const options = {
				name: player.name,
				avatar: user ? '' + user.avatar : '',
				team,
				rating: Math.round(rating),
			};
			this.stream.write(`>player ${slot} ${JSON.stringify(options)}`);
		}

		if (user) this.room.auth[user.userid] = Users.PLAYER_SYMBOL;
		if (user && user.inRooms.has(this.id)) this.onConnect(user);
		return player;
	}

	forcedPublic() {
		if (!this.rated) return;
		for (const player of this.players) {
			const user = player.getUser();
			if (user && user.forcedPublic) return user.forcedPublic;
		}
	}

	makePlayer(user: User) {
		const num = (this.players.length + 1) as PlayerIndex;
		return new RoomBattlePlayer(user, this, num);
	}

	updatePlayer(player: RoomBattlePlayer, user: User | null) {
		super.updatePlayer(player, user);

		const slot = player.slot;
		if (user) {
			const options = {
				name: player.name,
				avatar: user.avatar,
			};
			this.stream.write(`>player ${slot} ` + JSON.stringify(options));

			this.room.add(`|player|${slot}|${player.name}|${user.avatar}`);
		} else {
			const options = {
				name: '',
			};
			this.stream.write(`>player ${slot} ` + JSON.stringify(options));

			this.room.add(`|player|${slot}|`);
		}
	}

	start() {
		// on start
		this.started = true;
		const users = this.players.map(player => {
			const user = player.getUser();
			if (!user && !this.missingBattleStartMessage) {
				throw new Error(`User ${player.name} not found on ${this.id} battle creation`);
			}
			return user;
		});
		if (!this.missingBattleStartMessage) {
			// @ts-ignore The above error should throw if null is found, or this should be skipped
			Rooms.global.onCreateBattleRoom(users, this.room, {rated: this.rated});
		}

		if (this.gameType === 'multi') {
			this.room.title = `Team ${this.p1.name} vs. Team ${this.p2.name}`;
		} else if (this.gameType === 'free-for-all') {
			// p1 vs. p2 vs. p3 vs. p4 is too long of a title
			this.room.title = `${this.p1.name} and friends`;
		} else {
			this.room.title = `${this.p1.name} vs. ${this.p2.name}`;
		}
		this.room.send(`|title|${this.room.title}`);
	}

	clearPlayers() {
		for (const player of this.players) {
			player.unlinkUser();
		}
	}

	destroy() {
		for (const player of this.players) {
			player.destroy();
		}
		this.playerTable = {};
		this.players = [];
		// @ts-ignore
		this.p1 = null;
		// @ts-ignore
		this.p2 = null;
		// @ts-ignore
		this.p3 = null;
		// @ts-ignore
		this.p4 = null;

		this.ended = true;
		// tslint:disable-next-line: no-floating-promises
		this.stream.destroy();
		if (this.active) {
			Rooms.global.battleCount += -1;
			this.active = false;
		}

		// @ts-ignore
		this.room = null;
	}
}

export class RoomBattleStream extends BattleStream {
	battle: Battle;
	constructor() {
		super({keepAlive: true});
		// @ts-ignore
		this.battle = null;
	}

	_write(chunk: string) {
		const startTime = Date.now();
		try {
			this._writeLines(chunk);
		} catch (err) {
			const battle = this.battle;
			Monitor.crashlog(err, 'A battle', {
				chunk,
				inputLog: battle ? '\n' + battle.inputLog.join('\n') : '',
				log: battle ? '\n' + battle.getDebugLog() : '',
			});

			this.push(`update\n|html|<div class="broadcast-red"><b>The battle crashed</b><br />Don't worry, we're working on fixing it.</div>`);
			if (battle) {
				for (const side of battle.sides) {
					if (side && side.requestState) {
						this.push(`sideupdate\n${side.id}\n|error|[Invalid choice] The battle crashed`);
					}
				}
			}
		}
		if (this.battle) this.battle.sendUpdates();
		const deltaTime = Date.now() - startTime;
		if (deltaTime > 1000) {
			console.log(`[slow battle] ${deltaTime}ms - ${chunk}`);
		}
	}

	_writeLine(type: string, message: string) {
		switch (type) {
		case 'eval':
			/* eslint-disable no-eval, no-unused-vars */
			const battle = this.battle;
			const p1 = battle && battle.sides[0];
			const p2 = battle && battle.sides[1];
			const p3 = battle && battle.sides[2];
			const p4 = battle && battle.sides[3];
			const p1active = p1 && p1.active[0];
			const p2active = p2 && p2.active[0];
			const p3active = p3 && p3.active[0];
			const p4active = p4 && p4.active[0];
			battle.inputLog.push(`${type} ${message}`);
			message = message.replace(/\f/g, '\n');
			battle.add('', '>>> ' + message.replace(/\n/g, '\n||'));
			try {
				// tslint:disable-next-line: no-eval
				let result = eval(message);
				if (result && result.then) {
					result.then((unwrappedResult: any) => {
						unwrappedResult = Chat.stringify(unwrappedResult);
						battle.add('', 'Promise -> ' + unwrappedResult);
						battle.sendUpdates();
					}, (error: Error) => {
						battle.add('', '<<< error: ' + error.message);
						battle.sendUpdates();
					});
				} else {
					result = Chat.stringify(result);
					result = result.replace(/\n/g, '\n||');
					battle.add('', '<<< ' + result);
				}
			} catch (e) {
				battle.add('', '<<< error: ' + e.message);
			}
			/* eslint-enable no-eval, no-unused-vars */
			break;
		default: super._writeLine(type, message);
		}
	}
}

/*********************************************************
 * Process manager
 *********************************************************/

export const PM = new StreamProcessManager(module, () => {
	return new RoomBattleStream();
});

if (!PM.isParentProcess) {
	// This is a child process!
	// tslint:disable-next-line: no-var-requires
	global.Config = require('./config-loader').Config;
	// tslint:disable-next-line: no-var-requires
	global.Chat = require('./chat').Chat;
	// @ts-ignore ???
	global.Monitor = {
		crashlog(error: Error, source = 'A simulator process', details: {} | null = null) {
			const repr = JSON.stringify([error.name, error.message, source, details]);
			// @ts-ignore
			process.send(`THROW\n@!!@${repr}\n${error.stack}`);
		},
	};
	global.__version = {head: ''};
	try {
		const head = execSync('git rev-parse HEAD', {
			stdio: ['ignore', 'pipe', 'ignore'],
		});
		const merge = execSync('git merge-base origin/master HEAD', {
			stdio: ['ignore', 'pipe', 'ignore'],
		});
		global.__version.head = ('' + head).trim();
		const origin = ('' + merge).trim();
		if (origin !== global.__version.head) global.__version.origin = origin;
	} catch (e) {}

	if (Config.crashguard) {
		// graceful crash - allow current battles to finish before restarting
		process.on('uncaughtException', err => {
			Monitor.crashlog(err, 'A simulator process');
		});
		process.on('unhandledRejection', err => {
			if (err instanceof Error) {
				Monitor.crashlog(err, 'A simulator process Promise');
			}
		});
	}

	// tslint:disable-next-line: no-eval
	Repl.start(`sim-${process.pid}`, cmd => eval(cmd));
} else {
	PM.spawn(global.Config ? Config.simulatorprocesses : 1);
}
