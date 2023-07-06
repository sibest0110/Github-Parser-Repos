// GLOBALs
let currentPage = 1;
let currentPerPage = 10;
let reposAsObjects = [];
let tbody = document.getElementById("table_body");

// FUNCTIONs
function InitPage() {
    let b10 = document.getElementById('but_per_list_10');
    b10.dispatchEvent(new Event("click"));
}

function GetPressedButtonPerList() {
    return document.getElementById('but_per_list_' + currentPerPage);
}

function ButtonChangePage_handler(page) {
    currentPage = page;
    document.getElementById("but_page_cur").textContent = currentPage;
    GetReposFromWeb(currentPerPage, currentPage);
}

function ButtonPerList_Handler(but) {
    GetReposFromWeb(but.id.split('_').pop(), currentPage);
}

function UpdateElementsBeforTableBuilding(params) {
    document.querySelectorAll('.tfoot_button').forEach(b=>b.style.backgroundColor = 'white');
    GetPressedButtonPerList().style.backgroundColor = 'rgb(137, 156, 165)';
    
    // Прятать кнопку Назад, если на 1 странице
    if (currentPage == 1)
        document.getElementById('but_page_prev').style.display='none';
    else
        document.getElementById('but_page_prev').style.display='block';
}

function SortObjectsByProperty(objects, property = '', ascending = true) {
    if (property === ''){
        return objects;
    }

    let sorted = objects.sort(function(a,b){
        if (!ascending) {
            [a, b] = [b, a];
        }
        
        // Формата даты
        if (property === 'pushed_at') {
            if (Date.parse(a[property]) > Date.parse(b[property])) {
                return 1;
            }
            if (Date.parse(a[property]) < Date.parse(b[property])) {
                return -1;
            }
            return 0;
        }
        // Формата строки
        else
        {
            if (a[property].toLowerCase() > b[property].toLowerCase()) {
                return 1;
            }
            if (a[property].toLowerCase() < b[property].toLowerCase()) {
                return -1;
            }
            return 0;
        }
    });
    return sorted;
}

function GetReposFromObjects(reposObjects, columnSort = '', ascending = false) {
    // Очистка таблицы от предыдущих значений
    while (tbody.hasChildNodes()) {
        tbody.removeChild(tbody.lastChild);
    }

    BuildTableBody(SortObjectsByProperty(reposObjects, columnSort, ascending), tbody);
}

function GetReposFromWeb(repoPerPage, page=1) {
    let url = `https://api.github.com/orgs/microsoft/repos?per_page=${repoPerPage}&page=${page}`;

    // Актуализация глобальных переменных
    currentPage = page;
    currentPerPage = repoPerPage;

    // Обновление элементов перед загрузкой
    reposAsObjects = [];
    UpdateElementsBeforTableBuilding();


    // Web запрос
    let resp = fetch(url, { method: 'GET' });
    resp.then(r =>{
        r.json().then(json => {
            if (r.status!=200){
                alert(`HTTP status code = ${r.status}\n\n${json['message']}`);
                return;
            }

            // Если ответ успешный
            // Очистка таблицы после успешной загрузки
            while (tbody.hasChildNodes()) {
                tbody.removeChild(tbody.lastChild);
            }

            // Обработка ответа
            for (const j of json) {
                let objRepo = CreateObjectRepo(j.name, j.language ?? '', j.pushed_at, j.archived, j.html_url);
                reposAsObjects.push(objRepo);
                BuildTableBody([objRepo], tbody);
            };
        });
    });
}

function BuildTableBody(objectsRepo, rootTBody) {
    for (const repo of objectsRepo) {
        let row = document.createElement("tr");
        let cols = [
            CreateTD(repo["name"]),
            CreateTD(repo["language"]),
            CreateTD(FormatDate(repo["pushed_at"], 'd.m.y H:M')),
            CreateTD(repo["archived"] == true ? 'да' : 'нет'),
            CreateTD(repo["html_url"], true),
        ]
        cols.forEach(r => row.appendChild(r));
        rootTBody.appendChild(row);
    }
}

function CreateObjectRepo(name, lang, pushed, isArch, link) {
    let repo = {};
    repo["name"] = name;
    repo["language"] = lang;
    repo["pushed_at"] = pushed;
    repo["archived"] = isArch;
    repo["html_url"] = link;
    return repo;
}

function CreateTD(content, isLink = false) {
    let td = document.createElement('td');

    if (isLink) {
        let a = document.createElement('a');
        a.setAttribute('href', content);
        a.setAttribute('target', '_blank');
        a.textContent = content;
        td.appendChild(a);
    }
    else {
        td.textContent = content;
    }
    return td;
}

function FormatDate(dateStr, mask) {


    let date = new Date(dateStr);
    y = date.getFullYear();
    m = addLeftZeroIfNeed(date.getMonth() + 1);
    d = addLeftZeroIfNeed(date.getDate());
    _h = addLeftZeroIfNeed(date.getHours());
    _m = addLeftZeroIfNeed(date.getMinutes());
    _s = addLeftZeroIfNeed(date.getSeconds());

    map = {
        "y": y,
        "m": m,
        "d": d,
        "H": _h,
        "M": _m,
        "S": _s,
    };
    result = '';
    for (const key of mask) {
        if (map[key]) {
            result += map[key];
        }
        else {
            result += key;
        }
    }
    return result;

    function addLeftZeroIfNeed(num) {
        if (`${num}`.length == 1) {
            return `0${num}`;
        }
        else {
            return `${num}`;
        }
    }
}