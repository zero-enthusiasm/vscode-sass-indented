import { TreeDataProvider, TreeItemCollapsibleState, TreeItem, EventEmitter, Event, ExtensionContext } from 'vscode';

import { SassTreeUtility as Utility } from '../tree.utility';
import { SassTreeItem } from '../tree.item';
import { ColorPalletUtility } from './tree.colorPallet.utility';

export class TreeColorPalletProvider implements TreeDataProvider<SassTreeItem> {
  private _onDidChangeTreeData: EventEmitter<SassTreeItem | undefined> = new EventEmitter<SassTreeItem | undefined>();
  readonly onDidChangeTreeData: Event<SassTreeItem | undefined> = this._onDidChangeTreeData.event;

  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SassTreeItem): TreeItem {
    return element;
  }

  getChildren(element?: SassTreeItem): Thenable<SassTreeItem[]> {
    if (element) {
      return Promise.resolve(ColorPalletUtility.getColors(element.subFolder));
    } else {
      return Promise.resolve(Utility.getFolders(this.context, 'pallet'));
    }
  }
}
