// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const CastleFileWatcher = require('./castleFileWatcher.js');
const castleExec = require('./castleExec.js');
const CastleDebugProvider = require('./castleDebugProvider.js');
const CastleTaskProvder = require('./castleTaskProvider.js');
const castleConfiguration = require('./castleConfiguration.js');
const CastleStatusBar = require('./castleStatusBar.js');
const CastlePascalLanguageServer = require('./castlePascalLanguageServer.js');

let castleTaskProvider;
// eslint-disable-next-line no-unused-vars
let castleFileWatcher;
let castleDebugProvider;
let castleConfig;
// eslint-disable-next-line no-unused-vars
let castleStatusBar;
let castleLanguageServer;

/**
 * This method is called when your extension is activated. Extension is activated 
 * the very first time the command is executed
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Castle Engine Extension - Activate - START');

	castleConfig = new castleConfiguration.CastleConfiguration(castleConfiguration.CastleBuildModes.DEBUG);

	if (castleConfig.findPaths() === false) {
		if (castleConfig.enginePath === '')
			throw new Error('Castle Game Engine Extension can\'t run without proper engine path.');
		if (castleConfig.buildToolPath === '')
			throw new Error('Castle Game Engine Extension can\'t run without build tool in bin subdirectory.');
	}

	// When there is no pascal language server we still can run the extension 
	// but there will be no code completion etc.
	if (castleConfig.pascalServerPath !== '') {
		castleLanguageServer = new CastlePascalLanguageServer(castleConfig);
		castleLanguageServer.createLanguageClient();
	}

	castleFileWatcher = new CastleFileWatcher(context, castleConfig);

	castleTaskProvider = new CastleTaskProvder(castleConfig);
	let disposable = vscode.tasks.registerTaskProvider('cge-tasks', castleTaskProvider);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(castleConfig.commandId.compileGame, () => {
		vscode.tasks.executeTask(castleTaskProvider.compileGameTask);
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(castleConfig.commandId.runGame, () => {
		castleTaskProvider.updateCastleTasks();
		vscode.tasks.executeTask(castleTaskProvider.runGameTask);
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(castleConfig.commandId.cleanGame, () => {
		vscode.tasks.executeTask(castleTaskProvider.cleanGameTask);
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(castleConfig.commandId.openInCastleEditor, () => {
		castleExec.executeCommand(castleConfig.buildToolPath + ' editor');
	});
	context.subscriptions.push(disposable);

	castleDebugProvider = new CastleDebugProvider(castleConfig);

	disposable = vscode.debug.registerDebugConfigurationProvider('cgedebug', castleDebugProvider);
	context.subscriptions.push(disposable);

	castleStatusBar = new CastleStatusBar(context, castleConfig);

	console.log('Castle Engine Extension - Activate - DONE');
}

/**
 * Called when your extension is deactivated
 */
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
