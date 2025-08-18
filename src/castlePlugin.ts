import vscode from 'vscode';
import { CastleDebugProvider } from './castleDebugProvider';
import { CastleConfiguration, CastleBuildModes } from './castleConfiguration';
import { CastleFileWatcher } from './castleFileWatcher';
import { CastleTaskProvider } from './castleTaskProvider';
import { CastleStatusBar } from './castleStatusBar';
import { CastlePascalLanguageServer } from './castlePascalLanguageServer';
import * as castleExec from './castleExec';

/**
 * Main class of plugin that encapsulates everything and manages the plugin's state.
 *
 * The most important functions are activatePlugin(), updatePlugin() and deactivatePlugin().
 */
export class CastlePlugin
{
    private _context;
    private _castleConfig;
    private _castleLanguageServer;
    private _castleFileWatcher;
    private _castleTaskProvider;
    private _castleDebugProvider;
    private _disposableDebugConfProvider;
    private _disposableCompile;
    private _disposableRun;
    private _disposableClean;
    private _disposableOpenInEditor;
    private _referencePanel;
    private _castleStatusBar;
    private _taskCommandsRegistered;
    private _editorCommandsRegistered;
    private _searchInApiReferenceCommandsRegistered;
    private _validateCommandsRegistered;

    constructor(context) {
        this._context = context;
        this._taskCommandsRegistered = false;
        this._editorCommandsRegistered = false;
        this._searchInApiReferenceCommandsRegistered = false;
        this._validateCommandsRegistered = false;
    }

    /**
     * Activates plugin when activate(context) is called.
     */
    async activatePlugin() {
        await this.updateConfiguration();
        await this.updateLanguageServer();
        this.updateFileWatcher();
        this.updateTaskProvider();
        this.updateEditorCommand();
        this.updateSearchInApiReferenceCommands();
        this.updateValidateAndOpenSettingsCommand();
        this.updateDebugProvider();
        this.updateStatusBar();
    }

    /**
     * Full plugin update when configuration changes.
     */
    async updatePlugin() {
        await this.activatePlugin();
    }

    /**
     * Deactivates plugin when deactivate() is called.
     */
    async deactivatePlugin() {
        await this._castleLanguageServer.destroyLanguageClient();
    }

    /**
     * When called first time creates CastleConfiguration object and reads/finds configuration.
     * In other cases only reloads configuration.
     */
    async updateConfiguration() {
        if (this._castleConfig === undefined) {
            this._castleConfig = new CastleConfiguration(CastleBuildModes.DEBUG);
        }
        await this._castleConfig.findPaths();
        this._castleConfig.updateFpcTargetCpu();
        this._castleConfig.updateFpcTargetOs();
        this._castleConfig.updateDeveloperMode();
    }

    /**
     * When called first time creates CastlePascalLanguageServer object, reads/finds language server configuration and
     * starts pascal language server.
     *
     * In other cases reloads configuration and reruns pascal language server.
     */
    async updateLanguageServer() {
        this._castleConfig.updateDeveloperMode();
        if (this._castleLanguageServer === undefined) {
            this._castleLanguageServer = new CastlePascalLanguageServer(this._castleConfig);
        }

        // When there is no pascal language server we still can run the extension
        // but there will be no code completion etc.
        if (this._castleConfig.pascalServerPath !== '') {
            await this._castleLanguageServer.destroyLanguageClient();
            await this._castleLanguageServer.createLanguageClient();
        } else {
            // when configuration changes we should rerun language client
            if (this._castleLanguageServer !== undefined) {
                await this._castleLanguageServer.destroyLanguageClient();
            }
        }
    }

    /**
     * When called first time creates CastleFileWatcher which observes file changes.
     * Subsequent launches currently do nothing.
     */
    updateFileWatcher() {
        if (this._castleFileWatcher === undefined) {
            this._castleFileWatcher = new CastleFileWatcher(this._context, this._castleConfig, this);
        }
    }

    /**
     * When called first time creates and registers CastleTaskProvider. And registers/unregisters VSCode commands.
     * Subsequent runs update the tasks and registers/unregisters VSCode commands
     * depending on whether we have access to build tool.
     */
    updateTaskProvider() {
        if (this._castleConfig.buildToolPath !== '') {
            if (this._castleTaskProvider === undefined) {
                this._castleTaskProvider = new CastleTaskProvider(this._castleConfig);
                let disposable = vscode.tasks.registerTaskProvider('cge-tasks', this._castleTaskProvider);
                this._context.subscriptions.push(disposable);
            }
            else {
                this._castleTaskProvider.updateCastleTasks();
            }

            if (this._taskCommandsRegistered === false) {
                this._disposableCompile = vscode.commands.registerCommand(this._castleConfig.commandId.compile, () => {
                    vscode.tasks.executeTask(this._castleTaskProvider.compileTask);
                });
                this._context.subscriptions.push(this._disposableCompile);

                this._disposableRun = vscode.commands.registerCommand(this._castleConfig.commandId.run, () => {
                    this._castleTaskProvider.updateCastleTasks();
                    vscode.tasks.executeTask(this._castleTaskProvider.runTask);
                });
                this._context.subscriptions.push(this._disposableRun);

                this._disposableClean = vscode.commands.registerCommand(this._castleConfig.commandId.clean, () => {
                    vscode.tasks.executeTask(this._castleTaskProvider.cleanTask);
                });
                this._context.subscriptions.push(this._disposableClean);

                this._taskCommandsRegistered = true;
            }
        }
        else {
            if (this._taskCommandsRegistered === true) {
                // when there is no build tool available
                this._disposableCompile.dispose();
                this._disposableCompile = undefined;

                this._disposableRun.dispose();
                this._disposableRun = undefined;

                this._disposableClean.dispose();
                this._disposableClean = undefined;

                this._taskCommandsRegistered = false;
            }
        }
    }

    /**
     * Registers or unregisters VSCode open in CGE editor command
     * depending on whether we have access to build tool.
     */
    updateEditorCommand() {
        if (this._castleConfig.buildToolPath === '') {
            if (this._editorCommandsRegistered) {
                this._disposableOpenInEditor.dispose();
                this._disposableOpenInEditor = undefined;
                this._editorCommandsRegistered = false;
            }
        } else {
            if (this._editorCommandsRegistered === false) {
                this._disposableOpenInEditor = vscode.commands.registerCommand(this._castleConfig.commandId.openInCastleEditor, () => {
                    castleExec.executeFile(this._castleConfig.buildToolPath, ['editor']);
                });
                this._context.subscriptions.push(this._disposableOpenInEditor);
                this._editorCommandsRegistered = true;
            }
        }
    }

    updateSearchInApiReferenceCommands()  {
        if (this._searchInApiReferenceCommandsRegistered === false) {
            /*this._disposableSearchInApiReference = */
            vscode.commands.registerCommand(this._castleConfig.commandId.searchInApiReference, () => {
                let wordToSearch = '';
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const document = editor.document;
                    const selection = editor.selection;
                    const cursorWordRange = document.getWordRangeAtPosition(selection.active);
                    if (cursorWordRange) {
                        wordToSearch = document.getText(cursorWordRange);
                    } else {
                        return; //no word under cursor
                    }
                } else {
                    return; // no active editor
                }

                if (this._referencePanel === undefined) {
                    this._referencePanel = vscode.window.createWebviewPanel('cge_api_reference',
                    'Castle Game Engine Api Reference',
                    vscode.ViewColumn.Beside,
                    { enableScripts: true });

                    this._referencePanel.onDidDispose(
                        () => {
                            this._referencePanel = undefined;
                        }
                    );
                }
                this._referencePanel.webview.html = `
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Castle Game Engine Api Reference</title>
                    <style>
                    body, html {
                        height: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    #ApiReferenceFrame {
                        height: 100%;
                        width: 100%;
                        border: none;
                    }
                    </style>
                </head>
                <body>
                    <script>
                        function goBack() {
                            window.history.back();
                        }

                        window.addEventListener('message', event => {

                            const message = event.data;

                            switch (message.command) {
                                case 'castle-go-back':
                                    goBack();
                                    break;
                            }
                        });
                    </script>
                    <div id="ApiReferenceToolbar">
                        <button onclick="goBack()">Back</button>
                    </div>
                    <iframe id="ApiReferenceFrame" src="https://castle-engine.io/apidoc/html/tipue_results.html?q=${wordToSearch}"></iframe>
                </body>
                </html>
                `;

            });

            /*this._disposableBackInApiReference = */
            vscode.commands.registerCommand(this._castleConfig.commandId.backInApiReference, () => {
                if (this._referencePanel !== undefined) {
                    this._referencePanel.webview.postMessage({command: 'castle-go-back'});
                }
            });
            this._searchInApiReferenceCommandsRegistered = true;
        }
    }

    /**
     * Registers or unregisters VSCode validate and open settings command
     * used by status bar button showed when configuration is not correct.
     */
    updateValidateAndOpenSettingsCommand() {
        if (this._validateCommandsRegistered === false) {
            let disposable = vscode.commands.registerCommand(this._castleConfig.commandId.validateAndOpenSettings, () => {

                let wasWarning = false;
                if (this._castleConfig.enginePath === '') {
                    wasWarning = true;
                    vscode.window.showInformationMessage('The path to engine in not valid, check enginePath value.');
                }


                if (this._castleConfig.buildToolPath === '') {
                    if (!wasWarning) {
                        vscode.window.showInformationMessage(
                            'The path to engine is set but there is no build tool (castle-engine' +
                            this.executableFileExtension() + ') in bin subdirectory.');
                        wasWarning = true;
                    }
                }

                if (this._castleConfig.pascalServerPath === '') {
                    if (!wasWarning) {
                        vscode.window.showInformationMessage(
                            'The engine path is set but the pascal language server executable cannot be found in bin subfolder (no pasls'
                            + this.executableFileExtension() +').');
                            wasWarning = true;
                        }
                }

                if ((this._castleConfig.pascalServerPath !== '') && (this._castleLanguageServer.pascalServerClient === undefined)) {
                    if (!wasWarning) {
                        vscode.window.showInformationMessage(
                            'Path to engine and pascal language server look correct, but some pasls' +
                            this.executableFileExtension() +  ' settings are incorrect.');
                            wasWarning = true;
                    }
                }

                vscode.commands.executeCommand('workbench.action.openSettings', 'castle-engine');
            });
            this._context.subscriptions.push(disposable);
            this._validateCommandsRegistered = true;
        }
    }

    /**
     * When called first time creates and registers CastleDebugProvider.
     * Subsequent runs only creates and registers CastleDebugProvider when previous configuration was incorrect.
     */
    updateDebugProvider() {
        if (this._castleConfig.buildToolPath !== '') {
            if (this._castleDebugProvider === undefined) {
                this._castleDebugProvider = new CastleDebugProvider(this._castleConfig);

                this._disposableDebugConfProvider = vscode.debug.registerDebugConfigurationProvider('castleDebug', this._castleDebugProvider);
                this._context.subscriptions.push(this._disposableDebugConfProvider);
            }
        } else {
            console.log('updateDebugProvider - buildToolPath is empty, not doing anything');
        }
    }

    /**
     * When called first time creates CastleStatusBar object which is responsible for the buttons showed
     * in the status bar of visual studio code.
     * Subsequent runs only updates buttons visibility based on the current configuration state.
     */
    updateStatusBar() {
        if (this._castleStatusBar === undefined) {
            this._castleStatusBar = new CastleStatusBar(this._context, this._castleConfig, this._castleLanguageServer, this._castleTaskProvider);
        }
        this._castleStatusBar.updateButtonsVisibility();
    }

    /**
     * Util for windows to show .exe in some places.
     * @returns {string} executable extension in current platform
     */
    executableFileExtension() {
        if (process.platform === 'win32') {
            return '.exe';
        }
        return '';
    }
}
