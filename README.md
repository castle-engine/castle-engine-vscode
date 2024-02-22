# Castle Game Engine VS Code extension

This extension provides support for [Castle Game Engine](https://castle-engine.io/) in [Visual Studio Code](https://castle-engine.io/vscode).

[Castle Game Engine](https://castle-engine.io/) is a cross-platform (desktop, mobile, console) 3D and 2D game engine.

![Castle Game Engine banner](images/castle_introduction.jpg)

## Instalation

First of all, [download](https://castle-engine.io/download) and [install](https://castle-engine.io/install) the engine.

Then configure the extension by setting the path to the engine.

The extension uses a [Pascal Language Server](https://github.com/castle-engine/pascal-language-server) that adds code completion for Pascal projects. Language server executable `pasls` (or `pasls.exe` on Windows) should already be in `bin` directory of the engine, if you downloaded and installd the engine. The extension tries to automatically guess the appropriate settings, but in special cases it may be necessary to set the path to the [Free Pascal Compiler](https://www.freepascal.org/), its sources and [Lazarus](https://www.lazarus-ide.org/) sources.

## Features

One of the goals of this extension is to simplify the setup as much as possible so we provide a lot of heuristics to automatically configure compilation, debug and other things without need to write json files. To check everything is working open some examples from `examples` directory in your engine instalation.

![VScode with Castle Game Engine extension](images/vscode_with_cge.png)

The extension helps developing Castle Game Engine (CGE) applications:

* Simplifies the setup as much as possible by providing:
   * the ability to automatically configure compilation, build, run and clean the game/application without writting any tasks.json file
   * the ability to automatically configure debug by choosing `cgedebuger` \(it uses [Free Pascal (fpc) Debugger](https://marketplace.visualstudio.com/items?itemName=CNOC.fpdebug) extension underneath\) without writting any launch.json file
   * Pascal Language Server (pasls) automatic configuration system
* code completion (e.g. `Ctrl` + `Space`) thanks to Pascal Language Server
* current file procedure list (`Ctrl` + `Shift` + `O`):
   ![Procedure list screen](images/findfilesymbol.png)
* project procedure list (`Ctrl` + `T`)
* open current project in editor command with shortcut in status bar:
   ![Status bar](images/vscode_status_bar.png)
* compilation type switch button (Debug, Release)
* watch file system changes and recompile only when needed
* status bar buttons to make easier to run the most used functions:
   ![Status bar](images/vscode_status_bar.png)
* searching for the word on which the cursor is positioned in the [Castle Game Engine Api Reference](https://castle-engine.io/apidoc/html/index.html)
* this extension adds two keybindings:
   * `Ctrl` + `F1` - search word in [Castle Game Engine Api Reference](https://castle-engine.io/apidoc/html/index.html)
   * `Ctrl` + `F9` - compile game
   * `Shift` + `F9` - run game
   * `Ctrl` + `F12` - go to declaration
* engine developer mode - currently changes project procedure list to project and engine procedure list (can be turn on in settings)

## Other extensions pulled as dependencies

This extension automatically installs two other extensions:
* [Free Pascal (fpc) Debugger](https://marketplace.visualstudio.com/items?itemName=CNOC.fpdebug) - for Pascal code debuging.
* [Pascal Magic](https://marketplace.visualstudio.com/items?itemName=theangryepicbanana.language-pascal) - for high-quality Pascal highlighting.

## Requirements

Before you start configuring this extension, you should have the [engine](https://castle-engine.io) installed. You can read how to do this in the [manual](https://castle-engine.io/install).

## Patreon

If you like this extension and Castle Game Engine itself, please [support us on Patreon](https://www.patreon.com/castleengine).

## Extension Settings

This extension contributes the following settings:

* `castleGameEngine.enginePath`: Path to the Castle Game Engine location. Leave blank to load from an environment variable (`CASTLE_ENGINE_PATH`).
* `castleGameEngine.pascalLanguageServer.PP`: Path to Free Pascal compiler (e.g. `/usr/local/bin/fpc`). Leave blank to load from an environment variable (`PP`) or to try use autodetection.
* `castleGameEngine.pascalLanguageServer.FPCDIR`: Path to Free Pascal sources (e.g. `/usr/local/share/fpcsrc`). Leave blank to load from an environment variable (`FPCDIR`) or to try use autodetection.
* `castleGameEngine.pascalLanguageServer.LAZARUSDIR`: Path to Lazarus sources (e.g. `/usr/local/share/lazsrc`). Leave blank to load from an environment variable (`LAZARUSDIR`) or to try use autodetection.
* `castleGameEngine.pascalLanguageServer.FPCTARGET`: Target platform (`windows`, `linux`, `darwin`). Leave blank for autodetection.
* `castleGameEngine.pascalLanguageServer.FPCTARGETCPU`: Target CPU (e.g. `x86_64`). Leave blank for autodetection.
* `castleGameEngine.engineDeveloperMode`: Boolean (`true` or `false`). Adds engine symbols to project symbols, to easily jump to engine source code.

## Known Issues

This the first extension release so we lack some features:
* cgedebug/fpDebug doesn't work on MacOS.
* The extension doesn't work in restricted mode.
* The extension doesn't support workspaces with multiple folders, where one of them is CGE project.

## Release Notes

### 0.0.1

Initial release.

---

**Enjoy!**
