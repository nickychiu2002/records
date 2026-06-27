let expenseChart;

const CHART_COLORS = [
    "#ffcb77",
    "#227c9d",
    "#17c3b2",
    "#335D45",
    "#fef9ef",
    "#fe6d73"
];

// console.log("chart.js 已載入");

// console.log("loadExpenseChart 被呼叫");

// new
function createChart(labels, values) {

    const ctx =
        document
        .getElementById("expenseChart")
        .getContext("2d");

    expenseChart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels,

            datasets: [{

                data: values,

                backgroundColor: CHART_COLORS,

                borderColor: "#edf0ee00",

                borderWidth: 2,

                hoverOffset: 8

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "52%",

            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            },

            animation: {

                animateRotate: true,

                duration: 1500,

                easing: "easeOutQuart"

            },

            plugins: {

                legend: {
                    display: false
                }

            }

        },

        plugins: [{
            id: "shadow",

            beforeDatasetsDraw(chart) {

                chart.ctx.save();

                chart.ctx.shadowColor = "rgba(0,0,0,.27)";
                chart.ctx.shadowBlur = 8;

            },

            afterDatasetsDraw(chart) {

                chart.ctx.restore();

            }

        }]

    });

}

function updateChart() {

    const labels =
        Object.keys(dashboardData.chart);

    const values =
        Object.values(dashboardData.chart);

    if (!expenseChart) {

        createChart(labels, values);

        return;

    }

    expenseChart.data.labels = labels;

    expenseChart.data.datasets[0].data = values;

    expenseChart.update();

}

function updateLegend() {

    const colors = CHART_COLORS;

    const labels =
        Object.keys(dashboardData.chart);

    const legend =
        document.getElementById("chartLegend");

    legend.innerHTML = "";

    labels.forEach((label,index)=>{

        legend.innerHTML += `

            <div class="legend-item">

                <span
                    class="legend-color"
                    style="background:${colors[index]}"
                ></span>

                <span>${label}</span>

            </div>

        `;

    });

}