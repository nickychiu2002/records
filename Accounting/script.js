const API_URL =
"https://script.google.com/macros/s/AKfycbyvAn0ct23XPnMm9A3lMhIwbjC-yM4YNge70uMJJ97H3bGQgCwftgCn_VlIWrnMS97y/exec";

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

window.addEventListener("DOMContentLoaded", async () => {


const today = new Date();

dateInput.value =
    today.toISOString().split("T")[0];

await loadCategories();

await loadSummary();


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

async function loadCategories() {


const type =
    typeSelect.value;

const response =
    await fetch(
        `${API_URL}?action=categories&type=${type}`
    );

const categories =
    await response.json();

categorySelect.innerHTML =
`
<option value="" disabled selected>
    分類
</option>
`;

categories.forEach(item => {

    const option =
        document.createElement("option");

    option.value =
        item;

    option.textContent =
        item;

    categorySelect.appendChild(option);

});


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

    amountInput.value = "";

    noteInput.value = "";

    await loadSummary();

    alert("儲存成功");

}

catch(error) {

    console.error(error);

    alert("儲存失敗");

}


}

async function loadSummary() {


const response =
    await fetch(
        `${API_URL}?action=summary`
    );

const data =
    await response.json();

document.getElementById("income")
    .textContent =
    "NT$" +
    data.income.toLocaleString();

document.getElementById("expense")
    .textContent =
    "NT$" +
    data.expense.toLocaleString();


}
