# Change Log

All notable changes to this extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

<!-- ## [Unreleased] -->

## [1.4.2]

- Another minor update of dependencies, use [vsce 3.6.2](https://www.npmjs.com/package/@vscode/vsce).

## [1.4.1]

- Minor update of dependencies.
- See what happens with [weird message in VS Code](https://forum.castle-engine.io/t/vs-code-extension-no-longer-avaliable/2025/2).

## [1.4.0]

### Improved

- Underlying extension source code has been converted to TypeScript.
    - This will allow us to extend the extension in the future more easily, as type annotations and other TypeScript features help us catch errors earlier.
    - Please note that it implies rather significant code change. As always [we appreciate if you report any bugs](https://github.com/castle-engine/castle-engine-vscode).

- Our "debug provider" is now registered in a more reliable way. Usage (instructions below are also repeated in the README):
    - Switch to the _"Run And Debug"_ panel.
    - Use the _"Run And Debug"_ button (if this button is shown in the panel).
        - Choose _"More Debug Castle Game Engine Project options..."_.
        - Choose _"Debug Castle Game Engine application (`application name`)"_.
    - Or use the combo box with debugger choices, if that's shown in the panel.
        - Pick _"Debug Castle Game Engine Project"_ there.
    - Open some Pascal file (any unit `.pas` or main program like `.dpr` or `.lpr`) if options above don't show the _"Debug Castle Game Engine Project"_ option.

## [1.3.1]

### Fixed

- Fixed finding `fpc` on `$PATH` (if it wasn't configured).

## [1.3.0]

### Improved

- The FPC, Lazarus and _Castle Game Engine_ paths are now passed to the underlying build tool (executed when you press e.g. _"Compile"_ or _"Run"_).

    This means that VS Code configuration is used by the build tool better:

    - FPC exe location is not only for `pasls` (code completion) anymore. Now it affects the compiler used by the CGE build tool too, which makes sense, it allows user to configure "FPC for everything" from VS Code settings. We do this by prepending FPC location to `PATH`.

    - Lazarus location is also known to the build tool. This is useful if you build a project with `build_using_lazbuild="true"` in `CastleEngineManifest.xml`. We do this by prepending Lazarus location to `PATH`.

    - CGE location is passed to the build tool. This means that build tool for sure knows the same CGE location as was set in VS Code. We do this by setting `CASTLE_ENGINE_PATH` environment variable when executing the build tool (regardless if it was or not set for VS Code process).

    Underlying code was refactored, it is also simpler and does less work under the hood. Previous code was sometimes executing build tool / FPC to query for some paths multiple times and/or when it was not necessary.

## [1.2.3]

### Improved

- Better PP configuration option description (see [this thread](https://forum.castle-engine.io/t/i-cant-compile-with-visual-code/1342)).

## [1.2.2]

### Improved

- Show how to learn engine path in README.

## [1.2.1]

### Improved

- Improved auto-detection on macOS (Darwin) (thank you to _Jan Adamec_):

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