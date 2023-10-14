// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const fs = require('fs');
const path = require('path');
const vscodelangclient = require('vscode-languageclient');

// https://stackoverflow.com/questions/30763496/how-to-promisify-nodes-child-process-exec-and-child-process-execfile-functions
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let client;

/**
 * @param {string} envVarName
 * @param {string} defaultValue
 */
function getEnvSetting(envVarName, defaultValue) {
	// First check configuration
	let varValue = vscode.workspace.getConfiguration('castleGameEngine.pascalLanguageServer').get(envVarName);

	if (varValue.trim() === '')	{
		// Then check enviremont variable
		if (process.env.envVarName) {
			varValue = process.env.envVarName;
		}
	}

	// At least try default value
 	if (varValue.trim() === '')
	{
		varValue = defaultValue;
	}

	return varValue;
}

/**
 * @param {string} command command to run
 * @returns {string} stdout or empty string on error
 */
async function executeCommandAndReturnValue(command) {
	let result = '';
	try {
		const { stdout, stderr } = await exec(command);
		console.log('stderr:', stderr);

    	result = stdout.trim();
		console.log('PPdef1 ', result);
		return result;

	} catch (e) {
		vscode.window.showErrorMessage(`Error: ${e.message}`);
		return result;
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Castle Engine Extension - Activate - START');

	let enginePath = vscode.workspace.getConfiguration('castleGameEngine').get('enginePath');
	console.log(`Engine path from configuration: ${enginePath}`);

	if (enginePath.trim() === '') {
		// try to get form environment variable 
		if (process.env.CASTLE_ENGINE_PATH) {
			enginePath = process.env.CASTLE_ENGINE_PATH
			console.log(`Engine path from environment: ${enginePath}`);
		} else {
			vscode.window.showErrorMessage('Castle Game Engine not set, correct the configuration or set CASTLE_ENGINE_PATH environment variable.');
			return;
		}
	}

	// Check castle engine folder exists
	try {
		fs.accessSync(enginePath, fs.constants.F_OK)
	}
	catch (err)
	{
		vscode.window.showErrorMessage(`Castle Game Engine not found, correct the configuration or set CASTLE_ENGINE_PATH environment variable. ${err}`);
		return;
	}

	// find pascal server
	let pascalServerExec = enginePath + path.sep + 'bin' + path.sep + 'pasls';


	try {
		fs.accessSync(pascalServerExec, fs.constants.X_OK)
		console.log('Found Pascal Language Server: ' + pascalServerExec);
	}
	catch (err)
	{
		vscode.window.showErrorMessage(`Pascal Language Server not availble. ${err}`);
		return;
	}

	let enviromentForPascalServer = {};

	let buildTool = enginePath + path.sep + 'bin' + path.sep + 'castle-engine';

	let defaultCompilerExePath = await executeCommandAndReturnValue(buildTool + ' output-environment fpc-exe');
	vscode.window.showInformationMessage(`Default path to fpc compiler: ${defaultCompilerExePath}`);

	enviromentForPascalServer['PP'] = getEnvSetting('PP', defaultCompilerExePath);
	// Check compiler really exists and can be executed
	try {
		fs.accessSync(enviromentForPascalServer['PP'], fs.constants.X_OK)
	}
	catch (err)
	{
		vscode.window.showErrorMessage(`FPC compiler executable can't be executed. ${err}`);
		return;
	}

	let realCompilerPath = await executeCommandAndReturnValue(enviromentForPascalServer['PP'] + ' -PB');
	console.log('realCompilerPath', realCompilerPath);

	enviromentForPascalServer['FPCDIR'] = getEnvSetting('FPCDIR', '/home/and3md/fpc/fixes32/fpcsrc/');
	enviromentForPascalServer['LAZARUSDIR'] = getEnvSetting('LAZARUSDIR', '/home/and3md/fpc/fixes32/lazarus');
	let fpcDefaultTarget = process.platform;
	// win32 can be 32 or 64 bit windows
	if (fpcDefaultTarget === 'win32') 
		fpcDefaultTarget = 'windows'
	console.log('fpcDefaultTarget', fpcDefaultTarget);
	enviromentForPascalServer['FPCTARGET'] = getEnvSetting('FPCTARGET', fpcDefaultTarget);
	// try to detect default architecture
	let fpcDefaultArch = process.arch;
	if (fpcDefaultArch === 'x64')
		fpcDefaultArch = 'x86_64';
	else if (fpcDefaultArch === 'arm64')
		fpcDefaultArch = 'aarch64';
	else if (fpcDefaultArch === 'x32')
		fpcDefaultArch = 'i386';
	else
		fpcDefaultArch = '';
	console.log('fpcDefaultArch', fpcDefaultArch);
	enviromentForPascalServer['FPCTARGETCPU'] = getEnvSetting('FPCTARGETCPU', 'fpcDefaultArch');

	console.log(enviromentForPascalServer);

	let run = {
		command: pascalServerExec,
		options: {
			env: enviromentForPascalServer
		}
	};

	let debug = run;
	let serverOptions = {
		run: run,
		debug: debug
	};

	let clientOptions = {
		documentSelector: [
			{ scheme: 'file', language: 'pascal' },
			{ scheme: 'untitled', language: 'pascal' }
		]
	}

	client = new vscodelangclient.LanguageClient('pascal-language-server', 'Pascal Language Server', serverOptions, clientOptions);
	client.start();
	console.log(client);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('castle-game-engine.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Castle Game Engine!');
	});

	context.subscriptions.push(disposable);

	console.log('Castle Engine Extension - Activate - DONE');
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
