var request;
var objJSON;
var id_mongo;
var arr;

var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

function getRequestObject() {
   if (window.ActiveXObject) {
      return (new ActiveXObject("Microsoft.XMLHTTP"));
   } else if (window.XMLHttpRequest) {
      return (new XMLHttpRequest());
   } else {
      return (null);
   }
}

window.onload = function () {
   if (sessionStorage.log && sessionStorage.log === "true") {
      displayButtons(true);
   }
   else {
      displayButtons(false);
   }
};

function displayButtons(logged) {
   var x, y;
   if (logged) {
      x = "inline";
      y = "none";
   } else {
      x = "none";
      y = "inline";
   }

   document.getElementById("logOutB").style.display = x;
   document.getElementById("insOnB").style.display = x;
   document.getElementById("selOnB").style.display = x;
   document.getElementById("analizeB").style.display = x;

   document.getElementById("regB").style.display = y;
   document.getElementById("logB").style.display = y;
   document.getElementById("insOffB").style.display = y;
   document.getElementById("selOffB").style.display = y;
}

function _list() {
   document.getElementById("result").style.backgroundColor = "rgba(255, 255, 255, 0.7)";
   document.getElementById('result').innerHTML = '';
   document.getElementById('data').innerHTML = '';
   request = getRequestObject();
   request.onreadystatechange = function () {
      if (request.readyState == 4) {
         objJSON = JSON.parse(request.response);
         var txt = "<div class='table'><table><tr><th>Nr</th><th>Data</th><th>Temperatura</th><th>Pogoda</th><th>Sila wiatru</th></tr>";
         for (var id in objJSON) {
            txt += "<tr><td>" + id + "</td>";
            for (var prop in objJSON[id]) {
               if (prop !== '_id' && prop !== 'id') { txt += "<td>" + objJSON[id][prop] + "</td>"; }
            }
            txt += "</tr>";
         }
         txt += "</table></div>";
         document.getElementById('result').innerHTML = txt;
      }
   };
   request.open("GET", "rest/list", true);
   request.send(null);
}

function _ins_form(online) {
   var form1 = `<form name='add'>
               Data <input type='date' name='data' min='2022-01-01' max='2022-01-22'></input></br>
               Temperatura <input type='number' name='temp' min="-30" max="30"></input></br>
               Pogoda <select name="pogoda" size="1">
               <option value="slonce">Słońce</option>
               <option value="deszcz">Deszcz</option>
               <option value="snieg">Śnieg</option>
               <option value="zachmurzone">Zachmurzone</option>
               </select></br>
               Siła wiatru <select name="wiatr" size="1">
               <option value="0">0</option>
               <option value="1">1</option>
               <option value="2">2</option>
               <option value="3">3</option>
               <option value="4">4</option>
               <option value="5">5</option>
               </select></br> 
               <input type='button' value='Wyślij' id="input" onclick=`;
   form1 += online ? "'_insert(this.form)'" : "'_insertOffline(this.form)'";
   form1 += " ></input></form>";
   document.getElementById('data').innerHTML = form1;
   document.getElementById('result').innerHTML = '';
}

function _insert(form) {
   if (_validate(form)) {
      document.getElementById("result").style.backgroundColor = "rgba(255, 255, 255, 0.7)";
      _validate(form);
      var data = {};
      data.id = form.data.value + Date.now();
      data.wind = form.wiatr.value;
      data.date = form.data.value;
      data.temp = form.temp.value;
      data.weather = form.pogoda.value;
      txt = JSON.stringify(data);

      document.getElementById('result').innerHTML = '';
      document.getElementById('data').innerHTML = '';
      request = getRequestObject();
      request.onreadystatechange = function () {
         if (request.readyState == 4 && request.status == 200) {
            $array = JSON.parse(request.response);
            document.getElementById('result').innerHTML += "<p>" + $array["return"] + "</p>";
         }
      };
      request.open("POST", "rest/save", true);
      request.send(txt);
   }
}

function _insertOffline(form) {
   if (_validate(form)) {
      var data = {};
      data.id = form.data.value + Date.now();
      data.wind = form.wiatr.value;
      data.date = form.data.value;
      data.temp = form.temp.value;
      data.weather = form.pogoda.value;

      var open = indexedDB.open("localDB", 2);
      open.onupgradeneeded = function () {
         var db = open.result;
         if (!db.objectStoreNames.contains("weather")) {
            db.createObjectStore("weather", { keyPath: "id" });
         }
      };
      open.onsuccess = function () {
         var db = open.result;
         var tx = db.transaction("weather", "readwrite");
         var store = tx.objectStore("weather");
         store.put({ id: data.id, date: data.date, temp: data.temp, weather: data.weather, wind: data.wind });

         tx.oncomplete = function () {
            db.close();
         };
      };
   }
}

function _validate(form) {

   if (form.data.value == "" || form.temp.value == "") {
      alert("Wypełnij wszystkie pola wymagane.");
      return false;
   }
   else {
      if (parseInt(form.temp.value) > 30 || parseInt(form.temp.value) < -30) {
         alert("Podaj temperaturę z przedziału [-30, 30].");
         return false;
      }
      return true;
   }
}

function _listOffline() {
   var open = indexedDB.open("localDB", 2);
   open.onupgradeneeded = function () {
      var db = openRequest.result;
      if (!db.objectStoreNames.contains('weather')) {
         db.createObjectStore('weather', { keyPath: 'id' });
      }
   };
   var txt = "<div class='table'><table><tr><th>Nr</th><th>Data</th><th>Temperatura</th><th>Pogoda</th><th>Sila wiatru</th></tr>";
   open.onsuccess = function () {
      var db = open.result;
      var tx = db.transaction("weather", "readwrite");
      var store = tx.objectStore("weather");
      var g = store.getAll();
      g.onsuccess = function () {
         var res = g.result;
         var i = 0;
         for (const item of res) {
            txt += "<tr><td>" + i + "</td>";
            for (const field in item) {
               if (field !== "id")
                  txt += "<td>" + item[field] + "</td>";
            }
            txt += "</tr>";
            i++;
         }
         txt += "</table></div>";
         document.getElementById('data').innerHTML = '';
         document.getElementById('result').innerHTML = txt;
      };

      tx.oncomplete = function () {
         db.close();
      };
   };
}

function _reg_form() {
   var form2 = `<form name='reg'>
               Email <input type='text' name='email'></input></br>
               Hasło <input type='password' name='haslo'></input></br>
               <input type='button' value='Zarejestruj się' onclick='_reg(this.form)' ></input></form>`;
   document.getElementById('data').innerHTML = form2;
   document.getElementById('result').innerHTML = '';
}

function _reg(form) {
   if (_validateReg(form)) {
      var user = {};
      user.email = form.email.value;
      user.pass = md5(form.haslo.value);
      txt = JSON.stringify(user);

      document.getElementById('result').innerHTML = '';
      document.getElementById('data').innerHTML = '';
      request = getRequestObject();
      request.onreadystatechange = function () {
         if (request.readyState == 4 && request.status == 200) {
            $array = JSON.parse(request.response);
            document.getElementById('result').innerHTML = "<p>" + $array["return"] + "</p>";
         }
      };
      request.open("POST", "rest/reg", true);
      request.send(txt);
   }
}

function _validateReg(form) {
   if (form.email.value == "" || form.haslo.value == "") {
      alert("Wypełnij wszystkie pola wymagane.");
      return false;
   }
   else
      return true;
}

function _log_form() {
   var form3 = `<form name='log'>
               Email <input type='text' name='email'></input></br>
               Hasło <input type='password' name='haslo'></input></br>
               <input type='button' value='Zaloguj się' onclick='_log(this.form)' ></input></form>`;
   document.getElementById('data').innerHTML = form3;
   document.getElementById('result').innerHTML = '';
}

function _log(form) {
   var user = {};
   user.email = form.email.value;
   user.pass = md5(form.haslo.value);
   txt = JSON.stringify(user);

   document.getElementById('result').innerHTML = '';
   document.getElementById('data').innerHTML = '';
   request = getRequestObject();
   request.onreadystatechange = function () {
      if (request.readyState == 4 && request.status == 200) {
         $array = JSON.parse(request.response);
         document.getElementById('result').innerHTML = "<p>" + $array["return"] + "</p>";
         if ($array["return"] === "Uzytkownik zalogowany.") {
            if (typeof (Storage) !== "undefined") {
               sessionStorage.log = true;
               displayButtons(true);
            } else {
               document.getElementById("result").innerHTML = "Sorry, your browser does not support web storage...";
            }
            _moveOnline();
         }
      }
   };
   request.open("POST", "rest/log", true);
   request.send(txt);
}

function _moveOnline() {
   var open = indexedDB.open("localDB", 2);
   open.onupgradeneeded = function () {
      var db = openRequest.result;
      if (!db.objectStoreNames.contains('weather')) {
         db.createObjectStore('weather', { keyPath: 'id' });
      }
   };

   var data = {};
   var txt;
   open.onsuccess = function () {
      var db = open.result;
      var tx = db.transaction("weather", "readwrite");
      var store = tx.objectStore("weather");
      var g = store.getAll();
      g.onsuccess = function () {
         var res = g.result;
         for (const item of res) {
            data.id = item.id;
            data.wind = item.wind;
            data.date = item.date;
            data.temp = item.temp;
            data.weather = item.weather;
            txt = JSON.stringify(data);
            sendOne(txt);
         }
      };
      store.clear();
      tx.oncomplete = function () {
         db.close();
      };
   };
}

function sendOne(txt) {
   request = getRequestObject();
   request.onreadystatechange = function () {
      if (request.readyState == 4 && request.status == 200) {
         $array = JSON.parse(request.response);
         document.getElementById('result').innerHTML += "<p>" + $array["return"] + "</p>";
      }
   };
   request.open("POST", "rest/saveUpdate", true);
   request.send(txt);
}

function _log_out() {
   document.getElementById("result").style.backgroundColor = "rgba(255, 255, 255, 0.7)";
   document.getElementById('result').innerHTML = '';
   document.getElementById('data').innerHTML = '';
   request = getRequestObject();
   request.onreadystatechange = function () {
      if (request.readyState == 4 && request.status == 200) {
         $array = JSON.parse(request.response);
         document.getElementById('result').innerHTML = "<p>" + $array["return"] + "</p>";
         sessionStorage.log = false;
         displayButtons(false);
      }
   };
   request.open("POST", "rest/logOut", true);
   request.send(null);
}

function _analize() {
   let len = 22;
   arr = createArray(len, 3);
   arr = _getWeather();
   
   _wait();

}

function _wait() {
   if (arr[0][0]) {
      _draw(arr);
   }
   else {
      console.log("czekam");
      setTimeout(_wait, 500);
   }
}

function _draw(arr) {
   document.getElementById("result").style.backgroundColor = "transparent";
   document.getElementById('result').innerHTML = `<canvas id='canvas' width='1200' height='600'>
   Canvas not supported
   </canvas>`;
   var canv = document.getElementById("canvas");
   var ctx = canv.getContext("2d");
   let days = arr.length;

   ctx.strokeStyle = "Black";
   ctx.beginPath();
   ctx.moveTo(30, 298);
   ctx.lineTo(1180, 298);
   ctx.stroke();

   ctx.beginPath();
   ctx.moveTo(30, 10);
   ctx.lineTo(30, 586);
   ctx.stroke();

   var tempLabel = [30, 20, 10, 0, -10, -20, -30];
   for (var i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(25, 10 + i * 96);
      ctx.lineTo(35, 10 + i * 96);
      ctx.stroke();
      ctx.fillText(tempLabel[i], 1, 10 + i * 96 + 3);
   }

   var step = 1150 / (days - 1);
   for (var i = 0; i < days; i++) {
      ctx.beginPath();
      ctx.moveTo(30 + i * step, 293);
      ctx.lineTo(30 + i * step, 303);
      ctx.stroke();
      if ((i + 1) % 5 == 0) {
         var x = i + 1;
         var str;
         str = i + 1 + ".01.2022";

         ctx.fillText(str, 20 + i * step, 313);
      }
   }

   ctx.beginPath();
   ctx.moveTo(40 + (i-1) * step, 100);
   ctx.lineTo(40 + (i-1) * step, 300);
   ctx.stroke();
   
   ctx.font = '16px serif';
   for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      ctx.moveTo(35 + (i-1) * step, 40*(j+1) + 50);
      ctx.lineTo(45 + (i-1) * step, 40*(j+1) + 50);
      ctx.stroke();
      ctx.fillText((5-j), 20 + (i-1) * step, 40*(j+1) + 6 + 50);
   }

   _getData(step, arr);
}

function _getData(step, arr) {
   let temp, t, temp2;
   let lastNotNull=0, lastTemp=0;
   var canv = document.getElementById("canvas");
   var ctx = canv.getContext("2d");
   var colors = ["Yellow", "LightBlue", "White", "Gray"];
   
   
   for (i=0; i<arr.length; i++) {
      if (arr[i][0] !== null) {
         ctx.beginPath();
         switch (arr[i][2]) {
            case "slonce":
               ctx.fillStyle = colors[0];
               break;
            case "deszcz":
               ctx.fillStyle = colors[1];
               break;
            case "snieg":
               ctx.fillStyle = colors[2];
               break;
            case "zachmurzone":
               ctx.fillStyle = colors[3];
               break;
         }
         t = arr[i][0];
         temp = (t - 30)/(-10);
         temp2 = (lastTemp - 30)/(-10);
         ctx.arc(30 + (i) * step, 10 + temp * 96, 5, 0, 2 * Math.PI);
         ctx.fill();
         ctx.moveTo(30 + (lastNotNull) * step, 10 + temp2 * 96);
         ctx.lineTo(30 + (i) * step, 10 + temp * 96);
         ctx.stroke();
         lastNotNull = i;
         lastTemp = arr[i][0];
      }
   }
   lastNotNull = 0;
   lastTemp = 0;
   for (i=0; i<arr.length; i++) {
      if (arr[i][1] !== null) {
         ctx.beginPath();
         t = arr[i][1];
         
         ctx.strokeStyle="blue";
         ctx.moveTo(30 + (lastNotNull) * step, 100+ lastTemp * 40);
         ctx.lineTo(30 + (i) * step, 100+ t * 40);
         ctx.stroke();
         lastNotNull = i;
         lastTemp = arr[i][1];
      }
   }
   
   var label = " słońce        deszcz        śnieg    zachmurzone";
   ctx.fillStyle = "Black";
   ctx.fillText(label, 480, 40);

   for (var i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.fillStyle = colors[i];
      ctx.arc(500 + i * 50, 25, 5, 0, 2 * Math.PI);
      ctx.fill();
   }
}

function _getWeather() {
   let arr = createArray(22, 3);
   request = getRequestObject();
   request.onreadystatechange = function () {
      if (request.readyState == 4) {
         let temp, wiatr, pogoda;
         objJSON = JSON.parse(request.response);
         for (var id in objJSON) {
            d = objJSON[id].date.split("-")[2];
            temp = parseInt(objJSON[id].temp);
            wiatr = parseInt(objJSON[id].wind);
            pogoda = objJSON[id].weather;
            arr[d - 1][0] = temp;
            arr[d - 1][1] = wiatr;
            arr[d - 1][2] = pogoda;
         }
      }
   };
   request.open("GET", "rest/list", true);
   request.send(null);

   return arr;
}

function createArray(length) {
   let arr = new Array(length || 0),
      i = length;

   if (arguments.length > 1) {
      var args = Array.prototype.slice.call(arguments, 1);
      while (i--) arr[length - 1 - i] = createArray.apply(this, args);
   }

   return arr;
}
