//Header styling
document.getElementsByClassName("navItem")[1].style.background = "#66b2ff"
document.getElementsByClassName("navImg")[1].setAttribute("stroke", "#333333")
//Database Header styling
document.getElementsByClassName("databaseItem")[1].style.background = "#ffffff"
document.getElementsByClassName("databaseItem")[1].style.color = "#66B2FF"
//Table list styling
document.getElementsByClassName("table")[2].style.background = "#66B2FF"
document.getElementsByClassName("table")[2].style.color = "#333333"

const blackListedDBs = [
    "information_schema",
    "mysql",
    "performance_schema",
    "sys"

]
const fetchDatabases = async () => {
    const data = await fetch("/FetchDatabases", {
        method: "GET"
    });
    const databases = await data.json();
    for (let i = 0; i < databases.length; i++) {
        if (blackListedDBs.includes(databases[i].Database)) {
            continue
        }
        console.log(databases[i].Database)
        let h1 = document.createElement("h1")
        h1.setAttribute("class", "databaseItem flex")
        h1.innerHTML = databases[i].Database
        document.getElementsByClassName("databaseHeader")[0].appendChild(h1)
        h1.addEventListener("click", () => {
            for (let i = 0; i < document.getElementsByClassName("databaseItem").length; i++) {
                document.getElementsByClassName("databaseItem")[i].style.background = "none";
                document.getElementsByClassName("databaseItem")[i].style.color = "#ffffff";
                
            }
            h1.style.background = "#ffffff"
            h1.style.color = "#66B2FF"
            loadTables(databases[i].Database)
        })
    }
}


const loadTables = async (database) => {
    document.getElementsByClassName("tableHolder")[0].innerHTML = '<h1 class="BlueBlackBtn">Database Details</h1>'
    let data = {
        db: database
    }
    const response = await fetch("/get/Tables/" + database, {
        method: "GET"

    })
    let tables = await response.json()
    console.log(tables);
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i]
        let h1 = document.createElement("h1")
        h1.setAttribute("class", "table flex")
        h1.innerHTML = table["Tables_in_" + database]
        document.getElementsByClassName("tableHolder").appendChild(h1)
        
    }
    
}

fetchDatabases()

