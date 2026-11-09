/* =========================================================
   UTILIDADES — pequeñas funciones que usa el resto
   ========================================================= */

const Utilidades = (() => {

  // Números aleatorios repetibles (misma semilla = mismo dibujo)
  function aleatorioConSemilla(semilla) {
    return () => {
      semilla |= 0; semilla = semilla + 0x6D2B79F5 | 0;
      let t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // 83000 ms -> "01:23"
  function formatearTiempo(ms) {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function barajar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  // Lee un color definido en css/estilos.css (por ejemplo "--rojo")
  function colorCss(nombre) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  }

  // Espera a que carguen las fuentes (máximo 1,5 s)
  function esperarFuentes() {
    const fuentes = document.fonts
      ? Promise.all([document.fonts.load('700 100px Caveat'), document.fonts.load('500 30px Inter')])
      : Promise.resolve();
    return Promise.race([fuentes, new Promise(r => setTimeout(r, 1500))]).catch(() => {});
  }

  /* ---------- sonidos suaves ---------- */
  let audio = null;
  function nota(frecuencia, duracion = .08, volumen = .06, tipo = 'sine', retraso = 0) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator(), vol = audio.createGain(), t = audio.currentTime + retraso;
      osc.type = tipo; osc.frequency.value = frecuencia;
      vol.gain.setValueAtTime(volumen, t);
      vol.gain.exponentialRampToValueAtTime(.0001, t + duracion);
      osc.connect(vol).connect(audio.destination);
      osc.start(t); osc.stop(t + duracion + .02);
    } catch (e) { /* sin sonido, no pasa nada */ }
  }
  const sonidoEncaje = () => { nota(880, .06, .05, 'triangle'); nota(1320, .08, .03, 'sine', .03); };
  const sonidoCompletado = () => [523, 659, 784, 1047].forEach((f, i) => nota(f, .3, .05, 'sine', i * .12));

  /* ---------- guardar progreso en el navegador ---------- */
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
  }
  function leer(clave, porDefecto) {
    try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : porDefecto; } catch (e) { return porDefecto; }
  }

  return { aleatorioConSemilla, formatearTiempo, barajar, colorCss, esperarFuentes,
           sonidoEncaje, sonidoCompletado, guardar, leer };
})();
