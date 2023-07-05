// GLOBALs
let reposAsObjects = [];


// FUNCTIONs
function InitPage() {
    let b10 = document.getElementById('but_per_list_10');
    b10.dispatchEvent(new Event("click"));
}

function ButtonPerList_Handler(but) {
    document.querySelectorAll('.but_per_list').forEach(b=>b.style.backgroundColor = 'white');
    but.style.backgroundColor = 'rgb(137, 156, 165)';
    GetReposFromWeb(but.id.split('_').pop());
}

function GetReposFromWeb(repoPerPage) {
    let url = `https://api.github.com/orgs/microsoft/repos?per_page=${repoPerPage}`;
    let tbody = document.getElementById("table_body");

    // Очистка таблицы перед загрузкой
    while (tbody.hasChildNodes()) {
        tbody.removeChild(tbody.lastChild);
    }
    reposAsObjects = [];

    let resp = fetch(url, { method: 'GET' });
    if (resp.then(r => r.status == 200)) {
        resp
            .then(r => r.json())
            .then(jsons => {
                for (const j of jsons) {
                    name_1 = j.name;
                    lang_2 = j.language;
                    pushed_3 = FormatDate(j.pushed_at, 'd.m.y H:M');
                    arch_4 = j.archived == true ? 'да' : 'нет';
                    link_5 = j.html_url;

                    let objRepo = CreateObjectRepo(name_1, lang_2, pushed_3, arch_4, link_5);
                    reposAsObjects.push(objRepo);
                    BuildTableBody([objRepo], tbody);
                };
            });
    }
    else {
        alert('Не удалось обратиться к апи гитхаба');
    }
}

function BuildTableBody(objectsRepo, rootTBody) {
    for (const repo of objectsRepo) {
        let row = document.createElement("tr");
        let cols = [
            CreateTD(repo["name"]),
            CreateTD(repo["language"]),
            CreateTD(repo["pushed_at"]),
            CreateTD(repo["archived"]),
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