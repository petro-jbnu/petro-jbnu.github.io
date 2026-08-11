/* Reservoir & CO2 Storage Lab — v4 site script
   1) KO/EN 토글  2) 모바일 메뉴·아코디언  3) 히어로 슬라이더  4) 토스트
   5) 데이터 렌더링: 일정(달력)·연구실 활동·연구 성과(Paper/Presentation/Awards 자동 집계)
   관리자 메모: 콘텐츠 수정은 data/ 폴더의 JSON에서 하세요. 이 파일은 수정할 필요가 없습니다. */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ============ 1. Language toggle ============ */
  var saved = null;
  try { saved = window.localStorage.getItem("lab-lang"); } catch (e) {}
  var initial = saved || ((navigator.language || "ko").toLowerCase().indexOf("ko") === 0 ? "ko" : "en");
  function setLang(lang) {
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    try { window.localStorage.setItem("lab-lang", lang); } catch (e) {}
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.textContent = lang === "ko" ? "EN" : "한국어";
    });
    var t = document.querySelector("title");
    if (t && t.getAttribute("data-ko") && t.getAttribute("data-en")) {
      t.textContent = lang === "ko" ? t.getAttribute("data-ko") : t.getAttribute("data-en");
    }
  }
  setLang(initial);
  var lang = function () { return root.getAttribute("data-lang") || "ko"; };
  function bi(ko, en) { return '<span class="ko">' + ko + '</span><span class="en">' + en + '</span>'; }

  /* ============ 2. Toast ============ */
  var toastEl = document.createElement("div");
  toastEl.id = "toast";
  document.body.appendChild(toastEl);
  var toastTimer = null;
  function toast(msgKo, msgEn) {
    toastEl.textContent = lang() === "ko" ? msgKo : (msgEn || msgKo);
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
  }

  document.addEventListener("click", function (ev) {
    var lb = ev.target.closest(".lang-btn");
    if (lb) { setLang(lang() === "ko" ? "en" : "ko"); return; }
    var acc = ev.target.closest(".m-acc-btn");
    if (acc) {
      var sub = document.getElementById(acc.getAttribute("data-acc"));
      if (sub) {
        sub.classList.toggle("hidden");
        var chev = acc.querySelector(".material-symbols-outlined");
        if (chev) chev.textContent = sub.classList.contains("hidden") ? "expand_more" : "expand_less";
      }
      return;
    }
    var t = ev.target.closest("[data-toast-ko]");
    if (t) { ev.preventDefault(); toast(t.getAttribute("data-toast-ko"), t.getAttribute("data-toast-en")); return; }
    var card = ev.target.closest("[data-href]");
    if (card && !ev.target.closest("a,button")) {
      var url = card.getAttribute("data-href");
      if (card.getAttribute("data-newtab") === "1") window.open(url, "_blank", "noopener");
      else window.location.href = url;
    }
  });

  /* ============ 3. Mobile menu ============ */
  var menuBtn = document.getElementById("menu-btn");
  var mobileMenu = document.getElementById("mobile-menu");
  if (menuBtn && mobileMenu) {
    var icon = menuBtn.querySelector(".material-symbols-outlined");
    menuBtn.addEventListener("click", function () {
      var open = !mobileMenu.classList.contains("hidden");
      mobileMenu.classList.toggle("hidden");
      if (icon) icon.textContent = open ? "menu" : "close";
    });
    mobileMenu.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) {
        mobileMenu.classList.add("hidden");
        if (icon) icon.textContent = "menu";
      }
    });
  }

  /* ============ 4. Hero slider ============ */
  var slides = document.querySelectorAll(".hero-slide");
  var dots = document.querySelectorAll(".hero-dot");
  var captions = document.querySelectorAll(".hero-caption");
  if (slides.length > 1 && dots.length === slides.length) {
    var current = 0, interval = null;
    function setCaption(idx, on) {
      if (!captions.length || !captions[idx]) return;
      captions[idx].classList.toggle("opacity-100", on);
      captions[idx].classList.toggle("opacity-0", !on);
      captions[idx].classList.toggle("pointer-events-none", !on);
    }
    function show(i) {
      slides[current].classList.remove("opacity-100"); slides[current].classList.add("opacity-0");
      dots[current].classList.remove("bg-white"); dots[current].classList.add("bg-white/40");
      setCaption(current, false);
      current = (i + slides.length) % slides.length;
      slides[current].classList.remove("opacity-0"); slides[current].classList.add("opacity-100");
      dots[current].classList.remove("bg-white/40"); dots[current].classList.add("bg-white");
      setCaption(current, true);
    }
    function reset() { clearInterval(interval); interval = setInterval(function () { show(current + 1); }, 5000); }
    dots.forEach(function (d, i) { d.addEventListener("click", function () { show(i); reset(); }); });
    var hero = document.getElementById("hero");
    if (hero) {
      hero.addEventListener("mouseenter", function () { clearInterval(interval); });
      hero.addEventListener("mouseleave", reset);
    }
    reset();
  }

  /* ============ 5. Data helpers ============ */
  var esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
  function offlineNotice(el) {
    el.innerHTML = '<div class="bg-surface-container rounded-lg p-md font-body-md text-[14px] text-on-surface-variant">' +
      bi("이 목록은 data/ 폴더의 데이터 파일에서 자동 표시됩니다. 로컬 미리보기(file://)에서는 보이지 않으며, 웹 서버(GitHub Pages 등)에서는 정상 표시됩니다.",
         "This list renders from files in the data/ folder. Hidden in file:// preview; renders normally when served over HTTP.") + "</div>";
  }
  function load(path, onOk, containers) {
    var key = path.split("/").pop().replace(".json", "");
    fetch(path).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(onOk)
      .catch(function () {
        // 로컬(file://) 미리보기: 빌드 시 내장된 데이터로 폴백 (배포 후에는 항상 최신 JSON 사용)
        if (window.LAB_DATA && window.LAB_DATA[key]) { onOk(window.LAB_DATA[key]); return; }
        (containers || []).forEach(function (id) { var el = document.getElementById(id); if (el) offlineNotice(el); });
      });
  }
  var CAT_EN = { "교육": "Education", "워크샵": "Workshop", "기타": "Others" };
  var CAT_CLS = { "교육": "bg-primary-container text-on-primary-container", "워크샵": "bg-tertiary-container text-on-tertiary-container", "기타": "bg-surface-variant text-on-surface-variant" };
  function catBadge(c) {
    return '<span class="inline-block px-2 py-0.5 rounded-sm font-label-caps ' + (CAT_CLS[c] || CAT_CLS["기타"]) + '">' + bi(esc(c), esc(CAT_EN[c] || c)) + "</span>";
  }

  /* ============ 6. 일정 (달력) ============ */
  var MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOW = ["일","월","화","수","목","금","토"];
  var DOW_EN = ["S","M","T","W","T","F","S"];
  function renderCalendar(el, events, y, m, compact) {
    var evDays = {};
    (events || []).forEach(function (e) {
      var d = new Date(e.date + "T00:00:00");
      if (d.getFullYear() === y && d.getMonth() === m) evDays[d.getDate()] = (evDays[d.getDate()] || []).concat([e]);
    });
    var first = new Date(y, m, 1).getDay();
    var days = new Date(y, m + 1, 0).getDate();
    var today = new Date();
    var html = '<div class="flex items-center justify-between mb-xs">' +
      '<button type="button" class="cal-prev w-8 h-8 rounded-lg hover:bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>' +
      '<div class="font-headline-md text-[16px] text-on-surface">' + bi(y + "년 " + (m + 1) + "월", MONTHS_EN[m] + " " + y) + "</div>" +
      '<button type="button" class="cal-next w-8 h-8 rounded-lg hover:bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button></div>' +
      '<div class="grid grid-cols-7 text-center font-label-caps text-on-surface-variant mb-1">';
    for (var i = 0; i < 7; i++) html += "<div>" + bi(DOW[i], DOW_EN[i]) + "</div>";
    html += '</div><div class="grid grid-cols-7 text-center font-body-md text-[13.5px] gap-y-1">';
    for (var b = 0; b < first; b++) html += "<div></div>";
    for (var d = 1; d <= days; d++) {
      var isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
      var has = evDays[d];
      var cls = "relative w-8 h-8 mx-auto flex items-center justify-center rounded-full " +
        (isToday ? "bg-primary text-white font-bold" : has ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant");
      html += '<div><div class="' + cls + '"' + (has ? ' title="' + esc(has.map(function (e) { return e["title_" + lang()] || e.title_ko; }).join(", ")) + '"' : "") + ">" + d +
        (has ? '<span class="absolute -bottom-0.5 w-1 h-1 rounded-full bg-tertiary"></span>' : "") + "</div></div>";
    }
    html += "</div>";
    el.innerHTML = html;
    var prev = el.querySelector(".cal-prev"), next = el.querySelector(".cal-next");
    if (prev) prev.addEventListener("click", function () { renderCalendar(el, events, m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1, compact); });
    if (next) next.addEventListener("click", function () { renderCalendar(el, events, m === 11 ? y + 1 : y, m === 11 ? 0 : m + 1, compact); });
  }
  function upcomingList(events, n) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var up = (events || []).filter(function (e) { return new Date(e.date + "T00:00:00") >= now; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; }).slice(0, n);
    if (!up.length) return '<p class="font-body-md text-[13.5px] text-on-surface-variant">' + bi("예정된 일정이 없습니다.", "No upcoming events.") + "</p>";
    return up.map(function (e) {
      return '<div class="flex items-start gap-xs py-1.5 border-b border-outline-variant/40 last:border-0">' +
        '<span class="font-data-tabular text-[12.5px] font-semibold text-primary shrink-0 w-[74px]">' + esc(e.date.slice(5).replace("-", ".")) + "</span>" +
        '<span class="font-body-md text-[13.5px] text-on-surface-variant">' + bi(esc(e.title_ko), esc(e.title_en || e.title_ko)) + "</span></div>";
    }).join("");
  }

  var miniCal = document.getElementById("mini-cal");
  var calFull = document.getElementById("cal-full");
  if (miniCal || calFull) {
    load("data/schedule.json", function (data) {
      var ev = data.events || [];
      var now = new Date();
      if (miniCal) {
        renderCalendar(miniCal, ev, now.getFullYear(), now.getMonth(), true);
        var ul = document.getElementById("upcoming-list");
        if (ul) ul.innerHTML = upcomingList(ev, 3);
      }
      if (calFull) {
        renderCalendar(calFull, ev, now.getFullYear(), now.getMonth(), false);
        var ul2 = document.getElementById("upcoming-list-full");
        if (ul2) ul2.innerHTML = upcomingList(ev, 8);
      }
    }, ["mini-cal", "cal-full"]);
  }

  /* ============ 7. 연구실 활동 ============ */
  function activityItem(a, compact) {
    return '<article class="py-sm border-b border-outline-variant/40 last:border-0">' +
      '<div class="flex items-center gap-xs mb-1">' + catBadge(a.category || "기타") +
      '<time class="font-data-tabular text-[12.5px] text-on-surface-variant">' + esc(a.date) + "</time></div>" +
      '<h4 class="font-body-md text-[15px] font-bold text-on-surface leading-snug">' + bi(esc(a.title_ko), esc(a.title_en || a.title_ko)) + "</h4>" +
      (compact ? "" : '<p class="font-body-md text-[14px] text-on-surface-variant mt-1">' + bi(esc(a.body_ko || ""), esc(a.body_en || a.body_ko || "")) + "</p>") +
      "</article>";
  }
  var homeAct = document.getElementById("home-activities");
  var actList = document.getElementById("activity-list");
  if (homeAct || actList) {
    load("data/activities.json", function (data) {
      var items = (data.items || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      if (homeAct) homeAct.innerHTML = items.slice(0, 3).map(function (a) { return activityItem(a, true); }).join("");
      if (actList) {
        function paint(cat) {
          var f = cat === "전체" ? items : items.filter(function (a) { return (a.category || "기타") === cat; });
          actList.innerHTML = f.length ? f.map(function (a) { return activityItem(a, false); }).join("")
            : '<p class="font-body-md text-on-surface-variant py-md">' + bi("해당 분류의 게시물이 없습니다.", "No posts in this category.") + "</p>";
        }
        paint("전체");
        document.querySelectorAll(".act-filter").forEach(function (btn) {
          btn.addEventListener("click", function () {
            document.querySelectorAll(".act-filter").forEach(function (x) {
              x.classList.remove("bg-primary", "text-white");
              x.classList.add("bg-surface-container-lowest", "text-on-surface-variant");
            });
            btn.classList.add("bg-primary", "text-white");
            btn.classList.remove("bg-surface-container-lowest", "text-on-surface-variant");
            paint(btn.getAttribute("data-cat"));
          });
        });
      }
    }, ["home-activities", "activity-list"]);
  }

  /* ============ 8. 연구 성과: Paper·Presentation·Awards ============ */
  function paperCard(p) {
    var q = (p.quartile || "Q1").toUpperCase();
    var qcls = q === "Q1" ? "bg-primary-container text-on-primary-container" : "bg-secondary-container text-on-secondary-container";
    var bar = q === "Q1" ? "bg-primary" : "bg-secondary";
    var btn = p.url
      ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" class="shrink-0 bg-primary text-on-primary px-4 py-2 font-label-caps rounded-lg flex items-center gap-xs shadow-sm transition-transform hover:-translate-y-0.5 mt-sm md:mt-0"><span class="material-symbols-outlined text-[18px]">open_in_new</span> LINK</a>'
      : '<button data-toast-ko="논문 링크는 /admin의 url 항목으로 등록할 수 있습니다." data-toast-en="Add a link via the url field in /admin." class="shrink-0 bg-primary text-on-primary px-4 py-2 font-label-caps rounded-lg flex items-center gap-xs shadow-sm transition-transform hover:-translate-y-0.5 mt-sm md:mt-0"><span class="material-symbols-outlined text-[18px]">download</span> PDF</button>';
    return '<div class="bg-surface-container-lowest shadow-sm rounded-lg p-md flex flex-col md:flex-row gap-md items-start group transition-shadow hover:shadow-md relative overflow-hidden">' +
      '<div class="absolute left-0 top-0 bottom-0 w-1 ' + bar + '"></div>' +
      '<div class="flex-1 flex flex-col gap-xs"><div class="flex gap-sm items-center mb-1 flex-wrap">' +
      '<span class="px-2 py-0.5 ' + qcls + ' font-label-caps rounded-sm">' + esc(q) + "</span>" +
      '<span class="font-data-tabular text-data-tabular font-semibold text-on-surface-variant">' + esc(p.year) + "</span>" +
      (p.doi ? '<span class="font-data-tabular text-[12px] text-outline">DOI: ' + esc(p.doi) + "</span>" : "") + "</div>" +
      '<h3 class="font-headline-md text-[20px] text-on-surface group-hover:text-primary transition-colors">' + esc(p.title) + "</h3>" +
      '<p class="font-body-md text-on-surface-variant">' + esc(p.authors) + "</p>" +
      '<div class="font-data-tabular text-data-tabular text-secondary mt-xs flex items-center gap-xs"><span class="material-symbols-outlined text-[16px]">menu_book</span>' + esc(p.journal) + "</div></div>" + btn + "</div>";
  }
  function presCard(c) {
    return '<div class="bg-surface-container-lowest shadow-sm rounded-lg p-md flex flex-col gap-sm transition-shadow hover:shadow-md relative overflow-hidden">' +
      '<div class="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>' +
      '<div class="flex gap-sm items-center"><span class="material-symbols-outlined text-tertiary">podium</span>' +
      '<span class="font-data-tabular text-data-tabular font-semibold text-on-surface-variant">' + esc(c.date) + "</span></div>" +
      '<h3 class="font-body-lg font-bold text-on-surface">' + esc(c.title) + "</h3>" +
      '<p class="font-body-md text-on-surface-variant">' + esc(c.authors) + "</p>" +
      '<div class="mt-auto pt-sm font-data-tabular text-data-tabular text-tertiary">' + esc(c.venue) + "</div></div>";
  }
  function awardCard(a) {
    return '<div class="bg-surface-container-lowest shadow-sm rounded-lg p-md flex items-start gap-sm transition-shadow hover:shadow-md relative overflow-hidden">' +
      '<div class="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>' +
      '<span class="text-[22px]">🏆</span><div>' +
      '<div class="font-data-tabular text-data-tabular font-semibold text-on-surface-variant">' + esc(a.date) + "</div>" +
      '<h3 class="font-body-lg font-bold text-on-surface mt-0.5">' + bi(esc(a.name_ko), esc(a.name_en || a.name_ko)) + "</h3>" +
      '<p class="font-body-md text-[14.5px] text-on-surface-variant mt-0.5">' + esc(a.recipient || "") + " · " + bi(esc(a.org_ko || ""), esc(a.org_en || a.org_ko || "")) + "</p></div></div>";
  }
  function miniRow(dateStr, title) {
    return '<div class="py-1.5 border-b border-outline-variant/40 last:border-0">' +
      '<div class="font-data-tabular text-[12px] font-semibold text-on-surface-variant">' + esc(dateStr) + "</div>" +
      '<div class="font-body-md text-[13.5px] font-semibold text-on-surface leading-snug line-clamp-2">' + title + "</div></div>";
  }

  var paperList = document.getElementById("paper-list");
  var homePub = document.getElementById("home-pub");
  if (paperList || homePub) {
    load("data/publications.json", function (data) {
      var papers = data.papers || [], pres = data.presentations || [], awards = data.awards || [];
      ["papers", "pres", "awards"].forEach(function (k, i) {
        var el = document.getElementById("stat-" + k);
        if (el) el.textContent = [papers, pres, awards][i].length;
      });
      if (paperList) paperList.innerHTML = papers.map(paperCard).join("");
      var presList = document.getElementById("pres-list");
      if (presList) presList.innerHTML = pres.map(presCard).join("");
      var awardList = document.getElementById("award-list");
      if (awardList) awardList.innerHTML = awards.length ? awards.map(awardCard).join("")
        : '<p class="font-body-md text-on-surface-variant">' + bi("등록된 수상 내역이 없습니다.", "No awards registered yet.") + "</p>";
      if (homePub) {
        var h = "";
        h += '<div class="font-label-caps text-primary mb-1">📄 PAPER <span class="text-on-surface-variant">(' + papers.length + ")</span></div>";
        h += papers.slice(0, 2).map(function (x) { return miniRow(x.year, esc(x.title)); }).join("");
        h += '<div class="font-label-caps text-tertiary mt-sm mb-1">🎤 PRESENTATION <span class="text-on-surface-variant">(' + pres.length + ")</span></div>";
        h += pres.slice(0, 1).map(function (x) { return miniRow(x.date, esc(x.title)); }).join("");
        h += '<div class="font-label-caps text-secondary mt-sm mb-1">🏆 AWARDS <span class="text-on-surface-variant">(' + awards.length + ")</span></div>";
        h += awards.slice(0, 1).map(function (x) { return miniRow(x.date, bi(esc(x.name_ko), esc(x.name_en || x.name_ko))); }).join("");
        homePub.innerHTML = h;
      }
    }, ["paper-list", "pres-list", "award-list", "home-pub"]);
  }

  /* ============ 9. 연구실 장비 ============ */
  var eqList = document.getElementById("equipment-list");
  if (eqList) {
    load("data/equipment.json", function (data) {
      eqList.innerHTML = (data.items || []).map(function (e) {
        var img = e.image
          ? '<div class="h-48 w-full overflow-hidden bg-surface-container-high"><img class="w-full h-full object-cover" alt="" src="' + esc(e.image) + '"/></div>'
          : '<div class="h-48 w-full flex items-center justify-center bg-surface-container-high text-[44px]">🔬</div>';
        return '<div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 overflow-hidden hover:shadow-md transition-shadow">' + img +
          '<div class="p-md"><h3 class="font-headline-md text-[19px] text-on-surface">' + bi(esc(e.name_ko), esc(e.name_en || e.name_ko)) + "</h3>" +
          '<p class="font-body-md text-[14.5px] text-on-surface-variant mt-xs">' + bi(esc(e.desc_ko || ""), esc(e.desc_en || e.desc_ko || "")) + "</p></div></div>";
      }).join("");
    }, ["equipment-list"]);
  }
})();
