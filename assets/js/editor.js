/* ============================================================
   화면 편집 모드 (Visual Edit Mode)
   사용법: 아무 페이지나 주소 뒤에 ?edit 을 붙여 엽니다.
     예) index.html?edit   /  about.html?edit
   화면의 텍스트를 클릭해 바로 수정한 뒤 [수정된 파일 다운로드]를
   누르면 반영된 HTML 파일이 저장됩니다. 그 파일로 원본을 교체하세요.
   ※ 논문·소식·과제·구성원 목록은 이 모드가 아니라 /admin 또는
     data/*.json 에서 수정합니다 (해당 영역은 잠금 처리됨).
   ============================================================ */
(function () {
  "use strict";
  if (!/[?&]edit\b/.test(window.location.search)) return;

  var DYNAMIC_IDS = ["news-list", "paper-list", "pres-list", "grant-list", "member-list", "alumni-body"];
  var dirty = false;

  function init() {
    // 1) 본문 편집 가능화
    document.body.contentEditable = "true";
    document.body.spellcheck = false;

    // 2) 데이터 렌더링 영역·버튼류 잠금 (data/*.json 소관)
    DYNAMIC_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.contentEditable = "false";
        el.setAttribute("data-edit-lock", "1");
        el.style.outline = "2px dashed #b45309";
        el.style.outlineOffset = "4px";
        el.title = "이 목록은 /admin 또는 data 폴더의 JSON 파일에서 수정합니다.";
      }
    });
    document.querySelectorAll(".lang-btn, #menu-btn, .hero-dot").forEach(function (el) {
      el.setAttribute("contenteditable", "false");
      el.setAttribute("data-edit-lock", "1");
    });

    document.addEventListener("input", function () { dirty = true; });
    window.addEventListener("beforeunload", function (e) {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    });

    buildToolbar();
  }

  function fileName() {
    var n = window.location.pathname.split("/").pop();
    return n && n.indexOf(".html") > -1 ? n : "index.html";
  }

  function buildToolbar() {
    var tb = document.createElement("div");
    tb.id = "edit-toolbar";
    tb.setAttribute("contenteditable", "false");
    tb.setAttribute("data-edit-ui", "1");
    tb.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;background:#0d1b24;color:#fff;" +
      "border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.35);padding:16px 18px;width:290px;" +
      "font-family:'Pretendard Variable',Pretendard,sans-serif;font-size:13px;line-height:1.5;";
    tb.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
      '<span style="width:9px;height:9px;border-radius:50%;background:#4ade80;display:inline-block;"></span>' +
      '<strong style="font-size:14px;">편집 모드</strong>' +
      '<span style="margin-left:auto;opacity:.6;font-family:monospace;">' + fileName() + "</span></div>" +
      '<div style="opacity:.75;margin-bottom:10px;">화면의 텍스트를 클릭해 바로 수정하세요. 실행 취소: Ctrl+Z<br>' +
      "현재 <b>보이는 언어만</b> 수정됩니다. 우상단 버튼으로 KO/EN을 전환해 두 언어 모두 수정하세요.<br>" +
      '<span style="color:#f2b48e;">주황 점선 영역(목록)은 /admin·data에서 수정합니다.</span></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button id="edit-save" style="flex:1;background:#0B5B78;color:#fff;border:0;border-radius:8px;padding:9px 10px;font-weight:700;cursor:pointer;font-size:13px;">수정된 파일 다운로드</button>' +
      '<button id="edit-reset" style="background:transparent;color:#b3c2cc;border:1px solid #35586a;border-radius:8px;padding:9px 10px;cursor:pointer;font-size:13px;">되돌리기</button>' +
      "</div>" +
      '<div style="margin-top:8px;opacity:.6;">다운로드한 파일로 같은 이름의 원본을 교체하면 반영됩니다.</div>';
    document.body.appendChild(tb);

    document.getElementById("edit-save").addEventListener("click", exportHtml);
    document.getElementById("edit-reset").addEventListener("click", function () {
      if (confirm("모든 수정 내용을 버리고 원본 상태로 되돌릴까요?")) { dirty = false; window.location.reload(); }
    });
  }

  function exportHtml() {
    var clone = document.documentElement.cloneNode(true);

    // 편집 도구·런타임 요소 제거
    ["#edit-toolbar", "#toast"].forEach(function (sel) {
      var el = clone.querySelector(sel);
      if (el) el.remove();
    });

    // 데이터 렌더링 영역 비우기 (런타임에 JSON으로 다시 그려짐)
    DYNAMIC_IDS.forEach(function (id) {
      var el = clone.querySelector("#" + id);
      if (el) { el.innerHTML = ""; el.removeAttribute("style"); el.removeAttribute("title"); }
    });

    // 편집 속성·잠금 표식 제거
    var body = clone.querySelector("body");
    if (body) { body.removeAttribute("contenteditable"); body.removeAttribute("spellcheck"); }
    clone.querySelectorAll("[data-edit-lock]").forEach(function (el) {
      el.removeAttribute("contenteditable");
      el.removeAttribute("data-edit-lock");
    });
    clone.querySelectorAll("[data-edit-ui]").forEach(function (el) { el.remove(); });

    // 언어 상태를 기본값(ko)으로 복원 — 방문자 브라우저에서 다시 자동 결정됨
    clone.setAttribute("data-lang", "ko");
    clone.setAttribute("lang", "ko");
    var title = clone.querySelector("title");
    if (title && title.getAttribute("data-ko")) title.textContent = title.getAttribute("data-ko");

    var html = "<!DOCTYPE html>\n" + clone.outerHTML;
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName();
    // contenteditable 영역 안에서는 브라우저가 링크 클릭을 무시하므로,
    // 잠시 편집을 해제한 뒤 비편집 영역(툴바)에서 클릭한다.
    document.body.contentEditable = "false";
    var host = document.getElementById("edit-toolbar") || document.body;
    host.appendChild(a);
    a.click();
    a.remove();
    document.body.contentEditable = "true";
    dirty = false;

    var t = document.getElementById("toast");
    if (t) { t.textContent = "다운로드 완료 — 같은 이름의 원본 파일을 교체하세요."; t.classList.add("show");
      setTimeout(function () { t.classList.remove("show"); }, 3000); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
