# Developing this VS Code Extension

## CGE notes

- Publishing:
  - Use `vsce`, see [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
  - Update `CHANGELOG.md` with new version number and changes.
  - Comment out `## [Unreleased]` section in `CHANGELOG.md` to `<!-- ## [Unreleased] -->`.
  - Publish using `vsce publish <new-version-number> -m "Publish version %s"`, this also bumps version number in `package.json`, `package-lock.json`, and makes GIT tag -- this is all good.
  - Remember to push tags, `git push --tags`.

- Consult JS API on https://vscode-api.js.org/ .

  E.g. https://vscode-api.js.org/modules/vscode.workspace.html#getWorkspaceFolder .

- `package.json` options: https://code.visualstudio.com/api/references/extension-manifest

- The `console.log` output from extension is visible in the _"Extension Host"_ category in JS console (_"Toggle Developer Console"_ in VS Code to see it). This is the easiest way to debug the extension.

- Run auto-tests by `npm run test` (see https://code.visualstudio.com/api/working-with-extensions/testing-extension ).

TODO:

- Convert to TypeScript. Declare types explicitly. Have explicit `private` and `public`, instead of `_xxx` for private.
- Use consistent indentation by 4 spaces. Right now it's a mix of 2 and 4 spaces and tabs.

### Notes about JSON files (because comments inside them are in general not allowed...)

- `package.json`: has `"onLanguage:pascal"` to activate when the user opens a Pascal file, even if not in CGE project. This way we can provide code completion using our LSP server, even if not inside CGE project.

## Run some checks

See `scripts` in `package.json`.

```
npm run compile
npm run lint
npm run test
```

# Helpful information from the original README.md

## What's in the folder

* This folder contains all of the files necessary for your extension.
* `package.json` - this is the manifest file in which you declare your extension and command.
  * The sample plugin registers a command and defines its title and command name. With this information VS Code can show the command in the command palette. It doesn’t yet need to load the plugin.
* `extension.ts` - this is the main file where you will provide the implementation of your command.
  * The file exports one function, `activate`, which is called the very first time your extension is activated (in this case by executing the command). Inside the `activate` function we call `registerCommand`.
  * We pass the function containing the implementation of the command as the second parameter to `registerCommand`.

## Get up and running straight away

* Press `F5` to open a new window with your extension loaded.
* Run your command from the command palette by pressing (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and typing `Hello World`.
* Set breakpoints in your code inside `extension.ts` to debug your extension.
* Find output from your extension in the debug console.

## Make changes

* You can relaunch the extension from the debug toolbar after changing code in `extension.ts`.
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

## Explore the API

* You can open the full set of our API when you open the file `node_modules/@types/vscode/index.d.ts`.

## Run tests

* Open the debug viewlet (`Ctrl+Shift+D` or `Cmd+Shift+D` on Mac) and from the launch configuration dropdown pick `Extension Tests`.
* Press `F5` to run the tests in a new window with your extension loaded.
* See the output of the test result in the debug console.
* Make changes to `src/test/suite/extension.test.js` or create new test files inside the `test/suite` folder.
  * The provided test runner will only consider files matching the name pattern `**.test.ts`.
  * You can create folders inside the `test` folder to structure your tests any way you want.

## Go further

 * [Follow UX guidelines](https://code.visualstudio.com/api/ux-guidelines/overview) to create extensions that seamlessly integrate with VS Code's native interface and patterns.
 * [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) on the VS Code extension marketplace.
 * Automate builds by setting up [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration).

