
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

module.exports = { pathForExecCommandCwd };