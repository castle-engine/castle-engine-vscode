const vscode = require("vscode");
const path = require('path');
// eslint-disable-next-line no-unused-vars
const CastlePlugin = require("./castlePlugin");

/**
 * Observes file system for changes in files and sets castleConfig.recompilationNeeded to true 
 * after a source file is created/deleted.modified.
 * After recompilation sets it to false.
 */
class CastleFileWatcher {

    /**
    * @param {vscode.ExtensionContext} context
    * @param {castleConfiguration.CastleConfiguration} castleConfig
    * @param {CastlePlugin} castlePlugin 
    */
    constructor(context, castleConfig, castlePlugin) {
        this._vsFileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{pas,pp,inc,dpr,lpr}');
        this._castleConfig = castleConfig;
        this._castlePlugin = castlePlugin;

        this._vsFileSystemWatcher.onDidChange((uri) => {
            console.log(`Change in file: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
        });

        this._vsFileSystemWatcher.onDidCreate((uri) => {
            console.log(`New file created: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
        });

        this._vsFileSystemWatcher.onDidDelete((uri) => {
            console.log(`Source file deleted: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
        });

        context.subscriptions.push(this._vsFileSystemWatcher);

        this.createManifestFileWatcher(context);

        // reaction to game compilation task
        vscode.tasks.onDidEndTaskProcess((atask) => {
            if (atask.execution.task.name === "compile-cge-game-task") {
                if (atask.exitCode === 0) {
                    console.log("Compilation success");
                    this._castleConfig.recompilationNeeded = false;
                    vscode.window.showInformationMessage("CGE: Compilation success");
                } else {
                    console.error("Compilation failed");
                    this._castleConfig.recompilationNeeded = true;
                    vscode.window.showErrorMessage("CGE: Compilation failed");
                }
            } else
                if (atask.execution.task.name === "clean-cge-game-task") {
                    this._castleConfig.recompilationNeeded = true;
                }
                else
                    if (atask.execution.task.name === "run-cge-game-task") {
                        if ((atask.execution.task.execution.commandLine.indexOf('compile-run') > 0) && (atask.exitCode === 0)) {
                            console.log("Compilation with running success");
                            this._castleConfig.recompilationNeeded = false;
                        }
                    }
        });
    }

    /**
     * Creates manifest file watcher
     * @param {vscode.ExtensionContext} context 
     */
    createManifestFileWatcher(context) {
        const filePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'CastleEngineManifest.xml');
        this._vsManifestFileWatcher = vscode.workspace.createFileSystemWatcher(filePath);

        this._vsManifestFileWatcher.onDidChange(async (uri) => {
            console.log(`Change in manifest file: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
            await this._castlePlugin.updateLanguageServer();
        });

        this._vsManifestFileWatcher.onDidCreate((uri) => {
            console.log(`Manifest file created: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
        });

        this._vsManifestFileWatcher.onDidDelete((uri) => {
            console.log(`Manifest file deleted: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
        });
        
        context.subscriptions.push(this._vsManifestFileWatcher);
    }
}

module.exports = CastleFileWatcher;