import GUIElement from './Layout/GUIElement';

/**
 *
 * Prefix of a GUIElement HTML class name.
 *
 */
const PREFIX = 'hcd-';

const DashboardGlobals: DashboardGlobals = {
    prefix: PREFIX,
    guiElementType: {
        row: 'row',
        cell: 'cell',
        layout: 'layout'
    },
    classNames: {
        layout: PREFIX + 'layout',
        cell: PREFIX + 'cell',
        row: PREFIX + 'row'
    }
};

interface DashboardGlobals {
    prefix: string;
    guiElementType: Record<string, GUIElement.GUIElementType>;
    classNames: EditGlobals.ClassNamesOptions;
}

namespace EditGlobals {
    export interface ClassNamesOptions {
        layout: string;
        cell: string;
        row: string;
    }
}

export default DashboardGlobals;
