const fs = require('fs');
const vscode = require('vscode');
const vscodelangclient = require('vscode-languageclient');

// eslint-disable-next-line no-unused-vars
const castleConfiguration = require('./castleConfiguration.js');
const castleExec = require('./castleExec.js');
const path = require('path');
const castlePath = require('./castlePath.js');

/**
 * A class for managing the Pascal Language Server
 */
class CastlePascalLanguageServer {

    /**
     * @param {castleConfiguration.CastleConfiguration} castleConfig
     */
    constructor(castleConfig) {
        this._castleConfig = castleConfig;
        this._pascalServerClient = null;
    }

    /**
     * @returns {vscodelangclient.LanguageClient|null} LanguageClient or null when not available
     */
    get pascalServerClient() {
        return this._pascalServerClient;
    }

    /**
     * Loads or tries to automatically detect settings
     * @returns {Promise<bool>} result of loading settings
     */
    async loadOrDetectSettings() {
        this.environmentForPascalServer = {};
        if (this._castleConfig.pascalServerPath === '' || this._castleConfig.buildToolPath === '')
            return false;

        // get default compiler path for build tool
        let defaultCompilerExePath = await castleExec.executeFileAndReturnValue(this._castleConfig.buildToolPath, ['output-environment', 'fpc-exe']);

        // read settings when and fallback to defaultCompilerExePath
        this.environmentForPascalServer['PP'] = this.getEnvSetting('PP', defaultCompilerExePath);

        // when build tool did not return fpc path for example when this is old build tool
        // try simply run fpc -PB
        if (this.environmentForPascalServer['PP'] === '')
            this.environmentForPascalServer['PP'] = await castleExec.executeFileAndReturnValue(castleExec.addExtensionToExecutableFile('fpc'), ['-PB']);

        // Check compiler really exists and can be executed
        try {
            fs.accessSync(this.environmentForPascalServer['PP'], fs.constants.X_OK)
        }
        catch (err) {
            vscode.window.showErrorMessage(`FPC compiler executable not found or can't be executed. ${err}`);
            return false;
        }

        this.environmentForPascalServer['FPCDIR'] = this.getEnvSetting('FPCDIR', '');

        if (this.environmentForPascalServer['FPCDIR'] === '') {
            // try to find fpc sources
            let realCompilerPath = await castleExec.executeFileAndReturnValue(this.environmentForPascalServer['PP'], ['-PB']);
            this.environmentForPascalServer['FPCDIR'] = await this.tryToFindFpcSources(realCompilerPath);
        }

        this.environmentForPascalServer['LAZARUSDIR'] = this.getEnvSetting('LAZARUSDIR', '');

        if (this.environmentForPascalServer['LAZARUSDIR'] === '') {
            let realCompilerPath = await castleExec.executeFileAndReturnValue(this.environmentForPascalServer['PP'], ['-PB']);
            this.environmentForPascalServer['LAZARUSDIR'] = await this.tryToFindLazarusSources(realCompilerPath);
        }

        let fpcDefaultTarget = process.platform;
        // win32 can be 32 or 64 bit windows
        if (fpcDefaultTarget === 'win32')
            fpcDefaultTarget = 'windows'

        this.environmentForPascalServer['FPCTARGET'] = this.getEnvSetting('FPCTARGET', fpcDefaultTarget);

        this.environmentForPascalServer['FPCTARGETCPU'] = this._castleConfig.fpcTargetCpu;
    }

    /**
     * Check for fpc.cfg - fixes pasls with our bundle
     * @param {string} fpcExecutable fpc execution file for which we are looking fpc.cfg
     * @returns {Promise<bool>}
     * @retval true fpc installation has fpc.cfg
     * @retval false fpc installation does not have fpc.cfg
     */
    async hasFpcCfgFile(fpcExecutable)
    {
        // currently checked only for windows
        if (process.platform !== 'win32')
            return true;
        let realCompilerPath = await castleExec.executeFileAndReturnValue(fpcExecutable, ['-PB']);
        let fpcCfgFile = path.dirname(realCompilerPath) + '\\fpc.cfg'
        try {
            fs.accessSync(fpcCfgFile, fs.constants.F_OK)
        }
        catch (err) {
            return false;
        }
        return true;
    }

    /**
     * Reads search paths form CastleEngineManifest.xml file.
     * @returns {Promise<string>} paths split by new line chars
     */
    async getSearchPathsFromProjectManifest() {
        try {
            let searchPathsFromProjectManifest = await castleExec.executeFileAndReturnValue(this._castleConfig.buildToolPath, ['output', 'search-paths']);
            // In some places, code tools check paths as text, and this is significant
            if (process.platform === 'win32') {
                searchPathsFromProjectManifest = searchPathsFromProjectManifest.replace(/\//g, "\\");
            }
            console.log('Project search paths: ');
            console.log(searchPathsFromProjectManifest);
            return searchPathsFromProjectManifest;
        } catch (err)
        {
            console.log(err);
            return '';
        }
    }

    async createLanguageClient() {
        if (await this.loadOrDetectSettings() === false)
            return false;

        let run = {
            command: this._castleConfig.pascalServerPath,
            options: {
                env: this.environmentForPascalServer
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
            ],
            //		initializationOptions : {
            //			option: 'value',
            //		}
        }

        let initializationOptions = {};

        let cgeFolder = castlePath.bestWorkspaceFolderStrict();
        if (cgeFolder !== undefined) {
            initializationOptions.projectSearchPaths = await this.getSearchPathsFromProjectManifest();
        }

        initializationOptions.engineDevMode = this._castleConfig.engineDeveloperMode;

        let hasFpcCfg = await this.hasFpcCfgFile(this.environmentForPascalServer['PP']);
        if (!hasFpcCfg)
            initializationOptions.fpcStandardUnitsPaths = await castleExec.executeFileAndReturnValue(this._castleConfig.buildToolPath, ['output-environment', 'fpc-standard-units-path']);

        clientOptions.initializationOptions = initializationOptions;
        this._pascalServerClient = new vscodelangclient.LanguageClient('pascal-language-server', 'Pascal Language Server', serverOptions, clientOptions);
        await this._pascalServerClient.start();
        return true;
    }

    /**
     * Destroys _pascalServerClient. Used when configuration changes.
     */
    async destroyLanguageClient() {
        if (this._pascalServerClient != undefined) {
            try {
                await this._pascalServerClient.stop();

            } catch (e) {
                vscode.window.showErrorMessage(`Error when destroying pasls client: ${e.message}`);
            }
            this._pascalServerClient = null;
        }
    }

    /**
     * Gets value fom vscode configuration, env variable or the default value.
     * @param {string} envVarName
     * @param {string} defaultValue
     */
    getEnvSetting(envVarName, defaultValue) {
        return this._castleConfig.getConfOrEnvSetting('castleEngine.pascalLanguageServer', envVarName, defaultValue);
    }


    /**
     * Checks the folder is Free Pascal Compiler sources directory
     * @param {string} folder directory to check
     * @returns {boolean} is it looks like a sources folder? true - yes, false - no
     */
    isCompilerSourcesFolder(folder) {
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
     *
     * @param {string} fpcCompilerExec path to fpc
     * @returns {Promise<string>} path to fpc sources or '' when not found
     */
    async tryToFindFpcSources(fpcCompilerExec) {
        if (fpcCompilerExec === '')
            return '';

        if (process.platform === 'linux') {
            // check current fpc is not done by fpcupdeluxe
            let sourcesDir = fpcCompilerExec;
            let index = sourcesDir.indexOf('fpc/bin');
            if (index > 0) {
                sourcesDir = sourcesDir.substring(0, index) + 'fpcsrc';
                if (this.isCompilerSourcesFolder(sourcesDir)) {
                    console.log('Found fpc sources:', sourcesDir);
                    return sourcesDir;
                }
            }

            // when fpc-src is installed from fpc-src debian package
            // sources are in directory like /usr/share/fpcsrc/3.2.2/
            // https://packages.debian.org/bookworm/all/fpc-source-3.2.2/filelist
            let compilerVersion = await castleExec.executeFileAndReturnValue(fpcCompilerExec, ['-iV']);
            console.log('Compiler Version', compilerVersion);
            sourcesDir = '/usr/share/fpcsrc/' + compilerVersion + '/';
            if (this.isCompilerSourcesFolder(sourcesDir)) {
                console.log('Found lazarus sources:', sourcesDir);
                return sourcesDir;
            }

        } else
            if (process.platform === 'win32') {
                // check current fpc is not done by fpcupdeluxe
                let sourcesDir = fpcCompilerExec;
                let index = sourcesDir.indexOf('fpc\\bin');
                if (index > 0) {
                    sourcesDir = sourcesDir.substring(0, index) + 'fpcsrc';
                    if (this.isCompilerSourcesFolder(sourcesDir)) {
                        console.log('Found fpc sources:', sourcesDir);
                        return sourcesDir;
                    }
                }
                // check is it bundled fpc
                sourcesDir = fpcCompilerExec;
                index = sourcesDir.indexOf('bin');
                sourcesDir = sourcesDir.substring(0, index) + 'src';
                if (this.isCompilerSourcesFolder(sourcesDir)) {
                    console.log('Found fpc sources:', sourcesDir);
                    return sourcesDir;
                }
            } else
                if (process.platform === 'darwin') {
                    //TODO: macos support
                }

        // sources not found
        return '';
    }

    /**
     * Checks given folder is lazarus sources folder
     * @param {string} folder directory to check
     * @returns {boolean} is it looks like a sources folder? true - yes, false - no
     */
    isLazarusSourcesFolder(folder) {
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
    findFullLazarusSourcesFolder(folder) {

        try {
            fs.accessSync(folder, fs.constants.R_OK)
        }
        catch (err) {
            return '';
        }

        try {
            const items = fs.readdirSync(folder);
            for (const item of items) {
                if (this.isLazarusSourcesFolder(folder + item)) {
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
    async tryToFindLazarusSources(fpcCompilerExec) {
        if (fpcCompilerExec === '')
            return '';

        if (process.platform === 'linux') {
            // check current fpc is not done by fpcupdeluxe then lazarus is in lazarus subfolder
            let sourcesDir = fpcCompilerExec;
            let index = sourcesDir.indexOf('fpc/bin');
            if (index > 0) {

                sourcesDir = sourcesDir.substring(0, index) + 'lazarus';
                if (this.isLazarusSourcesFolder(sourcesDir)) {
                    console.log('Found lazarus sources:', sourcesDir);
                    return sourcesDir;
                }
            }

            // default lazarus sources folder path in debian
            // looks like /usr/lib/lazarus/2.2.6/
            // so we need iterate all items in that directory
            // https://packages.debian.org/bookworm/all/lazarus-src-2.2/filelist
            sourcesDir = this.findFullLazarusSourcesFolder('/usr/lib/lazarus/');
            if (sourcesDir !== '') {
                console.log('Found lazarus sources:', sourcesDir);
                return sourcesDir;
            }
        } else
            if (process.platform === 'win32') {
                // check current fpc is not done by fpcupdeluxe then lazarus is in lazarus subfolder
                let sourcesDir = fpcCompilerExec;
                let index = sourcesDir.indexOf('fpc\\bin');
                if (index > 0) {

                    sourcesDir = sourcesDir.substring(0, index) + 'lazarus';
                    if (this.isLazarusSourcesFolder(sourcesDir)) {
                        console.log('Found lazarus sources:', sourcesDir);
                        return sourcesDir;
                    }
                }
            } else
                if (process.platform === 'darwin') {
                    //TODO: macos support
                }

        // no sources dir found
        return '';
    }
}

module.exports = CastlePascalLanguageServer;