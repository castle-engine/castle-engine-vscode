// const fs = require('fs'); // unused
const vscode = require('vscode');
const vscodelangclient = require('vscode-languageclient');
const castleConfiguration = require('./castleConfiguration.js');
const castleExec = require('./castleExec.js');
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
     * Updates this.environmentForPascalServer dictionary.
     * @returns {Promise<bool>} result of loading settings.
     */
    async loadOrDetectSettings()
    {
        this.environmentForPascalServer = {};

        if (this._castleConfig.pascalServerPath === '' ||
            this._castleConfig.buildToolPath === '') {
            return false;
        }

        this.environmentForPascalServer['PP'] = this._castleConfig.fpcExecutablePath;
        this.environmentForPascalServer['FPCDIR'] = this._castleConfig.fpcSourcesPath;
        this.environmentForPascalServer['LAZARUSDIR'] = this._castleConfig.lazarusSourcesPath;
        this.environmentForPascalServer['FPCTARGET'] = this._castleConfig.fpcTargetOs;
        this.environmentForPascalServer['FPCTARGETCPU'] = this._castleConfig.fpcTargetCpu;

        /* pasls cannot work without FPC executable.
           Testcase: without this line, editing settings of PP back and forth
           from valid to invalid FPC executable location, would cause a number
           of errors that pasls cannot be stopped because it is still starting. */
        if (this._castleConfig.fpcExecutablePath === '') {
            return false;
        }

        /* We need to set environment variable CASTLE_ENGINE_PATH, this is
           how we pass engine path (maybe from $CASTLE_ENGINE_PATH, maybe from
           VS extension config) to pasls. */
        let enginePath = this._castleConfig.enginePath;
        if (enginePath !== '') {
            this.environmentForPascalServer['CASTLE_ENGINE_PATH'] = this._castleConfig.enginePath;
        }
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
        if (await this.loadOrDetectSettings() === false) {
            return false;
        }

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
        };

        let initializationOptions = {};

        let cgeFolder = castlePath.bestWorkspaceFolderStrict();
        if (cgeFolder !== undefined) {
            initializationOptions.projectSearchPaths = await this.getSearchPathsFromProjectManifest();
        }

        initializationOptions.engineDevMode = this._castleConfig.engineDeveloperMode;

        initializationOptions.fpcStandardUnitsPaths = await castleExec.executeFileAndReturnValue(this._castleConfig.buildToolPath, ['output-environment', 'fpc-standard-units-path']);
        console.log('FPC standard units paths: ', initializationOptions.fpcStandardUnitsPaths);

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
}

module.exports = CastlePascalLanguageServer;