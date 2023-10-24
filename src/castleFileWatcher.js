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
    }
}

module.exports = CastleFileWatcher;