import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as path from 'path';
import * as castlePath from '../castlePath';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Path test', () => {
		// let fakePath: string = "c:/test/" + path.delimiter + "c:/test2/";
		// process.env['PATH'] = fakePath;
		let fpcExe: string = castlePath.findExe('fpc'); // at least test it doesn't crash
		console.log('Found FPC in ' + fpcExe);
	});
});
