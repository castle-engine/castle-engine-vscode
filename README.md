# Castle Game Engine VS Code extension

This extension provides support for [Castle Game Engine](https://castle-engine.io/) in [Visual Studio Code](https://castle-engine.io/vscode).

[Castle Game Engine](https://castle-engine.io/) is a cross-platform (desktop, mobile, console) 3D and 2D game engine.

![Castle Game Engine banner](images/castle_introduction.jpg)

## Installation

First of all, [download](https://castle-engine.io/download) and [install](https://castle-engine.io/install) the engine.

Then configure the extension by setting the path to the engine (_"Engine Path"_). All the other settings should be detected automatically, though you may want to customize them in special cases. E.g. customize path to the [Free Pascal Compiler](https://www.freepascal.org/) and its sources if you use a different FPC than bundled with the engine.

## What to put in "Engine Path"?

If you are unsure what is the correct _"Engine Path"_ but you can run _Castle Game Engine_ editor: Just take a look at the engine path in editor _"Preferences -> General"_. See the screenshot below, that also happens to show the default path after using the default installer on Windows:

![VScode with Castle Game Engine extension](images/engine_path.png)

## Features

We want to simplify working with _Castle Game Engine_ projects in _Visual Studio Code_ as much as possible. All of the extension features are enabled when you open a directory with a _Castle Game Engine_ project (`CastleEngineManifest.xml` file). Some of the extension features (like Pascal code completion) are available in any Pascal file, even if it's not part of a _Castle Game Engine_ project.

To check that everything works, open any example from the `examples` subdirectory of your engine installation.

![VScode with Castle Game Engine extension](images/vscode_with_cge.png)

We recognize Castle Game Engine (CGE) projects and provide ready commands to:

- Compile.
- Run.
- Open CGE editor.
- Switch build mode (debug / release).
- Debug (use _"Debug Castle Game Engine Project"_ option, see below for more detailed instructions).
- There is no need to manually write config files like `tasks.json` or `launch.json` to make above working.
- The most common commands are available on status bar:
   ![Status bar](images/vscode_status_bar.png)

We provide Pascal code highlighting and completion:

- Pascal Language Server (`pasls`) that is installed along with [Castle Game Engine](https://castle-engine.io/) is automatically used for code completion.
   - Use _Ctrl + Space_ to complete identifiers, members (properties, methods).
   - Use _Ctrl + Shift + O_ to jump to symbol definition in current file.
   ![Procedure list screen](images/findfilesymbol.png)
   - Use _Ctrl + T_ to list all symbols in the project.
   - Jump to identifiers (_Ctrl + Click_).
   - The extension uses a [Pascal Language Server](https://github.com/castle-engine/pascal-language-server) that adds code completion for Pascal projects. Language server executable `pasls` (or `pasls.exe` on Windows) should already be in `bin` directory of the _Castle Game Engine_.
   - Include files are supported perfectly too. Just make sure to use `{%MainUnit xxx.pas}` at the top of each include file.
   - The provided Pascal code completion works for any Pascal file -- whether it's part of a _Castle Game Engine_ project or not.

- [Pascal Magic](https://marketplace.visualstudio.com/items?itemName=theangryepicbanana.language-pascal) is used for syntax highlighting.

Other features:

* We watch for file system changes and recompile only when needed.

* We can searching for the word on which the cursor is positioned in the [Castle Game Engine API Reference](https://castle-engine.io/apidoc/html/index.html).

* We add keybindings consistent (to some extent) with CGE editor and typical Pascal IDEs, like Lazarus or Delphi. These are:
   * `Ctrl` + `F9` - compile game
   * `Ctrl` + `F1` - search word in [Castle Game Engine Api Reference](https://castle-engine.io/apidoc/html/index.html)
   * `Shift` + `F9` - run game
   * `Ctrl` + `F12` - go to declaration

* Additional "Engine Developer Mode" - to easily jump to engine source code using _Ctrl + T_ (will add engine symbols to project symbols).

* Works on Windows, Linux and macOS.

    macOS note: debugger on macOS is not yet functional.

## Debugging

_Note: This section is exclusive to VS Code, and not to forks using OpenVSX, like VS Codium. Reason: FpDebug is not available on OpenVSX (yet). If you use OpenVSX, you can still setup debugging following [Alternative debuggers like GDB setup](https://castle-engine.io/vscode#_debugging)._

Usage:

- Switch to the _"Run And Debug"_ panel.

- Use the _"Run And Debug"_ button (if this button is shown in the panel).
    - Choose _"More Debug Castle Game Engine Project options..."_.
    - Choose _"Debug Castle Game Engine application (`application name`)"_.

- Or use the combo box with debugger choices, if that's shown in the panel.
    - Pick _"Debug Castle Game Engine Project"_ there.

- Open some Pascal file (any unit `.pas` or main program like `.dpr` or `.lpr`) if options above don't show the _"Debug Castle Game Engine Project"_ option.

Under the hood, we use [Free Pascal (FPC) Debugger](https://marketplace.visualstudio.com/itemsitemName=CNOC.fpdebug) for debugging. The available platforms are limited to:

- Windows/i386
- Windows/x86_64
- Linux/x86_64

We will automatically rebuild the project if something changed before running the debug session.

## Other extensions pulled as dependencies

This extension automatically installs two other extensions:
* [Free Pascal (fpc) Debugger](https://marketplace.visualstudio.com/items?itemName=CNOC.fpdebug) - for Pascal code debugging. (VS Code only, not OpenVSX).
* [Pascal Magic](https://marketplace.visualstudio.com/items?itemName=theangryepicbanana.language-pascal) - for high-quality Pascal highlighting.

## Requirements

Before you start configuring this extension, you should have the [engine](https://castle-engine.io) installed. Follow the [installation instructions](https://castle-engine.io/install).

## Support us

If you like this extension and Castle Game Engine itself, please [support us on Patreon](https://www.patreon.com/castleengine).

## Extension Settings

This extension contributes the following settings:

* `castleEngine.enginePath`: Path where _Castle Game Engine_ is installed. Leave blank to auto-detect (looks at the environment variable `CASTLE_ENGINE_PATH`).
* `castleEngine.pascalLanguageServer.PP`: Full filename of the _Free Pascal Compiler_ executable. This should include the file name at the end, like `fpc.exe` (Windows) or `fpc` (Unix without FpcUpDeluxe) or `fpc.sh` (Unix with FpcUpDeluxe). Leave blank to auto-detect (will detect e.g. FPC bundled with CGE).
* `castleEngine.pascalLanguageServer.FPCDIR`: Path to _Free Pascal Compiler_ sources, used for code completion. Leave Leave blank to auto-detect (will detect e.g. FPC bundled with CGE, will also look at environment variable `FPCDIR`).
* `castleEngine.pascalLanguageServer.LAZARUSDIR`: Path to _Lazarus_ sources. Leave blank to auto-detect (will lok at environment variable `LAZARUSDIR`). Note that having Lazarus (and setting this) is not necessary for Castle Game Engine. This is only used for completion in code using LCL units.
* `castleEngine.pascalLanguageServer.FPCTARGET`: Target OS (operating system; e.g. `win64`, `linux`, `darwin`). Leave blank to auto-detect.
* `castleEngine.pascalLanguageServer.FPCTARGETCPU`: Target CPU (processor; e.g. `x86_64`). Leave blank to auto-detect.
* `castleEngine.engineDeveloperMode`: Boolean (`true` or `false`). Adds engine symbols to project symbols, to easily jump from project to engine source code.

## Known Issues

This the first extension release so we lack some features:
* `castleDebug`/`fpDebug` doesn't work on macOS.
* The extension doesn't work in _restricted_ mode. You need to _trust_ the folder.
* The extension supports multi-root workspaces, but in rather simple way: if you have multi-root workspace, it will actually work in first folder that has `CastleEngineManifest.xml`. This is not ideal if you have multi-root workspace with multiple folders having `CastleEngineManifest.xml`. Should we let user choose? Should we act on all matching folders? See what others are doing this situation.
* Show documentation (generated by PasDoc) as a popup in VS Code.

**Enjoy!**

- [Support the development of engine and this extension](https://www.patreon.com/castleengine)
- [Ask for support](https://castle-engine.io/talk.php)
- [Report a bug](https://github.com/castle-engine/castle-engine-vscode/issues)