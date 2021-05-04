/* *
 *
 *  Data module
 *
 *  (c) 2012-2020 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/* *
 *
 *  Imports
 *
 * */

import type DataEventEmitter from '../DataEventEmitter';
import type DataJSON from '../DataJSON';

import DataTable from '../DataTable.js';
import U from '../../Core/Utilities.js';
const {
    addEvent,
    fireEvent,
    uniqueKey
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Abstract class providing an interface and basic methods for a DataParser
 */
abstract class DataParser<TEventObject extends DataParser.Event>
implements DataEventEmitter<TEventObject>, DataJSON.Class {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default options
     */
    protected static readonly defaultOptions: DataParser.Options = {
        startColumn: 0,
        endColumn: Number.MAX_VALUE,
        startRow: 0,
        endRow: Number.MAX_VALUE,
        firstRowAsNames: true,
        switchRowsAndColumns: false
    };

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Converts the table instance to a array of columns.
     *
     * @param {DataTable} table
     * Table to convert.
     *
     * @return {Array<DataTable.Column>}
     * An array of columns, with the second dimension as row cells.
     */
    public static getColumnsFromTable(
        table: DataTable
    ): Array<DataTable.Column> {
        const columns = table.getColumns(),
            columnNames = table.getColumnNames(),
            columnArray = [];

        for (let i = 0, iEnd = columnNames.length; i < iEnd; ++i) {
            columnArray.push(columns[columnNames[i]]);
        }

        return columnArray;
    }

    /**
     * Converts an array of columns to a table instance. Second dimension of the
     * array are the row cells.
     *
     * @param {Array<DataTable.Column>} [columns]
     * Array to convert.
     *
     * @param {Array<string>} [headers]
     * Column names to use.
     *
     * @return {DataTable}
     * Table instance from the arrays.
     */
    public static getTableFromColumns(
        columns: Array<DataTable.Column> = [],
        headers: Array<string> = []
    ): DataTable {
        const table = new DataTable();

        for (
            let i = 0,
                iEnd = Math.max(headers.length, columns.length);
            i < iEnd;
            ++i
        ) {
            table.setColumn(
                headers[i] || uniqueKey(),
                columns[i]
            );
        }

        return table;
    }

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Getter for the data table.
     *
     * @return {DataTable}
     */
    public abstract getTable(): DataTable;

    /**
     * Emits an event on the DataParser instance.
     *
     * @param {DataParser.Event} [e]
     * Event object containing additional event data
     */
    public emit<T extends DataEventEmitter.Event>(e: T): void {
        fireEvent(this, e.type, e);
    }

    /**
     * Registers a callback for a specific parser event.
     *
     * @param {string} type
     * Event type as a string.
     *
     * @param {DataEventEmitter.EventCallback} callback
     * Function to register for an modifier callback.
     *
     * @return {Function}
     * Function to unregister callback from the modifier event.
     */
    public on<TEvent extends DataEventEmitter.Event>(
        type: TEvent['type'],
        callback: DataEventEmitter.EventCallback<this, TEvent>
    ): Function {
        return addEvent(this, type, callback);
    }

    /**
     * Initiates the data parsing. Should emit `parseError` on failure.
     *
     * @param {DataParser.Options} options
     * Options for the parser.
     */
    public abstract parse(options: DataParser.Options): void;

    /**
     * Converts the class instance to ClassJSON
     *
     * @return {DataJSON.ClassJSON}
     */
    public abstract toJSON(): DataJSON.ClassJSON;

    /**
     * DataConverter for the parser.
     */
    public abstract converter: DataConverter;
}

/* *
 *
 *  Namespace
 *
 * */

/**
 * Additionally provided types for events and conversion.
 */
namespace DataParser {

    /**
     * The basic event object for a DataParser instance.
     * Valid types are `parse`, `afterParse`, and `parseError`
     */
    export interface Event extends DataEventEmitter.Event {
        readonly type: ('parse' | 'afterParse' | 'parseError');
        readonly columns: Array<DataTable.Column>;
        readonly error?: (string | Error);
        readonly headers: string[];
    }

    /**
     * The shared options for all DataParser instances
     */
    export interface Options extends DataJSON.JSONObject {
        startRow: number;
        endRow: number;
        startColumn: number;
        endColumn: number;
        firstRowAsNames: boolean;
        switchRowsAndColumns: boolean;
    }

}

export default DataParser;
