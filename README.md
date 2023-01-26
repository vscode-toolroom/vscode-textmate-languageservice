# `vscode-textmate-languageservice`

> **This package is now superseded by `vscode-anycode`, a quicker LSP which leverages the `tree-sitter` symbolic-expression syntax parser.**

> I've chosen not to deprecate it but to mark it as 1.0.0 and recommend you leverage `tree-sitter`. It's the Holy Grail of source code LSP! It's the one maintainable oolution & has faster retokenization ... whereas this package depends on a [well-written Textmate grammar][macromates-scope-selector-spec] and is a band aid.

> If there is [native `vscode` support for the language][vscode-known-language-ids], find a Tree-sitter syntax online then suggest it in an [Anycode issue][vscode-known-language-ids].
> Otherwise, please open an issue on the [community-maintained Treesitter syntax highlighter extension][github-epeshkov-syntax-highlighter] and someone might deal with it.

Generate language service providers driven entirely by your Textmate grammar and one configuration file.

<p align="center"><img src="https://gitlab.com/SNDST00M/vscode-textmate-languageservice/-/raw/v1.0.0-rc-1/assets/demo-outline.png"></p>

In order to be supported by this module, the Textmate grammar must include the following features:
- meta declaration scopes for block level declarations
- variable assignment scopes differentiated between `multiple` and `single`
- granular keyword control tokens with `begin` and `end` scopes

## Installation

```console
npm install vscode-textmate-languageservice
```

## Configuration

Create a JSON file named `textmate-configuration.json` in the extension directory. The file accepts comments and trailing commas.

Textmate configuration fields:

- **`assignment`** - optional (`object`)<br/>
  Collection of Textmate scope selectors for variable assignment scopes when including variable symbols:<br/>
  **Properties:**
  - `separator`: Token to separate multiple assignments (`string`)
  - `single`: Token to match single variable assignment. (`string`)
  - `multiple`: Token to match multiple variable assignment. (`string`)
- **`declarations`** - optional (`array`)<br/>
  List of Textmate scope selectors for declaration token scopes.
- **`dedentation`** - optional (`array`)<br/>
  List of Textmate tokens for dedented code block declarations (e.g. `ELSE`, `ELSEIF`).<br/>
  Tokens still need to be listed in `indentation` with the decrementing value `-1`.
- **`exclude`** (`string`)
  VSC glob pattern for files to exclude from workspace symbol search.
- **`indentation`** - optional (`object`)<br/>
  Indentation level offset for Textmate token types (used to implement folding).
- **`punctuation`** - optional (`object`)<br/>
  Collection of punctuation tokens with a significant effect on syntax providers.
  **Properties:**
  - `continuation`: Token scope selector for line continuation (to use in region matching). (`string`)
- **`markers`** - optional (`object`)<br/>
  Stringified regular expression patterns for folding region comments.
  - `start`: Escaped regular expression for start region marker. (`string`)
  - `end`: Escaped regular expression for end region marker. (`string`)
  **Properties:**
- **`symbols`** - optional (`object`)<br/>
  Map of document symbol tokens to their symbol kind ([`vscode.SymbolKind`][vscode-api-symbolkind] value).

### Configuration examples

Template for `textmate-configuration.json` file:

```jsonc
{
  "assignment": {
    "single": "",
    "multiple": "",
    "separator": ""
  },
  "declarations": [],
  "dedentation": [
    "keyword.control.elseif.custom",
    "keyword.control.else.custom"
  ],
  "exclude": "**/{.modules,.includes}/**",
  "indentation": {
    "punctuation.definition.comment.begin.custom": 1,
    "punctuation.definition.comment.end.custom": -1,
    "keyword.control.begin.custom": 1,
    "keyword.control.end.custom": -1
  },
  "punctuation": {
    "continuation": "punctuation.separator.continuation.line.custom"
  },
  "markers": {
    "start": "^\\s*#?region\\b",
    "end": "^\\s*#?end\\s?region\\b"
  },
  "symbols": {
    "keyword.control.custom": 2,
    "entity.name.function.custom": 11
  }
}
```

An example configuration file that targets Lua:

```jsonc
{
  "assignment": {
    "single": "meta.assignment.variable.single.lua",
    "multiple": "meta.assignment.variable.group.lua",
    "separator": "punctuation.separator.comma.lua"
  },
  "declarations": [
    "meta.declaration.lua entity.name",
    "meta.assignment.definition.lua entity.name"
  ],
  "dedentation": [
    "keyword.control.elseif.lua",
    "keyword.control.else.lua"
  ],
  "exclude": "**/{.luarocks,lua_modules}/**",
  "indentation": {
    "punctuation.definition.comment.begin.lua": 1,
    "punctuation.definition.comment.end.lua": -1,
    "keyword.control.begin.lua": 1,
    "keyword.control.end.lua": -1
  },
  "markers": {
    "start": "^\\s*#?region\\b",
    "end": "^\\s*#?end\\s?region\\b"
  },
  "symbols": {
    "keyword.control.lua": 2,
    "entity.name.function.lua": 11
  }
}
```

## Usage

```typescript
import LSP from 'vscode-textmate-languageservice';

export async function activate(context: vscode.ExtensionContext) {
	const selector: vscode.DocumentSelector = { language: 'custom', scheme: 'file' };

	const lsp = new LSP('custom', context);

	const foldingProvider = await lsp.createFoldingRangeProvider();
	const documentSymbolProvider = await lsp.createDocumentSymbolProvider();
	const workspaceSymbolProvider = await lsp.createWorkspaceSymbolProvider();
	const definitionProvider = await lsp.createDefinitionProvider();

	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(selector, documentSymbolProvider));
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(selector, foldingProvider));
	context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(workspaceSymbolProvider));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider(['custom'], peekDefinitionProvider));
}
```

<!-- `vscode-textmate-languageservice` -->
[macromates-scope-selector-spec]: https://macromates.com/manual/en/language_grammars#naming_conventions
[vscode-known-language-ids]: https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
[github-vscode-anycode]: https://github.com/microsoft/vscode-anycode/issues
[github-epeshkov-syntax-highlighter]: https://github.com/EvgeniyPeshkov/syntax-highlighter
<!-- Configuration -->
[vscode-extension-manifest]: https://code.visualstudio.com/api/references/extension-manifest
[vscode-api-symbolkind]: https://code.visualstudio.com/api/references/vscode-api#SymbolKind
