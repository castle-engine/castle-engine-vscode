import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

/**
 * Prepares path that works in option.cwd in exec (it can't have "\" as first character)
 * @param {string} path path to fix
 * @returns {string} path ready to use with option.cwd
 */
export function pathForExecCommandCwd(path) {
    if (process.platform === 'win32' && path.length > 0 && path[0] === '/' ) {
        return path.substring(1); // remove first \ from path with that exec not working on windows
    }

    return path;
}

/**
 * Returns true if folder is a CGE project (contains CastleEngineManifest.xml)
 * @param {vscode.WorkspaceFolder} folder
 * @returns {boolean}
 */
export function folderIsCgeProject(folder) {
    let manifestUri = folder.uri.with({ path: folder.uri.path + "/CastleEngineManifest.xml" });

    /* Using fs from Node.js is not advised, but turning this
       into async function is too bothersome.
       See also https://stackoverflow.com/questions/58451856/vscode-api-check-if-path-exists */

    return fs.existsSync(manifestUri.fsPath);

    /*
    try {
        await vscode.workspace.fs.stat(manifestUri);
        return true;
    } catch (e) {
        return false;
    }
    */
}

/**
 * Returns WorkspaceFolder that is a CGE project (contains CastleEngineManifest.xml),
 * or undefined if none.
 */
export function bestWorkspaceFolderStrict()
{
    for (const workspaceFolder of vscode.workspace.workspaceFolders) {
        if (folderIsCgeProject(workspaceFolder)) {
            return workspaceFolder;
        }
    }
    return undefined;
}

/**
 * Returns WorkspaceFolder that has a best chance of being a CGE project
 * and we should use it as a default for various operations.
 * Returns undefined if none.
 *
 * Compared to bestWorkspaceFolderStrict, this function may return a folder
 * that is not a CGE project.
 * But it is also faster in typical case of single-root workspace.
 *
 * Is there any other way to handle multi-root workspaces
 * when you want to only handle folders with specific filenames?
 * Doesn't look like it.
 * https://github.com/Microsoft/vscode/issues/39132
 * discusses a similar case, but nothing conclusive was implemented as a result of it.
 */
export function bestWorkspaceFolder()
{
    // quickly do easy cases
    if (vscode.workspace.workspaceFolders === undefined) {
        return undefined;
    }
    if (vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0];
    }

    // scan the workspaceFolders list for one that contains CastleEngineManifest.xml
    for (const workspaceFolder of vscode.workspace.workspaceFolders) {
        if (folderIsCgeProject(workspaceFolder)) {
            return workspaceFolder;
        }
    }

    // Nothing matched? For now, return arbitrary first folder (not undefined).
    return vscode.workspace.workspaceFolders[0];
}

/**
 * Returns executable extension, if any, on this platform.
 * Just ".exe" on Windows, empty string on other platforms.
 * Consistent with Castle Game Engine Pascal CastleUtils.ExeExtension.
 * @returns {string}
 */
export function exeExtension()
{
    return process.platform === 'win32' ? '.exe' : '';
}

/**
 * Find a file on the PATH environment variable.
 * Consistent with Castle Game Engine Pascal CastleFilesUtils.FindExe.
 * @param {string} exeBaseName File name to find (without path, without .exe extension).
 * @returns {string} Full path to the file, or empty string if not found.
 */
export function findExe(exeBaseName)
{
    let pathList = process.env.PATH.split(path.delimiter);
    for (let i = 0; i < pathList.length; i++) {
        let dir = pathList[i];
        let exePath = path.join(dir, exeBaseName + exeExtension());
        if (fs.existsSync(exePath)) {
            return exePath;
        }
    }
    return '';
}
