var promptHandler;


$(document).ready(function() {

    $('[data-hint]').on('click', function(e) {
        $('#' + $(this).data('hint')).modal('toggle');
        e.stopPropagation();
        e.preventDefault();
    });

    function promptLocation(b) {
        lastLocation = {
            area: b.area,
            vnum: b.vnum
        };
        bcastLocation();
    }

    // prompt time fields: h - hour, tod - time of day, l - daylight
    function promptTime(b) {
        var $row = $('#tw-time');

        // Time is unchanged since last prompt.
        if (b.time === undefined)
            return;
        // Time is now hidden.
        if (b.time === "none") {
            $row.hide();
            return;
        }

        // Display time.
        $row.show();
        $row.find('i').removeClass().addClass("wi wi-fw wi-time-" + b.time.h);

        var txt = b.time.h + " " + b.time.tod;
        // Daylight can be hidden.
        if (b.time.l !== undefined)
            txt = txt + ", " + b.time.l;
        $row.find('span').text(txt);
    }

    // prompt date fields: d - day, m - month, y - year
    function promptDate(b) {
        var $row = $('#tw-date');

        // Date is unchanged since last prompt.
        if (b.date === undefined)
            return;
        // Date is now hidden.
        if (b.date === "none") {
            $row.hide();
            return;
        }

        // Display date.
        $row.show();
        $row.find('span').text(b.date.d + " / " + b.date.m + " / " + b.date.y);
    }

    // prompt weather (w) fields: i - icon to use, m - weather message
    function promptWeather(b) {
        var $row = $('#tw-weather');

        // Weather is unchanged since last prompt.
        if (b.w === undefined)
            return;
        // Weather is now hidden.
        if (b.w === "none") {
            $row.hide();
            return;
        }

        // Display weather.
        $row.show();
        $row.find('i').removeClass().addClass("wi wi-fw wi-" + b.w.i);
        $row.find('span').text(b.w.m);
    }

    // prompt zone field: string with area name
    function promptZone(b) {
        var $row = $('#pl-zone');

        // Zone is unchanged since last prompt.
        if (b.zone === undefined)
            return;
        // Zone is now hidden.
        if (b.zone === "none") {
            $row.hide();
            return;
        }

        // Display zone name.
        $row.show();
        $row.find('span').text(b.zone);
    }

    // prompt room field: string with room name
    function promptRoom(b) {
        var $row = $('#pl-room');

        // Room is unchanged since last prompt.
        if (b.room === undefined)
            return;
        // Room is now hidden.
        if (b.room === "none") {
            $row.hide();
            return;
        }

        // Display room name.
        $row.show();
        $row.find('span').text(b.room);
    }

    // prompt exits fields: e - visible exits, h - hidden exits (perception),
    // l - language (r, e)
    function promptExits(b) {
        var $row = $('#pl-exits');

        // Exits are unchanged since last prompt.
        if (b.exits === undefined)
            return;
        // Exits are now hidden.
        if (b.exits === "none") {
            $row.hide();
            return;
        }

        // Display visible and hidden exits.
        $row.show();

        function markExit(ex_ru, ex_en) {
            var exit = ex_en.toLowerCase();
            var $node = $row.find('#ple-' + exit);
            // See if this exit letter is among hidden exits.
            var hidden = b.exits.h.indexOf(exit) !== -1;
            // See if this exit letter is among visible exits.
            var visible = b.exits.e.indexOf(exit) !== -1;
        
            $node.removeClass();
            // If found anywhere, draw a letter of selected language, otherwise a dot.
            if (hidden || visible) {
                $node.text(b.exits.l === 'r' ? ex_ru : ex_en);
            } else {
                $node.text("\u00B7");
            }
            // Mark hidden exits with default color, other exits with bright blue.
            if (!hidden)
                $node.addClass('fg-ansi-bright-color-6');
        }
       
        markExit('С', 'N');
        markExit('В', 'E');
        markExit('Ю', 'S');
        markExit('З', 'W');
        markExit('О', 'D');
        markExit('П', 'U');
    }

    // prompt sector fields: s - sector type, l - light 
    function promptSector(b) {
        // Later if needed. Showing sector type everywhere will discover a lot of funny things.
    }

    function promptStats(b) {
        $('#stats').show();
        
        function stat($node, value, max) {
            $node.find('.fill').css({ width: (100*value/max) + '%' });
            $node.find('.value').text(value + ' / ' + max);
        }

        stat($('#stats .hit'), b.hit, b.max_hit);
        stat($('#stats .mana'), b.mana, b.max_mana);
        stat($('#stats .move'), b.move, b.max_move);
    }

    // prompt affect helper function: draw a block of affects
    // prompt affect block fields: a - active bits, z - bits from affects with zero duration
    function drawAffectBlock(block, selector, blockName, bitNames, color) {
        var clr_active = 'fg-ansi-bright-color-' + color;
        var clr_zero = 'fg-ansi-bright-color-3';
        var clr_header = 'fg-ansi-bright-color-7';
        var $row = $(selector);

        // Nothing changed since last time.
        if (block == undefined) {
            return;
        }

        // This affect block is now hidden.
        if (block === "none") {
            $row.hide();
            $row.empty();
            return;
        } 

        $row.show();
        $row.empty();

        var $span = $('<span/>').addClass(clr_header).text(blockName);
        $row.append($span);

        for (var bit in bitNames) {
            if (bitNames.hasOwnProperty(bit)) {
                var clr;
                
                // Draw active affect names in green, those about to
                // disappear in dark green.
                if (block.z.indexOf(bit) !== -1)
                    clr = clr_zero;
                else if (block.a.indexOf(bit) !== -1)
                    clr = clr_active;
                else
                    continue;

                var $span = $('<span/>').addClass(clr).text(bitNames[bit]);
                $row.append($span);
            }
        }
    }

    // prompt fields related to affects: det - detection, trv - transport&travel
    //                                   enh - fightmaster&enhancement, pro - protective
    function promptAffects(b) {
        var $affects = $('#player-affects');
        $affects.show();

        var dnames = { 'h': 'Скрыт', 'i': 'Невид', 'w': 'ОНевид', 'f': 'Спрят', 'a': 'Камуф', 
            'e': 'Зло', 'g': 'Добро', 'u': 'Нежить', 'm': 'Магия', 'o': 'Диагн', 'l': 'Жизнь', 'r': 'Инфра' };
        drawAffectBlock(b.det, '#pa-detects', 'Обнар', dnames, '2');

        var tnames = {'i':'Невид','h':'Скрыт','F':'Спрят','I':'УНевд','s':'Подкр','f':'Полет','p':'Прозр','m':'МБлок'};
        drawAffectBlock(b.trv, '#pa-travel', 'Трансп', tnames, '2');

        var enames = { 'r': 'Реген','h':'Ускор','g':'ГигСил','l':'Обуч', 'b':'Благос','f':'Неист','B':'Блгсть','i':'Вдохн','c':'Спокой',
                      'C':'Концен','z':'Берсрк','w':'Клич','F':'Лес','m':'МагФок'};
        drawAffectBlock(b.enh, '#pa-enhance', 'Усилен', enames, '2');

        var pnames = { 'z':'Звезд','s':'ЗащСвя','d':'ТАура','p':'ЗащЩит','e':'Зло','g':'Добро','m':'Заклин',
        'P':'Молит','n':'Негат','a':'Броня','A':'УлБрон','S':'Щит','D':'КжДрак','k':'КамКж','r':'СКамн','c':'Холод','h':'Жар',
        'b':'ЛМыш','R':'Радуга','M':'Мантия'};
        drawAffectBlock(b.pro, '#pa-protect', 'Защита', pnames, '2');

        var mnames = {'b': 'Слеп','p':'Яд','P':'Чума','C':'Гниени','f':'ОгФей','W':'Очаров','c':'Прокл','w':'Слабо',
        's':'Замедл','S':'Крик','B':'ЖажКрв','T':'Оглуш','i':'НетРук','I':'Стрела','j':'Сосуд','a':'Анафем'};
        drawAffectBlock(b.mal, '#pa-malad', 'Отриц', mnames, '1');
    }

    // prompt 'who' fields: p - list of players, v - visible player count,
    // t - total player count. 
    // Each player contains fields: n - name, r - first 2 letters of race, 
    // cn - first letter of clan name, cc - clan colour.
    function promptWho(b) {
        // Nothing changed since last time.
        if (b.who == undefined) {
            return;
        }

        $('#who').addClass('d-md-block');
        var body = $('#who tbody');
        body.empty();

        // Nothing in 'who' - shouldn't happen except in very specific cases.
        if (b.who === "none") {
            $('#who').removeClass('d-md-block');
            return;
        }

        // Translate race and clan to their full names.
        var races = {'ar':'Ариал','ce':'Кентавр','cl':'ОбВелик','da':'ТемЭльф','dr':'Дроу','du':'Дуэргар',
            'dw':'Дварф','el':'Эльф','fa':'Фея','fe':'Фелар','fi':'ОгВелик','fr':'ИнВелик','gi':'Гитианк',
            'gn':'Гном','ha':'ПолЭльф','ho':'Хоббит','hu':'Человек','ke':'Кендер','ma':'Чес','ro':'Роксир',
            'sa':'Сатир','st':'ШтВелик','sv':'Свирф','tr':'Тролль','ur':'Урукха'};
        var clans = {'b':'Ярости','c':'Хаос','e':'Изгои','f':'Цветы','g':'Призраки','h':'Охотники',
            'i':'Захватчики','k':'Рыцари','l':'Львы','o':'Одиночки','r':'Правители','s':'Шалафи', 'n':''};

        // Draw single player line.
        function who_player(wch) {
            var tr = $('<tr/>');

            tr.append($('<td/>').append(wch.n));
            tr.append($('<td/>').append(races[wch.r]));
            if (wch.cn == undefined)
                tr.append($('<td/>').append(""));
            else
                tr.append($('<td/>').append("<span class='fg" + wch.cc + "'>" + clans[wch.cn] + "</span>"));
            return tr;
        }

        // Draw all players.
        b.who.p.forEach(function(wch) {
            body.append(who_player(wch));
        });
    }

    function promptGroup(b) {
        // Nothing changed since last time.
        if (b.group == undefined) {
            return;
        }

        // Group is now hidden: shouldn't happen as the leader is always shown.
        if (b.group === "none") {
            $('#group').removeClass('d-md-block');
            return;
        } 

        $('#group').addClass('d-md-block');
        $('#g_leader').text(b.group.ln);
        var body = $('#group tbody');
        body.empty();
        
        function group_member(gch) {
            var tr = $('<tr/>');
            tr.append($('<td/>').append(gch.sees));
            tr.append($('<td/>').append(gch.level));
            tr.append($('<td/>').append($('<span/>').addClass('fg-ansi-bright-color-'+gch.hit_clr).append(gch.health + "%")));
            tr.append($('<td/>').append(gch.tnl));
            return tr;
        }

        body.append(group_member(b.group.leader));
        if (b.group.pc !== undefined)
            b.group.pc.forEach(function(gch) {
                body.append(group_member(gch));
            });

        if (b.group.npc !== undefined)
            b.group.npc.forEach(function(gch) {
                body.append(group_member(gch));
            });
    }


    // Main prompt handler, called from main.js.
    promptHandler = function(b) {
        $('#time-weather').show();
        $('#player-location').show();

        promptGroup(b);
        promptLocation(b);
        promptZone(b);
        promptRoom(b);
        promptExits(b);
        promptTime(b);
        promptDate(b);
        promptWeather(b);
        promptSector(b);
        promptAffects(b);
        promptWho(b);
// TODO rework: promptStats(b);
    };

});
