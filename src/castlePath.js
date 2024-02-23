const vscode = require("vscode");
const fs = require('fs');

/**
 * Prepares path that works in option.cwd in exec (it can't have "\" as first character)
 * @param {string} path path to fix
 * @returns {string} path ready to use with option.cwd
 */
function pathForExecCommandCwd(path) {
    if (process.platform === 'win32' && path.length > 0 && path[0] == '/' )
        return path.substring(1); // remove first \ from path with that exec not working on windows

    return path;
}

/**
 * Returns WorkspaceFolder that has a best change of being a CGE project
 * and we should use it as a default for various operations.
 * Returns undefined if none.
 *
 * Is there any other way to handle multi-root workspaces
 * when you want to only handle folders with specific filenames?
 * Doesn't look like it.
 * https://github.com/Microsoft/vscode/issues/39132
 * discusses a similar case, but nothing conclusive was implemented as a result of it.
 */
function bestWorkspaceFolder()
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
        let manifestUri = workspaceFolder.uri.with({ path: workspaceFolder.uri.path + "/CastleEngineManifest.xml" });

        /* Using fs from Node.js is not advised, but turning this
           into async function is too bothersome.
           See also https://stackoverflow.com/questions/58451856/vscode-api-check-if-path-exists */

        if (fs.existsSync(manifestUri.fsPath)) {
            // OK, this folder contains CastleEngineManifest.xml
            return workspaceFolder;
        } else {
            // ignore, this folder doesn't contain CastleEngineManifest.xml
        }

        /*
        try {
            await vscode.workspace.fs.stat(manifestUri);
            // OK, this folder contains CastleEngineManifest.xml
            return workspaceFolder;
        } catch (e) {
            // ignore, this folder doesn't contain CastleEngineManifest.xml
        }
        */
    }

    // Nothing matched? For now, return arbitrary first folder (not undefined).
    return vscode.workspace.workspaceFolders[0];
}

module.exports = { pathForExecCommandCwd, bestWorkspaceFolder };