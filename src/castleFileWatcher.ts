import * as vscode from 'vscode';
import * as path from 'path';
import * as castlePath from './castlePath';
import { CastleConfiguration } from './castleConfiguration';
import { CastlePlugin } from './castlePlugin';

/**
 * Observes file system for changes in files and sets castleConfig.recompilationNeeded to true
 * after a source file is created/deleted.modified.
 * After recompilation sets it to false.
 */
export class CastleFileWatcher
{
    private _castleConfig: CastleConfiguration;
    private _castlePlugin: CastlePlugin;
    private _vsFileSystemWatcher: vscode.FileSystemWatcher;
    private _vsManifestFileWatcher: vscode.FileSystemWatcher;

    constructor(context: vscode.ExtensionContext, castleConfig: CastleConfiguration, castlePlugin: CastlePlugin)
    {
        this._castleConfig = castleConfig;
        this._castlePlugin = castlePlugin;

        this.createPascalSourceFilesWatcher(context);
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
            } else
            if (atask.execution.task.name === "compile-and-run-cge-game-task") {
                console.log("Compilation and run success");
                this._castleConfig.recompilationNeeded = false;
            }
        });
    }

    /**
     * Creates source files (pas,pp,inc,dpr,lpr) file watcher
     */
    createPascalSourceFilesWatcher(context: vscode.ExtensionContext): void
    {
        this._vsFileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{pas,pp,inc,dpr,lpr}');

        this._vsFileSystemWatcher.onDidChange((/*uri*/ /* unused */) => {
            // Too spammy log, occurs too often and can fill the console in developer tools
            //console.log(`Pascal file changed: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
        });

        this._vsFileSystemWatcher.onDidCreate((uri) => {
            console.log(`Pascal file created: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
        });

        this._vsFileSystemWatcher.onDidDelete((uri) => {
            console.log(`Pascal file deleted: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
        });

        context.subscriptions.push(this._vsFileSystemWatcher);
    }

    /**
     * Creates manifest file watcher
     */
    createManifestFileWatcher(context: vscode.ExtensionContext): void
    {
        let bestWorkspaceFolder = castlePath.bestWorkspaceFolder();
        const filePath = path.join(bestWorkspaceFolder.uri.fsPath, 'CastleEngineManifest.xml');
        this._vsManifestFileWatcher = vscode.workspace.createFileSystemWatcher(filePath);

        this._vsManifestFileWatcher.onDidChange(async (uri) => {
            console.log(`Manifest file changed: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
            await this._castlePlugin.updateLanguageServer();
        });

        this._vsManifestFileWatcher.onDidCreate(async (uri) => {
            console.log(`Manifest file created: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
            await this._castlePlugin.updateLanguageServer();
        });

        this._vsManifestFileWatcher.onDidDelete(async (uri) => {
            console.log(`Manifest file deleted: ${uri.fsPath}`);
            this._castleConfig.recompilationNeeded = true;
            await this._castlePlugin.updateLanguageServer();
        });

        context.subscriptions.push(this._vsManifestFileWatcher);
    }
}
