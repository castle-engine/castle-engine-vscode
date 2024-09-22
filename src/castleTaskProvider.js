const vscode = require("vscode");
const castlePath = require('./castlePath.js');

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

	/* Return ShellExecutionOptions for all build tasks. */
	buildShellExecutionOptions()
	{
		let overrideEnv = {
		};
		/*
			Extend the environment to
		  - define CASTLE_ENGINE_PATH, if the engine path is defined in VS Code settings
			  (overrides build tool auto-detection).
			- extend PATH, to let build tool find fpc / lazbuild.

			Similar to what Castle Game Engine editor does when executing build tool
		  (see https://github.com/castle-engine/castle-engine/blob/25fc71afc3a3686e44d8e162b57d83bef217cd5f/tools/castle-editor/code/editorutils.pas#L435 ).
		*/
		if (this._castleConfig.enginePath !== '') {
			overrideEnv.CASTLE_ENGINE_PATH = this._castleConfig.enginePath;
		};
		// TODO: extend PATH with FPC and Lazarus
		// console.log(`buildShellExecutionOptions: overrideEnv = ${overrideEnv}`);
		// console.log('existing PATH = ' + process.env.PATH);
		let result = { // : vscode.ShellExecutionOptions =
			env: overrideEnv
		};
		return result;
	}

	/* Create vscode.ShellExecution for compile task. */
	executionCompile()
	{
		return new vscode.ShellExecution(
			this._castleConfig.buildToolPath,
			['compile', '--mode=' + this._castleConfig.buildMode.buildTool],
			this.buildShellExecutionOptions()
		);
	}

	/* Create vscode.ShellExecution for "compile and run" task.
	 * @param {boolean} recompilationNeeded - if true, we will execute compile-run, otherwise just run.
	*/
	executionRun(recompilationNeeded)
	{
		let command = recompilationNeeded ? 'compile-run' : 'run';
		return new vscode.ShellExecution(
			this._castleConfig.buildToolPath,
			[command, '--mode=' + this._castleConfig.buildMode.buildTool],
			this.buildShellExecutionOptions()
		);
	}

	/* Create vscode.ShellExecution for clean task. */
	executionClean()
	{
		return new vscode.ShellExecution(
			this._castleConfig.buildToolPath,
			['clean'],
			this.buildShellExecutionOptions()
		);
	}

	createTasks() {
		let bestWorkspaceFolder = castlePath.bestWorkspaceFolder();
		try {
			this._compileTask = new vscode.Task(
				{ type: 'cge-tasks' },
				bestWorkspaceFolder,
				'compile-cge-game-task', // task name
				'CGE', // prefix for all tasks
				this.executionCompile(),
				'$cge-problem-matcher'
			);
			this._compileTask.group = vscode.TaskGroup.Build;

			this._runTask = new vscode.Task(
				{ type: 'cge-tasks' },
				bestWorkspaceFolder,
				'run-cge-game-task', // task name
				'CGE', // prefix for all tasks
				this.executionRun(true),
				'$cge-problem-matcher'
			);

			this._cleanTask = new vscode.Task(
				{ type: 'cge-tasks' },
				bestWorkspaceFolder,
				'clean-cge-game-task', // task name
				'CGE', // prefix for all tasks
				this.executionClean(),
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
	 * Updates the tasks to
	 * - use proper build mode
	 * - proper buildToolPath
	 * - follow recompileNeeded flag
	 */
	updateCastleTasks() {
		this._compileTask.execution = this.executionCompile();
		this._runTask.execution = this.executionRun(this._castleConfig.recompilationNeeded);
		this._cleanTask.execution = this.executionClean();
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