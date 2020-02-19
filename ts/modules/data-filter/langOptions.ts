/* *
 *
 *  (c) 2009-2020 Øystein Moseng
 *
 *  Default lang/i18n options for data filter module.
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/**
 * Internal types.
 * @private
 */
declare global {
    namespace Highcharts {
        interface LangDataFilterOptions {
            dataFilterButtonText: string;
        }
        interface LangOptions {
            dataFilter?: LangDataFilterOptions;
            filterDataMenuText?: string;
        }
    }
}


const langOptions: Highcharts.LangOptions = {
    dataFilter: {
        dataFilterButtonText: 'Filter data. {chartTitle}'
    },
    filterDataMenuText: 'Filter data'
};


export default langOptions;
