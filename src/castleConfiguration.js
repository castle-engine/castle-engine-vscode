const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Consts for build modes.
 * name - for showing in ui
 * buildTool - used as a parameter in our build tool
 */
const CastleBuildModes = Object.freeze({
    DEBUG: { name: "Debug", buildTool: "debug" },
    RELEASE: { name: "Release", buildTool: "release" },
});

/**
 * Our plugin configuration and paths autodetection.
 */
class CastleConfiguration {

    /**
     * 
     * @param {CastleBuildModes} initialBuildMode 
     */
    constructor(initialBuildMode) {
        this._buildMode = initialBuildMode;
        this.recompilationNeeded = true;
        this._commandId = {
            showBuildModes: 'castle-game-engine.showBuildModeSelectionInStatusBar',
            compileGame: 'castle-game-engine.compileGame',
            runGame: 'castle-game-engine.runGame',
            cleanGame: 'castle-game-engine.cleanGame',
            debugGame: 'workbench.action.debug.start',
            openInCastleEditor: 'castle-game-engine.openWorkspaceInCastleEditor',
        };
        this._buildToolPath = undefined;
        this._enginePath = undefined;
        this._pascalServerPath = undefined;
        this._compilerPath = undefined;
        this._fpcSourcesPath = undefined;
        this._lazarusSourcesPath = undefined;
    }

    /**
     * Returns current build mode
     */
    get buildMode() {
        return this._buildMode;
    }

    /**
     * Sets build mode
     */
    set buildMode(newValue) {
        if (newValue === CastleBuildModes.DEBUG || newValue === CastleBuildModes.RELEASE) {
            if (newValue !== this._buildMode) {
                this._buildMode = newValue;
                this.recompilationNeeded = true;
            }
        }
        else
            throw Error('Incorrect build mode.');
    }

    /**
     * All Visual Studio commands id.
     */
    get commandId() {
        return this._commandId;
    }

    /**
     * @returns {string|undefined} path to castle engine folder
     */
    get enginePath() {
        return this._enginePath;
    }

    /**
     * @returns {string|undefined} path to build tool with file name (and extension .exe on windows) or undefined when not found
     */
    get buildToolPath() {
        return this._buildToolPath;
    }

    /**
     * @returns {string|undefined} path to pascal language server with file name (and extension .exe on windows) or undefined when not found
     */
    get pascalServerPath() {
        return this._pascalServerPath;
    }

    /**
     * @returns {boolean} returns true if everything has been successfully configured,
     * or false some features can not working.
     */
    findPaths() {
        this._enginePath = this.findEnginePath();
        if (this._enginePath == undefined)
            return false;
        this._buildToolPath = this.findBuildToolPath();
        if (this._buildToolPath == undefined)
            return false;
        this._pascalServerPath = this.findPascalServerPath();
        if (this._pascalServerPath == undefined)
            return false;
    }

    /**
     * Searches engine path using VSCode configuration and environment variables.
     * Also shows error messages.
     * @returns {string|undefined} path to engine or undefined when not found
     */
    findEnginePath() {
        let enginePath = vscode.workspace.getConfiguration('castleGameEngine').get('enginePath');
        console.log(`Engine path from configuration: ${enginePath}`);

        if (enginePath.trim() === '') {
            // try to get form environment variable 
            if (process.env.CASTLE_ENGINE_PATH) {
                enginePath = process.env.CASTLE_ENGINE_PATH
                console.log(`Engine path from environment: ${enginePath}`);
            } else {
                vscode.window.showErrorMessage('Castle Game Engine not set, correct the configuration or set CASTLE_ENGINE_PATH environment variable.');
                return undefined;
            }
        }

        // Check castle engine folder exists
        try {
            fs.accessSync(enginePath, fs.constants.F_OK)
        }
        catch (err) {
            vscode.window.showErrorMessage(`Castle Game Engine not found, correct the configuration or set CASTLE_ENGINE_PATH environment variable. ${err}`);
            return undefined;
        }

        return enginePath;
    }

    /**
     * Looks for Castle Game Engine build tool.
     * Also shows error message.
     * @returns {string|undefined} path to build tool or undefined when not found
     */
    findBuildToolPath() {
        let buildTool = this._enginePath + path.sep + 'bin' + path.sep + 'castle-engine';
        if (process.platform === 'win32')
            buildTool += '.exe';


        try {
            fs.accessSync(buildTool, fs.constants.F_OK)
        }
        catch (err) {
            vscode.window.showErrorMessage(`Build Tool for Castle Game Engine not found (${buildTool}). ${err}`);
            return undefined;
        }

        return buildTool;
    }

    /**
     * Looks for Pascal language server, if it does not find it, it displays an error message
     * @returns {string|undefined} path to pasls or undefined when not found
     */
    findPascalServerPath() {
        let pasServer = this._enginePath + path.sep + 'bin' + path.sep + 'pasls';
        if (process.platform === 'win32')
            pasServer += '.exe';

        try {
            fs.accessSync(pasServer, fs.constants.F_OK)
        }
        catch (err) {
            vscode.window.showErrorMessage(`Pascal Language Server for Castle Game Engine not found (${pasServer}). ${err}`);
            return undefined;
        }

        return pasServer;
    }

}

module.exports = { CastleBuildModes, CastleConfiguration };
