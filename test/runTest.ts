import path from 'path';
import { runTests } from 'vscode-test';

async function main() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../../../animals');
		const extensionTestsPath = path.resolve(__dirname, './suite/index');
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				'--disable-extensions',
				'--disable-gpu',
				'--disable-workspace-trust',
				'--no-xshm',
				extensionDevelopmentPath
			]
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
