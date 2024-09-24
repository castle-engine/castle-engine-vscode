const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const path = require('path');
const castlePath = require('../../src/castlePath.js');

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    test('Path test', () => {
        let fakePath = "c:/test/" + path.delimiter + "c:/test2/";
        process.env.PATH = fakePath;
        /*let fpcExe = */ castlePath.findExe('fpc'); // at least test it doesn't crash
        // console.log('message from tests');
        // console.log(fpcExe);
    });
});
