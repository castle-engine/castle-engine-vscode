import * as vscode from 'vscode';
import * as castleExec from './castleExec';
import { CastleConfiguration, CastleBuildModes } from './castleConfiguration';
import * as castlePath from './castlePath';

/**
 * Castle Debug Provider that uses fpDebug to start debug session without
 * configuration. Just choose "castleDebug" after hitting F5.
 * This class implements VS Code DebugConfigurationProvider interface
 * and instance of it can be provided to the vscode.debug.registerDebugConfigurationProvider.
 */
export class CastleDebugProvider implements vscode.DebugConfigurationProvider
{
    private _castleConfig: CastleConfiguration;

    constructor(castleConfig: CastleConfiguration)
    {
        this._castleConfig = castleConfig;
    }

    async provideDebugConfigurations(folder: vscode.WorkspaceFolder | undefined, token?: vscode.CancellationToken): Promise<vscode.DebugConfiguration[]>
    {
        let config = await this.getDebugConfig();
        if (config !== undefined) {
            //console.log('CastleDebugProvider.provideDebugConfigurations, returning 1 config, debugging is available');
            return [config];
        } else {
            //console.log('CastleDebugProvider.provideDebugConfigurations, returning 0 configs, debugging is NOT available');
            return [];
        }
    }

    async resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken): Promise<vscode.DebugConfiguration>
    {
        //console.log('CastleDebugProvider.resolveDebugConfiguration', debugConfiguration);
        return debugConfiguration;

        // debug:
        // to only generate template return null.
        // Also use vscode.DebugConfigurationProviderTriggerKind.Initial
        // at registerDebugConfigurationProvider
        // return null;
    }

    /**
     * Return DebugConfiguration representing debugging current application
     * using fpDebug.
     */
    private async getDebugConfig(): Promise<vscode.DebugConfiguration | undefined>
    {
        let result: vscode.DebugConfiguration = {
            type: 'fpDebug', // castleDebug is used only as alias for fpDebug
            name: 'Debug Castle Game Engine application',
            request: 'launch',
            program: '',
            stopOnEntry: true,
            workingdirectory: '${workspaceFolder}'
            // log: true
        };

        // this._castleConfig.buildToolPath can be changed when
        // debug configuration provider is created and
        // new configuration can be not valid when buildToolPath === ''
        if (this._castleConfig.buildToolPath === '') {
            console.log('getDebugConfig aborted - cannot find build tool');
            return undefined; // abort launch
        }

        let executableName: string = await castleExec.executeFileAndReturnValue(
            this._castleConfig.buildToolPath, ['output', 'executable-name']);
        executableName = executableName  + castlePath.exeExtension();
        result.program = '${workspaceFolder}/' + executableName;
        //console.log('getDebugConfig got program name as ' + result.program);

        // workaround fpDebug 0.6 bug with fpdserver executable not set properly
        if (process.platform === 'win32') {
            let fpDebugExtension: vscode.Extension<any> | undefined = vscode.extensions.getExtension("cnoc.fpdebug");
            if (fpDebugExtension === undefined) {
                console.log('getDebugConfig aborted - fpDebug not installed');
                return undefined; // abort launch
            }
            let fpDebugExtPath = fpDebugExtension.extensionPath;
            if (this._castleConfig.fpcTargetCpu === 'x86_64') {
                result.fpdserver = { executable: fpDebugExtPath + '\\bin\\fpdserver-x86_64.exe' };
            } else if (this._castleConfig.fpcTargetCpu === 'i386') {
                result.fpdserver = { executable: fpDebugExtPath + '\\bin\\fpdserver-i386.exe' };
            } else {
                return vscode.window.showInformationMessage('fpDebug supports only x86_64 and i386 architecture on windows').then(() => {
                    return undefined; // abort launch
                });
            }
        } else if (process.platform === 'linux' && this._castleConfig.fpcTargetCpu !== 'x86_64') {
            return vscode.window.showInformationMessage('fpDebug supports only x86_64 architecture on linux').then(() => {
                return undefined; // abort launch
            });
        }

        if (this._castleConfig.buildMode === CastleBuildModes.RELEASE) {
            vscode.window.showWarningMessage('Running debugger in "release" mode. To get better debug information, change the mode to "debug".');
        }

        // we run compilation only when is needed
        if (this._castleConfig.recompilationNeeded) {
            result.preLaunchTask = 'CGE: compile-cge-game-task';
        }

        if (!result.program) {
            return vscode.window.showInformationMessage('Cannot find a program to debug').then(() => {
                return undefined;	// abort launch
            });
        }
        return result;
    }
}
