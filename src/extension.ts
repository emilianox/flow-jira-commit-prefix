import * as vscode from 'vscode';
import { GitExtension, Repository } from './api/git';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('flowJiraCommitPrefix.setMessage', async (uri?) => {
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

const convertStringToRegExp =  (input:string) => {
	const regParts = input.match(/^\/(.*?)\/([gim]*)$/);
	return regParts
		? new RegExp(regParts[1], regParts[2])
		: new RegExp(input);
};

async function prefixCommit(repository: Repository) {
	const branchRegEx = vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.pattern")
		? convertStringToRegExp(vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.pattern") as string)
		:  /^(feature|hotfix|bugfix|release|custom)|((?!([A-Z0-9]{1,10})-?$)[A-Z]{1}[A-Z0-9]+-\d+)/g;

	const replacementEval: RegExp | string = vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.replacementEval")
		?convertStringToRegExp(vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.replacementEval") as string)
		: '';

	const replacementExpr: string = vscode.workspace.getConfiguration().get("flowJiraCommitPrefix.replacementExpr") || '';
	const branchName = repository.state.HEAD && repository.state.HEAD.name || '';

	if (branchRegEx.test(branchName)) {
		const [type, ticketName] = branchName.match(branchRegEx) as RegExpMatchArray;

		const ticket = ticketName.replace(replacementEval, replacementExpr);
		repository.inputBox.value = `${ticket}${repository.inputBox.value}`;
		await vscode.commands.executeCommand('workbench.view.scm');
	} else {
		const message = `Pattern ${branchRegEx.toString()} not found in branch ${branchName}`;
		const editPattern = 'Edit Pattern';
		let result = await vscode.window.showErrorMessage(message, { modal: false }, editPattern);
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

// called when extension is deactivated
export function deactivate() { }
