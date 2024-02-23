const vscode = require("vscode");

// eslint-disable-next-line no-unused-vars
const castleConfiguration = require('./castleConfiguration.js');

class CastleTaskProvider {

	/**
	 * @param {castleConfiguration.CastleConfiguration} castleConfig
	 */
	constructor(castleConfig) {
		this._castleConfig = castleConfig;
		this.createTasks();
	}

	createTasks() {
		try {
			this._compileTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'compile-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution(this._castleConfig.buildToolPath, ['compile', '--mode=' + this._castleConfig.buildMode.buildTool]), // what to do
				'$cge-problem-matcher'
			);
			this._compileTask.group = vscode.TaskGroup.Build;

			this._runTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'run-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution(this._castleConfig.buildToolPath, [' compile-run', '--mode=' + this._castleConfig.buildMode.buildTool]), // what to do
				'$cge-problem-matcher'
			);

			this._cleanTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'clean-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution(this._castleConfig.buildToolPath, ['clean']), // what to do
				'$cge-problem-matcher'
			);
			this._cleanTask.group = vscode.TaskGroup.Clean;
		}
		catch (err) {
			vscode.window.showErrorMessage(`createTasks - EXCEPTION: ${err}`);
			return;
		}

	}

	/**
	 * Updates compile task to use proper build mode and run game
	 * task when recompilationNeeded changes o buildToolPath changes.
	 */
	updateCastleTasks() {
		if (this._castleConfig.recompilationNeeded)
			this._runTask.execution = new vscode.ShellExecution(this._castleConfig.buildToolPath, ['compile-run', '--mode=' + this._castleConfig.buildMode.buildTool]);
		else
			this._runTask.execution = new vscode.ShellExecution(this._castleConfig.buildToolPath, ['run', '--mode=' + this._castleConfig.buildMode.buildTool]);

		this._compileTask.execution = new vscode.ShellExecution(this._castleConfig.buildToolPath, ['compile', '--mode=' + this._castleConfig.buildMode.buildTool]);

		this._cleanTask.execution = new vscode.ShellExecution(this._castleConfig.buildToolPath, ['clean']);
	}

	/**
	 * @returns {vscode.Task} compile task
	 */
	get compileTask() {
		return this._compileTask;
	}

	/**
	 * @returns {vscode.Task} run task
	 */
	get runTask() {
		return this._runTask;
	}

	/**
	  * @returns {vscode.Task} clean sources task
	  */
	get cleanTask() {
		return this._cleanTask;
	}

	provideTasks() {
		try {
			if (this._castleConfig.buildToolPath === '')
				return [];

			this.updateCastleTasks();
			return [this._compileTask, this._runTask, this._cleanTask];
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

module.exports = CastleTaskProvider;