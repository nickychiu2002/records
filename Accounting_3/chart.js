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

    const ctx=
    document
    .getElementById("expenseChart");

    if(expenseChart){

        expenseChart.destroy();

    }

    expenseChart = new Chart(ctx, {

    type: "doughnut",

    data: {

        labels: labels,

        datasets: [{
            data: values
        }]

    },

    options: {

        responsive: true,

        maintainAspectRatio: false,

        cutout: "65%",

        animation: {

            animateRotate: true,

            duration: 1500,

            easing: "easeOutQuart"

        },

        plugins: {

            legend: {
                position: "bottom"
            }

        }

    }

});    

}

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