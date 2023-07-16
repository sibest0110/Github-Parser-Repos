// GLOBALs
let organisationName = 'microsoft';
let currentPage = 1;
let currentPerPage = 10;
let reposAsObjects = [];
let tbody = document.getElementById("table_body");
let modal = document.getElementById('modal_background');
    

// FUNCTIONs
function InitPage() {
    let b10 = document.getElementById('but_per_list_10');
    b10.dispatchEvent(new Event("click"));
}

//#region Обработчики нажатий
function OpenIssuesModal_handler(row) {
    SetLoaderVisibility(true);
    let i_tbody = document.querySelector('#table_issues tbody');
    let repoName = row.getElementsByClassName('td_name')[0].textContent;
    let i_PerPage = 100;
    i_url = `https://api.github.com/repos/${organisationName}/${repoName}/issues?state=all&sort=created&per_page=${i_PerPage}`;

    let i_resp = fetch(i_url, { method: 'GET' });
    i_resp.then(r =>{
        r.json().then(json => {
            if (r.status!=200){
                alert(`HTTP status code = ${r.status}\n\n${json['message']}`);
                SetLoaderVisibility(false)
                return;
            }
            
            // Если ответ успешный
            
            // Очистка i_таблицы после успешной загрузки
            while (i_tbody.hasChildNodes()) {
                i_tbody.removeChild(i_tbody.lastChild);
            }
            
            // Обработка ответа
            for (const j of json) {
                let i_tr = document.createElement('tr');
                i_tbody.appendChild(i_tr);

                for (const prop of [
                    FormatDate(j['created_at'], 'H:M d W y'), 
                    j['title'], 
                    j['body']]) {
                    let i_td = CreateTD(prop);
                    i_tr.appendChild(i_td);
                };
            };

            document.getElementById('modal_title').textContent = `Issues по "${repoName}":`
            SetModalVisibility(true);
            SetLoaderVisibility(false);
        });
    });
}

function SelectRepoRow_handler(row) {
    RestToEmptyRowSelection();
    row.dataset.selected = '1';
}

function ButtonChangePage_handler(page) {
    currentPage = page;
    document.getElementById("but_page_cur").textContent = currentPage;
    GetReposFromWeb(currentPerPage, currentPage);
}

function ButtonPerList_handler(but) {
    GetReposFromWeb(but.id.split('_').pop(), currentPage);
}
//#endregion


//#region Сортировка

function SortColumn_handler(columnHead) {
    let propName = columnHead.id.replace('colRepo_', '');
    let order = Number(columnHead.dataset.order);
    order = order == 1 ? -1 : order + 1;

    RestToZeroColumnOrder();
    columnHead.dataset.order = order;
    switch (order) {
        case -1:
            GetReposFromObjects(reposAsObjects, propName, false);
            break;
        case 1:
            GetReposFromObjects(reposAsObjects, propName, true);
            break;
        default:
            GetReposFromObjects(reposAsObjects, propName);
            break;
    }
}

// !!!приватная бы
function SortObjectsByProperty(objects, property = '', ascending = true) {
    if (property === ''){
        return objects;
    }

    let sorted = [];
    Object.assign(sorted, objects);

    sorted.sort(function(a,b){
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
            if (String(a[property]).toLowerCase() > String(b[property]).toLowerCase()) {
                return 1;
            }
            if (String(a[property]).toLowerCase() < String(b[property]).toLowerCase()) {
                return -1;
            }
            return 0;
        }
    });

    return sorted;
}
//#endregion


//#region Формирование таблиц

function GetReposFromObjects(reposObjects, columnSort = '', ascending = null) {
    SetLoaderVisibility(true);

    // Очистка таблицы от предыдущих значений
    while (tbody.hasChildNodes()) {
        tbody.removeChild(tbody.lastChild);
    }

    if (typeof ascending !== 'boolean') {
        BuildTableBody(reposAsObjects, tbody);
        SetLoaderVisibility(false);
        return;
    }
    BuildTableBody(SortObjectsByProperty(reposObjects, columnSort, ascending), tbody);
    SetLoaderVisibility(false);
}

function GetReposFromWeb(repoPerPage, page=1) {
    SetLoaderVisibility(true);
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
        SetLoaderVisibility(false);
    });
}

// !!!приватная бы
function BuildTableBody(objectsRepo, rootTBody) {
    let rowClassName = 'repoRow';
    for (const repo of objectsRepo) {
        let row = document.createElement("tr");
        row.className = rowClassName;
        row.onclick = function () {
            SelectRepoRow_handler(row);
        };
        row.ondblclick = function () {
            OpenIssuesModal_handler(row);
        }

        row.dataset.selected = '0';
        let cols = [
            CreateTD(repo["name"], "td_name"),
            CreateTD(repo["language"], "td_language"),
            CreateTD(FormatDate(repo["pushed_at"], 'd.m.y H:M'), "td_pushed_at"),
            CreateTD(repo["archived"] == true ? 'да' : 'нет', "td_archived"),
            CreateTD(repo["html_url"], "td_html_url", true),
        ]
        cols.forEach(r => row.appendChild(r));
        rootTBody.appendChild(row);
    }
}
//#endregion


//#region Вспомогательные функции
function SetModalVisibility(isVisible) {
    if (isVisible == false || isVisible == null) {
        modal.dataset.visible = '0';
        document.getElementById('modal_title').textContent = '';
        document.querySelector('body').classList.remove('no-scroll');
    }
    else {
        modal.dataset.visible = '1';
        document.querySelector('body').classList.add('no-scroll');
    }
}

function SetLoaderVisibility(isVisible) {
    document.getElementById("loader").dataset.visible = isVisible == true ? '1' : '0';
}

function RestToEmptyRowSelection() {
    for (const row of document.getElementsByClassName('repoRow')) {
        row.dataset.selected = '0';
    }
}

function RestToZeroColumnOrder() {
    for (const col of document.getElementsByClassName('colRepo')) {
        col.dataset.order = 0;
    }
}

function UpdateElementsBeforTableBuilding(params) {
    document.querySelectorAll('.tfoot_button').forEach(b=>b.dataset.selected = '0');
    
    // Восстановление закраски нажатой кнопки
    GetPressedButtonPerList().dataset.selected = '1';
    
    // Прятать кнопку Назад, если на 1 странице
    if (currentPage == 1)
        document.getElementById('but_page_prev').style.display='none';
    else
        document.getElementById('but_page_prev').style.display='block';

    // Сбросить атрибут сортировки у столбцов
    RestToZeroColumnOrder();

    // Сбросить выделение строки Репо
    RestToEmptyRowSelection();
}

function GetPressedButtonPerList() {
    return document.getElementById('but_per_list_' + currentPerPage);
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

function CreateTD(content, className = '', isLink = false) {
    let td = document.createElement('td');

    if (className !== '') {
        td.className = className;
    }

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
    monthNameMap1 = [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь'];

    monthNameMap2 = [
        'Января',
        'Февраля',
        'Марта',
        'Апреля',
        'Мая',
        'Июня',
        'Июля',
        'Августа',
        'Сентября',
        'Октября',
        'Ноября',
        'Декабря'];

    let date = new Date(dateStr);
    y = date.getFullYear();
    m = addLeftZeroIfNeed(date.getMonth() + 1);
    d = addLeftZeroIfNeed(date.getDate());
    _h = addLeftZeroIfNeed(date.getHours());
    _m = addLeftZeroIfNeed(date.getMinutes());
    _s = addLeftZeroIfNeed(date.getSeconds());
    _m_word1 = monthNameMap1[date.getMonth()];
    _m_word2 = monthNameMap2[date.getMonth()];

    map = {
        "y": y,
        "m": m,
        "d": d,
        "H": _h,
        "M": _m,
        "S": _s,
        "w": _m_word1,
        "W": _m_word2
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
//#endregion