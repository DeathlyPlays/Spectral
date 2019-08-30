'use strict';

/*********************************************************
   * Team Tournaments Chat-plugin
   * Made by: Ecuacion, Updated and Translated by: AlfaStorm
   *********************************************************/

let teamTours = {};
Server.teamTours = teamTours;
let tourTiers = {};
tourTiers['multitier'] = "Multi-Tier";
for (let i in Dex.formats) {
	if (Dex.formats[i].effectType === 'Format' && Dex.formats[i].challengeShow) {
		tourTiers[toID(i)] = Dex.formats[i].name;
	}
}

function getTours() {
	if (!teamTours) {
		return `There is no team tournament in progress.`;
	}
	let tourList = ``;
	for (let w in teamTours) {
		if (teamTours[w].tourRound === 0) {
			tourList += `<a class="ilink" href="/${w}"> Team Tournament in format ${teamTours[w].format} between ${teamTours[w].teamA} and ${teamTours[w].teamB} in the room ${w}</a><br />`;
		} else {
			tourList += `<a class="ilink" href="/${w}"> Team Tournament in format ${teamTours[w].format} between ${teamTours[w].teamA} and ${teamTours[w].teamB} in the room ${w} (Started)</a><br />`;
		}
	}
	if (!tourList || tourList === '') {
		return `There is no team tournament in progress.`;
	}
	return tourList;
}

function findTourFromMatchup(p1, p2, format, battleLink) {
	p1 = toID(p1);
	p2 = toID(p2);
	for (let i in teamTours) {
		if (teamTours[i].tourRound === 0) continue;
		if (toID(teamTours[i].format) !== toID(format) && toID(teamTours[i].format) !== 'multitier') continue;
		for (let j in teamTours[i].matchups) {
			if (teamTours[i].matchups[j].result === 1 && battleLink !== teamTours[i].matchups[j].battleLink) continue;
			if (teamTours[i].matchups[j].result > 1) continue;
			if (toID(teamTours[i].matchups[j].from) === p1 && toID(teamTours[i].matchups[j].to) === p2) return {tourId: i, matchupId: j};
			if (toID(teamTours[i].matchups[j].from) === p2 && toID(teamTours[i].matchups[j].to) === p1) return {tourId: i, matchupId: j};
		}
	}
	return false;
}

function findMatchup(room, user) {
	let roomId = toID(room);
	let userId = toID(user);
	if (!teamTours[roomId]) return false;
	for (let i in teamTours[roomId].matchups) {
		if (userId === toID(teamTours[roomId].matchups[i].from) || userId === toID(teamTours[roomId].matchups[i].to)) {
			return i;
		}
	}
	return false;
}

function getTourData(room) {
	let roomId = toID(room);
	if (!teamTours[roomId]) return false;
	let data = {
		teamA: teamTours[roomId].teamA,
		teamB: teamTours[roomId].teamB,
		authA: teamTours[roomId].authA,
		authB: teamTours[roomId].authB,
		matchups: teamTours[roomId].matchups,
		byes: teamTours[roomId].byes,
		teamWithByes: teamTours[roomId].teamWithByes,
		teamAMembers: teamTours[roomId].teamAMembers,
		teamBMembers: teamTours[roomId].teamBMembers,
		format: teamTours[roomId].format,
		size: teamTours[roomId].size,
		type: teamTours[roomId].type,
		tourRound: teamTours[roomId].tourRound,
	};
	return data;
}

function getFreePlaces(room) {
	let roomId = toID(room);
	if (!teamTours[roomId]) {
		return 0;
	}
	let membersA = teamTours[roomId].size;
	let membersB = teamTours[roomId].size;
	let registeredA = Object.keys(teamTours[roomId].teamAMembers);
	let registeredB = Object.keys(teamTours[roomId].teamBMembers);
	if (registeredA) {
		membersA = teamTours[roomId].size - registeredA.length;
	}
	if (registeredB) {
		membersB = teamTours[roomId].size - registeredB.length;
	}
	return membersA + membersB;
}

function getAvailableMembers(avaliableMembers) {
	if (!avaliableMembers) return false;
	return Object.keys(avaliableMembers);
}

function newTeamTour(room, type, format, size, teamA, teamB, authA, authB) {
	let roomId = toID(room);
	teamTours[roomId] = {
		teamA: teamA,
		teamB: teamB,
		authA: authA,
		authB: authB,
		matchups: {},
		byes: {},
		teamWithByes: false,
		teamAMembers: {},
		teamBMembers: {},
		format: format,
		size: parseInt(size),
		type: toID(type),
		tourRound: 0,
	};
	return true;
}

function joinable(room, user) {
	let roomId = toID(room);
	let userId = toID(user);
	if (teamTours[roomId].teamAMembers[userId] || teamTours[roomId].teamBMembers[userId]) return false;
	return true;
}

function joinTeamTour(room, user, team) {
	let roomId = toID(room);
	let userId = toID(user);
	if (!teamTours[roomId]) return `There was no team tournament in this room.`;
	if (teamTours[roomId].tourRound !== 0) return `The tournament has already begun. You cannot join.`;
	if (teamTours[roomId].type === 'lineups') return `Teams must be registered by the team captains in this tournament.`;
	if (!joinable(room, user)) return `You were already enrolled in this tournament. To play for another team you must first leave.`;
	let registeredA = Object.keys(teamTours[roomId].teamAMembers);
	let registeredB = Object.keys(teamTours[roomId].teamBMembers);
	if (toID(team) === toID(teamTours[roomId].teamA) && registeredA.length < teamTours[roomId].size) {
		teamTours[roomId].teamAMembers[userId] = 1;
		return false;
	}
	if (toID(team) === toID(teamTours[roomId].teamB) && registeredB.length < teamTours[roomId].size) {
		teamTours[roomId].teamBMembers[userId] = 1;
		return false;
	}
	return `There are no places left for the specified team.`;
}

function regParticipants(room, user, source) {
	let roomId = toID(room);
	let userId = toID(user);
	let params = source.split(',');
	if (!teamTours[roomId]) return `There was no team tournament in this room.`;
	if (teamTours[roomId].tourRound !== 0) return `The tournament has already begun. You cannot register lineups.`;
	if (teamTours[roomId].type !== 'lineups') return `This is not a lineup tournament.`;
	let lineup = {};
	let oldLineup = {};
	if (params.length < (teamTours[roomId].size + 1)) return `You must specify the complete lineup.`;
	let targetUser;
	if (toID(user) === toID(teamTours[roomId].authA)) oldLineup = teamTours[roomId].teamBMembers;
	if (toID(user) === toID(teamTours[roomId].authB)) oldLineup = teamTours[roomId].teamAMembers;
	for (let n = 0; n < teamTours[roomId].size; ++n) {
		targetUser = Users.get(params[n + 1]);
		if (!targetUser || !targetUser.connected) return `${toID(params[n + 1])} does not exist or is not available. All users of the lineup must be online.`;
		if (oldLineup[toID(targetUser.name)] || lineup[toID(targetUser.name)]) return `${toID(params[n + 1])} was already on another team or you have written their name twice.`;
		lineup[toID(targetUser.name)] = 1;
	}
	if (userId === toID(teamTours[roomId].authA)) teamTours[roomId].teamAMembers = lineup;
	if (userId === toID(teamTours[roomId].authB)) teamTours[roomId].teamBMembers = lineup;
	return false;
}

function sizeTeamTour(room, size) {
	let roomId = toID(room);
	size = parseInt(size);
	if (size < 2) return `The tournament size is not valid.`;
	if (!teamTours[roomId]) return `There was no team tournament in this room.`;
	if (teamTours[roomId].tourRound !== 0) return `The tournament has already begun. You cannot change the size.`;
	let registeredA = Object.keys(teamTours[roomId].teamAMembers);
	let registeredB = Object.keys(teamTours[roomId].teamBMembers);
	if (registeredA.length <= size && registeredB.length <= size) {
		teamTours[roomId].size = size;
		return false;
	}
	return `Too many users have registered to resize the tournament.`;
}

function setAuth(room, authA, authB) {
	let roomId = toID(room);
	if (!teamTours[roomId]) return `There was no team tournament in this room.`;
	if (teamTours[roomId].type !== 'lineups') return `This is not a lineup tournament.`;
	teamTours[roomId].authA = authA;
	teamTours[roomId].authB = authB;
	return false;
}

function leaveTeamTour(room, user) {
	let roomId = toID(room);
	let userId = toID(user);
	if (!teamTours[roomId]) return `There was no team tournament in this room.`;
	if (!teamTours[roomId].teamAMembers[userId] && !teamTours[roomId].teamBMembers[userId]) return `You were not enrolled in the tournament.`;
	if (teamTours[roomId].tourRound !== 0) {
		if (!dqTeamTour(room, user, 'cmd')) return `You had already been disqualified or passed to the next round`;
		Rooms.get(roomId).addRaw(`<b>${user}</b> has disqualified themselves from the team tournament.`);
		if (isRoundEnded(roomId)) {
			autoEnd(roomId);
		}
		return `You have left the tournament.`;
	} else {
		if (teamTours[roomId].type === 'lineups') return `Teams must be registered by team captains in this tournament.`;
		if (teamTours[roomId].teamAMembers[userId]) delete teamTours[roomId].teamAMembers[userId];
		if (teamTours[roomId].teamBMembers[userId]) delete teamTours[roomId].teamBMembers[userId];
	}
	return false;
}

function startTeamTour(room) {
	let roomId = toID(room);
	let teamAMembers;
	let teamBMembers;
	if (!teamTours[roomId]) return false;
	if (teamTours[roomId].type === 'lineups') {
		teamAMembers = getAvailableMembers(teamTours[roomId].teamAMembers);
		teamBMembers = getAvailableMembers(teamTours[roomId].teamBMembers);
	} else {
		teamAMembers = Dex.shuffle(getAvailableMembers(teamTours[roomId].teamAMembers));
		teamBMembers = Dex.shuffle(getAvailableMembers(teamTours[roomId].teamBMembers));
	}
	let memberCount = Math.min(teamAMembers.length, teamBMembers.length);
	let matchups = {};
	for (let m = 0; m < memberCount; ++m) {
		matchups[toID(teamAMembers[m])] = {from: teamAMembers[m], to: teamBMembers[m], battleLink: '', result: 0};
	}
	teamTours[roomId].matchups = matchups;
	teamTours[roomId].tourRound = 1;
	return true;
}

function newRound(room) {
	let roomId = toID(room);
	if (!teamTours[roomId]) return false;
	let avaliableMembersA = [];
	let avaliableMembersB = [];
	for (let m in teamTours[roomId].matchups) {
		if (teamTours[roomId].matchups[m].result === 2) {
			avaliableMembersA.push(toID(teamTours[roomId].matchups[m].from));
		} else if (teamTours[roomId].matchups[m].result === 3) {
			avaliableMembersB.push(toID(teamTours[roomId].matchups[m].to));
		}
	}
	for (let s in teamTours[roomId].byes) {
		if (toID(teamTours[roomId].teamWithByes) === toID(teamTours[roomId].teamA)) {
			avaliableMembersA.push(toID(s));
		} else {
			avaliableMembersB.push(toID(s));
		}
	}
	if (avaliableMembersA) avaliableMembersA = Dex.shuffle(avaliableMembersA);
	if (avaliableMembersB) avaliableMembersB = Dex.shuffle(avaliableMembersB);
	let memberCount = Math.min(avaliableMembersA.length, avaliableMembersB.length);
	let totalMemberCount = Math.max(avaliableMembersA.length, avaliableMembersB.length);
	let matchups = {};
	for (let m = 0; m < memberCount; ++m) {
		matchups[toID(avaliableMembersA[m])] = {from: avaliableMembersA[m], to: avaliableMembersB[m], battleLink: '', result: 0};
	}
	let byes = {};
	if (avaliableMembersA.length > avaliableMembersB.length) {
		teamTours[roomId].teamWithByes = teamTours[roomId].teamA;
	} else if (avaliableMembersA.length < avaliableMembersB.length) {
		teamTours[roomId].teamWithByes = teamTours[roomId].teamB;
	} else {
		teamTours[roomId].teamWithByes = false;
	}
	for (let m = memberCount; m < totalMemberCount; ++m) {
		if (avaliableMembersA.length > avaliableMembersB.length) byes[toID(avaliableMembersA[m])] = 1;
		if (avaliableMembersA.length < avaliableMembersB.length) byes[toID(avaliableMembersB[m])] = 1;
	}
	teamTours[roomId].matchups = matchups;
	teamTours[roomId].byes = byes;
	++teamTours[roomId].tourRound;
	Rooms.get(roomId).addRaw(viewTourStatus(roomId));
}

function autoEnd(room) {
	let roomId = toID(room);
	if (!teamTours[roomId]) return false;
	let scoreA = 0;
	let scoreB = 0;
	let nMatchups = 0;
	let nByes = 0;
	for (let b in teamTours[roomId].matchups) {
		++nMatchups;
		if (teamTours[roomId].matchups[b].result === 2) {
			++scoreA;
		} else if (teamTours[roomId].matchups[b].result === 3) {
			++scoreB;
		}
	}
	if (teamTours[roomId].type === 'total') {
		if (scoreA === 0 || scoreB === 0) {
			if (scoreA === 0) {
				if (toID(teamTours[roomId].teamWithByes) === toID(teamTours[roomId].teamA)) {
					newRound(roomId);
					return;
				}
				scoreB = teamTours[roomId].size;
				scoreA = teamTours[roomId].size - nMatchups - nByes;
			} else if (scoreB === 0) {
				if (toID(teamTours[roomId].teamWithByes) === toID(teamTours[roomId].teamB)) {
					newRound(roomId);
					return;
				}
				scoreA = teamTours[roomId].size;
				scoreB = teamTours[roomId].size - nMatchups - nByes;
			}
		} else {
			newRound(roomId);
			return;
		}
	}
	//raw of end
	let htmlEndTour = ``;
	if (scoreA > scoreB) {
		htmlEndTour = `<br><hr /><h2><font color="green"><center>Congratulations <font color="black">${teamTours[roomId].teamA}</font>!</center></font></h2><h2><font color="green"><center>You have won the Team Tournament in ${teamTours[roomId].format} against <font color="black">${teamTours[roomId].teamB}</font>!</center></font></h2><hr />`;
	} else if (scoreA < scoreB) {
		htmlEndTour = `<br><hr /><h2><font color="green"><center>Congratulations <font color="black">${teamTours[roomId].teamB}</font>!</center></font></h2><h2><font color="green"><center>You have won the Team Tournament in ${teamTours[roomId].format} against <font color="black">${teamTours[roomId].teamA}</font>!</center></font></h2><hr />`;
	} else if (scoreA === scoreB) {
		htmlEndTour = `<br><hr /><h2><font color="green"><center>The Team Tournament in format ${teamTours[roomId].format} between <font color="black">${teamTours[roomId].teamA}</font> and <font color="black">${teamTours[roomId].teamB}</font> has ended in a Draw!</center></font></h2><hr />`;
	}
	Rooms.get(roomId).addRaw(viewTourStatus(roomId) + htmlEndTour);
	endTeamTour(roomId);
}

function isRoundEnded(room) {
	let roomId = toID(room);
	if (!teamTours[roomId]) return false;

	for (let m in teamTours[roomId].matchups) {
		if (teamTours[roomId].matchups[m].result < 2) {
			return false;
		}
	}
	return true;
}

function setActiveMatchup(room, matchup, battlelink) {
	let roomId = toID(room);
	let matchupId = toID(matchup);
	if (!teamTours[roomId] || !teamTours[roomId].matchups[matchupId]) return false;
	teamTours[roomId].matchups[matchupId].result = 1;
	teamTours[roomId].matchups[matchupId].battleLink = battlelink;
	return true;
}

function dqTeamTour(room, user, forced) {
	let roomId = toID(room);
	let userId = toID(user);
	if (!teamTours[roomId]) return false;
	for (let i in teamTours[roomId].matchups) {
		if (userId === toID(teamTours[roomId].matchups[i].from) || userId === toID(teamTours[roomId].matchups[i].to)) {
			if (teamTours[roomId].matchups[i].result < 2) {
				if (userId === toID(teamTours[roomId].matchups[i].from)) teamTours[roomId].matchups[i].result = 3;
				if (userId === toID(teamTours[roomId].matchups[i].to)) teamTours[roomId].matchups[i].result = 2;
				if (forced !== 'cmd' && isRoundEnded(roomId)) {
					autoEnd(roomId);
				}
				return true;
			}
		}
	}
	return false;
}

function invalidate(room, matchup) {
	let roomId = toID(room);
	let matchupId = toID(matchup);
	if (!teamTours[roomId] || !teamTours[roomId].matchups[matchupId]) return false;
	teamTours[roomId].matchups[matchupId].result = 0;
	teamTours[roomId].matchups[matchupId].battleLink = '';
	return true;
}

function replaceParticipant(room, p1, p2) {
	let roomId = toID(room);
	if (!teamTours[roomId]) return `There was no team tournament in the room.`;
	if (!teamTours[roomId].tourRound === 0) return `The tournament had not started`;
	let matchupId = findMatchup(room, p1);
	if (!matchupId) return `The user was not participating in any tournament battle.`;
	if (teamTours[roomId].matchups[matchupId].result > 0) return `Cannot be replaced if battle has already begun.`;
	if (teamTours[roomId].teamAMembers[p1]) {
		delete teamTours[roomId].teamAMembers[p1];
		teamTours[roomId].teamAMembers[p2] = 1;
	}
	if (teamTours[roomId].teamBMembers[p1]) {
		delete teamTours[roomId].teamBMembers[p1];
		teamTours[roomId].teamBMembers[p2] = 1;
	}
	if (toID(teamTours[roomId].matchups[matchupId].from) === toID(p1)) teamTours[roomId].matchups[matchupId].from = p2;
	if (toID(teamTours[roomId].matchups[matchupId].to) === toID(p1)) teamTours[roomId].matchups[matchupId].to = p2;
	return false;
}

function endTeamTour(room) {
	let roomId = toID(room);
	if (!teamTours[roomId]) return false;
	delete teamTours[roomId];
	return true;
}

function viewTourStatus(room) {
	let roomId = toID(room);
	if (!teamTours[roomId]) return `There is no team tournament in this room.`;
	let rawStatus = '';
	if (teamTours[roomId].tourRound === 0) {
		switch (teamTours[roomId].type) {
		case 'standard':
			rawStatus = `<hr /><h2><font color="green"> Join the Standard Team Tournament of format ${teamTours[roomId].format} between ${teamTours[roomId].teamA} and ${teamTours[roomId].teamB}.</font></h2> <button name="send" value="/tt join, ${teamTours[roomId].teamA}">Join ${teamTours[roomId].teamA}</button>&nbsp;<button name="send" value="/tt join, ${teamTours[roomId].teamB}">Join ${teamTours[roomId].teamB}</button><br /><b><font color="blueviolet">Members per team:</font></b> ${teamTours[roomId].size}<br /><font color="blue"><b>FORMAT:</b></font> ${teamTours[roomId].format}<hr /><br /><font color="red"><b>Remember to keep your name for the entire duration of the tournament.</b></font>`;
			break;
		case 'total':
			rawStatus = `<hr /><h2><font color="green"> Join the Total Team Tournament of format ${teamTours[roomId].format} between ${teamTours[roomId].teamA} and ${teamTours[roomId].teamB}.</font></h2> <button name="send" value="/tt join, ${teamTours[roomId].teamA}">Join ${teamTours[roomId].teamA}</button>&nbsp;<button name="send" value="/tt join, ${teamTours[roomId].teamB}">Join ${teamTours[roomId].teamB}</button><br /><b><font color="blueviolet">Members per team:</font></b> ${teamTours[roomId].size}<br /><font color="blue"><b>FORMAT:</b></font> ${teamTours[roomId].format}<hr /><br /><font color="red"><b>Remember to keep your name for the entire duration of the tournament.</b></font>`;
			break;
		case 'lineups':
			rawStatus = `<hr /><h2><font color="green">Team Tournament with Lineups of format ${teamTours[roomId].format} between ${teamTours[roomId].teamA} and ${teamTours[roomId].teamB}.</font></h2><b><font color="orange">Team Captains: </font>${teamTours[roomId].authA} and ${teamTours[roomId].authB}</font></b> <br /><b><font color="blueviolet">Members per team:</font></b> ${teamTours[roomId].size}<br /><font color="blue"><b>FORMAT:</b></font> ${teamTours[roomId].format}<hr /><br /><font color="red"><b>Remember to keep your name for the entire duration of the tournament. <br />The captains must use /tt reg, [member1], [member2]... to register the lineups.</b></font>`;
		}
		return rawStatus;
	} else {
		//round
		let htmlSource = `<hr /><h3><center><font color=green><big>Tournament between ${teamTours[roomId].teamA} and ${teamTours[roomId].teamB}</big></font></center></h3><center><b>FORMAT:</b> ${teamTours[roomId].format}</center><hr /><center><small><font color=red>Red</font> = disqualified or lost battle, <font color=green>Green</font> = won their battle, <a class='ilink'><b>URL</b></a> = battling</small></center><br />`;
		if (teamTours[roomId].type === 'total') htmlSource = `<hr /><h3><center><font color=green><big>Tournament between ${teamTours[roomId].teamA} and ${teamTours[roomId].teamB} (Total)</big></font></center></h3><center><b>FORMAT:</b> ${teamTours[roomId].format}</center><hr /><center><small><font color=red>Red</font> = disqualified or lost battle, <font color=green>Green</font> = won their battle, <a class='ilink'><b>URL</b></a> = battling</small></center><br />`;
		for (let t in teamTours[roomId].byes) {
			let userFreeBye = Users.getExact(t);
			if (!userFreeBye) { userFreeBye = t; } else { userFreeBye = userFreeBye.name; }
			htmlSource += `<center><small><font color=green>${userFreeBye} has moved on to the next round.</font></small></center><br />`;
		}
		let matchupsTable = `<table  align="center" border="0" cellpadding="0" cellspacing="0">`;
		for (let i in teamTours[roomId].matchups) {
			let userk = Users.getExact(teamTours[roomId].matchups[i].from);
			if (!userk) { userk = teamTours[roomId].matchups[i].from; } else { userk = userk.name; }
			let userf = Users.getExact(teamTours[roomId].matchups[i].to);
			if (!userf) { userf = teamTours[roomId].matchups[i].to; } else { userf = userf.name; }
			switch (teamTours[roomId].matchups[i].result) {
			case 0:
				matchupsTable += `<tr><td  align="right"><big>${userk}</big></td><td>&nbsp;vs&nbsp;</td><td><big align="left">${userf}</big></td></tr>`;
				break;
			case 1:
				matchupsTable += `<tr><td  align="right"><a href="/${teamTours[roomId].matchups[i].battleLink}" room ="${teamTours[roomId].matchups[i].battleLink}" class="ilink"><b><big>${userk}</big></b></a></td><td>&nbsp;<a href="/${teamTours[roomId].matchups[i].battleLink}" room ="${teamTours[roomId].matchups[i].battleLink}" class="ilink">vs</a>&nbsp;</td><td><a href="/${teamTours[roomId].matchups[i].battleLink}" room ="${teamTours[roomId].matchups[i].battleLink}" class="ilink"><b><big align="left">${userf}</big></b></a></td></tr>`;
				break;
			case 2:
				matchupsTable += `<tr><td  align="right"><font color="green"><b><big>${userk}</big></b></font></td><td>&nbsp;vs&nbsp;</td><td><font color="red"><b><big align="left">${userf}</big></b></font></td></tr>`;
				break;
			case 3:
				matchupsTable += `<tr><td  align="right"><font color="red"><b><big>${userk}</big></b></font></td><td>&nbsp;vs&nbsp;</td><td><font color="green"><b><big align="left">${userf}</big></b></font></td></tr>`;
				break;
			}
		}
		matchupsTable += `</table><hr />`;
		htmlSource += matchupsTable;
		return htmlSource;
	}
}

/*********************************************************
 * Commands
 *********************************************************/
let cmds = {
	teamtournament: 'teamtour',
	tt: 'teamtour',
	teamtour(target, room, user, connection) {
		let roomId = room.id;
		let params;
		if (!target) {
			params = ['round'];
		} else {
			params = target.split(',');
		}
		switch (toID(params[0])) {
		case 'search':
			if (!this.runBroadcast()) return false;
			this.sendReplyBox(getTours());
			break;
		case 'help':
			if (!this.runBroadcast()) return false;
			this.sendReplyBox(
				`<font size = 2>Team Tournaments</font><br />` +
				`This is a tournament system in which one team faces another. This system is available for all rooms and is can be managed by these ranks @, #, & and ~.<br />` +
				`The commands are found in / teamtour or / tt and are the following:<br />` +
				`<ul><li>/teamtour new, [standard/total/lineups], [tier/multitier], [size], [teamA], [teamB] - Create a team tournament.</li>` +
				`<li>/teamtour end - Ends a team tournament.</li>` +
				`<li>/teamtour join, [team] - Command to join the team tournament.</li>` +
				`<li>/teamtour leave - Command to leave the tournament.</li>` +
				`<li>/teamtour o /tt - Shows the status of the team tournament.</li>` +
				`<li>/teamtour dq, [user] - Command to disqualify.</li>` +
				`<li>/teamtour replace, [user1], [user2] - Command to replace.</li>` +
				`<li>/teamtour invalidate, [participant] - Command to invalidate a battle or a result.</li>` +
				`<li>/teamtour size, [Players per team] - Changes the team tournament size.</li>` +
				`<li>/teamtour auth, [Captain1], [Captain2] - Set the team captains in a tournament by lineups.</li>` +
				`<li>/teamtour reg, [P1], [P2]... - Command to register lineups, only usable by the captains.</li>` +
				`<li>/teamtour start - Starts a tournament once the lineups are registered.</li>` +
				`<li>/teamtour search - Shows all Team tournaments on the server.</li>` +
				`</ul>`);
			break;
		case 'new':
		case 'create':
			if (params.length < 6) return this.sendReply(`Usage: /teamtour new, [standard/total/lineups], [tier/multitier], [size], [teamA], [teamB]`);
			if (!this.can('ban', room)) return false;
			if (getTourData(roomId)) return this.sendReply(`There was already a team tournament in this room.`);
			let size = parseInt(params[3]);
			if (size < 2) return this.sendReply(`Minimum must be 2 player per team.`);
			let format = tourTiers[toID(params[2])];
			if (!format) return this.sendReply(`Format is not valid.`);
			switch (toID(params[1])) {
			case 'standard':
				newTeamTour(room.id, 'standard', format, size, Chat.escapeHTML(params[4]), Chat.escapeHTML(params[5]));
				this.privateModAction(`${user.name} has started a standard tournament between teams ${toID(params[4])} and ${toID(params[5])} of format ${format}.`);
				Rooms.get(room.id).addRaw(`<hr /><h2><font color="green">${user.name} has started a Standard Team Tournament of format ${format} between ${Chat.escapeHTML(params[4])} and ${Chat.escapeHTML(params[5])}.</font></h2> <button name="send" value="/tt join, ${Chat.escapeHTML(params[4])}">Join ${Chat.escapeHTML(params[4])}</button>&nbsp;<button name="send" value="/tt join, ${Chat.escapeHTML(params[5])}">Join ${Chat.escapeHTML(params[5])}</button><br /><b><font color="blueviolet">Members per team:</font></b> ${size}<br /><font color="blue"><b>FORMAT:</b></font> ${format}<hr /><br /><font color="red"><b>Remember to keep your name for the entire duration of the tournament.</b></font>`);
				break;
			case 'total':
				newTeamTour(room.id, 'total', format, size, Chat.escapeHTML(params[4]), Chat.escapeHTML(params[5]));
				this.privateModAction(`${user.name} has started a total tournament between teams ${toID(params[4])} and ${toID(params[5])} of format ${format}.`);
				Rooms.get(room.id).addRaw(`<hr /><h2><font color="green">${user.name} has started a Total Team Tournament of format ${format} between ${Chat.escapeHTML(params[4])} and ${Chat.escapeHTML(params[5])}.</font></h2> <button name="send" value="/tt join, ${Chat.escapeHTML(params[4])}">Join ${Chat.escapeHTML(params[4])}</button>&nbsp;<button name="send" value="/tt join, ${Chat.escapeHTML(params[5])}">Join ${Chat.escapeHTML(params[5])}</button><br /><b><font color="blueviolet">Members per team:</font></b> ${size}<br /><font color="blue"><b>FORMAT:</b></font> ${format}<hr /><br /><font color="red"><b>Remember to keep your name for the entire duration of the tournament.</b></font>`);
				break;
			case 'lineups':
				if (params.length < 8) return this.sendReply(`Usage: /teamtour new, lineups, [tier/multitier], [size], [teamA], [teamB], [captain1], [captain2]`);
				let userCapA = Users.getExact(params[6]);
				if (!userCapA) return this.sendReply(`The user ${Chat.escapeHTML(params[6])} is not available.`);
				let userCapB = Users.getExact(params[7]);
				if (!userCapB) return this.sendReply(`The user ${Chat.escapeHTML(params[7])} is not available.`);
				newTeamTour(room.id, 'lineups', format, size, Chat.escapeHTML(params[4]), Chat.escapeHTML(params[5]), userCapA.name, userCapB.name);
				this.privateModAction(`${user.name} has started a tournament with lineups between the teams ${toID(params[4])} and ${toID(params[5])} of format ${format}.`);
				Rooms.get(room.id).addRaw(`<hr /><h2><font color="green">${user.name} has started a Team Tournament with Lineups of format ${format} between ${Chat.escapeHTML(params[4])} and ${Chat.escapeHTML(params[5])}.</font></h2><b><font color="orange">Team Captains: </font>${userCapA.name} and ${userCapB.name}</font></b> <br /><b><font color="blueviolet">Members per team:</font></b> ${size}<br /><font color="blue"><b>FORMAT:</b></font> ${format}<hr /><br /><font color="red"><b>Remember to keep your name for the entire duration of the tournament. <br />The captains must use /tt reg, [member1], [member2]... to register the lineups.</b></font>`);
			default:
				return this.sendReply(`The type of tournament should be one of these: [standard/total/lineups]`);
			}
			break;
		case 'end':
		case 'finish':
		case 'delete':
			if (!this.can('ban', room)) return false;
			let tourData = getTourData(roomId);
			if (!tourData) return this.sendReply(`There was no team tournament in this room`);
			this.privateModAction(`${user.name} has cancelled the team tournament between ${toID(tourData.teamA)} and ${toID(tourData.teamB)}.`);
			Rooms.get(room.id).addRaw(`<hr /><center><h2><font color="green">${user.name} has cancelled the tournament between ${tourData.teamA} and ${tourData.teamB}.</h2></font></center><hr />`);
			endTeamTour(roomId);
			break;
		case 'j':
		case 'join':
			if (params.length < 2) return this.sendReply(`Usage: /teamtour join, [team]`);
			let err = joinTeamTour(roomId, user.name, params[1]);
			if (err) return this.sendReply(err);
			let tourData2 = getTourData(roomId);
			let teamJoining = tourData2.teamA.trim();
			if (toID(params[1]) === toID(tourData2.teamB)) teamJoining = tourData2.teamB.trim();
			let freePlaces = getFreePlaces(roomId);
			if (freePlaces > 0) {
				Rooms.get(room.id).addRaw(`<b>${user.name}</b> has joined the team tournament (${teamJoining}). There are ${freePlaces} spots left.`);
			} else {
				Rooms.get(room.id).addRaw(`<b>${user.name}</b> has joined the team tournament (${teamJoining}). Tournament will now begin!`);
				startTeamTour(roomId);
				Rooms.get(room.id).addRaw(viewTourStatus(roomId));
			}
			break;
		case 'l':
		case 'leave':
			let err2 = leaveTeamTour(roomId, user.name);
			if (err2) return this.sendReply(err2);
			let freePlaces2 = getFreePlaces(roomId);
			Rooms.get(room.id).addRaw(`<b>${user.name}</b> has left the team tournament. There are ${freePlaces2} spots left.`);
			break;
		case 'auth':
			if (!this.can('ban', room)) return false;
			if (params.length < 3) return this.sendReply(`Usage: /teamtour auth, [Captain1], [Captain2]`);
			let userCapA = Users.getExact(params[1]);
			if (!userCapA) return this.sendReply(`The user ${Chat.escapeHTML(params[6])} is not available.`);
			let userCapB = Users.getExact(params[2]);
			if (!userCapB) return this.sendReply(`The user ${Chat.escapeHTML(params[7])} is not available.`);
			let err3 = setAuth(roomId, params[1], params[2]);
			if (err3) return this.sendReply(err3);
			this.privateModCommand(`(${user.name} has changed the captains of the team tournament.)`);
			break;
		case 'lineup':
		case 'register':
		case 'reg':
			let tourData3 = getTourData(roomId);
			if (!tourData3) return this.sendReply(`There was no team tournament in this room`);
			if (toID(user.name) !== toID(tourData3.authA) && toID(user.name) !== toID(tourData3.authB)) return this.sendReply(`You must be captain of one of the two teams to do this.`);
			let err4 = regParticipants(roomId, user.name, target);
			if (err4) return this.sendReply(err4);
			if (toID(user.name) === toID(tourData3.authA)) Rooms.get(room.id).addRaw(`${user.name} has registered the lineups for ${tourData3.teamA}.`);
			if (toID(user.name) === toID(tourData3.authB)) Rooms.get(room.id).addRaw(`${user.name} has registered the lineups for ${tourData3.teamB}.`);
			break;
		case 'begin':
		case 'start':
			if (!this.can('ban', room)) return false;
			let tourData4 = getTourData(roomId);
			if (!tourData4) return this.sendReply(`There was not team tournament in this room`);
			if (tourData4.tourRound !== 0) return this.sendReply(`The tournament has already started.`);
			let freePlaces3 = getFreePlaces(roomId);
			if (freePlaces3 > 0) return this.sendReply(`There are still spots available.`);
			startTeamTour(roomId);
			Rooms.get(room.id).addRaw(viewTourStatus(roomId));
			break;
		case 'size':
			if (!this.can('ban', room)) return false;
			if (params.length < 2) return this.sendReply(`Usage: /teamtour size, [size]`);
			let err5 = sizeTeamTour(roomId, params[1]);
			if (err5) return this.sendReply(err5);
			let freePlaces4 = getFreePlaces(roomId);
			if (freePlaces4 > 0) {
				Rooms.get(room.id).addRaw(`<b>${user.name}</b> has changed the tournament size to ${parseInt(params[1])}. There are ${freePlaces4} spots left.`);
			} else {
				Rooms.get(room.id).addRaw(`<b>${user.name}</b> has changed the tournament size to ${parseInt(params[1])}. Tournament will not begin!`);
				startTeamTour(roomId);
				Rooms.get(room.id).addRaw(viewTourStatus(roomId));
			}
			break;
		case 'disqualify':
		case 'dq':
			if (!this.can('ban', room)) return false;
			if (params.length < 2) return this.sendReply(`Usage: /teamtour dq, [user]`);
			let tourData5 = getTourData(roomId);
			if (!tourData5) return this.sendReply(`There was no team tournament in this room`);
			if (!dqTeamTour(roomId, params[1], 'cmd')) return this.sendReply(`Could not disqualify user.`);
			let userk = Users.getExact(params[1]);
			if (userk) userk = userk.name; else userk = toID(params[1]);
			this.addModAction(`${userk} has been disqualified from the team tournament by ${user.name}.`);
			if (isRoundEnded(roomId)) {
				autoEnd(roomId);
			}
			break;
		case 'replace':
			if (!this.can('ban', room)) return false;
			if (params.length < 3) return this.sendReply(`Usage: /teamtour replace, [userA], [userB]`);
			let usera = Users.getExact(params[1]);
			if (usera) usera = usera.name; else usera = toID(params[1]);
			let userb = Users.getExact(params[2]);
			if (userb) {
				userb = userb.name;
			} else {
				return this.sendReply(`The user you are replacing with must be online.`);
			}
			let err6 = replaceParticipant(roomId, params[1], params[2]);
			if (err6) return this.sendReply(err6);
			this.addModAction(`${user.name}: ${usera} has been replaced for ${userb} in the team tournament.`);
			break;
		case 'invalidate':
			if (!this.can('ban', room)) return false;
			if (params.length < 2) return this.sendReply(`Usage: /teamtour invalidate, [user]`);
			let tourData6 = getTourData(roomId);
			if (!tourData6) return this.sendReply(`There was no team tournament in this room`);
			let matchupId = findMatchup(roomId, params[1]);
			if (!invalidate(roomId, matchupId)) return this.sendReply(`Could not invalidate the result. It is possible a result has not been established yet.`);
			this.addModAction(`The battle between ${tourData6.matchups[matchupId].from} and ${tourData6.matchups[matchupId].to} was invalidated by ${user.name}.`);
			break;
		case 'round':
			if (!this.runBroadcast()) return false;
			return this.sendReply(`|raw|${viewTourStatus(roomId)}`);
		default:
			this.sendReply(`This command does not exist. Try using /teamtour help for assistance.`);
		}
	},
};

exports.commands = cmds;

/*********************************************************
 * Events
 *********************************************************/

if (!Rooms.__createBattle) Rooms.__createBattle = Rooms.createBattle;
Rooms.createBattle = function (formatid, options) {
	let room = this.__createBattle(formatid, options);
	const players = [options.p1, options.p2, options.p3, options.p4].filter(user => user);
	options.format = formatid;
	const p1 = players[0];
	const p2 = players[1];
	const p1name = p1 ? p1.name : "Player 1";
	const p2name = p2 ? p2.name : "Player 2";
	if (!room) return;
	//tour
	let matchup = findTourFromMatchup(p1name, p2name, options.format, room);
	if (matchup) {
		room.teamTour = 1;
		setActiveMatchup(matchup.tourId, matchup.matchupId, room);
		Rooms.get(matchup.tourId).addRaw(`<a href=\"/${room}\" class=\"ilink\"><b>The team tournament battle between ${p1name} and ${p2name} has begun.</b></a>`);
		Rooms.get(matchup.tourId).update();
	}
	//end tour

	return room;
};

if (!Rooms.RoomBattle.prototype.__onEnd) Rooms.RoomBattle.prototype.__onEnd = Rooms.RoomBattle.prototype.onEnd;
Rooms.RoomBattle.prototype.onEnd = function (winner) {
	//tour
	if (Server.teamTours) {
		let matchup = findTourFromMatchup(this.p1.name, this.p2.name, this.format, this.room);
		if (matchup) {
			let loser = false;
			if (toID(this.p1.name) === toID(winner)) loser = this.p2.name;
			if (toID(this.p2.name) === toID(winner)) loser = this.p1.name;

			if (!loser) {
				//tie
				Rooms.get(matchup.tourId).addRaw(`The battle between <b>${this.p1.name}</b> and <b>${this.p2.name}</b> has ended in a tie. Please start another battle.`);
				invalidate(matchup.tourId, matchup.matchupId);
			} else {
				Rooms.get(matchup.tourId).addRaw(`<b>${winner}</b> has won their battle against <b>${loser}</b>.`);
				dqTeamTour(matchup.tourId, loser);
			}
			Rooms.get(matchup.tourId).update();
		}
	}
	//end tour
	this.__onEnd(winner);
};
