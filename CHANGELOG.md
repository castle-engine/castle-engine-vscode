# Change Log

All notable changes to this extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

<!-- ## [Unreleased] -->

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