/* ---------- Application Controller Logic (oklahomin) ---------- */
import {
    initThree,
    populateOrbitRing,
    triggerBootIntroAnimation,
    triggerInitiateSystemTransition,
    setTargetRotation,
    updateDragRotation,
    getTargetRotation,
    setSpotlightColor
} from './scene.js';

// Expose state globally for scene ticker loop
window.appStatePhase = 'boot';
window.currentFocusedKey = null;

const STATE = {
    phase: 'boot', // boot | home | projects_ring | socials_ring | panel
    lang: (function () {
        try {
            const saved = localStorage.getItem("oklh.lang");
            if (saved) return saved;
        } catch (e) {}
        // L1: autodetect on first visit — fall back to EN if not Russian locale.
        try {
            return (navigator.language || "en").toLowerCase().startsWith("ru") ? "ru" : "en";
        } catch (e) { return "en"; }
    })(),
    activeSection: null,    // about | projects | socials | contacts
    activeProject: null,    // P-01...
    hoverSection: null,
    focusedIndex: 0,
    device: "keyboard",
};

// State-driven color map
const COLOR_MAP = {
    about: 0xf0dbff,
    projects: 0xb76dff,
    socials: 0xddb7ff,
    contacts: 0xffd28a,
    home: 0xe4e1e6,
    null_glitch: 0xddb7ff,
    signal_stack: 0x2dd4bf,
    aurum: 0xFBBF24,
    kernel_os: 0x4ade80,
    telegram: 0x2dd4bf,
    github: 0xe4e1e6,
    x: 0xddb7ff,
    tiktok: 0xff2a7f,
    email: 0xffd28a
};

// RGB values for CSS ambient background glow transitions
const GLOW_RGB_MAP = {
    about: "240, 219, 255",
    projects: "183, 109, 255",
    socials: "221, 183, 255",
    contacts: "255, 210, 138",
    home: "228, 225, 230",
    null_glitch: "221, 183, 255",
    signal_stack: "45, 212, 191",
    aurum: "251, 191, 36",
    kernel_os: "74, 222, 128",
    telegram: "45, 212, 191",
    github: "228, 225, 230",
    x: "221, 183, 255",
    tiktok: "255, 42, 127",
    email: "255, 210, 138"
};

// Sections structure mapping for navigation
const HOME_KEYS = ['about', 'projects', 'socials', 'contacts'];
const PROJECT_KEYS = ['null_glitch', 'signal_stack', 'aurum', 'kernel_os', 'home'];
const SOCIALS_KEYS = ['telegram', 'github', 'x', 'tiktok', 'email', 'home'];

const I18N = {
    en: {
        role: "System Architect // Creative Technologist",
        initiate: "INITIATE SYSTEM",
        awaiting: "AWAITING_COMMAND",
        back: "BACK",
        sysPhase: "PHASE :: BOOT",
        sysNet: "NET.STATUS // SECURE",
        sysCh: "CHANNEL // 0xD4B7",
        sysHb: "HEARTBEAT //",
        sections: {
            about: "ABOUT",
            projects: "PROJECTS",
            socials: "SOCIALS",
            contacts: "CONTACTS",
            null_glitch: "NULL.GLITCH",
            signal_stack: "SIGNAL/STACK",
            aurum: "AURUM",
            kernel_os: "KERNEL.OS",
            telegram: "TELEGRAM",
            github: "GITHUB",
            x: "X // TWITTER",
            tiktok: "TIKTOK",
            email: "EMAIL // LINK",
            home: "BACK TO SYSTEM"
        },
        about: {
            sysLine: "RECORD // PROFILE.SYS",
            intro: "Nikita Oklahomain — backend developer and co-founder of Yarkit Labs. Builds fault-tolerant server logic, async Telegram bots, and autonomous AI systems.",
            sub: "At the intersection of clean code and artificial intelligence — focused on B2B process automation and intelligent business solutions.",
            cards: [
                { k: "ROLE",   v: "Backend Engineer · Architect" },
                { k: "FOCUS",  v: "Automation · Chatbots · AI Agents" },
                { k: "STATUS", v: "Available for projects" },
                { k: "BASE",   v: "Remote · UTC+3" },
            ],
            stackLabel: "STACK",
            stack: ["Go", "Python", "Aiogram 3.x", "FastAPI", "SQLite", "PostgreSQL", "Linux"],
        },
        projects: {
            sysLine: "ARCHIVE // PROJECTS.IDX",
            items: {
                null_glitch: { id: "P-01", title: "NULL.GLITCH", sub: "Interactive shader portfolio piece", year: "2025", status: "ACTIVE", statusKey: "live", role: "Lead", stack: ["WebGL","GLSL","React"], desc: "An atmospheric shader-driven scene exploring noise, glitch and luminous edges. Built as a self-contained interactive piece.", result: "15k+ views // Featured", link: "https://github.com/oklahomin" },
                signal_stack: { id: "P-02", title: "SIGNAL/STACK", sub: "Modular technical UI system", year: "2024", status: "ACTIVE", statusKey: "live", role: "Designer / Eng", stack: ["TypeScript","React","Tailwind"], desc: "A modular technical UI system inspired by analog hardware — sharp containers, luminous edges, monospaced data layers.", result: "Deployed in 5 apps", link: "https://github.com/oklahomin" },
                aurum: { id: "P-03", title: "AURUM", sub: "Generative typography experiments", year: "2024", status: "ARCHIVED", statusKey: "archived", role: "Solo", stack: ["Canvas","Motion"], desc: "A series of generative typography experiments. Type as a physical, animated material.", result: "Tokyo Code Fest Exhibit", link: "https://github.com/oklahomin" },
                kernel_os: { id: "P-04", title: "KERNEL.OS", sub: "Console / desktop simulation demo", year: "2023", status: "BETA", statusKey: "", role: "Lead", stack: ["Three.js","React","Zustand"], desc: "A console-style desktop simulation: spatial windows, in-scene panels, terminal-grade interactions.", result: "1.2k GitHub Stars", link: "https://github.com/oklahomin" },
            },
            metaKeys: { year: "YEAR", role: "ROLE", status: "STATUS", id: "ID", stack: "STACK", result: "RESULT" },
            backToList: "BACK TO PROJECTS",
            openLink: "OPEN DOSSIER",
        },
        contacts: {
            sysLine: "COMMS // OPEN CHANNEL",
            intro: "Direct link. Encrypted by default.",
            terminal: [
                { k: "USER",      v: "oklahomin" },
                { k: "TELEGRAM",  v: "@oklahomin",                href: "https://t.me/oklahomin" },
                { k: "MAIL",      v: "gog459503@gmail.com",       href: "mailto:gog459503@gmail.com" },
                { k: "AVAILABLE", v: "Selective collaborations · remote" },
            ],
            cta: "TRANSMIT MESSAGE",
            ctaHref: "mailto:gog459503@gmail.com",
        },
    },
    ru: {
        role: "Системный архитектор // Креативный технолог",
        initiate: "ИНИЦИИРОВАТЬ СИСТЕМУ",
        awaiting: "ОЖИДАНИЕ_КОМАНДЫ",
        back: "НАЗАД",
        sysPhase: "ФАЗА :: ЗАГРУЗКА",
        sysNet: "NET.СТАТУС // ЗАЩИЩЁН",
        sysCh: "КАНАЛ // 0xD4B7",
        sysHb: "ПУЛЬС //",
        sections: {
            about: "ОБО МНЕ",
            projects: "ПРОЕКТЫ",
            socials: "СОЦСЕТИ",
            contacts: "КОНТАКТЫ",
            null_glitch: "NULL.GLITCH",
            signal_stack: "SIGNAL/STACK",
            aurum: "AURUM",
            kernel_os: "KERNEL.OS",
            telegram: "TELEGRAM",
            github: "GITHUB",
            x: "X // TWITTER",
            tiktok: "TIKTOK",
            email: "EMAIL // LINK",
            home: "ВЕРНУТЬСЯ В СИСТЕМУ"
        },
        about: {
            sysLine: "ЗАПИСЬ // ПРОФИЛЬ.SYS",
            intro: "Никита Оклахомин — бэкенд-разработчик и сооснователь Yarkit Labs. Создает отказоустойчивую серверную логику, асинхронных Telegram-ботов и автономные ИИ-системы.",
            sub: "На стыке чистого кода и искусственного интеллекта — фокус на автоматизации B2B-процессов и умных решениях для бизнеса.",
            cards: [
                { k: "РОЛЬ",      v: "Бэкенд-инженер · Архитектор" },
                { k: "ФОКУС",     v: "Автоматизация · Чат-боты · ИИ-Агенты" },
                { k: "СТАТУС",    v: "Доступен для проектов" },
                { k: "БАЗА",      v: "Удаленно · UTC+3" },
            ],
            stackLabel: "СТЕК",
            stack: ["GO", "PYTHON", "AIOGRAM 3.X", "FASTAPI", "SQLITE", "POSTGRESQL", "LINUX"],
        },
        projects: {
            sysLine: "АРХИВ // ПРОЕКТЫ.IDX",
            items: {
                null_glitch: { id: "P-01", title: "NULL.GLITCH", sub: "Интерактивный шейдерный экспонат", year: "2025", status: "АКТИВНО", statusKey: "live", role: "Лид", stack: ["WebGL","GLSL","React"], desc: "Атмосферная шейдерная сцена: шум, глитч, светящиеся края. Самостоятельный интерактивный объект.", result: "15к+ просм. // В топе", link: "https://github.com/oklahomin" },
                signal_stack: { id: "P-02", title: "SIGNAL/STACK", sub: "Модульная техническая UI-система", year: "2024", status: "АКТИВНО", statusKey: "live", role: "Дизайн / Инж.", stack: ["TypeScript","React","Tailwind"], desc: "Модульный технический UI в духе аналогового железа: жёсткие контейнеры, светящиеся края, моноширинные слои данных.", result: "Внедрено в 5 систем", link: "https://github.com/oklahomin" },
                aurum: { id: "P-03", title: "AURUM", sub: "Эксперименты с генеративной типографикой", year: "2024", status: "АРХИВ", statusKey: "archived", role: "Соло", stack: ["Canvas","Motion"], desc: "Серия экспериментов с генеративной типографикой. Шрифт как физический анимированный материал.", result: "Выставка в Токио", link: "https://github.com/oklahomin" },
                kernel_os: { id: "P-04", title: "KERNEL.OS", sub: "Демо консольно-десктопной симуляции", year: "2023", status: "БЕТА", statusKey: "", role: "Лид", stack: ["Three.js","React","Zustand"], desc: "Десктоп-симуляция в стиле консоли: пространственные окна, in-scene панели, terminal-grade взаимодействия.", result: "1.2к звезд на Github", link: "https://github.com/oklahomin" },
            },
            metaKeys: { year: "ГОД", role: "РОЛЬ", status: "СТАТУС", id: "ID", stack: "СТЕК", result: "РЕЗУЛЬТАТ" },
            backToList: "К ПРОЕКТАМ",
            openLink: "ОТКРЫТЬ ДОСЬЕ",
        },
        contacts: {
            sysLine: "СВЯЗЬ // ОТКРЫТЫЙ КАНАЛ",
            intro: "Прямая связь. Шифрование по умолчанию.",
            terminal: [
                { k: "ПОЛЬЗ.",    v: "oklahomin" },
                { k: "TELEGRAM",  v: "@oklahomin",                href: "https://t.me/oklahomin" },
                { k: "ПОЧТА",     v: "gog459503@gmail.com",       href: "mailto:gog459503@gmail.com" },
                { k: "ДОСТУПЕН",  v: "Избирательные коллаборации · удалённо" },
            ],
            cta: "ОТПРАВИТЬ СООБЩЕНИЕ",
            ctaHref: "mailto:gog459503@gmail.com",
        },
    }
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function t() { return I18N[STATE.lang]; }

function getActiveKeys() {
    if (STATE.phase === 'home') return HOME_KEYS;
    if (STATE.phase === 'projects_ring') return PROJECT_KEYS;
    if (STATE.phase === 'socials_ring') return SOCIALS_KEYS;
    return [];
}

function getFocusedKey() {
    const keys = getActiveKeys();
    return keys[STATE.focusedIndex] || null;
}

function updateHUDPhaseLabel() {
    const dict = t();
    const phaseEl = $("[data-i18n='sysPhase']");
    if (!phaseEl) return;

    if (STATE.phase === 'boot') {
        phaseEl.textContent = dict.sysPhase;
    } else {
        const key = getFocusedKey();
        const activeLabel = key ? (dict.sections[key] || "") : "";
        phaseEl.textContent = `${STATE.lang === 'en' ? 'PHASE' : 'ФАЗА'} :: ${activeLabel}`;
    }
}

function rebuildHTMLRing() {
    const ring = $(".radial .radial-ring");
    if (!ring) return;
    
    // Clear existing buttons
    ring.innerHTML = "";
    
    const keys = getActiveKeys();
    const count = keys.length;
    
    keys.forEach((key, idx) => {
        const btn = document.createElement("button");
        btn.className = `node n-${idx}`;
        btn.setAttribute("data-section", key);
        
        // Human-readable aria-label
        const dict = t();
        const label = dict.sections[key] || key;
        btn.setAttribute("aria-label", label);
        
        // HTML hit-zones must align with where 3D models render on screen.
        // Three.js orbit places idx 0 at +Z (front of camera = screen bottom),
        // so flip 180° here — otherwise taps on the visible model hit the
        // wrong button / fall through to the canvas.
        const angle = (idx / count) * Math.PI * 2;
        const deg = 180 - angle * (180 / Math.PI);
        btn.style.setProperty('--node-deg', `${deg}deg`);
        
        // Wire pointer and focus handlers
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            selectNode(key);
        });
        btn.addEventListener("pointerenter", () => {
            handleNodeHover(key);
        });
        
        ring.appendChild(btn);
    });
}

function setPhase(phase) {
    STATE.phase = phase;
    window.appStatePhase = phase;
    document.documentElement.setAttribute("data-phase", phase);
    
    // Manage spotlight focus color & visibility
    if (phase === 'boot') {
        setTargetRotation(0);
        setSpotlightColor(0xddb7ff);
        document.documentElement.style.setProperty('--glow-rgb', "221, 183, 255");
    } else {
        const key = getFocusedKey();
        if (key) {
            setSpotlightColor(COLOR_MAP[key] || 0xb76dff);
            document.documentElement.style.setProperty('--glow-rgb', GLOW_RGB_MAP[key] || "132, 43, 210");
        }
    }
    
    rebuildHTMLRing();
    updateHUDPhaseLabel();
    renderTopContext();
}

function applyI18n() {
    document.documentElement.setAttribute("data-lang", STATE.lang);
    document.documentElement.setAttribute("lang", STATE.lang === "ru" ? "ru" : "en");
    const dict = t();
    $$("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key] !== undefined) {
            el.textContent = dict[key];
        } else {
            // L3: сразу видно если в HTML добавили data-i18n без записи в словаре.
            console.warn(`[i18n] missing key "${key}" for lang "${STATE.lang}"`);
        }
    });
    const langLabel = $("#langLabel");
    if (langLabel) langLabel.textContent = STATE.lang === "en" ? "EN" : "RU";
    renderTopContext();
    updateHUDPhaseLabel();
    rebuildHTMLRing();

    if (STATE.phase === 'panel' && STATE.activeSection) {
        renderPanel(STATE.activeSection, STATE.activeProject);
    }
    // C5: rebuildHTMLRing удалил старые кнопки — без этого фокус слетает на body.
    if (STATE.phase === 'home' || STATE.phase === 'projects_ring' || STATE.phase === 'socials_ring') {
        focusActiveNode();
    }
}

function toggleLang() {
    window.SFX.nav();
    STATE.lang = STATE.lang === "en" ? "ru" : "en";
    try { localStorage.setItem("oklh.lang", STATE.lang); } catch (e) {}
    applyI18n();
}

function toggleSound() {
    const isMuted = !window.SFX.isMuted();
    window.SFX.setMuted(isMuted);
    updateSoundLabel();
    if (!isMuted) {
        window.SFX.focus();
    }
}

function updateSoundLabel() {
    const label = $("#soundLabel");
    if (label) {
        label.textContent = window.SFX.isMuted() ? "OFF" : "ON";
    }
}

// Clock ticking down to milliseconds (e.g. 23:13:48:92) at 60fps
function startClock() {
    function clockTick() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0");

        const c = $("#clock");
        if (c) c.textContent = `${hh}:${mm}:${ss}:${ms}`;

        const hb = $("#hb");
        if (hb) hb.style.opacity = (now.getSeconds() % 2 === 0) ? "1" : "0.35";
    }
    clockTick();
    // P1: 20 Hz хватает для ms-индикации, не тратит rAF (60–120 Гц) на каждый кадр.
    setInterval(clockTick, 50);
}

// Triggers system initiation sequence
function bootEnter() {
    if (STATE.phase !== "boot") return;
    
    const flash = $("#bootFlash");
    flash.classList.add("active");
    window.SFX.boot();
    
    setTimeout(() => {
        triggerInitiateSystemTransition();
        setPhase("home");
        flash.classList.remove("active");
        STATE.focusedIndex = 0;
        focusActiveNode();
    }, 180);
}

// Node focusing mechanics
function focusActiveNode() {
    const keys = getActiveKeys();
    const key = keys[STATE.focusedIndex];
    window.currentFocusedKey = key;
    
    // Rotate 3D group and update spotlight color
    if (key) {
        let angle = 0;
        if (STATE.phase === 'home') {
            const indexMap = { about: 0, projects: 1, socials: 2, contacts: 3 };
            angle = -(indexMap[key] || 0) * (Math.PI / 2);
        } else {
            // 5 item sub-ring rotation index
            angle = -STATE.focusedIndex * (Math.PI * 2 / keys.length);
        }
        setTargetRotation(angle);
        setSpotlightColor(COLOR_MAP[key] || 0xb76dff);
        document.documentElement.style.setProperty('--glow-rgb', GLOW_RGB_MAP[key] || "132, 43, 210");
        
        // Sync transparent HTML ring buttons focus state
        const node = $(`.radial .node[data-section="${key}"]`);
        node?.focus();
    }
    
    renderTopContext();
    updateHUDPhaseLabel();
}

function selectNode(key) {
    if (!key) return;
    window.SFX.focus();
    // U4: лёгкий haptic на тач-устройствах (на десктопе vibrate отсутствует).
    if (STATE.device === "touch") {
        try { navigator.vibrate?.(8); } catch (e) {}
    }

    // Trigger visual flash
    const node = $(`.radial .node[data-section="${key}"]`);
    node?.classList.add("is-active-click");

    setTimeout(() => {
        node?.classList.remove("is-active-click");

        if (key === 'projects') {
            setPhase('projects_ring');
            populateOrbitRing('projects');
            STATE.focusedIndex = 0;
            focusActiveNode();
        } else if (key === 'socials') {
            setPhase('socials_ring');
            populateOrbitRing('socials');
            STATE.focusedIndex = 0;
            focusActiveNode();
        } else if (key === 'home') {
            // Return to Level 1 Home Ring
            setPhase('home');
            populateOrbitRing('home');
            STATE.focusedIndex = 0;
            focusActiveNode();
        } else if (key === 'about' || key === 'contacts') {
            STATE.activeSection = key;
            STATE.activeProject = null;
            renderPanel(key, null);
            setPhase("panel");
            window.SFX.open();
            setTimeout(() => $("#panel .h-close")?.focus(), 60);
        } else if (STATE.phase === 'projects_ring') {
            // Open projects detail panel
            STATE.activeSection = 'projects';
            STATE.activeProject = key;
            renderPanel('projects', key);
            setPhase("panel");
            window.SFX.open();
            setTimeout(() => $("#panel .h-close")?.focus(), 60);
        } else if (STATE.phase === 'socials_ring') {
            // Direct links for socials
            const urls = {
                telegram: "https://t.me/oklahomin",
                github: "https://github.com/oklahomin",
                x: "https://x.com/oklahomin",
                tiktok: "https://tiktok.com/@oklahomin",
                email: "mailto:gog459503@gmail.com"
            };
            const url = urls[key];
            if (url) {
                // C2: iOS Safari блокирует window.open для mailto: и оставляет
                // пустую about:blank вкладку. Через location.href почтовый
                // клиент открывается чисто.
                if (url.startsWith("mailto:")) {
                    location.href = url;
                } else {
                    window.open(url, '_blank', 'noopener');
                }
            }
        }
    }, 80); // U6: было 150 — слишком вязко на мобилке.
}

function renderTopContext() {
    const name = $("#ctxName");
    if (!name) return;
    const dict = t();
    const key = getFocusedKey();
    name.textContent = key ? (dict.sections[key] || "") : "";
}

function closePanel() {
    window.SFX.close();
    STATE.activeProject = null;
    
    // Return back to matching subring or home phase
    if (STATE.activeSection === 'projects') {
        setPhase('projects_ring');
    } else {
        setPhase('home');
    }
    STATE.activeSection = null;
    focusActiveNode();
}

function goBack() {
    if (STATE.phase === 'panel') {
        closePanel();
    } else if (STATE.phase === 'projects_ring' || STATE.phase === 'socials_ring') {
        window.SFX.close();
        setPhase('home');
        populateOrbitRing('home');
        STATE.focusedIndex = 0;
        focusActiveNode();
    }
}

/* ===== HTML Panel Overlay Builders ===== */

function escHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[ch]));
}

function renderPanel(section, projectId) {
    const dict = t();
    const icon = $("#panelIcon");
    const titleEl = $("#panelTitle");
    const metaEl = $("#panelMeta");
    const body = $("#panelBody");
    if (!body) return;

    const SECTION_ICONS = { about: "person", projects: "deployed_code", contacts: "alternate_email" };
    const SECTION_META = { about: "REC // 0x01", projects: "ARC // 0x02", contacts: "TX // 0x04" };

    icon.textContent = SECTION_ICONS[section] || "circle";
    titleEl.textContent = dict.sections[section] || "";
    metaEl.textContent = SECTION_META[section] || "";

    if (section === "about") {
        body.innerHTML = renderAbout();
    } else if (section === "projects") {
        body.innerHTML = renderProjectDetail(projectId);
    } else if (section === "contacts") {
        body.innerHTML = renderContacts();
    }

    body.scrollTop = 0;
}

function renderAbout() {
    const a = t().about;
    const cards = a.cards.map(c =>
        `<div class="about-card"><div class="label">${escHtml(c.k)}</div><div class="val">${escHtml(c.v)}</div></div>`
    ).join("");
    const chips = a.stack.map(s => `<span class="chip">${escHtml(s)}</span>`).join("");
    return `
        <div class="sys-line"><span class="dot"></span><span>${escHtml(a.sysLine)}</span><span class="line"></span></div>
        <div class="about-block">
            <p>${escHtml(a.intro)}</p>
            <p>${escHtml(a.sub)}</p>
        </div>
        <div class="about-grid">${cards}</div>
        <div class="about-block" style="margin-top:16px;">
            <div class="stack-label">${escHtml(a.stackLabel)}</div>
            <div class="chips">${chips}</div>
        </div>
    `;
}

function renderProjectDetail(projectId) {
    const p = t().projects;
    const it = p.items[projectId];
    if (!it) return `<div>NO RECORD</div>`;
    const mk = p.metaKeys;
    const chips = it.stack.map(s => `<span class="chip">${escHtml(s)}</span>`).join("");
    return `
        <div class="sys-line"><span class="dot"></span><span>${escHtml(p.sysLine)}</span><span class="line"></span></div>
        <div class="project-detail">
            <div class="pd-id">${escHtml(it.id)}</div>
            <div class="pd-title">${escHtml(it.title)}</div>
            <div class="pd-meta-grid">
                <div class="pd-meta-cell"><div class="k">${escHtml(mk.year)}</div><div class="v">${escHtml(it.year)}</div></div>
                <div class="pd-meta-cell"><div class="k">${escHtml(mk.role)}</div><div class="v">${escHtml(it.role)}</div></div>
                <div class="pd-meta-cell"><div class="k">${escHtml(mk.status)}</div><div class="v">${escHtml(it.status)}</div></div>
                <div class="pd-meta-cell"><div class="k">${escHtml(mk.result)}</div><div class="v">${escHtml(it.result)}</div></div>
            </div>
            <p class="pd-desc">${escHtml(it.desc)}</p>
            <div class="about-block" style="margin-top:14px;">
                <div class="stack-label">${escHtml(mk.stack)}</div>
                <div class="chips">${chips}</div>
            </div>
            ${it.link && it.link !== "#" ? `
                <a class="pd-cta" href="${escHtml(it.link)}" target="_blank" rel="noopener">
                    <span>${escHtml(p.openLink)}</span><span class="ms">north_east</span>
                </a>` : ""}
        </div>
    `;
}

function renderContacts() {
    const c = t().contacts;
    const lines = c.terminal.map(l => `
        <div class="line">
            <span class="prompt">&gt;</span>
            <span class="k">${escHtml(l.k)}</span>
            <span class="out">${l.href ? `<a href="${escHtml(l.href)}" target="_blank" rel="noopener">${escHtml(l.v)}</a>` : escHtml(l.v)}</span>
        </div>
    `).join("");
    return `
        <div class="sys-line"><span class="dot"></span><span>${escHtml(c.sysLine)}</span><span class="line"></span></div>
        <p style="margin:0 0 12px;">${escHtml(c.intro)}</p>
        <div class="term-block">${lines}</div>
        <a class="pd-cta" href="${escHtml(c.ctaHref)}">
            <span>${escHtml(c.cta)}</span><span class="ms">send</span>
        </a>
    `;
}

/* ===== Input Event Listeners ===== */

function handleKey(e) {
    if (STATE.phase === "boot") {
        // U8: Space или Enter запускает систему.
        if (e.code === "Space" || e.key === " " || e.key === "Enter") {
            e.preventDefault();
            bootEnter();
        }
        // C4: Escape на бут-фазе — некуда возвращаться, явный no-op.
        return;
    }
    if (e.key === "Escape") {
        goBack();
        return;
    }
    if (e.key && e.key.toLowerCase() === "l" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleLang();
        return;
    }
    if (e.key && e.key.toLowerCase() === "m" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleSound();
        return;
    }

    // Active ring navigation with Arrow keys
    if (STATE.phase === 'home' || STATE.phase === 'projects_ring' || STATE.phase === 'socials_ring') {
        const keys = getActiveKeys();
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            STATE.focusedIndex = (STATE.focusedIndex + 1) % keys.length;
            focusActiveNode();
            window.SFX.nav();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            STATE.focusedIndex = (STATE.focusedIndex - 1 + keys.length) % keys.length;
            focusActiveNode();
            window.SFX.nav();
        } else if (e.key === "Enter") {
            e.preventDefault();
            const focusedKey = getFocusedKey();
            selectNode(focusedKey);
        }
    }
}

function handleNodeHover(key) {
    const keys = getActiveKeys();
    const idx = keys.indexOf(key);
    if (idx !== -1 && idx !== STATE.focusedIndex) {
        STATE.focusedIndex = idx;
        focusActiveNode();
        window.SFX.nav();
    }
}

let touchStartX = 0;
let touchStartY = 0;
let isSwipeTracking = false;     // touch started in swipe zone — armed but not yet dragging
let isSwipeDragging = false;     // crossed threshold — actively dragging the ring
let initialDragRotation = 0;
const SWIPE_ACTIVATE_PX = 12;    // ignore sub-pixel finger drift while tapping

function handleTouchStart(e) {
    if (STATE.phase !== 'home' && STATE.phase !== 'projects_ring' && STATE.phase !== 'socials_ring') return;
    if (e.target.closest('button') || e.target.closest('a')) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    initialDragRotation = getTargetRotation();
    isSwipeTracking = true;
    isSwipeDragging = false;
}

function handleTouchMove(e) {
    if (!isSwipeTracking) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Don't claim the gesture until the user has clearly moved horizontally —
    // otherwise an intentional tap with normal finger jitter gets turned into a
    // swipe + snap + nav-sound combo, which feels like "ghost clicks".
    if (!isSwipeDragging) {
        if (absX < SWIPE_ACTIVATE_PX) return;
        if (absX <= absY) return;
        isSwipeDragging = true;
    }

    if (e.cancelable) e.preventDefault();
    const sensitivity = 1.6;
    const deltaAngle = (deltaX / window.innerWidth) * Math.PI * sensitivity;
    updateDragRotation(initialDragRotation + deltaAngle);
}

function handleTouchEnd(e) {
    if (!isSwipeTracking) return;
    const wasDragging = isSwipeDragging;
    isSwipeTracking = false;
    isSwipeDragging = false;

    // Pure tap (no real swipe) — leave focus + ring rotation untouched so the
    // user's button tap can fire without an extra "phantom" navigation.
    if (!wasDragging) return;

    const keys = getActiveKeys();
    const count = keys.length;
    if (count === 0) return;

    const finalRot = getTargetRotation();
    const step = (Math.PI * 2) / count;
    let rawIndex = Math.round(-finalRot / step);
    let snapIndex = ((rawIndex % count) + count) % count;

    STATE.focusedIndex = snapIndex;
    const snapAngle = -snapIndex * step;
    setTargetRotation(snapAngle);

    focusActiveNode();
    window.SFX.nav();
}

/* ===== App Initialization ===== */

function init() {
    detectDevice();
    applyI18n();
    updateSoundLabel();
    setPhase("boot");
    startClock();

    // Boot entry triggers
    $("#enterBtn").addEventListener("click", bootEnter);

    // Wire HUD controls
    $("#closeBtn").addEventListener("click", closePanel);
    $("#backBtn").addEventListener("click", goBack);
    $("#langBtn").addEventListener("click", toggleLang);
    $("#soundBtn").addEventListener("click", toggleSound);

    // U3: тап по бэкдропу панели закрывает её. Клики внутри .panel не дойдут
    // сюда — мы фильтруем по точному e.target.
    const panelStage = $("#panelStage");
    if (panelStage) {
        panelStage.addEventListener("click", (e) => {
            if (e.target === panelStage && STATE.phase === "panel") {
                closePanel();
            }
        });
    }

    // Keyboard inputs
    window.addEventListener("keydown", handleKey);

    // Touch swipe inputs for ring rotation
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Initialize Canvas
    initThree();
    
    // Animate Boot Emblem entrance
    triggerBootIntroAnimation();
}

function detectDevice() {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches
                 || ("ontouchstart" in window && !window.matchMedia("(hover: hover)").matches);
    STATE.device = isTouch ? "touch" : "keyboard";
    document.documentElement.setAttribute("data-device", STATE.device);
}

// Watch media device changes
const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
if (mq.addEventListener) mq.addEventListener("change", detectDevice);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
