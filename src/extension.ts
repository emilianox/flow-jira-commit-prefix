// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitExtension, Repository } from './api/git';
import { convertStringToRegExp } from './utils';

const outputChannel = vscode.window.createOutputChannel('Flow Jira Commit Prefix');
outputChannel.appendLine('Flow Jira Commit Prefix');

async function prefixCommit(repository: Repository) {
	const branchRegEx =  convertStringToRegExp(vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.pattern") as string)
	const replacementExpr = vscode.workspace.getConfiguration().get<string>("flowJiraCommitPrefix.replacementExpr") as string;
	const replacementEval: RegExp | string = convertStringToRegExp(vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.replacementEval") as string)
	const separator = vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.separator");
	outputChannel.appendLine(`branchRegEx: ${branchRegEx}`);
	outputChannel.appendLine(`replacementExpr: ${replacementExpr}`);
	outputChannel.appendLine(`replacementEval: ${replacementEval}`);
	outputChannel.appendLine(`separator: ${separator}`);

	const branchName = repository.state.HEAD && repository.state.HEAD.name || '';
	outputChannel.appendLine(`branchName: ${branchName}`);

	outputChannel.appendLine(`branchRegEx.test(branchName): ${branchRegEx.test(branchName)}`);
	if (branchRegEx.test(branchName)) {
		const [allpattern, ticketName] = branchRegEx.exec(branchName) as RegExpMatchArray;
		outputChannel.appendLine(`ticketName: ${ticketName}`);

		const ticket = ticketName.replace(replacementEval, replacementExpr);
		outputChannel.appendLine(`ticket: ${ticket}`);

		outputChannel.appendLine(`repository.inputBox.value: ${repository.inputBox.value}`);
		if (!repository.inputBox.value.startsWith(ticket)) {
			outputChannel.appendLine(`repository.inputBox.value.startsWith ticket`);
			repository.inputBox.value = `${ticket}${separator}${repository.inputBox.value}`;
		  }
		await vscode.commands.executeCommand('workbench.scm.focus');
		outputChannel.appendLine(`workbench.scm.focus executed`);
		vscode.window.showInformationMessage('flow-jira-commit-prefix: prefix pasted!');

	} else {
		const message = `Pattern ${branchRegEx.toString()} not found in branch ${branchName}`;
		outputChannel.appendLine(message);
		const editPattern = 'Edit Pattern';
		outputChannel.appendLine(`showErrorMessage`);
		let result = await vscode.window.showErrorMessage(message, editPattern);
		outputChannel.appendLine(`showErrorMessage result: ${result}`);
		if (result === editPattern) {
			await vscode.commands.executeCommand('settings.action.clearSearchResults');
			outputChannel.appendLine(`settings.action.clearSearchResults executed`);
			await vscode.commands.executeCommand("workbench.action.openSettings", 'flowJiraCommitPrefix');
			outputChannel.appendLine(`workbench.action.openSettings executed`);
		}
	}
}

function getGitExtension() {
	const vscodeGit = vscode.extensions.getExtension<GitExtension>('vscode.git');
	outputChannel.appendLine(`vscodeGit: ${vscodeGit}`);
	const gitExtension = vscodeGit && vscodeGit.exports;
	outputChannel.appendLine(`gitExtension: ${gitExtension}`);

	return gitExtension && gitExtension.getAPI(1);
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	outputChannel.appendLine('Flow-jira-commit-prefix is active');
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('flowJiraCommitPrefix.setMessage', async (uri?) => {
		// The code you place here will be executed every time your command is executed

		outputChannel.appendLine(`flowJiraCommitPrefix.setMessage uri: ${uri}`);


		const git = getGitExtension();

		if (!git) {
			vscode.window.showErrorMessage('Unable to load Git Extension');
			outputChannel.appendLine(`Unable to load Git Extension`);
			return;
		}

		vscode.commands.executeCommand('workbench.view.scm');
		outputChannel.appendLine(`workbench.view.scm executed`);

		if (uri) {
			outputChannel.appendLine(`git.repositories: ${git.repositories}`);
			const selectedRepository = git.repositories.find(repository => {
				outputChannel.appendLine(`repository: ${repository}`);
				outputChannel.appendLine(`repository.rootUri: ${repository.rootUri}`);
				outputChannel.appendLine(`repository.rootUri.path: ${repository.rootUri.path}`);
				return repository.rootUri.path === uri.rootUri.path;
			});

			if (selectedRepository) {
				await prefixCommit(selectedRepository);
			}
		} else {
			for (let repo of git.repositories) {
				await prefixCommit(repo);
			}
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
