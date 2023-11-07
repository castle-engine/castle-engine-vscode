const vscode = require("vscode");

//TODO: use buildTool variable to ensure task will work when no castle-engine in path

class CastleTaskProvder {

    constructor (castleFileWatcher, buildTool, castleConfig) {
        this._castleFileWatcher = castleFileWatcher;
        this._buildTool = buildTool;
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
				new vscode.ShellExecution('castle-engine compile --mode=' + this._castleConfig.buildMode.buildTool), // what to do
				'$cge-problem-matcher'
			);
			this._compileGameTask.group = vscode.TaskGroup.Build;

			this._runGameTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'run-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution('castle-engine compileandrun --mode=' + this._castleConfig.buildMode.buildTool), // what to do
				'$cge-problem-matcher'
			);

			this._cleanGameTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'clean-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution('castle-engine clean'), // what to do
				'$cge-problem-matcher'
			);
			this._cleanGameTask.group = vscode.TaskGroup.Clean;
		}
		catch (err) {
			vscode.window.showErrorMessage(`createTasks - EXCEPTION: ${err}`);
			return;
		}

	}

	updateCastleTasks() {
		if (this._castleFileWatcher.recompilationNeeded)
			this._runGameTask.execution = new vscode.ShellExecution('castle-engine compileandrun --mode=' + this._castleConfig.buildMode.buildTool);
		else
			this._runGameTask.execution = new vscode.ShellExecution('castle-engine run --mode=' + this._castleConfig.buildMode.buildTool);

		this._compileGameTask.execution = new vscode.ShellExecution('castle-engine compile --mode=' + this._castleConfig.buildMode.buildTool);
	}

	get compileGameTask() {
		return this._compileGameTask;
	}

	get runGameTask() {
		return this._runGameTask;
	}

	get cleanGameTask() {
		return this._cleanGameTask;
	}

	provideTasks() {
		console.log('provideTasks - START');
		try {
			this.updateCastleTasks();
			console.log('provideTasks - STOP');

			return [this._compileGameTask, this._runGameTask, this._cleanGameTask];
		}
		catch (err) {
			vscode.window.showErrorMessage(`provideTasks - EXCEPTION: ${err}`);
			return;
		}
	}

	resolveTask(_task) {
		console.log("resolveTask - START");
		return _task;
	}
}

module.exports = CastleTaskProvder;