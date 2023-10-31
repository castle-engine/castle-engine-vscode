const vscode = require("vscode");
const castleExec = require('./castleExec.js');

class CastleDebugProvider {

    constructor (castleFileWatcher, buildTool) {
        this._castleFileWatcher = castleFileWatcher;
        this._buildTool = buildTool;
    }

	provideDebugConfigurations(folder, token) {
		console.log('provideDebugConfigurations - START');

	}

	async resolveDebugConfiguration(folder, config, token) {
		console.log('resolveDebugConfiguration - START');
		if ((config.type == undefined) && (config.request == undefined) && (config.name == undefined)) {
			const editor = vscode.window.activeTextEditor;
			if (editor !== undefined && editor.document.languageId === 'pascal') {
				console.log('Editor with pascal sources');
				config.type = 'fpDebug'; // cgedebug is used only as alias for fpDebug
				config.name = 'Debug game with fpDebug';
				config.request = 'launch';
				let executableName = await castleExec.executeCommandAndReturnValue(this._buildTool + ' output executable-name');
				config.program = '${workspaceFolder}/' + executableName;
				config.stopOnEntry = true;
				config.workingdirectory = '${workspaceFolder}'
				// we run compilation only when is needed
				if (this._castleFileWatcher.recompilationNeeded)
					config.preLaunchTask = 'CGE: compile-cge-game-task';
			}

			if (!config.program) {
				return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
					return undefined;	// abort launch
				});
			}

			return config;

		}
	}
}

module.exports = CastleDebugProvider;