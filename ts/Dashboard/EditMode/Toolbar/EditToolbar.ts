import EditMode from '../EditMode.js';
import U from '../../../Core/Utilities.js';
import Menu from '../Menu/Menu.js';
import { HTMLDOMElement } from '../../../Core/Renderer/DOMElementType.js';
import EditGlobals from '../EditGlobals.js';
import Row from '../../Layout/Row.js';
import Cell from '../../Layout/Cell.js';
import GUIElement from '../../Layout/GUIElement.js';
import DashboardGlobals from '../../DashboardGlobals.js';
import type Layout from '../../Layout/Layout.js';

const {
    defined,
    createElement,
    css
} = U;

abstract class EditToolbar {
    /* *
    *
    *  Constructor
    *
    * */
    constructor(
        editMode: EditMode,
        options: EditToolbar.Options
    ) {
        this.container = createElement(
            'div', {
                className: options.className
            }, {},
            editMode.dashboard.container
        );

        this.editMode = editMode;
        this.menu = new Menu(
            this.container,
            options.menu,
            this
        );

        this.options = options;
        this.isVisible = false;

        if (this.options.outline) {
            this.outline = createElement(
                'div', {
                    className: EditGlobals.classNames.editToolbarOutline
                }, {},
                this.container
            );
        }
    }

    /* *
    *
    *  Properties
    *
    * */
    public container: HTMLDOMElement;
    public editMode: EditMode;
    public menu: Menu;
    public isVisible: boolean;
    public options: EditToolbar.Options;
    public outline?: HTMLDOMElement;

    /* *
    *
    *  Functions
    *
    * */
    public hide(): void {
        this.setPosition(void 0, void 0);
    }

    public refreshOutline(
        x: number,
        y: number,
        guiElement?: GUIElement
    ): void {
        const toolbar = this,
            guiElemCnt = (guiElement || {}).container;

        if (toolbar.outline && guiElemCnt) {
            css(toolbar.outline, {
                display: 'block',
                left: x + 'px',
                top: y + 'px',
                width: guiElemCnt.offsetWidth + 'px',
                height: guiElemCnt.offsetHeight + 'px'
            });
        }
    }

    public hideOutline(): void {
        if (this.outline) {
            this.outline.style.display = 'none';
        }
    }

    public setPosition(
        x?: number,
        y?: number
    ): void {
        const toolbar = this;

        if (toolbar.container) {
            css(toolbar.container, {
                left: (x || '-9999') + 'px',
                top: (y || '-9999') + 'px'
            });
        }

        toolbar.isVisible = defined(x) && defined(y);
    }

    public maskNotEditedElements(
        currentElement: Cell|Row,
        isRow?: boolean
    ): void {
        const components = isRow ?
            (currentElement as Row).layout.dashboard.mountedComponents :
            (currentElement as Cell).row.layout.dashboard.mountedComponents;

        // set opacity
        for (let i = 0, iEnd = components.length; i < iEnd; ++i) {
            (components[i].cell.container as HTMLDOMElement).classList.add(
                EditGlobals.classNames.maskElement
            );
        }

        // highlight current element
        if (isRow) {
            this.unmaskRow(
                currentElement as Row
            );
        } else {
            (currentElement.container as HTMLDOMElement).classList.remove(
                EditGlobals.classNames.maskElement
            );
        }
    }

    public unmaskRow(
        row: Row
    ): void {
        const cells = row.cells;
        let nestedLayout: Layout|undefined;
        let rows;

        for (let i = 0, iEnd = cells.length; i < iEnd; ++i) {
            nestedLayout = cells[i].nestedLayout;

            if (nestedLayout) {
                rows = nestedLayout.rows;
                for (let j = 0, jEnd = rows.length; j < jEnd; ++j) {
                    this.unmaskRow(
                        rows[j]
                    );
                }
            } else {
                (cells[i].container as HTMLDOMElement).classList.remove(
                    EditGlobals.classNames.maskElement
                );
            }
        }
    }
}

namespace EditToolbar {
    export interface Options {
        enabled: boolean;
        className: string;
        outline: boolean;
        menu: Menu.Options;
    }
}

export default EditToolbar;
