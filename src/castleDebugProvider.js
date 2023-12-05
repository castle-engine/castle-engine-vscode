const vscode = require("vscode");
const castleExec = require('./castleExec.js');
const castleConfiguration = require('./castleConfiguration.js');

/**
 * Castle Debug Provider that uses fpDebug to start debug session without 
 * configuration. Just choose "cgedebug" after hiting F5.
 */
class CastleDebugProvider {

	/**
	 * @param {castleConfiguration.CastleConfiguration} castleConfig 
	 */
    constructor (castleConfig) {
		this._castleConfig = castleConfig;
    }

	// not used
	/*provideDebugConfigurations(folder, token) {
		console.log('provideDebugConfigurations - START');
	}*/

	async resolveDebugConfiguration(folder, config/*, token*/) {
		console.log('resolveDebugConfiguration - START');

		if ((config.type == undefined) && (config.request == undefined) && (config.name == undefined)) {

			// this._castleConfig.buildToolPath can be changed when 
			// debug configuration provider is created and 
			// new configuration can be not valid when buildToolPath === ''
			if (this._castleConfig.buildToolPath === '')
				return undefined; // abort launch

			const editor = vscode.window.activeTextEditor;
			if (editor !== undefined && editor.document.languageId === 'pascal') {
				//console.log('Editor with pascal sources');
				config.type = 'fpDebug'; // cgedebug is used only as alias for fpDebug
				config.name = 'Debug CGE Game with fpDebug';
				config.request = 'launch';
				let executableName = await castleExec.executeCommandAndReturnValue(this._castleConfig.buildToolPath + ' output executable-name');
				config.program = '${workspaceFolder}/' + executableName;
				config.stopOnEntry = true;
				config.workingdirectory = '${workspaceFolder}'

				if (this._castleConfig.buildMode === castleConfiguration.CastleBuildModes.RELEASE)
					vscode.window.showWarningMessage('Running debuger with release build, consider to change build type.');
				// we run compilation only when is needed
				if (this._castleConfig.recompilationNeeded)
					config.preLaunchTask = 'CGE: compile-cge-game-task';
			}

			if (!config.program) {
				return vscode.window.showInformationMessage("Cannot find a program to debug").then(() => {
					return undefined;	// abort launch
				});
			}

			return config;
		}
	}
}

module.exports = CastleDebugProvider;