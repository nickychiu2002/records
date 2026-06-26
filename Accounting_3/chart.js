let expenseChart;

// console.log("chart.js 已載入");

// console.log("loadExpenseChart 被呼叫");

async function loadExpenseChart(){

    const response=
    await fetch(
        `${API_URL}?action=expenseChart`
    );

    const data=
    await response.json();

    const labels=
    Object.keys(data);

    const values=
    Object.values(data);

    const canvas = document.getElementById("expenseChart");

    if (!canvas) {
        console.error("找不到 expenseChart");
        return;
    }

    const ctx = canvas.getContext("2d");

    if(expenseChart){

        expenseChart.destroy();

    }

    expenseChart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [{

                data: values,

                backgroundColor: [
                    "#ffcb77",
                    "#227c9d",
                    "#17c3b2",
                    "#335D45",
                    "#fef9ef",
                    "#fe6d73"
                ],

                borderColor: "#edf0ee00",

                borderWidth: 2,

                hoverOffset: 8

                

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            // 圓環寬度
            cutout: "52%",

            layout: {
                padding: {
                    top:10,
                    bottom: 10
                }

            },

            animation: {
                animateRotate: true,
                duration: 1500,
                easing: "easeOutQuart"
            },

            plugins:{

                legend:{
                    display:false
                }

            }

        },

        plugins: [{
            id: "shadow",

            beforeDatasetsDraw(chart) {

                const { ctx } = chart;

                ctx.save();

                ctx.shadowColor = "rgba(0, 0, 0, 0.27)";
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

            },

            afterDatasetsDraw(chart) {

                chart.ctx.restore();

            }

        }]

    });

    const colors = [

        "#ffcb77",
        "#227c9d",
        "#17c3b2",
        "#335D45",
        "#fef9ef",
        "#fe6d73"

    ];

    const legend = document.getElementById("chartLegend");

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
};


// async function loadExpenseChart() {

//     console.log("loadExpenseChart 開始");

//     try {

//         const response = await fetch(
//             `${API_URL}?action=expenseChart`
//         );

//         console.log("fetch 成功");

//         const data = await response.json();

//         console.log("API 回傳：", data);

//     } catch (error) {

//         console.error("loadExpenseChart 錯誤：", error);

//     }

// }