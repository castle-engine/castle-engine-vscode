const vscode = require("vscode");

// eslint-disable-next-line no-unused-vars
const castleConfiguration = require('./castleConfiguration.js');


class CastleTaskProvder {

	/**
	 * @param {castleConfiguration.CastleConfiguration} castleConfig 
	 */
	constructor(castleConfig) {
		this._castleConfig = castleConfig;
		this.createTasks();
	}

	createTasks() {
		try {
			this._compileGameTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'compile-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution(this._castleConfig.buildToolPath + ' compile --mode=' + this._castleConfig.buildMode.buildTool), // what to do
				'$cge-problem-matcher'
			);
			this._compileGameTask.group = vscode.TaskGroup.Build;

			this._runGameTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'run-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution(this._castleConfig.buildToolPath + ' compileandrun --mode=' + this._castleConfig.buildMode.buildTool), // what to do
				'$cge-problem-matcher'
			);

			this._cleanGameTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'clean-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution(this._castleConfig.buildToolPath + ' clean'), // what to do
				'$cge-problem-matcher'
			);
			this._cleanGameTask.group = vscode.TaskGroup.Clean;
		}
		catch (err) {
			vscode.window.showErrorMessage(`createTasks - EXCEPTION: ${err}`);
			return;
		}

	}

	/**
	 * Updates compile task to use proper build mode and run game 
	 * task when recompilationNeeded changes.
	 */
	updateCastleTasks() {
		if (this._castleConfig.recompilationNeeded)
			this._runGameTask.execution = new vscode.ShellExecution(this._castleConfig.buildToolPath + ' compileandrun --mode=' + this._castleConfig.buildMode.buildTool);
		else
			this._runGameTask.execution = new vscode.ShellExecution(this._castleConfig.buildToolPath + ' run --mode=' + this._castleConfig.buildMode.buildTool);

		this._compileGameTask.execution = new vscode.ShellExecution(this._castleConfig.buildToolPath + ' compile --mode=' + this._castleConfig.buildMode.buildTool);
	}

	/**
	 * @returns {vscode.Task} compile task
	 */
	get compileGameTask() {
		return this._compileGameTask;
	}

	/**
	 * @returns {vscode.Task} run task
	 */
	get runGameTask() {
		return this._runGameTask;
	}

	/**
	  * @returns {vscode.Task} clean sources task
	  */
	get cleanGameTask() {
		return this._cleanGameTask;
	}

	provideTasks() {
		try {
			this.updateCastleTasks();

			return [this._compileGameTask, this._runGameTask, this._cleanGameTask];
		}
		catch (err) {
			vscode.window.showErrorMessage(`provideTasks - EXCEPTION: ${err}`);
			return;
		}
	}

	resolveTask(_task) {
		return _task;
	}
}

module.exports = CastleTaskProvder;