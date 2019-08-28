/********************************
 * DewTube (YouTube) Simulation	*
 * Created for Pokemon Showdown	*
 * Creators: flufi and Insist	*
 ********************************/

"use strict";

const FS = require("../lib/fs.js");

// Cooldown per video (30 minutes)
const RECORD_COOLDOWN = 30 * 60 * 1000;

// Drama Cooldown (1 hour)
const DRAMA_COOLDOWN = 60 * 60 * 1000;

// Collaboration Cooldown (6 hours)
const COLLAB_COOLDOWN = 6 * 60 * 60 * 1000;

let channels = FS("config/chat-plugins/channels.json").readIfExistsSync();

if (channels !== "") {
	channels = JSON.parse(channels);
} else {
	channels = {};
}

function write() {
	FS("config/chat-plugins/channels.json").writeUpdate(() => (
		JSON.stringify(channels)
	));
	let data = "{\n";
	for (let u in channels) {
		data += '\t"' + u + '": ' + JSON.stringify(channels[u]) + ",\n";
	}
	data = data.substr(0, data.length - 2);
	data += "\n}";
	FS("config/chat-plugins/channels.json").writeUpdate(() => (
		data
	));
}

function getChannel(user) {
	user = toId(user);
	let reply;
	for (let channel in channels) {
		if (channels[channel].owner === user) {
			reply = channels[channel].name;
			break;
		}
	}
	return reply;
}
Server.getChannel = getChannel;

//Plugin Optimization
let config = {
	version: "2.2.1",
	changes: ["Profile Pictures", "Banners", "Clickbait", "Make thumbnails work", "Thumbnails actually do something", "DewTubers can view past videos", "Implement Comments"],
	// Basic Filter for Instant Demonetization
	filter: ["nsfw", "porn", "sex", "shooting"],
};

function collab(channel1, channel2) {
	channel1 = toId(channel1);
	channel2 = toId(channel2);
	let combinedSubs = channels[channel1].subscribers + channels[channel2].subscribers;
	let traffic = Math.floor(Math.random() * combinedSubs);
	if (traffic > 1000000) {
		// If the views will be over 1 million, half them so collaborations aren't entirely "broken"
		traffic = Math.round(traffic / 2);
	}
	return traffic;
}

function generateComments(favorable, amountOfComments) {
	let goodComments = [`Nice job!`, `Awesome!`, `Woo!`, `Good on ya, mate!`, `Nice one!`, `Way to go!`, `Best thing since Harambe lol`, `You are God`, `The heavens have blessed us with this masterpiece!!`, `You are the bloody best!`, `You are my favorite DewTuber!`, `This video cheered me up, thanks!`];
	let badComments = [`Unsubbed!`, `Not cool...`, `This content sucks!`, `What are you 12?`, `God awful!`, `I think I lost braincells on this`, `Delete this!`, `This couldn't even make a good meme!`, `Delete your channel, thx.`, `Quit DewTube`, `You're not funny...`, `This killed my soul...`, `No wonder God distanced himself from us...`, `OOF! This hurt!`, `HELP, THIS VIDEO IS CANCER!!!`];
	let generatedComments = [];
	if (favorable) {
		while (generatedComments.length < amountOfComments) {
			generatedComments.push(goodComments[Math.floor(Math.random() * goodComments.length)]);
		}
	} else {
		while (generatedComments.length < amountOfComments) {
			generatedComments.push(badComments[Math.floor(Math.random() * badComments.length)]);
		}
	}
	return generatedComments;
}

exports.commands = {
	dewtube: {
		info: function () {
			if (!this.runBroadcast()) return;
			let display = `<div style="padding: 20px 20px"><center><font size="5">DewTube</font></center><br /><center><font size="3">v${config.version}</font></center><br />`;
			if (config.changes) display += Chat.toListString(config.changes);
			display += `</div>`;
			return this.sendReplyBox(display);
		},

		createchannel: "newchannel",
		create: "newchannel",
		makechannel: "newchannel",
		register: "newchannel",
		newchannel: function (target, room, user) {
			let [name, desc] = target.split(",").map(p => p.trim());
			if (!name || !desc) return this.parse(`/dewtubehelp`);
			if (name.length < 1 || name.length > 25) return this.errorReply(`Your channel name must be between 1-25 characters.`);
			if (desc.length < 1 || desc.length > 300) return this.errorReply(`Your channel description must be between 1-300 characters.`);
			if (channels[toId(name)]) return this.errorReply(`${name} already is a DewTube channel.`);
			if (getChannel(user.userid)) return this.errorReply(`You already have a DewTube channel.`);
			channels[toId(name)] = {
				id: toId(name),
				name: name,
				aboutme: desc,
				views: 0,
				videos: 0,
				subscribers: 0,
				owner: user.userid,
				vidProgress: "notStarted",
				lastRecorded: null,
				lastCollabed: null,
				creationDate: Date.now(),
				likes: 0,
				dislikes: 0,
				notifications: true,
				isMonetized: false,
				lastTitle: null,
				lastThumbnail: null,
				allowingDrama: false,
				lastDrama: null,
				strikes: 0,
				pendingCollab: null,
				profilepic: null,
				banner: null,
				uploadedVideos: {},
			};
			write();
			return this.sendReply(`You successfully created your DewTube channel "${name}"! To view your channel's stats, use /dewtube dashboard.`);
		},

		deletechannel: "removechannel",
		delchannel: "removechannel",
		delete: "removechannel",
		terminatechannel: "removechannel",
		terminate: "removechannel",
		removechannel: function (target, room, user) {
			target = toId(target);
			if (!target || !channels[target]) return this.errorReply(`The channel "${target}" appears to not exist.`);
			if (!this.can("ban") && channels[target].owner !== user.userid) return this.errorReply(`You must be the channel owner or a Global Moderator (or higher) to delete a channel.`);
			delete channels[target];
			write();
			return this.sendReply(`Channel "${target}" has been deleted.`);
		},

		"!dashboard": true,
		channelpage: "dashboard",
		channel: "dashboard",
		dashboard: function (target, room, user) {
			if (!this.runBroadcast()) return;
			if (!target) target = toId(getChannel(user.userid));
			let channelId = toId(target);
			if (!channels[channelId]) return this.errorReply(`This is not a DewTube channel.`);
			let vidProgress = channels[channelId].vidProgress;
			let display = `${channels[channelId].banner ? `<div style="background:url(${channels[channelId].banner}); background-size: 100% 100%; height: 100%">` : ``}<center><h2>${channels[channelId].name}</h2><strong>Creator:</strong> ${Server.nameColor(channels[channelId].owner, true, true)}`;
			if (channels[channelId].profilepic) display += `<img src="${channels[channelId].profilepic}" width="80" height="80">`;
			if (channels[channelId].isMonetized) display += ` <strong>(Approved Partner [&#9745;])</strong>`;
			display += `<br />`;
			if (channels[channelId].aboutme) display += `<strong>About Me:</strong> ${channels[channelId].aboutme}<br />`;
			if (channels[channelId].creationDate) display += `<strong>Created:</strong> ${new Date(channels[channelId].creationDate)}<br />`;
			if (channels[channelId].views > 0) display += `<strong>View Count:</strong> ${channels[channelId].views.toLocaleString()}<br />`;
			if (channels[channelId].subscribers > 0) display += `<strong>Subscriber Count:</strong> ${channels[channelId].subscribers.toLocaleString()}<br />`;
			if (channels[channelId].likes > 0) display += `<strong>Like Count:</strong> ${channels[channelId].likes.toLocaleString()}<br />`;
			if (channels[channelId].dislikes > 0) display += `<strong>Dislike Count:</strong> ${channels[channelId].dislikes.toLocaleString()}<br />`;
			if (channels[channelId].lastTitle && vidProgress === "notStarted") display += `<strong>Last Video:</strong> ${channels[channelId].lastTitle}<br />`;
			if (channels[channelId].lastThumbnail && vidProgress === "notStarted") display += `<strong>Last Video Thumbnail:</strong><br /><img src="${channels[channelId].lastThumbnail}" width="250" height="140"><br />`;
			if (channels[channelId].videos > 0) display += `<strong>Total Videos Uploaded:</strong> ${channels[channelId].videos.toLocaleString()}<br />`;
			if (channels[channelId].allowingDrama) display += `<small><strong>(Allowing Drama: [&#9745;])</strong></small>`;
			display += `</center>${channels[channelId].banner ? `</div>` : ``}`;
			return this.sendReplyBox(display);
		},

		aboutme: "desc",
		description: "desc",
		desc: function (target, room, user) {
			let channelId = toId(getChannel(user.userid));
			if (!channels[channelId]) return this.errorReply(`You do not currently own a DewTube channel.`);
			if (!target || target.length > 300) return this.errorReply("Needs a target; no more than 300 characters.");
			channels[channelId].aboutme = target;
			write();
			return this.sendReply(`Your channel description is now set to:\n${channels[channelId].aboutme}.`);
		},

		"!discover": true,
		channellist: "discover",
		listchannels: "discover",
		channelslist: "discover",
		channels: "discover",
		socialblade: "discover",
		list: "discover",
		discover: function () {
			if (!this.runBroadcast()) return;
			if (Object.keys(channels).length < 1) return this.errorReply(`There are currently no DewTube channels on ${Config.serverName}.`);
			let output = `<div style="max-height: 200px; width: 100%; overflow: scroll;"><center><table border="1" cellspacing ="0" cellpadding="3"><tr><td>Channel Name</td><td>Description</td><td>Views</td><td>Subscribers</td><td>Likes</td><td>Dislikes</td><td>Dashboard</td><td>Owner</td></tr>`;
			let sortedChannels = Object.keys(channels).sort(function (a, b) {
				return channels[b].subscribers - channels[a].subscribers;
			});
			for (let channel = 0; channel < sortedChannels.length; channel++) {
				let curChannel = channels[sortedChannels[channel]];
				let aboutme = Chat.escapeHTML(curChannel.aboutme);
				if (aboutme.length > 100) aboutme = `${aboutme.substr(0, 100)}<br />${aboutme.substr(100)}`;
				output += `<tr>`;
				output += `<td>${Chat.escapeHTML(curChannel.name)}</td>`;
				output += `<td>${aboutme}</td>`;
				output += `<td>${curChannel.views.toLocaleString()}</td>`;
				output += `<td>${curChannel.subscribers.toLocaleString()}</td>`;
				output += `<td>${curChannel.likes.toLocaleString()}</td>`;
				output += `<td>${curChannel.dislikes.toLocaleString()}</td>`;
				output += `<td><button name="send" value="/dewtube dashboard ${curChannel.name}">${curChannel.name}</button></td>`;
				output += `<td>${Server.nameColor(curChannel.owner, true, true)}</td>`;
				output += `</tr>`;
			}
			output += `</table></center></div>`;
			this.sendReplyBox(output);
		},

		film: "record",
		rec: "record",
		record: function (target, room, user) {
			if (!getChannel(user.userid)) return this.errorReply(`You do not have a DewTube channel yet.`);
			let [title, thumbnail] = target.split(",").map(p => p.trim());
			if (!title) return this.errorReply(`Please title the video you are filming.`);
			let channelId = toId(getChannel(user.userid));
			if (Date.now() - channels[channelId].lastRecorded < RECORD_COOLDOWN) return this.errorReply(`You are on record cooldown.`);
			let videoProgress = channels[channelId].vidProgress;
			if (videoProgress !== "notStarted") return this.errorReply(`You already have a video recorded.`);
			if (channels[channelId].uploadedVideos[title]) return this.errorReply(`You already have a video titled "${title}".`);
			if (thumbnail && ![".png", ".gif", ".jpg"].includes(thumbnail.slice(-4))) return this.errorReply(`Your thumbnail must end in .jpg, .gif, or .png extension.`);
			channels[channelId].vidProgress = "recorded";
			channels[channelId].lastTitle = title;
			if (thumbnail) {
				channels[channelId].lastThumbnail = thumbnail;
			} else {
				channels[channelId].lastThumbnail = null;
			}
			// Filter if the title is deemed "inappropriate" if they are monetized
			if (channels[channelId].isMonetized) {
				for (let badWord of config.filter) {
					// This is basically so we can standardize and check titles more efficiently as IDs would remove spaces etc
					let lowercaseTitle = target.toLowerCase();
					// Go ahead and warn them :^)
					if (lowercaseTitle.includes(badWord)) this.sendReply(`Your title "${target}" doesn't seem very ad-friendly to our sponsors.`);
				}
			}
			write();
			this.sendReplyBox(`You have recorded a video titled "${title}"! Time to edit it! <button class="button" name="send" value="/dewtube edit">Edit it!</button><button class="button" name="send" value="/dewtube publish">Upload as-is!</button>`);
		},

		editvideo: "edit",
		edit: function (target, room, user) {
			if (!getChannel(user.userid)) return this.errorReply(`You do not have a DewTube channel yet.`);
			let channelId = toId(getChannel(user.userid));
			let videoProgress = channels[channelId].vidProgress;
			if (videoProgress !== "recorded") return this.errorReply(`You haven't recorded any new footage yet.`);
			channels[channelId].vidProgress = "edited";
			write();
			return this.sendReplyBox(`Almost done! Now its time to upload "${channels[channelId].lastTitle}"! <button class="button" name="send" value="/dewtube publish">Publish the Video!</button>`);
		},

		pub: "publish",
		upload: "publish",
		publish: function (target, room, user) {
			if (!getChannel(user.userid)) return this.errorReply(`You do not have a DewTube channel yet.`);
			let channelId = toId(getChannel(user.userid));
			let videoProgress = channels[channelId].vidProgress;
			if (videoProgress === "notStarted") return this.errorReply(`Please record a video before uploading.`);
			let subCount = channels[channelId].subscribers;
			channels[channelId].lastRecorded = Date.now();
			channels[channelId].videos++;
			let title = channels[channelId].lastTitle;
			let generateEditedViews = Math.floor(Math.random() * subCount);
			let generateRawViews = Math.floor(Math.random() * Math.round(subCount / 100));
			// Factor in Sub Count conditions to support starting DewTubers (it's rough starting out)
			if (subCount === 0) {
				generateEditedViews = 10;
				generateRawViews = 5;
			} else if (subCount > 0 && subCount < 1000) {
				// Multiply views by 1.5x if they have less than 1,000 subscribers
				generateEditedViews = Math.round(generateEditedViews * 1.5);
				generateRawViews = Math.round(generateRawViews * 1.5);
			} else if (subCount > 1000 && subCount < 100000) {
				// Factor in inactive subscribers (Range = 1-10)
				let inactivity = Math.floor(Math.random() * 10) + 1;
				generateEditedViews = Math.round(generateEditedViews / inactivity);
				generateRawViews = Math.round(generateRawViews / inactivity);
			} else if (subCount > 100000) {
				// Factor in inactive subscribers (Range = 1-100)
				let inactivity = Math.floor(Math.random() * 100) + 1;
				generateEditedViews = Math.round(generateEditedViews / inactivity);
				generateRawViews = Math.round(generateRawViews / inactivity);
			}
			if (videoProgress === "edited" && generateEditedViews < 1) {
				generateEditedViews = 1;
			} else if (videoProgress === "recorded" && generateRawViews < 1) {
				generateRawViews = 1;
			}
			// Introduce Thumbnail Clickbait
			if (channels[channelId].lastThumbnail && subCount > 0) {
				let clickbait = Math.floor(Math.random() * Math.round(subCount / 1000)) + 1;
				generateEditedViews = generateEditedViews + clickbait;
				generateRawViews = generateRawViews + clickbait;
			}
			let loveHateRatio = Math.floor(Math.random() * 100);
			let generateEditedSubs, generateEditedUnsubs, generateEditedLikes, generateEditedDislikes, generateRawSubs, generateRawUnsubs, generateRawLikes, generateRawDislikes, genComments, commentAmount;
			if (videoProgress === "edited") {
				commentAmount = Math.floor(Math.random() * Math.round(generateEditedViews / 4));
			} else {
				commentAmount = Math.floor(Math.random() * Math.round(generateEditedViews / 8));
			}
			// 70% chance to have positive feedback; 30% chance for negative feedback
			if (loveHateRatio >= 70) {
				// More dislikes than like scenario
				generateEditedUnsubs = Math.floor(Math.random() * generateEditedViews);
				generateEditedSubs = Math.floor(Math.random() * generateEditedUnsubs);
				generateEditedDislikes = Math.floor(Math.random() * generateEditedViews);
				generateEditedLikes = Math.floor(Math.random() * generateEditedDislikes);
				generateRawUnsubs = Math.floor(Math.random() * generateRawViews);
				generateRawSubs = Math.floor(Math.random() * generateRawUnsubs);
				generateRawDislikes = Math.floor(Math.random() * generateRawViews);
				generateRawLikes = Math.floor(Math.random() * generateRawDislikes);
				genComments = generateComments(false, commentAmount);
			} else {
				// More likes than dislikes scenario
				generateEditedSubs = Math.floor(Math.random() * generateEditedViews);
				generateEditedUnsubs = Math.floor(Math.random() * generateEditedSubs);
				generateEditedLikes = Math.floor(Math.random() * generateEditedViews);
				generateEditedDislikes = Math.floor(Math.random() * generateEditedLikes);
				generateRawSubs = Math.floor(Math.random() * generateRawViews);
				generateRawUnsubs = Math.floor(Math.random() * generateRawSubs);
				generateRawLikes = Math.floor(Math.random() * generateRawViews);
				generateRawDislikes = Math.floor(Math.random() * generateRawLikes);
				genComments = generateComments(true, commentAmount);
			}
			if (generateEditedLikes + generateEditedDislikes > generateEditedViews) {
				generateEditedLikes = Math.round(generateEditedLikes / 2);
				generateEditedDislikes = Math.round(generateEditedDislikes / 2);
			}
			if (generateRawLikes + generateRawDislikes > generateRawViews) {
				generateRawLikes = Math.round(generateRawLikes / 2);
				generateRawDislikes = Math.round(generateRawDislikes / 2);
			}
			if (generateEditedSubs + generateEditedUnsubs > generateEditedViews) {
				generateEditedSubs = Math.round(generateEditedSubs / 2);
				generateEditedUnsubs = Math.round(generateEditedUnsubs / 2);
			}
			if (generateRawSubs + generateRawUnsubs > generateRawViews) {
				generateRawSubs = Math.round(generateRawSubs / 2);
				generateRawUnsubs = Math.round(generateRawUnsubs / 2);
			}
			if (generateEditedSubs < 1) generateEditedSubs = 1;
			if (generateRawSubs < 1) generateRawSubs = 1;
			let generateEditedSubChange = generateEditedSubs - generateEditedUnsubs;
			let generateRawSubChange = generateRawSubs - generateRawUnsubs;
			if (videoProgress === "edited") {
				let newSubCount = channels[channelId].subscribers + generateEditedSubChange;
				if (newSubCount < 1) newSubCount = 0;
				let newViewCount = channels[channelId].views + generateEditedViews;
				let newLikeCount = channels[channelId].likes + generateEditedLikes;
				let newDislikeCount = channels[channelId].dislikes + generateEditedDislikes;
				channels[channelId].subscribers = newSubCount;
				channels[channelId].views = newViewCount;
				channels[channelId].likes = newLikeCount;
				channels[channelId].dislikes = newDislikeCount;
				let results = `Congratulations, your video titled "${title}" has received ${generateEditedViews.toLocaleString()} view${Chat.plural(generateEditedViews)}.`;
				if (generateEditedSubs > 1) results += ` ${generateEditedSubs.toLocaleString()} ${generateEditedSubs === 1 ? "person has" : "people have"} subscribed to your channel after seeing this video.`;
				if (generateEditedUnsubs > 1) results += ` Unfortunately ${generateEditedUnsubs.toLocaleString()} ${generateEditedUnsubs === 1 ? "person has" : "people have"} unsubscribed from your channel.`;
				if (generateEditedLikes > 1) results += ` You got ${generateEditedLikes.toLocaleString()} like${Chat.plural(generateEditedLikes)} on this video.`;
				if (generateEditedDislikes > 1) results += ` You (unfortunately) also got ${generateEditedDislikes.toLocaleString()} dislike${Chat.plural(generateEditedDislikes)} on this video.<br />`;
				results += `Total Sub Count: ${newSubCount.toLocaleString()}. Total View Count: ${newViewCount.toLocaleString()}. Total Likes: ${newLikeCount.toLocaleString()}. Total Dislikes: ${newDislikeCount.toLocaleString()}.`;
				this.sendReplyBox(results);
			} else {
				let newSubCount = channels[channelId].subscribers + generateRawSubChange;
				if (newSubCount < 1) newSubCount = 0;
				let newViewCount = channels[channelId].views + generateRawViews;
				let newLikeCount = channels[channelId].likes + generateRawLikes;
				let newDislikeCount = channels[channelId].dislikes + generateRawDislikes;
				channels[channelId].subscribers = newSubCount;
				channels[channelId].views = newViewCount;
				channels[channelId].likes = newLikeCount;
				channels[channelId].dislikes = newDislikeCount;
				let results = `Congratulations, your un-edited video titled "${title}" has received ${generateRawViews.toLocaleString()} view${Chat.plural(generateRawViews)}.`;
				if (generateRawSubs > 1) results += ` ${generateRawSubs.toLocaleString()} ${generateRawSubs === 1 ? "person has" : "people have"} subscribed to your channel after seeing this video.`;
				if (generateRawUnsubs > 1) results += ` Unfortunately ${generateRawUnsubs.toLocaleString()} ${generateRawUnsubs === 1 ? "person has" : "people have"} unsubscribed from your channel.`;
				if (generateRawLikes > 1) results += ` You got ${generateRawLikes.toLocaleString()} like${Chat.plural(generateRawLikes)} on this video.`;
				if (generateRawDislikes > 1) results += ` You (unfortunately) also got ${generateRawDislikes.toLocaleString()} dislike${Chat.plural(generateRawDislikes)} on this video.<br />`;
				results += `Total Sub Count: ${newSubCount.toLocaleString()}. Total View Count: ${newViewCount.toLocaleString()}. Total Likes: ${newLikeCount.toLocaleString()}. Total Dislikes: ${newDislikeCount.toLocaleString()}.`;
				this.sendReplyBox(results);
			}
			if (channels[channelId].isMonetized) {
				let demonetization = Math.floor(Math.random() * 100);
				// Sorry that video seems un-friendly to the advertisers :^)
				for (let badWords of config.filter) {
					// This is basically so we can standardize and check titles more efficiently as IDs would remove spaces etc
					let lowercaseTitle = title.toLowerCase();
					if (lowercaseTitle.includes(badWords)) demonetization = 90;
				}
				// If the demonetization number or more dislikes were given than likes then DewTube demonetizes the user
				if (demonetization >= 70 || loveHateRatio >= 70) {
					this.sendReplyBox(`<i>Due to your video's failure to meet community guidelines it was not approved for monetization, therefore your video has been D E M O N E T I Z E D.</i>`);
					if (videoProgress === "edited") {
						channels[channelId].uploadedVideos[title] = Object.assign({name: title, monetized: false, adRevenue: 0, thumbnail: channels[channelId].lastThumbnail, views: generateEditedViews, likes: generateEditedLikes, dislikes: generateEditedDislikes, subscribers: generateEditedSubs, unsubs: generateEditedUnsubs, videoProgress: "Edited", recorded: Date.now(), comments: genComments});
					} else {
						channels[channelId].uploadedVideos[title] = Object.assign({name: title, monetized: false, adRevenue: 0, thumbnail: channels[channelId].lastThumbnail, views: generateRawViews, likes: generateRawLikes, dislikes: generateRawDislikes, subscribers: generateRawSubs, unsubs: generateRawUnsubs, videoProgress: "Raw", recorded: Date.now(), comments: genComments});
					}
				} else {
					let adRevenue = 0;
					if (videoProgress === "recorded") {
						adRevenue = Math.round(generateRawViews / 20);
						if (adRevenue < 1) adRevenue = 1;
						if (adRevenue > 20) adRevenue = 20;
						channels[channelId].uploadedVideos[title] = Object.assign({name: title, monetized: true, adRevenue: adRevenue, thumbnail: channels[channelId].lastThumbnail, views: generateRawViews, likes: generateRawLikes, dislikes: generateRawDislikes, subscribers: generateRawSubs, unsubs: generateRawUnsubs, videoProgress: "Raw", recorded: Date.now(), comments: genComments});
					} else {
						adRevenue = Math.round(generateEditedViews / 100);
						if (adRevenue < 1) adRevenue = 1;
						if (adRevenue > 20) adRevenue = 20;
						channels[channelId].uploadedVideos[title] = Object.assign({name: title, monetized: true, adRevenue: adRevenue, thumbnail: channels[channelId].lastThumbnail, views: generateEditedViews, likes: generateEditedLikes, dislikes: generateEditedDislikes, subscribers: generateEditedSubs, unsubs: generateEditedUnsubs, videoProgress: "Edited", recorded: Date.now(), comments: genComments});
					}
					Economy.writeMoney(user.userid, adRevenue);
					Economy.logTransaction(`${user.name} has got ${adRevenue} ${moneyName}${Chat.plural(adRevenue)} from posting a video.`);
					this.sendReplyBox(`<i>Your video meets community guidelines and was approved for monetization. You have profited ${adRevenue} ${moneyName}${Chat.plural(adRevenue)}!</i>`);
				}
			} else {
				if (videoProgress === "edited") {
					channels[channelId].uploadedVideos[title] = Object.assign({name: title, monetized: false, adRevenue: 0, thumbnail: channels[channelId].lastThumbnail, views: generateEditedViews, likes: generateEditedLikes, dislikes: generateEditedDislikes, subscribers: generateEditedSubs, unsubs: generateEditedUnsubs, videoProgress: "Edited", recorded: Date.now(), comments: genComments});
				} else {
					channels[channelId].uploadedVideos[title] = Object.assign({name: title, monetized: false, adRevenue: 0, thumbnail: channels[channelId].lastThumbnail, views: generateRawViews, likes: generateRawLikes, dislikes: generateRawDislikes, subscribers: generateRawSubs, unsubs: generateRawUnsubs, videoProgress: "Raw", recorded: Date.now(), comments: genComments});
				}
			}
			// Restart video progress
			channels[channelId].vidProgress = "notStarted";
			write();
			if (channels[channelId].notifications) {
				let notification = Date.now() - channels[channelId].lastRecorded + RECORD_COOLDOWN;
				setTimeout(() => {
					if (Users.get(user.userid)) {
						user.send(`|pm|~DewTube Manager|~|Hey ${user.name}, just wanted to let you know you can upload again!`);
					}
				}, notification);
			}
		},

		togglemonetization: "monetization",
		demonetize: "monetization",
		unmonetize: "monetization",
		monetize: "monetization",
		monetization: function (target, room, user) {
			let channelId = toId(getChannel(user.userid));
			if (!getChannel(user.userid)) return this.errorReply(`You do not have a DewTube channel yet.`);
			if (channels[channelId].subscribers < 1000) return this.errorReply(`Due to recent DewTube partnership guidelines you must have 1,000 subscribers to apply for monetization.`);
			if (channels[channelId].isMonetized) {
				channels[channelId].isMonetized = false;
				write();
				return this.sendReply(`You have successfully deactivated monetization.`);
			} else {
				channels[channelId].isMonetized = true;
				write();
				return this.sendReply(`You have successfully enabled monetization.`);
			}
		},

		notifications: "notify",
		videonotifications: "notify",
		toggle: "notify",
		togglenotifications: "notify",
		notify: function (target, room, user) {
			if (!getChannel(user.userid)) return this.errorReply(`You do not have a DewTube channel yet.`);
			let channelId = toId(getChannel(user.userid));
			if (channels[channelId].notifications) {
				channels[channelId].notifications = false;
				this.sendReply(`You have successfully deactivated video notifications.`);
			} else {
				channels[channelId].notifications = true;
				this.sendReply(`You have successfully enabled video notifications.`);
			}
		},

		dramaalert: "drama",
		expose: "drama",
		drama: function (target, room, user) {
			if (!getChannel(user.userid)) return this.errorReply(`You do not have a DewTube channel yet.`);
			if (!target) return this.errorReply(`Pick who you want to start drama with.`);
			let targetId = toId(target);
			let usersChannel = toId(getChannel(user.userid));
			if (!channels[targetId]) return this.errorReply(`"${target}" is not a channel.`);
			let targetChannel = channels[targetId].name;
			if (channels[targetId] === channels[usersChannel]) return this.errorReply(`You cannot have drama with yourself.`);
			if (!channels[targetId].allowingDrama) return this.errorReply(`${targetChannel} has disabled drama.`);
			if (channels[usersChannel].subscribers === 0 || channels[targetId].subscribers === 0) return this.errorReply(`Either your channel, ${channels[usersChannel].name} or ${targetChannel} currently have zero subscribers.`);
			if (!channels[usersChannel].allowingDrama) return this.errorReply(`You must enable drama before starting drama.`);
			if (Date.now() - channels[usersChannel].lastDrama < DRAMA_COOLDOWN) return this.errorReply(`You are on drama cooldown.`);
			if (Date.now() - channels[targetId].lastDrama < DRAMA_COOLDOWN) return this.errorReply(`${targetChannel} is on drama cooldown.`);
			let badOutcomes = [`was exposed by ${targetChannel}.`, `was the victim of a Content Cop by ${targetChannel}.`, `was humiliated by ${targetChannel}.`, `was proven to have lied by ${targetChannel}.`, `was proven guilty by ${targetChannel}.`, `was caught faking content by ${targetChannel}.`];
			let goodOutcomes = [`won the debate against ${targetChannel}.`, `was favored by the community in an argument against ${targetChannel}.`, `proved they were innocent of ${targetChannel}'s accusations.`, `exposed ${targetChannel}.`];
			let determineOutcome = Math.floor(Math.random() * 2);
			let audience = channels[usersChannel].subscribers + channels[targetId].subscribers;
			let feedback = Math.floor(Math.random() * audience);
			let communityFeedback = Math.round(feedback / 2);
			if (communityFeedback < 1) communityFeedback = 1;
			let subChange = Math.round(communityFeedback / 10);
			if (subChange < 1) subChange = 1;
			channels[usersChannel].lastDrama = Date.now();

			if (determineOutcome === 1) {
				let outcome = goodOutcomes[Math.floor(Math.random() * goodOutcomes.length)];
				let traffic = channels[usersChannel].views + communityFeedback;
				channels[usersChannel].views = traffic;
				let subscriberTraffic = channels[usersChannel].subscribers + subChange;
				channels[usersChannel].subscribers = subscriberTraffic;
				if (channels[targetId].subscribers < subChange) {
					channels[targetId].subscribers = 0;
				} else {
					let subscribers = channels[targetId].subscribers - subChange;
					channels[targetId].subscribers = subscribers;
				}
				if (Rooms.get("dewtube")) Rooms.get("dewtube").add(`|c|$DramaAlert|/raw ${Server.nameColor(user.name, true, true)}, also known as ${channels[usersChannel].name}, ${outcome}`).update();
				this.sendReply(`You have won the drama against ${targetChannel}. This resulted in you gaining ${subChange.toLocaleString()} subscribers. This lead to ${communityFeedback.toLocaleString()} view${Chat.plural(communityFeedback)} being trafficked to your channel.`);
				write();
				if (Users.get(channels[targetId].owner)) {
					Users.get(channels[targetId].owner).send(`|pm|${user.getIdentity()}|${channels[targetId].owner}|/raw ${Server.nameColor(user.name, true, true)}'s channel ${channels[usersChannel].name} has been favored by the community in DewTube drama. This resulted in you losing ${subChange.toLocaleString()} subscriber${Chat.plural(subChange)}.`);
				}
			} else {
				let outcome = badOutcomes[Math.floor(Math.random() * badOutcomes.length)];
				if (channels[usersChannel].subscribers < subChange) {
					channels[usersChannel].subscribers = 0;
				} else {
					let subscribers = channels[usersChannel].subscribers - subChange;
					channels[usersChannel].subscribers = subscribers;
				}
				let traffic = channels[targetId].views + communityFeedback;
				channels[targetId].views = traffic;
				let subscriberTraffic = channels[targetId].subscribers + subChange;
				channels[targetId].subscribers = subscriberTraffic;
				if (Rooms.get("dewtube")) Rooms.get("dewtube").add(`|c|$DramaAlert|/raw ${Server.nameColor(user.name, true, true)}, also known as ${channels[usersChannel].name}, ${outcome}`).update();
				this.sendReply(`You have lost the drama against ${targetChannel}. This resulted in you losing ${subChange.toLocaleString()} subscriber${Chat.plural(subChange)}.`);
				write();
				if (Users.get(channels[targetId].owner)) {
					Users.get(channels[targetId].owner).send(`|pm|${user.getIdentity()}|${channels[targetId].owner}|/raw ${Server.nameColor(user.name, true, true)}'s channel ${channels[usersChannel].name} has lost while trying to start drama with you. This resulted in you gaining ${subChange.toLocaleString()} subscriber${Chat.plural(subChange)}. You also trafficked ${communityFeedback.toLocaleString()} view${Chat.plural(communityFeedback)} from this drama.`);
				}
			}
			if (channels[usersChannel].notifications) {
				let notification = Date.now() - channels[usersChannel].lastDrama + DRAMA_COOLDOWN;
				setTimeout(() => {
					if (Users.get(user.userid)) {
						user.send(`|pm|~DewTube Manager|~|Hey ${user.name}, just wanted to let you know you can start drama again now!`);
					}
				}, notification);
			}
		},

		disabledrama: "toggledrama",
		enabledrama: "toggledrama",
		toggledrama: function (target, room, user) {
			let channelId = toId(getChannel(user.userid));
			if (!channels[channelId]) return this.errorReply(`You do not currently own a DewTube channel.`);
			if (!channels[channelId].allowingDrama) {
				channels[channelId].allowingDrama = true;
				this.sendReply(`You have enabled having drama. This means you can start or be a target of drama. If you want to disable drama again /toggledrama again.`);
			} else {
				channels[channelId].allowingDrama = false;
				this.sendReply(`You have disabled having drama. This means you cannot start or be a target of drama. If you want to enable drama again /toggledrama again.`);
			}
		},

		collab: "collaborate",
		collaborate: function (target, room, user) {
			if (!target) return this.parse(`/dewtubehelp`);
			let channelId = toId(getChannel(user.userid));
			if (!channels[channelId]) return this.errorReply(`You do not currently own a DewTube channel.`);
			let targetId = toId(target);
			if (!channels[targetId]) return this.errorReply(`"${target}" is not a channel.`);
			if (channels[targetId] === channels[channelId]) return this.errorReply(`You cannot collaborate with yourself (what would be the point?).`);
			// Check if the channel's owner is online (so the system can PM the user and avoid the chances the collaboration request will not be seen)
			if (!Users.get(channels[targetId].owner) || !Users.get(channels[targetId].owner).connected) return this.errorReply(`The owner of ${target} is not online.`);
			// Check if both user's are available to record a video and collab
			if (Date.now() - channels[channelId].lastCollabed < COLLAB_COOLDOWN) return this.errorReply(`You are on collaboration cooldown.`);
			if (Date.now() - channels[targetId].lastCollabed < COLLAB_COOLDOWN) return this.errorReply(`${channels[targetId].name} is on collaboration cooldown.`);
			if (Date.now() - channels[channelId].lastRecorded < RECORD_COOLDOWN) return this.errorReply(`You are on record cooldown.`);
			if (Date.now() - channels[targetId].lastRecorded < RECORD_COOLDOWN) return this.errorReply(`${channels[targetId].name} is on record cooldown.`);
			if (channels[channelId].pendingCollab) return this.errorReply(`You already have a pending collaboration request.`);
			// Add a check to allow the collaboration if the user is the other channel's pending collaboration just have them accept it
			if (channels[targetId].pendingCollab !== "" && channels[targetId].pendingCollab === channels[channelId].id) {
				return this.parse(`/dewtube accept ${channels[targetId].id}`);
			}
			channels[channelId].pendingCollab = targetId;
			write();
			Users.get(channels[targetId].owner).send(`|pm|${user.getIdentity()}|~|/html has sent you a collaboration request.<br /><button name="send" value="/dewtube accept ${channels[channelId].id}">Click to accept</button> | <button name="send" value="/dewtube deny ${channels[channelId].id}">Click to decline</button>`);
			return this.sendReply(`You have sent ${channels[targetId].name} a collaboration request.`);
		},

		accept: "acceptcollab",
		collabaccept: "acceptcollab",
		acceptcollab: function (target, room, user) {
			if (!target) return this.parse(`/dewtubehelp`);
			let channelId = toId(getChannel(user.userid));
			if (!channels[channelId]) return this.errorReply(`You do not currently own a DewTube channel.`);
			let targetId = toId(target);
			if (!channels[targetId]) return this.errorReply(`"${target}" is not a channel.`);
			if (channels[targetId].pendingCollab !== channels[channelId].id) return this.errorReply(`${channels[targetId].name} has not sent you a collaboration request, or it was cancelled.`);
			// Check if both user's are available to record a video and collab
			if (Date.now() - channels[channelId].lastCollabed < COLLAB_COOLDOWN) return this.errorReply(`You are on collaboration cooldown.`);
			if (Date.now() - channels[targetId].lastCollabed < COLLAB_COOLDOWN) return this.errorReply(`${channels[targetId].name} is on collaboration cooldown.`);
			if (Date.now() - channels[channelId].lastRecorded < RECORD_COOLDOWN) return this.errorReply(`You are on record cooldown.`);
			if (Date.now() - channels[targetId].lastRecorded < RECORD_COOLDOWN) return this.errorReply(`${channels[targetId].name} is on record cooldown.`);
			let traffic = collab(channelId, targetId);
			if (traffic < 1) traffic = 1;
			let loveHateRatio = Math.floor(Math.random() * 100);
			// Default to 1 like since there is always guaranteed at least 1 view (and we want to be nice for a change)
			let generateLikes = 1;
			let generateDislikes = 0;
			let subscriberTraffic, unsubs, genComments;
			let commentAmount = Math.floor(Math.random() * Math.round(traffic / 3));
			// 70% chance to have positive feedback; 30% chance for negative feedback
			if (loveHateRatio >= 70) {
				// More dislikes than like scenario
				generateDislikes = Math.floor(Math.random() * traffic);
				generateLikes = Math.floor(Math.random() * generateDislikes);
				unsubs = Math.floor(Math.random() * traffic);
				subscriberTraffic = Math.floor(Math.random() * generateDislikes);
				genComments = generateComments(false, commentAmount);
			} else {
				// More likes than dislikes scenario
				generateLikes = Math.floor(Math.random() * traffic);
				generateDislikes = Math.floor(Math.random() * generateLikes);
				subscriberTraffic = Math.floor(Math.random() * traffic);
				unsubs = Math.floor(Math.random() * subscriberTraffic);
				genComments = generateComments(true, commentAmount);
			}
			if (subscriberTraffic < 1) subscriberTraffic = 1;
			// If the subscriber gain is over 5,000 subscribers halve it (so collaborations aren't "broken")
			if (subscriberTraffic > 5000) Math.round(subscriberTraffic / 2);
			let userViewTraffic = channels[channelId].views + traffic;
			let userSubTraffic = channels[channelId].subscribers + subscriberTraffic;
			let userUnsubTraffic = channels[channelId].subscribers - unsubs;
			let userLikeTraffic = channels[channelId].likes + generateLikes;
			let userDislikeTraffic = channels[channelId].dislikes + generateDislikes;
			let collabViewTraffic = channels[targetId].views + traffic;
			let collabSubTraffic = channels[targetId].subscribers + traffic;
			let collabUnsubTraffic = channels[targetId].subscribers - unsubs;
			let collabLikeTraffic = channels[targetId].likes + generateLikes;
			let collabDislikeTraffic = channels[targetId].dislikes + generateDislikes;
			// Be nice and just make the video not have any unsubs :P
			if (userUnsubTraffic > channels[channelId].subscribers || collabUnsubTraffic > channels[targetId].subscribers) unsubs = 0;
			let userSubChange = userSubTraffic - userUnsubTraffic;
			let userSubs = channels[channelId].subscribers + userSubChange;
			let collabSubChange = collabSubTraffic - collabUnsubTraffic;
			let collabSubs = channels[targetId].subscribers + collabSubChange;
			// Now to actually add the calculations
			channels[channelId].views = userViewTraffic;
			channels[channelId].subscribers = userSubs;
			channels[channelId].likes = userLikeTraffic;
			channels[channelId].dislikes = userDislikeTraffic;
			channels[targetId].views = collabViewTraffic;
			channels[targetId].subscribers = collabSubs;
			channels[targetId].likes = collabLikeTraffic;
			channels[targetId].dislikes = collabDislikeTraffic;
			// Update timers and video counters/titles/etc
			channels[channelId].lastCollabed = Date.now();
			channels[channelId].lastRecorded = Date.now();
			if (!channels[channelId].uploadedVideos[`Collab w/ ${channels[targetId].name}!`]) {
				channels[channelId].lastTitle = `Collab w/ ${channels[targetId].name}!`;
			} else {
				let num = 2;
				while (channels[channelId].uploadedVideos[`Collab w/ ${channels[targetId].name} #${num}!`]) {
					num++;
					channels[channelId].lastTitle = [`Collab w/ ${channels[targetId].name} #${num}!`];
				}
			}
			channels[channelId].videos++;
			channels[targetId].lastCollabed = Date.now();
			channels[targetId].lastRecorded = Date.now();
			if (!channels[targetId].uploadedVideos[`Collab w/ ${channels[channelId].name}!`]) {
				channels[targetId].lastTitle = `Collab w/ ${channels[channelId].name}!`;
			} else {
				let num = 2;
				while (channels[targetId].uploadedVideos[`Collab w/ ${channels[channelId].name} #${num}!`]) {
					num++;
					channels[targetId].lastTitle = [`Collab w/ ${channels[channelId].name} #${num}!`];
				}
			}
			channels[targetId].videos++;
			if (channels[targetId].profilepic) {
				channels[channelId].lastThumbnail = channels[targetId].profilepic;
			} else {
				channels[channelId].lastThumbnail = null;
			}
			if (channels[channelId].profilepic) {
				channels[targetId].lastThumbnail = channels[channelId].profilepic;
			} else {
				channels[targetId].lastThumbnail = null;
			}
			channels[channelId].uploadedVideos[channels[channelId].lastTitle] = Object.assign({name: channels[channelId].lastTitle, monetized: false, adRevenue: 0, thumbnail: channels[channelId].lastThumbnail, views: traffic, likes: generateLikes, dislikes: generateDislikes, subscribers: subscriberTraffic, unsubs: unsubs, videoProgress: "Edited", recorded: Date.now(), comments: genComments});
			channels[targetId].uploadedVideos[channels[targetId].lastTitle] = Object.assign({name: channels[targetId].lastTitle, monetized: false, adRevenue: 0, thumbnail: channels[targetId].lastThumbnail, views: traffic, likes: generateLikes, dislikes: generateDislikes, subscribers: subscriberTraffic, unsubs: unsubs, videoProgress: "Edited", recorded: Date.now(), comments: genComments});
			// Since the other channel has proposed the collab reset the request now it is complete
			channels[targetId].pendingCollab = null;
			write();
			// PM the other channel's owner that they accepted and tell them what their channel gained
			if (Users.get(channels[targetId].owner)) {
				Users.get(channels[targetId].owner).send(`|pm|${user.getIdentity()}|${channels[targetId].owner}|/raw ${Server.nameColor(user.name, true, true)} has accepted your collaboration request. This resulted in both of you gaining the following: ${traffic.toLocaleString()} ${traffic === 1 ? "view" : "views"}, ${subscriberTraffic.toLocaleString()} ${subscriberTraffic === 1 ? "subscriber" : "subscribers"} and ${generateLikes.toLocaleString()} ${generateLikes === 1 ? "like" : "likes"}. Unfortunately, you lost ${unsubs.toLocaleString()} ${unsubs === 1 ? "subscriber" : "subscribers"}, and got ${generateDislikes.toLocaleString()} ${generateDislikes === 1 ? "dislike" : "dislikes"}.`);
			}
			// If the user's have notifications on send collab cooldown alerts
			if (channels[channelId].notifications) {
				let notification = Date.now() - channels[channelId].lastCollabed + COLLAB_COOLDOWN;
				setTimeout(() => {
					if (Users.get(user.userid)) {
						user.send(`|pm|~DewTube Manager|~|Hey ${user.name}, just wanted to let you know you can collaborate with DewTubers again!`);
					}
				}, notification);
			}
			if (channels[targetId].notifications) {
				let notification = Date.now() - channels[targetId].lastCollabed + COLLAB_COOLDOWN;
				setTimeout(() => {
					if (Users.get(channels[targetId].owner)) {
						Users.get(channels[targetId].owner).send(`|pm|~DewTube Manager|~|Hey ${Users.get(channels[targetId].owner).name}, just wanted to let you know you can collaborate with DewTubers again!`);
					}
				}, notification);
			}
			this.sendReply(`You accepted ${channels[targetId].name}'s collaboration request this resulted in both of you gaining the following: ${traffic.toLocaleString()} ${traffic === 1 ? "view" : "views"}, ${subscriberTraffic.toLocaleString()} ${subscriberTraffic === 1 ? "subscriber" : "subscribers"}, you lost ${unsubs.toLocaleString()} ${unsubs === 1 ? "subscriber" : "subscribers"}, ${generateLikes.toLocaleString()} ${generateLikes === 1 ? "like" : "likes"}, and ${generateDislikes.toLocaleString()} ${generateDislikes === 1 ? "dislike" : "dislikes"}.`);
		},

		reject: "denycollab",
		rejectcollab: "denycollab",
		declinecollab: "denycollab",
		decline: "denycollab",
		deny: "denycollab",
		denycollab: function (target, room, user) {
			if (!target) return this.parse(`/dewtubehelp`);
			let channelId = toId(getChannel(user.userid));
			if (!channels[channelId]) return this.errorReply(`You do not currently own a DewTube channel.`);
			let targetId = toId(target);
			if (!channels[targetId]) return this.errorReply(`"${target}" is not a channel.`);
			if (channels[targetId].pendingCollab !== channels[channelId]) return this.errorReply(`${channels[targetId].name} has not sent you a collaboration request, or it was cancelled.`);
			// Reset the channel that was declined's pending collab
			channels[targetId].pendingCollab = null;
			write();
			// Let the other channel know their collaboration request was declined
			if (Users.get(channels[targetId].owner)) {
				Users.get(channels[targetId].owner).send(`|pm|${user.getIdentity()}|${channels[targetId].owner}|/raw ${Server.nameColor(user.name, true, true)}, owner of ${channels[channelId].name}, has declined your collaboration request. Feel free to try collaborating with another DewTuber.`);
			}
			return this.sendReply(`You have rejected the collaboration request from ${channels[targetId].name}.`);
		},

		endcollab: "cancelcollab",
		cancel: "cancelcollab",
		cancelcollab: function (target, room, user) {
			if (!target) return this.parse(`/dewtubehelp`);
			let channelId = toId(getChannel(user.userid));
			if (!channels[channelId]) return this.errorReply(`You do not currently own a DewTube channel.`);
			let targetId = toId(target);
			if (!channels[targetId]) return this.errorReply(`"${target}" is not a channel.`);
			if (channels[channelId].pendingCollab !== targetId) return this.errorReply(`${channels[targetId].name} does not have a pending collaboration request from you.`);
			// Reset pending collab request to nothing
			channels[channelId].pendingCollab = null;
			write();
			return this.sendReply(`You have cancelled your collaboration request with ${channels[targetId].name}.`);
		},

		icon: "pfp",
		avatar: "pfp",
		profilepicture: "pfp",
		profilepic: "pfp",
		pfp: function (target, room, user) {
			let channelId = toId(getChannel(user.userid));
			if (!channels[channelId]) return this.errorReply(`You do not currently own a DewTube channel.`);
			if (!target) return this.parse(`/dewtubehelp`);
			if (![".png", ".gif", ".jpg"].includes(target.slice(-4))) return this.errorReply(`Your profile picture image must end in an extension like .png, .gif, or .jpg.`);
			channels[channelId].profilepic = target;
			write();
			return this.sendReplyBox(`Your profile picture has been set as: <img src="${target}" height="80" width="80"><br /><small style="color: red">Disclaimer: If your profile picture is unfit for ${Config.serverName}, your DewTube account will be terminated as well as possible punishment on ${Config.serverName}!</small>`);
		},

		channelart: "banner",
		bg: "banner",
		background: "banner",
		banner: function (target, room, user) {
			let channelId = toId(getChannel(user.userid));
			if (!channels[channelId]) return this.errorReply(`You do not currently own a DewTube channel.`);
			if (!target) return this.parse(`/dewtubehelp`);
			if (![".png", ".gif", ".jpg"].includes(target.slice(-4))) return this.errorReply(`Your banner image must end in an extension like .png, .gif, or .jpg.`);
			channels[channelId].banner = target;
			write();
			return this.sendReplyBox(`Your banner has been set as: <img src="${target}"><br /><small style="color: red">Disclaimer: If your banner is unfit for ${Config.serverName}!, your DewTube account will be terminated as well as possible punishment on ${Config.serverName}!</small>`);
		},

		vids: "videos",
		videos: function (target, room, user) {
			if (!this.runBroadcast()) return;
			if (!target) target = toId(getChannel(user.userid));
			let channelId = toId(target);
			if (!channels[channelId]) return this.errorReply(`This is not a DewTube channel.`);
			let videos = channels[channelId].uploadedVideos;
			if (!Object.keys(videos).length) return this.errorReply(`This DewTuber doesn't have any video data, or hasn't uploaded one yet.`);
			let sortedVids = Object.keys(videos).sort(function (a, b) {
				return videos[b].recorded - videos[a].recorded;
			});
			let display = `<div style="max-height: 200px; width: 100%; overflow: scroll;${channels[channelId].banner ? ` background:url(${channels[channelId].banner}); background-size: 100% 100%;` : ``}"><h2 style="font-weight: bold; text-align: center">${channels[channelId].name}'${channels[channelId].name.endsWith("s") ? `` : `s`} Videos:</h2>`;
			display += `<table border="1" cellspacing ="0" cellpadding="8"><tr style="font-weight: bold"><td>Title:</td><td>Views:</td><td>Likes:</td><td>Dislikes:</td><td>Subscribers:</td><td>Unsubs:</td><td>Monetized:</td><td>Uploaded:</td><td>View:</td></tr>`;
			for (let video of sortedVids) {
				let curVideo = videos[video];
				display += `<tr><td style="border: 2px solid #000000; width: 20%; text-align: center">${curVideo.name}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${curVideo.views.toLocaleString()}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${curVideo.likes.toLocaleString()}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${curVideo.dislikes.toLocaleString()}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${curVideo.subscribers.toLocaleString()}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${curVideo.unsubs.toLocaleString()}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${curVideo.monetized ? `&#9745;` : `&#x2717;`}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${new Date(curVideo.recorded)}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center"><button class="button" name="send" value="/dewtube view ${channels[channelId].id}, ${curVideo.name}">View</button></td>`;
			}
			display += `</tr></table></div>`;
			return this.sendReplyBox(display);
		},

		viewvideo: "view",
		videoanalytics: "view",
		view: function (target) {
			if (!this.runBroadcast()) return;
			let [channel, video] = target.split(",").map(p => { return p.trim(); });
			if (!video) return this.parse("/dewtubehelp");
			let channelId = toId(channel);
			if (!channels[channelId]) return this.errorReply(`"${channel}" does not appear to be a channel.`);
			let vid = channels[channelId].uploadedVideos[video];
			if (!vid) return this.errorReply(`${channels[channelId].name} appears to not have a video titled "${video}".`);
			let analytics = `<div style="max-height: 200px; width: 100%; overflow: scroll;${channels[channelId].thumbnail ? ` background:url(${channels[channelId].thumbnail}); background-size: 100% 100%;` : ``}"><h2 style="font-weight: bold; text-align: center">${vid.name}</h2>`;
			analytics += `This video was${vid.monetized ? `` : `n't`} monetized${vid.monetized ? `, and got ${vid.adRevenue} ${vid.adRevenue === 1 ? moneyName : moneyPlural}` : ``}.<br />`;
			analytics += `This video got ${vid.views.toLocaleString()} view${Chat.plural(vid.views)}.<br />`;
			if (vid.subscribers > 0) analytics += `This video got ${channels[channelId].name} ${vid.subscribers.toLocaleString()} subscriber${Chat.plural(vid.subscribers)}.<br />`;
			if (vid.unsubs > 0) analytics += `This video unfortunately had ${vid.unsubs.toLocaleString()} user${Chat.plural(vid.unsubs)} to unsubscribe.<br />`;
			if (vid.likes > 0) analytics += `This video got ${vid.likes.toLocaleString()} like${Chat.plural(vid.likes)}.<br />`;
			if (vid.dislikes > 0) analytics += `Sadly this video got ${vid.dislikes.toLocaleString()} dislike${Chat.plural(vid.likes)}.<br />`;
			analytics += `Uploaded: ${new Date(vid.recorded)}.<br />`;
			if (vid.comments && vid.comments.length > 0) analytics += `<details><summary>Comments:</summary> ${Chat.toListString(vid.comments)}</details>`;
			analytics += `</div>`;
			return this.sendReplyBox(analytics);
		},

		"": "help",
		help: function () {
			this.parse("/dewtubehelp");
		},
	},

	dewtubehelp: [
		`/dewtube create [name], [description] - Creates a DewTube channel.
		/dewtube delete [name] - Deletes a DewTube channel. If the channel is not yours, this command requires @, &, ~.
		/dewtube desc [description] - Edits your DewTube channel's about me.
		/dewtube record [title], [optional thumbnail link] - Films a DewTube video with the title [title] and thumbnail if included.
		/dewtube edit - Edits a DewTube video.
		/dewtube publish - Publishs a DewTube video.
		/dewtube collab [channel] - Requests to collaborate with the specified channel.
		/dewtube accept [channel] - Accepts a collaboration request from the specified channel.
		/dewtube deny [channel] - Declines a collaboration request from the specified channel.
		/dewtube cancel [channel] - Cancels a collaboration request that you sent the specified channel.
		/dewtube monetization - Toggles monetization on your DewTube videos. Must have 1,000 subscribers.
		/dewtube drama [channel name] - Starts drama against the other channel. Both parties must have drama enabled.
		/dewtube toggledrama - Toggles on/off starting/being a target of drama.
		/dewtube notify - Toggles on/off notifications for when your cooldowns are finished.
		/dewtube pfp [image] - Sets your DewTube channel profile picture as [image].
		/dewtube banner [image] - Sets your DewTube channel banner as [image].
		/dewtube dashboard [channel name] - Shows the channel's dashboard; defaults to yourself.
		/dewtube videos [channel name] - Shows the channel's uploaded videos; defaults to yourself.
		/dewtube view [channel name], [video] - Shows [channel]'s video [video]'s analytics.
		/dewtube info - Shows the DewTube version and recent changes.
		/dewtube discover - Shows all of the DewTube channels.
		/dewtube help - Displays this help command.`,
	],
};
