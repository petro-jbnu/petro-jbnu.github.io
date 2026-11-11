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
      b.textContent = lang === "ko" ? "→ View in English" : "→ 한국어로 보기";
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
    function setMenu(open) {
      mobileMenu.classList.toggle("hidden", !open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (icon) icon.textContent = open ? "close" : "menu";
    }
    menuBtn.addEventListener("click", function () {
      setMenu(mobileMenu.classList.contains("hidden"));
    });
    mobileMenu.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) setMenu(false);
    });
    /* 메뉴가 열린 상태에서 메뉴 바깥을 누르면 닫기 (iOS에서도 동작하도록 pointerdown 사용) */
    document.addEventListener("pointerdown", function (ev) {
      if (mobileMenu.classList.contains("hidden")) return;
      if (mobileMenu.contains(ev.target) || menuBtn.contains(ev.target)) return;
      setMenu(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !mobileMenu.classList.contains("hidden")) setMenu(false);
    });
  }

  /* ============ 4. Hero slider ============ */
  var slides = document.querySelectorAll(".hero-slide");
  var dots = document.querySelectorAll(".hero-dot");
  var captions = document.querySelectorAll(".hero-caption");
  var heroN = slides.length;
  var setHeroCount = function () {};
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
      current = (i + heroN) % heroN;
      slides[current].classList.remove("opacity-0"); slides[current].classList.add("opacity-100");
      dots[current].classList.remove("bg-white/40"); dots[current].classList.add("bg-white");
      setCaption(current, true);
    }
    /* PC(1024px 이상)에서 1번 슬라이드에 데모(#hero-demo)가 있으면 한 바퀴(약 13.4초)를 다 보여 주도록 14초, 나머지는 5초 */
    var heroDemo = document.getElementById("hero-demo") && window.matchMedia && matchMedia("(min-width: 1024px)").matches;
    function reset() {
      clearTimeout(interval);
      interval = setTimeout(function () { show(current + 1); reset(); }, current === 0 && heroDemo ? 14000 : 5000);
    }
    /* 등록된 히어로 장수가 DOM보다 적으면 초과 슬라이드·도트·캡션을 숨기고 회전 범위를 줄임 */
    setHeroCount = function (n) {
      if (!n || n < 1 || n >= slides.length) return;
      for (var k = n; k < slides.length; k++) {
        slides[k].style.display = "none";
        if (dots[k]) dots[k].style.display = "none";
        if (captions[k]) captions[k].style.display = "none";
      }
      if (current >= n) show(0);
      heroN = n;
      if (n === 1) clearTimeout(interval);
    };
    dots.forEach(function (d, i) { d.addEventListener("click", function () { show(i); reset(); }); });
    var hero = document.getElementById("hero");
    if (hero) {
      hero.addEventListener("mouseenter", function () { clearTimeout(interval); });
      hero.addEventListener("mouseleave", reset);
    }
    reset();
  }

  /* ============ 5. Data helpers ============ */
  var esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
  /* 본문 서식: 안전하게 이스케이프한 뒤 허용 태그만 복원하고 줄바꿈을 <br>로 */
  function rich(s) {
    var t = esc(s).replace(/>/g, "&gt;");
    t = t.replace(/&lt;(\/?)(strong|b|em|i|u|sub|sup|br)\s*\/?&gt;/gi, function (m, close, tag) {
      return "<" + (close || "") + tag.toLowerCase() + ">";
    });
    return t.replace(/\n/g, "<br/>");
  }
  /* 활동 고유 링크 키 (날짜+제목 기반 안정 해시) */
  function actId(a) {
    var s = (a.date || "") + "|" + (a.title_ko || a.title_en || "");
    var h = 5381;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; }
    return h.toString(36);
  }
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
  /* v49: 기록형 목록은 content/<이름>.json(배열 하나)에 저장 — 관리자 페이지에서 항목별로 편집.
     여러 목록을 한 번에 읽어 { 키: 배열 } 묶음으로 넘김. 하나라도 못 읽으면 안내 문구 표시. */
  function loadLists(map, onOk, containers) {
    var keys = Object.keys(map);
    Promise.all(keys.map(function (k) {
      return fetch("content/" + map[k] + ".json?t=" + Date.now()).then(function (r) { if (!r.ok) throw 0; return r.json(); });
    })).then(function (vals) {
      var data = {};
      keys.forEach(function (k, i) { data[k] = Array.isArray(vals[i]) ? vals[i] : []; });
      onOk(data);
    }).catch(function () {
      (containers || []).forEach(function (id) { var el = document.getElementById(id); if (el) offlineNotice(el); });
    });
  }
  var CAT_EN = { "교육": "Education", "워크샵": "Workshop", "발표": "Presentation", "기타": "Others" };
  var CAT_CLS = { "교육": "bg-primary-container text-on-primary-container", "워크샵": "bg-tertiary-container text-on-tertiary-container", "발표": "cat-present", "기타": "bg-surface-variant text-on-surface-variant" };
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
  function eventRow(e, past) {
    var dateCls = past ? "text-on-surface-variant" : "text-primary";
    return '<div class="flex items-start gap-xs py-1.5 border-b border-outline-variant/40 last:border-0">' +
      '<span class="font-data-tabular text-[12.5px] font-semibold ' + dateCls + ' shrink-0 w-[74px]">' + esc(e.date.slice(5).replace("-", ".")) + "</span>" +
      '<span class="font-body-md text-[13.5px] text-on-surface-variant">' + bi(esc(e.title_ko), esc(e.title_en || e.title_ko)) + "</span></div>";
  }
  function upcomingList(events, n) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var up = (events || []).filter(function (e) { return new Date(e.date + "T00:00:00") >= now; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (n) up = up.slice(0, n);
    if (!up.length) return '<p class="font-body-md text-[13.5px] text-on-surface-variant">' + bi("예정된 일정이 없습니다.", "No upcoming events.") + "</p>";
    return up.map(function (e) { return eventRow(e, false); }).join("");
  }
  function pastListHtml(events, n) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var pastEv = (events || []).filter(function (e) { return new Date(e.date + "T00:00:00") < now; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    if (n) pastEv = pastEv.slice(0, n);
    if (!pastEv.length) return '<p class="font-body-md text-[13.5px] text-on-surface-variant">' + bi("지난 일정이 없습니다.", "No past events.") + "</p>";
    return pastEv.map(function (e) { return eventRow(e, true); }).join("");
  }
  function injectSchStyle() {
    if (document.getElementById("sch-scroll-style")) return;
    var s = document.createElement("style");
    s.id = "sch-scroll-style";
    s.textContent = "@media (min-width:768px){.sch-scroll{max-height:420px;overflow-y:auto;padding-right:6px;scrollbar-width:thin;scrollbar-color:#c2ced5 transparent}" +
      ".sch-scroll::-webkit-scrollbar{width:7px}.sch-scroll::-webkit-scrollbar-thumb{background:#c2ced5;border-radius:8px}" +
      ".sch-scroll::-webkit-scrollbar-track{background:transparent}}";
    document.head.appendChild(s);
  }

  var miniCal = document.getElementById("mini-cal");
  var calFull = document.getElementById("cal-full");
  if (miniCal || calFull) {
    loadLists({ events: "schedule" }, function (data) {
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
        if (ul2) {
          injectSchStyle();
          var tabs = document.querySelectorAll(".sch-tab");
          function paintSch(mode) {
            ul2.innerHTML = mode === "past" ? pastListHtml(ev, 0) : upcomingList(ev, 0);
            tabs.forEach(function (t) {
              var on = t.getAttribute("data-sch") === mode;
              t.classList.toggle("bg-primary", on);
              t.classList.toggle("text-white", on);
              t.classList.toggle("bg-surface-container-lowest", !on);
              t.classList.toggle("text-on-surface-variant", !on);
              t.classList.toggle("border", !on);
              t.classList.toggle("border-outline-variant", !on);
            });
          }
          tabs.forEach(function (t) {
            t.addEventListener("click", function () { paintSch(t.getAttribute("data-sch")); });
          });
          paintSch("up");
        }
      }
    }, ["mini-cal", "cal-full"]);
  }

  /* ============ 7. 연구실 활동 ============ */
  function activityItem(a, compact) {
    var href = "activity.html?id=" + actId(a);
    return '<a href="' + href + '" class="block py-sm border-b border-outline-variant/40 last:border-0 group">' +
      '<div class="flex items-center gap-xs mb-1">' + catBadge(a.category || "기타") +
      '<time class="font-data-tabular text-[12.5px] text-on-surface-variant">' + esc(a.date) + "</time></div>" +
      '<h4 class="font-body-md text-[15px] font-bold text-on-surface leading-snug group-hover:text-primary transition-colors">' + bi(esc(a.title_ko), esc(a.title_en || a.title_ko)) + "</h4>" +
      "</a>";
  }
  /* 홈 '연구실 활동' 칸: 최신 글은 큰 사진, 나머지는 작은 썸네일 행. 사진은 thumb(대표 사진) → 첫 사진 순, 없으면 로고 */
  function actThumb(a) {
    if (a.thumb) return a.thumb;
    var im = (a.images || [])[0];
    return im ? (im.image || im) : "";
  }
  function homeActItem(a, i) {
    var href = "activity.html?id=" + actId(a), src = actThumb(a);
    var ph = src ? '<img src="' + esc(src) + '" alt="" loading="lazy"/>' : '<img class="hu-logo" src="assets/img/geoflow-mark.png" alt=""/>';
    var meta = '<span class="hu-meta">' + catBadge(a.category || "기타") + '<time>' + esc(a.date) + "</time></span>";
    var title = '<span class="hu-at">' + bi(esc(a.title_ko), esc(a.title_en || a.title_ko)) + "</span>";
    if (i === 0) return '<a href="' + href + '" class="hu-act hu-act-lg"><span class="hu-ph">' + ph + "</span>" + meta + title + "</a>";
    return '<a href="' + href + '" class="hu-act hu-act-sm"><span class="hu-ph">' + ph + '</span><span class="hu-sm-b">' + meta + title + "</span></a>";
  }
  var homeAct = document.getElementById("home-activities");
  var actList = document.getElementById("activity-list");
  if (homeAct || actList) {
    loadLists({ items: "activities" }, function (data) {
      var items = (data.items || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      if (homeAct) homeAct.innerHTML = items.slice(0, 3).map(homeActItem).join("");
      if (actList) {
        document.querySelectorAll('[data-n="acts"]').forEach(function (e) { e.textContent = items.length; });
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
  /* v39 연구 성과(C안): 연도별 논문 행 · 발표 표 · 수상 표 */
  function doiTxt(d) { return String(d || "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, ""); }
  function authorsBi(x) { return x.authors_ko ? bi(esc(x.authors_ko), esc(x.authors || x.authors_ko)) : esc(x.authors || ""); }
  function titleBi(x) { return bi(esc(x.title_ko || x.title || ""), esc(x.title_en || x.title_ko || x.title || "")); }
  function paperRow(p) {
    var q = (p.quartile || "").toUpperCase(), sci = p.sci || "SCI", meta = [esc(sci)];
    if (q) meta.push(esc(q));
    if (p.doi) meta.push("DOI " + esc(doiTxt(p.doi)));
    var open = p.url ? '<a class="pb-row pb-paper" href="' + esc(p.url) + '" target="_blank" rel="noopener">' : '<div class="pb-row pb-paper">';
    return open + '<span class="pb-t">' + titleBi(p) + "</span>" +
      '<span class="pb-a">' + authorsBi(p) + "</span>" +
      '<span class="pb-m"><span class="pb-j">' + bi(esc(p.journal_ko || p.journal || ""), esc(p.journal_en || p.journal_ko || p.journal || "")) + "</span><span>" + meta.join(" · ") + "</span>" +
      (p.url ? '<span class="pb-go">' + bi("원문", "Visit") + " ↗</span>" : "") + "</span>" + (p.url ? "</a>" : "</div>");
  }
  function paperGroups(papers) {
    var groups = [], cur = null;
    papers.forEach(function (p) {
      var y = String(p.year == null ? "" : p.year).trim() || "—";
      if (!cur || cur.y !== y) { cur = { y: y, items: [] }; groups.push(cur); }
      cur.items.push(p);
    });
    return groups.map(function (g) {
      return '<div class="pb-yr"><span class="pb-y">' + esc(g.y) + '</span><div class="pb-rows">' + g.items.map(paperRow).join("") + "</div></div>";
    }).join("");
  }
  /* 날짜 표기 정규화(표시용): "October 2026" → "2026.10", "2026.08." → "2026.08", "2026-10-30" → "2026.10.30" */
  var MON = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12, jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
  function fmtDate(v) {
    var t = String(v == null ? "" : v).trim();
    var m = t.match(/^([A-Za-z]+)\.?\s+(\d{4})$/);
    if (m && MON[m[1].toLowerCase()]) return m[2] + "." + String(MON[m[1].toLowerCase()]).padStart(2, "0");
    m = t.match(/^(\d{4})[.\-\/](\d{1,2})(?:[.\-\/](\d{1,2}))?\.?$/);
    if (m) return m[1] + "." + m[2].padStart(2, "0") + (m[3] ? "." + m[3].padStart(2, "0") : "");
    return t.replace(/\.$/, "");
  }
  /* 내림차순 안정 정렬: key 문자열이 큰 것부터, 같으면 원래 순서 */
  function sortDesc(list, key) {
    return (list || []).map(function (x, i) { return { x: x, i: i, k: key(x) }; })
      .sort(function (a, b) { return a.k === b.k ? a.i - b.i : (a.k < b.k ? 1 : -1); })
      .map(function (o) { return o.x; });
  }
  function presRow(c) {
    var f = c.format === "oral" ? bi("구두", "Oral") : (c.format === "poster" ? bi("포스터", "Poster") : "—");
    return '<div class="pb-row pb-tr pb-tr-pres"><span class="pb-d">' + esc(fmtDate(c.date)) + "</span>" +
      '<span class="pb-f' + (c.format === "oral" ? " is-oral" : "") + '">' + f + "</span>" +
      '<span class="pb-tt"><span class="pb-t">' + titleBi(c) + '</span><span class="pb-a">' + authorsBi(c) + "</span></span>" +
      '<span class="pb-v pb-r">' + bi(esc(c.venue_ko || c.venue || ""), esc(c.venue_en || c.venue_ko || c.venue || "")) + "</span></div>";
  }
  function awardKindBi(a) { return (a.award_ko || a.award_en) ? bi(esc(a.award_ko || a.award_en), esc(a.award_en || a.award_ko)) : ""; }
  function awardRow(a) {
    var who = (a.recipient_ko ? bi(esc(a.recipient_ko), esc(a.recipient || a.recipient_ko)) : esc(a.recipient || "")) +
      ((a.org_ko || a.org_en) ? " · " + bi(esc(a.org_ko || a.org_en), esc(a.org_en || a.org_ko)) : "");
    return '<div class="pb-row pb-tr pb-tr-aw"><span class="pb-d">' + esc(fmtDate(a.date)) + "</span>" +
      '<span class="pb-aw">' + (awardKindBi(a) || "—") + "</span>" +
      '<span class="pb-t">' + bi(esc(a.name_ko || ""), esc(a.name_en || a.name_ko || "")) + "</span>" +
      '<span class="pb-v">' + who + "</span></div>";
  }
  function miniRow(dateStr, title) {
    return '<div class="py-1.5 border-b border-outline-variant/40 last:border-0">' +
      '<div class="font-data-tabular text-[12px] font-semibold text-on-surface-variant">' + esc(dateStr) + "</div>" +
      '<div class="font-body-md text-[13.5px] font-semibold text-on-surface leading-snug line-clamp-2">' + title + "</div></div>";
  }

  /* ===== 목록 길이 제어: 모든 화면에서 '더보기' 버튼 (안쪽 스크롤 상자 없음) =====
     PC 8개 / 모바일 5개까지 보이고, 남은 항목이 2개 이하면 버튼 없이 전부 표시합니다. */
  function pubVisible() { return window.matchMedia && window.matchMedia("(min-width:768px)").matches ? 8 : 5; }
  function setupPubList(el, total, rowSel) {
    if (!el) return;
    var nx = el.nextElementSibling;
    if (nx && nx.classList.contains("pub-more")) nx.parentNode.removeChild(nx);
    var kids = Array.prototype.slice.call(rowSel ? el.querySelectorAll(rowSel) : el.children);
    kids.forEach(function (k) { k.style.display = ""; });
    var vis = pubVisible();
    if (!total || total <= vis + 2) return;
    var open = false;
    function paint() {
      kids.forEach(function (k, i) { k.style.display = (!open && i >= vis) ? "none" : ""; });
      if (rowSel) Array.prototype.forEach.call(el.querySelectorAll(".pb-yr"), function (g) {
        var any = Array.prototype.some.call(g.querySelectorAll(rowSel), function (r) { return r.style.display !== "none"; });
        g.style.display = any ? "" : "none";
      });
      btn.innerHTML = open
        ? bi("접기", "Show less") + '<span class="material-symbols-outlined text-[18px]">expand_less</span>'
        : bi("더보기 (+" + (total - vis) + ")", "Show more (+" + (total - vis) + ")") + '<span class="material-symbols-outlined text-[18px]">expand_more</span>';
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pub-more";
    btn.style.cssText = "width:100%;margin-top:12px;padding:11px 10px;border:1px solid #c5c6cd;border-radius:8px;background:#fff;color:#45474c;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px";
    btn.addEventListener("click", function () { open = !open; paint(); if (!open) el.scrollIntoView({ block: "start", behavior: "smooth" }); });
    paint();
    el.parentNode.insertBefore(btn, el.nextSibling);
  }

  var paperList = document.getElementById("paper-list");
  var homePub = document.getElementById("home-pub");
  if (paperList || homePub) {
    loadLists({ papers: "papers", presentations: "presentations", awards: "awards" }, function (data) {
      /* v49: 새 항목은 목록 끝에 저장되므로 표시 전에 최신순 정렬(같으면 저장 순서 유지) */
      var papers = sortDesc(data.papers, function (p) { return String(p.year == null ? "" : p.year).trim(); }),
        pres = sortDesc(data.presentations, function (c) { return fmtDate(c.date); }),
        awards = sortDesc(data.awards, function (a) { return fmtDate(a.date); });
      var CNT = { papers: [papers.length + "편", papers.length + (papers.length === 1 ? " paper" : " papers")],
        pres: [pres.length + "건", pres.length + (pres.length === 1 ? " talk" : " talks")],
        awards: [awards.length + "건", awards.length + (awards.length === 1 ? " award" : " awards")] };
      document.querySelectorAll("[data-c]").forEach(function (e) { var c = CNT[e.getAttribute("data-c")]; if (c) e.innerHTML = bi(c[0], c[1]); });
      if (paperList) { paperList.innerHTML = paperGroups(papers); setupPubList(paperList, papers.length, ".pb-row"); }
      var presList = document.getElementById("pres-list");
      if (presList) { presList.innerHTML = pres.map(presRow).join(""); setupPubList(presList, pres.length); }
      var awardList = document.getElementById("award-list");
      if (awardList) awardList.innerHTML = awards.length ? awards.map(awardRow).join("")
        : '<p class="font-body-md text-on-surface-variant py-sm">' + bi("등록된 수상 내역이 없습니다.", "No awards registered yet.") + "</p>";
      setupPubList(awardList, awards.length);
      /* 순서 바: 건수 표시 + 현재 위치 강조 + 부드러운 이동 */
      var pnav = document.getElementById("pub-nav");
      if (pnav) {
        var cnt = { papers: papers.length, pres: pres.length, awards: awards.length };
        pnav.querySelectorAll("[data-n]").forEach(function (e) { var v = cnt[e.getAttribute("data-n")]; if (v != null) e.textContent = v; });
        var links = Array.prototype.slice.call(pnav.querySelectorAll("a[href^='#']"));
        var secs = links.map(function (l) { return document.getElementById(l.getAttribute("href").slice(1)); });
        function setActive(id) { links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + id); }); }
        links.forEach(function (l) {
          l.addEventListener("click", function (ev) {
            var t = document.getElementById(l.getAttribute("href").slice(1));
            if (!t) return;
            ev.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" });
            try { history.replaceState(null, "", l.getAttribute("href")); } catch (e) {}
          });
        });
        function onScroll() {
          var top = window.matchMedia("(min-width:1024px)").matches ? 134 : 160, cur = secs[0] && secs[0].id;
          secs.forEach(function (sec) { if (sec && sec.getBoundingClientRect().top - top <= 0) cur = sec.id; });
          /* v50: 페이지 끝까지 내리면 마지막 항목 강조 */
          var lastSec = secs.filter(Boolean).slice(-1)[0];
          if (lastSec && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = lastSec.id;
          if (cur) setActive(cur);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        if (location.hash) { var h = document.getElementById(location.hash.slice(1)); if (h) setTimeout(function () { h.scrollIntoView({ block: "start" }); }, 50); }
      }
      if (homePub) {
        /* 홈 '연구 성과' 칸: 논문·발표·수상 최신 1건씩, 칸 높이를 3등분해 여백을 고르게 */
        function hp(cls, label, n, meta, title, href) {
          var open = href ? '<a class="hu-pub" href="' + href + '">' : '<div class="hu-pub">';
          return open + '<span class="hu-pl ' + cls + '">' + label + ' <span class="hu-pn">(' + n + ")</span></span>" +
            '<span class="hu-pm">' + meta + '</span><span class="hu-pt">' + title + "</span>" + (href ? "</a>" : "</div>");
        }
        var h = "", x;
        if ((x = papers[0])) h += hp("is-paper", "PAPER", papers.length,
          esc(x.year) + " · " + bi(esc(x.journal_ko || x.journal || ""), esc(x.journal_en || x.journal_ko || x.journal || "")), titleBi(x), "publications.html#paper");
        if ((x = pres[0])) h += hp("is-pres", "PRESENTATION", pres.length,
          esc(fmtDate(x.date)) + " · " + bi(esc(x.venue_ko || x.venue || ""), esc(x.venue_en || x.venue_ko || x.venue || "")), titleBi(x), "publications.html#presentation");
        if ((x = awards[0])) {
          var kind = function (k, e) { return k ? "[" + esc(k) + "\uD83C\uDFC6] " : (e ? "[" + esc(e) + " \uD83C\uDFC6] " : ""); };
          h += hp("is-award", "AWARDS", awards.length,
            esc(fmtDate(x.date)) + " · " + (x.recipient_ko ? bi(esc(x.recipient_ko), esc(x.recipient || x.recipient_ko)) : esc(x.recipient || "")) + ((x.org_ko || x.org_en) ? " · " + bi(esc(x.org_ko || x.org_en), esc(x.org_en || x.org_ko)) : ""),
            bi(kind(x.award_ko, x.award_en) + esc(x.name_ko || ""), kind(x.award_en || x.award_ko, "") + esc(x.name_en || x.name_ko || "")), "publications.html#awards");
        }
        homePub.innerHTML = h;
      }
    }, ["paper-list", "pres-list", "award-list", "home-pub"]);
  }

  /* ============ 9. 연구실 장비 ============ */
  var eqList = document.getElementById("equipment-list");
  if (eqList) {
    loadLists({ items: "equipment" }, function (data) {
      eqList.innerHTML = (data.items || []).map(function (e) {
        var img = e.image
          ? '<div class="h-48 w-full overflow-hidden bg-surface-container-high"><img class="w-full h-full object-cover" alt="" src="' + esc(e.image) + '"/></div>'
          : "";
        return '<div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 overflow-hidden hover:shadow-md transition-shadow">' + img +
          '<div class="p-md"><h3 class="font-headline-md text-[19px] text-on-surface">' + bi(esc(e.name_ko), esc(e.name_en || e.name_ko)) + "</h3>" +
          '<p class="font-body-md text-[14.5px] text-on-surface-variant mt-xs">' + bi(esc(e.desc_ko || ""), esc(e.desc_en || e.desc_ko || "")) + "</p></div></div>";
      }).join("");
    }, ["equipment-list"]);
  }

  /* ---- 연구 과제 기간·상태 helper ----
     기간: start_year/start_month/end_year/end_month (드롭다운). 종료가 "미정"이면 진행 중으로 표시.
     상태: "진행 중"/"종료"를 직접 고르면 그 값을 쓰고, "자동(기간 기준)"이면 종료 연월로 판정.
     구 형식(period 문자열)도 계속 표시되도록 호환 유지. */
  var GRANT_ST_EN = { "진행 중": "Ongoing", "종료": "Completed" };
  function gPeriod(g) {
    if (g.start_year) {
      var s = String(g.start_year) + (g.start_month ? "." + g.start_month : "");
      var openEnd = !g.end_year || g.end_year === "미정";
      var e = openEnd ? null : String(g.end_year) + (g.end_month && g.end_month !== "미정" ? "." + g.end_month : "");
      return {
        ko: s + " – " + (e || "진행 중"),
        en: s + " – " + (e || "Present"),
        endNum: openEnd ? null : parseInt(g.end_year, 10) * 100 + parseInt(g.end_month && g.end_month !== "미정" ? g.end_month : "12", 10)
      };
    }
    var m = String(g.period || "").match(/(\d{4})\s*[.\-\/]\s*(\d{1,2})(?!.*\d{4})/);
    return { ko: g.period || "", en: g.period || "", endNum: m ? parseInt(m[1], 10) * 100 + parseInt(m[2], 10) : null };
  }
  function gStatus(g) {
    if (g.status === "진행 중" || g.status === "종료") return g.status;
    var end = gPeriod(g).endNum;
    if (end == null) return "진행 중";
    var n = new Date();
    return end >= n.getFullYear() * 100 + (n.getMonth() + 1) ? "진행 중" : "종료";
  }

  /* ============ 9b. 연구 과제 (Grants) ============ */
  var grantList = document.getElementById("grant-list");
  if (grantList) {
    loadLists({ items: "grants" }, function (data) {
      var items = data.items || [];
      var gc = document.getElementById("grant-count");
      if (gc) gc.textContent = items.length;
      document.querySelectorAll('[data-n="grants"]').forEach(function (e) { e.textContent = items.length; });
      // 진행 연구 과제: period의 종료 연월이 현재 이후인 과제 수 (해석 불가 시 진행으로 간주)
      var ga = document.getElementById("grant-active-count");
      if (ga) ga.textContent = items.filter(function (g) { return gStatus(g) === "진행 중"; }).length;
      // 연구 성과(논문)와 같은 형식: 종료연도별 묶음, 종료 연·월 내림차순(같으면 데이터 순서 유지)
      var sorted = items.map(function (g, i) { return { g: g, i: i, e: gPeriod(g).endNum }; });
      sorted.sort(function (x, y) {
        var ex = x.e == null ? Infinity : x.e, ey = y.e == null ? Infinity : y.e;
        return ex === ey ? x.i - y.i : ey - ex;
      });
      var ggroups = [], gcur = null;
      sorted.forEach(function (o) {
        var y = o.e == null ? "—" : String(Math.floor(o.e / 100));
        if (!gcur || gcur.y !== y) { gcur = { y: y, items: [] }; ggroups.push(gcur); }
        gcur.items.push(o.g);
      });
      grantList.innerHTML = ggroups.map(function (grp) {
        return '<div class="pb-yr"><span class="pb-y">' + esc(grp.y) + '</span><div class="pb-rows">' + grp.items.map(function (g) {
          var pd = gPeriod(g), st = gStatus(g);
          return '<div class="pb-row pb-paper gr-row">' +
            '<span class="pb-t">' + bi(esc(g.title_ko), esc(g.title_en || g.title_ko)) + "</span>" +
            '<span class="pb-m"><span class="pb-j">' + bi(esc(g.agency_ko || ""), esc(g.agency_en || g.agency_ko || "")) + "</span>" +
            '<span class="gr-pd">' + bi(esc(pd.ko), esc(pd.en)) + "</span>" +
            '<span class="gr-st' + (st === "진행 중" ? " is-on" : "") + '">' + bi(esc(st), esc(GRANT_ST_EN[st] || st)) + "</span></span></div>";
        }).join("") + "</div></div>";
      }).join("");
      setupPubList(grantList, items.length, ".gr-row");
    }, ["grant-list"]);
  }

  /* ============ 10. 구성원 (Members·Alumni·진출 분야) ============ */
  var ICON_LI = "data:image/png;base64,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";
  var ICON_CV = "data:image/png;base64,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";
  var memberList = document.getElementById("member-list");
  var alumniRows = document.getElementById("alumni-rows");
  /* 사진이 없는 구성원: 회색 바탕 + 상반신 실루엣 */
  var SILHOUETTE = '<svg viewBox="0 0 120 150" aria-hidden="true" style="display:block;width:72%;height:auto"><circle cx="60" cy="58" r="26" fill="#CBD1D6"/><path d="M14 150c0-30 20-52 46-52s46 22 46 52z" fill="#CBD1D6"/></svg>';
  function memberLinks(m) {
    var links = "";
    if (m.show_linkedin && m.linkedin) links += '<a href="' + esc(m.linkedin) + '" target="_blank" rel="noopener" title="LinkedIn"><img src="' + ICON_LI + '" alt="LinkedIn"/></a>';
    if (m.show_cv && m.cv) links += '<a href="' + esc(m.cv) + '" download title="CV 다운로드"><img src="' + ICON_CV + '" alt="CV"/></a>';
    return links ? '<div class="mbr-links">' + links + "</div>" : "";
  }
  if (memberList || alumniRows) {
    loadLists({ members: "members", careers: "careers", alumni: "alumni" }, function (data) {
      if (memberList) {
        memberList.innerHTML = (data.members || []).map(function (m) {
          var ph = m.photo
            ? '<div class="mbr-ph"><img alt="' + esc(m.name_ko || "") + '" src="' + esc(m.photo) + '" loading="lazy"/></div>'
            : '<div class="mbr-ph mbr-ph-none" role="img" aria-label="' + esc(lang() === "en" ? "No photo" : "사진 없음") + '">' + SILHOUETTE + "</div>";
          return '<article class="mbr-card">' + ph + '<div class="mbr-body">' +
            '<p class="mbr-role">' + bi(esc(m.role_ko || ""), esc(m.role_en || m.role_ko || "")) + "</p>" +
            '<h3 class="mbr-name">' + bi(esc(m.name_ko) + (m.name_en ? ' <span class="mbr-en">' + esc(m.name_en) + "</span>" : ""), esc(m.name_en || m.name_ko)) + "</h3>" +
            (m.note_ko ? '<p class="mbr-note">' + bi(esc(m.note_ko).replace(/\n/g, "<br/>"), esc(m.note_en || m.note_ko).replace(/\n/g, "<br/>")) + "</p>" : "") +
            (m.email ? '<a class="mbr-mail" href="mailto:' + esc(m.email) + '">' + esc(m.email) + "</a>" : "") +
            memberLinks(m) +
            "</div></article>";
        }).join("");
      }
      if (alumniRows) {
        alumniRows.innerHTML = (data.alumni || []).map(function (a) {
          return '<div class="alm-row">' +
            '<span class="alm-org">' + bi(esc(a.org_ko), esc(a.org_en || a.org_ko)) + "</span>" +
            '<span class="alm-deg">' + bi(esc(a.degree_ko || ""), esc(a.degree_en || a.degree_ko || "")) + "</span>" +
            '<span class="alm-role">' + bi(esc(a.role_ko || ""), esc(a.role_en || a.role_ko || "")) + "</span></div>";
        }).join("");
      }
      var pub = document.getElementById("career-public"), ind = document.getElementById("career-industry");
      function item(c) { return "<span>" + bi(esc(c.name_ko), esc(c.name_en || c.name_ko)) + "</span>"; }
      var careers = data.careers || [];
      if (pub) pub.innerHTML = careers.filter(function (c) { return c.sector === "공공"; }).map(item).join("");
      if (ind) ind.innerHTML = careers.filter(function (c) { return c.sector !== "공공" && c.sector !== "국제"; }).map(item).join("");
    }, ["member-list"]);
  }

  /* 진출 분야(소개 페이지) — 데이터는 members.json careers */
  if (document.getElementById("career-public") && !document.getElementById("member-list")) {
    loadLists({ careers: "careers" }, function (data) {
      function item(c) { return '<span class="car-i' + (c.partner ? ' is-partner' : '') + '"><i aria-hidden="true"></i>' + bi(esc(c.name_ko), esc(c.name_en || c.name_ko)) + (c.partner ? '<span class="sr-only">' + bi(" (연구 협력 기관)", " (research partner)") + "</span>" : "") + "</span>"; }
      var careers = data.careers || [];
      document.getElementById("career-public").innerHTML = careers.filter(function (c) { return c.sector === "공공"; }).map(item).join("");
      var ind = document.getElementById("career-industry");
      if (ind) ind.innerHTML = careers.filter(function (c) { return c.sector !== "공공" && c.sector !== "국제"; }).map(item).join("");
      var intl = document.getElementById("career-intl");
      if (intl) intl.innerHTML = careers.filter(function (c) { return c.sector === "국제"; }).map(item).join("");
    }, ["career-public"]);
  }

  /* ============ 11. 소개 페이지 (What we do·교과목·협력기관) ============ */
  var wwd = document.getElementById("whatwedo-list");
  var courseBody = document.getElementById("course-body");
  var partnerList = document.getElementById("partner-list");
  if (wwd || courseBody || partnerList) {
    load("data/about.json", function (data) {
      if (wwd) {
        // 링크는 항목 안이 아니라, 세 항목 아래 한 줄(바로가기)로 모아 둠
        var wwdLinks = (data.whatwedo || []).filter(function (w) { return w.link; }).map(function (w) {
          return '<a class="wwd-go" href="' + esc(w.link) + '">' + bi(esc(w.link_ko || "자세히 보기"), esc(w.link_en || "Learn more")) + '<span aria-hidden="true">→</span></a>';
        }).join("");
        var wl = document.getElementById("whatwedo-links");
        if (!wl && wwdLinks) { wwd.insertAdjacentHTML("afterend", '<nav id="whatwedo-links" class="wwd-links" aria-label="바로가기"></nav>'); wl = document.getElementById("whatwedo-links"); }
        if (wl) wl.innerHTML = wwdLinks;
        wwd.innerHTML = (data.whatwedo || []).map(function (w) {
          var media = w.image
            ? '<div class="wwd-ph"><img alt="" src="' + esc(w.image) + '"/></div>'
            : "";
          var kick = w.kicker_ko ? '<p class="wwd-k">' + bi(w.kicker_ko, w.kicker_en || w.kicker_ko) + "</p>" : "";
          return '<div class="wwd-item">' + media + kick +
            '<h3 class="wwd-t">' + bi(w.title_ko, w.title_en || w.title_ko) + "</h3>" +
            '<p class="wwd-d">' + bi(w.desc_ko || "", w.desc_en || w.desc_ko || "") + "</p></div>";
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

  /* ============ 12. 홈 화면 (data/home.json)
     설계: HTML의 기존 문구가 기본값이고, JSON에 값이 있을 때만 덮어씁니다(override).
     → 검색엔진은 HTML 원문을, 방문자는 최신 JSON 문구를 봅니다. ============ */
  /* 홈 연구 방법 카드: 선 아이콘(관리자에서 카드마다 선택) */
  var HM_ICONS = {"experiment": "<svg viewBox=\"0 0 160 90\" aria-hidden=\"true\" fill=\"none\" stroke=\"#191C1E\" stroke-width=\"1.2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><rect x=\"46\" y=\"34\" width=\"68\" height=\"22\" rx=\"4\"/><path d=\"M40 30V60M120 30V60M40 30H46M40 60H46M114 30H120M114 60H120\"/><path d=\"M58 34V56M70 34V56M82 34V56M94 34V56M106 34V56\" stroke-opacity=\".35\"/><path d=\"M14 45H40M120 45H146M134 45V68M130 68H138M131 72H137\"/><rect x=\"6\" y=\"54\" width=\"22\" height=\"18\" rx=\"2\"/><path d=\"M17 54V45\"/><circle cx=\"17\" cy=\"63\" r=\"4\"/><circle cx=\"80\" cy=\"16\" r=\"9\"/><path d=\"M80 25V34M80 16L84 12\"/><path d=\"M144 41l4 4-4 4\" stroke-opacity=\".6\"/></svg>", "simulation": "<svg viewBox=\"0 0 160 90\" aria-hidden=\"true\" fill=\"none\" stroke=\"#191C1E\" stroke-width=\"1.2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M30 40L80 20L130 40L80 60Z\"/><path d=\"M30 40V64L80 84V60M130 40V64L80 84\"/><path d=\"M42.5 35L92.5 55M55 30L105 50M67.5 25L117.5 45M42.5 45L92.5 25M55 50L105 30M67.5 55L117.5 35M30 52L80 72L130 52\" stroke-opacity=\".4\"/><path d=\"M42.5 45V69M55 50V74M67.5 55V79M92.5 55V79M105 50V74M117.5 45V69\" stroke-opacity=\".3\"/><path d=\"M67.5 35L80 30L92.5 35L80 40Z\" fill=\"#0B5B78\" fill-opacity=\".18\" stroke=\"#0B5B78\"/><path d=\"M80 40L92.5 45L80 50L67.5 45Z\" fill=\"#0B5B78\" fill-opacity=\".1\" stroke=\"#0B5B78\" stroke-opacity=\".7\"/></svg>", "ai": "<svg viewBox=\"0 0 160 90\" aria-hidden=\"true\" fill=\"none\" stroke=\"#191C1E\" stroke-width=\"1.2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><g stroke-opacity=\".35\"><path d=\"M34 22L80 12M34 22L80 34M34 22L80 56M34 22L80 78M34 45L80 12M34 45L80 34M34 45L80 56M34 45L80 78M34 68L80 12M34 68L80 34M34 68L80 56M34 68L80 78M80 12L126 33M80 34L126 33M80 56L126 33M80 78L126 33M80 12L126 57M80 34L126 57M80 56L126 57M80 78L126 57\"/></g><circle cx=\"34\" cy=\"22\" r=\"6\" fill=\"#fff\"/><circle cx=\"34\" cy=\"45\" r=\"6\" fill=\"#fff\"/><circle cx=\"34\" cy=\"68\" r=\"6\" fill=\"#fff\"/><circle cx=\"80\" cy=\"12\" r=\"6\" fill=\"#fff\"/><circle cx=\"80\" cy=\"34\" r=\"6\" fill=\"#D2E9F3\" stroke=\"#0B5B78\"/><circle cx=\"80\" cy=\"56\" r=\"6\" fill=\"#fff\"/><circle cx=\"80\" cy=\"78\" r=\"6\" fill=\"#fff\"/><circle cx=\"126\" cy=\"33\" r=\"6\" fill=\"#D2E9F3\" stroke=\"#0B5B78\"/><circle cx=\"126\" cy=\"57\" r=\"6\" fill=\"#fff\"/><path d=\"M140 33H152M148 29l4 4-4 4\" stroke-opacity=\".6\"/></svg>"};
  var HM_LAB = { experiment: "EXPERIMENT", simulation: "SIMULATION", ai: "AI" };
  var HM_ARROW = "<span class=\"hm-arrow\" aria-hidden=\"true\"><svg viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 10H16M11 5l5 5-5 5\"/></svg></span>";
  function biRich(ko, en) { return bi(rich(ko), rich(en == null || en === "" ? ko : en)); }
  function biText(ko, en) { return bi(esc(ko), esc(en == null || en === "" ? ko : en)); }
  if (slides.length || document.querySelector("[data-home]")) {
    load("data/home.json", function (data) {
      var el, i;

      /* 12-A. 히어로 배경 이미지 + 캡션 */
      var hero = data.hero || [];
      hero.forEach(function (h, i) {
        if (slides[i] && h.image) slides[i].style.backgroundImage = "url('" + h.image + "')";
        var cap = captions[i];
        if (!cap) return;
        var h1 = cap.querySelector("h1"), hp = cap.querySelector("p");
        if (h1 && (h.title_ko || h.title_en)) h1.innerHTML = biRich(h.title_ko || h.title_en, h.title_en);
        if (hp && (h.body_ko || h.body_en)) hp.innerHTML = biRich(h.body_ko || h.body_en, h.body_en);
      });
      if (hero.length) setHeroCount(hero.length);

      /* 12-B. 학과 태그라인 */
      el = document.querySelector('[data-home="dept"]');
      if (el && data.dept_ko) el.innerHTML = biText(data.dept_ko, data.dept_en);

      /* 12-C. 모집 배너 */
      var rc = data.recruit || {};
      el = document.querySelector('[data-home="recruit"]');
      if (el) {
        if (rc.show === false) {
          el.style.display = "none";
        } else {
          var rb = el.querySelector("span.shrink-0"), rp = el.querySelector("p"), ra = el.querySelector("p a");
          if (rb && rc.badge_ko) rb.innerHTML = biText(rc.badge_ko, rc.badge_en);
          if (rp && (rc.text_ko || rc.text_en)) {
            rp.innerHTML = biRich(rc.text_ko || rc.text_en, rc.text_en) + " ";
            if (ra) rp.appendChild(ra);
          }
          if (ra && rc.link_ko) ra.innerHTML = biText(rc.link_ko, rc.link_en);
        }
      }

      /* 12-D. 연구 방법 카드 (최대 4장, 카드마다 선 아이콘, 카드 사이 화살표, 이동 주소는 HTML 고정) */
      var cardBox = document.querySelector('[data-home="cards"]');
      var cl = (data.cards || []).slice(0, 4);
      if (cardBox && cl.length) {
        cardBox.innerHTML = cl.map(function (c) {
          var ic = HM_ICONS[c.icon] ? c.icon : "";
          return '<article class="hm-card">' + (ic ? '<div class="hm-ic">' + HM_ICONS[ic] + "</div>" : "") +
            '<div class="hm-cb">' + (ic ? '<p class="hm-lab">' + HM_LAB[ic] + "</p>" : "") +
            '<h3 class="hm-t">' + biText(c.title_ko || c.title_en || "", c.title_en) + "</h3>" +
            '<p class="hm-d">' + biRich(c.desc_ko || c.desc_en || "", c.desc_en) + "</p>" +
            '<a class="hm-go" href="research-projects.html">' + bi("프로젝트 보기", "View projects") + '<span class="material-symbols-outlined text-[16px]">chevron_right</span></a>' +
            "</div></article>";
        }).join(HM_ARROW);
        cardBox.style.setProperty("--hm-n", cl.length);
      }
      el = document.querySelector('[data-home="cards-note"]');
      if (el) {
        if (data.cards_note_ko || data.cards_note_en) el.innerHTML = biRich(data.cards_note_ko || data.cards_note_en, data.cards_note_en);
        else if ("cards_note_ko" in data) el.style.display = "none";
      }

      /* 12-E. 하단 CTA 배너 */
      var ct = data.cta || {};
      el = document.querySelector('[data-home="cta"]');
      if (el) {
        if (ct.show === false) {
          el.style.display = "none";
        } else {
          var th = el.querySelector("h2"), tp = el.querySelector("p"), ta = el.querySelector("a");
          if (th && ct.title_ko) th.innerHTML = biText(ct.title_ko, ct.title_en);
          if (tp && (ct.text_ko || ct.text_en)) tp.innerHTML = biRich(ct.text_ko || ct.text_en, ct.text_en);
          if (ta && ct.btn_ko) {
            var icon = ta.querySelector(".material-symbols-outlined");
            ta.innerHTML = biText(ct.btn_ko, ct.btn_en);
            if (icon) ta.appendChild(icon);
          }
        }
      }
    }, []);
  }

  /* ============ 12b. 연구실 활동 상세 (activity.html) — 가운데 정렬 기사형 ============ */
  var acTitle = document.getElementById("ac-title");
  if (acTitle) {
    // 빈 줄 → 문단, 한 줄 바꿈 → <br>
    var acParas = function (s) {
      var t = String(s == null ? "" : s).replace(/\r/g, "").trim();
      if (!t) return "";
      return t.split(/\n[ \t]*\n+/).map(function (p) { return "<p>" + rich(p.trim()) + "</p>"; }).join("");
    };
    loadLists({ items: "activities" }, function (data) {
      var items = (data.items || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var id = null;
      try { id = new URLSearchParams(window.location.search).get("id"); } catch (e) {}
      var idx = -1;
      for (var i = 0; i < items.length; i++) { if (actId(items[i]) === id) { idx = i; break; } }
      if (idx < 0) idx = 0;
      var a = items[idx];
      if (!a) return;
      document.getElementById("ac-meta").innerHTML = catBadge(a.category || "기타") +
        '<span class="dot" aria-hidden="true"></span><time datetime="' + esc(a.date) + '">' + esc(a.date) + "</time>";
      acTitle.innerHTML = bi(esc(a.title_ko), esc(a.title_en || a.title_ko));
      var t = document.querySelector("title");
      if (t) {
        t.setAttribute("data-ko", a.title_ko + " | GeoFlow Engineering Lab");
        t.setAttribute("data-en", (a.title_en || a.title_ko) + " | GeoFlow Engineering Lab");
        t.textContent = (lang() === "ko" ? a.title_ko : (a.title_en || a.title_ko)) + " | GeoFlow Engineering Lab";
      }
      document.getElementById("ac-body").innerHTML =
        '<div class="ko">' + acParas(a.body_ko || "") + '</div><div class="en">' + acParas(a.body_en || a.body_ko || "") + "</div>";

      // 사진: 한 줄에 한 장, 원래 비율, 가운데 — 누르면 크게 보기
      var imgs = (a.images || []).filter(function (x) { return x && x.image; }).slice(0, 3);
      var capKo = function (g) { return g.caption_ko || g.caption_en || ""; };
      var capEn = function (g) { return g.caption_en || g.caption_ko || ""; };
      document.getElementById("ac-images").innerHTML = imgs.map(function (g, k) {
        var alt = capKo(g) || a.title_ko || "";
        return '<figure class="ac-fig"><button type="button" class="ac-zoom" data-i="' + k + '" aria-label="' + esc(alt) + ' — 크게 보기">' +
          '<img src="' + esc(g.image) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async"/></button>' +
          ((capKo(g) || capEn(g)) ? "<figcaption>" + bi(esc(capKo(g)), esc(capEn(g))) + "</figcaption>" : "") +
          "</figure>";
      }).join("");
      if (imgs.length) {
        var lb = document.createElement("div");
        lb.className = "ac-lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
        lb.innerHTML = '<span class="cnt"></span><img alt=""/><div class="cap"></div>' +
          '<button type="button" class="x" aria-label="닫기"><span class="material-symbols-outlined">close</span></button>' +
          (imgs.length > 1 ? '<button type="button" class="pv" aria-label="이전 사진"><span class="material-symbols-outlined">chevron_left</span></button>' +
            '<button type="button" class="nx" aria-label="다음 사진"><span class="material-symbols-outlined">chevron_right</span></button>' : "");
        document.body.appendChild(lb);
        var cur = 0, lastFocus = null;
        var show = function (k) {
          cur = (k + imgs.length) % imgs.length;
          var g = imgs[cur], im = lb.querySelector("img");
          im.src = g.image; im.alt = capKo(g) || a.title_ko || "";
          lb.querySelector(".cap").innerHTML = (capKo(g) || capEn(g)) ? bi(esc(capKo(g)), esc(capEn(g))) : "";
          lb.querySelector(".cnt").textContent = imgs.length > 1 ? (cur + 1) + " / " + imgs.length : "";
        };
        var open = function (k) { lastFocus = document.activeElement; show(k); lb.classList.add("open"); document.documentElement.style.overflow = "hidden"; lb.querySelector(".x").focus(); };
        var close = function () { lb.classList.remove("open"); document.documentElement.style.overflow = ""; if (lastFocus) lastFocus.focus(); };
        document.getElementById("ac-images").addEventListener("click", function (ev) {
          var b = ev.target.closest(".ac-zoom"); if (b) open(+b.getAttribute("data-i"));
        });
        lb.addEventListener("click", function (ev) {
          if (ev.target.closest(".x") || ev.target === lb) { close(); return; }
          if (ev.target.closest(".pv")) show(cur - 1);
          if (ev.target.closest(".nx")) show(cur + 1);
        });
        document.addEventListener("keydown", function (ev) {
          if (!lb.classList.contains("open")) return;
          if (ev.key === "Escape") close();
          else if (ev.key === "ArrowLeft" && imgs.length > 1) show(cur - 1);
          else if (ev.key === "ArrowRight" && imgs.length > 1) show(cur + 1);
        });
      }

      // 이전 글(더 오래된 글) · 다음 글(더 최근 글)
      var nav = document.getElementById("ac-nav");
      if (nav) {
        var older = items[idx + 1], newer = items[idx - 1];
        var cell = function (x, cls, lblKo, lblEn, icon) {
          if (!x) return '<span class="empty ' + cls + '"></span>';
          var lbl = cls === "prev"
            ? '<span class="material-symbols-outlined">' + icon + "</span>" + bi(lblKo, lblEn)
            : bi(lblKo, lblEn) + '<span class="material-symbols-outlined">' + icon + "</span>";
          return '<a class="' + cls + '" href="activity.html?id=' + actId(x) + '"><span class="lbl">' + lbl + '</span><span class="ttl">' +
            bi(esc(x.title_ko), esc(x.title_en || x.title_ko)) + "</span></a>";
        };
        nav.innerHTML = (older || newer)
          ? (older ? cell(older, "prev", "이전 글", "Previous", "arrow_back") : "") + (newer ? cell(newer, "next", "다음 글", "Next", "arrow_forward") : "")
          : "";
        nav.classList.toggle("ac-nav-single", !(older && newer));
        if (!older && !newer) nav.style.display = "none";
      }
    }, ["ac-body"]);
  }

  /* ============ 13. 연구 프로젝트 (목록·상세 공용 템플릿) ============ */
  var STATUS_CLS = { "진행 중": "bg-primary-container text-on-primary-container", "진행 예정": "bg-tertiary-container text-on-tertiary-container", "종료": "bg-surface-variant text-on-surface-variant" };
  var STATUS_EN = { "진행 중": "ONGOING", "진행 예정": "PLANNED", "종료": "COMPLETED" };
  function statusChip(s, dark) {
    var base = STATUS_CLS[s] || STATUS_CLS["진행 중"];
    if (dark) base = "bg-white/15 text-white border border-white/30";
    return '<span class="inline-flex items-center px-sm py-1 rounded-full font-label-caps ' + base + '">' + bi(esc(s), esc(STATUS_EN[s] || s)) + "</span>";
  }
  /* v44: 독립 사이드바 공용 동작([data-sidenav]) — 누르면 해당 항목으로, 스크롤하면 현재 항목 강조 */
  Array.prototype.forEach.call(document.querySelectorAll("[data-sidenav]"), function (nav) {
    var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
    var secs = links.map(function (l) { return document.getElementById(l.getAttribute("href").slice(1)); });
    function setActive(id) { links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + id); }); }
    links.forEach(function (l) {
      l.addEventListener("click", function (ev) {
        var t = document.getElementById(l.getAttribute("href").slice(1));
        if (!t) return;
        ev.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" });
        try { history.replaceState(null, "", l.getAttribute("href")); } catch (e) {}
      });
    });
    function onScroll() {
      var top = window.matchMedia("(min-width:1024px)").matches ? 134 : 160, cur = secs[0] && secs[0].id;
      secs.forEach(function (sec) { if (sec && sec.getBoundingClientRect().top - top <= 0) cur = sec.id; });
      /* v50: 페이지 끝까지 내리면 마지막 항목 강조 */
      var lastSec = secs.filter(Boolean).slice(-1)[0];
      if (lastSec && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = lastSec.id;
      if (cur) setActive(cur);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (location.hash) { var h = document.getElementById(location.hash.slice(1)); if (h) setTimeout(function () { h.scrollIntoView({ block: "start" }); }, 300); }
  });

  /* v50: 메가 메뉴 묶음별로 합친 사이드바 — 다른 페이지 항목의 건수 채우기 */
  (function () {
    var SRC = { projects: "projects", grants: "grants", papers: "papers", pres: "presentations", awards: "awards", acts: "activities" };
    var need = {};
    Array.prototype.forEach.call(document.querySelectorAll(".pub-nav .sn-x [data-n]"), function (e) { var k = e.getAttribute("data-n"); if (SRC[k]) need[k] = 1; });
    Object.keys(need).forEach(function (k) {
      loadLists({ items: SRC[k] }, function (d) {
        document.querySelectorAll('.pub-nav .sn-x [data-n="' + k + '"]').forEach(function (e) { e.textContent = d.items.length; });
      });
    });
  })();

  var pjCards = document.getElementById("project-cards");
  if (pjCards) {
    loadLists({ items: "projects" }, function (data) {
      var items = data.items || [];
      document.querySelectorAll('[data-n="projects"]').forEach(function (e) { e.textContent = items.length; });
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
    /* 프로젝트 상세 (v24 리디자인): 히어로 이미지 + 번호형 섹션 + 결과 갤러리(확대 보기) + 이미지형 관련 프로젝트 */
    loadLists({ items: "projects" }, function (data) {
      var items = data.items || [];
      var id = null;
      try { id = new URLSearchParams(window.location.search).get("id"); } catch (e) {}
      var p = items.filter(function (x) { return x.id === id; })[0] || items[0];
      if (!p) return;
      var c = p.card || {};
      var t = document.querySelector("title");
      if (t) {
        t.setAttribute("data-ko", p.title_ko + " | GeoFlow Engineering Lab");
        t.setAttribute("data-en", (p.title_en || p.title_ko) + " | GeoFlow Engineering Lab");
        t.textContent = (lang() === "ko" ? p.title_ko : (p.title_en || p.title_ko)) + " | GeoFlow Engineering Lab";
      }
      var stCls = p.status === "종료" ? " is-done" : (p.status === "진행 예정" ? " is-planned" : "");
      document.getElementById("pj-status").innerHTML =
        (c.chip ? '<span class="pj-chip">' + esc(c.chip) + '</span><span class="pj-dot"></span>' : "") +
        '<span class="pj-status' + stCls + '"><i></i>' + bi(esc(p.status || "진행 중"), esc(STATUS_EN[p.status] || p.status || "ONGOING")) + "</span>";
      pjTitle.innerHTML = bi(esc(p.title_ko), esc(p.title_en || p.title_ko));
      document.getElementById("pj-lead").innerHTML = biRich(p.lead_ko || "", p.lead_en);
      document.getElementById("pj-keywords").innerHTML = (p.keywords || []).map(function (k) { return "<span>" + esc(k) + "</span>"; }).join("");
      var vis = document.getElementById("pj-visual");
      if (vis && c.image) { vis.innerHTML = '<img alt="" src="' + esc(c.image) + '"/>'; vis.hidden = false; }
      var bgBlk = document.getElementById("pj-blk-bg");
      if (p.bg_ko || p.bg_en) document.getElementById("pj-bg").innerHTML = biRich(p.bg_ko || p.bg_en, p.bg_en);
      else if (bgBlk) bgBlk.style.display = "none";
      document.getElementById("pj-sections").innerHTML = (p.sections || []).slice(0, 4).map(function (s, i) {
        var lis = (s.bullets || []).map(function (b) { return "<li>" + biRich(b.ko || b.en || "", b.en) + "</li>"; }).join("");
        return '<div class="pj-step"><div class="pj-num">' + (i < 9 ? "0" : "") + (i + 1) + "</div><div><h3>" +
          bi(esc(s.title_ko), esc(s.title_en || s.title_ko)) + "</h3>" + (lis ? "<ul>" + lis + "</ul>" : "") + "</div></div>";
      }).join("");
      /* 참고 자료: 이미지가 실제로 올라간 항목만 사용. 이미지가 하나도 없으면 섹션 전체(설명 문구 포함)를 숨김 */
      var figs = (p.figures || []).filter(function (f) { return f && f.image; }).slice(0, 4);
      var res = document.getElementById("pj-results");
      var hasRes = !!(p.results_ko || p.results_en);
      if (hasRes && figs.length) { res.innerHTML = biRich(p.results_ko || p.results_en, p.results_en); res.hidden = false; }
      var figBox = document.getElementById("pj-figures");
      figBox.innerHTML = figs.map(function (fg, i) {
        return '<figure class="pj-fig" data-i="' + i + '"><div class="pj-img"><img alt="" loading="lazy" src="' + esc(fg.image) + '"/></div>' +
          "<figcaption><b>FIG. " + (i + 1) + "</b>" + bi(esc(fg.cap_ko || ""), esc(fg.cap_en || fg.cap_ko || "")) + "</figcaption></figure>";
      }).join("");
      if (!figs.length) { var rb = document.getElementById("pj-blk-res"); if (rb) rb.style.display = "none"; }
      /* 보이는 단락만 01, 02, 03… 순서로 다시 번호 매김 */
      var bn = 0;
      [].forEach.call(document.querySelectorAll(".pj-block"), function (blk) {
        if (blk.style.display === "none") return;
        var num = blk.querySelector(".pj-label b");
        bn++;
        if (num) num.textContent = (bn < 10 ? "0" : "") + bn;
      });
      var lb = document.getElementById("pj-lightbox");
      if (lb) {
        var lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption");
        figBox.addEventListener("click", function (e) {
          var f = e.target.closest ? e.target.closest(".pj-fig") : null;
          if (!f) return;
          var fg = figs[parseInt(f.getAttribute("data-i"), 10)];
          if (!fg) return;
          lbImg.setAttribute("src", fg.image);
          lbCap.innerHTML = bi(esc(fg.cap_ko || ""), esc(fg.cap_en || fg.cap_ko || ""));
          lb.classList.add("on");
        });
        lb.addEventListener("click", function () { lb.classList.remove("on"); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.classList.remove("on"); });
      }
      document.getElementById("pj-related").innerHTML = items.filter(function (x) { return x.id !== p.id; }).slice(0, 3).map(function (x) {
        var xc = x.card || {};
        return '<a class="pj-rel" href="project.html?id=' + encodeURIComponent(x.id) + '">' +
          '<div class="pj-rel-img">' + (xc.image ? '<img alt="" src="' + esc(xc.image) + '"/>' : "") + "</div>" +
          '<div class="pj-rel-body">' + (xc.chip ? '<span class="pj-rel-chip">' + esc(xc.chip) + "</span>" : "") +
          "<h3>" + bi(esc(x.title_ko), esc(x.title_en || x.title_ko)) + "</h3>" +
          '<span class="pj-rel-go">' + bi("자세히 보기", "VIEW PROJECT") + ' <span class="material-symbols-outlined text-[16px]">arrow_forward</span></span></div></a>';
      }).join("");
    }, ["pj-sections", "pj-figures", "pj-related"]);
  }

  /* ============ 14. 지도교수 · 연락처 (data/pi.json)
     단일 출처: 이 파일 하나가 소개·구성원·문의 페이지 + 전 페이지 푸터를 채웁니다.
     푸터는 구조(CONTACT 제목 + 목록)로 찾아 채우므로 페이지 HTML 수정이 필요 없습니다. ============ */
  if (document.querySelector("[data-pi]") || document.querySelector("footer")) {
    load("data/pi.json", function (d) {
      var c = d.contact || {};
      function mi(name) { return '<span class="material-symbols-outlined text-[16px] align-middle text-primary">' + name + "</span> "; }
      /* 전화번호: 휴대폰에서 누르면 바로 전화 연결 */
      function telLink(num, cls) {
        return '<a class="' + cls + '" href="tel:' + String(num).replace(/[^0-9+]/g, "") + '">' + esc(num) + "</a>";
      }
      function mailLink(addr, cls) {
        return '<a class="' + cls + '" href="mailto:' + esc(addr) + '">' + esc(addr) + "</a>";
      }
      function piContactLine() {
        var parts = [];
        if (c.pi_office_ko || c.pi_office_en) parts.push(mi("location_on") + biText(c.pi_office_ko || c.pi_office_en, c.pi_office_en));
        if (c.phone) parts.push(mi("call") + telLink(c.phone, "hover:underline"));
        if (c.email) parts.push(mailLink(c.email, "text-primary hover:underline"));
        return parts.join(" · ");
      }

      /* 14-A. 소개 / 구성원 페이지의 지도교수 카드 */
      ["about", "members"].forEach(function (key) {
        var box = document.querySelector('[data-pi="' + key + '"]');
        if (!box) return;
        var img = box.querySelector("img");
        if (img && d.photo) { img.setAttribute("src", d.photo); img.setAttribute("alt", d.name_en || d.name_ko || ""); }
        var h3 = box.querySelector("h3");
        if (h3 && d.name_ko) {
          // "이영수 | Youngsoo Lee"처럼 적혀 있어도 한글 이름 + 작은 영문 이름으로 표시
          var nk = String(d.name_ko).split("|")[0].trim();
          var ne = (d.name_en || String(d.name_ko).split("|")[1] || "").trim();
          h3.innerHTML = bi(esc(nk) + (ne ? ' <span class="font-body-md text-[15px] font-semibold text-on-surface-variant ml-1">' + esc(ne) + "</span>" : ""), esc(ne || nk));
        }
        var tt = box.querySelector("[data-pi-title]") || box.querySelector("p.font-label-caps");
        if (tt && d.title_ko) tt.innerHTML = biText(d.title_ko, d.title_en);
        var intro = box.querySelector("p.font-body-lg");
        if (intro && (d.intro_ko || d.intro_en)) intro.innerHTML = biRich(d.intro_ko || d.intro_en, d.intro_en);
        var line = box.querySelector("[data-pi-line]") || box.querySelector("p.font-body-md");
        if (line) line.innerHTML = piContactLine();
        var ul = box.querySelector("ul");
        if (ul && (d.career || []).length) {
          ul.innerHTML = d.career.map(function (r) {
            return '<li class="flex gap-sm"><span class="font-data-tabular text-data-tabular font-semibold text-primary w-32 shrink-0">' +
              biText(r.period_ko || r.period_en || "", r.period_en) + '</span>' +
              '<span class="font-body-md text-on-surface-variant">' + biText(r.desc_ko || r.desc_en || "", r.desc_en) + "</span></li>";
          }).join("");
        }
      });

      /* 14-B. 문의 페이지 연락처 표 (주소·교수 연구실·학생 연구실·전화·이메일·대표 학생) */
      var tbl = document.querySelector('[data-pi="contact"]');
      if (tbl) {
        var vals = [
          biText(c.address_ko || "", c.address_en),
          biText(c.pi_office_ko || "", c.pi_office_en),
          biText(c.lab_office_ko || "", c.lab_office_en),
          c.phone ? telLink(c.phone, "text-primary hover:underline") : "",
          (c.email ? mailLink(c.email, "text-primary hover:underline") + " " : "") + biText(c.email_note_ko || "", c.email_note_en),
          biText(c.rep_ko || "", c.rep_en) + (c.rep_email ? " · " + mailLink(c.rep_email, "text-primary hover:underline") : "")
        ];
        for (var ri = 0; ri < vals.length; ri++) {
          var row = tbl.children[ri];
          if (!row) continue;
          var cell = row.children[1];
          if (cell && vals[ri]) cell.innerHTML = vals[ri];
        }
      }

      /* 14-B2. Contact JOIN US의 '이메일 보내기' 버튼 주소 */
      var joinMail = document.querySelector('[data-join] a[href^="mailto:"]');
      if (joinMail && c.email) joinMail.setAttribute("href", "mailto:" + c.email);

      /* 14-C. 전 페이지 하단 푸터 (HTML 수정 없이 구조로 탐색) */
      var heads = document.querySelectorAll("footer h4"), fUl = null;
      for (var hi = 0; hi < heads.length; hi++) {
        if (/CONTACT/i.test(heads[hi].textContent || "")) { fUl = heads[hi].parentNode.querySelector("ul"); break; }
      }
      if (fUl && fUl.children.length >= 4) {
        var f = fUl.children;
        if (c.address_short_ko) f[0].innerHTML = biText(c.address_short_ko, c.address_short_en);
        if (c.rooms_ko) f[1].innerHTML = biText(c.rooms_ko, c.rooms_en);
        if (c.phone) f[2].innerHTML = "Tel. " + telLink(c.phone, "hover:text-white transition-colors");
        if (c.email) f[3].innerHTML = mailLink(c.email, "hover:text-white transition-colors");
      }
    }, []);
  }

  /* ============ 15. 각 페이지 상단 문구 (data/pages.json)
     HTML 기본값 + JSON 덮어쓰기. 현재 주소(파일명)로 해당 페이지 항목을 찾아 적용합니다. ============ */
  var phBox = document.querySelector("[data-ph]");
  if (phBox) {
    load("data/pages.json", function (d) {
      var file = location.pathname.split("/").pop() || "index.html";
      var key = file.replace(/\.html?$/i, "") || "index";
      var v = d[key];
      if (!v) return;
      var h1 = phBox.querySelector("h1");
      if (h1 && (v.title_ko || v.title_en)) h1.innerHTML = biText(v.title_ko || v.title_en, v.title_en);
      var lead = document.querySelector("[data-page-lead]") || phBox.querySelector("h1 ~ p") || phBox.querySelector("p");
      if (lead && (v.lead_ko || v.lead_en)) lead.innerHTML = biRich(v.lead_ko || v.lead_en, v.lead_en);
      var crumb = phBox.querySelector(".font-data-tabular");
      if (crumb && (v.crumb_ko || v.crumb_en)) {
        var home = crumb.querySelector("a");
        // 관리자 입력값 앞에 'Home /'(또는 '홈 /')를 적어도 중복되지 않도록 제거 — Home은 자동으로 붙음
        var noHome = function (s) {
          var t = String(s == null ? "" : s).trim();
          while (/^(home|홈)$/i.test(t.split("/")[0].trim()) && t.indexOf("/") > -1) t = t.slice(t.indexOf("/") + 1).trim();
          return t;
        };
        crumb.innerHTML = (home ? home.outerHTML : "") + " / " + biText(noHome(v.crumb_ko || v.crumb_en), noHome(v.crumb_en));
      }
      /* 15-B. Contact 페이지 JOIN US 섹션 (제목 + 카드 최대 3장 + 이메일 버튼 문구) */
      var joinBox = document.querySelector("[data-join]");
      if (joinBox) {
        var jh = joinBox.querySelector("[data-join-title]") || joinBox.querySelector("h2");
        if (jh && (v.join_title_ko || v.join_title_en)) jh.innerHTML = biRich(v.join_title_ko || v.join_title_en, v.join_title_en);
        var jcards = joinBox.querySelectorAll(".grid > div");
        var jl = v.join_cards || [];
        jl.forEach(function (c, i) {
          var card = jcards[i];
          if (!card) return;
          var t3 = card.querySelector("h3"), tp = card.querySelector("p");
          if (t3 && (c.title_ko || c.title_en)) t3.innerHTML = biText(c.title_ko || c.title_en, c.title_en);
          if (tp && (c.body_ko || c.body_en)) tp.innerHTML = biRich(c.body_ko || c.body_en, c.body_en);
        });
        if (jl.length) { for (var ji = jl.length; ji < jcards.length; ji++) jcards[ji].style.display = "none"; }
        var jb = joinBox.querySelector('a[href^="mailto:"]');
        if (jb && (v.join_btn_ko || v.join_btn_en)) {
          var jic = jb.querySelector(".material-symbols-outlined");
          jb.innerHTML = biText(v.join_btn_ko || v.join_btn_en, v.join_btn_en);
          if (jic) jb.appendChild(jic);
        }
      }
    }, []);
  }

  /* ============ 16. 연구 분야 페이지 본문 (data/research-area.json)
     매트릭스 표(열 3개 고정, 분야 행·칸 항목 가변) + 분야 카드(가변, 한 줄 2장) + 하단 버튼.
     HTML 기본값 + JSON 덮어쓰기: 값이 있는 부분만 교체합니다. ============ */
  var raMatrix = document.getElementById("matrix");
  if (raMatrix) {
    load("data/research-area.json", function (d) {
      var RA_ROW = [
        { th: "bg-primary-container/40", title: "text-primary", arrow: "text-primary", tag: "bg-secondary-container text-on-secondary-container" },
        { th: "bg-tertiary-container/40", title: "text-on-tertiary-container", arrow: "text-tertiary", tag: "bg-tertiary-container text-on-tertiary-container" }
      ];
      var mh = raMatrix.querySelector("h2"), mp = raMatrix.querySelector("[data-ra-lead]") || raMatrix.querySelector("h2 + p");
      if (mh && (d.matrix_title_ko || d.matrix_title_en)) mh.innerHTML = biText(d.matrix_title_ko || d.matrix_title_en, d.matrix_title_en);
      if (mp && (d.matrix_lead_ko || d.matrix_lead_en)) mp.innerHTML = biRich(d.matrix_lead_ko || d.matrix_lead_en, d.matrix_lead_en);
      var heads = raMatrix.querySelectorAll("thead th");
      [d.col_sim, d.col_exp, d.col_ai].forEach(function (v, i) { if (v && heads[i + 1]) heads[i + 1].textContent = v; });
      var rows = d.rows || [];
      var tbody = raMatrix.querySelector("tbody");
      if (tbody && rows.length) {
        tbody.innerHTML = rows.map(function (r, ri) {
          var pal = RA_ROW[ri % RA_ROW.length];
          function cell(list) {
            return '<td class="py-md px-md"><ul class="space-y-1 font-body-md text-[14px] text-on-surface-variant">' +
              (list || []).map(function (it) {
                return '<li class="flex items-start gap-1.5"><span class="material-symbols-outlined text-[15px] mt-[4px] ' + pal.arrow + '">arrow_right</span>' +
                  "<span>" + biRich(it.ko || it.en || "", it.en) + "</span></li>";
              }).join("") + "</ul></td>";
          }
          return '<tr><th class="py-md px-md text-left ' + pal.th + '"><span class="font-headline-md text-[17px] ' + pal.title + ' block">' +
            biText(r.title_ko || r.title_en || "", r.title_en) + "</span></th>" + cell(r.sim) + cell(r.exp) + cell(r.ai) + "</tr>";
        }).join("");
      }
      // 휴대폰용: 표 대신 분야별로 쌓는 카드 (표는 md 이상에서만 표시)
      var stack = document.getElementById("matrix-stack");
      if (stack && rows.length) {
        var COLS = [["sim", d.col_sim || "SIMULATION"], ["exp", d.col_exp || "EXPERIMENT"], ["ai", d.col_ai || "AI"]];
        stack.innerHTML = rows.map(function (r, ri) {
          var pal = RA_ROW[ri % RA_ROW.length];
          return '<div class="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden mb-sm">' +
            '<div class="px-md py-sm ' + pal.th + '"><span class="font-headline-md text-[16px] ' + pal.title + '">' + biText(r.title_ko || r.title_en || "", r.title_en) + "</span></div>" +
            COLS.map(function (c) {
              var list = r[c[0]] || [];
              if (!list.length) return "";
              return '<div class="px-md py-sm border-t border-outline-variant/40"><div class="font-label-caps text-on-surface-variant mb-1">' + esc(c[1]) + "</div>" +
                '<ul class="space-y-1 font-body-md text-[14px] text-on-surface-variant">' + list.map(function (it) {
                  return '<li class="flex items-start gap-1.5"><span class="material-symbols-outlined text-[15px] mt-[3px] ' + pal.arrow + '">arrow_right</span><span>' + biRich(it.ko || it.en || "", it.en) + "</span></li>";
                }).join("") + "</ul></div>";
            }).join("") + "</div>";
        }).join("");
      }
      var grid = document.querySelector('[data-ra="cards"]');
      var cards = d.cards || [];
      if (grid && cards.length) {
        grid.innerHTML = cards.map(function (c, ci) {
          var pal = RA_ROW[ci % RA_ROW.length];
          var media = !c.image ? "" : /\.svg(\?|$)/i.test(c.image)
            ? '<div class="ra-ill"><img alt="" src="' + esc(c.image) + '"/></div>'   // 선 그림: 자르지 않고 전체 표시
            : '<div class="h-48 w-full overflow-hidden bg-surface-container-high"><img class="w-full h-full object-cover" alt="" src="' + esc(c.image) + '"/></div>';
          return '<div class="group relative bg-surface-container-lowest rounded-xl flex flex-col h-full overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-md border border-outline-variant/40">' + media +
            '<div class="p-md flex flex-col flex-grow">' +
            (c.label ? '<div class="flex items-center gap-xs mb-sm"><span class="font-label-caps text-on-surface-variant uppercase tracking-widest">' + esc(c.label) + "</span></div>" : "") +
            '<h2 class="font-headline-md text-on-surface mb-sm">' + biText(c.title_ko || c.title_en || "", c.title_en) + "</h2>" +
            '<p class="font-body-md text-[15px] text-on-surface-variant mb-md flex-grow">' + biRich(c.body_ko || c.body_en || "", c.body_en) + "</p>" +
            '<div class="flex flex-wrap gap-xs mt-auto">' + (c.tags || []).map(function (t) {
              return '<span class="inline-flex items-center px-xs py-base ' + pal.tag + ' font-data-tabular text-data-tabular rounded-sm">' + esc(t) + "</span>";
            }).join("") + "</div></div></div>";
        }).join("");
      }
      var cta = document.querySelector('[data-ra="cta"]');
      if (cta && (d.cta_ko || d.cta_en)) {
        var ic = cta.querySelector(".material-symbols-outlined");
        cta.innerHTML = biText(d.cta_ko || d.cta_en, d.cta_en);
        if (ic) cta.appendChild(ic);
      }
    }, []);
  }

  /* ============ 17. 줄바꿈 보정: 가운뎃점(·)이 줄 맨 앞에 오지 않도록
     '연구·개발'처럼 붙어 있는 가운뎃점 앞에 보이지 않는 연결 문자(U+2060)를 넣어
     '연구|·개발'로 끊기는 것을 막습니다. 점 뒤에서 끊기는 '연구·|개발'은 허용됩니다.
     화면 글자에만 적용하며, 링크 주소 등 속성 값은 건드리지 않습니다. ============ */
  var WJ = "\u2060";
  function glueDots(root) {
    if (!root) return;
    var wk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while ((n = wk.nextNode())) {
      var v = n.nodeValue;
      if (v.indexOf("\u00b7") < 0) continue;
      var nv = v.replace(/([^\s\u2060])\u00b7/g, "$1" + WJ + "\u00b7");
      if (nv !== v) n.nodeValue = nv;
    }
  }
  glueDots(document.body);
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var nd = added[j];
          if (nd.nodeType === 1) glueDots(nd);
          else if (nd.nodeType === 3 && nd.parentNode) glueDots(nd.parentNode);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ============ v45: 상단 메뉴 B안(그룹별 띠) ============
     PC(1024px 이상)에서 메뉴에 마우스를 올리면 그 그룹 하나만 헤더 아래 전체 폭 띠로 보여 줍니다.
     홈은 띠 없음. 0.12초 뒤 열림, 다른 메뉴로 옮기면 0.08초 뒤 전환, 헤더 밖으로 나가면 0.3초 뒤 닫힘.
     터치 화면: 첫 탭에 띠 열기, 둘째 탭에 이동. 키보드: ↓로 열고 첫 항목으로, Esc로 닫고 메뉴로 복귀. */
  (function () {
    var nav = document.querySelector(".hdr-nav"), header = document.querySelector("header");
    if (!nav || !header) return;
    var BAND = {
      about: { ko: "소개", en: "About", href: "about.html", i: ["GeoFlow 연구실과 연구 환경을 소개합니다.", "Who we are and how we work."],
        items: [["about.html", "연구실 소개", "About the Lab", "지도교수 · 교과목 · 진출 분야", "PI, courses and career paths"],
                ["equipment.html", "연구실 장비", "Equipment", "실험 · 해석 장비 현황", "Lab instruments and analysis tools"]] },
      research: { ko: "연구", en: "Research", href: "research-area.html", i: ["석유 · 가스와 CO₂ 지중저장을 잇는 연구 주제와 과제입니다.", "Research themes and funded projects across oil & gas and CO₂ storage."],
        items: [["research-area.html", "연구 분야", "Research Areas", "석유 · 가스와 CO₂ 지중저장", "Oil & gas and CO₂ geological storage"],
                ["research-projects.html", "프로젝트", "Projects", "분야별 연구 현황과 연구 과제", "Research by area and funded projects"]] },
      outputs: { ko: "성과 · 소식", en: "Publications · News", href: "publications.html", i: ["논문 · 발표 · 수상과 연구실 일정 · 활동을 모았습니다.", "Papers, talks, awards and lab activities."],
        items: [["publications.html", "연구 성과", "Publications", "논문 · 학술대회 발표 · 수상", "Papers, conference talks and awards"],
                ["activities.html", "연구실 소식", "Lab News", "일정과 활동 기록", "Schedule and activity log"]] },
      members: { ko: "구성원", en: "Members", href: "members.html", i: ["지도교수와 연구실 구성원을 소개합니다.", "Meet our professor and lab members."],
        items: [["members.html", "구성원", "Members", "지도교수 · 연구원 · 대학원생 · 졸업생", "PI, researchers, students and alumni"]] },
      contact: { ko: "Contact", en: "Contact", href: "contact.html", i: ["연구실 방문, 공동연구, 대학원 진학 관련 문의처입니다.", "Inquiries about visits, collaboration, and graduate study."],
        items: [["contact.html#join", "모집 안내", "Join Us", "학부연구생 · 대학원 진학 안내", "Undergraduate research and graduate study"],
                ["contact.html#contact-info", "연락처", "Get in Touch", "주소 · 전화 · 이메일 · 지도", "Address, phone, email and map"]] }
    };
    var page = location.pathname.split("/").pop() || "index.html";
    if (page === "project.html") page = "research-projects.html";
    if (page === "activity.html") page = "activities.html";
    var trig = Array.prototype.slice.call(nav.querySelectorAll(":scope > a[data-band]"));
    var band = document.createElement("div");
    band.className = "hb-band"; band.hidden = true;
    band.innerHTML = '<div class="hb-in max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">' + trig.map(function (a) {
      var k = a.getAttribute("data-band"), g = BAND[k]; if (!g) return "";
      return '<div class="hb-panel" id="hb-' + k + '" hidden><div class="hb-a"><a class="hb-t" href="' + g.href + '">' + bi(g.ko, g.en) + '</a><p class="hb-i">' + bi(g.i[0], g.i[1]) + '</p></div><div class="hb-b">' +
        g.items.map(function (it) {
          return '<a class="hb-card" href="' + it[0] + '"' + (it[0] === page ? ' aria-current="page"' : "") + '><span class="hb-ct">' + bi(it[1], it[2]) + '<span class="hb-ar" aria-hidden="true">→</span></span><span class="hb-cd">' + bi(it[3], it[4]) + '</span></a>';
        }).join("") + '</div></div>';
    }).join("") + '</div>';
    header.appendChild(band);
    trig.forEach(function (a) { a.setAttribute("aria-controls", "hb-" + a.getAttribute("data-band")); a.setAttribute("aria-expanded", "false"); });
    var desk = window.matchMedia("(min-width:1024px)"), fine = window.matchMedia("(hover:hover) and (pointer:fine)");
    var cur = null, tOpen = null, tClose = null;
    function open(k) {
      clearTimeout(tClose); cur = k; band.hidden = false;
      band.querySelectorAll(".hb-panel").forEach(function (p) { p.hidden = p.id !== "hb-" + k; });
      trig.forEach(function (a) { var on = a.getAttribute("data-band") === k; a.classList.toggle("is-open", on); a.setAttribute("aria-expanded", on ? "true" : "false"); });
      requestAnimationFrame(function () { band.classList.add("on"); });
    }
    function close() {
      clearTimeout(tOpen); cur = null; band.classList.remove("on"); band.hidden = true;
      trig.forEach(function (a) { a.classList.remove("is-open"); a.setAttribute("aria-expanded", "false"); });
    }
    Array.prototype.forEach.call(nav.children, function (el) {
      el.addEventListener("mouseenter", function () {
        if (!desk.matches || !fine.matches) return;
        var k = el.getAttribute("data-band");
        clearTimeout(tOpen);
        if (!k) { clearTimeout(tClose); tClose = setTimeout(close, 150); return; }
        clearTimeout(tClose); tOpen = setTimeout(function () { open(k); }, cur ? 80 : 120);
      });
    });
    header.addEventListener("mouseenter", function () { clearTimeout(tClose); });
    header.addEventListener("mouseleave", function () { if (!cur && !tOpen) return; clearTimeout(tOpen); clearTimeout(tClose); tClose = setTimeout(close, 300); });
    trig.forEach(function (a) {
      var k = a.getAttribute("data-band");
      a.addEventListener("click", function (ev) { if (desk.matches && !fine.matches && cur !== k) { ev.preventDefault(); open(k); } });
      a.addEventListener("keydown", function (ev) {
        if (ev.key !== "ArrowDown" || !desk.matches) return;
        ev.preventDefault(); open(k); var f = band.querySelector("#hb-" + k + " a"); if (f) f.focus();
      });
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape" || !cur) return;
      var k = cur; close(); var t = nav.querySelector('[data-band="' + k + '"]'); if (t) t.focus();
    });
    document.addEventListener("click", function (ev) { if (cur && !ev.target.closest("header")) close(); });
    band.addEventListener("focusout", function (ev) { if (cur && !header.contains(ev.relatedTarget)) close(); });
    desk.addEventListener && desk.addEventListener("change", function () { if (!desk.matches) close(); });
  })();

  /* ============ v48: 방문자 수 (Today / Total) ============
     Cloudflare Worker(geoflow-visits) + D1. 같은 브라우저는 한국 시간 하루에 한 번만 셉니다.
     처음 방문(오늘 아직 안 셈) → POST /hit(1 증가 후 숫자 받기), 이미 셈 → GET /stats(숫자만).
     방문자 IP·쿠키는 저장하지 않으며, '오늘 셌음' 표시는 방문자 브라우저 안(localStorage)에만 남습니다. */
  (function () {
    var VC_URL = "https://geoflow-visits.gwanwoo7835.workers.dev";
    var els = document.querySelectorAll("[data-vc]");
    if (!els.length || !window.fetch) return;
    var KEY = "gf-visit-day";
    function store() { try { var t = "__t"; window.localStorage.setItem(t, t); window.localStorage.removeItem(t); return window.localStorage; } catch (e) { try { return window.sessionStorage; } catch (e2) { return null; } } }
    var st = store();
    var today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    var seen = null; try { seen = st && st.getItem(KEY); } catch (e) {}
    var hit = seen !== today;
    fetch(VC_URL + (hit ? "/hit" : "/stats"), { method: hit ? "POST" : "GET", cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        if (hit && d && d.day) { try { st && st.setItem(KEY, d.day); } catch (e) {} }
        var fmt = function (n) { return (Number(n) || 0).toLocaleString("en-US"); };
        Array.prototype.forEach.call(els, function (e) { e.textContent = fmt(d[e.getAttribute("data-vc")]); });
      })
      .catch(function () {});
  })();
})();
