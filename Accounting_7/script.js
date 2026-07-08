const API_URL =
"https://script.google.com/macros/s/AKfycbx_TBhE6kocOmDFNny7qGY94l4HbPyEm8EqiKUvZOLiDqpZpLgEnsJpd6beWMGzPcGF/exec";

let dashboardData = null;

let currentPeriod = "lastMonth";

let categoryData = {};

const chartTabs =
document.querySelectorAll(".chart_tab");

const dateInput =
document.getElementById("date");

const typeSelect =
document.getElementById("type");

const categorySelect =
document.getElementById("category");

const amountInput =
document.getElementById("amount");

const noteInput =
document.getElementById("note");

const saveButton =
document.getElementById("save");

const sheetButton =
document.getElementById("sheetBtn");

const SHEET_URL =
"https://docs.google.com/spreadsheets/d/1dFYidVyTWDljbhNwUR7ASsZ80_0g8gNl7f6Z1NHMHqE/edit";

let currentIncome = 0;
let currentExpense = 0;

window.addEventListener("DOMContentLoaded", async () => {

    const today = new Date();

    dateInput.value =
        today.toISOString().split("T")[0];

    await Promise.all([
        loadAllCategories(),
        loadDashboard()
    ]);

});

typeSelect.addEventListener(
"change",
loadCategories
);

saveButton.addEventListener(
"click",
saveRecord
);

sheetButton.addEventListener(
"click",
() => {


    window.open(
        SHEET_URL,
        "_blank"
    );

}

);

chartTabs.forEach(tab => {

    tab.addEventListener("click", () => {

        chartTabs.forEach(t => {
            t.classList.remove("active");
        });

        tab.classList.add("active");

        currentPeriod =
            tab.dataset.period;

        updateChart();

        updateLegend();

    });

});

function loadCategories() {

    const type = typeSelect.value;

    // console.log("目前選擇:", type);
    // console.log("對應資料:", categoryData[type]);

    const categories =
        categoryData[type] || [];

    categorySelect.innerHTML = `
        <option value="" disabled selected>
            分類
        </option>
    `;

    categories.forEach(item => {

        const option =
            document.createElement("option");

        option.value = item;
        option.textContent = item;

        categorySelect.appendChild(option);

    });

    updateSelectColor(categorySelect);

}

async function saveRecord() {

    if (
        !dateInput.value ||
        !typeSelect.value ||
        !categorySelect.value ||
        !amountInput.value
    ) {

        alert("請完成必填欄位");
        return;

    }

    const data = {

        date: dateInput.value,

        type: typeSelect.value,

        category: categorySelect.value,

        amount: Number(amountInput.value),

        note: noteInput.value

    };

    try {

        await fetch(API_URL, {

            method: "POST",

            body: JSON.stringify(data)

        });

        await loadDashboard();

        if (data.type === "收入") {

            dashboardData.income += data.amount;

        } else {

            dashboardData.expense += data.amount;

            // 更新本月
            const thisMonth =
                dashboardData.charts.thisMonth;

            thisMonth[data.category] =
                (thisMonth[data.category] || 0) + data.amount;

            // 更新今年
            const year =
                dashboardData.charts.year;

            year[data.category] =
                (year[data.category] || 0) + data.amount;

        }

        updateSummary();

        updateChart();

        updateLegend();

        amountInput.value = "";

        noteInput.value = "";
            
        typeSelect.selectedIndex = 0;
            
        categorySelect.innerHTML = `
            <option value="" disabled selected>
                分類
            </option>
        `;
            
        updateSelectColor(typeSelect);
        updateSelectColor(categorySelect);
            
        showToast("儲存成功");

    }

    catch(error) {

        console.error(error);

        showToast("儲存失敗");

    }

}

async function loadDashboard() {

    const response =
        await fetch(
            `${API_URL}?action=dashboard`
        );

    dashboardData = await response.json();

    currentPeriod = "thisMonth";

    updateSummary();
    updateChart();
    updateLegend();

}

function updateSummary() {

    currentIncome = dashboardData.income;
    currentExpense = dashboardData.expense;

    document.getElementById("income")
        .textContent =
        "NT$" +
        currentIncome.toLocaleString();

    document.getElementById("expense")
        .textContent =
        "NT$" +
        currentExpense.toLocaleString();

}

function updateSelectColor(select) {

    if (!select.value) {
        select.style.color = "#999";
    } else {
        select.style.color = "#000";
    }

}

document.querySelectorAll("select").forEach(select => {

    updateSelectColor(select);

    select.addEventListener("change", () => {
        updateSelectColor(select);
    });

});

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent =
        message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 1500);

}

function getAllCategories() {

  const ss =
    SpreadsheetApp.openById(SPREADSHEET_ID);

  const sheet =
    ss.getSheetByName("Settings");

  const data =
    sheet.getDataRange().getValues();

  const result = {};

  for (let i = 1; i < data.length; i++) {

    const type =
      String(data[i][0]).trim();

    const category =
      String(data[i][1]).trim();

    if (!result[type]) {
      result[type] = [];
    }

    result[type].push(category);

  }

  return ContentService
    .createTextOutput(
      JSON.stringify(result)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}

async function loadAllCategories() {

    const response =
        await fetch(
            `${API_URL}?action=allCategories`
        );

    categoryData =
        await response.json();

    console.log(
        "categoryData:",
        JSON.stringify(categoryData, null, 2)
    );

}


const tabs = document.querySelectorAll(".chart_tab");
const indicator = document.querySelector(".tab_indicator");

function moveIndicator(el){
    indicator.style.width = el.offsetWidth + "px";
    indicator.style.transform = `translateX(${el.offsetLeft}px)`;
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {

        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        moveIndicator(tab);
    });
});

// 初始化位置
window.addEventListener("load", () => {
    const active = document.querySelector(".chart_tab.active");
    moveIndicator(active);
});

// 儲存按鈕回彈
const saveDiv = document.querySelector(".save_div");

saveButton.addEventListener("pointerdown", () => {
    saveDiv.classList.add("press");
});

function releaseButton(){
    saveDiv.classList.remove("press");
    saveDiv.classList.add("bounce");
}

saveButton.addEventListener("pointerup", releaseButton);
saveButton.addEventListener("pointercancel", releaseButton);
saveButton.addEventListener("pointerleave", releaseButton);
saveDiv.addEventListener("animationend", () => {
    saveDiv.classList.remove("bounce");
});