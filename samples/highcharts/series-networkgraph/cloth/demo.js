function generateCloth(rows, columns) {
    var data = [],
        i,
        j;

    // Each node connects to:
    for (i = 1; i < rows; i++) {
        for (j = 1; j < columns; j++) {
            // a) right node
            if (j + 1 < columns) {
                data.push([
                    i + '_' + j,
                    i + '_' + (j + 1)
                ]);
            }

            // b) bottom node
            if (i + 1 < rows) {
                data.push([
                    i + '_' + j,
                    (i + 1) + '_' + j
                ]);
            }

            // c) cross node (optional)
            if (i + 1 < rows && j + 1 < columns) {
                data.push([
                    i + '_' + j,
                    (i + 1) + '_' + (j + 1)
                ]);
            }
        }
    }

    return data;
}

Highcharts.chart('container', {
    chart: {
        type: 'networkgraph',
        plotBorderWidth: 1
    },
    title: {
        text: 'Cloth simulation using custom forces'
    },
    plotOptions: {
        networkgraph: {
            layoutAlgorithm: {
                enableSimulation: true
            },
            keys: ['from', 'to']
        }
    },

    series: [{
        data: generateCloth(16, 16),
        marker: {
            radius: 2
        }
    }]
});