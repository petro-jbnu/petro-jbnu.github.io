/* GeoFlow 소개 영상 팝업
   홈 화면 오른쪽 아래에 작은 플레이어를 띄운다. 영상 오른쪽 위 모서리의 버튼: 소리 켜기/끄기, 크게/작게, 닫기.
   영상은 재생을 누르기 전에는 내려받지 않는다 (대기 화면 이미지 한 장만 받는다).
   파일: assets/video/GeoFlow_film.mp4, assets/img/geoflow-film-poster.jpg */
(function () {
  if (!window.matchMedia || !matchMedia("(min-width: 1024px)").matches) return;   // PC 화면에서만
  try { if (sessionStorage.getItem("gfFilmClosed") === "1") return; } catch (e) {}  // 닫았으면 이번 방문 동안 다시 띄우지 않음

  var css =
    ".gf-film{position:fixed;right:12px;bottom:16px;z-index:900;width:364px;max-width:calc(100vw - 24px);background:#000;color:#fff;" +
    "border:1px solid #d5dae0;box-shadow:0 8px 24px rgba(15,31,43,.14);font-family:inherit;transition:width .25s ease}" +
    ".gf-film.is-large{width:792px}" +
    ".gf-film__bar{position:absolute;top:6px;right:6px;z-index:2;display:flex;gap:4px;transition:opacity .2s}" +
    ".gf-film.is-playing:not(:hover):not(:focus-within) .gf-film__bar{opacity:.4}" +
    ".gf-film__btn{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(15,31,43,.6);border:0;color:#fff;cursor:pointer;padding:0}" +
    ".gf-film__btn:hover{background:rgba(15,31,43,.88)}" +
    ".gf-film__btn:focus-visible,.gf-film__play:focus-visible{outline:2px solid #fff;outline-offset:1px}" +
    ".gf-film__stage{position:relative;aspect-ratio:16/9;background:#000}" +
    ".gf-film__stage video{display:block;width:100%;height:100%;object-fit:contain;background:#000}" +
    ".gf-film__play{position:absolute;inset:0;display:grid;place-items:center;background:rgba(15,31,43,.18);border:0;cursor:pointer;padding:0}" +
    ".gf-film__play span{width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.94);display:grid;place-items:center;box-shadow:0 2px 10px rgba(0,0,0,.3)}" +
    ".gf-film__play:hover span{background:#fff;transform:scale(1.05)}" +
    "@media (prefers-reduced-motion:reduce){.gf-film{transition:none}.gf-film__play:hover span{transform:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var ICON_ON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z" fill="currentColor"/><path d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6.3 6.3 0 0 1 0 9"/></svg>';
  var ICON_OFF = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z" fill="currentColor"/><path d="M10.8 6l3.6 4M14.4 6l-3.6 4"/></svg>';
  var en = (document.documentElement.getAttribute("data-lang") || "ko") === "en";
  var T = en ? { title: "Lab film", play: "Play the lab film", big: "Enlarge", small: "Shrink", close: "Close", off: "Turn sound off", on: "Turn sound on" }
             : { title: "연구실 소개 영상", play: "연구실 소개 영상 재생", big: "크게 보기", small: "작게 보기", close: "닫기", off: "소리 끄기", on: "소리 켜기" };

  var box = document.createElement("aside"); box.className = "gf-film"; box.setAttribute("aria-label", T.title);
  box.innerHTML =
    '<div class="gf-film__stage"><video preload="none" playsinline poster="assets/img/geoflow-film-poster.jpg"><source src="assets/video/GeoFlow_film.mp4" type="video/mp4"></video>' +
    '<div class="gf-film__bar">' +
    '<button type="button" class="gf-film__btn" data-act="sound" aria-label="' + T.off + '" title="' + T.off + '">' + ICON_ON + '</button>' +
    '<button type="button" class="gf-film__btn" data-act="size" aria-label="' + T.big + '" title="' + T.big + '">' +
    '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8.5 1.5h4v4M12.5 1.5 8 6M5.5 12.5h-4v-4M1.5 12.5 6 8"/></svg></button>' +
    '<button type="button" class="gf-film__btn" data-act="close" aria-label="' + T.close + '" title="' + T.close + '">' +
    '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l10 10M12 2 2 12"/></svg></button></div>' +
    '<button type="button" class="gf-film__play" aria-label="' + T.play + '"><span><svg width="20" height="20" viewBox="0 0 20 20"><path d="M7 4.5v11l9-5.5z" fill="#0f1f2b"/></svg></span></button></div>';
  document.body.appendChild(box);

  var video = box.querySelector("video"), play = box.querySelector(".gf-film__play"), sizeBtn = box.querySelector('[data-act="size"]');
  function setLarge(on) {
    box.classList.toggle("is-large", on);
    sizeBtn.setAttribute("aria-label", on ? T.small : T.big); sizeBtn.title = on ? T.small : T.big;
  }
  play.addEventListener("click", function () {
    play.style.display = "none"; video.controls = true; box.classList.add("is-playing");
    var p = video.play(); if (p && p.catch) p.catch(function () {});
  });
  video.addEventListener("pause", function () { box.classList.remove("is-playing"); });
  video.addEventListener("play", function () { box.classList.add("is-playing"); });
  video.addEventListener("ended", function () { video.controls = false; play.style.display = ""; video.load(); });
  var soundBtn = box.querySelector('[data-act="sound"]');
  function showSound() { var m = video.muted || video.volume === 0; soundBtn.innerHTML = m ? ICON_OFF : ICON_ON; soundBtn.setAttribute("aria-label", m ? T.on : T.off); soundBtn.title = m ? T.on : T.off; soundBtn.setAttribute("aria-pressed", m ? "true" : "false"); }
  soundBtn.addEventListener("click", function () { video.muted = !video.muted; if (!video.muted && video.volume === 0) video.volume = 1; });
  video.addEventListener("volumechange", showSound);
  sizeBtn.addEventListener("click", function () { setLarge(!box.classList.contains("is-large")); });
  box.querySelector('[data-act="close"]').addEventListener("click", function () {
    video.pause(); box.remove();
    try { sessionStorage.setItem("gfFilmClosed", "1"); } catch (e) {}
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("is-large")) setLarge(false); });
})();
