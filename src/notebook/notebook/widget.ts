// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  KernelMessage
} from 'jupyter-js-services';

import {
  find
} from 'phosphor/lib/algorithm/searching';

import {
  sendMessage, Message
} from 'phosphor/lib/core/messaging';

import {
  AttachedProperty
} from 'phosphor/lib/core/properties';

import {
  defineSignal, ISignal
} from 'phosphor/lib/core/signaling';

import {
  scrollIntoViewIfNeeded
} from 'phosphor/lib/dom/query';

import {
  PanelLayout
} from 'phosphor/lib/ui/panel';

import {
  Widget, WidgetMessage
} from 'phosphor/lib/ui/widget';

import {
  IChangedArgs
} from '../../common/interfaces';

import {
  IObservableList, IListChangedArgs
} from '../../common/observablelist';

import {
  InspectionHandler
} from '../../inspector';

import {
  RenderMime
} from '../../rendermime';

import {
  ICellModel, BaseCellWidget, MarkdownCellModel,
  CodeCellWidget, MarkdownCellWidget,
  CodeCellModel, RawCellWidget, RawCellModel,
  ICodeCellModel, IMarkdownCellModel, IRawCellModel
} from '../cells';

import {
  mimetypeForLanguage
} from '../common/mimetype';

import {
  EdgeLocation
} from '../cells/editor';

import {
  INotebookModel
} from './model';

import {
  nbformat
} from './nbformat';


/**
 * The class name added to notebook widgets.
 */
const NB_CLASS = 'jp-Notebook';

/**
 * The class name added to notebook widget cells.
 */
const NB_CELL_CLASS = 'jp-Notebook-cell';

/**
 * The class name added to a notebook in edit mode.
 */
const EDIT_CLASS = 'jp-mod-editMode';

/**
 * The class name added to a notebook in command mode.
 */
const COMMAND_CLASS = 'jp-mod-commandMode';

/**
 * The class name added to the active cell.
 */
const ACTIVE_CLASS = 'jp-mod-active';

/**
 * The class name added to selected cells.
 */
const SELECTED_CLASS = 'jp-mod-selected';

/**
 * The class name added to an active cell when there are other selected cells.
 */
const OTHER_SELECTED_CLASS = 'jp-mod-multiSelected';

/**
 * The class name added to unconfined images.
 */
const UNCONFINED_CLASS = 'jp-mod-unconfined';


/**
 * The interactivity modes for the notebook.
 */
export
type NotebookMode = 'command' | 'edit';


/**
 * A widget which renders static non-interactive notebooks.
 *
 * #### Notes
 * The widget model must be set separately and can be changed
 * at any time.  Consumers of the widget must account for a
 * `null` model, and may want to listen to the `modelChanged`
 * signal.
 */
export
class StaticNotebook extends Widget {
  /**
   * Construct a notebook widget.
   */
  constructor(options: StaticNotebook.IOptions) {
    super();
    this.addClass(NB_CLASS);
    this._rendermime = options.rendermime;
    this.layout = new Private.NotebookPanelLayout();
    this._renderer = options.renderer;
  }

  /**
   * A signal emitted when the model of the notebook changes.
   */
  modelChanged: ISignal<StaticNotebook, void>;

  /**
   * A signal emitted when the model content changes.
   *
   * #### Notes
   * This is a convenience signal that follows the current model.
   */
  modelContentChanged: ISignal<StaticNotebook, void>;

  /**
   * The model for the widget.
   */
  get model(): INotebookModel {
    return this._model;
  }
  set model(newValue: INotebookModel) {
    newValue = newValue || null;
    if (this._model === newValue) {
      return;
    }
    let oldValue = this._model;
    this._model = newValue;
    // Trigger private, protected, and public changes.
    this._onModelChanged(oldValue, newValue);
    this.onModelChanged(oldValue, newValue);
    this.modelChanged.emit(void 0);
  }

  /**
   * Get the rendermime instance used by the widget.
   *
   * #### Notes
   * This is a read-only property.
   */
  get rendermime(): RenderMime {
    return this._rendermime;
  }

  /**
   * Get the renderer used by the widget.
   *
   * #### Notes
   * This is a read-only property.
   */
  get renderer(): StaticNotebook.IRenderer {
    return this._renderer;
  }

  /**
   * Get the mimetype for code cells.
   *
   * #### Notes
   * This is a read-only property.
   */
  get codeMimetype(): string {
    return this._mimetype;
  }

  /**
   * Get the child widget at the specified index.
   */
  childAt(index: number): BaseCellWidget {
    let layout = this.layout as PanelLayout;
    return layout.widgets.at(index) as BaseCellWidget;
  }

  /**
   * Get the number of child widgets.
   */
  childCount(): number {
    let layout = this.layout as PanelLayout;
    return layout.widgets.length;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose() {
    // Do nothing if already disposed.
    if (this.isDisposed) {
      return;
    }
    this._model = null;
    this._rendermime = null;
    this._renderer = null;
    super.dispose();
  }

  /**
   * Handle a new model.
   *
   * #### Notes
   * This method is called after the model change has been handled
   * internally and before the `modelChanged` signal is emitted.
   * The default implementation is a no-op.
   */
  protected onModelChanged(oldValue: INotebookModel, newValue: INotebookModel): void {
    // No-op.
  }

  /**
   * Handle changes to the notebook model content.
   *
   * #### Notes
   * The default implementation emits the `modelContentChanged` signal.
   */
  protected onModelContentChanged(model: INotebookModel, args: void): void {
    this.modelContentChanged.emit(void 0);
  }

  /**
   * Handle changes to the notebook model metadata.
   *
   * #### Notes
   * The default implementation updates the mimetypes of the code cells
   * when the `language_info` metadata changes.
   */
  protected onMetadataChanged(model: INotebookModel, args: IChangedArgs<any>): void {
    switch (args.name) {
    case 'language_info':
      this._mimetype = this._renderer.getCodeMimetype(model);
      this._updateCells();
      break;
    default:
      break;
    }
  }

  /**
   * Handle a cell being inserted.
   *
   * The default implementation is a no-op
   */
  protected onCellInserted(index: number, cell: BaseCellWidget): void {
    // This is a no-op.
  }

  /**
   * Handle a cell being moved.
   *
   * The default implementation is a no-op
   */
  protected onCellMoved(fromIndex: number, toIndex: number): void {
    // This is a no-op.
  }

  /**
   * Handle a cell being removed.
   *
   * The default implementation is a no-op
   */
  protected onCellRemoved(cell: BaseCellWidget): void {
    // This is a no-op.
  }

  /**
   * Handle a new model on the widget.
   */
  private _onModelChanged(oldValue: INotebookModel, newValue: INotebookModel): void {
    let layout = this.layout as PanelLayout;
    if (oldValue) {
      oldValue.cells.changed.disconnect(this._onCellsChanged, this);
      oldValue.metadataChanged.disconnect(this.onMetadataChanged, this);
      oldValue.contentChanged.disconnect(this.onModelContentChanged, this);
      // TODO: reuse existing cell widgets if possible.
      for (let i = 0; i < layout.widgets.length; i++) {
        this._removeCell(0);
      }
    }
    if (!newValue) {
      this._mimetype = 'text/plain';
      return;
    }
    this._mimetype = this._renderer.getCodeMimetype(newValue);
    let cells = newValue.cells;
    for (let i = 0; i < cells.length; i++) {
      this._insertCell(i, cells.get(i));
    }
    cells.changed.connect(this._onCellsChanged, this);
    newValue.contentChanged.connect(this.onModelContentChanged, this);
    newValue.metadataChanged.connect(this.onMetadataChanged, this);
  }

  /**
   * Handle a change cells event.
   */
  private _onCellsChanged(sender: IObservableList<ICellModel>, args: IListChangedArgs<ICellModel>) {
    switch (args.type) {
    case 'add':
      this._insertCell(args.newIndex, args.newValue as ICellModel);
      break;
    case 'move':
      this._moveCell(args.newIndex, args.oldIndex);
      break;
    case 'remove':
      this._removeCell(args.oldIndex);
      break;
    case 'replace':
      // TODO: reuse existing cell widgets if possible.
      let oldValues = args.oldValue as ICellModel[];
      for (let i = 0; i < oldValues.length; i++) {
        this._removeCell(args.oldIndex);
      }
      let newValues = args.newValue as ICellModel[];
      for (let i = newValues.length; i > 0; i--) {
        this._insertCell(args.newIndex, newValues[i - 1]);
      }
      break;
    case 'set':
      // TODO: reuse existing widget if possible.
      this._removeCell(args.newIndex);
      this._insertCell(args.newIndex, args.newValue as ICellModel);
      break;
    default:
      return;
    }
  }

  /**
   * Create a cell widget and insert into the notebook.
   */
  private _insertCell(index: number, cell: ICellModel): void {
    let widget: BaseCellWidget;
    switch (cell.type) {
    case 'code':
      let codeFactory = this._renderer.createCodeCell;
      widget = codeFactory(cell as CodeCellModel, this._rendermime);
      break;
    case 'markdown':
      let mdFactory = this._renderer.createMarkdownCell;
      widget = mdFactory(cell as MarkdownCellModel, this._rendermime);
      break;
    default:
      widget = this._renderer.createRawCell(cell as RawCellModel);
    }
    widget.addClass(NB_CELL_CLASS);
    let layout = this.layout as PanelLayout;
    layout.insertWidget(index, widget);
    this._updateCell(index);
    this.onCellInserted(index, widget);
  }

  /**
   * Move a cell widget.
   */
  private _moveCell(fromIndex: number, toIndex: number): void {
    let layout = this.layout as PanelLayout;
    layout.insertWidget(toIndex, layout.widgets.at(fromIndex));
    this.onCellMoved(fromIndex, toIndex);
  }

  /**
   * Remove a cell widget.
   */
  private _removeCell(index: number): void {
    let layout = this.layout as PanelLayout;
    let widget = layout.widgets.at(index) as BaseCellWidget;
    widget.parent = null;
    this.onCellRemoved(widget);
    widget.dispose();
  }

  /**
   * Update the cell widgets.
   */
  private _updateCells(): void {
    let layout = this.layout as PanelLayout;
    for (let i = 0; i < layout.widgets.length; i++) {
      this._updateCell(i);
    }
  }

  /**
   * Update a cell widget.
   */
  private _updateCell(index: number): void {
    let layout = this.layout as PanelLayout;
    let child = layout.widgets.at(index) as BaseCellWidget;
    if (child instanceof CodeCellWidget) {
      child.mimetype = this._mimetype;
    }
    this._renderer.updateCell(child);
  }

  private _mimetype = 'text/plain';
  private _model: INotebookModel = null;
  private _rendermime: RenderMime = null;
  private _renderer: StaticNotebook.IRenderer = null;
}


// Define the signals for the `StaticNotebook` class.
defineSignal(StaticNotebook.prototype, 'modelChanged');
defineSignal(StaticNotebook.prototype, 'modelContentChanged');


/**
 * The namespace for the `StaticNotebook` class statics.
 */
export
namespace StaticNotebook {
  /**
   * An options object for initializing a static notebook.
   */
  export
  interface IOptions {
    /**
     * The rendermime instance used by the widget.
     */
    rendermime: RenderMime;

    /**
     * The language preference for the model.
     */
    languagePreference?: string;

    /**
     * A renderer for a notebook.
     *
     * The default is a shared renderer instance.
     */
    renderer: IRenderer;
  }

  /**
   * A factory for creating code cell widgets.
   */
  export
  interface IRenderer {
    /**
     * Create a new code cell widget.
     */
    createCodeCell(model: ICodeCellModel, rendermime: RenderMime): CodeCellWidget;

    /**
     * Create a new markdown cell widget.
     */
    createMarkdownCell(model: IMarkdownCellModel, rendermime: RenderMime): MarkdownCellWidget;

    /**
     * Create a new raw cell widget.
     */
    createRawCell(model: IRawCellModel): RawCellWidget;

    /**
     * Update a cell widget.
     */
    updateCell(cell: BaseCellWidget): void;

    /**
     * Get the preferred mime type for code cells in the notebook.
     *
     * #### Notes
     * The model is guaranteed to be non-null.
     */
    getCodeMimetype(model: INotebookModel): string;
  }

  /**
   * The default implementation of an `IRenderer`.
   */
  export
  abstract class Renderer implements IRenderer {
    /**
     * Create a new code cell widget.
     */
    abstract createCodeCell(model: ICodeCellModel, rendermime: RenderMime): CodeCellWidget;

    /**
     * Create a new markdown cell widget.
     */
    abstract createMarkdownCell(model: IMarkdownCellModel, rendermime: RenderMime): MarkdownCellWidget;

    /**
     * Create a new raw cell widget.
     */
    abstract createRawCell(model: IRawCellModel): RawCellWidget;

    /**
     * Update a cell widget.
     *
     * #### Notes
     * The base implementation is a no-op.
     */
    updateCell(cell: BaseCellWidget): void {
      // This is a no-op.
    }

    /**
     * Get the preferred mimetype for code cells in the notebook.
     *
     * #### Notes
     * The model is guaranteed to be non-null.
     */
    getCodeMimetype(model: INotebookModel): string {
      let cursor = model.getMetadata('language_info');
      let info = cursor.getValue() as nbformat.ILanguageInfoMetadata;
      return mimetypeForLanguage(info as KernelMessage.ILanguageInfo);
    }
  }
}


/**
 * A notebook widget that supports interactivity.
 */
export
class Notebook extends StaticNotebook {
  /**
   * Construct a notebook widget.
   */
  constructor(options: StaticNotebook.IOptions) {
    super(options);
    this.node.tabIndex = -1;  // Allow the widget to take focus.
    // Set up the inspection handler.
    this._inspectionHandler = new InspectionHandler(this.rendermime);
    this.activeCellChanged.connect((s, cell) => {
      this._inspectionHandler.activeCell = cell;
    });
  }

  /**
   * A signal emitted when the active cell changes.
   *
   * #### Notes
   * This can be due to the active index changing or the
   * cell at the active index changing.
   */
  activeCellChanged: ISignal<Notebook, BaseCellWidget>;

  /**
   * A signal emitted when the state of the notebook changes.
   */
  stateChanged: ISignal<Notebook, IChangedArgs<any>>;

  /**
   * A signal emitted when the selection state of the notebook changes.
   */
  selectionChanged: ISignal<Notebook, void>;

  /**
   * Get the inspection handler used by the code console.
   *
   * #### Notes
   * This is a read-only property.
   */
  get inspectionHandler(): InspectionHandler {
    return this._inspectionHandler;
  }

  /**
   * The interactivity mode of the notebook.
   */
  get mode(): NotebookMode {
    return this._mode;
  }
  set mode(newValue: NotebookMode) {
    // Always post an update request.
    this.update();
    if (newValue === this._mode) {
      return;
    }
    let oldValue = this._mode;
    this._mode = newValue;
    this.stateChanged.emit({ name: 'mode', oldValue, newValue });
    let activeCell = this.activeCell;
    if (!activeCell) {
      return;
    }
    // Edit mode deselects all cells.
    if (newValue === 'edit') {
      let layout = this.layout as PanelLayout;
      for (let i = 0; i < layout.widgets.length; i++) {
        let widget = layout.widgets.at(i) as BaseCellWidget;
        this.deselect(widget);
      }
      if (activeCell instanceof MarkdownCellWidget) {
        activeCell.rendered = false;
      }
      if (!this._isActive) {
        sendMessage(this, WidgetMessage.ActivateRequest);
      }
    }
  }

  /**
   * The active cell index of the notebook.
   *
   * #### Notes
   * The index will be clamped to the bounds of the notebook cells.
   */
  get activeCellIndex(): number {
    if (!this.model) {
      return -1;
    }
    return this.model.cells.length ? this._activeCellIndex : -1;
  }
  set activeCellIndex(newValue: number) {
    // Always post an update request.
    this.update();
    let oldValue = this._activeCellIndex;
    if (!this.model || !this.model.cells.length) {
      newValue = -1;
    } else {
      newValue = Math.max(newValue, 0);
      newValue = Math.min(newValue, this.model.cells.length - 1);
    }
    this._activeCellIndex = newValue;
    let cell = this.childAt(newValue);
    if (cell !== this._activeCell) {
      this._activeCell = cell;
      this.activeCellChanged.emit(cell);
    }
    if (newValue === oldValue) {
      return;
    }
    this.stateChanged.emit({ name: 'activeCellIndex', oldValue, newValue });
  }

  /**
   * Get the active cell widget.
   *
   * #### Notes
   * This is a read-only property.
   */
  get activeCell(): BaseCellWidget {
    return this._activeCell;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._activeCell = null;
    this._inspectionHandler.dispose();
    this._inspectionHandler = null;
    super.dispose();
  }

  /**
   * Select a cell widget.
   *
   * #### Notes
   * It is a no-op if the value does not change.
   * It will emit the `selectionChanged` signal.
   */
  select(widget: BaseCellWidget): void {
    if (Private.selectedProperty.get(widget)) {
      return;
    }
    Private.selectedProperty.set(widget, true);
    this.selectionChanged.emit(void 0);
    this.update();
  }

  /**
   * Deselect a cell widget.
   *
   * #### Notes
   * It is a no-op if the value does not change.
   * It will emit the `selectionChanged` signal.
   */
  deselect(widget: BaseCellWidget): void {
    if (!Private.selectedProperty.get(widget)) {
      return;
    }
    Private.selectedProperty.set(widget, false);
    this.selectionChanged.emit(void 0);
    this.update();
  }

  /**
   * Whether a cell is selected or is the active cell.
   */
  isSelected(widget: BaseCellWidget): boolean {
    if (widget === this._activeCell) {
      return true;
    }
    return Private.selectedProperty.get(widget);
  }

  /**
   * Scroll so that the active cell is visible.
   */
  scrollToActiveCell() {
    if (this.activeCell) {
      scrollIntoViewIfNeeded(this.node, this.activeCell.node);
    }
  }

  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the dock panel's node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    if (!this.model || this.model.readOnly) {
      return;
    }
    switch (event.type) {
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'dblclick':
      this._evtDblClick(event as MouseEvent);
      break;
    case 'focus':
      this._evtFocus(event as MouseEvent);
      break;
    default:
      break;
    }
  }

  /**
   * Handle `after_attach` messages for the widget.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.node.addEventListener('mousedown', this);
    this.node.addEventListener('dblclick', this);
    this.node.addEventListener('focus', this, true);
  }

  /**
   * Handle `before_detach` messages for the widget.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('mousedown', this);
    this.node.removeEventListener('dblclick', this);
    this.node.removeEventListener('focus', this, true);
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this._isActive = true;
    this.update();
  }

  /**
   * Handle `'deactivate-request'` messages.
   */
  protected onDeactivateRequest(msg: Message): void {
    this._isActive = false;
    this.mode = 'command';
  }

  /**
   * Handle `update-request` messages sent to the widget.
   */
  protected onUpdateRequest(msg: Message): void {
    let activeCell = this.activeCell;
    // Ensure we have the correct focus.
    if (this._isActive) {
      if (this.mode === 'edit' && activeCell) {
        activeCell.editor.activate();
      } else {
        // Focus the node if nothing is focused internally.
        if (!this.node.contains(document.activeElement)) {
          this.node.focus();
        } else {
          // If an editor currently has focus, focus the node.
          // Otherwise, another input field has focus and should keep it.
          let w = find(this.layout, widget => {
            return (widget as BaseCellWidget).editor.hasFocus();
          });
          if (w) {
            this.node.focus();
          }
        }
      }
    }
    // Set the appropriate classes on the cells.
    if (this.mode === 'edit') {
      this.addClass(EDIT_CLASS);
      this.removeClass(COMMAND_CLASS);
    } else {
      this.addClass(COMMAND_CLASS);
      this.removeClass(EDIT_CLASS);
    }
    if (activeCell) {
      activeCell.addClass(ACTIVE_CLASS);
    }

    let count = 0;
    let layout = this.layout as PanelLayout;
    for (let i = 0; i < layout.widgets.length; i++) {
      let widget = layout.widgets.at(i) as BaseCellWidget;
      if (i !== this.activeCellIndex) {
        widget.removeClass(ACTIVE_CLASS);
      }
      widget.removeClass(OTHER_SELECTED_CLASS);
      if (this.isSelected(widget)) {
        widget.addClass(SELECTED_CLASS);
        count++;
      } else {
        widget.removeClass(SELECTED_CLASS);
      }
    }
    if (count > 1) {
      activeCell.addClass(OTHER_SELECTED_CLASS);
    }
  }

  /**
   * Handle a cell being inserted.
   */
  protected onCellInserted(index: number, cell: BaseCellWidget): void {
    cell.editor.edgeRequested.connect(this._onEdgeRequest, this);
    // Trigger an update of the active cell.
    this.activeCellIndex = this.activeCellIndex;
  }

  /**
   * Handle a cell being moved.
   */
  protected onCellMoved(fromIndex: number, toIndex: number): void {
    if (fromIndex === this.activeCellIndex) {
      this.activeCellIndex = toIndex;
    }
  }

  /**
   * Handle a cell being removed.
   */
  protected onCellRemoved(cell: BaseCellWidget): void {
    // Trigger an update of the active cell.
    this.activeCellIndex = this.activeCellIndex;
    if (this.isSelected(cell)) {
      this.selectionChanged.emit(void 0);
    }
  }

  /**
   * Handle a new model.
   */
  protected onModelChanged(oldValue: INotebookModel, newValue: INotebookModel): void {
    // Try to set the active cell index to 0.
    // It will be set to `-1` if there is no new model or the model is empty.
    this.activeCellIndex = 0;
  }

  /**
   * Handle edge request signals from cells.
   */
  private _onEdgeRequest(widget: Widget, location: EdgeLocation): void {
    let prev = this.activeCellIndex;
    if (location === 'top') {
      this.activeCellIndex--;
      // Move the cursor to the first position on the last line.
      if (this.activeCellIndex < prev) {
        let lastLine = this.activeCell.editor.getLastLine();
        this.activeCell.editor.setCursor(lastLine, 0);
      }
    } else {
      this.activeCellIndex++;
      // Move the cursor to the first character.
      if (this.activeCellIndex > prev) {
        this.activeCell.editor.setCursorPosition(0);
      }
    }
  }

  /**
   * Find the cell index containing the target html element.
   *
   * #### Notes
   * Returns -1 if the cell is not found.
   */
  private _findCell(node: HTMLElement): number {
    // Trace up the DOM hierarchy to find the root cell node.
    // Then find the corresponding child and select it.
    let layout = this.layout as PanelLayout;
    while (node && node !== this.node) {
      if (node.classList.contains(NB_CELL_CLASS)) {
        for (let i = 0; i < layout.widgets.length; i++) {
          if (layout.widgets.at(i).node === node) {
            return i;
          }
        }
        break;
      }
      node = node.parentElement;
    }
    return -1;
  }

  /**
   * Handle `mousedown` events for the widget.
   */
  private _evtMouseDown(event: MouseEvent): void {
    if (!this._isActive) {
      sendMessage(this, WidgetMessage.ActivateRequest);
    }
    let target = event.target as HTMLElement;
    let i = this._findCell(target);
    if (i !== -1) {
      let widget = this.childAt(i);
      // Event is on a cell but not in its editor, switch to command mode.
      if (!widget.editor.node.contains(target)) {
        this.mode = 'command';
      }
      // Set the cell as the active one.
      // This must be done *after* setting the mode above.
      this.activeCellIndex = i;
    }
  }

  /**
   * Handle `focus` events for the widget.
   */
  private _evtFocus(event: MouseEvent): void {
    if (!this._isActive) {
      sendMessage(this, WidgetMessage.ActivateRequest);
    }
    let target = event.target as HTMLElement;
    let i = this._findCell(target);
    if (i !== -1) {
      let widget = this.childAt(i);
      // If the editor has focus, ensure edit mode.
      if (widget.editor.node.contains(target)) {
        this.mode = 'edit';
      // Otherwise, another control within the cell has focus,
      // ensure command mode.
      } else {
        this.mode = 'command';
      }
      this.activeCellIndex = i;
    } else {
      // No cell has focus, ensure command mode.
      this.mode = 'command';
    }
  }

  /**
   * Handle `dblclick` events for the widget.
   */
  private _evtDblClick(event: MouseEvent): void {
    if (!this._isActive) {
      sendMessage(this, WidgetMessage.ActivateRequest);
    }
    let model = this.model;
    if (!model || model.readOnly) {
      return;
    }
    let target = event.target as HTMLElement;
    let i = this._findCell(target);
    if (i === -1) {
      return;
    }
    let layout = this.layout as PanelLayout;
    let cell = model.cells.get(i) as MarkdownCellModel;
    let widget = layout.widgets.at(i) as MarkdownCellWidget;
    if (cell.type === 'markdown') {
      widget.rendered = false;
      widget.activate();
      return;
    } else if (target.localName === 'img') {
      target.classList.toggle(UNCONFINED_CLASS);
    }
  }

  private _activeCellIndex = -1;
  private _activeCell: BaseCellWidget = null;
  private _inspectionHandler: InspectionHandler = null;
  private _mode: NotebookMode = 'command';
  private _isActive = false;
}


// Define the signals for the `Notebook` class.
defineSignal(Notebook.prototype, 'activeCellChanged');
defineSignal(Notebook.prototype, 'selectionChanged');
defineSignal(Notebook.prototype, 'stateChanged');


/**
 * The namespace for the `Notebook` class statics.
 */
export
namespace Notebook {
  /**
   * An options object for initializing a notebook.
   */
  export
  interface IOptions extends StaticNotebook.IOptions { }

  /**
   * The default implementation of an `IRenderer`.
   */
  export
  abstract class Renderer extends StaticNotebook.Renderer { }

}


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * An attached property for the selected state of a cell.
   */
  export
  const selectedProperty = new AttachedProperty<BaseCellWidget, boolean>({
    name: 'selected',
    value: false
  });

  /**
   * A custom panel layout for the notebook.
   */
  export
  class NotebookPanelLayout extends PanelLayout {
    /**
     * A message handler invoked on an `'update-request'` message.
     *
     * #### Notes
     * This is a reimplementation of the base class method,
     * and is a no-op.
     */
    protected onUpdateRequest(msg: Message): void {
      // This is a no-op.
    }
  }
}
