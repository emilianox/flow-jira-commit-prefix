import * as vscode from 'vscode';


export const convertStringToRegExp =  (input:string) => {
	const regParts = input.match(/^\/(.*?)\/([gim]*)$/);
	return regParts
		? new RegExp(regParts[1], regParts[2])
		: new RegExp(input);
};

export const defaultBranchRegEx = /^(?:feature|hotfix|bugfix|release|custom)\/([a-zA-Z0-9]+-?\d+)/;
export const defaultReplacementEval = '';
export const defaultSeparator = ' ';