import U from '../../Core/Utilities.js';
import Dashboard from './../Dashboard.js';
import EditGlobals from '../EditMode/EditGlobals.js';
import { HTMLDOMElement } from '../../Core/Renderer/DOMElementType.js';
import EditRenderer from './EditRenderer.js';
import Resizer from './../Actions/Resizer.js';
import type Layout from './../Layout/Layout.js';
import CellEditToolbar from './Toolbar/CellEditToolbar.js';
import RowEditToolbar from './Toolbar/RowEditToolbar.js';
import Sidebar from './Sidebar.js';
import EditContextMenu from './EditContextMenu.js';
import DragDrop from './../Actions/DragDrop.js';
import ConfirmationPopup from './ConfirmationPopup.js';

const {
    merge,
    addEvent,
    createElement
} = U;

class EditMode {
    /* *
    *
    *  Static Properties
    *
    * */
    protected static readonly defaultOptions: EditMode.Options = {
        enabled: true,
        tools: {
            addComponentBtn: {
                icon: EditGlobals.iconsURL + 'add.svg'
            }
        },
        confirmationPopup: {
            close: {
                icon: EditGlobals.iconsURL + 'close.svg'
            }
        }
    }

    /* *
    *
    *  Constructor
    *
    * */
    constructor(
        dashboard: Dashboard,
        options: EditMode.Options|undefined
    ) {
        this.options = merge(EditMode.defaultOptions, options || {});
        this.dashboard = dashboard;
        this.lang = merge({}, EditGlobals.lang, this.options.lang);

        // Init renderer.
        this.renderer = new EditRenderer(this);

        this.isInitialized = false;
        this.tools = {};

        this.createTools();

        this.confirmationPopup = new ConfirmationPopup(
            dashboard.container,
            this.options.confirmationPopup
        );
    }

    /* *
    *
    *  Properties
    *
    * */

    private active: boolean = false;
    public options: EditMode.Options;
    public dashboard: Dashboard;
    // public contextButtonElement?: HTMLDOMElement;
    // public contextMenu?: EditContextMenu;
    public lang: EditGlobals.LangOptions;
    public renderer: EditRenderer;
    public cellToolbar?: CellEditToolbar;
    public rowToolbar?: RowEditToolbar;
    public sidebar?: Sidebar;
    public dragDrop?: DragDrop;
    public isInitialized: boolean;
    public addComponentBtn?: HTMLDOMElement;
    public tools: EditMode.Tools;
    public confirmationPopup?: ConfirmationPopup;

    /* *
    *
    *  Functions
    *
    * */

    public onContextBtnClick(
        editMode: EditMode
    ): void {
        // Init contextMenu if doesn't exist.
        if (!editMode.tools.contextMenu) {
            editMode.tools.contextMenu = new EditContextMenu(
                editMode, editMode.options.contextMenu || {}
            );
        }

        // Show context menu.
        if (editMode.tools.contextMenu) {
            if (!editMode.tools.contextMenu.isVisible) {
                editMode.tools.contextMenu.updatePosition(editMode.tools.contextButtonElement);
            }

            editMode.tools.contextMenu.setVisible(
                !editMode.tools.contextMenu.isVisible
            );
        }
    }

    public onEditModeToggle(): void {
        const editMode = this;

        if (editMode.active) {
            editMode.deactivateEditMode();
        } else {
            editMode.activateEditMode();
        }
    }

    public initEditMode(): void {
        const editMode = this,
            dashboard = editMode.dashboard;

        let layout;

        // Init resizers.
        for (let i = 0, iEnd = dashboard.layouts.length; i < iEnd; ++i) {
            layout = dashboard.layouts[i];

            if (!layout.resizer) {
                editMode.initLayoutResizer(layout);
            }
        }

        // Init dragDrop.
        if (
            !(editMode.options.dragDrop &&
                !editMode.options.dragDrop.enabled)
        ) {
            editMode.dragDrop = new DragDrop(editMode);
        }

        // Init cellToolbar.
        if (!editMode.cellToolbar) {
            editMode.cellToolbar = new CellEditToolbar(editMode);
        }

        // Init rowToolbar.
        if (!editMode.rowToolbar) {
            editMode.rowToolbar = new RowEditToolbar(editMode);
        }

        // Init optionsToolbar.
        if (!editMode.sidebar) {
            editMode.sidebar = new Sidebar(editMode);
        }

        editMode.isInitialized = true;
    }

    private initEvents(): void {
        const editMode = this,
            dashboard = editMode.dashboard;

        for (let i = 0, iEnd = dashboard.layouts.length; i < iEnd; ++i) {
            editMode.setLayoutEvents(dashboard.layouts[i]);
        }

        if (editMode.cellToolbar) {
            // Hide row toolbar when mouse on cell toolbar.
            addEvent(editMode.cellToolbar.container, 'mouseenter', function (): void {
                editMode.hideToolbars(['row']);
            });
        }

        if (editMode.rowToolbar) {
            const rowToolbar = editMode.rowToolbar;

            // Hide cell toolbar when mouse on row toolbar.
            addEvent(rowToolbar.container, 'mouseenter', function (): void {
                editMode.hideToolbars(['cell']);
                rowToolbar.refreshOutline();
            });

            addEvent(rowToolbar.container, 'mouseleave', function (): void {
                rowToolbar.hideOutline();
            });
        }
    }

    private setLayoutEvents(
        layout: Layout
    ): void {
        const editMode = this;

        for (let j = 0, jEnd = layout.rows.length; j < jEnd; ++j) {
            const row = layout.rows[j];

            if (editMode.rowToolbar) {
                const rowToolbar = editMode.rowToolbar;

                addEvent(row.container, 'mousemove', function (e): void {
                    rowToolbar.onMouseMove(row);

                    if (!(editMode.dragDrop || {}).isActive) {
                        e.stopImmediatePropagation();
                    }
                });
            }

            for (let k = 0, kEnd = row.cells.length; k < kEnd; ++k) {
                const cell = row.cells[k];

                if (cell.nestedLayout) {
                    editMode.setLayoutEvents(cell.nestedLayout);
                } else if (editMode.cellToolbar && cell.container) {
                    const cellToolbar = editMode.cellToolbar;

                    addEvent(cell.container, 'mousemove', function (): void {
                        cellToolbar.onMouseMove(cell);
                    });

                    // Hide cell toolbar when mouse on cell resizer.
                    const resizedCell = (cell as Resizer.ResizedCell).resizer;
                    if (resizedCell && resizedCell.snapX) {
                        addEvent(resizedCell.snapX, 'mousemove', function (e): void {
                            cellToolbar.hide();

                            if (!(editMode.dragDrop || {}).isActive) {
                                e.stopImmediatePropagation();
                            }
                        });
                    }

                    // Init dragDrop cell events.
                    if (editMode.dragDrop) {
                        const dragDrop = editMode.dragDrop;
                        addEvent(cell.container, 'mouseenter', function (e: any): void {
                            if (dragDrop.isActive) {
                                dragDrop.mouseContext = cell;
                                dragDrop.onDrag(e);
                            }
                        });
                    }
                }
            }
        }
    }

    public activateEditMode(): void {
        const editMode = this;

        if (!editMode.isInitialized) {
            editMode.initEditMode();
            editMode.initEvents();
        }

        editMode.active = true;

        // Set edit mode active class to dashboard.
        editMode.dashboard.container.classList.add(
            EditGlobals.classNames.editModeEnabled
        );

        if (this.addComponentBtn) {
            this.addComponentBtn.style.display = 'block';
        }

    }

    public deactivateEditMode(): void {
        const editMode = this,
            dashboardCnt = editMode.dashboard.container;

        editMode.active = false;

        dashboardCnt.classList.remove(
            EditGlobals.classNames.editModeEnabled
        );

        // Hide toolbars.
        editMode.hideToolbars();

        if (this.addComponentBtn) {
            this.addComponentBtn.style.display = 'none';
        }
    }

    private initLayoutResizer(layout: Layout): void {
        const dashboard = this.dashboard,
            guiOptions = dashboard.options.gui;

        if (guiOptions) {
            if (guiOptions.layoutOptions.resize) {
                layout.resizer = new Resizer(layout);
            } else if (guiOptions.layoutOptions.resizerJSON) {
                layout.resizer = Resizer.fromJSON(
                    layout, guiOptions.layoutOptions.resizerJSON
                );
            }
        }
    }

    public isActive(): boolean {
        return this.active;
    }

    /**
     * Method for hiding edit toolbars.
     *
     * @param {Array<string>} toolbarTypes
     * The array of toolbar names to hide ('cell', 'row', 'sidebar').
     */
    public hideToolbars(
        toolbarTypes?: Array<string>
    ): void {
        const editMode = this,
            toolbarsToHide = toolbarTypes || ['cell', 'row', 'sidebar'];

        for (let i = 0, iEnd = toolbarsToHide.length; i < iEnd; ++i) {
            switch (toolbarsToHide[i]) {
                case 'cell': {
                    if (editMode.cellToolbar && editMode.cellToolbar.isVisible) {
                        editMode.cellToolbar.hide();
                    }
                    break;
                }
                case 'row': {
                    if (editMode.rowToolbar && editMode.rowToolbar.isVisible) {
                        editMode.rowToolbar.hide();
                    }
                    break;
                }
                case 'sidebar': {
                    if (editMode.sidebar && editMode.sidebar.isVisible) {
                        editMode.sidebar.hide();
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }

    public createTools(): void {
        const editMode = this;
        const options = this.options;

        // create tools container
        this.tools.container = createElement(
            'div', {
                className: EditGlobals.classNames.editTools
            }, {},
            this.dashboard.container
        );

        // create context menu button
        if (
            options.contextMenu &&
            options.contextMenu.enabled
        ) {
            this.tools.contextButtonElement = this.renderer.renderContextButton(
                this.tools.container
            );
        }

        // create add button
        const addIconURL = options && options.tools &&
            options.tools.addComponentBtn && options.tools.addComponentBtn.icon;

        this.addComponentBtn = EditRenderer.renderButton(
            this.tools.container,
            {
                className: EditGlobals.classNames.editToolsBtn,
                icon: addIconURL,
                value: 'Add',
                callback: (): void => {
                    // sidebar trigger
                    if (editMode.sidebar) {
                        editMode.sidebar.show();
                        editMode.sidebar.updateTitle('General');
                    }
                },
                style: {
                    display: 'none'
                }
            }
        );
    }
}
namespace EditMode {
    export interface Options {
        enabled: boolean;
        lang?: EditGlobals.LangOptions|string;
        toolbars?: EditMode.Toolbars;
        dragDrop?: DragDrop.Options;
        tools: Tools;
        contextMenu?: EditContextMenu.Options;
        confirmationPopup: ConfirmationPopup.Options;
    }

    export interface Toolbars {
        cell?: CellEditToolbar.Options;
        row?: RowEditToolbar.Options;
        settings?: Sidebar.Options;
    }

    export interface Tools {
        contextMenu?: EditContextMenu;
        contextButtonElement?: HTMLDOMElement;
        addComponentBtn?: AddComponentBtn;
        container?: HTMLDOMElement;
    }

    export interface AddComponentBtn {
        icon: string;
    }
}

export default EditMode;
