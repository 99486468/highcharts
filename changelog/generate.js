/* eslint-env node, es6 */
/* eslint func-style: 0, valid-jsdoc: 0, no-console: 0, require-jsdoc: 0 */

/**
 * This node script copies commit messages since the last release and
 * generates a draft for a changelog.
 *
 * Parameters
 * --since String  The tag to start from. This is not used when --pr.
 * --after String  The start date.
 * --before String Optional. The end date for the changelog, defaults to today.
 * --pr            Use Pull Request descriptions as source for the log.
 * --review        Create a review page with edit links and a list of all PRs
 *                 that are not used in the changelog.
 */

const prLog = require('./pr-log');
const params = require('yargs').argv;

(function () {
    'use strict';

    var fs = require('fs'),
        cmd = require('child_process'),
        path = require('path'),
        tree = require('../tree.json');

    /**
     * Get the log from Git
     */
    async function getLog(callback) {
        var command;

        function puts(err, stdout) {
            if (err) {
                throw err;
            }
            callback(stdout);
        }

        if (params.pr) {
            var log = await prLog().catch(e => console.error(e));

            callback(log);
            return;

        }

        command = 'git log --format="%s<br>" ';
        if (params.since) {
            command += ' ' + params.since + '..HEAD ';
        } else {
            if (params.after) {
                command += '--after={' + params.after + '} ';
            }
            if (params.before) {
                command += '--before={' + params.before + '} ';
            }
        }

        cmd.exec(command, null, puts);
    }

    function addMissingDotToCommitMessage(string) {
        if (string[string.length - 1] !== '.') {
            string = string + '.';
        }
        return string;
    }

    /**
     * Prepare the log for each product, and sort the result to get all additions, fixes
     * etc. nicely lined up.
     */
    function washLog(name, log) {
        var washed = [],
            proceed = true;

        log.forEach(function (item) {

            // Keep only the commits after the last release
            if (proceed && (new RegExp('official release ---$')).test(item) &&
                !params.since) {
                proceed = false;
            }

            if (proceed) {

                // Commits tagged with Highstock, Highmaps or Gantt
                if (name === 'Highstock' && item.indexOf('Highstock:') === 0) {
                    washed.push(item.replace(/Highstock:\s?/, ''));
                } else if (name === 'Highmaps' && item.indexOf('Highmaps:') === 0) {
                    washed.push(item.replace(/Highmaps:\s?/, ''));
                } else if (name === 'Highcharts Gantt' && item.indexOf('Gantt:') === 0) {
                    washed.push(item.replace(/Gantt:\s?/, ''));

                    // All others go into the Highcharts changelog for review
                } else if (name === 'Highcharts' && !/^(Highstock|Highmaps|Gantt):/.test(item)) {
                    washed.push(item);
                }
            }
        });

        // Last release not found, abort
        if (proceed === true && !params.since) {
            throw new Error('Last release not located, try setting an older start date.');
        }

        // Sort alphabetically
        washed.sort();

        // Pull out Fixes and append at the end
        var fixes = washed.filter(message => message.indexOf('Fixed') === 0);

        if (fixes.length > 0) {
            washed = washed.filter(message => message.indexOf('Fixed') !== 0);

            washed = washed.concat(fixes);
            washed.startFixes = washed.length - fixes.length;
        }

        return washed;
    }

    function washPRLog(name, log) {
        const washed = log[name].features.concat(log[name].bugfixes);
        washed.startFixes = log[name].features.length;

        return washed;
    }

    /**
     * Build the output
     */
    function buildMarkdown(name, version, date, log, products, optionKeys) {
        var outputString,
            filename = path.join(
                __dirname,
                name.toLowerCase().replace(' ', '-'),
                version + '.md'
            ),
            apiFolder = {
                Highcharts: 'highcharts',
                Highstock: 'highstock',
                Highmaps: 'highmaps',
                'Highcharts Gantt': 'gantt'
            }[name];

        if (params.pr) {
            log = washPRLog(name, log);
        } else {
            log = washLog(name, log);
        }

        // Start the output string
        outputString = '# Changelog for ' + name + ' v' + version + ' (' + date + ')\n\n';

        if (name !== 'Highcharts') {
            outputString += `- Most changes listed under Highcharts ${products.Highcharts.nr} above also apply to ${name} ${version}.\n`;
        }
        log.forEach((change, i) => {

            let desc = change.description || change;

            optionKeys.forEach(key => {
                const replacement = ` [${key}](https://api.highcharts.com/${apiFolder}/${key}) `;

                desc = desc
                    .replace(
                        ` \`${key}\` `,
                        replacement
                    )
                    .replace(
                        ` ${key} `,
                        replacement
                    );
                // We often refer to series options without the plotOptions
                // parent, so make sure it is auto linked too.
                if (key.indexOf('plotOptions.') === 0) {
                    const shortKey = key.replace('plotOptions.', '');
                    if (shortKey.indexOf('.') !== -1) {
                        desc = desc
                            .replace(
                                ` \`${shortKey}\` `,
                                replacement
                            )
                            .replace(
                                ` ${shortKey} `,
                                replacement
                            );
                    }
                }
            });

            // Start fixes
            if (i === log.startFixes) {
                outputString += '\n## Bug fixes\n';
            }
            // All items
            outputString += '- ' + addMissingDotToCommitMessage(desc) + '\n';

        });

        fs.writeFile(filename, outputString, function () {
            console.log('Wrote draft to ' + filename);
        });
    }

    /*
     * Return a list of options so that we can auto-link option references in
     * the changelog.
     */
    function getOptionKeys(treeroot) {
        const keys = [];

        function recurse(subtree, optionPath) {
            Object.keys(subtree).forEach(key => {
                if (optionPath + key !== '') {
                    // Push only the second level, we don't want auto linking of
                    // general words like chart, series, legend, tooltip etc.
                    if (optionPath.indexOf('.') !== -1) {
                        keys.push(optionPath + key);
                    }
                    if (subtree[key].children) {
                        recurse(subtree[key].children, `${optionPath}${key}.`);
                    }
                }
            });
        }

        recurse(treeroot, '');
        return keys;
    }

    function pad(number, length, padder) {
        return new Array(
            (length || 2) +
            1 -
            String(number)
                .replace('-', '')
                .length
        ).join(padder || 0) + number;
    }

    function buildReview(log, products) {

        const filename = path.join(__dirname, 'review.html');

        const formatItem = p => {

            const labels = p.labels
                .map(l => `<span style="background: #${l.color}; padding: 0 0.2em; border-radius: 0.2em">${l.name}</span>`)
                .join(' ');
            return `
            <li>
                ${p.description}
                ${labels}
                [<a href="https://github.com/highcharts/highcharts/pull/${p.number}">Edit</a>]
            </li>`;
        };

        let html = '<style>body { font-family: sans-serif }</style>';

        Object.keys(products).forEach(product => {
            html += `<h2>${product}</h2>`;

            log[product].features.forEach(p => {
                html += formatItem(p);
            });

            html += '<h4>Bug Fixes</h4>';
            log[product].bugfixes.forEach(p => {
                html += formatItem(p);
            });
        });

        html += '<h2>Excluded</h2>';
        log.excluded.forEach(p => {
            html += formatItem(p);
        });

        fs.writeFileSync(
            filename,
            html,
            'utf8'
        );

        console.log(`Review: ${filename}`);
    }

    // Get the Git log
    getLog(function (log) {

        const optionKeys = getOptionKeys(tree);
        const pack = require(path.join(__dirname, '/../package.json'));
        const d = new Date();

        // Split the log into an array
        if (!params.pr) {
            log = log.split('<br>\n');
            log.pop();
        }

        // Load the current products and versions, and create one log each
        fs.readFile(
            path.join(__dirname, '/../build/dist/products.js'),
            'utf8',
            function (err, products) {
                var name;

                if (err) {
                    throw err;
                }

                if (products) {
                    products = products.replace('var products = ', '');
                    products = JSON.parse(products);
                }

                if (params.review && params.pr) {
                    buildReview(log, products);
                }

                for (name in products) {

                    if (products.hasOwnProperty(name)) {
                        if (params.pr) {
                            products[name].nr = pack.version;
                            products[name].date =
                                d.getFullYear() + '-' +
                                pad(d.getMonth() + 1, 2) + '-' +
                                pad(d.getDate(), 2);
                        }

                        buildMarkdown(
                            name,
                            products[name].nr,
                            products[name].date,
                            log,
                            products,
                            optionKeys
                        );
                    }
                }
            }
        );
    });
}());
