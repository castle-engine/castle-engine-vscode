const vscode = require("vscode");
const castleConfiguration = require('./castleConfiguration.js');
const CastlePascalLanguageServer = require('./castlePascalLanguageServer.js');

class CastleStatusBar {
    constructor(context, castleConfig, castleLanguageServer) {
        this._castleConfig = castleConfig;
        this._context = context;
        this._castleLanguageServer = castleLanguageServer;
        this.createBuildModeSwitch();
        this.createCompileButton();
        this.createDebugButton();
        this.createRunButton();
        this.createCleanButton();
        this.createOpenInEditorButton();
        this.createConfigErrorButton();
        this.updateButtonsVisibility();
    }

    createBuildModeSwitch() {
        let command = vscode.commands.registerCommand(this._castleConfig.commandId.showBuildModes, async () => {
            const choosenBuildMode = await vscode.window.showQuickPick(['Debug', 'Release'], { placeHolder: 'Select build type' });
            if (!choosenBuildMode === undefined)
                return;
            if (choosenBuildMode === 'Release')
                this._castleConfig.buildMode = castleConfiguration.CastleBuildModes.RELEASE;
            else
                this._castleConfig.buildMode = castleConfiguration.CastleBuildModes.DEBUG;
            this.updateBuildModesButtonText();
        });
        this._context.subscriptions.push(command);
        this._buildModesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);
        this._context.subscriptions.push(this._buildModesButton);

        this._buildModesButton.command = this._castleConfig.commandId.showBuildModes;
        this.updateBuildModesButtonText();
        this._buildModesButton.show();
        this._buildModesButton.tooltip = 'Click to select build mode (debug or release)';
    }

    updateBuildModesButtonText() {
        this._buildModesButton.text = 'CGE: [' + this._castleConfig.buildMode.name + ']';
    }

    createCompileButton() {
        this._compileButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 19);
        this._context.subscriptions.push(this._compileButton);
        this._compileButton.command = this._castleConfig.commandId.compileGame;
        this._compileButton.tooltip = 'CGE: Click to compile game';
        this._compileButton.text = '$(gear) Compile';
        this._compileButton.show();
    }

    createDebugButton() {
        this._debugButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._runButton);
        this._debugButton.command = this._castleConfig.commandId.debugGame;
        this._debugButton.tooltip = 'CGE: Click to start debuging your game';
        this._debugButton.text = '$(debug-alt) Debug';
        this._debugButton.show();
    }

    createRunButton() {
        this._runButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._runButton);
        this._runButton.command = this._castleConfig.commandId.runGame;
        this._runButton.tooltip = 'CGE: Click to run game';
        this._runButton.text = '$(run) Run';
        this._runButton.show();
    }

    createCleanButton() {
        this._cleanButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._cleanButton);
        this._cleanButton.command = this._castleConfig.commandId.cleanGame;
        this._cleanButton.tooltip = 'CGE: Click to clean game files';
        this._cleanButton.text = 'Clean';
        this._cleanButton.show();
    }

    createOpenInEditorButton() {
        this._openInEditorButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._openInEditorButton);
        this._openInEditorButton.command = this._castleConfig.commandId.openInCastleEditor;
        this._openInEditorButton.tooltip = 'CGE: Open Project in Castle Editor';
        this._openInEditorButton.text = '$(game) Open in Editor';
        this._openInEditorButton.show();
    }

    createConfigErrorButton() {
        this._openSettingsButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._openSettingsButton);
        this._openSettingsButton.command = this._castleConfig.commandId.validateAndOpenSettings;
        this._openSettingsButton.tooltip = 'CGE: Invalid plugin configuration click to fix';
        this._openSettingsButton.text = 'CGE: Invalid plugin config';
        this._openSettingsButton.color = new vscode.ThemeColor('statusBarItem.errorForeground');
        this._openSettingsButton.show();
    }

    updateButtonsVisibility() {
        if (this._castleConfig.buildToolPath === '') {
            this._compileButton.hide();
            this._runButton.hide();
            this._debugButton.hide();
            this._cleanButton.hide();
            this._openInEditorButton.hide();
            // when engine path is not valid show config button
            if (this._castleConfig.enginePath === '')
                this._openSettingsButton.show();
        }
        else {
            this._compileButton.show();
            this._runButton.show();
            this._debugButton.show();
            this._cleanButton.show();
            this._openInEditorButton.show();

            // when pascalServerPath is valid but pascalServerClient is undefined or null
            // there is problem with pasls config
            if ((this._castleConfig.pascalServerPath !== '') && (this._castleLanguageServer.pascalServerClient == undefined))
                this._openSettingsButton.show();
            else
                this._openSettingsButton.hide();
        }
    }
}

module.exports = CastleStatusBar;