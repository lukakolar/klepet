function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlika = sporocilo.indexOf('class=\'slike-v-pogovoru\'') > -1;
  var jeYoutube = sporocilo.indexOf('class=\'yt-posnetki-v-pogovoru\'') > -1;
  if (jeSmesko || jeSlika || jeYoutube) {
    var myRegexp = new RegExp('\<', 'gi');
    sporocilo = sporocilo.replace(myRegexp, '&lt;');
    myRegexp = new RegExp('\>', 'gi');
    sporocilo = sporocilo.replace(myRegexp, '&gt;');
    myRegexp = new RegExp('&lt;img', 'gi');
    sporocilo = sporocilo.replace(myRegexp, '<img');
    
    myRegexp = new RegExp('png\' /&gt;', 'gi');
    sporocilo = sporocilo.replace(myRegexp, 'png\' />');
    myRegexp = new RegExp('jpg\' /&gt;', 'gi');
    sporocilo = sporocilo.replace(myRegexp, 'jpg\' />');
    myRegexp = new RegExp('gif\' /&gt;', 'gi');
    sporocilo = sporocilo.replace(myRegexp, 'gif\' />');

    myRegexp = new RegExp('&lt;iframe', 'gi');
    sporocilo = sporocilo.replace(myRegexp, '<iframe');
    myRegexp = new RegExp('\' allowfullscreen&gt;', 'gi');
    sporocilo = sporocilo.replace(myRegexp, '\' allowfullscreen>');
    myRegexp = new RegExp('&lt;/iframe&gt;', 'gi');
    sporocilo = sporocilo.replace(myRegexp, '</iframe>');

    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSlike(sporocilo);
  sporocilo = dodajYoutube(sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
      var imeIzbranegaUporabnika = $(this).text();
      $('#poslji-sporocilo').val("/zasebno \"" + imeIzbranegaUporabnika+"\"");
      $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);
  
  socket.on('dregljaj', function(dregljaj) {
    var aliZatresem = dregljaj.dregljaj;
    if (aliZatresem) {
      $('#vsebina').jrumble();
      $('#vsebina').trigger('startRumble');
      setTimeout(function() {
        $('#vsebina').trigger('stopRumble');
      }, 1500);
    }
  });

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

function dodajSlike(vhodnoBesedilo) {
  var jeZasebno = vhodnoBesedilo.indexOf('/zasebno') > -1;
  if (jeZasebno) {
    vhodnoBesedilo = vhodnoBesedilo.substring(0, vhodnoBesedilo.length-1);
  }
  var myRegexp = new RegExp('https?:\/\/\\S+?\.(?:jpg|gif|png)', 'gi');
  var slike = '';
  var matches_array = vhodnoBesedilo.match(myRegexp);
  if (matches_array != null) {
    for (var i = 0; i < matches_array.length; i++) {
      slike += '<img class=\'slike-v-pogovoru\' src=\''+ matches_array[i] + '\' />';
    }
  }
  var izhod = vhodnoBesedilo + slike;
  if (jeZasebno) {
    izhod += "\"";
  }
  
  return izhod;
}

function dodajYoutube(vhodnoBesedilo) {
  var jeZasebno = vhodnoBesedilo.indexOf('/zasebno') > -1;
  if (jeZasebno) {
    vhodnoBesedilo = vhodnoBesedilo.substring(0, vhodnoBesedilo.length-1);
  }
  var myRegexp = new RegExp('https:\/\/www\.youtube\.com\/watch\\?v=[^\\s]{11}', 'gi');
  var posnetki = '';
  var matches_array = vhodnoBesedilo.match(myRegexp);
  if (matches_array != null) {
    for (var i = 0; i < matches_array.length; i++) {
      var zadetek = matches_array[i];
      var naslov = zadetek.substring(32, zadetek.length);
      posnetki += '<iframe class=\'yt-posnetki-v-pogovoru\' src=\'https://www.youtube.com/embed/'+ naslov + '\' allowfullscreen></iframe>';
    }
  }
  var izhod = vhodnoBesedilo + posnetki;
  if (jeZasebno) {
    izhod += "\"";
  }
  return izhod;
}
