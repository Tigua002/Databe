const state = {
    dbInUse: null,
    tableInUse: null,
    validIP: false,
    blackListedDBs: ["information_schema", "mysql", "performance_schema", "sys"],
    user: null
};

//Header styling
document.getElementsByClassName("navItem")[1].style.background = "#333333";


const getToken = async (token) => {
    if (!token) {
        window.location.assign('/login')
        localStorage.clear()
        return false
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
                    return false
                } else {
                    state.user = JSON.parse(data).user
                    return true
                }
            });
    }
    return false
}
getToken(localStorage.getItem('token'));


const loadDatabases = async () => {
    await fetch('/checkToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: localStorage.getItem('token') })
    }).then(response => response.text())
        .then(data => {
            if (data == 'Unauthorized') {
                console.log("Unauthorized")
                window.location.assign('/login')
                localStorage.clear()
                return false
            } else {
                state.user = JSON.parse(data).user
                return true
            }
        });
    try {
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
            console.log(db);

            if (state.blackListedDBs.includes(db.base)) return;
            let div = document.createElement("div")
            div.setAttribute("class", "database flex")

            let h1 = document.createElement("h1");
            h1.setAttribute("class", "databaseTitle");
            h1.textContent = sanitizeHTML(db.base);

            let other = document.createElement("div")
            other.setAttribute("class", "databaseOther flex")

            let img = document.createElement("img")
            img.setAttribute("class", "databaseImage")
            if (db.picture && db.picture != "NULL") {
                img.setAttribute("src", "../pictures/" + db.picture)
            } else {
                img.setAttribute("src", "../pictures/a-drawing-of-a-planet-with-a-white-background-the--TY7DezedSea11RaW_FXM-w-Bxfwz2PeT6SqBgdEl_TC_w.webp")
            }


            let owner = document.createElement("h1")
            owner.setAttribute("class", "databaseOwner")
            owner.innerHTML = db.owner

            other.appendChild(img)
            other.appendChild(owner)

            div.appendChild(h1)
            div.append(other)
            fragment.appendChild(div);

            div.addEventListener("click", () => {
                state.dbInUse = db.base
                loadTables(db.base)
            })

        });

        document.getElementsByClassName("databaseDisplays")[0].appendChild(fragment);
    } catch (error) {
        console.error(error);
        alert("An error occurred while fetching databases.");
    }
}
const loadTables = async (database) => {
    console.log(database);

    try {
        document.getElementsByClassName("BackButton")[0].textContent = database
        document.getElementsByClassName("tableHolder")[0].innerHTML = '';
        document.getElementsByClassName("databaseDiv")[0].style.height = '100%';
        document.getElementsByClassName("dataInsertBtn")[0].setAttribute("disabled", "false");
        document.getElementById("alterTable").setAttribute("disabled", "false");
        /*        
       document.getElementsByClassName("BlueBlackBtn")[0].removeAttribute("disabled");
       document.getElementsByClassName("BlueBlackBtn")[1].removeAttribute("disabled");
       document.getElementById("createUser").style.display = "flex";
       document.getElementsByClassName("dbUserInfo")[0].style.display = "flex";
       
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
       `; */
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
        console.log(tables);

        tables.forEach(table => {
            let h1 = document.createElement("h1");
            h1.setAttribute("class", "table flex");
            h1.textContent = sanitizeHTML(table[`Tables_in_${database}`]);
            fragment.appendChild(h1);

            h1.addEventListener("click", () => {
                resetStyles(document.getElementsByClassName("table"), "#333333", "#66B2FF");
                h1.style.background = "#444444";
                h1.style.color = "#66b2ff";
                loadData(database, table[`Tables_in_${database}`]);
            });
        });

        document.getElementsByClassName("tableHolder")[0].appendChild(fragment);
    } catch (error) {
        console.log(error.message);
        alert("An error occurred while fetching tables.");
    }
};


const sanitizeHTML = (str) => {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};
const resetStyles = (elements, background, color) => {
    Array.from(elements).forEach(element => {
        element.style.background = background;
        element.style.color = color;
    });
};

const loadData = async (database, table) => {
    document.getElementsByClassName("dataInsertBtn")[0].removeAttribute("disabled");
    document.getElementById("alterTable").removeAttribute("disabled");
    state.tableInUse = table;
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
    addRowBtn.innerHTML = "New column"
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



document.getElementsByClassName("BackButton")[0].addEventListener("click", () => {
    document.getElementsByClassName("databaseDiv")[0].style.height = '0%';
    document.getElementsByClassName("TableDisplay")[0].innerHTML = "";
})
document.getElementsByClassName("BackButtonSVG")[0].addEventListener("click", () => {
    document.getElementsByClassName("databaseDiv")[0].style.height = '0%';
    document.getElementsByClassName("TableDisplay")[0].innerHTML = "";
})


document.getElementsByClassName("ModalClose")[0].addEventListener("click", () => closeModal("NewDatabaseModal"));
document.getElementsByClassName("ModalClose")[1].addEventListener("click", async () => { closeModal("DatabaseUserModal"); });
document.getElementsByClassName("ModalClose")[2].addEventListener("click", () => closeModal("InsertDataModal"));
document.getElementsByClassName("ModalClose")[3].addEventListener("click", () => closeModal("NewTableModal"));
document.getElementsByClassName("ModalClose")[5].addEventListener("click", () => closeModal("AppendTableModal"));


document.getElementById("closeModify").addEventListener("click", () => {
    closeModal("ModifyTable")
    loadData(state.dbInUse, state.tableInUse)
});
document.getElementById("closeBulk").addEventListener("click", () => closeModal("BulkDataModal"))

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

// bulk insert
document.getElementById("bulkInsert").addEventListener("click", async () => {
    let info = document.getElementsByClassName("BulkArea")[0].value;
    try {
        let parsedInfo = JSON.parse(info); // Directly parse the string
        console.log('Parsed data:', parsedInfo);
        let response = await fetch(`/describe/Table/${state.dbInUse}/${state.tableInUse}`, {
            method: "GET"
        })
        let tableData = await response.json()
        console.log(tableData);

        /*         let tableRows = ''
                for (let i = 0; i < tableData.length; i++) {
                    if (tableData[i].Field == "ID") {
                        continue;
                    }
                    tableRows += tableData[i].Field + " "
                    
                }
        
         */
        let dataConversion = [];
        for (let i = 0; i < document.getElementsByClassName("bulkTable").length; i++) {
            const element = document.getElementsByClassName("bulkTable")[i];
            let desiredValue = element.parentElement.getElementsByClassName("bulkInput")[0].value;


            let arr = { [desiredValue]: element.innerHTML }; // Use computed property name
            dataConversion.push(arr)
        }
        console.log(dataConversion);
        console.log(dataConversion[0]);




        /*         for (let i = 0; i < parsedInfo.length; i++) {
        
                    
                    let row = parsedInfo[i]
                    let string = `INSERT INTO ${state.dbInUse}.${state.tableInUse} (${tableRows}) VALUES (${valueString}); `
        
                    
                } */
    } catch (e) {
        console.log(e);
        alert('Faulty data, paste this inn to ChatGPT: \n i am trying to JSON.parse a string but it does not work, here is the string:');
    }
});

loadDatabases()