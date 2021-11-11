import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';
import * as fs from 'fs';
import * as assert from 'assert';
import * as writeJsonFile from 'write-json-file';
import * as loadJsonFile from 'load-json-file';
import { TextmateEngine } from '../../src/textmateEngine';
import { WorkspaceDocumentProvider } from '../../src/workspaceSymbolProvider';
import { TableOfContentsProvider } from '../../src/tableOfContentsProvider';

const engine = new TextmateEngine('matlab', 'source.matlab');
const tableOfContentsProvider = new TableOfContentsProvider(engine);
const workspaceDocumentProvider = new WorkspaceDocumentProvider('matlab');

suite('src/tableOfContentsProvider.ts', function() {
	this.timeout(30000);
	test('TableOfContentsProvider class', async function() {
		console.log(__dirname);
		console.log(path.resolve(__dirname, '../../../../syntaxes/MATLAB-Language-grammar/test/snap'))
		glob(path.resolve(__dirname, '../../../../syntaxes/MATLAB-Language-grammar/test/snap/*.m'), async function(e, files) {
			if (e) {
				throw e;
			}
			for (const file of files) {
				console.log(file);
				const resource = vscode.Uri.file(file);
				const document = await workspaceDocumentProvider.getDocument(resource);
				const p = path.resolve(__dirname, '../data/tableOfContentsProvider', path.basename(file));
				const toc = tableOfContentsProvider.getToc(document);
				if (fs.existsSync(p)) {
					assert.deepEqual(loadJsonFile.sync(p), toc);
				}
				writeJsonFile.sync(p, toc, { indent: '  ' });
			}
		});
	});
});
