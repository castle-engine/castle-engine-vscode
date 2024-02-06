const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const castleExec = require('./castleExec.js');

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
            validateAndOpenSettings: 'castle-game-engine.validateAndOpenSettings'
        };
        this._buildToolPath = '';
        this._enginePath = '';
        this._pascalServerPath = '';

        let fpcDefaultArch = process.arch;
        if (fpcDefaultArch === 'x64')
            fpcDefaultArch = 'x86_64';
        else if (fpcDefaultArch === 'arm64')
            fpcDefaultArch = 'aarch64';
        else if (fpcDefaultArch === 'x32')
            fpcDefaultArch = 'i386';
        else
            fpcDefaultArch = '';

        this._fpcTargetCpu = this.getConfOrEnvSetting('castleGameEngine.pascalLanguageServer', 'FPCTARGETCPU', fpcDefaultArch);
    }

    /**
     * Returns current build mode
     * @returns {CastleBuildModes}
     */
    get buildMode() {
        return this._buildMode;
    }

    /**
     * Sets build mode
     * @param {CastleBuildModes} newValue new build mode
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
     * @returns {string} path to castle engine folder, empty string when not found
     */
    get enginePath() {
        return this._enginePath;
    }

    /**
     * @returns {string} path to build tool with file name (and extension .exe on windows) or empty string when not found
     */
    get buildToolPath() {
        return this._buildToolPath;
    }

    /**
     * @returns {string} path to pascal language server with file name (and extension .exe on windows) or empty string when not found
     */
    get pascalServerPath() {
        return this._pascalServerPath;
    }

    get fpcTargetCpu() {
        return this._fpcTargetCpu;
    }

    /**
     * Searching target cpu archtecture
     */
    findFpcTargetCpu() {
        let fpcDefaultArch = process.arch;
        if (fpcDefaultArch === 'x64')
            fpcDefaultArch = 'x86_64';
        else if (fpcDefaultArch === 'arm64')
            fpcDefaultArch = 'aarch64';
        else if (fpcDefaultArch === 'x32')
            fpcDefaultArch = 'i386';
        else
            fpcDefaultArch = '';
    
        this._fpcTargetCpu = this.getConfOrEnvSetting('castleGameEngine.pascalLanguageServer', 'FPCTARGETCPU', fpcDefaultArch);
    }

    /**
     * Searching the most important paths. 
     */
    findPaths() {
        this._enginePath = this.findEnginePath();
        if (this._enginePath === '')
        {
            this._buildToolPath = '';    
            this._pascalServerPath = '';
            return;
        }
            
        this._buildToolPath = this.findBuildToolPath();
        this._pascalServerPath = this.findPascalServerPath();
    }

    /**
     * Searches engine path using VSCode configuration and environment variables.
     * Also shows error messages.
     * @returns {string} path to engine or empty string when not found
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
                this.showErrorMessageWithConfigLink('Path to Castle Game Engine is not set, correct the configuration or set CASTLE_ENGINE_PATH environment variable.');
                return '';
            }
        }

        // Check castle engine folder exists
        try {
            fs.accessSync(enginePath, fs.constants.F_OK)
        }
        catch (err) {
            this.showErrorMessageWithConfigLink(`Path to Castle Game Engine is not valid, correct the configuration or set CASTLE_ENGINE_PATH environment variable. \n\n ${err}`);
            return '';
        }

        return enginePath;
    }

    /**
     * Looks for Castle Game Engine build tool.
     * Also shows error message.
     * @returns {string} path to build tool or empty string when not found
     */
    findBuildToolPath() {
        let buildTool = this._enginePath + path.sep + 'bin' + path.sep + 'castle-engine';
        buildTool = castleExec.addExtensionToExecutableFile(buildTool);

        try {
            fs.accessSync(buildTool, fs.constants.F_OK)
        }
        catch (err) {
            vscode.window.showErrorMessage(`Build Tool for Castle Game Engine not found (${buildTool}). ${err}`);
            return '';
        }

        return buildTool;
    }

    /**
     * Looks for Pascal language server, if it does not find it, it displays an error message
     * @returns {string} path to pasls or empty string when not found
     */
    findPascalServerPath() {
        let pasServer = this._enginePath + path.sep + 'bin' + path.sep + 'pasls';
        pasServer = castleExec.addExtensionToExecutableFile(pasServer);

        try {
            fs.accessSync(pasServer, fs.constants.F_OK)
        }
        catch (err) {
            vscode.window.showErrorMessage(`Pascal Language Server for Castle Game Engine not found (${pasServer}). ${err}`);
            return '';
        }

        return pasServer;
    }

    /**
     * Opens error message box with open configuration button.
     * @param {string} message 
     */
    showErrorMessageWithConfigLink(message) {
        let action = 'Open extension config';
        vscode.window.showErrorMessage(message, action)
        .then(selection => {
            if (selection === action) {
                vscode.commands.executeCommand('workbench.action.openSettings', 'castle-game-engine');
            }
        });        
    }

    /**
     * Gets value fom vscode configuration, env variable or the default value. 
     * The name in configuration have to be the same like environment variable.
     * @param {string} configSection configuration section where we are looking for value (envVarName)
     * @param {string} envVarName name in configuration and name of env variable
     * @param {string} defaultValue default value when we can't find it in config or environment
     */
    getConfOrEnvSetting(configSection, envVarName, defaultValue) {
        // First check configuration
        let varValue = vscode.workspace.getConfiguration(configSection).get(envVarName);

        if (varValue.trim() === '') {
            // Then check environment variable
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


}

module.exports = { CastleBuildModes, CastleConfiguration };
