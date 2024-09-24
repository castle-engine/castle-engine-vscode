// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const CastlePlugin = require('./castlePlugin.js');

let castlePlugin;

/**
 * This method is called when your extension is activated. Extension is activated
 * the very first time the command is executed
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Castle Engine Extension - Activate - START');

	castlePlugin = new CastlePlugin(context);

	// register callback when configuration changes
	vscode.workspace.onDidChangeConfiguration(async (event) => {
		if (event.affectsConfiguration('castleEngine.enginePath')) {
			await castlePlugin.updatePlugin();
		} else
		if (event.affectsConfiguration('castleEngine.pascalLanguageServer.PP') ||
			event.affectsConfiguration('castleEngine.pascalLanguageServer.FPCDIR') ||
			event.affectsConfiguration('castleEngine.pascalLanguageServer.LAZARUSDIR') ||
			event.affectsConfiguration('castleEngine.pascalLanguageServer.FPCTARGET') ||
			event.affectsConfiguration('castleEngine.pascalLanguageServer.FPCTARGETCPU') ||
			event.affectsConfiguration('castleEngine.engineDeveloperMode')
		) {
			await castlePlugin.updateConfiguration();
			await castlePlugin.updateLanguageServer();
			castlePlugin.updateStatusBar();
		}
	});

	/*vscode.workspace.onDidGrantWorkspaceTrust( () => {
		console.log("is trusted: ", vscode.workspace.isTrusted);
	} );*/

	await castlePlugin.activatePlugin();
	console.log('Castle Engine Extension - Activate - DONE');
}

/**
 * Called when your extension is deactivated
 */
async function deactivate() {
	console.log('Castle Engine Extension - Deactivation - START');
	await castlePlugin.deactivatePlugin();
	console.log('Castle Engine Extension - Deactivation - DONE');
 }

module.exports = {
	activate,
	deactivate
}
