window.BNT_DATA = window.BNT_DATA || {};
window.BNT_DATA.logistics = {
  wagons:[
    {date:"07.09",product:"Дизтопливо",wagons:12,volume:720,status:"Разгрузка",section:"Секция 1",queue:2},
    {date:"08.09",product:"Бензин",wagons:8,volume:480,status:"В пути",section:"Секция 2",queue:0},
    {date:"09.09",product:"Мазут",wagons:14,volume:840,status:"Подтверждено",section:"Секция 1",queue:6},
    {date:"10.09",product:"Дизтопливо",wagons:10,volume:600,status:"План",section:"Секция 1",queue:8},
    {date:"11.09",product:"Газойль",wagons:7,volume:420,status:"План",section:"Секция 2",queue:3},
    {date:"12.09",product:"Мазут",wagons:8,volume:480,status:"План",section:"Секция 1",queue:10},
    {date:"13.09",product:"Бензин",wagons:4,volume:240,status:"План",section:"Секция 2",queue:2}
  ],
  warnings:[
    {tone:"red",title:"Секция 1 достигнет 95%",text:"Поставка 10–12 сентября превышает свободную емкость на 480 м³."},
    {tone:"red",title:"Насосная №2 недоступна 10 сентября",text:"Плановое ТО требует перераспределить поток на восемь часов."},
    {tone:"orange",title:"Очередь до 10 часов",text:"Без изменения графика ожидается простой четырех вагонов."}
  ],
  products:[["Дизтопливо",1320],["Мазут",1320],["Бензин",720],["Газойль",420]],
  capacities:[["Секция 1",25600],["Секция 2",31800],["Восточный парк",22400],["P-3",5600]]
};

