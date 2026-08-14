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
    var q = (p.quartile || "").toUpperCase();
    var sci = (p.sci || "SCI");
    var scicls = sci === "SCI" ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-variant text-on-surface-variant";
    var qcls = q === "Q1" ? "bg-primary-container text-on-primary-container" : "bg-secondary-container text-on-secondary-container";
    var bar = q === "Q1" ? "bg-primary" : (q ? "bg-secondary" : "bg-outline-variant");
    var btn = p.url
      ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" class="shrink-0 bg-primary text-on-primary px-4 py-2 font-label-caps rounded-lg flex items-center gap-xs shadow-sm transition-transform hover:-translate-y-0.5 mt-sm md:mt-0"><span class="material-symbols-outlined text-[18px]">school</span> Google Scholar</a>'
      : '<button data-toast-ko="Google Scholar 링크는 /admin의 url 항목으로 등록할 수 있습니다." data-toast-en="Add a Google Scholar link via the url field in /admin." class="shrink-0 bg-surface-container text-on-surface-variant border border-outline-variant px-4 py-2 font-label-caps rounded-lg flex items-center gap-xs shadow-sm transition-transform hover:-translate-y-0.5 mt-sm md:mt-0"><span class="material-symbols-outlined text-[18px]">school</span> Google Scholar</button>';
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
  var memberList = document.getElementById("member-list");
  var alumniBody = document.getElementById("alumni-body");
  if (memberList || alumniBody) {
    load("data/members.json", function (data) {
      if (memberList) {
        memberList.innerHTML = (data.members || []).map(function (m) {
          var avatar = m.photo
            ? '<img class="w-[132px] h-[132px] rounded-full object-cover mb-sm" alt="" src="' + esc(m.photo) + '"/>'
            : '<div class="w-[132px] h-[132px] rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-md text-[40px] mb-sm">' + esc(m.initial || (m.name_ko || "?").charAt(0)) + "</div>";
          return '<div class="bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm p-md flex flex-col hover:shadow-md transition-shadow">' + avatar +
            '<h3 class="font-headline-md text-[18px] text-on-surface">' + bi(esc(m.name_ko), esc(m.name_en || m.name_ko)) + "</h3>" +
            '<p class="font-label-caps text-primary tracking-wider mt-1">' + bi(esc(m.role_ko || ""), esc(m.role_en || m.role_ko || "")) + "</p>" +
            (m.note_ko ? '<p class="font-body-md text-[14px] text-on-surface-variant mt-xs">' + bi(esc(m.note_ko), esc(m.note_en || m.note_ko)) + "</p>" : "") +
            (m.email ? '<a class="mt-auto pt-sm font-body-md text-[13.5px] text-primary hover:underline break-all" href="mailto:' + esc(m.email) + '">' + esc(m.email) + "</a>" : "") +
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
