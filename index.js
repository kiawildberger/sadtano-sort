let table = document.getElementById('table'), 
    filter = document.getElementById("filter"), 
    button = document.querySelector('input[type="button"]'),
    countresults = document.getElementById("countresults"),
    ssort = document.getElementById("ssort");
    sortdrop = document.getElementById("sortmode-drop")
let json, fullarr = [], neversorted = [];
let ordered, others; // ordered does not have others in it

function createTR(i) {
    let colors = ["#FF5F33", "#CC4C29", "#96381E", "#85321B", "#692715", "#36140B", "#14693D", "#1D9657", "#27CC77", "#30FF94", "#30FF94"]
    let tr = document.createElement("tr")
    let score = i.flatscore || "no rating";
    let color = "white"
    if(parseFloat(i.flatscore) === parseFloat(i.rating.toString().split("/")[0])) color = colors[parseFloat(i.flatscore.toString().trim())]
    let textcolor = "black"
    if(parseFloat(i.flatscore) === 5) textcolor = "white"
    if(i.rating instanceof Array) score = i.rating[0]
    tr.innerHTML = `<td class="thumb"><a href="https://youtube.com/watch?v=${i.id}" target="_blank"><img src="${i.thumb}"/></a></td>
    <td class="album">${i.album}</td>
    <td class="artist">${i.artist}</td>
    <td class="rating" style="background-color:${color || "#000000" };color:${textcolor}">${i.rating}</td>
    <td class="date">${i.nicedate}</td>`
    table.appendChild(tr)
    tr.addEventListener("click", () => console.log(i))
}
function resetTR() {
    Array.from(document.querySelectorAll("tr")).forEach(e => {if(e.id != "headers")e.remove()})
}

function find(album) {
    return neversorted.filter(x => x.album == album) || fullarr.filter(x => x.album == album)
}
async function populate() {
    let data = await fetch("https://raw.githubusercontent.com/kiawildberger/fantanosort/master/result.json")
    let order_data = await fetch("https://raw.githubusercontent.com/kiawildberger/fantanosort/master/ordered.json")
    ordered = await order_data.json()
    others = ordered[0]
    ordered.shift()
    json = await data.json()
    console.log(Object.values(json).length)
    Object.values(json).forEach(i => {
        if(i.rating instanceof Array) i.rating = i.rating[0]
        if(i.rating === null) i.rating = "1/10"
        if(i.rating === "c") i.rating = "classic"
        i.flatscore = parseFloat(i.rating.toString().replace("/10")); // some are NaN probably so jus make those special cases at the bottom ig (or the top???)
        i.flatscore = (i.flatscore > 10) ? i.flatscore = 7 : i.flatscore; // 7 is average?? idk should be in override.js so ig it doesnt matter too much
        if(!i.artist||!i.album) return;
        fullarr.push(i)
        neversorted.push(i)
        createTR(i)
    })
}

// all this just so it shows the "** reviews loaded" smh
async function start() { await populate(); countresults.innerText=fullarr.length+" reviews loaded" } start()

filter.addEventListener("keypress", e => { if(e.key === "Enter") process() })
button.addEventListener("click", process)

function filternsort(fvalue) {
    // this is for all of them but ordered
    if(!fvalue) return { bydate: neversorted.slice(), ordered: ordered.flat() }
    let sorting = ordered.slice().flat().reverse()
    sorting = sorting.filter(x => {
        if(x.artist !== undefined && x.artist.toLowerCase().includes(fvalue.toLowerCase()) ||
           x.album !== undefined && x.album.toLowerCase().includes(fvalue.toLowerCase())) return x;
    })
    let othersfiltered = others.slice().filter(x => {
        if(x.artist !== undefined && x.artist.toLowerCase().includes(fvalue.toLowerCase()) ||
           x.album !== undefined && x.album.toLowerCase().includes(fvalue.toLowerCase())) return x;
    })
    // and here they are by date
    let bydate = neversorted.slice().filter(x => {
        if(x.artist !== undefined && x.artist.toLowerCase().includes(fvalue.toLowerCase()) ||
           x.album !== undefined && x.album.toLowerCase().includes(fvalue.toLowerCase())) return x;
    })
    return {
        ordered: sorting.flat(),
        orderedothers: othersfiltered.flat(),
        bydate: bydate.flat()
    }
}

let sortedarray = neversorted, issorted = false, total, isfiltered = false;
function process() { // this should be called filter but thats the element smh
    if(filter.value === "") {
        resetTR()
        neversorted.forEach(e => { // id like to do this in one line but guess not lmao
            createTR(e)
        })
        countresults.innerText = neversorted.length+" reviews loaded"
        sortdrop.value = 'null'
        return;
    }
    let fns = filternsort(filter.value)
    switch(sortmode) {
        case 0:
            total = fns.bydate
            break;
        case 1: // 10s
            total = fns.ordered.reverse().concat(fns.orderedothers)
            break;
        case 2: // 0s
            total = fns.ordered.concat(fns.orderedothers)
            break;
        case 3:
            total = fns.bydate.reverse()
            break;
    }
    if(!isfiltered && (sortmode === 1 || sortmode === 2)) {
        total = total.concat(others)
    }
    resetTR()
    // if(!total) total = Array.from(artists.concat(albums))
    if(total.length === 0) {
        countresults.innerText = "nothing found for \""+filter.value+"\""
    } else {
        if(filter.value!="") countresults.innerText = total.length +" results found for \""+filter.value+"\""
        total.forEach(e => { createTR(e) })
    }
    if(filter.value==="") countresults.innerText = neversorted.length+" reviews loaded"
    isfiltered = true;
}

let arraytosort, others_tosort = []

// when filtered, highest and lowest dont work. when sorted by highest or lowest, filtering works.

function sort(sortmode) {
    let total;
    let fns = filternsort(filter.value)
    if(isfiltered) fns.ordered = fns.ordered.reverse()
    switch(sortmode) {
        case 0:
            total = fns.bydate
            break;
        case 1: // 10s
            total = fns.ordered.reverse().concat(fns.orderedothers)
            break;
        case 2: // 0s
            total = fns.ordered.concat(fns.orderedothers)
            break;
        case 3:
            total = fns.bydate.reverse()
            break;
    }
    if(!isfiltered && (sortmode === 1 || sortmode === 2)) {
        total = total.concat(others)
    }
    resetTR();
    total.flat().forEach(e => {
        if(e && e.rating === null || e.rating[0] === null) e.rating = "no rating";
        createTR(e)
    })
    if(total.length === 0) {
        countresults.innerText = "nothing found for \""+filter.value+"\""
    } else {
        if(filter.value!="") countresults.innerText = total.length +" results found for \""+filter.value+"\""
    }
    if(filter.value==="") countresults.innerText = neversorted.length+" reviews loaded"
}

let sortmode = 0; // 0 neutral 1 ascending 2 descending
let sortmodecodes = ["latest", "highest", "lowest", "oldest"]
sortdrop.addEventListener("change", () => {
    if(sortdrop.value === "null") return;
    sortmode = parseInt(sortdrop.value);
    // sortmode = (sortmode === 3) ? 0 : sortdrop.value;
    ssort.innerHTML = sortmodecodes[parseInt(sortmode)]
    if(sortmode > 0) { issorted = true; } else { issorted = false; }
    sort(parseInt(sortmode))
})