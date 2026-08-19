/* GeoFlow Engineering Lab — v4 site script
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
    fetch(path + "?t=" + Date.now()).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(onOk)
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
    var q = (p.quartile || "").toUpperCase();
    var sci = (p.sci || "SCI");
    var scicls = sci === "SCI" ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-variant text-on-surface-variant";
    var qcls = q === "Q1" ? "bg-primary-container text-on-primary-container" : "bg-secondary-container text-on-secondary-container";
    var bar = q === "Q1" ? "bg-primary" : (q ? "bg-secondary" : "bg-outline-variant");
    var btn = p.url
      ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" class="shrink-0 bg-primary text-on-primary px-4 py-2 font-label-caps rounded-lg flex items-center gap-xs shadow-sm transition-transform hover:-translate-y-0.5 mt-sm md:mt-0"><span class="material-symbols-outlined text-[18px]">school</span> Google Scholar</a>'
      : '<button data-toast-ko="링크가 등록되어 있지 않습니다." data-toast-en="Link is not registered yet." class="shrink-0 bg-surface-container text-on-surface-variant border border-outline-variant px-4 py-2 font-label-caps rounded-lg flex items-center gap-xs shadow-sm transition-transform hover:-translate-y-0.5 mt-sm md:mt-0"><span class="material-symbols-outlined text-[18px]">school</span> Google Scholar</button>';
    return '<div class="bg-surface-container-lowest shadow-sm rounded-lg p-md flex flex-col md:flex-row gap-md items-start group transition-shadow hover:shadow-md relative overflow-hidden">' +
      '<div class="absolute left-0 top-0 bottom-0 w-1 ' + bar + '"></div>' +
      '<div class="flex-1 flex flex-col gap-xs"><div class="flex gap-sm items-center mb-1 flex-wrap">' +
      '<span class="px-2 py-0.5 ' + scicls + ' font-label-caps rounded-sm">' + esc(sci) + "</span>" +
      (q ? '<span class="px-2 py-0.5 ' + qcls + ' font-label-caps rounded-sm">' + esc(q) + "</span>" : "") +
      '<span class="font-data-tabular text-data-tabular font-semibold text-on-surface-variant">' + esc(p.year) + "</span>" +
      (p.doi ? '<span class="font-data-tabular text-[12px] text-outline">DOI: ' + esc(p.doi) + "</span>" : "") + "</div>" +
      '<h3 class="font-headline-md text-[20px] text-on-surface group-hover:text-primary transition-colors">' + bi(esc(p.title_ko || p.title || ""), esc(p.title_en || p.title_ko || p.title || "")) + "</h3>" +
      '<p class="font-body-md text-on-surface-variant">' + (p.authors_ko ? bi(esc(p.authors_ko), esc(p.authors || p.authors_ko)) : esc(p.authors || "")) + "</p>" +
      '<div class="font-data-tabular text-data-tabular text-secondary mt-xs flex items-center gap-xs"><span class="material-symbols-outlined text-[16px]">menu_book</span>' + bi(esc(p.journal_ko || p.journal || ""), esc(p.journal_en || p.journal_ko || p.journal || "")) + "</div></div>" + btn + "</div>";
  }
  function presCard(c) {
    return '<div class="bg-surface-container-lowest shadow-sm rounded-lg p-md flex flex-col gap-sm transition-shadow hover:shadow-md relative overflow-hidden">' +
      '<div class="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>' +
      '<div class="flex gap-sm items-center"><span class="material-symbols-outlined text-tertiary">podium</span>' +
      '<span class="font-data-tabular text-data-tabular font-semibold text-on-surface-variant">' + esc(c.date) + "</span></div>" +
      '<h3 class="font-body-lg font-bold text-on-surface">' + bi(esc(c.title_ko || c.title || ""), esc(c.title_en || c.title_ko || c.title || "")) + "</h3>" +
      '<p class="font-body-md text-on-surface-variant">' + esc(c.authors || "") + "</p>" +
      '<div class="mt-auto pt-sm font-data-tabular text-data-tabular text-tertiary">' + bi(esc(c.venue_ko || c.venue || ""), esc(c.venue_en || c.venue_ko || c.venue || "")) + "</div></div>";
  }
  function awardCard(a) {
    return '<div class="bg-surface-container-lowest shadow-sm rounded-lg p-md flex items-start gap-sm transition-shadow hover:shadow-md relative overflow-hidden">' +
      '<div class="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>' +
      '<div>' +
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
        h += '<div class="font-label-caps text-primary mb-1">PAPER <span class="text-on-surface-variant">(' + papers.length + ")</span></div>";
        h += papers.slice(0, 2).map(function (x) { return miniRow(x.year, bi(esc(x.title_ko || x.title || ""), esc(x.title_en || x.title_ko || x.title || ""))); }).join("");
        h += '<div class="font-label-caps text-tertiary mt-sm mb-1">PRESENTATION <span class="text-on-surface-variant">(' + pres.length + ")</span></div>";
        h += pres.slice(0, 1).map(function (x) { return miniRow(x.date, bi(esc(x.title_ko || x.title || ""), esc(x.title_en || x.title_ko || x.title || ""))); }).join("");
        h += '<div class="font-label-caps text-secondary mt-sm mb-1">AWARDS <span class="text-on-surface-variant">(' + awards.length + ")</span></div>";
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
          : '<div class="h-48 w-full flex items-center justify-center bg-surface-container-high"><span class="material-symbols-outlined text-[44px] text-outline">imagesmode</span></div>';
        return '<div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 overflow-hidden hover:shadow-md transition-shadow">' + img +
          '<div class="p-md"><h3 class="font-headline-md text-[19px] text-on-surface">' + bi(esc(e.name_ko), esc(e.name_en || e.name_ko)) + "</h3>" +
          '<p class="font-body-md text-[14.5px] text-on-surface-variant mt-xs">' + bi(esc(e.desc_ko || ""), esc(e.desc_en || e.desc_ko || "")) + "</p></div></div>";
      }).join("");
    }, ["equipment-list"]);
  }

  /* ============ 9b. 연구 과제 (Grants) ============ */
  var grantList = document.getElementById("grant-list");
  if (grantList) {
    load("data/grants.json", function (data) {
      var items = data.items || [];
      var gc = document.getElementById("grant-count");
      if (gc) gc.textContent = items.length;
      // 진행 연구 과제: period의 종료 연월이 현재 이후인 과제 수 (해석 불가 시 진행으로 간주)
      var ga = document.getElementById("grant-active-count");
      if (ga) {
        var now = new Date();
        var cur = now.getFullYear() * 100 + (now.getMonth() + 1);
        ga.textContent = items.filter(function (g) {
          var m = String(g.period || "").match(/(\d{4})\s*[.\-\/]\s*(\d{1,2})(?!.*\d{4})/);
          if (!m) return true;
          return (parseInt(m[1], 10) * 100 + parseInt(m[2], 10)) >= cur;
        }).length;
      }
      grantList.innerHTML = items.map(function (g) {
        var roleCls = (g.role_ko || "") === "주관" ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant border border-outline-variant";
        return '<div class="bg-surface-container-lowest shadow-sm rounded-lg p-md flex flex-col md:flex-row md:items-center gap-sm transition-shadow hover:shadow-md relative overflow-hidden">' +
          '<div class="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>' +
          '<div class="flex-1">' +
          '<h3 class="font-body-lg font-bold text-on-surface">' + bi(esc(g.title_ko), esc(g.title_en || g.title_ko)) + "</h3>" +
          '<p class="font-body-md text-[14.5px] text-on-surface-variant mt-1">' + bi(esc(g.agency_ko || ""), esc(g.agency_en || g.agency_ko || "")) + "</p></div>" +
          '<div class="flex items-center gap-sm shrink-0">' +
          '<span class="font-data-tabular text-data-tabular font-semibold text-on-surface-variant">' + esc(g.period || "") + "</span>" +
          '<span class="inline-flex items-center px-sm py-1 rounded-full font-label-caps ' + roleCls + '">' + bi(esc(g.role_ko || ""), esc(g.role_en || g.role_ko || "")) + "</span>" +
          "</div></div>";
      }).join("");
    }, ["grant-list"]);
  }

  /* ============ 10. 구성원 (Members·Alumni·진출 분야) ============ */
  var ICON_LI = "data:image/png;base64,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";
  var ICON_CV = "data:image/png;base64,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";
  function memberCorner(m) {
    var links = "";
    if (m.show_linkedin && m.linkedin) links += '<a href="' + esc(m.linkedin) + '" target="_blank" rel="noopener" title="LinkedIn" class="transition-transform hover:-translate-y-0.5"><img src="' + ICON_LI + '" alt="LinkedIn" style="height:28px;width:auto;display:block"/></a>';
    if (m.show_cv && m.cv) links += '<a href="' + esc(m.cv) + '" download title="CV \uB2E4\uC6B4\uB85C\uB4DC" class="transition-transform hover:-translate-y-0.5"><img src="' + ICON_CV + '" alt="CV" style="height:28px;width:auto;display:block"/></a>';
    return links ? '<div style="position:absolute;top:14px;right:14px" class="flex items-center gap-xs">' + links + "</div>" : "";
  }
  function memberFoot(m) {
    return m.email ? '<a class="mt-auto pt-sm font-body-md text-[13.5px] text-primary hover:underline break-all" href="mailto:' + esc(m.email) + '">' + esc(m.email) + "</a>" : "";
  }
  var memberList = document.getElementById("member-list");
  var alumniBody = document.getElementById("alumni-body");
  if (memberList || alumniBody) {
    load("data/members.json", function (data) {
      if (memberList) {
        memberList.innerHTML = (data.members || []).map(function (m) {
          var avatar = m.photo
            ? '<img class="w-[132px] h-[132px] rounded-full object-cover mb-sm" alt="" src="' + esc(m.photo) + '"/>'
            : '<div class="w-[132px] h-[132px] rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-md text-[40px] mb-sm">' + esc(m.initial || (m.name_ko || "?").charAt(0)) + "</div>";
          return '<div class="relative bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm p-md flex flex-col hover:shadow-md transition-shadow">' + memberCorner(m) + avatar +
            '<h3 class="font-headline-md text-[18px] text-on-surface">' + bi(esc(m.name_ko), esc(m.name_en || m.name_ko)) + "</h3>" +
            '<p class="font-label-caps text-primary tracking-wider mt-1">' + bi(esc(m.role_ko || ""), esc(m.role_en || m.role_ko || "")) + "</p>" +
            (m.note_ko ? '<p class="font-body-md text-[14px] text-on-surface-variant mt-xs">' + bi(esc(m.note_ko).replace(/\n/g, "<br/>"), esc(m.note_en || m.note_ko).replace(/\n/g, "<br/>")) + "</p>" : "") +
            memberFoot(m) +
            "</div>";
        }).join("");
      }
      if (alumniBody) {
        alumniBody.innerHTML = (data.alumni || []).map(function (a) {
          return '<tr class="hover:bg-surface-container-low">' +
            '<td class="py-sm px-md font-semibold">' + bi(esc(a.org_ko), esc(a.org_en || a.org_ko)) + "</td>" +
            '<td class="py-sm px-md text-on-surface-variant">' + bi(esc(a.role_ko || ""), esc(a.role_en || a.role_ko || "")) + "</td>" +
            '<td class="py-sm px-md text-on-surface-variant">' + bi(esc(a.degree_ko || ""), esc(a.degree_en || a.degree_ko || "")) + "</td></tr>";
        }).join("");
      }
      var pub = document.getElementById("career-public"), ind = document.getElementById("career-industry");
      function chip(c, primary) {
        var cls = primary ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant border border-outline-variant";
        return '<span class="inline-flex items-center px-sm py-base ' + cls + ' font-body-md text-[13.5px] font-semibold rounded-full">' + bi(esc(c.name_ko), esc(c.name_en || c.name_ko)) + "</span>";
      }
      var careers = data.careers || [];
      if (pub) pub.innerHTML = careers.filter(function (c) { return c.sector === "공공"; }).map(function (c) { return chip(c, true); }).join("");
      if (ind) ind.innerHTML = careers.filter(function (c) { return c.sector !== "공공"; }).map(function (c) { return chip(c, false); }).join("");
    }, ["member-list"]);
  }

  /* ============ 11. 소개 페이지 (What we do·교과목·협력기관) ============ */
  var wwd = document.getElementById("whatwedo-list");
  var courseBody = document.getElementById("course-body");
  var partnerList = document.getElementById("partner-list");
  if (wwd || courseBody || partnerList) {
    load("data/about.json", function (data) {
      if (wwd) {
        wwd.innerHTML = (data.whatwedo || []).map(function (w) {
          var media = w.image
            ? '<div class="h-40 w-full rounded-lg overflow-hidden mb-md bg-surface-container-high"><img class="w-full h-full object-cover" alt="" src="' + esc(w.image) + '"/></div>'
            : '<div class="h-40 w-full rounded-lg mb-md bg-surface-container-high border border-dashed border-outline-variant flex items-center justify-center"><span class="material-symbols-outlined text-[36px] text-outline">imagesmode</span></div>';
          return '<div class="bg-surface-container-lowest rounded-xl shadow-sm p-md border border-outline-variant/40">' + media +
            '<h3 class="font-headline-md text-[19px] text-on-surface mb-xs">' + bi(w.title_ko, w.title_en || w.title_ko) + "</h3>" +
            '<p class="font-body-md text-[15px] text-on-surface-variant">' + bi(w.desc_ko || "", w.desc_en || w.desc_ko || "") + "</p></div>";
        }).join("");
      }
      function courseRows(list) {
        return (list || []).map(function (c, i) {
          return '<tr class="hover:bg-surface-container-low' + (i % 2 ? ' bg-surface-bright' : '') + '">' +
            '<td class="py-sm px-md font-semibold">' + bi(esc(c.name_ko), esc(c.name_en || c.name_ko)) + "</td>" +
            '<td class="py-sm px-md text-on-surface-variant">' + esc(c.term || "") + "</td></tr>";
        }).join("");
      }
      if (courseBody) courseBody.innerHTML = courseRows(data.courses);
      var gradBody = document.getElementById("grad-course-body");
      if (gradBody) {
        var g = data.grad_courses || [];
        gradBody.innerHTML = g.length ? courseRows(g)
          : '<tr><td colspan="2" class="py-sm px-md text-on-surface-variant">' + bi("대학원 교과목은 준비 중입니다.", "Graduate courses will be posted soon.") + "</td></tr>";
      }
      if (partnerList) {
        partnerList.innerHTML = (data.partners || []).map(function (p) {
          var cls = p.highlight ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant border border-outline-variant";
          return '<span class="inline-flex items-center px-sm py-base ' + cls + ' font-body-md text-[14px] font-semibold rounded-full">' + bi(esc(p.name_ko), esc(p.name_en || p.name_ko)) + "</span>";
        }).join("");
      }
    }, ["whatwedo-list", "partner-list"]);
  }

  /* ============ 12. 홈 히어로 이미지 (data/home.json) ============ */
  if (slides.length) {
    load("data/home.json", function (data) {
      (data.hero || []).forEach(function (h, i) {
        if (slides[i] && h.image) slides[i].style.backgroundImage = "url('" + h.image + "')";
      });
    }, []);
  }

  /* ============ 13. 연구 프로젝트 (목록·상세 공용 템플릿) ============ */
  var STATUS_CLS = { "진행 중": "bg-primary-container text-on-primary-container", "진행 예정": "bg-tertiary-container text-on-tertiary-container", "종료": "bg-surface-variant text-on-surface-variant" };
  var STATUS_EN = { "진행 중": "ONGOING", "진행 예정": "PLANNED", "종료": "COMPLETED" };
  function statusChip(s, dark) {
    var base = STATUS_CLS[s] || STATUS_CLS["진행 중"];
    if (dark) base = "bg-white/15 text-white border border-white/30";
    return '<span class="inline-flex items-center px-sm py-1 rounded-full font-label-caps ' + base + '">' + bi(esc(s), esc(STATUS_EN[s] || s)) + "</span>";
  }
  var pjCards = document.getElementById("project-cards");
  if (pjCards) {
    load("data/projects.json", function (data) {
      var items = data.items || [];
      var cnt = document.getElementById("proj-count");
      if (cnt) cnt.textContent = items.length;
      pjCards.innerHTML = items.map(function (p) {
        var c = p.card || {};
        return '<a class="group relative bg-surface-container-lowest rounded-xl flex flex-col h-full overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-md border border-outline-variant/40" href="project.html?id=' + encodeURIComponent(p.id) + '">' +
          '<div class="h-48 w-full overflow-hidden bg-surface-container-high">' + (c.image ? '<img class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="" src="' + esc(c.image) + '"/>' : "") + "</div>" +
          '<div class="p-md flex flex-col flex-grow">' +
          '<div class="flex items-center justify-between mb-sm"><span class="font-label-caps text-primary uppercase tracking-widest">' + esc(c.chip || "") + "</span>" + statusChip(p.status) + "</div>" +
          '<h3 class="font-headline-md text-[20px] text-on-surface mb-xs group-hover:text-primary transition-colors">' + bi(esc(p.title_ko), esc(p.title_en || p.title_ko)) + "</h3>" +
          '<p class="font-body-md text-[15px] text-on-surface-variant mb-md flex-grow">' + bi(c.desc_ko || "", c.desc_en || c.desc_ko || "") + "</p>" +
          '<div class="flex items-center justify-between mt-auto">' +
          '<span class="inline-flex items-center px-xs py-base bg-secondary-container text-on-secondary-container font-data-tabular text-data-tabular rounded-sm">' + esc(c.tag || "") + "</span>" +
          '<span class="inline-flex items-center gap-1 font-label-caps text-primary">' + bi("자세히", "DETAILS") + ' <span class="material-symbols-outlined text-[16px]">chevron_right</span></span>' +
          "</div></div></a>";
      }).join("");
    }, ["project-cards"]);
  }
  var pjTitle = document.getElementById("pj-title");
  if (pjTitle) {
    load("data/projects.json", function (data) {
      var items = data.items || [];
      var id = null;
      try { id = new URLSearchParams(window.location.search).get("id"); } catch (e) {}
      var p = items.filter(function (x) { return x.id === id; })[0] || items[0];
      if (!p) return;
      var t = document.querySelector("title");
      if (t) {
        t.setAttribute("data-ko", p.title_ko + " | GeoFlow Engineering Lab");
        t.setAttribute("data-en", (p.title_en || p.title_ko) + " | GeoFlow Engineering Lab");
        t.textContent = (lang() === "ko" ? p.title_ko : (p.title_en || p.title_ko)) + " | GeoFlow Engineering Lab";
      }
      document.getElementById("pj-status").innerHTML = statusChip(p.status, true);
      pjTitle.innerHTML = bi(esc(p.title_ko), esc(p.title_en || p.title_ko));
      document.getElementById("pj-lead").innerHTML = bi(esc(p.lead_ko || ""), esc(p.lead_en || p.lead_ko || ""));
      document.getElementById("pj-keywords").innerHTML = (p.keywords || []).map(function (k) {
        return '<span class="inline-flex items-center px-xs py-base bg-white/10 text-secondary-fixed font-data-tabular text-data-tabular rounded-sm">' + esc(k) + "</span>";
      }).join("");
      document.getElementById("pj-bg").innerHTML = bi(esc(p.bg_ko || ""), esc(p.bg_en || p.bg_ko || ""));
      document.getElementById("pj-sections").innerHTML = (p.sections || []).slice(0, 4).map(function (s, i) {
        var lis = (s.bullets || []).map(function (b) {
          return '<li class="flex items-start gap-xs"><span class="material-symbols-outlined text-primary text-[18px] mt-[3px]">check</span><span>' + bi(esc(b.ko), esc(b.en || b.ko)) + "</span></li>";
        }).join("");
        return '<div class="flex gap-md">' +
          '<div class="shrink-0 w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-headline-md text-[15px]">' + (i + 1) + "</div>" +
          '<div class="flex-1"><h3 class="font-headline-md text-[20px] text-on-surface mb-xs">' + bi(esc(s.title_ko), esc(s.title_en || s.title_ko)) + "</h3>" +
          '<ul class="space-y-xs font-body-md text-[15.5px] text-on-surface-variant">' + lis + "</ul></div></div>";
      }).join("");
      var res = document.getElementById("pj-results");
      if (p.results_ko || p.results_en) {
        res.classList.remove("hidden");
        res.innerHTML = bi(esc(p.results_ko || ""), esc(p.results_en || p.results_ko || ""));
      }
      document.getElementById("pj-figures").innerHTML = (p.figures || []).slice(0, 4).map(function (fg) {
        return '<figure class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow border border-outline-variant/40">' +
          '<div class="h-44 w-full overflow-hidden bg-surface-container-high"><img alt="" class="w-full h-full object-contain p-sm bg-surface-container-lowest transform group-hover:scale-105 transition-transform duration-700" src="' + esc(fg.image) + '"/></div>' +
          '<figcaption class="px-md py-sm font-body-md text-[13px] text-on-surface-variant border-t border-outline-variant/50">' + bi(esc(fg.cap_ko || ""), esc(fg.cap_en || fg.cap_ko || "")) + "</figcaption></figure>";
      }).join("");
      document.getElementById("pj-related").innerHTML = items.filter(function (x) { return x.id !== p.id; }).slice(0, 3).map(function (x) {
        return '<a class="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-sm p-md group hover:shadow-md hover:-translate-y-0.5 transition-all block" href="project.html?id=' + encodeURIComponent(x.id) + '">' +
          '<h3 class="font-headline-md text-[17px] text-on-surface group-hover:text-primary transition-colors mb-sm">' + bi(esc(x.title_ko), esc(x.title_en || x.title_ko)) + "</h3>" +
          '<span class="inline-flex items-center gap-1 font-label-caps text-primary">' + bi("보러 가기", "VIEW") + ' <span class="material-symbols-outlined text-[16px]">arrow_forward</span></span></a>';
      }).join("");
    }, ["pj-sections", "pj-figures", "pj-related"]);
  }
})();
