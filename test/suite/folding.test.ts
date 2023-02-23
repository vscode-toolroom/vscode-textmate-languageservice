'use strict';

import * as vscode from 'vscode';

import { extensionContext, foldingRangeProviderPromise } from '../util/factory';
import { SAMPLE_FILE_BASENAMES, getSampleFileUri } from '../util/files';
import { pass } from '../util/bench';

suite('test/suite/folding.test.ts - TextmateFoldingRangeProvider class (src/folding.ts)', async function() {
	this.timeout(10000);

	test('TextmateFoldingRangeProvider.provideFoldingRanges(): Promise<vscode.FoldingRange[]>', async function() {
		vscode.window.showInformationMessage('TextmateFoldingRangeProvider class (src/folding.ts)');
		const { results, samples } = await foldingRangeProviderResult();

		let error: TypeError | void;
		for (let index = 0; index < samples.length; index++) {
			const basename = SAMPLE_FILE_BASENAMES[index];
			const folds = results[index];

			try {
				await pass(extensionContext, 'folding', basename, folds);
			} catch (e) {
				error = error || e as TypeError;
			}
		}
		if (error) {
			throw error;
		}
	});

	await vscode.commands.executeCommand('workbench.action.closeAllEditors');
});

async function foldingRangeProviderResult() {
	const foldingRangeProvider = await foldingRangeProviderPromise;

	const foldingContext = {};
	const cancelToken = new vscode.CancellationTokenSource().token;

	const samples = SAMPLE_FILE_BASENAMES.map(getSampleFileUri, extensionContext);
	const results: vscode.FoldingRange[][] = [];

	for (let index = 0; index < samples.length; index++) {
		const resource = samples[index];
		const document = await vscode.workspace.openTextDocument(resource);

		const folds = await foldingRangeProvider.provideFoldingRanges(document, foldingContext, cancelToken);

		results.push(folds);
	}

	return { results, samples };
}
