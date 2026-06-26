const API_URL =
"https://script.google.com/macros/s/AKfycbwA25JWzqAZi5g-a8SJVfj5r-8CwLHsPP1jpf3zO0ucz7XkkX3RbAOsTgXTNme_m_DV/exec";

let categoryData = {};

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
        loadSummary()
    ]);

    await loadExpenseChart();

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

        if (data.type === "收入") {

            currentIncome += data.amount;

        } else {

            currentExpense += data.amount;

        }

        document.getElementById("income")
            .textContent =
            "NT$" +
            currentIncome.toLocaleString();

        document.getElementById("expense")
            .textContent =
            "NT$" +
            currentExpense.toLocaleString();

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

async function loadSummary() {

    const response =
        await fetch(
            `${API_URL}?action=summary`
        );

    const data =
        await response.json();

    currentIncome = data.income;
    currentExpense = data.expense;

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

