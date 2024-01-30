
const vscode = require('vscode');

const CastleFileWatcher = require('./castleFileWatcher.js');
const castleExec = require('./castleExec.js');
const CastleDebugProvider = require('./castleDebugProvider.js');
const CastleTaskProvder = require('./castleTaskProvider.js');
const castleConfiguration = require('./castleConfiguration.js');
const CastleStatusBar = require('./castleStatusBar.js');
const CastlePascalLanguageServer = require('./castlePascalLanguageServer.js');

/**
 * Main class of plugin that encapsulates everything and manages the plugin's state.
 * 
 * The most important functions are activatePlugin(), updatePlugin() and deactivatePlugin().
 */
class CastlePlugin {
    constructor(context) {
        this._context = context;
        this._taskCommandsRegistered = false;
        this._editorCommandsRegistered = false;
        this._validateCommandsRegistered = false;
    }

    /**
     * Activates plugin when activate(context) is called.
     */
    async activatePlugin() {
        this.updateConfiguration();
        await this.updateLanguageServer();
        this.updateFileWatcher();
        this.updateTaskProvider();
        this.updateEditorCommand();
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
     * Deacitvates plugin when deactivate() is called.
     */
    async deactivatePlugin() {
        await this._castleLanguageServer.destroyLanguageClient();
    }

    /**
     * When called first time creates CastleConfiguration object and reads/finds configuration. 
     * In other cases only reloads configuration.
     */
    updateConfiguration() {
        if (this._castleConfig == undefined)
            this._castleConfig = new castleConfiguration.CastleConfiguration(castleConfiguration.CastleBuildModes.DEBUG);

        this._castleConfig.findPaths();
        this._castleConfig.findFpcTargetCpu();
    }

    /**
     * When called first time creates CastlePascalLanguageServer object, reads/finds language server configuration and 
     * starts pascal language server. 
     * 
     * In other cases reloads configuration and reruns pascal language server.
     */
    async updateLanguageServer() {
        if (this._castleLanguageServer == undefined)
            this._castleLanguageServer = new CastlePascalLanguageServer(this._castleConfig);

        // When there is no pascal language server we still can run the extension 
        // but there will be no code completion etc.
        if (this._castleConfig.pascalServerPath !== '') {
            await this._castleLanguageServer.destroyLanguageClient();
            await this._castleLanguageServer.createLanguageClient();
        } else {
            // when configuration changes we should rerun language client
            if (this._castleLanguageServer != undefined) {
                await this._castleLanguageServer.destroyLanguageClient();
            }
        }
    }

    /**
     * When called first time creates CastleFileWatcher which observes file changes.
     * Subsequent launches currently do nothing.
     */
    updateFileWatcher() {
        if (this._castleFileWatcher == undefined)
            this._castleFileWatcher = new CastleFileWatcher(this._context, this._castleConfig, this);
    }

    /**
     * When called first time creates and registers CastleTaskProvder. And registers/unregisters VSCode commands.
     * Subsequent runs update the tasks and registers/unregisters VSCode commands 
     * depending on whether we have access to build tool.
     */
    updateTaskProvider() {
        if (this._castleConfig.buildToolPath !== '') {
            if (this._castleTaskProvider == undefined) {
                this._castleTaskProvider = new CastleTaskProvder(this._castleConfig);
                let disposable = vscode.tasks.registerTaskProvider('cge-tasks', this._castleTaskProvider);
                this._context.subscriptions.push(disposable);
            }
            else {
                this._castleTaskProvider.updateCastleTasks();
            }

            if (this._taskCommandsRegistered === false) {
                this._disposableCompileGame = vscode.commands.registerCommand(this._castleConfig.commandId.compileGame, () => {
                    vscode.tasks.executeTask(this._castleTaskProvider.compileGameTask);
                });
                this._context.subscriptions.push(this._disposableCompileGame);

                this._disposableRunGame = vscode.commands.registerCommand(this._castleConfig.commandId.runGame, () => {
                    this._castleTaskProvider.updateCastleTasks();
                    vscode.tasks.executeTask(this._castleTaskProvider.runGameTask);
                });
                this._context.subscriptions.push(this._disposableRunGame);

                this._disposableCleanGame = vscode.commands.registerCommand(this._castleConfig.commandId.cleanGame, () => {
                    vscode.tasks.executeTask(this._castleTaskProvider.cleanGameTask);
                });
                this._context.subscriptions.push(this._disposableCleanGame);

                this._taskCommandsRegistered = true;
            }
        }
        else {
            if (this._taskCommandsRegistered === true) {
                // when there is no build tool availble
                this._disposableCompileGame.dispose();
                this._disposableCompileGame = null;

                this._disposableRunGame.dispose();
                this._disposableCompileGame = null;

                this._disposableCleanGame.dispose();
                this._disposableCleanGame = null;

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
                this._disposableOpenInEditor = null;
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

    /**
     * Registers or unregisters VSCode validate and open settings command
     * used by status bar button showed when configuration is not corect.
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
                            'The path to engine is set but there is no buildtool (castle-engine' +
                            this.executableFileExtension() + ') in bin subfolder.');
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
                
                if ((this._castleConfig.pascalServerPath !== '') && (this._castleLanguageServer.pascalServerClient == undefined)) {
                    if (!wasWarning) {
                        vscode.window.showInformationMessage(
                            'Path to engine and pascal language server look correct, but some pasls' + 
                            this.executableFileExtension() +  ' settings are incorrect.');
                            wasWarning = true;
                    }
                }

                vscode.commands.executeCommand('workbench.action.openSettings', 'castle-game-engine');
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
            if (this._castleDebugProvider == undefined) {
                this._castleDebugProvider = new CastleDebugProvider(this._castleConfig);

                this._disposableDebugConfProvider = vscode.debug.registerDebugConfigurationProvider('cgedebug', this._castleDebugProvider);
                this._context.subscriptions.push(this._disposableDebugConfProvider);
            }
        }
    }

    /**
     * When called first time creates CastleStatusBar object which is responsible for the buttons showed
     * in the status bar of visual studio code.
     * Subsequent runs only updates buttons visibility based on the current configuration state.
     */
    updateStatusBar() {
        if (this._castleStatusBar == undefined) {
            this._castleStatusBar = new CastleStatusBar(this._context, this._castleConfig, this._castleLanguageServer);
        }
        this._castleStatusBar.updateButtonsVisibility();
    }

    /**
     * Util for windows to show .exe in some places.
     * @returns {string} executable extension in current platform
     */
    executableFileExtension() {
        if (process.platform === 'win32') {
            return '.exe'
        }
        return '';
    }
}

module.exports = CastlePlugin;