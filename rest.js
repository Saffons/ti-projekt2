var request;
var objJSON;
var id_mongo;

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
}

function displayButtons(logged) {

   if (logged) {
      var x = "inline";
      var y = "none";
   } else {
      var x = "none";
      var y = "inline";
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
         var txt = "<div class='table'><table><tr><th>Nr</th><th>Miejsce</th><th>Data</th><th>Temperatura</th><th>Pogoda</th></tr>";
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
   }
   request.open("GET", "rest/list", true); //http://pascal.fis.agh.edu.pl/~7marszalek/proj2/rest/list", true);
   request.send(null);
}

function _ins_form(online) {
   var form1 = `<form name='add'>
               Miejsce <select name="miejsce" size="1">
               <option value="krakow">Kraków</option>
               <option value="wroclaw">Wrocław</option>
               <option value="poznan">Poznań</option>
               </select></br>
               Data <input type='date' name='data'></input></br>
               Temperatura <input type='number' name='temp' min="-30" max="30"></input></br>
               Pogoda <select name="pogoda" size="1">
               <option value="slonce">Słońce</option>
               <option value="deszcz">Deszcz</option>
               <option value="snieg">Śnieg</option>
               <option value="zachmurzone">Zachmurzone</option>
               </select></br>
               <input type='button' value='Wyślij' onclick=`;
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
      data.id = form.miejsce.value + form.data.value;
      data.place = form.miejsce.value;
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
      }
      request.open("POST", "rest/save", true);//http://pascal.fis.agh.edu.pl/~7marszalek/proj2/rest/save", true);
      request.send(txt);
   }
}

function _insertOffline(form) {
   if (_validate(form)) {
      var data = {};
      data.id = form.miejsce.value + form.data.value;
      data.place = form.miejsce.value;
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
         store.put({ id: data.id, place: data.place, date: data.date, temp: data.temp, weather: data.weather });

         tx.oncomplete = function () {
            db.close();
         };
      }
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
      var date = form.data.value;
      var parts = date.split("-");
      if (parts[0] != "2021" || (parts[1] != "01" && parts[1] != "02")) {
         alert("Podaj datę w zakresie stycznia i lutego 2021.");
         return false;
      }
      else {
         var today = new Date();
         var d = String(today.getDate());
         var m = String(today.getMonth() + 1).padStart(2, '0');
         if (parts[1] == m && parseInt(parts[2]) > parseInt(d) || parseInt(parts[1]) > parseInt(m)) {
            alert("Nie podawaj daty z przyszłości.");
            return false;
         }
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
   var txt = "<div class='table'><table><tr><th>Nr</th><th>Miejsce</th><th>Data</th><th>Temperatura</th><th>Pogoda</th></tr>";
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
   }
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
      }
      request.open("POST", "rest/reg", true);//http://pascal.fis.agh.edu.pl/~7marszalek/proj2/rest/reg", true);
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
   }
   request.open("POST", "rest/log", true);//http://pascal.fis.agh.edu.pl/~7marszalek/proj2/rest/log", true);
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
            data.id = item["id"];
            data.place = item["place"];
            data.date = item["date"];
            data.temp = item["temp"];
            data.weather = item["weather"];
            txt = JSON.stringify(data);
            sendOne(txt);
         }
      };
      store.clear();
      tx.oncomplete = function () {
         db.close();
      };
   }
}

function sendOne(txt) {
   request = getRequestObject();
   request.onreadystatechange = function () {
      if (request.readyState == 4 && request.status == 200) {
         $array = JSON.parse(request.response);
         document.getElementById('result').innerHTML += "<p>" + $array["return"] + "</p>";
      }
   }
   request.open("POST", "rest/saveUpdate", true);//http://pascal.fis.agh.edu.pl/~7marszalek/proj2/rest/saveUpdate", true);
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
   }
   request.open("POST", "rest/logOut", true);//http://pascal.fis.agh.edu.pl/~7marszalek/proj2/rest/logOut", true);
   request.send(null);
}

function _analize() {

   var form4 = `<form name='chart'>
               <select name="miejsce" size="1">
               <option value="krakow">Kraków</option>
               <option value="wroclaw">Wrocław</option>
               <option value="poznan">Poznań</option>
               </select></br>
               <input type='button' value='Wybierz' onclick='_draw(this.form)' ></input></form>`;
   document.getElementById('data').innerHTML = form4;
   document.getElementById('result').innerHTML = '';
}

function _draw(form) {
   document.getElementById("result").style.backgroundColor = "transparent";

   var city = form.miejsce.value;

   document.getElementById('result').innerHTML = `<canvas id='canvas' width='1200' height='600'>
   Canvas not supported
   </canvas>`;
   var canv = document.getElementById("canvas");
   var ctx = canv.getContext("2d");

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

   var today = new Date();
   var d = String(today.getDate());
   var m = String(today.getMonth() + 1).padStart(2, '0');
   var days = 0;
   if (m === "01")
      days = parseInt(d);
   else
      days = parseInt(d) + 31;

   var step = 1150 / (days - 1);
   for (var i = 0; i < days; i++) {
      ctx.beginPath();
      ctx.moveTo(30 + i * step, 293);
      ctx.lineTo(30 + i * step, 303);
      ctx.stroke();
      if ((i + 1) % 5 == 0) {
         var x = i + 1;
         var str;
         if (i < 31)
            str = x.toString() + ".01";
         else {
            x -= 31;
            str = x.toString() + ".02";
         }
         ctx.fillText(str, 20 + i * step, 313);
      }
   }

   _getData(step, city);
}

function _getData(step, city) {
   request = getRequestObject();
   request.onreadystatechange = function () {
      if (request.readyState == 4) {
         objJSON = JSON.parse(request.response);
         var canv = document.getElementById("canvas");
         var ctx = canv.getContext("2d");

         var colors = ["Yellow", "LightBlue", "White", "Gray"]

         for (var id in objJSON) {
            for (var prop in objJSON[id]) {
               if (prop === 'place' && objJSON[id][prop] === city) {
                  var date = objJSON[id]['date'].split("-");
                  d = date[2];
                  m = date[1];
                  if (m === "02")
                     d += 31;
                  var temp = parseInt(objJSON[id]['temp']);

                  ctx.beginPath();
                  switch (objJSON[id]['weather']) {
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
                  i = (temp - 30) / (-10);
                  ctx.arc(30 + (d - 1) * step, 10 + i * 96, 5, 0, 2 * Math.PI);
                  ctx.fill();
               }
            }
         }
         var label = "słońce      deszcz       śnieg      zachmurzone";
         ctx.fillStyle = "Black";
         ctx.fillText(label, 500, 40);

         for (var i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.fillStyle = colors[i];
            ctx.arc(500 + i * 50, 25, 5, 0, 2 * Math.PI);
            ctx.fill();
         }
      }
   }
   request.open("GET", "rest/list", true);//http://pascal.fis.agh.edu.pl/~7marszalek/proj2/rest/list", true);
   request.send(null);
}

