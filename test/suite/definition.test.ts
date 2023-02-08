'use strict';

import * as vscode from 'vscode';
import { describe, test, expect } from '@jest/globals';

import { TextmateScopeSelector, TextmateToken } from '../../src';
import { context, tokenServicePromise, documentServicePromise, definitionProviderPromise } from '../util/factory';
import { BASE_CLASS_NAME, SAMPLE_FILE_BASENAMES, getSampleFileUri } from '../util/files';
import { sampler } from '../util/sampler';

describe('src/definition.ts', function() {
	test('TextmateDefinitionProvider class', async function() {
		vscode.window.showInformationMessage('TextmateDefinitionProvider class (src/definition.ts)');

		const documentService = await documentServicePromise;
		const tokenizer = await tokenServicePromise;
		const definitionProvider = await definitionProviderPromise;

		const classReferenceSelector = new TextmateScopeSelector([
			'meta.inherited-class entity.name.type.class',
			'meta.method-call entity.name.type.class'
		]);
		
		function isBaseClassReference(token: TextmateToken) {
			return classReferenceSelector.match(token.scopes) && token.text === BASE_CLASS_NAME;
		}

		interface DefinitionTestResult extends TextmateToken {
			uri: vscode.Uri;
			definition: vscode.Location | void;
		}

		const samples = SAMPLE_FILE_BASENAMES.map(getSampleFileUri, context);
		const results: DefinitionTestResult[][] = [];

		for (let index = 0; index < samples.length; index++) {
			const resource = samples[index];

			const skinnyDocument = await documentService.getDocument(resource);
			const tokens = await tokenizer.fetch(skinnyDocument);

			const document = await vscode.workspace.openTextDocument(resource);
			const activeEditor = await vscode.window.showTextDocument(document);

			const symbols = tokens.filter(isBaseClassReference);

			const page: DefinitionTestResult[] = [];

			// Query each instance of `Animal` in the sample MATLAB file.
			for (const symbol of symbols) {
				const startPosition = new vscode.Position(symbol.line, symbol.startIndex);
				const endPosition = new vscode.Position(symbol.line, symbol.endIndex);

				activeEditor!.selection = new vscode.Selection(startPosition, endPosition);

				const locations = await definitionProvider.provideDefinition(document, startPosition);

				page.push({ ...symbol, uri: resource, definition: locations[0] });
			}
			results.push(page);
		}

		test('provideDefinition(): Promise<[vscode.Location,...vscode.Location[]]>', function() {
			for (let index = 0; index < results.length; index++) {
				const page = results[index];
				const filename = `${SAMPLE_FILE_BASENAMES[index]}.m`;

				for (const entry of page) {
					test(filename, function() {
						expect(entry instanceof Object).toStrictEqual(true);
					});
				}
			}
		});

		test('provideDefinition(): Promise<vscode.Location[]>', async function() {
			for (let index = 0; index < results.length; index++) {
				const page = results[index];
				const basename = SAMPLE_FILE_BASENAMES[index];

				await sampler.call(context, 'definition', basename, page);
			}
		});

		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
	}, 10000);
});
