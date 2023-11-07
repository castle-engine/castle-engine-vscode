const vscode = require("vscode");
const castleConfiguration = require('./castleConfiguration.js');

class CastleStatusBar {
    constructor(context, castleConfig) {
        this._castleConfig = castleConfig;
        this._context = context;
        this.createBuildModeSwitch()
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
}

module.exports = CastleStatusBar;