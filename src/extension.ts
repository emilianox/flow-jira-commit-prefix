// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitExtension, Repository } from './api/git';

const convertStringToRegExp =  (input:string) => {
	const regParts = input.match(/^\/(.*?)\/([gim]*)$/);
	return regParts
		? new RegExp(regParts[1], regParts[2])
		: new RegExp(input);
};

async function prefixCommit(repository: Repository) {
	const branchRegEx = vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.pattern")
		? convertStringToRegExp(vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.pattern") as string)
		:  /^(feature|hotfix|bugfix|release|custom)|((?:[a-zA-Z0-9]+-?\d+))/g;

	const replacementEval: RegExp | string = vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.replacementEval")
		?convertStringToRegExp(vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.replacementEval") as string)
		: '';

	const separator = vscode.workspace.getConfiguration().get<string>("flowJiraCommitPrefix.separator")
		? vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.separator")
		: ' ';

	const replacementExpr: string = vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.replacementExpr") || '';
	const branchName = repository.state.HEAD && repository.state.HEAD.name || '';


	if (branchRegEx.test(branchName)) {

		const [, type, ticketName] = branchRegEx.exec(branchName) as RegExpMatchArray;

		const ticket = ticketName.replace(replacementEval, replacementExpr);
		if (!repository.inputBox.value.startsWith(ticket)) {
			repository.inputBox.value = `${ticket}${separator}${repository.inputBox.value}`;
		  }
		await vscode.commands.executeCommand('workbench.scm.focus');
		vscode.window.showInformationMessage('flow-jira-commit-prefix: prefix pasted!');

	} else {
		const message = `Pattern ${branchRegEx.toString()} not found in branch ${branchName}`;
		const editPattern = 'Edit Pattern';
		let result = await vscode.window.showErrorMessage(message, editPattern);
		if (result === editPattern) {
			await vscode.commands.executeCommand('settings.action.clearSearchResults');
			await vscode.commands.executeCommand("workbench.action.openSettings", 'flowJiraCommitPrefix');
		}
	}
}

function getGitExtension() {
	const vscodeGit = vscode.extensions.getExtension<GitExtension>('vscode.git');
	const gitExtension = vscodeGit && vscodeGit.exports;
	return gitExtension && gitExtension.getAPI(1);
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "flow-jira-commit-prefix" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('flowJiraCommitPrefix.setMessage', async (uri?) => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		const git = getGitExtension();

		if (!git) {
			vscode.window.showErrorMessage('Unable to load Git Extension');
			return;
		}

		vscode.commands.executeCommand('workbench.view.scm');

		if (uri) {
			const selectedRepository = git.repositories.find(repository => {
				return repository.rootUri.path === uri._rootUri.path;
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
