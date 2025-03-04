'use strict';

import * as vscode from 'vscode';
import { strictEqual } from '../../util/assert';

import { isWebRuntime } from '../../util/runtime';
import { tokenServicePromise, documentServicePromise, definitionProviderPromise } from '../../util/factory';
import { BASENAMES, getSampleFileUri } from '../../util/files';
import { runSamplePass } from '../../util/bench';

import type { TextmateToken } from '../../../src/services/tokenizer';
import { TextmateScopeSelector } from '../../util/common';

suite('test/suite/definition.test.ts - TextmateDefinitionProvider class (src/definition.ts)', function() {
	this.timeout(10000);

	test('TextmateDefinitionProvider.provideDefinition(): Promise<[vscode.Location,...vscode.Location[]]>', async function() {
		// Early exit + pass if we are in web runtime.
		if (isWebRuntime) {
			this.skip();
		}

		void vscode.window.showInformationMessage('TextmateDefinitionProvider class (src/definition.ts)');
		const results = await definitionProviderResult();

		for (let index = 0; index < results.length; index++) {
			const page = results[index];
			const filename = `${BASENAMES[globalThis.languageId][index]}.m`;

			for (const entry of page) {
				strictEqual(entry.definition instanceof Object, true, filename);
			}
		}
	});

	test('TextmateDefinitionProvider.provideDefinition(): Promise<vscode.Location[]>', async function() {
		// Early exit + pass if we are in web runtime.
		if (isWebRuntime) {
			this.skip();
		}

		const results = await definitionProviderResult();

		let error: TypeError | void = void 0;
		for (let index = 0; index < results.length; index++) {
			const page = results[index];
			const basename = BASENAMES[globalThis.languageId][index];

			try {
				await runSamplePass('definition', basename, page);
			} catch (e) {
				error = typeof error !== 'undefined' ? error : e as Error;
			}
		}
		if (error) {
			throw error;
		}
	});

	this.afterAll(async function() {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
	});
});

async function definitionProviderResult() {
	const documentService = await documentServicePromise;
	const tokenizer = await tokenServicePromise;
	const definitionProvider = await definitionProviderPromise;

	if (BASENAMES[globalThis.languageId].length === 1) {
		return [];
	}

	const classReferenceSelector = new TextmateScopeSelector([
		'meta.inherited-class entity.name.type.class',
		'meta.method-call entity.name.type.class'
	]);

	function isBaseClassReference(token: TextmateToken) {
		return classReferenceSelector.match(token.scopes) && token.text === BASENAMES.matlab[0];
	}

	interface DefinitionTestResult extends TextmateToken {
		uri: vscode.Uri;
		definition: vscode.Location | void;
	}

	const samples = BASENAMES[globalThis.languageId].map(getSampleFileUri);
	const results: DefinitionTestResult[][] = [];

	for (const resource of samples) {
		const document = await documentService.getDocument(resource);
		const tokens = await tokenizer.fetch(document);

		const activeEditor = await vscode.window.showTextDocument(document);

		const symbols = tokens.filter(isBaseClassReference);

		const page: DefinitionTestResult[] = [];

		// Query each instance of the base class name (`Animal`) in the sample MATLAB file.
		for (const symbol of symbols) {
			const startPosition = new vscode.Position(symbol.line, symbol.startIndex);
			const endPosition = new vscode.Position(symbol.line, symbol.endIndex);

			activeEditor.selection = new vscode.Selection(startPosition, endPosition);

			const locations = await definitionProvider.provideDefinition(document, startPosition);

			page.push({ ...symbol, definition: locations[0], uri: resource });
		}
		results.push(page);
	}

	return results;
}
