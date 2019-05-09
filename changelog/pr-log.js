/* eslint-env node, es6 */
/* eslint camelcase: 0, func-style: 0, valid-jsdoc: 0, no-console: 0, require-jsdoc: 0 */

const octokit = require('@octokit/rest')({
    auth: process.env.GITHUB_LIST_PRS_TOKEN
});

require('colors');

const error = e => {
    console.error(e);
};

const log = {
    Highcharts: {},
    Highstock: {},
    Highmaps: {},
    'Highcharts Gantt': {}
};

module.exports = async () => {

    let page = 1;
    let pulls = [];

    const tags = await octokit.repos.listTags({
        owner: 'highcharts',
        repo: 'highcharts'
    }).catch(error);

    const commit = await octokit.repos.getCommit({
        owner: 'highcharts',
        repo: 'highcharts',
        commit_sha: tags.data[0].commit.sha
    }).catch(error);

    console.log(
        'Generating log after latest tag'.green,
        commit.headers['last-modified']
    );
    const after = Date.parse(commit.headers['last-modified']);

    while (page < 5) {
        const allPulls = await octokit.pulls.list({
            owner: 'highcharts',
            repo: 'highcharts',
            state: 'closed',
            base: 'master',
            page
        }).catch(error);

        const pageData = allPulls.data.filter(d => Date.parse(d.merged_at) > after);

        console.log(`Loaded pulls page ${page} (${pageData.length} items)`.green);

        if (pageData.length === 0) {
            break;
        }

        pulls = pulls.concat(pageData);
        page++;
    }

    // Simplify
    pulls = pulls.map(p => ({
        description: p.body.split('\n')[0].trim(),
        labels: p.labels
    }));

    pulls.forEach(p => {
        p.product = 'Highcharts';

        Object.keys(log).forEach(product => {
            if (p.labels.find(l => l.name === `Product: ${product}`)) {
                p.product = product;
            }
        });

        if (p.labels.find(l => l.name === 'Type: Enhancement')) {
            p.isFeature = true;

        } else if (p.description.indexOf('Fixed') === 0) {
            p.isFix = true;
        }
    });

    Object.keys(log).forEach(product => {
        log[product].features = pulls.filter(
            p => p.isFeature && p.product === product
        );
    });

    Object.keys(log).forEach(product => {
        log[product].bugfixes = pulls.filter(
            p => p.isFix && p.product === product
        );
    });

    return log;

};
