const vscode = require("vscode");

// https://stackoverflow.com/questions/30763496/how-to-promisify-nodes-child-process-exec-and-child-process-execfile-functions
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const execFile = util.promisify(require('child_process').execFile);
const castlePath = require('./castlePath.js');

/**
 * Executes command and returns stdout as string (empty string on error, 
 * but shows showErrorMessage()). Changes current working dir to project directory.
 * @param {string} command command to run
 * @returns {Promise<string>} stdout or empty string on error
 */
async function executeCommandAndReturnValue(command) {
	let result = '';

	let options = {};

	if (vscode.workspace.workspaceFolders !== undefined) {
		console.log(vscode.workspace.workspaceFolders[0].uri.path);
		options.cwd = castlePath.pathForExecCommandCwd(vscode.workspace.workspaceFolders[0].uri.path);
	}

	try {
		const { stdout, stderr } = await exec(command, options);
		console.log('stderr:', stderr);

		result = stdout.trim();
		console.log('stdout: ', result);
		return result;

	} catch (e) {
		vscode.window.showErrorMessage(`Error: ${e.message}`);
		return result;
	}
}

/**
 * Executes file and returns stdout as string (empty string on error, 
 * but shows showErrorMessage()). Changes current working dir to project directory.
 * @param {string} executableFile file to execute
 * @param {string[]} args execution arguments
 * @returns {Promise<string>} stdout or empty string on error
 */
async function executeFileAndReturnValue(executableFile, args) {
	let result = '';

	let options = {};

	if (vscode.workspace.workspaceFolders !== undefined) {
		console.log(vscode.workspace.workspaceFolders[0].uri.path);
		options.cwd = castlePath.pathForExecCommandCwd(vscode.workspace.workspaceFolders[0].uri.path);
	}

	try {
		const { stdout, stderr } = await execFile(executableFile, args, options);
		console.log('stderr:', stderr);

		result = stdout.trim();
		console.log('stdout: ', result);
		return result;

	} catch (e) {
		vscode.window.showErrorMessage(`Error: ${e.message}`);
		return result;
	}
}

/**
 * Executes command, shows error in vscode error message.
 * @param {string} command command to run
 */
async function executeCommand(command) {
	let options = {};

	if (vscode.workspace.workspaceFolders !== undefined) {
		console.log(vscode.workspace.workspaceFolders[0].uri.path);
		options.cwd = castlePath.pathForExecCommandCwd(vscode.workspace.workspaceFolders[0].uri.path);
	}

	try {
		await exec(command, options);
	} catch (e) {
		vscode.window.showErrorMessage(`Error: ${e.message}`);
	}
}

/**
 * Executes file on error shows showErrorMessage(). Changes current working dir to project directory.
 * @param {string} executableFile file to execute
 * @param {string[]} args execution arguments
 */
async function executeFile(executableFile, args) {
	let options = {};

	if (vscode.workspace.workspaceFolders !== undefined) {
		console.log(vscode.workspace.workspaceFolders[0].uri.path);
		options.cwd = castlePath.pathForExecCommandCwd(vscode.workspace.workspaceFolders[0].uri.path);
	}

	try {
		await execFile(executableFile, args, options);
	} catch (e) {
		vscode.window.showErrorMessage(`Error: ${e.message}`);
	}
}

module.exports = { executeCommandAndReturnValue, executeFileAndReturnValue, executeCommand, executeFile };