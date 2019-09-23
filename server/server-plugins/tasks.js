/********************************
 * Tasks (To-Do/Jobs) Plug-in	*
 * Created for Pokemon Showdown	*
 * Created by Insist			*
 ********************************/

"use strict";

function alertDevs(message) {
	Server.devPM("~Developer Chat", `New task: ${message}`);
	if (Rooms.get(`development`)) Rooms.get(`development`).add(`|c|~Developer Alert|/raw ${message}`).update();
}

exports.commands = {
	jobs: "tasks",
	job: "tasks",
	todo: "tasks",
	task: "tasks",
	tasks: {
		new: "add",
		issue: "add",
		add(target, room, user) {
			if (!Server.isDev(user.userid) && !this.can("bypassall")) return false;
			let [issue, priority, ...description] = target.split(",").map(p => p.trim());
			if (!(issue && priority && description)) return this.parse("/taskshelp");
			let task = Db.tasks.get("development", {issues: {}});
			let id = toID(issue);
			if (task.issues[id]) return this.errorReply(`This issue title already exists.`);
			if (issue.length < 1 || issue.length > 30) return this.errorReply(`The issue title should not exceed 30 characters long. Feel free to continue in the description.`);
			if (description.length < 1 || description.length > 100) return this.errorReply(`The description should not exceed 100 characters long.`);
			if (isNaN(priority) || priority > 6 || priority < 1) return this.errorReply(`The priority should be an integer between 1-6; 1 being the highest priority.`);
			task.issues[id] = {id, issue, description, employer: user.userid, priority};
			Db.tasks.set("development", task);
			alertDevs(`${Server.nameColor(user.name, true, true)} has filed an issue.<br />Issue: ${issue}.<br />Description: ${description}.<br />Priority: ${priority}.`);
			return this.sendReply(`The task "${issue}" has been added to the ${Config.serverName} Task List.`);
		},

		remove: "delete",
		clear: "delete",
		fixed: "delete",
		delete(target, room, user) {
			if (!Server.isDev(user.userid) && !this.can("bypassall")) return false;
			target = toID(target);
			let task = Db.tasks.get("development", {issues: {}});
			if (!target) return this.parse(`/taskshelp`);
			if (!task.issues[target]) return this.errorReply(`The issue "${target}" has not been reported.`);
			delete task.issues[target];
			Db.tasks.set("development", task);
			return this.sendReply(`The task "${target}" has been deleted.`);
		},

		"": "list",
		tasks: "list",
		task: "list",
		list(target, room, user) {
			if (!Server.isDev(user.userid) && !this.can("bypassall")) return false;
			if (!this.runBroadcast()) return;
			if (this.broadcasting && room.id !== "development") return this.errorReply(`You may only broadcast this command in Development.`);
			let taskList = Db.tasks.get("development", {issues: {}});
			if (Object.keys(taskList.issues).length < 1) return this.errorReply(`There are currently no issues on ${Config.serverName}.`);
			let display = `<center><h1>${Config.serverName}'s Tasks List:</h1><table border="1" cellspacing ="0" cellpadding="4"><tr style="font-weight: bold"><td>Employer</td><td>Issue Title</td><td>Issue Description</td><td>Issue Priority</td><td>Resolved?</td></tr>`;
			let sortedIssues = Object.keys(taskList.issues).sort(function (a, b) {
				a = taskList.issues[a].priority;
				b = taskList.issues[b].priority;
				return a - b;
			});
			sortedIssues.forEach(task => {
				display += `<tr>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center"><button class="button" name="parseCommand" value="/user ${taskList.issues[task].employer}">${Server.nameColor(taskList.issues[task].employer, true, true)}</button></td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${taskList.issues[task].issue}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${taskList.issues[task].description}</td>`;
				display += `<td style="border: 2px solid #000000; width: 20%; text-align: center">${taskList.issues[task].priority}</td>`;
				if (!this.broadcasting) display += `<td style="border: 2px solid #000000; width: 20%; text-align: center"><button class="button" name="send" value="/tasks delete ${task}">Resolved!</button></td>`;
				display += `</tr>`;
			});
			display += `</table></center>`;
			return this.sendReplyBox(display);
		},

		help(target, room, user) {
			this.parse(`/taskshelp`);
		},
	},

	taskhelp: "taskshelp",
	taskshelp: [
		`/tasks add [issue|TODO], [priority (1-6)], [description of what needs to be done] - Adds an item to the server's tasks list with the specified priority (1 being the highest; 6 being the lowest) with a description of the issue/project. Must be a Registered Developer on the server.
		/tasks delete [issue] - Deletes an item from the server's task list. Must be a Registered Developer.
		/tasks list - Displays the server's task list. Must be a Registered Developer; may only be broadcasted in Development rooms.
		/tasks help - Displays this help command.`,
	],
};
