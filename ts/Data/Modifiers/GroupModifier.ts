/* *
 *
 *  Data Layer
 *
 *  (c) 2012-2020 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type DataEventEmitter from '../DataEventEmitter';
import DataJSON from '../DataJSON.js';
import DataModifier from './DataModifier.js';
import DataTable from '../DataTable.js';
import U from '../../Core/Utilities.js';
const { merge } = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Groups table rows into subtables depending on column values.
 */
class GroupModifier extends DataModifier {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default options to group table rows.
     */
    public static readonly defaultOptions: GroupModifier.Options = {
        modifier: 'Group',
        groupColumn: ''
    };

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Converts a class JSON to a group modifier.
     *
     * @param {ChainDataModifier.ClassJSON} json
     * Class JSON to convert to an instance of group modifier.
     *
     * @return {ChainDataModifier}
     * Group modifier of the class JSON.
     */
    public static fromJSON(json: GroupModifier.ClassJSON): GroupModifier {
        return new GroupModifier(json.options);
    }

    /* *
     *
     *  Constructors
     *
     * */

    /**
     * Constructs an instance of the group modifier.
     *
     * @param {GroupModifier.Options} [options]
     * Options to configure the group modifier.
     */
    public constructor(options?: DeepPartial<GroupModifier.Options>) {
        super();

        this.options = merge(GroupModifier.defaultOptions, options);
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * Options of the group modifier.
     */
    public options: GroupModifier.Options;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Applies modifications to the table rows and returns a new table with
     * subtable, containing the grouped rows. The rows of the new table contain
     * three columns:
     * - `groupBy`: Column name used to group rows by.
     * - `table`: Subtable containing the grouped rows.
     * - `value`: containing the common value of the group
     *
     * @param {DataTable} table
     * Table to modify.
     *
     * @param {DataEventEmitter.EventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {DataTable}
     * Modified table as a reference.
     */
    public modify(
        table: DataTable,
        eventDetail?: DataEventEmitter.EventDetail
    ): DataTable {

        this.emit({ type: 'modify', detail: eventDetail, table });

        const modifier = this,
            {
                invalidValues,
                validValues
            } = modifier.options,
            byGroups: Array<string> = [],
            tableGroups: Array<DataTable> = [],
            valueGroups: Array<DataJSON.JSONPrimitive> = [],
            groupColumn = (
                modifier.options.groupColumn ||
                table.getColumnNames()[0]
            ),
            valueColumn = (
                table.getColumn(groupColumn) ||
                []
            );

        let value: DataTable.CellType,
            valueIndex: number;

        for (let i = 0, iEnd = valueColumn.length; i < iEnd; ++i) {
            value = valueColumn[i];
            if (typeof value !== 'undefined') {
                if (
                    value instanceof DataTable ||
                    (
                        invalidValues &&
                        invalidValues.indexOf(value) >= 0
                    ) || (
                        validValues &&
                        validValues.indexOf(value) === -1
                    )
                ) {
                    continue;
                }

                valueIndex = valueGroups.indexOf(value);

                if (valueIndex === -1) {
                    const newTable = new DataTable();

                    newTable.setRows([table.getRowObject(i) || {}]);

                    byGroups.push(groupColumn);
                    tableGroups.push(newTable);
                    valueGroups.push(value);
                } else {
                    tableGroups[valueIndex].setRows([table.getRow(i) || []]);
                }
            }
        }

        table.deleteColumns();
        table.setColumns({
            groupBy: byGroups,
            table: tableGroups,
            value: valueGroups
        });

        this.emit({ type: 'afterModify', detail: eventDetail, table });

        return table;
    }

    /**
     * Applies partial modifications of a cell change to the property `modified`
     * of the given modified table.
     *
     * @param {Highcharts.DataTable} table
     * Modified table.
     *
     * @param {string} columnName
     * Column name of changed cell.
     *
     * @param {number|undefined} rowIndex
     * Row index of changed cell.
     *
     * @param {Highcharts.DataTableCellType} cellValue
     * Changed cell value.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Modified table as a reference.
     */
    public modifyCell(
        table: DataTable,
        columnName: string,
        rowIndex: number,
        cellValue: DataTable.CellType,
        eventDetail?: DataEventEmitter.EventDetail
    ): DataTable {
        table.modified.setColumns(
            this.modify(table.clone()).getColumns(),
            void 0,
            eventDetail
        );
        return table;
    }

    /**
     * Applies partial modifications of column changes to the property
     * `modified` of the given table.
     *
     * @param {Highcharts.DataTable} table
     * Modified table.
     *
     * @param {Highcharts.DataTableColumnCollection} columns
     * Changed columns as a collection, where the keys are the column names.
     *
     * @param {number} [rowIndex=0]
     * Index of the first changed row.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Modified table as a reference.
     */
    public modifyColumns(
        table: DataTable,
        columns: DataTable.ColumnCollection,
        rowIndex: number,
        eventDetail?: DataEventEmitter.EventDetail
    ): DataTable {
        table.modified.setColumns(
            this.modify(table.clone()).getColumns(),
            void 0,
            eventDetail
        );
        return table;
    }

    /**
     * Applies partial modifications of row changes to the property `modified`
     * of the given table.
     *
     * @param {Highcharts.DataTable} table
     * Modified table.
     *
     * @param {Array<(Highcharts.DataTableRow|Highcharts.DataTableRowObject)>} rows
     * Changed rows.
     *
     * @param {number} [rowIndex]
     * Index of the first changed row.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Modified table as a reference.
     */
    public modifyRows(
        table: DataTable,
        rows: Array<(DataTable.Row|DataTable.RowObject)>,
        rowIndex: number,
        eventDetail?: DataEventEmitter.EventDetail
    ): DataTable {
        table.modified.setColumns(
            this.modify(table.clone()).getColumns(),
            void 0,
            eventDetail
        );
        return table;
    }

    /**
     * Converts the group modifier to a class JSON, including all containing all
     * modifiers.
     *
     * @return {DataJSON.ClassJSON}
     * Class JSON of this group modifier.
     */
    public toJSON(): GroupModifier.ClassJSON {
        const json = {
            $class: 'GroupModifier',
            options: merge(this.options)
        };

        return json;
    }

}

/* *
 *
 *  Namespace
 *
 * */

/**
 * Additionally provided types for modifier events and options, and JSON
 * conversion.
 */
namespace GroupModifier {

    /**
     * Interface of the class JSON to convert to modifier instances.
     */
    export interface ClassJSON extends DataModifier.ClassJSON {
        // nothing here yet
    }

    /**
     * Options to configure the modifier.
     */
    export interface Options extends DataModifier.Options {
        /**
         * Column to group by values.
         */
        groupColumn: string;
        /**
         * Array of invalid group values.
         */
        invalidValues?: Array<DataJSON.JSONPrimitive>;
        /**
         * Array of valid group values.
         */
        validValues?: Array<DataJSON.JSONPrimitive>;
    }

}

/* *
 *
 *  Register
 *
 * */

DataJSON.addClass(GroupModifier);
DataModifier.addModifier(GroupModifier);

declare module './ModifierType' {
    interface ModifierTypeRegistry {
        Group: typeof GroupModifier;
    }
}

/* *
 *
 *  Export
 *
 * */

export default GroupModifier;
