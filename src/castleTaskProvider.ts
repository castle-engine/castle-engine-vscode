import * as vscode from 'vscode';
import * as path from 'path';
import * as castlePath from './castlePath';
import { CastleConfiguration } from './castleConfiguration';

export class CastleTaskProvider implements vscode.TaskProvider
{
    private _castleConfig: CastleConfiguration;
    private _compileTask: vscode.Task;
    private _onlyRunTask: vscode.Task;
    private _compileAndRunTask: vscode.Task;
    private _cleanTask: vscode.Task;

    /**
     * @param {CastleConfiguration} castleConfig
     */
    constructor(castleConfig: CastleConfiguration) {
        this._castleConfig = castleConfig;
        this.createTasks();
    }

    /* Return ShellExecutionOptions for all build tasks. */
    private buildShellExecutionOptions(): vscode.ShellExecutionOptions
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
            overrideEnv['CASTLE_ENGINE_PATH'] = this._castleConfig.enginePath;
        };

        let newPathList = process.env.PATH.split(path.delimiter);
        // build tool may want to run FPC, so extend PATH with FPC directory
        if (this._castleConfig.fpcExecutablePath !== '') {
            newPathList.unshift(path.dirname(this._castleConfig.fpcExecutablePath));
        }
        // build tool may want to run lazbuild, so extend PATH with Lazarus directory.
        // We assume here that lazarusSourcesPath is also Lazarus binary directory.
        if (this._castleConfig.lazarusSourcesPath !== '') {
            newPathList.unshift(this._castleConfig.lazarusSourcesPath);
        }
        overrideEnv['PATH'] = newPathList.join(path.delimiter);
        console.log(`Extended execution environment PATH (to add FPC, Lazarus paths): ${overrideEnv['PATH']}`);

        let result = { // : vscode.ShellExecutionOptions =
            env: overrideEnv
        };
        return result;
    }

    /* Create vscode.ShellExecution for compile task. */
    private executionCompile(): vscode.ShellExecution
    {
        return new vscode.ShellExecution(
            this._castleConfig.buildToolPath,
            ['compile', '--mode=' + this._castleConfig.buildMode.buildTool],
            this.buildShellExecutionOptions()
        );
    }

    /* Create vscode.ShellExecution for "run" task.
     */
    private executionOnlyRun(): vscode.ShellExecution
    {
        return new vscode.ShellExecution(
            this._castleConfig.buildToolPath,
            ['run', '--mode=' + this._castleConfig.buildMode.buildTool],
            this.buildShellExecutionOptions()
        );
    }

    /* Create vscode.ShellExecution for "compile and run" task. */
    private executionCompileAndRun(): vscode.ShellExecution
    {
        return new vscode.ShellExecution(
            this._castleConfig.buildToolPath,
            ['compile-run', '--mode=' + this._castleConfig.buildMode.buildTool],
            this.buildShellExecutionOptions()
        );
    }

    /* Create vscode.ShellExecution for clean task. */
    private executionClean(): vscode.ShellExecution
    {
        return new vscode.ShellExecution(
            this._castleConfig.buildToolPath,
            ['clean'],
            this.buildShellExecutionOptions()
        );
    }

    private createTasks(): void
    {
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

            this._onlyRunTask = new vscode.Task(
                { type: 'cge-tasks' },
                bestWorkspaceFolder,
                'only-run-cge-game-task', // task name
                'CGE', // prefix for all tasks
                this.executionOnlyRun(),
                '$cge-problem-matcher'
            );

            this._compileAndRunTask = new vscode.Task(
                { type: 'cge-tasks' },
                bestWorkspaceFolder,
                'compile-and-run-cge-game-task', // task name
                'CGE', // prefix for all tasks
                this.executionCompileAndRun(),
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
        }
    }

    /**
     * Updates the tasks to
     * - use proper build mode
     * - proper buildToolPath
     */
    updateCastleTasks(): void
    {
        this._compileTask.execution = this.executionCompile();
        this._onlyRunTask.execution = this.executionOnlyRun();
        this._compileAndRunTask.execution = this.executionCompileAndRun();
        this._cleanTask.execution = this.executionClean();
    }

    /**
     * @returns {vscode.Task} compile task
     */
    get compileTask(): vscode.Task {
        return this._compileTask;
    }

    /**
     * @returns {vscode.Task} run task
     */
    get onlyRunTask(): vscode.Task {
        return this._onlyRunTask;
    }

    /**
     * @returns {vscode.Task} compile and run task
     */
    get compileAndRunTask(): vscode.Task {
        return this._compileAndRunTask;
    }

    /**
      * @returns {vscode.Task} clean sources task
      */
    get cleanTask(): vscode.Task {
        return this._cleanTask;
    }

    /* Return either "only run" or "compile and run" task,
     * depending on whether _castleConfig.recompilationNeeded is true.
     */
    public compileIfNecessaryAndRunTask(): vscode.Task {
        return this._castleConfig.recompilationNeeded ? this._compileAndRunTask : this._onlyRunTask;
    }

    provideTasks(): vscode.Task[]
    {
        try {
            if (this._castleConfig.buildToolPath === '') {
                return [];
            }
            this.updateCastleTasks();
            return [
                this._compileTask,
                this.compileIfNecessaryAndRunTask(),
                this._cleanTask
            ];
        }
        catch (err) {
            vscode.window.showErrorMessage(`provideTasks - EXCEPTION: ${err}`);
            return [];
        }
    }

    resolveTask(_task: vscode.Task): vscode.Task | undefined {
        return _task;
    }
}
