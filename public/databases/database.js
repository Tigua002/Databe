const state = {
    dbInUse: null,
    tableInUse: null,
    validIP: false,
    blackListedDBs: ["information_schema", "mysql", "performance_schema", "sys"],
    user: null
};

const getToken = async (token) => {
    if (!token) {
        window.location.assign('/login')
        localStorage.clear()
    } else {
        await fetch('/checkToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token })
        }).then(response => response.text())
            .then(data => {
                if (data == 'Unauthorized') {
                    console.log("Unauthorized")
                    window.location.assign('/login')
                    localStorage.clear()
                } else {
                    state.user = JSON.parse(data).user
                    fetchDatabases()
                }
            });
    }
}
getToken(localStorage.getItem('token'));
//Header styling
document.getElementsByClassName("navItem")[1].style.background = "#66b2ff";
document.getElementsByClassName("navImg")[1].setAttribute("stroke", "#333333");



const fetchDatabases = async () => {
    try {
        document.getElementsByClassName("databaseHeader")[0].innerHTML = '<h1 class="SmlBBtn">New Database</h1>';
        document.getElementsByClassName("SmlBBtn")[0].addEventListener("click", () => openModal("NewDatabaseModal"));
        const response = await fetch("/FetchDatabases",
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ owner: state.user })
            });
        if (!response.ok) throw new Error("Failed to fetch databases");

        const databases = await response.json();
        const fragment = document.createDocumentFragment();

        databases.forEach(db => {
            if (state.blackListedDBs.includes(db.base)) return;

            let h1 = document.createElement("h1");
            h1.setAttribute("class", "databaseItem flex");
            h1.textContent = sanitizeHTML(db.base);
            fragment.appendChild(h1);

            h1.addEventListener("click", () => {
                resetStyles(document.getElementsByClassName("databaseItem"), "none", "#ffffff");
                h1.style.background = "#ffffff";
                h1.style.color = "#333333";
                state.dbInUse = db.base;
                loadTables(db.base);
            });
        });

        document.getElementsByClassName("databaseHeader")[0].appendChild(fragment);
    } catch (error) {
        console.error(error);
        alert("An error occurred while fetching databases.");
    }
};

const loadTables = async (database) => {

    try {
        document.getElementsByClassName("dataInsertBtn")[0].setAttribute("disabled", "true");
        document.getElementById("alterTable").setAttribute("disabled", "true");
        document.getElementsByClassName("BlueBlackBtn")[0].removeAttribute("disabled");
        document.getElementsByClassName("BlueBlackBtn")[1].removeAttribute("disabled");
        document.getElementById("createUser").style.display = "flex";
        document.getElementsByClassName("dbUserInfo")[0].style.display = "flex";
        document.getElementsByClassName("tableHolder")[0].innerHTML = '';
        document.getElementsByClassName("TableDisplay")[0].innerHTML = "";
        document.getElementsByClassName("tableRows")[0].innerHTML = `
        <input type="text" class="TableName" required placeholder="Table Name" maxlength="50">
        <h1 class="ModalH1">ROWS:</h1>
        <div class="newRow">
            <input type="text" class="RowName" required value="ID" maxlength="50" disabled>
            <select class="TableType" disabled>
                <option class="typeOptions" value="int">Number</option>
                <option class="typeOptions" value="varchar(255)">Short Text</option>
                <option class="typeOptions" value="LONGTEXT">Multiple Lines of Text</option>
                <option class="typeOptions" value="custom">Custom</option>
            </select>
            <input type="text" class="RowCustom" placeholder="Column Type">
        </div>
        `;
        const data = {
            token: localStorage.getItem('token'),
            db: database
        }

        const response = await fetch(`/get/Tables/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to fetch tables");

        const tables = await response.json();
        const fragment = document.createDocumentFragment();

        tables.forEach(table => {
            let h1 = document.createElement("h1");
            h1.setAttribute("class", "table flex");
            h1.textContent = sanitizeHTML(table[`Tables_in_${database}`]);
            fragment.appendChild(h1);

            h1.addEventListener("click", () => {
                resetStyles(document.getElementsByClassName("table"), "#333333", "#66B2FF");
                h1.style.background = "#66B2FF";
                h1.style.color = "#333333";
                loadData(database, table[`Tables_in_${database}`]);
            });
        });

        document.getElementsByClassName("tableHolder")[0].appendChild(fragment);
    } catch (error) {
        console.error(error.message);
        alert("An error occurred while fetching tables.");
    }
};

// Function to sanitize HTML to prevent XSS attacks
const sanitizeHTML = (str) => {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};

// Function to reset styles
const resetStyles = (elements, background, color) => {
    Array.from(elements).forEach(element => {
        element.style.background = background;
        element.style.color = color;
    });
};

const loadData = async (database, table) => {
    state.tableInUse = table;
    document.getElementsByClassName("dataInsertBtn")[0].removeAttribute("disabled");
    document.getElementById("alterTable").removeAttribute("disabled");
    document.getElementsByClassName("TableDisplay")[0].innerHTML = "";

    const info = {
        token: localStorage.getItem('token'),
        db: database,
        table: table
    }

    const response = await fetch(`/get/columns/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(info)
    });
    if (!response.ok) throw new Error("Failed to fetch columns");

    let columns = await response.json();
    let tableRow = document.createElement("tr");
    tableRow.setAttribute("class", "tableRow")
    document.getElementsByClassName("TableDisplay")[0].appendChild(tableRow);
    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        let tableData = document.createElement("td");
        tableData.setAttribute("class", "tableDesc");
        tableData.innerHTML = column.Field;
        tableRow.appendChild(tableData);
        tableData.style.borderTop = "solid #444444 2px"
        if (i == 0) {
            tableData.style.borderTopLeftRadius = ".5vw"
            tableData.style.borderBottomLeftRadius = ".5vw"
            tableData.style.borderLeft = "solid #444444 2px"
        } else if (i + 1 == columns.length) {
            tableData.style.borderTopRightRadius = ".5vw"
            tableData.style.borderBottomRightRadius = ".5vw"
            tableData.style.borderRight = "solid #444444 2px"

        }
    }
    let addRowBtn = document.createElement("button")
    addRowBtn.setAttribute("class", "addRowBtn")
    addRowBtn.innerHTML = "New Row"
    tableRow.appendChild(addRowBtn)
    addRowBtn.addEventListener("click", () => {
        openModal("AppendTableModal")
    })
    const SelectData = {
        token: localStorage.getItem('token'),
        db: database,
        table: table
    }

    const dataResponse = await fetch(`/Select/data/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(SelectData)
    });
    if (!dataResponse.ok) throw new Error("Failed to fetch data");

    let data = await dataResponse.json();
    data.forEach(row => {
        let tableDataRow = document.createElement("tr");
        tableDataRow.setAttribute("class", "tableRow")
        document.getElementsByClassName("TableDisplay")[0].appendChild(tableDataRow);

        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            let tableData = document.createElement("td");
            tableData.setAttribute("class", "tableData");
            tableData.innerHTML = row[column.Field] || "NULL";
            if (tableData.innerHTML == "NULL") {
                tableData.style.opacity = ".5"
            }
            tableDataRow.appendChild(tableData);
            // if (i == 0) {
            //     tableData.style.borderLeft = "solid #444444 2px"
            // } else if ((i + 1) == columns.length) {
            //     tableData.style.borderRight = "solid #444444 2px"
            // }
        }

        let editDiv = document.createElement("td")
        editDiv.setAttribute("class", "tableEdit")
        let editBtn = document.createElement("button")
        editBtn.setAttribute("class", "editRowBtn")
        editBtn.innerHTML = "EDIT"
        editDiv.appendChild(editBtn)
        tableDataRow.appendChild(editDiv)
        editBtn.style.background = "#B22222"
        editBtn.addEventListener("click", async (event) => {
            let parent = event.target.parentElement.parentElement;
            let collection = Array.from(parent.getElementsByClassName("tableData")); // Convert to array
            let id = collection[0].innerHTML;

            if (event.target.style.background == "rgb(178, 34, 34)") {


                for (let i = 1; i < collection.length; i++) {

                    let element = collection[i];

                    let input = document.createElement("textarea");
                    input.value = element.textContent;
                    input.type = "text";
                    input.setAttribute("class", "tableInput");
                    input.focus()
                    input.select()

                    // Create a new td element if working with a table
                    let newTd = document.createElement("td");
                    newTd.appendChild(input);
                    newTd.setAttribute("class", "tableTD")

                    // Replace the old td element with the new one
                    element.parentNode.replaceChild(newTd, element);
                    event.target.innerHTML = "SUBMIT"
                    event.target.style.background = "#66B2FF"
                    event.target.style.color = "#ffffff"

                }
            } else {

                let itemArray = [];
                let inputs = Array.from(parent.getElementsByClassName("tableInput")); // Convert to array

                inputs.forEach((element) => {
                    itemArray.push(element.value);
                    let h1 = document.createElement("td");
                    h1.setAttribute("class", "tableData");
                    h1.innerHTML = element.value;
                    let parentElm = element.parentElement
                    parentElm.parentNode.replaceChild(h1, parentElm);
                });

                let fieldArray = []

                for (let i = 1; i < document.getElementsByClassName("tableDesc").length; i++) {
                    let element = document.getElementsByClassName("tableDesc")[i];
                    fieldArray.push(element.innerHTML)
                }

                const data = {
                    db: state.dbInUse,
                    tbl: state.tableInUse,
                    id: id,
                    array: itemArray,
                    fieldArr: fieldArray
                }

                await fetch("/update/row", {
                    method: "POST",
                    headers: {
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify(data)
                })
                event.target.innerHTML = "EDIT"
                event.target.style.background = "#B22222"
                event.target.style.color = "#ffffff"
            }
        });
    });

}


const openModal = (name) => {
    let modal = document.getElementsByClassName(name)[0];
    modal.showModal();
    modal.style.display = "flex";
};

const closeModal = (name) => {
    let modal = document.getElementsByClassName(name)[0];
    modal.close();
    modal.style.display = "none";
};

document.getElementsByClassName("ModalClose")[0].addEventListener("click", () => closeModal("NewDatabaseModal"));
document.getElementsByClassName("ModalClose")[1].addEventListener("click", async () => { closeModal("DatabaseUserModal"); });
document.getElementsByClassName("ModalClose")[2].addEventListener("click", () => closeModal("InsertDataModal"));
document.getElementsByClassName("ModalClose")[3].addEventListener("click", () => closeModal("NewTableModal"));
document.getElementsByClassName("ModalClose")[4].addEventListener("click", () => closeModal("AppendTableModal"));
document.getElementsByClassName("BlueBlackBtn")[1].addEventListener("click", () => openModal("NewTableModal"));
document.getElementsByClassName("ModalClose")[5].addEventListener("click", () => {
    closeModal("ModifyTable")
    loadData(state.dbInUse, state.tableInUse)
});

// opens the alterTable menu
document.getElementById("alterTable").addEventListener("click", async () => {
    document.getElementsByClassName("ModifyHolder")[0].innerHTML = ""
    openModal("ModifyTable")
    let response = await fetch(`/get/columns/${state.dbInUse}/${state.tableInUse}`, {
        method: "GET"
    })
    let data = await response.json()

    for (let i = 1; i < data.length; i++) {
        let div = document.createElement("div")
        let separator = document.createElement("div")
        let h1 = document.createElement("h1")
        let select = document.createElement("h1")
        let btnDiv = document.createElement("div")
        let btn = document.createElement("button")
        btnDiv.appendChild(btn)
        separator.appendChild(h1)
        separator.appendChild(select)
        div.appendChild(separator)
        div.appendChild(btnDiv)
        h1.innerHTML = data[i].Field
        select.innerHTML = data[i].Type
        btn.innerHTML = "DELETE"
        btnDiv.setAttribute("class", "modifyBtnDiv")
        separator.setAttribute("class", "modifySeparator flex")
        div.setAttribute("class", "flex modifyDiv")
        h1.setAttribute("class", "modifyH1")
        select.setAttribute("class", "modifySelect")
        btn.setAttribute("class", "modifyBtn")
        document.getElementsByClassName("ModifyHolder")[0].appendChild(div)
        btn.addEventListener("click", async () => {
            const info = {
                db: state.dbInUse,
                table: state.tableInUse,
                column: data[i].Field
            }
            await fetch(`/drop/column/`, {
                method: "POST",
                headers: {
                    'Content-Type': "application/json"
                },
                body: JSON.stringify(info)
            })
            closeModal("ModifyTable")
            document.getElementById("alterTable").click()
        })
    }
})
//open newUserModal
document.getElementsByClassName("BlueBlackBtn")[0].addEventListener("click", async () => {
    openModal("DatabaseUserModal")
    let resopnse = await fetch("/get/users/" + state.dbInUse, {
        method: "GET"
    })
    let data = await resopnse.json()
    if (data.length == 0) {
        let user = data[0]
        document.getElementsByClassName("dbUserInfo")[0].style.display = "none"


    } else {
        document.getElementById("createUser").style.display = "none"
        document.getElementsByClassName("dbUserValue")[0].innerHTML = data[0].username
        document.getElementsByClassName("dbUserValue")[1].innerHTML = data[0].password
        document.getElementsByClassName("dbUserValue")[2].innerHTML = "172.104.242.87"
        console.log(data[0].host);

        if (data[0].host == "%") {
            document.getElementsByClassName("dbUserValue")[3].innerHTML = "all"
        }
        else {
            document.getElementsByClassName("dbUserValue")[3].innerHTML = data[0].host

        }
    }
});

// opens the insert data modal
document.getElementsByClassName("dataInsertBtn")[0].addEventListener("click", () => {
    document.getElementsByClassName("dataInsertDiv")[0].innerHTML = "";
    for (let i = 1; i < document.getElementsByClassName("tableDesc").length; i++) {
        let div = document.createElement("div");
        let h1 = document.createElement("h1");
        let input = document.createElement("input");

        div.setAttribute("class", "dataInsertRow");
        h1.setAttribute("class", "InsertDataH1");
        input.setAttribute("class", "InsertDataInp");
        input.setAttribute("placeholder", "...");
        input.setAttribute("type", "text");
        h1.innerHTML = document.getElementsByClassName("tableDesc")[i].innerHTML;

        document.getElementsByClassName("dataInsertDiv")[0].appendChild(div);
        div.appendChild(h1);
        div.appendChild(input);
    }
    openModal("InsertDataModal");
});

// creates a database
document.getElementsByClassName("ModalBtn")[0].addEventListener("click", async () => {
    let dbName = document.getElementsByClassName("ModalInp")[0].value;
    const data = { db: dbName };
    if (!isValidMySQLDatabaseName(dbName, true)) {
        alert("Invalid Name")
        document.getElementsByClassName("ModalInp")[0].value = ""
        return
    }
    try {
        await fetch("/create/database", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal("NewDatabaseModal");
        fetchDatabases();
    } catch (error) {
        console.error("Failed to create database", error);
    }
});

// inreases the number of rows in a new table
document.getElementsByClassName("newTableRow")[0].addEventListener("click", () => {
    let div = document.createElement("div");
    let Nameinput = document.createElement("input");
    let DropDown = document.createElement("select");
    let varchar = document.createElement("option");
    let longtext = document.createElement("option");
    let int = document.createElement("option");
    let Custom = document.createElement("option");

    div.appendChild(Nameinput);
    div.appendChild(DropDown);
    DropDown.appendChild(varchar);
    DropDown.appendChild(longtext);
    DropDown.appendChild(int);
    DropDown.appendChild(Custom);

    div.setAttribute("class", "newRow");
    Nameinput.setAttribute("class", "RowName");
    Nameinput.setAttribute("required", "true");
    Nameinput.setAttribute("placeholder", "Column Name");
    Nameinput.setAttribute("maxlength", "50");
    Nameinput.setAttribute("type", "text");
    DropDown.setAttribute("class", "TableType");
    varchar.setAttribute("value", "varchar(255)");
    longtext.setAttribute("value", "longtext");
    int.setAttribute("value", "int");
    Custom.setAttribute("value", "custom");
    varchar.innerHTML = "Short Text";
    longtext.innerHTML = "Multiple Lines of Text";
    int.innerHTML = "Number";
    Custom.innerHTML = "Custom";
    let customInp = document.createElement("input")
    customInp.setAttribute("class", "RowCustom")
    customInp.setAttribute("placeholder", "Column Type")

    div.appendChild(customInp)

    document.getElementsByClassName("tableRows")[0].appendChild(div);
    DropDown.addEventListener("change", () => {
        if (DropDown.value == "custom") {
            customInp.style.display = "block"
        } else {
            customInp.style.display = "none"

        }
    })
});

// creates a new table
document.getElementsByClassName("TableForm")[0].addEventListener("submit", async (event) => {
    event.preventDefault();
    let tableName = document.getElementsByClassName("TableName")[0].value;
    let tableArray = [];
    if (!isValidMySQLDatabaseName(tableName, false)) {
        alert("invalid table name")
        return;
    }

    for (let i = 1; i < document.getElementsByClassName("newRow").length; i++) {
        let name = document.getElementsByClassName("RowName")[i].value;
        let type = document.getElementsByClassName("TableType")[i].value
        if (type == "custom") {
            type = document.getElementsByClassName("RowCustom")[i].value
        }



        tableArray.push({ name, type });
    }

    const data = {
        db: state.dbInUse,
        name: tableName,
        tableArray
    };

    try {
        const response = await fetch("/create/table", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to create table");
        closeModal("NewTableModal");
        loadTables(state.dbInUse);
    } catch (error) {
        console.error(error.message);
    }
});

// new column to a table
document.getElementById("newColumn").addEventListener("click", async (event) => {
    let tableName = event.target.parentElement.parentElement.getElementsByClassName("RowName")[0].value
    let option = event.target.parentElement.parentElement.getElementsByClassName("TableType")[0].value
    const data = {
        db: state.dbInUse,
        table: state.tableInUse,
        type: option,
        name: tableName
    }
    console.log(data);
    

    await fetch("/create/column", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    closeModal("AppendTableModal")
    loadData(state.dbInUse, state.tableInUse)
})

// Insert data
document.getElementById("InsertData").addEventListener("click", async () => {
    let dataArray = [];
    for (let i = 0; i < document.getElementsByClassName("InsertDataInp").length; i++) {
        let rowName = document.getElementsByClassName("InsertDataH1")[i].innerHTML;
        let rowValue = document.getElementsByClassName("InsertDataInp")[i].value;
        dataArray.push({ name: rowName, value: rowValue });
    }

    const data = {
        db: state.dbInUse,
        table: state.tableInUse,
        array: dataArray
    };

    try {
        const response = await fetch("/insert/data", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to insert data");
        closeModal("InsertDataModal");
        loadData(state.dbInUse, state.tableInUse);
    } catch (error) {
        console.error(error.message);
    }
});


// create a new user
document.getElementById("createUser").addEventListener("click", (event) => {
    // create input field
    if (document.getElementsByClassName("IpDiv")[0]) {
        document.getElementsByClassName("IpDiv")[0].remove()
    }
    event.target.parentElement.style.display = "none"
    let div = document.createElement("div")
    let label = document.createElement("h1")
    let ipInp = document.createElement("input")
    let btn = document.createElement("button")
    div.appendChild(label)
    div.appendChild(ipInp)
    div.appendChild(btn)

    div.setAttribute("class", "IpDiv")
    ipInp.setAttribute("class", "IpInp")
    label.setAttribute("class", "IpLabel")
    btn.setAttribute("class", "Ipbtn")
    btn.innerHTML = "CREATE"
    label.innerHTML = "IP:"
    ipInp.placeholder = "0.0.0.0 for all ip's"
    ipInp.type = "text"
    document.getElementsByClassName("DatabaseUserModal")[0].appendChild(div)
    ipInp.addEventListener("change", () => {

        state.validIP = isValidIPv4(ipInp.value)

    })
    // create user
    btn.addEventListener("click", async () => {
        if (!state.validIP) {
            alert("Invalid ip")
            return
        }
        let hostIP = document.getElementsByClassName("IpInp")[0].value
        const data = {
            db: state.dbInUse,
            host: hostIP
        }

        await fetch("/create/user", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        window.location.reload()

    })

})

// delete a table
document.getElementsByClassName("removeTbl")[0].addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete this table?")) {
        return;
    }

    const data = {
        db: state.dbInUse,
        table: state.tableInUse,
    };

    try {
        const response = await fetch('/delete/table', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        closeModal("ModifyTable");
        state.tableInUse = null;
        loadTables(state.dbInUse);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
});


// adds the code functionality to the user modal
for (let i = 0; i < document.getElementsByClassName("dbUserRow").length; i++) {

    document.getElementsByClassName("dbUserRow")[i].addEventListener("click", () => {

        const username = document.getElementsByClassName('dbUserValue')[i].innerText;
        navigator.clipboard.writeText(username).then(() => {
            const indicator = document.getElementsByClassName('indicator')[i];
            indicator.innerHTML = "Copied!";
            setTimeout(() => {
                indicator.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="#ffffff" class="indicatorSVG">
                    <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                </svg>
                
                `;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    })
}
function isValidIPv4(ip) {
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Pattern.test(ip);
}
function isValidMySQLDatabaseName(name, checkBlackList) {
    let value = checkBlackList || false
    // Check length
    if (name.length > 64) {
        alert("LENGTH")
        return false;
    }
    if (state.blackListedDBs[name] && value) {
        alert("BLACKLIST")
        return false;
    }

    // Check for invalid characters
    const invalidChars = /[^a-zA-Z0-9_$]/;
    if (invalidChars.test(name)) {
        alert("Characters")
        return false;
    }

    // Check if name starts with a dollar sign (deprecated in MySQL 8.0.32 and later)
    if (name.startsWith('$')) {
        alert("dollar")
        return false;
    }

    // Check for reserved words (simplified example, not exhaustive)
    const reservedWords = ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER"];
    if (reservedWords.includes(name.toUpperCase())) {
        alert("Reserved")
        return false;
    }

    // Check for trailing spaces
    if (name.endsWith(' ')) {
        alert("SPACING")
        return false;
    }

    // Check for ASCII NUL and supplementary characters
    if (name.includes('\0') || /[\u{10000}-\u{10FFFF}]/u.test(name)) {
        alert("SOME BULLSHIT")
        return false;
    }

    return true;
}

