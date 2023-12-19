
/**
 * Prepares path that work when it has spaces and on windows path that works with powershell
 * @param {string} path path to fix
 * @returns {string} path ready to use with vscode.ShellExecution()
 */
function pathForShellExecute (path) {
    if (process.platform === 'win32')
        return path.replace(/ /g, '` ');
    else 
        return path.replace(/ /g, '\\ ');
}

/**
 * Prepares path that works in option.cwd in exec (it can't have "\" as first character)
 * @param {string} path path to fix
 * @returns {string} path ready to use with option.cwd
 */
function pathForExecCommandCwd(path) {
    if (process.platform === 'win32' && path.length > 0 && path[0] == '/' )
        return path.substring(1); // remove first \ from path with that exec not working on windows
}

/**
 * Prepares path that works in exec() 
 * @param {string} path path to fix
 * @returns {string} path ready to use with exec()
 */
function pathForExecCommand(path) {
    return '\"' + path + '\"';
}

module.exports = { pathForShellExecute, pathForExecCommand, pathForExecCommandCwd };