'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Endless Battle Clause (slow)', () => {
	afterEach(() => battle.destroy());

	it('should trigger on an infinite loop', () => {
		battle = common.createBattle({endlessBattleClause: true});
		battle.setPlayer('p1', {team: [{species: "Caterpie", moves: ['tackle']}]});
		battle.setPlayer('p2', {team: [{species: "Slowbro", item: 'leppaberry', moves: ['slackoff', 'healpulse', 'recycle']}]});
		const [victim, memeSlowbro] = [battle.p1.active[0], battle.p2.active[0]];
		for (let i = 0; i < 100; i++) {
			if (battle.ended) {
				assert(battle.winner === 'Player 1');
				return;
			}
			let move;
			if (victim.hp < 150) {
				move = 'healpulse';
			} else if (memeSlowbro.item === '') {
				move = 'recycle';
			} else {
				move = 'slackoff';
			}
			battle.makeChoices('default', `move ${move}`);
		}
		assert.fail("The battle did not end despite Endless Battle Clause");
	});

	it('should not trigger by both Pokemon eating a Leppa Berry they started with', () => {
		battle = common.createBattle({endlessBattleClause: true});
		battle.setPlayer('p1', {team: [{species: "Sunkern", item: 'leppaberry', moves: ['synthesis']}]});
		battle.setPlayer('p2', {team: [{species: "Sunkern", item: 'leppaberry', moves: ['synthesis']}]});
		for (let i = 0; i < 10; i++) {
			battle.makeChoices('move synthesis', 'move synthesis');
		}
		assert.false(battle.ended);
	});

	it('should only cause the battle to end if either side cannot switch to a non-stale Pokemon and at least one staleness is externally inflicted', () => {
		battle = common.createBattle({endlessBattleClause: true});
		battle.setPlayer('p1', {team: [
			{species: "Blissey", level: 1, item: 'leppaberry', moves: ['recycle', 'extremespeed', 'floralhealing', 'block']},
			{species: "Magikarp", moves: ['splash']},
		]});
		battle.setPlayer('p2', {team: [
			{species: "Magikarp", moves: ['splash']},
			{species: "Sunkern", item: 'leppaberry', moves: ['synthesis']},
		]});
		for (let i = 0; i < 8; i++) {
			battle.makeChoices('move extremespeed', 'move splash');
		}
		// Blissey consumes a Leppa Berry that wasn't cycled = no staleness.
		assert.false(battle.ended);
		battle.makeChoices('move recycle', 'move splash');
		assert.false(battle.ended);
		for (let i = 0; i < 8; i++) {
			battle.makeChoices('move extremespeed', 'move splash');
		}
		// Blissey consumes a Leppa Berry which was cycled = internal staleness.
		assert.false(battle.ended);
		// Blissey inflicts external staleness on Magikarp.
		battle.makeChoices('move floralhealing', 'move splash');
		// Magikarp can still be switched out to Sunkern at this point, so EBC still shouldn't trigger
		assert.false(battle.ended);
		battle.makeChoices('move block', 'move splash');
		// Now that Magikarp is trapped, the termination condition should occur.
		assert(battle.ended);
		assert(battle.winner === 'Player 2');
	});
});
