(function () {
  "use strict";
  var LIB = window.LIBRARY || { books: [], intro: [] };
  var veil = document.getElementById("veil");
  var field = document.getElementById("veilField");
  var shelf = document.getElementById("shelf");
  var shelfRows = document.getElementById("shelfRows");
  var reader = document.getElementById("reader");
  var bookEl = null;
  var readerTitle = document.getElementById("readerTitle");
  var readerStatus = document.getElementById("readerStatus");
  var stage = document.getElementById("readerStage");
  var prevBtn = document.getElementById("prevPage");
  var nextBtn = document.getElementById("nextPage");

  var PAGE_W = 540, PAGE_H = 720;
  document.documentElement.style.setProperty("--page-ratio", PAGE_W / PAGE_H);

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pick(rand, a, b) { return a + rand() * (b - a); }
  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ---------------------------------------------------------- 1. 照片流 */
  function buildVeil() {
    var photos = (window.ALBUM && window.ALBUM.intro && window.ALBUM.intro.length) ? window.ALBUM.intro : (LIB.intro || []);
    var rand = rng(20260101);
    var ordered = shuffle(photos.slice(), rand);
    var frag = document.createDocumentFragment();
    var placed = [];
    ordered.forEach(function (p, i) {
      var ang = rand() * Math.PI * 2;
      var rad = 5 + rand() * 54;
      var x = 50 + Math.cos(ang) * rad;
      var y = 47 + Math.sin(ang) * rad * 0.88;
      var z = Math.round(-980 + rand() * 1250);
      var t = (z + 980) / 1250;
      var size = 9 + t * 17;
      var el = document.createElement("div");
      el.className = "veil-photo";
      el.style.cssText =
        "--x:" + x.toFixed(2) + "%;--y:" + y.toFixed(2) + "%;" +
        "--z:" + z + "px;--dz:" + Math.round(-40 - rand() * 90) + "px;" +
        "--s:" + size.toFixed(2) + "vw;--ar:" + (p.w / p.h).toFixed(4) + ";" +
        "--r:" + pick(rand, -16, 16).toFixed(1) + "deg;" +
        "--rr:" + pick(rand, -7, 7).toFixed(1) + "deg;" +
        "--dx:" + pick(rand, -6, 6).toFixed(2) + "vw;" +
        "--dy:" + pick(rand, -5, 5).toFixed(2) + "vh;" +
        "--sc:" + pick(rand, .94, 1.09).toFixed(3) + ";" +
        "--dur:" + pick(rand, 7, 15).toFixed(2) + "s;" +
        "--delay:" + pick(rand, -12, 0).toFixed(2) + "s;" +
        "--o:" + (0.34 + t * 0.62).toFixed(2) + ";" +
        "--fade:" + (i * 0.02).toFixed(2) + "s;" +
        "z-index:" + Math.round(100 + z / 10) + ";";
      var img = document.createElement("img");
      img.src = p.src; img.alt = ""; img.decoding = "async";
      if (i > 14) img.loading = "lazy";
      el.appendChild(img);
      frag.appendChild(el);
      placed.push({ el: el, z: z });
    });
    placed.slice().sort(function (a, b) { return a.z - b.z; }).slice(0, 10).forEach(function (o) { o.el.classList.add("is-far"); });
    placed.slice().sort(function (a, b) { return b.z - a.z; }).slice(0, 8).forEach(function (o) { o.el.classList.add("is-near"); });
    for (var k = 0; k < 22; k++) {
      var dust = document.createElement("span");
      dust.className = "veil-dust";
      dust.style.cssText = "--x:" + pick(rand, 2, 98).toFixed(2) + "%;--y:" + pick(rand, 6, 96).toFixed(2) + "%;" +
        "--ds:" + pick(rand, 2, 5).toFixed(1) + "px;--dd:" + pick(rand, 11, 24).toFixed(1) + "s;" +
        "--ddel:" + pick(rand, -20, 0).toFixed(1) + "s;--dx:" + pick(rand, -30, 30).toFixed(0) + "px;--dy:" + (-60 - rand() * 120).toFixed(0) + "px;";
      frag.appendChild(dust);
    }
    field.appendChild(frag);
    requestAnimationFrame(function () { veil.classList.add("is-ready"); });
  }

  /* ---------------------------------------------------------- 2. 书架 */
  function buildShelf() {
    var overrides = {
      meet: { sub: "我们的一些照片" },
      daily: { sub: "爱藏在普通的日子里" },
      cq: { sub: "山在城中，城在江上" },
      chat: { sub: "一条一条，都是我们" },
      letter: { sub: "最后一页，留给你" }
    };
    var books = (LIB.books || []).filter(function (b) { return b.id !== "first"; });
    var items = books.map(function (b) { return { book: b }; });
    if (window.ALBUM && window.ALBUM.total) {
      items.push({ album: true, book: {
        id: "__album", title: "全部照片", volume: "PHOTO ALBUM", tint: "#6f5f86",
        count: window.ALBUM.total, sub: (window.ALBUM.categories || []).map(function (c) { return c.name; }).join(" · ")
      }});
    }
    var rand = rng(77);
    function render() {
      var perRow = window.innerWidth >= 560 ? 3 : 2;
      shelfRows.innerHTML = "";
      for (var i = 0; i < items.length; i += perRow) {
        var row = document.createElement("div");
        row.className = "shelf-row";
        items.slice(i, i + perRow).forEach(function (it) {
          var b = it.book;
          var sub = it.album ? b.sub : ((overrides[b.id] || {}).sub || "");
          var tile = document.createElement("button");
          tile.type = "button";
          tile.className = "book-tile" + (it.album ? " is-album" : "");
          tile.style.cssText =
            "--tint:" + b.tint + ";" +
            "--tilt:" + pick(rand, -1.4, 1.4).toFixed(2) + "deg;" +
            "--lift:" + pick(rand, -3, 3).toFixed(1) + "px;";
          tile.dataset.book = b.id;
          tile.innerHTML =
            '<span class="book-face">' +
              '<span class="book-vol">' + esc(b.volume) + '</span>' +
              '<span class="book-name">' + esc(b.title) + '</span>' +
              '<span class="book-sub">' + esc(sub) + '</span>' +
              '<span class="book-rule"></span>' +
              '<span class="book-count">' + b.count + ' PHOTOS</span>' +
            '</span>';
          tile.addEventListener("click", function () {
            if (it.album) { if (window.ALBUM_UI) window.ALBUM_UI.open(); }
            else openBook(b.id);
          });
          row.appendChild(tile);
        });
        shelfRows.appendChild(row);
      }
    }
    render();
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t); t = setTimeout(render, 220);
    });
  }

  /* ---------------------------------------------------------- 3. 翻页书 */
  function photoCard(it) {
    return '<figure class="photo-card">' +
      '<img src="' + esc(it.src) + '" alt="' + esc(it.alt || it.caption || "") + '" ' +
      'width="' + it.w + '" height="' + it.h + '" loading="lazy" decoding="async">' +
      (it.caption ? '<figcaption>' + esc(it.caption) + '</figcaption>' : '') +
      '</figure>';
  }

  function renderPage(p, i, total) {
    var cls = "book-page art-page pg-" + p.type, inner = "";
    switch (p.type) {
      case "cover":
        inner = '<div class="cover-inner">' +
          '<p class="cover-foot" style="position:absolute;top:11%;bottom:auto">OUR ANNIVERSARY</p>' +
          '<h1 class="cover-title">' + esc(p.title) + '</h1>' +
          '<div class="cover-rule"></div>' +
          '<p class="cover-subtitle">' + esc(p.subtitle) + '</p>' +
          '<p class="cover-foot">' + esc(p.foot) + '</p>' +
          '<div class="cover-stamp">' + esc(p.title.charAt(0)) + '</div>' +
          (p.image ? '<div class="cover-plate"><img src="' + esc(p.image) + '" alt="" loading="lazy" decoding="async"></div>' : '') +
          '</div>';
        cls += " cloth";
        break;
      case "back":
        cls += " cloth";
        inner = '<div class="back-inner"><p class="back-title">' + esc(p.title) + '</p>' +
          '<p class="back-sub">' + esc(p.subtitle) + '</p></div>';
        break;
      case "endpaper":
        cls += " endpaper";
        inner = '<div class="endpaper-mark">' + esc(p.mark) + '</div>';
        break;
      case "title":
        inner = '<div class="title-page"><p class="title-kicker">' + esc(p.kicker) + '</p>' +
          '<h2>' + esc(p.title) + '</h2><div class="title-rule"></div>' +
          '<p class="title-subtitle">' + esc(p.subtitle) + '</p>' +
          '<p class="title-note">' + esc(p.note) + '</p></div>' +
          '<div class="title-seal">' + esc(p.title.charAt(0)) + '</div>';
        break;
      case "quote":
        inner = '<div class="quote-body"><blockquote><span class="quote-mark">&#8220;</span>' +
          esc(p.text) + '</blockquote></div>';
        break;
      case "section":
        if (p.image) cls += " has-photo";
        inner = (p.image ? '<div class="section-photo"><img src="' + esc(p.image) + '" alt="" loading="lazy" decoding="async"></div>' : '') +
          '<div class="section-page"><p class="section-eyebrow">' + esc(p.eyebrow) + '</p>' +
          '<p class="section-number">' + esc(p.num) + '</p>' +
          '<h2>' + esc(p.title) + '</h2><p>' + esc(p.text) + '</p></div>' +
          '<p class="folio">' + String(i + 1).padStart(2, "0") + '</p>';
        break;
      case "photo":
        inner = '<div class="grid">' + photoCard(p.items[0]) + '</div>';
        break;
      case "duo":
        inner = '<div class="grid">' + p.items.map(photoCard).join("") + '</div>';
        break;
      case "quad":
        inner = '<div class="grid">' + p.items.map(photoCard).join("") + '</div>';
        break;
      case "letter":
        inner = '<div class="letter-body"><h2 class="letter-title">' + esc(p.title) + '</h2>' +
          p.lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join("") +
          (p.sign ? '<p class="letter-sign">' + esc(p.sign) + '</p>' : "") + '</div>';
        break;
      case "closing":
        inner = '<div class="closing-body"><p class="closing-kicker">' + esc(p.kicker) + '</p>' +
          '<h2>' + esc(p.title) + '</h2><p class="closing-note">' + esc(p.note) + '</p></div>';
        break;
      case "colophon":
        inner = '<div class="colophon"><p class="colophon-title">' + esc(p.title) + '</p>' +
          p.lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join("") + '</div>';
        break;
      default:
        inner = "";
    }
    var hard = i === 0 || i === total - 1;
    var deco = "";
    if (p.type !== "cover" && p.type !== "back") {
      deco += '<span class="pg-deco" aria-hidden="true"></span>';
    }
    if (p.type === "photo" || p.type === "duo" || p.type === "quad") {
      deco += '<span class="pg-orn" aria-hidden="true"></span>' +
        '<span class="pg-folio">' + String(i + 1).padStart(2, "0") + '</span>';
      if (i % 7 === 3) {
        var ch = (activeBook && activeBook.title) ? activeBook.title.charAt(0) : "记";
        deco += '<span class="pg-seal" aria-hidden="true">' + esc(ch) + '</span>';
      }
      if (i % 9 === 5) deco += '<span class="pg-doodle" aria-hidden="true"></span>';
      if (i % 9 === 1) deco += '<span class="pg-doodle is-star" aria-hidden="true"></span>';
    }
    return '<article class="' + cls + (hard ? ' --hard' : '') + '"' +
      (hard ? ' data-density="hard"' : '') + ' aria-label="' + esc(p.title || p.type) + '">' +
      inner + deco + '</article>';
  }

  var flip = null, current = 0, turning = false, activeBook = null;

  function freshBook() {
    if (bookEl) { try { bookEl.remove(); } catch (e) {} }
    bookEl = document.createElement("div");
    bookEl.className = "book";
    bookEl.id = "book";
    bookEl.dataset.pageWidth = PAGE_W;
    bookEl.dataset.pageHeight = PAGE_H;
    stage.appendChild(bookEl);
    return bookEl;
  }

  function updateStatus() {
    if (!flip) return;
    var last = flip.getPageCount() - 1;
    prevBtn.disabled = current === 0 || turning;
    nextBtn.disabled = current === last || turning;
    readerStatus.textContent = current === 0 ? "封面"
      : current === last ? "封底"
      : (current + 1) + " / " + (last + 1);
  }

  /* 让书页（尤其是双开）始终完整落在阅读区里，不要压到翻页按钮 */
  function fitBook() {
    if (!bookEl || !flip) return;
    var sr = stage.getBoundingClientRect();
    var availW = Math.max(140, sr.width - 16);
    var availH = Math.max(140, sr.height - 6);
    var w = bookEl.offsetWidth, h = bookEl.offsetHeight;
    if (!w || !h) return;
    var k = Math.min(1, availW / w, availH / h);
    bookEl.style.transformOrigin = "center center";
    bookEl.style.transform = k < 0.995 ? "scale(" + k.toFixed(4) + ")" : "";
  }

  function openBook(id) {
    var b = LIB.books.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    activeBook = b;
    readerTitle.textContent = b.title;
    if (flip) { try { flip.destroy(); } catch (e) {} flip = null; }
    bookEl = freshBook();
    bookEl.dataset.book = b.id;
    bookEl.style.setProperty("--accent", b.tint || "#7d8572");
    var TEX = { meet: ["style/tex/natural-paper.png", "#f8f6ef"], daily: ["style/tex/cream-paper.png", "#faf7ee"],
                cq: ["style/tex/paper-fibers.png", "#f5f4ee"], chat: ["style/tex/natural-paper.png", "#f7f6f1"],
                letter: ["style/tex/cream-paper.png", "#f9f5ef"] };
    bookEl.style.setProperty("--paper", (TEX[b.id] || ["", "#f7f6f0"])[1]);
    bookEl.innerHTML = b.pages.map(function (p, i) { return renderPage(p, i, b.pages.length); }).join("");
    var pages = bookEl.querySelectorAll(".book-page");
    flip = new St.PageFlip(bookEl, {
      width: PAGE_W, height: PAGE_H, size: "stretch",
      minWidth: 240, maxWidth: 820, minHeight: 300, maxHeight: 1024,
      drawShadow: true, flippingTime: 720, usePortrait: true, startZIndex: 10,
      autoSize: true, maxShadowOpacity: 0.4, showCover: true,
      mobileScrollSupport: false, clickEventForward: false,
      useMouseEvents: true, swipeDistance: 22, showPageCorners: true,
      disableFlipByClick: true
    });
    current = 0; turning = false;
    flip.on("flip", function (e) { current = Number(e.data); updateStatus(); });
    flip.on("changeState", function (e) { turning = e.data !== "read"; updateStatus(); });
    flip.on("init", function (e) { bookEl.dataset.layout = e.data.mode; requestAnimationFrame(fitBook); });
    flip.on("changeOrientation", function (e) { bookEl.dataset.layout = e.data; requestAnimationFrame(fitBook); });
    flip.loadFromHTML(pages);
    setTimeout(fitBook, 80);
    setTimeout(fitBook, 420);
    updateStatus();
    reader.classList.add("is-open");
    reader.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-reading");
  }

  function closeBook() {
    reader.classList.remove("is-open");
    reader.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-reading");
    setTimeout(function () {
      if (flip) { try { flip.destroy(); } catch (e) {} flip = null; }
      if (bookEl) { try { bookEl.remove(); } catch (e) {} bookEl = null; }
    }, 420);
  }

  prevBtn.addEventListener("click", function () { if (flip && !turning) flip.flipPrev(); });
  nextBtn.addEventListener("click", function () { if (flip && !turning) flip.flipNext(); });
  document.getElementById("closeBook").addEventListener("click", closeBook);
  window.addEventListener("keydown", function (e) {
    if (!flip) return;
    if (e.key === "Escape") return closeBook();
    if (e.key === "ArrowLeft" && !turning) flip.flipPrev();
    if (e.key === "ArrowRight" && !turning) flip.flipNext();
  });
  window.addEventListener("resize", function () { requestAnimationFrame(fitBook); });
  window.addEventListener("orientationchange", function () { setTimeout(fitBook, 280); });

  /* ---------------------------------------------------------- 4. 开场 */
  var opened = false;
  function openShelf() {
    if (opened) return;
    opened = true;
    veil.classList.add("is-opening");
    setTimeout(function () {
      veil.setAttribute("aria-hidden", "true");
      shelf.classList.add("is-live");
      shelf.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-shelf");
    }, 780);
    setTimeout(function () { field.innerHTML = ""; veil.style.display = "none"; }, 2600);
  }
  veil.addEventListener("click", openShelf, { once: false });
  veil.addEventListener("touchstart", function (e) { e.preventDefault(); openShelf(); }, { passive: false });
  window.addEventListener("keydown", function (e) {
    if (!opened && (e.key === "Enter" || e.key === " ")) openShelf();
  });

  var fieldEl = document.getElementById("veilField");
  var parX = 0, parY = 0, tgtX = 0, tgtY = 0;
  window.addEventListener("pointermove", function (e) {
    if (opened) return;
    tgtX = (e.clientX / window.innerWidth - 0.5) * -34;
    tgtY = (e.clientY / window.innerHeight - 0.5) * -26;
  }, { passive: true });
  (function loop() {
    parX += (tgtX - parX) * 0.05; parY += (tgtY - parY) * 0.05;
    if (fieldEl && !opened) fieldEl.style.transform = "translate3d(" + parX.toFixed(2) + "px," + parY.toFixed(2) + "px,0)";
    requestAnimationFrame(loop);
  })();

  buildVeil();
  buildShelf();
})();
