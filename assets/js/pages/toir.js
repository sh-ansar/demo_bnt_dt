(function(){
  const ui=window.BNTUI;
  const forms=[
    ["new-asset","Новый актив","Паспорт и регламент"],["repair","Заявка на ремонт","Дефект и приоритет"],["work-order","Наряд-заказ","Работы и исполнитель"],["history","История ремонта","Период и тип работ"],["spares","Запасные части","Списание и резерв"],["quality","Качество ремонта","Приемка результата"],["rating","Рейтинг сотрудника","Оценка выполнения"]
  ];
  const orders=[
    ["WO-26091","Насос Н-101","Вибродиагностика","11.09.2026","Назначено","Мастер Ли Л.Л.","Подшипник 6312"],
    ["WO-26092","Резервуар P-3","Внутренний осмотр","12.10.2026","Подготовка","Бригада №2","Комплект люка"],
    ["WO-26093","Клапан К-24","Замена уплотнения","17.09.2026","Критично","Бригада КИП","MTG-45"],
    ["WO-26094","Компрессор КВ-3","Плановое ТО","21.09.2026","Согласовано","Мехучасток","AF-2000"],
    ["WO-26095","Шкаф ШУ-3","Проверка контакторов","24.09.2026","В работе","Электролаборатория","На складе"]
  ];
  const definitions={
    "new-asset":{title:"Новый актив",submit:"Сохранить актив",fields:[["name","Наименование","Насос Н-103"],["category","Категория","Насосы"],["location","Местоположение","Насосная станция №2"],["internal","Внутренний номер","PMP-00103"],["cost","Первоначальная стоимость","$12 400"],["service","Следующее ТО","25.10.2026"]]},
    repair:{title:"Заявка на ремонт",submit:"Зарегистрировать",fields:[["asset","Актив","Клапан К-24"],["priority","Приоритет","Критический"],["defect","Вид дефекта","Потеря герметичности"],["duration","Длительность","8 ч"],["spares","Необходимый ЗИП","Уплотнение, крепеж"],["date","Окно ремонта","17.09.2026"]]},
    "work-order":{title:"Наряд-заказ",submit:"Создать наряд",fields:[["asset","Актив","Насос Н-101"],["work","Работа","Вибродиагностика"],["date","Дата","11.09.2026"],["owner","Исполнитель","Мастер Ли Л.Л."],["spares","ЗИП","Подшипник 6312"],["hours","Трудоемкость","8 ч"]]},
    history:{title:"Фильтр истории ремонта",submit:"Применить фильтр",fields:[["asset","Актив","Все активы"],["from","Период с","01.01.2026"],["to","Период по","07.09.2026"],["type","Тип работ","Все работы"]]},
    spares:{title:"Запасные части",submit:"Зарезервировать",fields:[["part","Позиция","Подшипник 6312"],["asset","Для актива","Насос Н-101"],["quantity","Количество","2"],["warehouse","Склад","Основной МТР"]]},
    quality:{title:"Качество ремонта",submit:"Принять работу",fields:[["order","Наряд","WO-26088"],["result","Результат","Принято без замечаний"],["rating","Оценка","5"],["comment","Комментарий","Параметры в норме"]]},
    rating:{title:"Рейтинг сотрудника",submit:"Сохранить оценку",fields:[["employee","Сотрудник","Мастер Ли Л.Л."],["period","Период","Сентябрь 2026"],["quality","Качество","5"],["discipline","Сроки","5"],["comment","Комментарий","Работа выполнена по плану"]]}
  };
  function openForm(id){const def=definitions[id];if(!def)return;ui.modal({title:def.title,submitLabel:def.submit,fields:def.fields.map(f=>({name:f[0],label:f[1],value:f[2],full:f[0]==="comment"})),onSubmit:values=>{if(id==="work-order"){orders.unshift([`WO-${26090+orders.length+1}`,values.asset,values.work,values.date,"Назначено",values.owner,values.spares]);renderOrders();document.getElementById("open-orders").textContent=9;}ui.toast(def.submit,"Данные сохранены в демонстрационном контуре ТОиР");}});}
  function renderOrders(){document.getElementById("work-order-rows").innerHTML=orders.map(r=>`<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${ui.badge(r[4],r[4]==="Критично"?"red":r[4]==="В работе"?"orange":"green")}</td><td>${r[5]}</td><td>${r[6]}</td></tr>`).join("");}
  document.getElementById("toir-actions").innerHTML=forms.map(f=>`<button class="toir-action" data-form="${f[0]}"><b>${f[1]}</b><span>${f[2]}</span></button>`).join("");
  document.addEventListener("click",e=>{const button=e.target.closest("[data-form]");if(button)openForm(button.dataset.form);});
  document.getElementById("filter-history").addEventListener("click",()=>openForm("history"));renderOrders();
  const requested=new URLSearchParams(location.search).get("action");if(requested)openForm(requested);
})();

