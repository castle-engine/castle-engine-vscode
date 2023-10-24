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
let castleTaskProvider;

/**
 * @param {string} envVarName
 * @param {string} defaultValue
 */
function getEnvSetting(envVarName, defaultValue) {
	// First check configuration
	let varValue = vscode.workspace.getConfiguration('castleGameEngine.pascalLanguageServer').get(envVarName);

	if (varValue.trim() === '') {
		// Then check enviremont variable
		if (process.env.envVarName) {
			varValue = process.env.envVarName;
		}
	}

	// At least try default value
	if (varValue.trim() === '') {
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


/**
 * Checks the folder is Free Pascal Compiller sources directory
 * @param {string} folder directory to check
 * @retval true looks like a sources folder
 * @retval false does not look like fpc sources folder 
 */
function isCompilerSourcesFolder(folder) {
	try {
		fs.accessSync(folder, fs.constants.F_OK)
		fs.accessSync(folder + '/compiler', fs.constants.F_OK)
		fs.accessSync(folder + '/packages', fs.constants.F_OK)
		return true;
	}
	catch (err) {
		return false;
	}
}

/**
 * 
 * @param {string} fpcCompilerExec path to fpc
 * @returns {string} path to fpc sources
 */
async function tryToFindFpcSources(fpcCompilerExec) {
	if (fpcCompilerExec === '')
		return '';

	if (process.platform === 'linux') {
		// check current fpc is not done by fpcupdeluxe
		let sourcesDir = fpcCompilerExec;
		let index = sourcesDir.indexOf('fpc/bin');
		if (index > 0) {
			sourcesDir = sourcesDir.substring(0, index) + 'fpcsrc';
			if (isCompilerSourcesFolder(sourcesDir)) {
				console.log('Found fpc sources:', sourcesDir);
				return sourcesDir;
			}
		}

		// when fpc-src is installed from fpc-src debian package
		// sources are in directory like /usr/share/fpcsrc/3.2.2/
		// https://packages.debian.org/bookworm/all/fpc-source-3.2.2/filelist
		let compilerVersion = await executeCommandAndReturnValue(fpcCompilerExec + ' -iV');
		console.log('Compiler Version', compilerVersion);
		sourcesDir = '/usr/share/fpcsrc/' + compilerVersion + '/';
		if (isCompilerSourcesFolder(sourcesDir)) {
			console.log('Found lazarus sources:', sourcesDir);
			return sourcesDir;
		}

		// sources not found
		return '';
	}
	// TODO: another OSes
}

/**
 * Checks given folder is lazarus sources folder
 * @param {string} folder directory to check
 * @retval true looks like a source folder
 * @retval false does not look like lazarus source folder 
 */
function isLazarusSourcesFolder(folder) {
	try {
		fs.accessSync(folder, fs.constants.F_OK)
		fs.accessSync(folder + '/lcl', fs.constants.F_OK)
		fs.accessSync(folder + '/ide', fs.constants.F_OK)
		fs.accessSync(folder + '/components', fs.constants.F_OK)
		return true;
	}
	catch (err) {
		return false;
	}
}

/**
 * This function gets directory like /usr/lib/lazarus/ and seraches for
 * version directory e.g. /usr/lib/lazarus/2.2.6/
 * @param {string} folder directory in which we want to check the subdirectories
 * @returns Lazarus source directory or empty string
 */
function findFullLazarusSourcesFolder(folder) {

	try {
		fs.accessSync(folder, fs.constants.R_OK)
	}
	catch (err) {
		return '';
	}

	try {
		const items = fs.readdirSync(folder);
		for (const item of items) {
			if (isLazarusSourcesFolder(folder + item)) {
				return folder + item;
			}
		}
	}
	catch (err) {
		return '';
	}
}

/**
 * 
 * @param {string} fpcCompilerExec path to fpc
 * @returns path to lazarus sources
 */
async function tryToFindLazarusSources(fpcCompilerExec) {
	if (fpcCompilerExec === '')
		return '';

	if (process.platform === 'linux') {
		// check current fpc is not done by fpcupdeluxe then lazarus is in lazarus subfolder
		let sourcesDir = fpcCompilerExec;
		let index = sourcesDir.indexOf('fpc/bin');
		if (index > 0) {

			sourcesDir = sourcesDir.substring(0, index) + 'lazarus';
			if (isLazarusSourcesFolder(sourcesDir)) {
				console.log('Found lazarus sources:', sourcesDir);
				return sourcesDir;
			}
		}

		// default lazarus sources folder path in debian
		// looks like /usr/lib/lazarus/2.2.6/
		// so we need iterate all items in that directory 
		// https://packages.debian.org/bookworm/all/lazarus-src-2.2/filelist
		sourcesDir = findFullLazarusSourcesFolder('/usr/lib/lazarus/');
		if (sourcesDir !== '')
			console.log('Found lazarus sources:', sourcesDir);
		return sourcesDir;
	}
	// TODO: another OSes

}

class CastleTaskProvder {

	constructor() {
		this.createTasks();
	}

	createTasks() {
		try {
			this._compileGameTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'compile-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution('castle-engine compile --mode=debug'), // what to do
				'$cge-problem-matcher'
			);

			this._runGameTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'run-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution('castle-engine run --mode=debug'), // what to do
				'$cge-problem-matcher'
			);

			this._cleanGameTask = new vscode.Task(
				{ type: 'cge-tasks' },
				vscode.workspace.workspaceFolders[0],
				'clean-cge-game-task', // task name
				'CGE', // prefix for all tasks
				new vscode.ShellExecution('castle-engine clean'), // what to do
				'$cge-problem-matcher'
			);
		}
		catch (err) {
			vscode.window.showErrorMessage(`createTasks - EXCEPTION: ${err}`);
			return;
		}

	}

	get compileGameTask() {
		return this._compileGameTask;
	}

	get runGameTask() {
		return this._runGameTask;
	}

	get cleanGameTask() {
		return this._cleanGameTask;
	}

	provideTasks() {
		console.log('provideTasks - START');
		try {
			console.log('provideTasks - STOP');

			return [this._compileGameTask, this._runGameTask, this._cleanGameTask];
		}
		catch (err) {
			vscode.window.showErrorMessage(`provideTasks - EXCEPTION: ${err}`);
			return;
		}
	}

	resolveTask(_task) {
		console.log("resolveTask - START");
		return _task;
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
	catch (err) {
		vscode.window.showErrorMessage(`Castle Game Engine not found, correct the configuration or set CASTLE_ENGINE_PATH environment variable. ${err}`);
		return;
	}

	// find pascal server
	let pascalServerExec = enginePath + path.sep + 'bin' + path.sep + 'pasls';


	try {
		fs.accessSync(pascalServerExec, fs.constants.X_OK)
		console.log('Found Pascal Language Server: ' + pascalServerExec);
	}
	catch (err) {
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
	catch (err) {
		vscode.window.showErrorMessage(`FPC compiler executable can't be executed. ${err}`);
		return;
	}

	let realCompilerPath = await executeCommandAndReturnValue(enviromentForPascalServer['PP'] + ' -PB');
	console.log('realCompilerPath', realCompilerPath);

	enviromentForPascalServer['FPCDIR'] = getEnvSetting('FPCDIR', '');

	if (enviromentForPascalServer['FPCDIR'] === '') {
		// try to find fpc sources
		enviromentForPascalServer['FPCDIR'] = await tryToFindFpcSources(realCompilerPath);
	}

	enviromentForPascalServer['LAZARUSDIR'] = getEnvSetting('LAZARUSDIR', '');

	if (enviromentForPascalServer['LAZARUSDIR'] === '') {
		enviromentForPascalServer['LAZARUSDIR'] = await tryToFindLazarusSources(realCompilerPath);
	}

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

	castleTaskProvider = new CastleTaskProvder();
	console.log(castleTaskProvider);
	let disposable = vscode.tasks.registerTaskProvider('cge-tasks', castleTaskProvider);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('castle-game-engine.compileGame', () => {
		console.log('compile Game - START');
		vscode.tasks.executeTask(castleTaskProvider.compileGameTask);
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('castle-game-engine.runGame', () => {
		console.log('run Game - START');
		vscode.tasks.executeTask(castleTaskProvider.runGameTask);
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('castle-game-engine.cleanGame', () => {
		console.log('clean Game - START');
		vscode.tasks.executeTask(castleTaskProvider.cleanGameTask);
	});
	context.subscriptions.push(disposable);


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	disposable = vscode.commands.registerCommand('castle-game-engine.helloWorld', function () {
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
