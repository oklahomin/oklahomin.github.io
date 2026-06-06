/* ---------- Audio Synth & Ambience Engine (oklahomin) ---------- */
window.SFX = (() => {
    let ctx = null, master = null, sfxBus = null;
    let muted = false;
    try {
        muted = localStorage.getItem("oklh.mute") === "1";
    } catch (e) {}

    function ensureCtx() {
        try {
            if (ctx) {
                if (ctx.state === "suspended") {
                    ctx.resume().catch(e => console.warn("Failed to resume context:", e));
                }
                return;
            }
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn("Web Audio API not supported");
                return;
            }
            ctx = new AudioContextClass();
            
            master = ctx.createGain();
            master.gain.value = muted ? 0 : 0.5;
            master.connect(ctx.destination);

            sfxBus = ctx.createGain();
            sfxBus.gain.value = 1.6;
            sfxBus.connect(master);

            // iOS audio context unlock
            try {
                const b = ctx.createBuffer(1, 1, 22050);
                const s = ctx.createBufferSource();
                s.buffer = b;
                s.connect(ctx.destination);
                s.start(0);
            } catch (e) {}
        } catch (e) {
            console.warn("Error initializing AudioContext:", e);
            ctx = null;
        }
    }

    let padStarted = false;
    function startPad() {
        ensureCtx();
        if (!ctx || padStarted) return;
        padStarted = true;

        const padGain = ctx.createGain();
        padGain.gain.value = 0;
        padGain.connect(master);

        const trem = ctx.createGain();
        trem.gain.value = 1;
        trem.connect(padGain);

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.08;
        const lfoAmt = ctx.createGain();
        lfoAmt.gain.value = 0.15;
        lfo.connect(lfoAmt).connect(trem.gain);
        lfo.start();

        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 800;
        lp.Q.value = 0.5;
        lp.connect(trem);

        // 528 Hz (C5) healing drone chord structures
        [[264, "sine", 0.35, -4], [528, "sine", 0.25, 3], [528, "triangle", 0.10, -5], [792, "sine", 0.08, 6]]
        .forEach((v, i) => {
            const o = ctx.createOscillator();
            o.type = v[1];
            o.frequency.value = v[0];
            o.detune.value = v[3];
            const g = ctx.createGain();
            g.gain.value = v[2];
            o.connect(g).connect(lp);
            o.start();

            const d = ctx.createOscillator();
            d.frequency.value = 0.02 + i * 0.012;
            const da = ctx.createGain();
            da.gain.value = 6;
            d.connect(da).connect(o.detune);
            d.start();
        });

        const now = ctx.currentTime;
        padGain.gain.setValueAtTime(0, now);
        padGain.gain.linearRampToValueAtTime(0.04, now + 4);
    }

    function tone(freq, dur = 0.05, gain = 0.04, type = "sine") {
        if (!ctx || muted) return;
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        o.connect(g).connect(sfxBus);
        o.start();
        o.stop(ctx.currentTime + dur + 0.05);
    }

    function chord(freqs, dur = 0.5, gain = 0.03) {
        if (!ctx || muted) return;
        freqs.forEach(f => tone(f, dur, gain));
    }

    function swell(a, b, dur = 0.6, gain = 0.06) {
        if (!ctx || muted) return;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(a, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(b, ctx.currentTime + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.08);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
        o.connect(g).connect(sfxBus);
        o.start();
        o.stop(ctx.currentTime + dur + 0.05);
    }

    function setMuted(m) {
        muted = m;
        try {
            localStorage.setItem("oklh.mute", m ? "1" : "0");
        } catch (e) {}
        if (master) {
            const now = ctx.currentTime;
            master.gain.cancelScheduledValues(now);
            master.gain.setValueAtTime(master.gain.value, now);
            master.gain.linearRampToValueAtTime(m ? 0 : 0.5, now + 0.35);
        }
    }

    return {
        ensureCtx: ensureCtx,
        startPad: startPad,
        setMuted: setMuted,
        isMuted: () => muted,
        nav: () => tone(600 + Math.random() * 80, 0.05, 0.025),
        focus: () => tone(850, 0.06, 0.03),
        open: () => swell(220, 660, 0.45, 0.05),
        close: () => swell(660, 220, 0.45, 0.04),
        boot: () => {
            swell(110, 330, 1.5, 0.07);
            setTimeout(() => chord([440, 554, 659], 0.75, 0.035), 600);
        }
    };
})();

let userInteracted = false;
let ambientStarted = false;

function startAmbient() {
    if (ambientStarted) return;
    try {
        window.SFX.startPad();
        ambientStarted = true;
    } catch (e) {}
}

function noteInteraction() {
    window.SFX.ensureCtx();
    if (!ambientStarted) startAmbient();
    userInteracted = true;
}

["pointerdown", "pointerup", "click", "keydown", "touchstart", "touchend"].forEach(ev => {
    window.addEventListener(ev, noteInteraction, { once: false, passive: true, capture: true });
});
