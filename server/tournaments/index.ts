import {Elimination} from './generator-elimination';
import {RoundRobin} from './generator-round-robin';

interface TourCommands {
	[k: string]: string | TourCommand;
}

type TourCommand = (
	this: CommandContext, tournament: Tournament, user: User, params: string[], cmd: string, connection: Connection
) => void;
type Generator = RoundRobin | Elimination;

const BRACKET_MINIMUM_UPDATE_INTERVAL = 2 * 1000;
const AUTO_DISQUALIFY_WARNING_TIMEOUT = 30 * 1000;
const AUTO_START_MINIMUM_TIMEOUT = 30 * 1000;
const MAX_REASON_LENGTH = 300;
const MAX_CUSTOM_NAME_LENGTH = 100;
const TOURBAN_DURATION = 14 * 24 * 60 * 60 * 1000;
const ALLOW_ALTS = false;

Punishments.roomPunishmentTypes.set('TOURBAN', 'banned from tournaments');

const TournamentGenerators = {
	__proto__: null,
	roundrobin: RoundRobin,
	elimination: Elimination,
};

function usersToNames(users: TournamentPlayer[]) {
	return users.map(user => user.name);
}

export class TournamentPlayer extends Rooms.RoomGamePlayer {
	isBusy: boolean;
	availableMatches: Set<TournamentPlayer>;
	inProgressMatch: {to: TournamentPlayer, room: GameRoom} | null;
	pendingChallenge: {from?: TournamentPlayer, to?: TournamentPlayer, team: string} | null;
	isDisqualified: boolean;
	isEliminated: boolean;
	autoDisqualifyWarned: boolean;
	lastActionTime: number;
	wins: number;
	losses: number;
	games: number;
	score: number;
	constructor(user: User | string | null, game: Tournament, num: number) {
		super(user, game, num);
		this.isBusy = false;
		this.availableMatches = new Set();
		this.inProgressMatch = null;
		this.pendingChallenge = null;
		this.isDisqualified = false;
		this.isEliminated = false;
		this.autoDisqualifyWarned = false;
		this.lastActionTime = 0;

		this.wins = 0;
		this.losses = 0;
		this.games = 0;
		this.score = 0;
	}
}

export class Tournament extends Rooms.RoomGame {
	playerTable: {[userid: string]: TournamentPlayer};
	players: TournamentPlayer[];
	isTournament: true;
	name: string;
	/** Format ID not including custom rules */
	baseFormat: ID;
	/**
	 * Full format specifier, including custom rules (such as 'gen7challengecup1v1@@@speciesclause')
	 */
	fullFormat: string;
	customRules: string[];
	generator: Generator;
	isRated: boolean;
	scouting: boolean;
	modjoin: boolean;
	forceTimer: boolean;
	autostartcap: boolean;
	isTournamentStarted: boolean;
	isBracketInvalidated: boolean;
	lastBracketUpdate: number;
	bracketUpdateTimer: NodeJS.Timeout | null;
	bracketCache: AnyObject | null;
	completedMatches: Set<RoomID>;
	isAvailableMatchesInvalidated: boolean;
	availableMatchesCache: {
		challenges: Map<TournamentPlayer, TournamentPlayer[]>, challengeBys: Map<TournamentPlayer, TournamentPlayer[]>,
	};
	autoDisqualifyTimeout: number;
	autoDisqualifyTimer: NodeJS.Timeout | null;
	autoStartTimeout: number;
	autoStartTimer: NodeJS.Timeout | null;

	isEnded: boolean;
	constructor(
		room: ChatRoom, format: Format, generator: Generator,
		playerCap: string | undefined, isRated: boolean, name: string | undefined
	) {
		super(room);
		this.gameid = 'tournament' as ID;
		const formatId = toID(format);

		// TypeScript bug: no `T extends RoomGamePlayer`
		this.playerTable = Object.create(null);
		// TypeScript bug: no `T extends RoomGamePlayer`
		this.players = [];

		this.id = room.id;
		this.room = room;
		this.title = format.name + ' tournament';
		this.isTournament = true;
		this.allowRenames = false;
		this.playerCap = (playerCap ? parseInt(playerCap) : Config.tourdefaultplayercap) || 0;

		// This will sometimes be sent alone in updates as "format", if the tour doesn't have a custom name
		this.name = name || formatId;
		this.baseFormat = formatId;
		this.fullFormat = formatId;
		this.customRules = [];
		this.generator = generator;
		this.isRated = isRated;
		this.scouting = true;
		this.modjoin = false;
		this.forceTimer = false;
		this.autostartcap = false;
		if (Config.tourdefaultplayercap && this.playerCap > Config.tourdefaultplayercap) {
			Monitor.log(`[TourMonitor] Room ${room.id} starting a tour over default cap (${this.playerCap})`);
		}

		this.isTournamentStarted = false;

		this.isBracketInvalidated = true;
		this.lastBracketUpdate = 0;
		this.bracketUpdateTimer = null;
		this.bracketCache = null;

		this.completedMatches = new Set();
		this.isAvailableMatchesInvalidated = true;
		this.availableMatchesCache = {challenges: new Map(), challengeBys: new Map()};

		this.autoDisqualifyTimeout = Infinity;
		this.autoDisqualifyTimer = null;
		this.autoStartTimeout = Infinity;
		this.autoStartTimer = null;

		this.isEnded = false;

		room.add(`|tournament|create|${this.name}|${generator.name}|${this.playerCap}`);
		const update: {
			format: string, teambuilderFormat?: string, generator: string,
			playerCap: number, isStarted: boolean, isJoined: boolean,
		} = {
			format: this.name,
			generator: generator.name,
			playerCap: this.playerCap,
			isStarted: false,
			isJoined: false,
		};
		if (this.name !== this.baseFormat) update.teambuilderFormat = this.baseFormat;
		room.send(`|tournament|update|${JSON.stringify(update)}`);
		this.update();
	}
	destroy() {
		this.forceEnd();
	}
	remove() {
		if (this.autoStartTimer) clearTimeout(this.autoStartTimer);
		if (this.autoDisqualifyTimer) clearTimeout(this.autoDisqualifyTimer);
		for (const roomid of this.completedMatches) {
			const room = Rooms.get(roomid) as GameRoom;
			if (room) room.tour = null;
		}
		for (const player of this.players) {
			player.unlinkUser();
		}
		this.isEnded = true;
		this.room.game = null;
	}
	getRemainingPlayers() {
		return this.players.filter(player => !player.isDisqualified && !player.isEliminated);
	}

	setGenerator(generator: Generator, output: CommandContext) {
		if (this.isTournamentStarted) {
			output.sendReply('|tournament|error|BracketFrozen');
			return;
		}

		this.generator = generator;
		this.room.send(`|tournament|update|${JSON.stringify({generator: generator.name})}`);
		this.isBracketInvalidated = true;
		this.update();
		return true;
	}

	setCustomRules(rules: string[], output: CommandContext) {
		try {
			this.fullFormat = Dex.validateFormat(`${this.baseFormat}@@@${rules}`);
		} catch (e) {
			output.errorReply(`Custom rule error: ${e.message}`);
			return false;
		}

		const customRules = Dex.getFormat(this.fullFormat, true).customRules;
		if (!customRules) {
			output.errorReply(`Invalid rules.`);
			return false;
		}
		this.customRules = customRules;
		if (this.name === this.baseFormat) {
			this.name = this.getDefaultCustomName();
			this.room.send(`|tournament|update|${JSON.stringify({format: this.name})}`);
			this.update();
		}
		return true;
	}

	getCustomRules() {
		const bans = [];
		const unbans = [];
		const addedRules = [];
		const removedRules = [];
		for (const ban of this.customRules) {
			const charAt0 = ban.charAt(0);
			if (charAt0 === '+') {
				unbans.push(ban.substr(1));
			} else if (charAt0 === '-') {
				bans.push(ban.substr(1));
			} else if (charAt0 === '!') {
				removedRules.push(ban.substr(1));
			} else {
				addedRules.push(ban);
			}
		}
		const html = [];
		if (bans.length) html.push(`<b>Bans</b> - ${Chat.escapeHTML(bans.join(', '))}`);
		if (unbans.length) html.push(`<b>Unbans</b> - ${Chat.escapeHTML(unbans.join(', '))}`);
		if (addedRules.length) html.push(`<b>Added rules</b> - ${Chat.escapeHTML(addedRules.join(', '))}`);
		if (removedRules.length) html.push(`<b>Removed rules</b> - ${Chat.escapeHTML(removedRules.join(', '))}`);
		return html.join(`<br />`);
	}

	forceEnd() {
		if (this.isTournamentStarted) {
			if (this.autoDisqualifyTimer) clearTimeout(this.autoDisqualifyTimer);
			for (const player of this.players) {
				const match = player.inProgressMatch;
				if (match) {
					match.room.tour = null;
					match.room.parent = null;
					match.room.addRaw(`<div class="broadcast-red"><b>The tournament was forcefully ended.</b><br />You can finish playing, but this battle is no longer considered a tournament battle.</div>`);
				}
			}
		}
		this.room.add('|tournament|forceend');
		this.remove();
	}

	updateFor(targetUser: User, connection?: Connection | User) {
		if (!connection) connection = targetUser;
		if (this.isEnded) return;

		if ((!this.bracketUpdateTimer && this.isBracketInvalidated) ||
			(this.isTournamentStarted && this.isAvailableMatchesInvalidated)) {
			this.room.add(
				"Error: update() called with a target user when data invalidated: " +
				(!this.bracketUpdateTimer && this.isBracketInvalidated) + ", " +
				(this.isTournamentStarted && this.isAvailableMatchesInvalidated) +
				"; Please report this to an admin."
			);
			return;
		}
		const isJoined = targetUser.userid in this.playerTable;
		const update: {
			format: string, teambuilderFormat?: string, generator: string,
			isStarted: boolean, isJoined: boolean, bracketData: AnyObject,
		} = {
			format: this.name,
			generator: this.generator.name,
			isStarted: this.isTournamentStarted,
			isJoined,
			bracketData: this.bracketCache!,
		};
		if (this.name !== this.baseFormat) update.teambuilderFormat = this.baseFormat;
		connection.sendTo(this.room, `|tournament|update|${JSON.stringify(update)}`);
		if (this.isTournamentStarted && isJoined) {
			const update2 = {
				challenges: usersToNames(this.availableMatchesCache.challenges.get(this.playerTable[targetUser.userid])!),
				challengeBys: usersToNames(this.availableMatchesCache.challengeBys.get(this.playerTable[targetUser.userid])!),
			};
			connection.sendTo(this.room, `|tournament|update|${JSON.stringify(update2)}`);

			const pendingChallenge = this.playerTable[targetUser.userid].pendingChallenge;
			if (pendingChallenge) {
				if (pendingChallenge.to) {
					connection.sendTo(this.room, `|tournament|update|${JSON.stringify({challenging: pendingChallenge.to.name})}`);
				} else if (pendingChallenge.from) {
					connection.sendTo(this.room, `|tournament|update|${JSON.stringify({challenged: pendingChallenge.from.name})}`);
				}
			}
		}
		connection.sendTo(this.room, '|tournament|updateEnd');
	}

	update() {
		if (this.isEnded) return;
		if (this.isBracketInvalidated) {
			if (Date.now() < this.lastBracketUpdate + BRACKET_MINIMUM_UPDATE_INTERVAL) {
				if (this.bracketUpdateTimer) clearTimeout(this.bracketUpdateTimer);
				this.bracketUpdateTimer = setTimeout(() => {
					this.bracketUpdateTimer = null;
					this.update();
				}, BRACKET_MINIMUM_UPDATE_INTERVAL);
			} else {
				this.lastBracketUpdate = Date.now();

				this.bracketCache = this.getBracketData();
				this.isBracketInvalidated = false;
				this.room.send(`|tournament|update|${JSON.stringify({bracketData: this.bracketCache})}`);
			}
		}

		if (this.isTournamentStarted && this.isAvailableMatchesInvalidated) {
			this.availableMatchesCache = this.getAvailableMatches();

			this.isAvailableMatchesInvalidated = false;
			for (const [player, opponents] of this.availableMatchesCache.challenges) {
				player.sendRoom(`|tournament|update|${JSON.stringify({challenges: usersToNames(opponents)})}`);
			}
			for (const [player, opponents] of this.availableMatchesCache.challengeBys) {
				player.sendRoom(`|tournament|update|${JSON.stringify({challengeBys: usersToNames(opponents)})}`);
			}
		}
		this.room.send('|tournament|updateEnd');
	}

	checkBanned(user: User | string) {
		return Punishments.getRoomPunishType(this.room, toID(user)) === 'TOURBAN';
	}

	removeBannedUser(userid: User | ID) {
		userid = toID(userid);
		if (!(userid in this.playerTable)) return;
		if (this.isTournamentStarted) {
			const player = this.playerTable[userid];
			if (!player.isDisqualified) {
				this.disqualifyUser(userid);
			}
		} else {
			this.removeUser(userid);
		}
		this.room.update();
	}

	addUser(user: User, output: CommandContext) {
		if (!user.named) {
			output.sendReply('|tournament|error|UserNotNamed');
			return;
		}

		if (user.userid in this.playerTable) {
			output.sendReply('|tournament|error|UserAlreadyAdded');
			return;
		}

		if (this.playerCap && this.playerCount >= this.playerCap) {
			output.sendReply('|tournament|error|Full');
			return;
		}

		if (this.checkBanned(user) || Punishments.isBattleBanned(user)) {
			output.sendReply('|tournament|error|Banned');
			return;
		}

		const gameCount = user.games.size;
		if (gameCount > 4) {
			output.errorReply("Due to high load, you are limited to 4 games at the same time.");
			return;
		}

		if (!ALLOW_ALTS) {
			for (const otherPlayer of this.players) {
				if (!otherPlayer) continue;
				const otherUser = Users.get(otherPlayer.userid);
				if (otherUser && otherUser.latestIp === user.latestIp) {
					output.sendReply('|tournament|error|AltUserAlreadyAdded');
					return;
				}
			}
		}

		if (this.isTournamentStarted) {
			output.sendReply(`|tournament|error|BracketFrozen`);
			return;
		}
		// TypeScript bug: no `T extends RoomGamePlayer`
		const player = this.addPlayer(user) as TournamentPlayer;
		if (!player) throw new Error("Failed to add player.");

		this.playerTable[user.userid] = player;
		this.room.add(`|tournament|join|${user.name}`);
		user.sendTo(this.room, '|tournament|update|{"isJoined":true}');
		this.isBracketInvalidated = true;
		this.update();
		if (this.playerCount === this.playerCap) {
			if (this.autostartcap === true) {
				this.startTournament(output);
			} else {
				this.room.add("The tournament is now full.");
			}
		}
	}

	makePlayer(user: User | string | null) {
		const num = this.players.length ? this.players[this.players.length - 1].num : 1;
		return new TournamentPlayer(user, this, num);
	}

	removeUser(userid: ID, output?: CommandContext) {
		if (!(userid in this.playerTable)) {
			if (output) output.sendReply('|tournament|error|UserNotAdded');
			return;
		}

		for (const player of this.players) {
			if (player.userid === userid) {
				this.players.splice(this.players.indexOf(player), 1);
				break;
			}
		}
		this.playerTable[userid].destroy();
		delete this.playerTable[userid];
		this.playerCount--;
		const user = Users.get(userid);
		this.room.add(`|tournament|leave|${user ? user.name : userid}`);
		if (user) user.sendTo(this.room, '|tournament|update|{"isJoined":false}');
		this.isBracketInvalidated = true;
		this.update();
	}
	replaceUser(user: User, replacementUser: User, output: CommandContext) {
		if (!this.isTournamentStarted) {
			output.sendReply('|tournament|error|NotStarted');
			return;
		}
		if (!(user.userid in this.playerTable)) {
			output.errorReply(`${user.name} isn't in the tournament.`);
			return;
		}
		if (!replacementUser.named) {
			output.errorReply(`${replacementUser.name} must be named to join the tournament.`);
			return;
		}
		if (replacementUser.userid in this.playerTable) {
			output.errorReply(`${replacementUser.name} is already in the tournament.`);
			return;
		}
		if (this.checkBanned(replacementUser) || Punishments.isBattleBanned(replacementUser)) {
			output.errorReply(`${replacementUser.name} is banned from joining tournaments.`);
			return;
		}
		if (!ALLOW_ALTS) {
			for (const otherPlayer of this.players) {
				if (!otherPlayer) continue;
				const otherUser = Users.get(otherPlayer.userid);
				if (otherUser && otherUser.latestIp === replacementUser.latestIp) {
					output.errorReply(`${replacementUser.name} already has an alt in the tournament.`);
					return;
				}
			}
		}

		// Replace the player
		this.renamePlayer(replacementUser, user.userid);
		const newPlayer = this.playerTable[replacementUser.userid];

		// Reset and invalidate any in progress battles
		let matchPlayer = null;
		if (newPlayer.inProgressMatch) {
			matchPlayer = newPlayer;
		} else {
			for (const player of this.players) {
				if (player.inProgressMatch && player.inProgressMatch.to === newPlayer) {
					matchPlayer = player;
					break;
				}
			}
		}
		if (matchPlayer && matchPlayer.inProgressMatch) {
			matchPlayer.inProgressMatch.to.isBusy = false;
			matchPlayer.isBusy = false;

			matchPlayer.inProgressMatch.room.addRaw(`<div class="broadcast-red"><b>${Chat.escapeHTML(user.name)} is no longer in the tournament.<br />You can finish playing, but this battle is no longer considered a tournament battle.</div>`).update();
			matchPlayer.inProgressMatch.room.parent = null;
			this.completedMatches.add(matchPlayer.inProgressMatch.room.id);
			matchPlayer.inProgressMatch = null;
		}

		this.isAvailableMatchesInvalidated = true;
		this.isBracketInvalidated = true;
		// Update the bracket
		this.update();
		this.updateFor(user);
		this.updateFor(replacementUser);
		const challengePlayer = newPlayer.pendingChallenge &&
			(newPlayer.pendingChallenge.from || newPlayer.pendingChallenge.to);
		if (challengePlayer) {
			const challengeUser = Users.getExact(challengePlayer.userid);
			if (challengeUser) this.updateFor(challengeUser);
		}

		this.room.add(`|tournament|replace|${user.name}|${replacementUser.name}`);
		return true;
	}

	getBracketData() {
		let data: any;
		if (!this.isTournamentStarted) {
			data = this.generator.getPendingBracketData(this.players);
		} else {
			data = this.generator.getBracketData();
		}
		if (data.type === 'tree') {
			if (!data.rootNode) {
				data.users = usersToNames(this.players.sort());
				return data;
			}
			const queue = [data.rootNode];
			while (queue.length > 0) {
				const node = queue.shift();

				if (node.state === 'available') {
					const pendingChallenge = node.children[0].team.pendingChallenge;
					if (pendingChallenge && node.children[1].team === pendingChallenge.to) {
						node.state = 'challenging';
					}

					const inProgressMatch = node.children[0].team.inProgressMatch;
					if (inProgressMatch && node.children[1].team === inProgressMatch.to) {
						node.state = 'inprogress';
						node.room = inProgressMatch.room.id;
					}
				}

				if (node.team && typeof node.team !== 'string') {
					node.team = node.team.name;
				}

				if (node.children) {
					for (const child of node.children) {
						queue.push(child);
					}
				}
			}
		} else if (data.type === 'table') {
			if (this.isTournamentStarted) {
				for (const [r, row] of data.tableContents.entries()) {
					const pendingChallenge = data.tableHeaders.rows[r].pendingChallenge;
					const inProgressMatch = data.tableHeaders.rows[r].inProgressMatch;
					if (pendingChallenge || inProgressMatch) {
						for (const [c, cell] of row.entries()) {
							if (!cell) continue;

							if (pendingChallenge && data.tableHeaders.cols[c] === pendingChallenge.to) {
								cell.state = 'challenging';
							}

							if (inProgressMatch && data.tableHeaders.cols[c] === inProgressMatch.to) {
								cell.state = 'inprogress';
								cell.room = inProgressMatch.room.id;
							}
						}
					}
				}
			}
			data.tableHeaders.cols = usersToNames(data.tableHeaders.cols);
			data.tableHeaders.rows = usersToNames(data.tableHeaders.rows);
		}
		return data;
	}

	startTournament(output: CommandContext) {
		if (this.isTournamentStarted) {
			output.sendReply('|tournament|error|AlreadyStarted');
			return false;
		}

		if (this.players.length < 2) {
			output.sendReply('|tournament|error|NotEnoughUsers');
			return false;
		}

		this.generator.freezeBracket(this.players);

		const now = Date.now();
		for (const user of this.players) {
			user.lastActionTime = now;
		}

		this.isTournamentStarted = true;
		if (this.autoStartTimer) clearTimeout(this.autoStartTimer);
		if (this.autoDisqualifyTimeout !== Infinity) {
			this.autoDisqualifyTimer = setTimeout(() => this.runAutoDisqualify(), this.autoDisqualifyTimeout);
		}
		this.isBracketInvalidated = true;
		this.room.add(`|tournament|start|${this.players.length}`);
		this.room.send('|tournament|update|{"isStarted":true}');
		this.update();
		return true;
	}
	getAvailableMatches() {
		const matches = this.generator.getAvailableMatches() as [TournamentPlayer, TournamentPlayer][];
		if (typeof matches === 'string') throw new Error(`Error from getAvailableMatches(): ${matches}`);

		const challenges = new Map<TournamentPlayer, TournamentPlayer[]>();
		const challengeBys = new Map<TournamentPlayer, TournamentPlayer[]>();
		const oldAvailableMatches = new Map<TournamentPlayer, boolean>();

		for (const user of this.players) {
			challenges.set(user, []);
			challengeBys.set(user, []);

			let oldAvailableMatch = false;
			const availableMatches = user.availableMatches;
			if (availableMatches.size) {
				oldAvailableMatch = true;
				availableMatches.clear();
			}
			oldAvailableMatches.set(user, oldAvailableMatch);
		}

		for (const match of matches) {
			challenges.get(match[0])!.push(match[1]);
			challengeBys.get(match[1])!.push(match[0]);

			match[0].availableMatches.add(match[1]);
		}

		const now = Date.now();
		for (const player of this.players) {
			if (oldAvailableMatches.get(player)) continue;

			if (player.availableMatches.size) player.lastActionTime = now;
		}

		return {
			challenges,
			challengeBys,
		};
	}

	disqualifyUser(userid: ID, output: CommandContext | null = null, reason: string | null = null, isSelfDQ = false) {
		const user = Users.get(userid);
		let sendReply: (msg: string) => void;
		if (output) {
			sendReply = msg => output.sendReply(msg);
		} else if (user) {
			sendReply = msg => user.sendTo(this.id, msg);
		} else {
			sendReply = () => {};
		}
		if (!this.isTournamentStarted) {
			sendReply('|tournament|error|NotStarted');
			return false;
		}

		if (!(userid in this.playerTable)) {
			sendReply(`|tournament|error|UserNotAdded|${userid}`);
			return false;
		}

		const player = this.playerTable[userid];
		if (player.isDisqualified) {
			sendReply(`|tournament|error|AlreadyDisqualified|${userid}`);
			return false;
		}

		player.isDisqualified = true;

		const error = this.generator.disqualifyUser(player);
		if (error) {
			sendReply(`|tournament|error|${error}`);
			return false;
		}

		player.isBusy = false;

		const challenge = player.pendingChallenge;
		if (challenge) {
			player.pendingChallenge = null;
			if (challenge.to) {
				challenge.to.isBusy = false;
				challenge.to.pendingChallenge = null;
				challenge.to.sendRoom('|tournament|update|{"challenged":null}');
			} else if (challenge.from) {
				challenge.from.isBusy = false;
				challenge.from.pendingChallenge = null;
				challenge.from.sendRoom('|tournament|update|{"challenging":null}');
			}
		}

		const matchFrom = player.inProgressMatch;
		if (matchFrom) {
			matchFrom.to.isBusy = false;
			player.inProgressMatch = null;
			matchFrom.room.parent = null;
			this.completedMatches.add(matchFrom.room.id);
			if (matchFrom.room.battle) matchFrom.room.battle.forfeit(player.name);
		}

		let matchTo = null;
		for (const playerFrom of this.players) {
			const match = playerFrom.inProgressMatch;
			if (match && match.to === player) matchTo = playerFrom;
		}
		if (matchTo) {
			matchTo.isBusy = false;
			const matchRoom = matchTo.inProgressMatch!.room;
			matchRoom.parent = null;
			this.completedMatches.add(matchRoom.id);
			if (matchRoom.battle) matchRoom.battle.forfeit(player.userid);
			matchTo.inProgressMatch = null;
		}

		if (isSelfDQ) {
			this.room.add(`|tournament|leave|${player.name}`);
		} else {
			this.room.add(`|tournament|disqualify|${player.name}`);
		}
		if (user) {
			user.sendTo(this.room, '|tournament|update|{"isJoined":false}');
			if (reason) {
				user.popup(`|modal|You have been disqualified from the tournament in ${this.room.title + (reason ? ':\n\n' + reason : '.')}`);
			}
		}
		this.isBracketInvalidated = true;
		this.isAvailableMatchesInvalidated = true;

		if (this.generator.isTournamentEnded()) {
			this.onTournamentEnd();
		} else {
			this.update();
		}

		return true;
	}

	setAutoStartTimeout(timeout: number, output: CommandContext) {
		if (this.isTournamentStarted) {
			output.sendReply('|tournament|error|AlreadyStarted');
			return false;
		}
		if (timeout < AUTO_START_MINIMUM_TIMEOUT || isNaN(timeout)) {
			output.sendReply('|tournament|error|InvalidAutoStartTimeout');
			return false;
		}

		if (this.autoStartTimer) clearTimeout(this.autoStartTimer);
		if (timeout === Infinity) {
			this.room.add('|tournament|autostart|off');
		} else {
			this.autoStartTimer = setTimeout(() => this.startTournament(output), timeout);
			this.room.add(`|tournament|autostart|on|${timeout}`);
		}
		this.autoStartTimeout = timeout;

		return true;
	}

	setAutoDisqualifyTimeout(timeout: number, output: CommandContext) {
		if (timeout < AUTO_DISQUALIFY_WARNING_TIMEOUT || isNaN(timeout)) {
			output.sendReply('|tournament|error|InvalidAutoDisqualifyTimeout');
			return false;
		}

		this.autoDisqualifyTimeout = timeout;
		if (this.autoDisqualifyTimeout === Infinity) {
			this.room.add('|tournament|autodq|off');
			if (this.autoDisqualifyTimer) clearTimeout(this.autoDisqualifyTimer);
			for (const player of this.players) player.autoDisqualifyWarned = false;
		} else {
			this.room.add(`|tournament|autodq|on|${this.autoDisqualifyTimeout}`);
			if (this.isTournamentStarted) this.runAutoDisqualify();
		}

		return true;
	}
	runAutoDisqualify(output?: CommandContext) {
		if (!this.isTournamentStarted) {
			if (output) output.sendReply('|tournament|error|NotStarted');
			return false;
		}
		if (this.autoDisqualifyTimer) clearTimeout(this.autoDisqualifyTimer);

		const now = Date.now();
		for (const player of this.players) {
			const time = player.lastActionTime;
			let availableMatches = false;
			if (player.availableMatches.size) availableMatches = true;
			const pendingChallenge = player.pendingChallenge;

			if (!availableMatches && !pendingChallenge) {
				player.autoDisqualifyWarned = false;
				continue;
			}
			if (pendingChallenge && pendingChallenge.to) continue;

			if (now > time + this.autoDisqualifyTimeout && player.autoDisqualifyWarned) {
				let reason;
				if (pendingChallenge && pendingChallenge.from) {
					reason = "You failed to accept your opponent's challenge in time.";
				} else {
					reason = "You failed to challenge your opponent in time.";
				}
				this.disqualifyUser(player.userid, output, reason);
				this.room.update();
			} else if (now > time + this.autoDisqualifyTimeout - AUTO_DISQUALIFY_WARNING_TIMEOUT) {
				if (player.autoDisqualifyWarned) continue;
				let remainingTime = this.autoDisqualifyTimeout - now + time;
				if (remainingTime <= 0) {
					remainingTime = AUTO_DISQUALIFY_WARNING_TIMEOUT;
					player.lastActionTime = now - this.autoDisqualifyTimeout + AUTO_DISQUALIFY_WARNING_TIMEOUT;
				}

				player.autoDisqualifyWarned = true;
				player.sendRoom(`|tournament|autodq|target|${remainingTime}`);
			} else {
				player.autoDisqualifyWarned = false;
			}
		}
		if (!this.isEnded) this.autoDisqualifyTimer = setTimeout(() => this.runAutoDisqualify(), this.autoDisqualifyTimeout);
	}

	async challenge(user: User, targetUserid: ID, output: CommandContext) {
		if (!this.isTournamentStarted) {
			output.sendReply('|tournament|error|NotStarted');
			return;
		}

		if (!(user.userid in this.playerTable)) {
			output.sendReply('|tournament|error|UserNotAdded');
			return;
		}

		if (!(targetUserid in this.playerTable)) {
			output.sendReply('|tournament|error|InvalidMatch');
			return;
		}

		const from = this.playerTable[user.userid];
		const to = this.playerTable[targetUserid];
		const availableMatches = from.availableMatches;
		if (!availableMatches || !availableMatches.has(to)) {
			output.sendReply('|tournament|error|InvalidMatch');
			return;
		}

		if (from.isBusy || to.isBusy) {
			this.room.add("Tournament backend breaks specifications. Please report this to an admin.");
			return;
		}

		from.isBusy = true;
		to.isBusy = true;

		this.isAvailableMatchesInvalidated = true;
		this.update();

		const ready = await Ladders(this.fullFormat).prepBattle(output.connection);
		if (!ready) {
			from.isBusy = false;
			to.isBusy = false;

			this.isAvailableMatchesInvalidated = true;
			this.update();
			return;
		}

		to.lastActionTime = Date.now();
		from.pendingChallenge = {to, team: ready.team};
		to.pendingChallenge = {from, team: ready.team};
		from.sendRoom(`|tournament|update|${JSON.stringify({challenging: to.name})}`);
		to.sendRoom(`|tournament|update|${JSON.stringify({challenged: from.name})}`);

		this.isBracketInvalidated = true;
		this.update();
	}
	cancelChallenge(user: User, output: CommandContext) {
		if (!this.isTournamentStarted) {
			if (output) output.sendReply('|tournament|error|NotStarted');
			return;
		}

		if (!(user.userid in this.playerTable)) {
			if (output) output.sendReply('|tournament|error|UserNotAdded');
			return;
		}

		const player = this.playerTable[user.userid];
		const challenge = player.pendingChallenge;
		if (!challenge || !challenge.to) return;

		player.isBusy = false;
		challenge.to.isBusy = false;
		player.pendingChallenge = null;
		challenge.to.pendingChallenge = null;
		user.sendTo(this.room, '|tournament|update|{"challenging":null}');
		challenge.to.sendRoom('|tournament|update|{"challenged":null}');

		this.isBracketInvalidated = true;
		this.isAvailableMatchesInvalidated = true;
		this.update();
	}
	async acceptChallenge(user: User, output: CommandContext) {
		if (!this.isTournamentStarted) {
			output.sendReply('|tournament|error|NotStarted');
			return;
		}

		if (!(user.userid in this.playerTable)) {
			output.sendReply('|tournament|error|UserNotAdded');
			return;
		}

		const player = this.playerTable[user.userid];
		const challenge = player.pendingChallenge;
		if (!challenge || !challenge.from) return;

		const ready = await Ladders(this.fullFormat).prepBattle(output.connection);
		if (!ready) return;

		// Prevent battles between offline users from starting
		const from = Users.get(challenge.from.userid);
		if (!from || !from.connected || !user.connected) return;

		// Prevent double accepts and users that have been disqualified while between these two functions
		if (!challenge.from.pendingChallenge) return;
		if (!player.pendingChallenge) return;

		const room = Rooms.createBattle(this.fullFormat, {
			isPrivate: this.room.isPrivate,
			p1: from,
			p1team: challenge.team,
			p2: user,
			p2team: ready.team,
			rated: !Ladders.disabled && this.isRated,
			tour: this,
		});
		if (!room || !room.battle) throw new Error(`Failed to create battle in ${room}`);

		challenge.from.pendingChallenge = null;
		player.pendingChallenge = null;
		from.sendTo(this.room, '|tournament|update|{"challenging":null}');
		user.sendTo(this.room, '|tournament|update|{"challenged":null}');

		challenge.from.inProgressMatch = {to: player, room};
		this.room.add(`|tournament|battlestart|${from.name}|${user.name}|${room.id}`).update();

		this.isBracketInvalidated = true;
		if (this.autoDisqualifyTimeout !== Infinity) this.runAutoDisqualify();
		if (this.forceTimer) room.battle.timer.start();
		this.update();
	}

	getDefaultCustomName() {
		return Dex.getFormat(this.fullFormat).name + " (with custom rules)";
	}
	forfeit(user: User) {
		return this.disqualifyUser(user.userid, null, "You left the tournament", true);
	}
	onConnect(user: User, connection: Connection) {
		this.updateFor(user, connection);
	}
	onUpdateConnection(user: User, connection: Connection) {
		this.updateFor(user, connection);
	}
	onRename(user: User, oldUserid: ID) {
		if (oldUserid in this.playerTable) {
			if (user.userid === oldUserid) {
				this.playerTable[user.userid].name = user.name;
			} else {
				this.playerTable[user.userid] = this.playerTable[oldUserid];
				this.playerTable[user.userid].userid = user.userid;
				this.playerTable[user.userid].name = user.name;
				delete this.playerTable[oldUserid];
			}
		}

		this.updateFor(user);
	}
	onBattleJoin(room: GameRoom, user: User) {
		if (!room.p1 || !room.p2) return;
		if (this.scouting || this.isEnded || user.latestIp === room.p1.latestIp || user.latestIp === room.p2.latestIp) return;
		if (user.can('makeroom')) return;
		for (const otherPlayer of this.getRemainingPlayers()) {
			const otherUser = Users.get(otherPlayer.userid);
			if (otherUser && otherUser.latestIp === user.latestIp) {
				return "Scouting is banned: tournament players can't watch other tournament battles.";
			}
		}
	}
	onBattleWin(room: GameRoom, winnerid: ID) {
		if (this.completedMatches.has(room.id)) return;
		this.completedMatches.add(room.id);
		room.parent = null;
		if (!room.battle) throw new Error("onBattleWin called without a battle");
		if (!room.p1 || !room.p2) throw new Error("onBattleWin called with missing players");
		const p1 = this.playerTable[room.p1.userid];
		const p2 = this.playerTable[room.p2.userid];
		const winner = this.playerTable[winnerid];
		const score = room.battle.score || [0, 0];

		let result: 'win' | 'loss' | 'draw' = 'draw';
		if (p1 === winner) {
			p1.score += 1;
			p1.wins += 1;
			p2.losses += 1;
			result = 'win';
		} else if (p2 === winner) {
			p2.score += 1;
			p2.wins += 1;
			p1.losses += 1;
			result = 'loss';
		}

		p1.isBusy = false;
		p2.isBusy = false;
		p1.inProgressMatch = null;

		this.isBracketInvalidated = true;
		this.isAvailableMatchesInvalidated = true;

		if (result === 'draw' && !this.generator.isDrawingSupported) {
			this.room.add(`|tournament|battleend|${p1.name}|${p2.name}|${result}|${score.join(',')}|fail|${room.id}`);

			if (this.autoDisqualifyTimeout !== Infinity) this.runAutoDisqualify();
			this.update();
			return this.room.update();
		}
		if (result === 'draw') {
			p1.score += 0.5;
			p2.score += 0.5;
		}
		p1.games += 1;
		p2.games += 1;
		if (!(p1.isDisqualified || p2.isDisqualified)) {
			// If a player was disqualified, handle the results there
			const error = this.generator.setMatchResult([p1, p2], result as 'win' | 'loss', score);
			if (error) {
				// Should never happen
				return this.room.add(`Unexpected ${error} from setMatchResult([${room.p1.userid}, ${room.p2.userid}], ${result}, ${score}) in onBattleWin(${room.id}, ${winnerid}). Please report this to an admin.`).update();
			}
		}
		this.room.add(`|tournament|battleend|${p1.name}|${p2.name}|${result}|${score.join(',')}|success|${room.id}`);

		if (this.generator.isTournamentEnded()) {
			if (!this.room.isPrivate && this.generator.name.includes('Elimination') && !Config.autosavereplays) {
				const uploader = Users.get(winnerid);
				if (uploader && uploader.connections[0]) {
					Chat.parse('/savereplay', room, uploader, uploader.connections[0]);
				}
			}
			this.onTournamentEnd();
		} else {
			if (this.autoDisqualifyTimeout !== Infinity) this.runAutoDisqualify();
			this.update();
		}
		this.room.update();
	}
	onTournamentEnd() {
		const update = {
			results: (this.generator.getResults() as TournamentPlayer[][]).map(usersToNames),
			format: this.name,
			generator: this.generator.name,
			bracketData: this.getBracketData(),
		};
		this.room.add(`|tournament|end|${JSON.stringify(update)}`);

		//
		// Tournament Winnings
		//

		const color = '#088cc7';
		let data = {results: this.generator.getResults().map(usersToNames), bracketData: this.getBracketData()};
		let data2 = data;
		data = data['results'].toString();

		let winner = '';
		let runnerUp = false;

		if (data.indexOf(',') >= 0) {
			data = data.split(',');
			winner = data[0];
		} else {
			winner = data;
		}

		if (data2['bracketData']['rootNode']) {
			if (data2['bracketData']['rootNode']['children']) {
				if (data2['bracketData']['rootNode']['children'][0]['team'] !== winner) runnerUp = data2['bracketData']['rootNode']['children'][0]['team'];
				if (data2['bracketData']['rootNode']['children'][1]['team'] !== winner) runnerUp = data2['bracketData']['rootNode']['children'][1]['team'];
			}
		}

		const wid = toID(winner);
		const rid = toID(runnerUp);
		const tourSize = this.players.length;

		if (tourSize >= 4 && this.room.isOfficial) {
			let firstMoney = Math.round(tourSize / 2);
			let secondMoney = Math.round(firstMoney / 2);
			if (firstMoney < 2) firstMoney = 2;
			if (secondMoney < 1) secondMoney = 1;

			Economy.writeMoney(wid, firstMoney, () => {
				Economy.readMoney(wid, () => {
					if (Users.get(wid) && Users.get(wid).connected) {
						Users.get(wid).popup(`|html|You have received ${firstMoney} ${(firstMoney === 1 ? global.moneyName : global.moneyPlural)} from winning the tournament.`);
					}
					Economy.logTransaction(`${Chat.escapeHTML(winner)} has won ${firstMoney} ${(firstMoney === 1 ? global.moneyName : global.moneyPlural)} from a tournament.`);
				});
			});

			if (Server.getFaction(winner)) {
				const factionName = Server.getFaction(winner);
				const factionId = toID(factionName);
				Db.factionbank.set(factionId, Db.factionbank.get(factionId, 0) + 10);
				this.room.addRaw(`<strong>Congratulations to ${factionName}! Your faction has gained 10 faction money (points)! To view it type /faction bank atm (faction).</strong>`);
			}

			this.room.addRaw(`${Server.nameColor(winner, true)} <strong>has won <font color='${color}'>${firstMoney}</font> ${(firstMoney === 1 ? global.moneyName : global.moneyPlural)} for winning the tournament!</strong>`);

			if (runnerUp) {
				Economy.writeMoney(rid, secondMoney, () => {
					Economy.readMoney(rid, newAmount => {
						if (Users.get(rid) && Users.get(rid).connected) {
							Users.get(rid).popup(`|html|You have received ${secondMoney} ${(secondMoney === 1 ? global.moneyName : global.moneyPlural)} from winning the tournament.`);
						}
						Economy.logTransaction(`${Chat.escapeHTML(runnerUp)} has won ${secondMoney} ${(secondMoney === 1 ? global.moneyName : global.moneyPlural)} from a tournament.`);
					});
				});
				this.room.addRaw(`${Server.nameColor(runnerUp, true)} <strong>has won <font color='${color}'>${secondMoney}</font> ${(secondMoney === 1 ? global.moneyName : global.moneyPlural)} for coming in second in the tournament!</strong>`);
			}
		}
		this.remove();
	}
}

function getGenerator(generator: string | undefined) {
	generator = toID(generator);
	switch (generator) {
	case 'elim': generator = 'elimination'; break;
	case 'rr': generator = 'roundrobin'; break;
	}
	return TournamentGenerators[generator as 'elimination' | 'roundrobin'];
}

function createTournamentGenerator(
	generatorName: string | undefined, modifier: string | undefined, output: CommandContext
) {
	const generator = getGenerator(generatorName);
	if (!generator) {
		output.errorReply(`${generatorName} is not a valid type.`);
		const generatorNames = Object.keys(TournamentGenerators).join(', ');
		output.errorReply(`Valid types: ${generatorNames}`);
		return;
	}
	return new generator(modifier || '');
}
function createTournament(
	room: ChatRoom | GameRoom, formatId: string | undefined, generator: string | undefined, playerCap: string | undefined,
	isRated: boolean, generatorMod: string | undefined, name: string | undefined, output: CommandContext
) {
	if (room.type !== 'chat') {
		output.errorReply("Tournaments can only be created in chat rooms.");
		return;
	}
	if (room.game) {
		output.errorReply(`You cannot have a tournament until the current room activity is over: ${room.game.title}`);
		return;
	}
	if (Rooms.global.lockdown) {
		output.errorReply("The server is restarting soon, so a tournament cannot be created.");
		return;
	}
	const format = Dex.getFormat(formatId);
	if (format.effectType !== 'Format' || !format.tournamentShow) {
		output.errorReply(`${format.id} is not a valid tournament format.`);
		const formats = Object.values(Dex.formats).filter(f => f.tournamentShow).map(f => f.name).join(', ');
		output.errorReply(`Valid formats: ${formats}`);
		return;
	}
	if (!getGenerator(generator)) {
		output.errorReply(`${generator} is not a valid type.`);
		const generators = Object.keys(TournamentGenerators).join(', ');
		output.errorReply(`Valid types: ${generators}`);
		return;
	}
	if (playerCap && parseInt(playerCap) < 2) {
		output.errorReply("You cannot have a player cap that is less than 2.");
		return;
	}
	const tour = room.game = new Tournament(
		room, format, createTournamentGenerator(generator, generatorMod, output)!, playerCap, isRated, name
	);
	return tour;
}

const commands: {basic: TourCommands, creation: TourCommands, moderation: TourCommands} = {
	basic: {
		j: 'join',
		in: 'join',
		join(tournament, user) {
			tournament.addUser(user, this);
		},
		l: 'leave',
		out: 'leave',
		leave(tournament, user) {
			if (tournament.isTournamentStarted) {
				if (tournament.getRemainingPlayers().some(player => player.userid === user.userid)) {
					tournament.disqualifyUser(user.userid, this, null, true);
				} else {
					this.errorReply("You have already been eliminated from this tournament.");
				}
			} else {
				tournament.removeUser(user.userid, this);
			}
		},
		getusers(tournament) {
			if (!this.runBroadcast()) return;
			const users = usersToNames(tournament.getRemainingPlayers().sort());
			this.sendReplyBox(`<strong>${users.length}/${tournament.players.length} users remain in this tournament:</strong><br />${Chat.escapeHTML(users.join(', '))}`);
		},
		getupdate(tournament, user) {
			tournament.updateFor(user);
			this.sendReply("Your tournament bracket has been updated.");
		},
		challenge(tournament, user, params, cmd) {
			if (params.length < 1) {
				return this.sendReply(`Usage: ${cmd} <user>`);
			}
			// tslint:disable-next-line: no-floating-promises
			tournament.challenge(user, toID(params[0]), this);
		},
		cancelchallenge(tournament, user) {
			tournament.cancelChallenge(user, this);
		},
		acceptchallenge(tournament, user) {
			// tslint:disable-next-line: no-floating-promises
			tournament.acceptChallenge(user, this);
		},
		vtm(tournament, user, params, cmd, connection) {
			if (Monitor.countPrepBattle(connection.ip, connection)) {
				return;
			}
			// tslint:disable-next-line: no-floating-promises
			TeamValidatorAsync.get(tournament.fullFormat).validateTeam(user.team).then(result => {
				if (result.charAt(0) === '1') {
					connection.popup("Your team is valid for this tournament.");
				} else {
					const formatName = Dex.getFormat(tournament.baseFormat).name;
					// split/join is the easiest way to do a find/replace with an untrusted string, sadly
					const reasons = result.slice(1).split(formatName).join('this tournament');
					connection.popup(`Your team was rejected for the following reasons:\n\n- ${reasons.replace(/\n/g, '\n- ')}`);
				}
			});
		},
		viewruleset: 'viewcustomrules',
		viewbanlist: 'viewcustomrules',
		viewrules: 'viewcustomrules',
		viewcustomrules(tournament) {
			if (!this.runBroadcast()) return;
			if (tournament.customRules.length < 1) {
				return this.errorReply("The tournament does not have any custom rules.");
			}
			this.sendReply(`|html|<div class='infobox infobox-limited'>This tournament includes:<br />${tournament.getCustomRules()}</div>`);
		},
	},
	creation: {
		settype(tournament, user, params, cmd) {
			if (params.length < 1) {
				return this.sendReply(`Usage: ${cmd} <type> [, <comma-separated arguments>]`);
			}
			const playerCap = parseInt(params.splice(1, 1)[0]);
			const generator = createTournamentGenerator(params.shift(), params.shift(), this);
			if (generator && tournament.setGenerator(generator, this)) {
				if (playerCap && playerCap >= 2) {
					tournament.playerCap = playerCap;
					if (Config.tourdefaultplayercap && tournament.playerCap > Config.tourdefaultplayercap) {
						Monitor.log(`[TourMonitor] Room ${tournament.room.id} starting a tour over default cap (${tournament.playerCap})`);
					}
					this.room.send(`|tournament|update|{"playerCap": "${playerCap}"}`);
				} else if (tournament.playerCap && !playerCap) {
					tournament.playerCap = 0;
					this.room.send(`|tournament|update|{"playerCap": "${playerCap}"}`);
				}
				const capNote = (tournament.playerCap ? ' with a player cap of ' + tournament.playerCap : '');
				this.privateModAction(`(${user.name} set tournament type to ${generator.name + capNote}.)`);
				this.modlog('TOUR SETTYPE', null, generator.name + capNote);
				this.sendReply(`Tournament set to ${generator.name + capNote}.`);
			}
		},
		cap: 'setplayercap',
		playercap: 'setplayercap',
		setcap: 'setplayercap',
		setplayercap(tournament, user, params, cmd) {
			if (params.length < 1) {
				if (tournament.playerCap) {
					return this.sendReply(`Usage: ${cmd} <cap>; The current player cap is ${tournament.playerCap}`);
				} else {
					return this.sendReply(`Usage: ${cmd} <cap>`);
				}
			}
			if (tournament.isTournamentStarted) {
				return this.errorReply("The player cap cannot be changed once the tournament has started.");
			}
			const option = params[0].toLowerCase();
			if (['0', 'infinity', 'off', 'false', 'stop', 'remove'].includes(option)) {
				if (!tournament.playerCap) return this.errorReply("The tournament does not have a player cap.");
				params[0] = '0';
			}
			const playerCap = parseInt(params[0]);
			if (playerCap === 0) {
				tournament.playerCap = 0;
				this.privateModAction(`(${user.name} removed the tournament's player cap.)`);
				this.modlog('TOUR PLAYERCAP', null, 'removed');
				this.sendReply("Tournament cap removed.");
			} else {
				if (isNaN(playerCap) || playerCap < 2) {
					return this.errorReply("The tournament cannot have a player cap less than 2.");
				}
				if (playerCap === tournament.playerCap) {
					return this.errorReply(`The tournament's player cap is already ${playerCap}.`);
				}
				tournament.playerCap = playerCap;
				if (Config.tourdefaultplayercap && tournament.playerCap > Config.tourdefaultplayercap) {
					Monitor.log(`[TourMonitor] Room ${tournament.room.id} starting a tour over default cap (${tournament.playerCap})`);
				}
				this.privateModAction(`(${user.name} set the tournament's player cap to ${tournament.playerCap}.)`);
				this.modlog('TOUR PLAYERCAP', null, tournament.playerCap.toString());
				this.sendReply(`Tournament cap set to ${tournament.playerCap}.`);
			}
			this.room.send(`|tournament|update|{"playerCap": "${tournament.playerCap}"}`);
		},
		end: 'delete',
		stop: 'delete',
		delete(tournament, user) {
			tournament.forceEnd();
			this.privateModAction(`(${user.name} forcibly ended a tournament.)`);
			this.modlog('TOUR END');
		},
		ruleset: 'customrules',
		banlist: 'customrules',
		rules: 'customrules',
		customrules(tournament, user, params, cmd) {
			if (cmd === 'banlist') {
				return this.errorReply('The new syntax is: /tour rules -bannedthing, +unbannedthing, !removedrule, addedrule');
			}
			if (params.length < 1) {
				this.sendReply("Usage: /tour rules <list of rules>");
				this.sendReply("Rules can be: -bannedthing, +unbannedthing, !removedrule, addedrule");
				return this.parse('/tour viewrules');
			}
			if (tournament.isTournamentStarted) {
				return this.errorReply("The custom rules cannot be changed once the tournament has started.");
			}
			if (tournament.setCustomRules(params, this)) {
				this.room.addRaw(`<div class='infobox infobox-limited'>This tournament includes:<br />${tournament.getCustomRules()}</div>`);
				this.privateModAction(`(${user.name} updated the tournament's custom rules.)`);
				this.modlog('TOUR RULES', null, tournament.customRules.join(', '));
			}
		},
		clearruleset: 'clearcustomrules',
		clearbanlist: 'clearcustomrules',
		clearrules: 'clearcustomrules',
		clearcustomrules(tournament, user) {
			if (tournament.isTournamentStarted) {
				return this.errorReply("The custom rules cannot be changed once the tournament has started.");
			}
			if (tournament.customRules.length < 1) {
				return this.errorReply("The tournament does not have any custom rules.");
			}
			tournament.customRules = [];
			tournament.fullFormat = tournament.baseFormat;
			if (tournament.name === tournament.getDefaultCustomName()) {
				tournament.name = tournament.baseFormat;
				this.room.send(`|tournament|update|${JSON.stringify({format: tournament.name})}`);
				tournament.update();
			}
			this.room.addRaw(`<b>The tournament's custom rules were cleared.</b>`);
			this.privateModAction(`(${user.name} cleared the tournament's custom rules.)`);
			this.modlog('TOUR CLEARRULES');
		},
		name: 'setname',
		customname: 'setname',
		setname(tournament, user, params, cmd) {
			if (params.length < 1) {
				return this.sendReply(`Usage: ${cmd} <comma-separated arguments>`);
			}
			let name = this.canTalk(params[0].trim());
			if (!name || typeof name !== 'string') return;
			name = Chat.escapeHTML(name);
			if (name.length > MAX_CUSTOM_NAME_LENGTH) {
				return this.errorReply(`The tournament's name cannot exceed ${MAX_CUSTOM_NAME_LENGTH} characters.`);
			}
			if (name.includes('|')) return this.errorReply("The tournament's name cannot include the | symbol.");
			tournament.name = name;
			this.room.send(`|tournament|update|${JSON.stringify({format: tournament.name})}`);
			this.privateModAction(`(${user.name} set the tournament's name to ${tournament.name}.)`);
			this.modlog('TOUR NAME', null, tournament.name);
			tournament.update();
		},
		resetname: 'clearname',
		clearname(tournament, user) {
			if (tournament.name === tournament.baseFormat) return this.errorReply("The tournament does not have a name.");
			tournament.name = tournament.baseFormat;
			this.room.send(`|tournament|update|${JSON.stringify({format: tournament.name})}`);
			this.privateModAction(`(${user.name} cleared the tournament's name.)`);
			this.modlog('TOUR CLEARNAME');
			tournament.update();
		},
	},
	moderation: {
		begin: 'start',
		start(tournament, user) {
			if (tournament.startTournament(this)) {
				this.room.sendMods(`(${user.name} started the tournament.)`);
			}
		},
		dq: 'disqualify',
		disqualify(tournament, user, params, cmd) {
			if (params.length < 1) {
				return this.sendReply(`Usage: ${cmd} <user>`);
			}
			const targetUser = Users.get(params[0]);
			const targetUserid = toID(targetUser);
			let reason = '';
			if (params[1]) {
				reason = params[1].trim();
				if (reason.length > MAX_REASON_LENGTH) {
					return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
				}
			}
			if (tournament.disqualifyUser(targetUserid, this, reason)) {
				this.privateModAction(`(${(targetUser ? targetUser.name : targetUserid)} was disqualified from the tournament by ${user.name} ${(reason ? ' (' + reason + ')' : '')})`);
				this.modlog('TOUR DQ', targetUserid, reason);
			}
		},
		sub: 'replace',
		replace(tournament, user, params, cmd) {
			const oldUser = Users.get(params[0]);
			const newUser = Users.get(params[1]);
			if (!oldUser) return this.errorReply(`User ${params[0]} not found.`);
			if (!newUser) return this.errorReply(`User ${params[1]} not found.`);

			tournament.replaceUser(oldUser, newUser, this);
		},
		autostart: 'setautostart',
		setautostart(tournament, user, params, cmd) {
			if (params.length < 1) {
				return this.sendReply(`Usage: ${cmd} <on|minutes|off>`);
			}
			const option = params[0].toLowerCase();
			if (this.meansYes(option) || option === 'start') {
				if (tournament.isTournamentStarted) {
					return this.errorReply("The tournament has already started.");
				} else if (!tournament.playerCap) {
					return this.errorReply("The tournament does not have a player cap set.");
				} else {
					if (tournament.autostartcap) {
						return this.errorReply("The tournament is already set to autostart when the player cap is reached.");
					}
					tournament.autostartcap = true;
					this.room.add(`The tournament will start once ${tournament.playerCap} players have joined.`);
					this.privateModAction(`(The tournament was set to autostart when the player cap is reached by ${user.name})`);
					this.modlog('TOUR AUTOSTART', null, 'when playercap is reached');
				}
			} else {
				if (option === '0' || option === 'infinity' || this.meansNo(option) || option === 'stop' || option === 'remove') {
					if (!tournament.autostartcap && tournament.autoStartTimeout === Infinity) {
						return this.errorReply("The automatic tournament start timer is already off.");
					}
					params[0] = 'off';
					tournament.autostartcap = false;
				}
				const timeout = params[0].toLowerCase() === 'off' ? Infinity : params[0];
				if (tournament.setAutoStartTimeout(Number(timeout) * 60 * 1000, this)) {
					this.privateModAction(`(The tournament auto start timer was set to  ${params[0]} by ${user.name})`);
					this.modlog('TOUR AUTOSTART', null, timeout === Infinity ? 'off' : params[0]);
				}
			}
		},
		autodq: 'setautodq',
		setautodq(tournament, user, params, cmd) {
			if (params.length < 1) {
				if (tournament.autoDisqualifyTimeout !== Infinity) {
					return this.sendReply(`Usage: ${cmd} <minutes|off>; The current automatic disqualify timer is set to ${(tournament.autoDisqualifyTimeout / 1000 / 60)} minute(s)`);
				} else {
					return this.sendReply(`Usage: ${cmd} <minutes|off>`);
				}
			}
			if (params[0].toLowerCase() === 'infinity' || params[0] === '0') params[0] = 'off';
			const timeout = params[0].toLowerCase() === 'off' ? Infinity : Number(params[0]) * 60 * 1000;
			if (timeout === tournament.autoDisqualifyTimeout) {
				return this.errorReply(`The automatic tournament disqualify timer is already set to ${params[0]} minute(s).`);
			}
			if (tournament.setAutoDisqualifyTimeout(timeout, this)) {
				this.privateModAction(`(The tournament auto disqualify timer was set to ${params[0]} by ${user.name})`);
				this.modlog('TOUR AUTODQ', null, timeout === Infinity ? 'off' : params[0]);
			}
		},
		runautodq(tournament, user) {
			if (tournament.autoDisqualifyTimeout === Infinity) {
				return this.errorReply("The automatic tournament disqualify timer is not set.");
			}
			tournament.runAutoDisqualify(this);
			this.roomlog(`${user.name} used /tour runautodq`);
		},
		scout: 'setscouting',
		scouting: 'setscouting',
		setscout: 'setscouting',
		setscouting(tournament, user, params, cmd) {
			if (params.length < 1) {
				if (tournament.scouting) {
					return this.sendReply("This tournament allows spectating other battles while in a tournament.");
				} else {
					return this.sendReply("This tournament disallows spectating other battles while in a tournament.");
				}
			}

			const option = params[0].toLowerCase();
			if (this.meansYes(option) || option === 'allow' || option === 'allowed') {
				if (tournament.scouting) return this.errorReply("Scouting for this tournament is already set to allowed.");
				tournament.scouting = true;
				tournament.modjoin = false;
				this.room.add('|tournament|scouting|allow');
				this.privateModAction(`(The tournament was set to allow scouting by ${user.name})`);
				this.modlog('TOUR SCOUT', null, 'allow');
			} else if (this.meansNo(option) || option === 'disallow' || option === 'disallowed') {
				if (!tournament.scouting) return this.errorReply("Scouting for this tournament is already disabled.");
				tournament.scouting = false;
				tournament.modjoin = true;
				this.room.add('|tournament|scouting|disallow');
				this.privateModAction(`(The tournament was set to disallow scouting by ${user.name})`);
				this.modlog('TOUR SCOUT', null, 'disallow');
			} else {
				return this.sendReply(`Usage: ${cmd}<allow|disallow>`);
			}
		},
		modjoin: 'setmodjoin',
		setmodjoin(tournament, user, params, cmd) {
			if (params.length < 1) {
				if (tournament.modjoin) {
					return this.sendReply("This tournament allows players to modjoin their battles.");
				} else {
					return this.sendReply("This tournament does not allow players to modjoin their battles.");
				}
			}

			const option = params[0].toLowerCase();
			if (this.meansYes(option) || option === 'allow' || option === 'allowed') {
				if (tournament.modjoin) return this.errorReply("Modjoining is already allowed for this tournament.");
				tournament.modjoin = true;
				this.room.add("Modjoining is now allowed (Players can modjoin their tournament battles).");
				this.privateModAction(`(The tournament was set to allow modjoin by ${user.name})`);
				this.modlog('TOUR MODJOIN', null, option);
			} else if (this.meansNo(option) || option === 'disallow' || option === 'disallowed') {
				if (!tournament.modjoin) return this.errorReply("Modjoining is already not allowed for this tournament.");
				tournament.modjoin = false;
				this.room.add("Modjoining is now banned (Players cannot modjoin their tournament battles).");
				this.privateModAction(`(The tournament was set to disallow modjoin by ${user.name})`);
				this.modlog('TOUR MODJOIN', null, option);
			} else {
				return this.sendReply(`Usage: ${cmd} <allow|disallow>`);
			}
		},
		forcetimer(tournament, user, params, cmd) {
			const option = params.length ? params[0].toLowerCase() : 'on';
			if (this.meansYes(option)) {
				tournament.forceTimer = true;
				this.room.add('Forcetimer is now on for the tournament.');
				this.privateModAction(`(The timer was turned on for the tournament by ${user.name})`);
				this.modlog('TOUR FORCETIMER', null, 'ON');
			} else if (this.meansNo(option) || option === 'stop') {
				tournament.forceTimer = false;
				this.room.add('Forcetimer is now off for the tournament.');
				this.privateModAction(`(The timer was turned off for the tournament by ${user.name})`);
				this.modlog('TOUR FORCETIMER', null, 'ON');
			} else {
				return this.sendReply(`Usage: ${cmd} <on|off>`);
			}
		},
		banuser(tournament, user, params, cmd) {
			if (params.length < 1) {
				return this.sendReply(`Usage: ${cmd} <user>, <reason>`);
			}
			let targetUser: User | string | null = Users.get(params[0]);
			const online = !!targetUser;
			if (!online) targetUser = params[0];
			if (!targetUser) return false;

			const targetUserid = toID(targetUser);
			let reason = '';
			if (params[1]) {
				reason = params[1].trim();
				if (reason.length > MAX_REASON_LENGTH) {
					return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
				}
			}

			if (tournament.checkBanned(targetUser)) return this.errorReply("This user is already banned from tournaments.");

			const punishment: [string, ID, number, string] =
				['TOURBAN', targetUserid, Date.now() + TOURBAN_DURATION, reason];
			if (online) {
				Punishments.roomPunish(this.room, targetUser as User, punishment);
			} else {
				Punishments.roomPunishName(this.room, targetUserid, punishment);
			}
			tournament.removeBannedUser(targetUserid);
			this.modlog('TOUR BAN', targetUser, reason);
			if (reason) reason = ` (${reason})`;
			this.privateModAction(`${typeof targetUser !== 'string' ? targetUser.name : targetUserid} was banned from joining tournaments by ${user.name}.${reason}`);
		},
		unbanuser(tournament, user, params, cmd) {
			if (params.length < 1) {
				return this.sendReply(`Usage: ${cmd} <user>`);
			}
			const targetUser = Users.get(params[0]) || params[0];
			const targetUserid = toID(targetUser);

			if (!tournament.checkBanned(targetUserid)) return this.errorReply("This user isn't banned from tournaments.");

			if (targetUser) { Punishments.roomUnpunish(this.room, targetUserid, 'TOURBAN', false); }
			tournament.removeBannedUser(targetUserid);
			this.privateModAction(`${typeof targetUser !== 'string' ? targetUser.name : targetUserid} was unbanned from joining tournaments by ${user.name}.`);
			this.modlog('TOUR UNBAN', targetUser, null, {noip: 1, noalts: 1});
		},
		remind(tournament, user) {
			let users = tournament.generator.getAvailableMatches().toString().split(',');
			let offlineUsers = [];
			for (let u = 0; u < users.length; u++) {
				let targetUser = Users.get(users[u]);
				if (!targetUser) {
					offlineUsers.push(users[u]);
					continue;
				} else if (!targetUser.connected) {
					offlineUsers.push(targetUser.userid);
					continue;
				} else {
					let pmName = `~${Config.serverName} Server`;
					let message = `|pm|${pmName}|${user.getIdentity()}|You have a tournament battle in the room "${tournament.room.title}". If you do not start soon you may be disqualified.`;
					targetUser.send(message);
				}
			}
			if (tournament.isTournamentStarted) {
				tournament.room.addRaw(`<strong>Players have been reminded of their tournament battles by</strong> ${Server.nameColor(user.name, true)}.`);
				if (offlineUsers.length > 0 && offlineUsers !== '') tournament.room.addRaw(`<strong>The following users are currently offline: ${Chat.toListString(offlineUsers.map(p => { return Server.nameColor(p, true, true)}))}.</strong>`);
			} else {
				this.errorReply(`The tournament hasn't started yet.`);
			}
		},
	},
};

Chat.loadPlugins();
const chatCommands: ChatCommands = {
	tour: 'tournament',
	tours: 'tournament',
	tournaments: 'tournament',
	tournament(target, room, user, connection) {
		let cmd;
		[cmd, target] = Chat.splitFirst(target, ' ');
		cmd = toID(cmd);

		let params = target.split(',').map(param => param.trim());
		if (!params[0]) params = [];

		if (cmd === '') {
			if (!this.runBroadcast()) return;
			const update = [];
			for (const tourRoom of Rooms.rooms.values()) {
				if (!tourRoom.game || tourRoom.game.gameid !== 'tournament') continue;
				if (tourRoom.isPrivate || tourRoom.isPersonal || tourRoom.staffRoom) continue;
				const tournament = tourRoom.game as Tournament;
				update.push({
					room: tourRoom.id, title: room.title, format: tournament.name,
					generator: tournament.generator.name, isStarted: tournament.isTournamentStarted,
				});
			}
			this.sendReply(`|tournaments|info|${JSON.stringify(update)}`);
		} else if (cmd === 'help') {
			return this.parse('/help tournament');
		} else if (this.meansYes(cmd)) {
			if (!this.can('gamemanagement', null, room)) return;
			const rank = params[0];
			if (rank === '@') {
				if (room.toursEnabled === true) {
					return this.errorReply("Tournaments are already enabled for @ and above in this room.");
				}
				room.toursEnabled = true;
				if (room.chatRoomData) {
					room.chatRoomData.toursEnabled = true;
					Rooms.global.writeChatRoomData();
				}
				return this.sendReply("Tournaments are now enabled for @ and up.");
			} else if (rank === '%') {
				if (room.toursEnabled === rank) {
					return this.errorReply("Tournaments are already enabled for % and above in this room.");
				}
				room.toursEnabled = rank;
				if (room.chatRoomData) {
					room.chatRoomData.toursEnabled = rank;
					Rooms.global.writeChatRoomData();
				}
				return this.sendReply("Tournaments are now enabled for % and up.");
			} else {
				return this.errorReply("Tournament enable setting not recognized.  Valid options include [%|@].");
			}
		} else if (this.meansNo(cmd)) {
			if (!this.can('gamemanagement', null, room)) return;
			if (!room.toursEnabled) {
				return this.errorReply("Tournaments are already disabled.");
			}
			room.toursEnabled = false;
			if (room.chatRoomData) {
				room.chatRoomData.toursEnabled = false;
				Rooms.global.writeChatRoomData();
			}
			return this.sendReply("Tournaments are now disabled.");
		} else if (cmd === 'announce' || cmd === 'announcements') {
			if (!this.can('gamemanagement', null, room)) return;
			if (!Config.tourannouncements.includes(room.id)) {
				return this.errorReply("Tournaments in this room cannot be announced.");
			}
			if (params.length < 1) {
				if (room.tourAnnouncements) {
					return this.sendReply("Tournament announcements are enabled.");
				} else {
					return this.sendReply("Tournament announcements are disabled.");
				}
			}

			const option = params[0].toLowerCase();
			if (this.meansYes(option)) {
				if (room.tourAnnouncements) return this.errorReply("Tournament announcements are already enabled.");
				room.tourAnnouncements = true;
				this.privateModAction(`(Tournament announcements were enabled by ${user.name})`);
				this.modlog('TOUR ANNOUNCEMENTS', null, 'ON');
			} else if (this.meansNo(option)) {
				if (!room.tourAnnouncements) return this.errorReply("Tournament announcements are already disabled.");
				room.tourAnnouncements = false;
				this.privateModAction(`(Tournament announcements were disabled by ${user.name})`);
				this.modlog('TOUR ANNOUNCEMENTS', null, 'OFF');
			} else {
				return this.sendReply(`Usage: ${cmd} <on|off>`);
			}

			if (room.chatRoomData) {
				room.chatRoomData.tourAnnouncements = room.tourAnnouncements;
				Rooms.global.writeChatRoomData();
			}
		} else if (cmd === 'create' || cmd === 'new') {
			if (room.toursEnabled === true) {
				if (!this.can('tournaments', null, room)) return;
			} else if (room.toursEnabled === '%') {
				if (!this.can('gamemoderation', null, room)) return;
			} else {
				if (!user.can('gamemanagement', null, room)) {
					return this.errorReply(`Tournaments are disabled in this room (${room.id}).`);
				}
			}
			if (params.length < 2) {
				return this.sendReply(`Usage: ${cmd} <format>, <type> [, <comma-separated arguments>]`);
			}

			const tour: Tournament | undefined = createTournament(
				room, params.shift(), params.shift(), params.shift(), Config.ratedtours, params.shift(), params.shift(), this
			);
			if (tour) {
				this.privateModAction(`(${user.name} created a tournament in ${tour.baseFormat} format.)`);
				this.modlog('TOUR CREATE', null, tour.baseFormat);
				if (room.tourAnnouncements) {
					const tourRoom = Rooms.search(Config.tourroom || 'tournaments');
					if (tourRoom && tourRoom !== room) {
						tourRoom.addRaw(`<div class="infobox"><a href="/${room.id}" class="ilink"><strong>${Chat.escapeHTML(Dex.getFormat(tour.name).name)}</strong> tournament created in <strong>${Chat.escapeHTML(room.title)}</strong>.</a></div>`).update();
					}
				}
			}
		} else {
			const tournament = (room.game && room.game.gameid === 'tournament') ? room.game as Tournament : null;
			if (!tournament) {
				return this.sendReply("There is currently no tournament running in this room.");
			}

			let commandHandler = commands.basic[cmd];
			if (commandHandler) {
				if (typeof commandHandler === 'string') commandHandler = commands.basic[commandHandler];
			} else if (commands.creation[cmd]) {
				if (room.toursEnabled === true) {
					if (!this.can('tournaments', null, room)) return;
				} else if (room.toursEnabled === '%') {
					if (!this.can('gamemoderation', null, room)) return;
				} else {
					if (!user.can('gamemanagement', null, room)) {
						return this.errorReply(`Tournaments are disabled in this room (${room.id}).`);
					}
				}
				commandHandler = commands.creation[cmd];
				if (typeof commandHandler === 'string') commandHandler = commands.creation[commandHandler];
			} else if (commands.moderation[cmd]) {
				if (!user.can('gamemoderation', null, room)) {
					return this.errorReply(`${cmd} -  Access denied.`);
				}
				commandHandler = commands.moderation[cmd];
				if (typeof commandHandler === 'string') commandHandler = commands.moderation[commandHandler];
			}

			if (typeof commandHandler === 'string') throw new Error(`Invalid tour command alis ${cmd}`);
			if (!commandHandler) {
				this.errorReply(`${cmd} is not a tournament command.`);
			} else {
				commandHandler.call(this, tournament, user, params, cmd, connection);
			}
		}
	},
	tournamenthelp() {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`- create/new &lt;format>, &lt;type>, [ &lt;comma-separated arguments>]: Creates a new tournament in the current room.<br />` +
			`- settype &lt;type> [, &lt;comma-separated arguments>]: Modifies the type of tournament after it's been created, but before it has started.<br />` +
			`- cap/playercap &lt;cap>: Sets the player cap of the tournament before it has started.<br />` +
			`- rules/banlist &lt;comma-separated arguments>: Sets the custom rules for the tournament before it has started.<br />` +
			`- viewrules/viewbanlist: Shows the custom rules for the tournament.<br />` +
			`- clearrules/clearbanlist: Clears the custom rules for the tournament before it has started.<br />` +
			`- name &lt;name>: Sets a custom name for the tournament.<br />` +
			`- clearname: Clears the custom name of the tournament.<br />` +
			`- end/stop/delete: Forcibly ends the tournament in the current room.<br />` +
			`- begin/start: Starts the tournament in the current room.<br />` +
			`- autostart/setautostart &lt;on|minutes|off>: Sets the automatic start timeout.<br />` +
			`- dq/disqualify &lt;user>: Disqualifies a user.<br />` +
			`- autodq/setautodq &lt;minutes|off>: Sets the automatic disqualification timeout.<br />` +
			`- runautodq: Manually run the automatic disqualifier.<br />` +
			`- scouting &lt;allow|disallow>: Specifies whether joining tournament matches while in a tournament is allowed.<br />` +
			`- modjoin &lt;allow|disallow>: Specifies whether players can modjoin their battles.<br />` +
			`- forcetimer &lt;on|off>: Turn on the timer for tournament battles.<br />` +
			`- getusers: Lists the users in the current tournament.<br />` +
			`- on/enable &lt;%|@>: Enables allowing drivers or mods to start tournaments in the current room.<br />` +
			`- off/disable: Disables allowing drivers and mods to start tournaments in the current room.<br />` +
			`- announce/announcements &lt;on|off>: Enables/disables tournament announcements for the current room.<br />` +
			`- banuser/unbanuser &lt;user>: Bans/unbans a user from joining tournaments in this room. Lasts 2 weeks.<br />` +
			`- remind: Reminds the user's that are online about the tournament in this room.  Sends a list of the offline users as well.<br />` +
			`- sub/replace &lt;olduser>, &lt;newuser>: Substitutes a new user for an old one<br />` +
			`More detailed help can be found <a href="https://www.smogon.com/forums/threads/3570628/#post-6777489">here</a>`
		);
	},
};
Object.assign(Chat.commands, chatCommands);

export const Tournaments = {
	TournamentGenerators,
	TournamentPlayer,
	Tournament,
	createTournament,
	commands,
};
