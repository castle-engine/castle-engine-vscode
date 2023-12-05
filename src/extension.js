// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const CastlePlugin = require('./castlePlugin.js');

const CastleFileWatcher = require('./castleFileWatcher.js');
const castleExec = require('./castleExec.js');
const CastleDebugProvider = require('./castleDebugProvider.js');
const CastleTaskProvder = require('./castleTaskProvider.js');
const castleConfiguration = require('./castleConfiguration.js');
const CastleStatusBar = require('./castleStatusBar.js');
const CastlePascalLanguageServer = require('./castlePascalLanguageServer.js');

let castlePlugin;

async function activatePlugin(context) {

}

async function activateLanguageServer(context) {

}

/**
 * This method is called when your extension is activated. Extension is activated 
 * the very first time the command is executed
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Castle Engine Extension - Activate - START');

	castlePlugin = new CastlePlugin(context);

	// register callback when configuration changes
	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration('castleGameEngine.enginePath')) {
			castlePlugin.updatePlugin();
		}
	});
	
	castlePlugin.activatePlugin();
	console.log('Castle Engine Extension - Activate - DONE');
}

/**
 * Called when your extension is deactivated
 */
function deactivate() {
	console.log('deactivation');
 }

module.exports = {
	activate,
	deactivate
}
