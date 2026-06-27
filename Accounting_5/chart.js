let expenseChart;

// const CHART_COLORS = [
//     "#ffcb77",
//     "#227c9d",
//     "#17c3b2",
//     "#335D45",
//     "#fef9ef",
//     "#fe6d73"
// ];

const CATEGORY_ORDER = [
  "娛樂",
  "飲食",
  "服飾",
  "交通",
  "生活用品",
  "公益"
];

const CATEGORY_COLORS = {
    "娛樂": "#fdc73e",
    "飲食": "#227c9d",
    "服飾": "#fff8eb",
    "交通": "#8EC8BA",
    "生活用品": "#017374",
    "公益": "#fe6d73"
};

// console.log("chart.js 已載入");

// console.log("loadExpenseChart 被呼叫");

// 漸層色
function getCategoryColor(label, ctx) {

    switch (label) {

        case "娛樂":
            return"#fdc73e";
            // const gradient = ctx.createLinearGradient(0, 0, 200, 200);
            // gradient.addColorStop(0, "#ffe196");
            // gradient.addColorStop(0.3, "#ffe196");
            // gradient.addColorStop(0.85, "#f6929e");
            // gradient.addColorStop(1, "#fc5d9d");
            // return gradient;

        case "飲食":
            return "#227c9d";

        case "服飾":
            return "#fff8eb";

        case "交通":
            return "#8EC8BA";

        case "生活用品":
            return "#017374";

        case "公益":
            return "#fe6d73";

        default:
            return "#ccc";

    }
}

function createChart(labels, values) {

    const ctx = document
    .getElementById("expenseChart")
    .getContext("2d");

    expenseChart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels,

            datasets: [{

                data: values,

                backgroundColor: labels.map(label => getCategoryColor(label, ctx)),

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

                chart.ctx.shadowColor = "#335d4556";
                chart.ctx.shadowBlur = 10;

            },

            afterDatasetsDraw(chart) {

                chart.ctx.restore();

            }

        }]

    });

}

function updateChart() {

    const chartData = dashboardData.charts[currentPeriod];

    const labels = CATEGORY_ORDER.filter(
        label => chartData[label] !== undefined
    );

    const values = labels.map(label => chartData[label]);

    const colors = labels.map(label =>
        CATEGORY_COLORS[label] || "#ccc"
    );

    if (!expenseChart) {

        createChart(labels, values);
        return;

    }

    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = values;

    // ⭐這行一定要加
    expenseChart.data.datasets[0].backgroundColor =
    labels.map(label => getCategoryColor(label, expenseChart.ctx));

    expenseChart.update();

    console.log(labels);
}

function updateLegend() {

    const colors = CATEGORY_COLORS;

    const chartData =
        dashboardData.charts[currentPeriod];

    const labels = CATEGORY_ORDER.filter(
        key => chartData[key] !== undefined
    );

    const values =
        Object.values(chartData);

    const legend =
        document.getElementById("chartLegend");

    legend.innerHTML = "";

    labels.forEach((label,index)=>{

        legend.innerHTML += `
            <div class="legend-item">

                <span
                    class="legend-color"
                    style="background:${CATEGORY_COLORS[label] || "#ccc"}"
                ></span>

                <span>${label}</span>

            </div>
        `;

    });

}
