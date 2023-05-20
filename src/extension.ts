// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

let output: vscode.OutputChannel;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("Copy Hover Type is now active!");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let copyDisposable = vscode.commands.registerCommand(
    "showhoverinoutput.showHoverOutput",
    copyHover
  );
  output = vscode.window.createOutputChannel("Hover info", "markdown");

  context.subscriptions.push(copyDisposable);
}

async function copyHover() {
  const plainText: string | undefined =
    ((await getHoverText()) ?? "") + ((await getDiagnostics()) ?? "");
  if (!plainText) {
    return;
  }
  output.clear();
  output.append(plainText);
  output.show(true);
}

async function getDiagnostics(): Promise<string | undefined> {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  const diags = vscode.languages.getDiagnostics(activeEditor.document.uri);
  const d = diags.filter((diag) =>
    diag.range.intersection(
      new vscode.Range(
        activeEditor.selection.active,
        activeEditor.selection.active
      )
    )
  );
  if (!d.length) {
    return "";
  }
  return (
    "\n\n\n  Error diagnostics:\n\n" + d.map((d) => d?.message).join("\n\n")
  );
}

async function getHoverText(): Promise<string | undefined> {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  const selection = activeEditor.document.getWordRangeAtPosition(
    activeEditor.selection.active
  );
  if (!selection) {
    return;
  }

  const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
    "vscode.executeHoverProvider",
    activeEditor.document.uri,
    activeEditor.selection.active
  );

  return (
    hovers
      ?.flatMap((h) => h.contents)
      .flatMap(getMarkdownValue)
      .join("\n") || ""
  );
}

function getSelection() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  const selection = activeEditor.document.getWordRangeAtPosition(
    activeEditor.selection.active
  );
  if (!selection) {
    return;
  }
  return selection;
}

// this method is called when your extension is deactivated
export function deactivate() {
  output.dispose();
}

function getMarkdownValue(
  content: vscode.MarkedString | vscode.MarkdownString
): string {
  if (typeof content === "string") {
    return content;
  } else if (content instanceof vscode.MarkdownString) {
    return content.value;
  } else {
    const markdown = new vscode.MarkdownString();
    markdown.appendCodeblock(content.value, content.language);
    return markdown.value;
  }
}
