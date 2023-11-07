

const CastleBuildModes = Object.freeze({
    DEBUG: {name: "Debug", buildTool: "debug"},
    RELEASE: {name: "Release", buildTool: "release"},
});

class CastleConfiguration {

    constructor(initialBuildMode, castleFileWatcher) {
        this._castleFileWatcher = castleFileWatcher; 
        this._buildMode = initialBuildMode;
    }

    get buildMode() {
        return this._buildMode;
    }

    set buildMode(newValue) {
        if (newValue === CastleBuildModes.DEBUG || newValue === CastleBuildModes.RELEASE)
        {
            if (newValue !== this._buildMode)
            {
                this._buildMode = newValue;
                this._castleFileWatcher.recompilationNeeded = true;
            }
        }
        else
            throw Error('Incorrect build mode.');
    }
}

module.exports = {CastleBuildModes, CastleConfiguration};