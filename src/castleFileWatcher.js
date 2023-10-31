const vscode = require("vscode");

/**
 * Check recompilationNeeded when you run application or debugger.
 * After recompilation set it to false
 */
class CastleFileWatcher {

    /**
    * @param {vscode.ExtensionContext} context
    */
    constructor(context) {
        this._vsFileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{pas,pp,inc}');
        this.recompilationNeeded = true;

        this._vsFileSystemWatcher.onDidChange((uri) => {
            console.log(`Change in file: ${uri.fsPath}`);
            this.recompilationNeeded = true;
        });

        this._vsFileSystemWatcher.onDidCreate((uri) => {
            console.log(`New file created: ${uri.fsPath}`);
            this.recompilationNeeded = true;
        });

        this._vsFileSystemWatcher.onDidDelete((uri) => {
            console.log(`Source file deleted: ${uri.fsPath}`);
            this.recompilationNeeded = true;
        });

        context.subscriptions.push(this._vsFileSystemWatcher);


        // reaction to game compilation task
        vscode.tasks.onDidEndTaskProcess((atask) => {
            if (atask.execution.task.name === "compile-cge-game-task") {
                if (atask.exitCode === 0) {
                    console.log("Compilation success");
                    this.recompilationNeeded = false;
                    vscode.window.showInformationMessage("CGE: Compilation success");
                } else {
                    console.error("Compilation failed");
                    this.recompilationNeeded = true;
                    vscode.window.showErrorMessage("CGE: Compilation failed");
                }
            } else
                if (atask.execution.task.name === "clean-cge-game-task") {
                    this.recompilationNeeded = true;
                }

        });


    }
}

module.exports = CastleFileWatcher;