# Change Log

All notable changes to this extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

<!-- ## [Unreleased] -->

## [1.2.1]

### Improved

- Improved auto-detection on macOS (Darwin):

    - Auto-detect FPC sources in `/usr/local/share/fpcsrc` (if FPC is installed using the default installer on macOS).

    - Auto-detect Lazarus sources in `/Applications/Lazarus`.

## [1.2.0]

### Fixed

- Important fix to pass engine path properly to the LSP (`pasls`) when the engine path has been configured as _VS Code_ extension setting.

    Previously, our VS Code extension only worked if you had set `CASTLE_ENGINE_PATH` environment variable... which was not our intention, this was just a bug. To be clear, we work a lot to not require regular users from ever setting `CASTLE_ENGINE_PATH` environment variable (or any other environment variable, for that matter, like `PATH`). Because setting environment variables, in a way that is applied to all applications run in any way (also e.g. GUI applications not run from a shell), and on all operating systems (Windows, Linux/FreeBSD, macOS)... is not that trivial, as experience shows.

## [1.1.1]

### Fixed

- Fixed various settings descriptions.

## [1.1.0]

### Fixed

- Fixed code-completion, in particular when using on Linux with FPC bundled with CGE. Details:
  - Fixed searching for standard FPC units (active on all platforms now).
  - Fixed searching for FPC sources (try "FPC bundled with CGE" on all platforms now).

## [1.0.0]

### Improved

- README description.
- Also, announcing the extension now on [Castle Game Engine News](https://castle-engine.io/wp/) along with a [YouTube Video](https://www.youtube.com/watch?v=24I-DPaYvlo). Let's be bold and bump the version to 1.0.0!

## [0.0.8]

### Fixed

- Streamline LSP description in README.

## [0.0.7]

### Fixed

- Activate on Pascal files, to provide code completion using our LSP server even when not inside CGE project.

## [0.0.6]

### Fixed

- Useful extension settings (properties) order.

## [0.0.5]

- Add catagories.

## [0.0.4]

### Fixed

- Do not show CGE buttons for non-CGE projects.

## [0.0.3]

### Added

- Basic support for multi-root workspaces: we will work in one folder that has `CastleEngineManifest.xml`.

## [0.0.2]

### Changed

- Improved / simplified README.
- Changed various internal names to `castle-engine` instead of `castle-game-engine` -- simpler and more consistent with our domain.
- Changed debugger name `cgedebug` -> `castleDebug`.

## [0.0.1]

- Initial release.