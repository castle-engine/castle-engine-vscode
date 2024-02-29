const vscode = require("vscode");
const castleConfiguration = require('./castleConfiguration.js');
// eslint-disable-next-line no-unused-vars
const CastlePascalLanguageServer = require('./castlePascalLanguageServer.js');
// eslint-disable-next-line no-unused-vars
const CastleTaskProvider = require('./castleTaskProvider.js');
const castlePath = require('./castlePath.js');

class CastleStatusBar {

    /**
     * Constructor
     * @param {vscode.ExtensionContext} context
     * @param {castleConfiguration.CastleConfiguration} castleConfig
     * @param {castleLanguageServer.castleLanguageServer} castleLanguageServer
     * @param {CastleTaskProvider.castleTaskProvider} castleTaskProvider
     */
    constructor(context, castleConfig, castleLanguageServer, castleTaskProvider) {
        this._castleConfig = castleConfig;
        this._context = context;
        this._castleLanguageServer = castleLanguageServer;
        this._castleTaskProvider = castleTaskProvider;
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
            const chosenBuildMode = await vscode.window.showQuickPick(['Debug', 'Release'], { placeHolder: 'Select build type' });
            if (!chosenBuildMode === undefined)
                return;
            if (chosenBuildMode === 'Release')
                this._castleConfig.buildMode = castleConfiguration.CastleBuildModes.RELEASE;
            else
                this._castleConfig.buildMode = castleConfiguration.CastleBuildModes.DEBUG;
            this.updateBuildModesButtonText();
            this._castleTaskProvider.updateCastleTasks();
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
        this._compileButton.command = this._castleConfig.commandId.compile;
        this._compileButton.tooltip = 'Compile Castle Game Engine Project';
        this._compileButton.text = '$(gear) Compile';
        this._compileButton.show();
    }

    createDebugButton() {
        this._debugButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._runButton);
        this._debugButton.command = this._castleConfig.commandId.debug;
        this._debugButton.tooltip = 'Start Debugging';
        this._debugButton.text = '$(debug-alt) Debug';
        this._debugButton.show();
    }

    createRunButton() {
        this._runButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._runButton);
        this._runButton.command = this._castleConfig.commandId.run;
        this._runButton.tooltip = 'Compile and Run Castle Game Engine Project';
        this._runButton.text = '$(run) Run';
        this._runButton.show();
    }

    createCleanButton() {
        this._cleanButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._cleanButton);
        this._cleanButton.command = this._castleConfig.commandId.clean;
        this._cleanButton.tooltip = 'Clean Castle Game Engine Project';
        this._cleanButton.text = 'Clean';
        this._cleanButton.show();
    }

    createOpenInEditorButton() {
        this._openInEditorButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._openInEditorButton);
        this._openInEditorButton.command = this._castleConfig.commandId.openInCastleEditor;
        this._openInEditorButton.tooltip = 'Open Project in Castle Game Engine Editor';
        this._openInEditorButton.text = '$(game) Open in Editor';
        this._openInEditorButton.show();
    }

    createConfigErrorButton() {
        this._openSettingsButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);
        this._context.subscriptions.push(this._openSettingsButton);
        this._openSettingsButton.command = this._castleConfig.commandId.validateAndOpenSettings;
        this._openSettingsButton.tooltip = 'Castle Game Engine: Invalid plugin configuration. Click to fix';
        this._openSettingsButton.text = 'Castle Game Engine: Invalid plugin configuration';
        this._openSettingsButton.color = new vscode.ThemeColor('statusBarItem.errorForeground');
        this._openSettingsButton.show();
    }

    updateButtonsVisibility() {
        let cgeFolder = castlePath.bestWorkspaceFolderStrict();
        if (cgeFolder === undefined) {
            /* Not a CGE project, so don't show any status buttons.
               We handle this case, since we may get activated in such case,
               e.g. if someone invokes CGE command from palette.
            */
            this._buildModesButton.hide();
            this._compileButton.hide();
            this._runButton.hide();
            this._debugButton.hide();
            this._cleanButton.hide();
            this._openInEditorButton.hide();
            this._openSettingsButton.hide();
            return;
        }

        if (this._castleConfig.buildToolPath === '') {
            this._buildModesButton.hide();
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
            this._buildModesButton.show();
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