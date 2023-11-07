

const CastleBuildModes = Object.freeze({
    DEBUG: {name: "Debug", buildTool: "debug"},
    RELEASE: {name: "Release", buildTool: "release"},
});

class CastleConfiguration {

    constructor(initialBuildMode) {
        this._buildMode = initialBuildMode;
        this.recompilationNeeded = true;
        this._commandId = {
            showBuildModes: 'castle-game-engine.showBuildModeSelectionInStatusBar',
        };
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
                this.recompilationNeeded = true;
            }
        }
        else
            throw Error('Incorrect build mode.');
    }

    get commandId() {
        return this._commandId;
    }
}

module.exports = {CastleBuildModes, CastleConfiguration};