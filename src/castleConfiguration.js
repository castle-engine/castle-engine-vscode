const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const castleExec = require('./castleExec.js');
const castlePath = require('./castlePath.js');

/**
 * Constants for build modes.
 * name - for showing in ui
 * buildTool - used as a parameter in our build tool
 */
const CastleBuildModes = Object.freeze({
    DEBUG: { name: "Debug", buildTool: "debug" },
    RELEASE: { name: "Release", buildTool: "release" },
});

/**
 * Our plugin configuration and paths auto-detection.
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
            showBuildModes: 'castle-engine.showBuildModeSelectionInStatusBar',
            compile: 'castle-engine.compile',
            run: 'castle-engine.run',
            clean: 'castle-engine.clean',
            debug: 'workbench.action.debug.start',
            openInCastleEditor: 'castle-engine.openWorkspaceInCastleEditor',
            validateAndOpenSettings: 'castle-engine.validateAndOpenSettings',
            searchInApiReference: 'castle-engine.searchInApiReference',
            backInApiReference: 'castle-engine.backInApiReference'
        };
        this._buildToolPath = '';
        this._enginePath = '';
        this._pascalServerPath = '';
        this._fpcExecutablePath = '';
        this._fpcSourcesPath = '';
        this._lazarusSourcesPath = '';
        this.updateFpcTargetCpu();
        this.updateFpcTargetOs();
        this._engineDeveloperMode = false;
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
    get fpcTargetOs() {
        return this._fpcTargetOs;
    }

    /**
     * @returns {boolean} Is the plugin in engine developer mode? Currently only add engine sources to workspace symbols
     */
    get engineDeveloperMode() {
        return this._engineDeveloperMode;
    }

    get fpcExecutablePath() {
        return this._fpcExecutablePath;
    }
    get fpcSourcesPath() {
        return this._fpcSourcesPath;
    }
    get lazarusSourcesPath() {
        return this._lazarusSourcesPath;
    }

    /**
     * Update this.fpcTargetCpu value.
     * Should be called after the configuration changed.
     */
    updateFpcTargetCpu() {
        let defaultValue = process.arch;
        if (defaultValue === 'x64') {
            defaultValue = 'x86_64';
        } else
        if (defaultValue === 'arm64') {
            defaultValue = 'aarch64';
        } else
        if (defaultValue === 'x32') {
            defaultValue = 'i386';
        } else {
            defaultValue = '';
        }
        this._fpcTargetCpu = this.getConfOrEnvSettingLang('FPCTARGETCPU', defaultValue);
    }

    /**
     * Update this.fpcTargetOs value.
     * Should be called after the configuration changed.
     */
    updateFpcTargetOs()
    {
        let defaultValue = process.platform;
        /* To make it easier for users, we treat both 'win32' and 'win64'
           the same, as just generic 'windows'. The LSP (pasls) then treats
           OS == 'windows' specially, actually changing to 'win32' or 'win64'
           depending on CPU.
           This means that users can specify either win32, or win64,
           regardless of whether they are on 32 or 64-bit Windows. */
        if (defaultValue === 'win32' || defaultValue === 'win64') {
            defaultValue = 'windows';
        }
        this._fpcTargetOs = this.getConfOrEnvSettingLang('FPCTARGET', defaultValue);
    }

    /**
     * Searching the most important paths.
     */
    async findPaths()
    {
        this._findEnginePath();
        if (this._enginePath === '') {
            this._buildToolPath = '';
            this._pascalServerPath = '';
        } else {
            this._buildToolPath = this._findBuildToolPath();
            this._pascalServerPath = this._findPascalServerPath();
        }
        await this._findFpcExecutable();
        await this._findFpcSourcesPath();
        await this._findLazarusSourcesPath();
        console.log('Paths found:' +
            '\nCastle Game Engine path: ' + this._enginePath +
            '\nCastle Game Engine build tool path: ' + this._buildToolPath +
            '\nPascal server path: ' + this._pascalServerPath +
            '\nFPC executable path: ' + this._fpcExecutablePath +
            '\nFPC sources path: ' + this._fpcSourcesPath +
            '\nLazarus sources path: ' + this._lazarusSourcesPath);
    }

    /**
     * Searches engine path using VS Code configuration and environment variables.
     * Shows error message if not found.
     * Sets this._enginePath to found path or empty string when not found.
     */
    _findEnginePath()
    {
        // we will set it to non-empty later in this function, once we have valid value
        this._enginePath = '';

        let enginePath = vscode.workspace.getConfiguration('castleEngine').get('enginePath');
        console.log(`Engine path from configuration: ${enginePath}`);

        if (enginePath.trim() === '') {
            // try to get form environment variable
            if (process.env.CASTLE_ENGINE_PATH) {
                enginePath = process.env.CASTLE_ENGINE_PATH;
                console.log(`Engine path from environment: ${enginePath}`);
            } else {
                this.showErrorMessageWithConfigLink('Path to Castle Game Engine is not set, correct the configuration or set CASTLE_ENGINE_PATH environment variable.');
                return;
            }
        }

        // Check castle engine folder exists
        try {
            fs.accessSync(enginePath, fs.constants.F_OK);
            this._enginePath = enginePath;
        }
        catch (err) {
            this.showErrorMessageWithConfigLink(`Path to Castle Game Engine is not valid, correct the configuration or set CASTLE_ENGINE_PATH environment variable. \n\n ${err}`);
            return;
        }
    }

    /**
     * Looks for Castle Game Engine build tool.
     * Assumes _enginePath is already set and not empty.
     * Shows error message if not found.
     * @returns {string} path to build tool or empty string when not found
     */
    _findBuildToolPath()
    {
        let buildTool = this._enginePath + path.sep +
            'bin' + path.sep +
            'castle-engine' + castlePath.exeExtension();

        try {
            fs.accessSync(buildTool, fs.constants.F_OK)
        }
        catch (err) {
            vscode.window.showErrorMessage(`Build Tool for Castle Game Engine not found (${buildTool}). ${err}`);
            return '';
        }

        if (process.platform === 'win32') {
            /* Replace \ with / on Windows.
               This allows using bash (from Cygwin) shell in VS Code,
               and still execute the CGE operations like "compile-run".
               Other tools don't care, on Windows / is also valid path separator. */
            buildTool = buildTool.replaceAll('\\', '/');
        }

        return buildTool;
    }

    /**
     * Looks for Pascal language server executable.
     * Assumes _enginePath is already set.
     * Shows error message if not found.
     * @returns {string} path to pasls or empty string when not found.
     */
    _findPascalServerPath() {
        let pasServer = this._enginePath + path.sep +
            'bin' + path.sep +
            'pasls' + castlePath.exeExtension();

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
                vscode.commands.executeCommand('workbench.action.openSettings', 'castle-engine');
            }
        });
    }

    /**
     * Gets value fom vscode configuration, env variable or the default value.
     * The name in configuration have to be the same like environment variable.
     * @param {string} configSection configuration section where we are looking for value (envVarName)
     * @param {string} envVarName name in configuration and name of env variable
     * @param {string} defaultValue default value when we can't find it in config or environment
     * @returns {string} value from configuration, environment or default value.
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

    /**
     * Get configuration variable from the pascalLanguageServer section.
     * Fallback on an environment variable.
     * @param {string} envVarName
     * @param {string} defaultValue
     * @returns {string} value from configuration, environment or default value.
     */
    getConfOrEnvSettingLang(envVarName, defaultValue)
    {
        return this.getConfOrEnvSetting('castleEngine.pascalLanguageServer', envVarName, defaultValue);
    }

    updateDeveloperMode() {
        this._engineDeveloperMode = vscode.workspace.getConfiguration('castleEngine').get('engineDeveloperMode');
    }

    /**
     * Find FPC executable.
     * Assumes this.buildToolPath is already set (maybe to '',
     * then it will not use build tool to find FPC).
     * Sets _fpcExecutablePath to found path or empty string when not found.
     */
    async _findFpcExecutable()
    {
        // we will set it to non-empty later in this function, once we have valid value
        this._fpcExecutablePath = '';

        // read VS Code extension setting
        let fpcExe = this.getConfOrEnvSettingLang('PP', '');

        // fallback to compiler path from CGE build tool
        if (fpcExe === ''  && this.buildToolPath !== '') {
            let fpcExeFromBuildTool = await castleExec.executeFileAndReturnValue(
                this.buildToolPath, ['output-environment', 'fpc-exe']);
            fpcExe = fpcExeFromBuildTool;
        }

        // fallback on searching PATH ourselves.
        // TODO: This is potentially unnecessary, as the build tool already looked for FPC on $PATH?
        if (fpcExe === '') {
            fpcExe = castlePath.findExe('fpc');
        }

        // exit with clear error message when FPC compiler not found
        if (fpcExe === '') {

            vscode.window.showErrorMessage('FPC compiler executable not configured and not found on the PATH. Configure the FPC compiler location in the extension settings.');
            return;
        }

        // Check compiler really exists and can be executed
        try {
            fs.accessSync(fpcExe, fs.constants.X_OK);
            this._fpcExecutablePath = fpcExe;
        }
        catch (err) {
            vscode.window.showErrorMessage(`FPC compiler executable not found or can't be executed. ${err}`);
        }
    }

    /**
     * Find FPC sources directory.
     * Sets this._fpcSourcesPath to found path or empty string when not found.
     * Assumes this._fpcExecutablePath is already set.
     */
    async _findFpcSourcesPath()
    {
        let fpcSources = this.getConfOrEnvSettingLang('FPCDIR', '');
        if (fpcSources === '') {
            fpcSources = await this._tryToFindFpcSources(this._fpcExecutablePath);
        }
        this._fpcSourcesPath = fpcSources;
    }

    /**
     * Find Lazarus sources directory.
     * Sets this._lazarusSourcesPath to found path or empty string when not found.
     * Assumes this._fpcExecutablePath is already set.
     */
    async _findLazarusSourcesPath()
    {
        let lazarusSources = this.getConfOrEnvSettingLang('LAZARUSDIR', '');
        if (lazarusSources === '') {
            lazarusSources = await this._tryToFindLazarusSources(this._fpcExecutablePath);
        }
        this._lazarusSourcesPath = lazarusSources;
    }

    /**
     * Does the folder is Free Pascal Compiler sources directory.
     * @param {string} folder directory to check.
     * @returns {boolean} Does this look like FPC sources folder.
     */
    _isCompilerSourcesFolder(folder)
    {
        try {
            fs.accessSync(folder, fs.constants.F_OK)
            fs.accessSync(folder + '/rtl', fs.constants.F_OK)
            fs.accessSync(folder + '/packages', fs.constants.F_OK)
            return true;
        }
        catch (err) {
            return false;
        }
    }

    /**
     * Find FPC sources directory, knowing FPC executable path.
     * @param {string} fpcCompilerExec path to fpc. If empty, then we return empty string.
     * @returns {Promise<string>} path to fpc sources or '' when not found.
     */
    async _tryToFindFpcSources(fpcCompilerExec)
    {
        if (fpcCompilerExec === '')
            return '';

        // Find sources if FPC is bundled with CGE
        {
            let sourcesDir = fpcCompilerExec;

            // Look for both Unix and Windows paths
            let index = sourcesDir.lastIndexOf('/bin/');
            if (index < 0) {
                index = sourcesDir.lastIndexOf('\\bin\\');
            }

            if (index >= 0) {
                sourcesDir = sourcesDir.substring(0, index) + '/src';
                if (this._isCompilerSourcesFolder(sourcesDir)) {
                    console.log('Found FPC sources (FPC bundled with CGE):', sourcesDir);
                    return sourcesDir;
                }
            }
        }

        // Find sources if FPC is provided by fpcupdeluxe.
        {
            let sourcesDir = fpcCompilerExec;

            // Look for both Unix and Windows paths
            let index = sourcesDir.lastIndexOf('/fpc/bin/');
            if (index < 0) {
                index = sourcesDir.lastIndexOf('\\fpc\\bin\\');
            }

            if (index >= 0) {
                sourcesDir = sourcesDir.substring(0, index) + '/fpcsrc';
                if (this._isCompilerSourcesFolder(sourcesDir)) {
                    console.log('Found FPC sources (FPC looks like provided by fpcupdeluxe):', sourcesDir);
                    return sourcesDir;
                }
            }
        }

        // Find sources if FPC is installed system-wide on Unix.
        if (process.platform === 'linux') {
            // when fpc-src is installed from fpc-src debian package
            // sources are in directory like /usr/share/fpcsrc/3.2.2/
            // https://packages.debian.org/bookworm/all/fpc-source-3.2.2/filelist
            let compilerVersion = await castleExec.executeFileAndReturnValue(fpcCompilerExec, ['-iV']);
            console.log('FPC Version', compilerVersion);
            let sourcesDir = '/usr/share/fpcsrc/' + compilerVersion + '/';
            if (this._isCompilerSourcesFolder(sourcesDir)) {
                console.log('Found FPC sources (FPC installed system-wide on Unix):', sourcesDir);
                return sourcesDir;
            }
        }
        // Find sources if FPC is installed using the default installer on macOS.
        if (process.platform === 'darwin') {
            let sourcesDir = '/usr/local/share/fpcsrc';
            if (this._isCompilerSourcesFolder(sourcesDir)) {
                console.log('Found FPC sources (FPC installed system-wide on macOS):', sourcesDir);
                return sourcesDir;
            }
        }

        // sources not found
        return '';
    }

    /**
     * Checks given folder is lazarus sources folder
     * @param {string} folder directory to check
     * @returns {boolean} is it looks like a sources folder? true - yes, false - no
     */
    _isLazarusSourcesFolder(folder) {
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
     * This function gets directory like /usr/lib/lazarus/ and searches for
     * version directory e.g. /usr/lib/lazarus/2.2.6/
     * @param {string} folder directory in which we want to check the subdirectories
     * @returns {string} Lazarus source directory or empty string
     */
    _findFullLazarusSourcesFolder(folder)
    {
        try {
            fs.accessSync(folder, fs.constants.R_OK)
        }
        catch (err) {
            return '';
        }

        try {
            const items = fs.readdirSync(folder);
            for (const item of items) {
                if (this._isLazarusSourcesFolder(folder + item)) {
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
     * @returns {Promise<string>} path to lazarus sources
     */
    async _tryToFindLazarusSources(fpcCompilerExec) {
        if (fpcCompilerExec === '')
            return '';

        if (process.platform === 'linux') {
            // check current fpc is not done by fpcupdeluxe then lazarus is in lazarus subfolder
            let sourcesDir = fpcCompilerExec;
            let index = sourcesDir.indexOf('fpc/bin');
            if (index > 0) {

                sourcesDir = sourcesDir.substring(0, index) + 'lazarus';
                if (this._isLazarusSourcesFolder(sourcesDir)) {
                    console.log('Found Lazarus sources:', sourcesDir);
                    return sourcesDir;
                }
            }

            // default lazarus sources folder path in debian
            // looks like /usr/lib/lazarus/2.2.6/
            // so we need iterate all items in that directory
            // https://packages.debian.org/bookworm/all/lazarus-src-2.2/filelist
            sourcesDir = this._findFullLazarusSourcesFolder('/usr/lib/lazarus/');
            if (sourcesDir !== '') {
                console.log('Found Lazarus sources:', sourcesDir);
                return sourcesDir;
            }
        } else
            if (process.platform === 'win32') {
                // check current fpc is not done by fpcupdeluxe then lazarus is in lazarus subfolder
                let sourcesDir = fpcCompilerExec;
                let index = sourcesDir.indexOf('fpc\\bin');
                if (index > 0) {

                    sourcesDir = sourcesDir.substring(0, index) + 'lazarus';
                    if (this._isLazarusSourcesFolder(sourcesDir)) {
                        console.log('Found Lazarus sources:', sourcesDir);
                        return sourcesDir;
                    }
                }
            } else
                if (process.platform === 'darwin') {
                    // check the default install folder on macOS
                    let sourcesDir = '/Applications/Lazarus';
                    if (this._isLazarusSourcesFolder(sourcesDir)) {
                        console.log('Found Lazarus sources:', sourcesDir);
                        return sourcesDir;
                    }
                    //TODO: better macos support
                }

        // no sources dir found
        return '';
    }
}

module.exports = { CastleBuildModes, CastleConfiguration };
