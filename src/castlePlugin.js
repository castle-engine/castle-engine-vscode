
const vscode = require('vscode');

const CastleFileWatcher = require('./castleFileWatcher.js');
const castleExec = require('./castleExec.js');
const CastleDebugProvider = require('./castleDebugProvider.js');
const CastleTaskProvder = require('./castleTaskProvider.js');
const castleConfiguration = require('./castleConfiguration.js');
const CastleStatusBar = require('./castleStatusBar.js');
const CastlePascalLanguageServer = require('./castlePascalLanguageServer.js');


/**
 * Main class of plugin that encapsulates everything
 */
class CastlePlugin {
    constructor(context) {
        this._context = context;
        this._taskCommandsRegistered = false;
        this._editorCommandsRegistered = false;
        this._validateCommandsRegistered = false;
    }


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

    updatePlugin() {
        this.activatePlugin();
    }

    updateConfiguration() {
        if (this._castleConfig === undefined)
            this._castleConfig = new castleConfiguration.CastleConfiguration(castleConfiguration.CastleBuildModes.DEBUG);

        if (this._castleConfig.findPaths() === false) {
            if (this._castleConfig.enginePath === '')
                throw new Error('Castle Game Engine Extension can\'t run without proper engine path');
            if (this._castleConfig.buildToolPath === '')
                throw new Error('Castle Game Engine Extension can\'t run without build tool in bin subdirectory');
        }
    }

    async updateLanguageServer() {
        // When there is no pascal language server we still can run the extension 
        // but there will be no code completion etc.
        if (this._castleConfig.pascalServerPath !== '') {
            if (this._castleLanguageServer == undefined)
                this._castleLanguageServer = new CastlePascalLanguageServer(this._castleConfig);
            else
                this._castleLanguageServer.destroyLanguageClient();
            await this._castleLanguageServer.createLanguageClient();
        } else {
            // when configuration changes we should rerun language client
            if (this._castleLanguageServer != undefined) {
                this._castleLanguageServer.destroyLanguageClient();
            }
        }
    }

    updateFileWatcher() {
        if (this._castleFileWatcher === undefined)
            this._castleFileWatcher = new CastleFileWatcher(this._context, this._castleConfig);
    }

    updateTaskProvider() {
        if (this._castleConfig.buildToolPath !== '') {
            if (this._castleTaskProvider === undefined) {
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
                    castleExec.executeCommand(this._castleConfig.buildToolPath + ' editor');
                });
                this._context.subscriptions.push(this._disposableOpenInEditor);
                this._editorCommandsRegistered = true;
            }
        }
    }

    updateValidateAndOpenSettingsCommand() {
        if (this._validateCommandsRegistered === false) {
            let disposable = vscode.commands.registerCommand(this._castleConfig.commandId.validateAndOpenSettings, () => {
                // TODO: validate settings and show information
                if (this._castleConfig.enginePath === '') 
                    vscode.window.showInformationMessage('The path to engine in not valid, check enginePath value.');

                if (this._castleConfig.buildToolPath === '') 
                    vscode.window.showInformationMessage('The path to engine is set but in bin subfolder there is no buildtool (castle-engine).');

                if (this._castleConfig.pascalServerPath === '')
                    vscode.window.showInformationMessage('The engine path is set but the pascal language server executable cannot be found in bin subfolder there is no pasls executble.');
                
                if ((this._castleConfig.pascalServerPath !== '') || this._castleLanguageServer.pascalServerClient == undefined)
                    vscode.window.showInformationMessage('Path to engine and pascal language server look correct, but some pasls settings are incorrect.');

                vscode.commands.executeCommand('workbench.action.openSettings', 'castle-game-engine');
            });
            this._context.subscriptions.push(disposable);
            this._validateCommandsRegistered = true;
        }
    }

    updateDebugProvider() {
        if (this._castleConfig.buildToolPath !== '') {
            if (this._castleDebugProvider == undefined) {
                this._castleDebugProvider = new CastleDebugProvider(this._castleConfig);

                this._disposableDebugConfProvider = vscode.debug.registerDebugConfigurationProvider('cgedebug', this._castleDebugProvider);
                this._context.subscriptions.push(this._disposableDebugConfProvider);
            }
        }
    }

    updateStatusBar() {
        if (this._castleStatusBar == undefined) {
            this._castleStatusBar = new CastleStatusBar(this._context, this._castleConfig, this._castleLanguageServer);
        }
        this._castleStatusBar.updateButtonsVisibility();
    }
}

module.exports = CastlePlugin;