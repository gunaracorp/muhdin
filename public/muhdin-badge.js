/**
 * muhdin-badge.js — Widget Badge Verifikasi MUHDIN (Task 52, P0 quick win).
 *
 * Pasang di website penyelenggara (1 baris, tanpa dependensi):
 *
 *   <script src="https://www.muhdin.or.id/muhdin-badge.js"
 *           data-license="PPIU-2026-0001" async></script>
 *
 * Atribut yang didukung:
 *   data-license  : nomor izin anggota (wajib, atau data-q untuk cari nama)
 *   data-q        : pencarian nama penyelenggara (alternatif data-license)
 *   data-endpoint : (opsional) override URL API, default <origin script>/api/widget/verify
 *   data-lang     : (opsional) "id" | "en" | "ar", default bahasa browser
 *   data-size     : (opsional) "sm" | "md" (default md)
 *
 * Badge menampilkan status real-time dari database publik MUHDIN:
 *   ✓ TERVERIFIKASI (hijau) · ⏳ PENDING (kuning) · ✕ SUSPENDED (merah) ·
 *   ? tidak ditemukan (abu). Klik badge membuka halaman verifikasi resmi.
 *
 * Self-contained: gaya inline (tak akan bentrok dengan CSS situs tujuan),
 * escape XSS pada semua nilai dinamis, dan fallback aman saat API gagal.
 */
(function () {
  "use strict";

  var script =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();

  var origin = "";
  try {
    origin = new URL(script.src, location.href).origin;
  } catch (e) {
    origin = "";
  }
  var API =
    script.getAttribute("data-endpoint") ||
    (origin ? origin + "/api/widget/verify" : "/api/widget/verify");

  var L10N = {
    id: {
      verified: "Terdaftar & Terverifikasi MUHDIN",
      pending: "Pendaftaran dalam Proses Verifikasi",
      suspended: "DITANGGUHKAN — Jangan Bertransaksi",
      notfound: "TIDAK TERDAFTAR di MUHDIN",
      checking: "Memverifikasi…",
      error: "Verifikasi tidak tersedia",
      cta: "Cek verifikasi resmi",
      brand: "Asosiasi Masyarakat Umroh Haji Digital Indonesia",
    },
    en: {
      verified: "Registered & Verified by MUHDIN",
      pending: "Registration Under Verification",
      suspended: "SUSPENDED — Do Not Transact",
      notfound: "NOT REGISTERED with MUHDIN",
      checking: "Verifying…",
      error: "Verification unavailable",
      cta: "Check official verification",
      brand: "Indonesia Digital Hajj & Umrah Community",
    },
    ar: {
      verified: "مسجَّل ومعتمد من مهدين",
      pending: "قيد التحقق من التسجيل",
      suspended: "معلَّق — لا تتعامل",
      notfound: "غير مسجَّل في مهدين",
      checking: "جار التحقق…",
      error: "التحقق غير متاح",
      cta: "تحقق رسمي",
      brand: "المجتمع الإندونيسي الرقمي للحج والعمرة",
    },
  };

  var lang = (script.getAttribute("data-lang") || (navigator.language || "id").slice(0, 2)).toLowerCase();
  var T = L10N[lang] || L10N.id;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function apiGet(q) {
    var url = API + (API.indexOf("?") > -1 ? "&" : "?") + "q=" + encodeURIComponent(q);
    if (typeof fetch === "function") {
      return fetch(url, { mode: "cors" }).then(function (r) {
        return r.json();
      });
    }
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open("GET", url);
      x.onload = function () {
        try {
          resolve(JSON.parse(x.responseText));
        } catch (e) {
          reject(e);
        }
      };
      x.onerror = reject;
      x.send();
    });
  }

  var HEX_SVG =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>';

  var STATE_STYLE = {
    TERVERIFIKASI: { bg: "#0b5c3f", fg: "#ffffff", ring: "rgba(11,92,63,.35)", icon: "check" },
    PENDING: { bg: "#8a6d1a", fg: "#ffffff", ring: "rgba(138,109,26,.3)", icon: "clock" },
    SUSPENDED: { bg: "#8f1d1d", fg: "#ffffff", ring: "rgba(143,29,29,.35)", icon: "x" },
    NOTFOUND: { bg: "#6b7280", fg: "#ffffff", ring: "rgba(107,114,128,.3)", icon: "question" },
    CHECKING: { bg: "#374151", fg: "#ffffff", ring: "rgba(55,65,81,.3)", icon: "clock" },
    ERROR: { bg: "#6b7280", fg: "#ffffff", ring: "rgba(107,114,128,.3)", icon: "question" },
  };

  var STATE_ICON = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    question:
      '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.2-3 4"/><path d="M12 17h.01"/>',
  };

  function badgeHTML(state, title, sub, link) {
    var st = STATE_STYLE[state] || STATE_STYLE.CHECKING;
    var iconPath = STATE_ICON[st.icon] || STATE_ICON.question;
    var html =
      '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" ' +
      'data-muhdin-status="' + esc(state) + '" ' +
      'style="all:initial;display:inline-block;text-decoration:none;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif">' +
      '<span style="display:inline-flex;align-items:center;gap:8px;padding:7px 14px 7px 10px;border-radius:9999px;' +
      "background:" + esc(st.bg) + ";color:" + esc(st.fg) + ";" +
      "box-shadow:0 1px 6px " + esc(st.ring) + ";" +
      "font-size:12.5px;font-weight:700;line-height:1.25;text-decoration:none;-webkit-font-smoothing:antialiased\">" +
      '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      iconPath +
      "</svg>" +
      '<span style="display:inline-flex;flex-direction:column">' +
      '<span style="font-size:12.5px">' + esc(title) + "</span>" +
      (sub ? '<span style="font-size:10.5px;font-weight:600;opacity:.85">' + esc(sub) + "</span>" : "") +
      "</span>" +
      "</span></a>";
    return html;
  }

  function mount(el, q) {
    if (!el || el.getAttribute("data-muhdin-mounted") === "1") return;
    el.setAttribute("data-muhdin-mounted", "1");
    var size = script.getAttribute("data-size") === "sm" ? "sm" : "md";
    if (size === "sm") el.style.transform = "scale(.9)";
    el.setAttribute("data-muhdin-status", "CHECKING");
    el.innerHTML =
      '<span style="display:inline-flex;align-items:center;gap:8px;padding:7px 14px 7px 10px;border-radius:9999px;background:#374151;color:#fff;font-size:12.5px;font-weight:700;font-family:inherit">' +
      T.checking +
      "</span>";

    apiGet(q)
      .then(function (res) {
        var link = (origin || "") + "/#/verifikasi/" + encodeURIComponent(q);
        if (!res || res.error === "SERVER_ERROR") {
          el.innerHTML = badgeHTML("ERROR", T.error, null, link);
          el.setAttribute("data-muhdin-status", "ERROR");
          return;
        }
        if (!res.found || !res.member) {
          el.innerHTML = badgeHTML("NOTFOUND", T.notfound, null, link);
          el.setAttribute("data-muhdin-status", "NOTFOUND");
          return;
        }
        var m = res.member;
        var state = m.status === "TERVERIFIKASI" ? "TERVERIFIKASI" : m.status === "SUSPENDED" ? "SUSPENDED" : "PENDING";
        var title = state === "TERVERIFIKASI" ? T.verified : state === "SUSPENDED" ? T.suspended : T.pending;
        var sub = m.name + (m.licenseNo ? " · " + m.licenseNo : "");
        el.innerHTML = badgeHTML(state, title, sub, link);
        el.setAttribute("data-muhdin-status", state);
      })
      .catch(function () {
        var link = (origin || "") + "/#/verifikasi/" + encodeURIComponent(q);
        el.innerHTML = badgeHTML("ERROR", T.error, null, link);
        el.setAttribute("data-muhdin-status", "ERROR");
      });
  }

  function init() {
    var nodes = document.querySelectorAll("[data-muhdin-license], [data-muhdin-q], .muhdin-verify-badge[data-license]");
    Array.prototype.forEach.call(nodes, function (el) {
      var q = el.getAttribute("data-muhdin-license") || el.getAttribute("data-muhdin-q") || el.getAttribute("data-license");
      if (q && String(q).trim().length >= 2) mount(el, String(q).trim());
    });
  }

  window.MUHDINBadge = { init: init, mount: mount };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
