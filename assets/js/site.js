   /*site.js : 
    - CHarge content.xml une fois,
    - detecte la langue (selecteur, session, navigateur, defaut),
    - remplit tt les elements avec le bon texte,
    - met a jour le selecteur de langue et la balise <html lang="">,
    anime la timeline du cv au scroll
   */
(function () {

    "use strict";

    var SUPPORTED_LANGS = ["fr", "en", "ar"];
    var DEFAULT_LANG = "fr";
    var STORAGE_KEY = "site_lang";

    /* ----------------------------------------------------------
        Détermine la langue à afficher, par ordre de priorité :
        1. Paramètre GET (?lang=en)
        2. Langue déjà choisie (stockée en "session" via localStorage)
        3. Langues préférées du navigateur (Accept-Language côté client)
        4. Langue par défaut du site
        ---------------------------------------------------------- */
    function detectLang() {
        var params = new URLSearchParams(window.location.search);
        var fromGet = params.get("lang");
        if (fromGet && SUPPORTED_LANGS.indexOf(fromGet) !== -1) {
        localStorage.setItem(STORAGE_KEY, fromGet);
        return fromGet;
        }

        var fromStorage = localStorage.getItem(STORAGE_KEY);
        if (fromStorage && SUPPORTED_LANGS.indexOf(fromStorage) !== -1) {
        return fromStorage;
        }

        var browserLangs = navigator.languages || [navigator.language];
        for (var i = 0; i < browserLangs.length; i++) {
        var code = browserLangs[i].slice(0, 2).toLowerCase();
        if (SUPPORTED_LANGS.indexOf(code) !== -1) {
            return code;
        }
        }

        return DEFAULT_LANG;
    }

    /* ----------------------------------------------------------
        Charge content.xml (chemin relatif : toutes les pages sont
        au même niveau que content.xml) et le parse en document XML.
        ---------------------------------------------------------- */
    function loadContent() {
        return fetch("content.xml")
        .then(function (res) {
            return res.text();
        })
        .then(function (str) {
            return new window.DOMParser().parseFromString(str, "application/xml");
        });
    }

    /* ----------------------------------------------------------
        Parcourt tous les éléments [data-i18n="id"] de la page et
        remplace leur contenu texte par la traduction correspondante
        trouvée dans content.xml pour la langue donnée.
        ---------------------------------------------------------- */
    function applyTranslations(xmlDoc, lang) {
        document.documentElement.setAttribute("lang", lang);
        document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

        var nodes = document.querySelectorAll("[data-i18n]");
        nodes.forEach(function (el) {
        var id = el.getAttribute("data-i18n");
        var block = xmlDoc.querySelector('block[id="' + id + '"]');
        if (!block) {
            return;
        }
        var textNode = block.querySelector('text[lang="' + lang + '"]');
        if (textNode) {
            el.textContent = textNode.textContent;
        }
        });

        // Cas particulier : le <title> de l'onglet et les attributs
        // (placeholder, title, etc.) via data-i18n-attr="attr:id"
        var attrNodes = document.querySelectorAll("[data-i18n-attr]");
        attrNodes.forEach(function (el) {
        var spec = el.getAttribute("data-i18n-attr").split(":");
        var attrName = spec[0];
        var id = spec[1];
        var block = xmlDoc.querySelector('block[id="' + id + '"]');
        if (!block) {
            return;
        }
        var textNode = block.querySelector('text[lang="' + lang + '"]');
        if (textNode) {
            el.setAttribute(attrName, textNode.textContent);
        }
        });
    }

    /* ----------------------------------------------------------
        Sélecteur de langue (liste déroulante) : on affiche la
        langue courante et on recharge la page au changement.
        ---------------------------------------------------------- */
    function initLangSwitcher(lang) {
        var select = document.querySelector("#lang-switcher select");
        if (!select) {
        return;
        }
        select.value = lang;
        select.addEventListener("change", function () {
        localStorage.setItem(STORAGE_KEY, select.value);
        window.location.reload();
        });
    }

    /* ----------------------------------------------------------
        Timeline du CV : apparition progressive au scroll.
        ---------------------------------------------------------- */
    function initTimeline() {
        var items = document.querySelectorAll(".timeline-item");
        if (!items.length) {
        return;
        }
        if (!("IntersectionObserver" in window)) {
        items.forEach(function (el) {
            el.classList.add("visible");
        });
        return;
        }
        var observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
            });
        },
        { threshold: 0.2 }
        );
        items.forEach(function (el) {
        observer.observe(el);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var lang = detectLang();
        loadContent()
        .then(function (xmlDoc) {
            applyTranslations(xmlDoc, lang);
            initLangSwitcher(lang);
            initTimeline();
        })
        .catch(function (err) {
            console.error("Erreur de chargement de content.xml :", err);
        });
    });
    })();