// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('Congratulations, your extension "castle-game-engine" is now active!');

	let enginePath = vscode.workspace.getConfiguration('castleGameEngine').get('enginePath');
	console.log(`Engine path from configuration: ${enginePath}`);

	if (enginePath.trim() === '') {
		// try to get form environment variable 
		if (process.env.CASTLE_ENGINE_PATH) {
			enginePath = process.env.CASTLE_ENGINE_PATH
			console.log(`Engine path from environment: ${enginePath}`);
		}
	}

	

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('castle-game-engine.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Castle Game Engine!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
