import vscode from 'vscode';
import util from 'util';
import { exec, execFile } from 'child_process';
import * as castlePath from './castlePath';
import { text } from 'stream/consumers';

/**
 * Executes command and returns stdout as string (empty string on error,
 * but shows showErrorMessage()). Changes current working dir to project directory.
 * @param {string} command command to run
 * @returns {Promise<string>} stdout or empty string on error
 */
export async function executeCommandAndReturnValue(command: string)
{
	let result: string = '';

	let options = {};

	let bestWorkspaceFolder = castlePath.bestWorkspaceFolder();
	if (bestWorkspaceFolder !== undefined) {
		console.log("bestWorkspaceFolder:" + bestWorkspaceFolder.uri.path);
		options['cwd'] = castlePath.pathForExecCommandCwd(bestWorkspaceFolder.uri.path);
	}

	try {
		const { stdout, stderr } = await exec(command, options);
		console.log('stderr:', stderr);

		result = await text(stdout);
		result = result.trim();
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
export async function executeFileAndReturnValue(executableFile: string, args: string[])
{
	let result: string = '';

	let options = {};

	let bestWorkspaceFolder = castlePath.bestWorkspaceFolder();
	if (bestWorkspaceFolder !== undefined) {
		console.log("bestWorkspaceFolder:" + bestWorkspaceFolder.uri.path);
		options['cwd'] = castlePath.pathForExecCommandCwd(bestWorkspaceFolder.uri.path);
	}

	try {
		const { stdout, stderr } = await execFile(executableFile, args, options);
		console.log('stderr:', stderr);

		result = await text(stdout);
		result = result.trim();
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
export async function executeCommand(command) {
	let options = {};

	let bestWorkspaceFolder = castlePath.bestWorkspaceFolder();
	if (bestWorkspaceFolder !== undefined) {
		console.log("bestWorkspaceFolder:" + bestWorkspaceFolder.uri.path);
		options['cwd'] = castlePath.pathForExecCommandCwd(bestWorkspaceFolder.uri.path);
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
export async function executeFile(executableFile: string, args: string[]) {
	let options = {};

	let bestWorkspaceFolder = castlePath.bestWorkspaceFolder();
	if (bestWorkspaceFolder !== undefined) {
		console.log("bestWorkspaceFolder:" + bestWorkspaceFolder.uri.path);
		options['cwd'] = castlePath.pathForExecCommandCwd(bestWorkspaceFolder.uri.path);
	}

	try {
		await execFile(executableFile, args, options);
	} catch (e) {
		vscode.window.showErrorMessage(`Error: ${e.message}`);
	}
}

