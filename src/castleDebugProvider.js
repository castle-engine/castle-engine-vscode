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
	constructor(castleConfig) {
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
			if (editor != undefined && editor.document.languageId === 'pascal') {
				//console.log('Editor with pascal sources');
				config.type = 'fpDebug'; // cgedebug is used only as alias for fpDebug
				config.name = 'Debug CGE Game with fpDebug';
				config.request = 'launch';
				let executableName = await castleExec.executeFileAndReturnValue(this._castleConfig.buildToolPath, ['output', 'executable-name']);
				if (process.platform === 'win32')
					executableName += '.exe';
				config.program = '${workspaceFolder}/' + executableName;
				config.stopOnEntry = true;
				config.workingdirectory = '${workspaceFolder}';
				// config.log = true;

				// workaround fpDebug 0.6 bug with fpdserver executable not set properly
				if (process.platform === 'win32') {
					let fpDebugExtPath = vscode.extensions.getExtension("cnoc.fpdebug").extensionPath;
					if (this._castleConfig.fpcTargetCpu === 'x86_64')
						config.fpdserver = { executable: fpDebugExtPath + '\\bin\\fpdserver-x86_64.exe' };
					else if (this._castleConfig.fpcTargetCpu === 'i386')
						config.fpdserver = { executable: fpDebugExtPath + '\\bin\\fpdserver-i386.exe' };
					else {
						return vscode.window.showInformationMessage('fpDebug supports only x86_64 and i386 architecture on windows').then(() => {
							return undefined; // abort launch
						});
					}
				} else if (process.platform === 'linux' && this._castleConfig.fpcTargetCpu !== 'x86_64')
					return vscode.window.showInformationMessage('fpDebug supports only x86_64 architecture on linux').then(() => {
						return undefined; // abort launch
					});


				if (this._castleConfig.buildMode === castleConfiguration.CastleBuildModes.RELEASE)
					vscode.window.showWarningMessage('Running debuger with release build, consider to change build type.');
				// we run compilation only when is needed
				if (this._castleConfig.recompilationNeeded)
					config.preLaunchTask = 'CGE: compile-cge-game-task';
			}

			if (!config.program) {
				return vscode.window.showInformationMessage('Cannot find a program to debug').then(() => {
					return undefined;	// abort launch
				});
			}

			return config;
		}
	}
}

module.exports = CastleDebugProvider;