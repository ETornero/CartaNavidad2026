/* =========================================================
   APP — une la carta (columna izquierda) con el puzzle
   ========================================================= */

(() => {
  const CLAVE_PROGRESO = 'carta-navidad-resueltos-v' + (MI_CARTA.version || 1);
  const $ = id => document.getElementById(id);

  const deseos = MI_CARTA.deseos;
  let actual = 0;
  let resueltos = new Set(Utilidades.leer(CLAVE_PROGRESO, []).filter(i => i < deseos.length));
  let inicio = 0, fin = 0, enMarcha = false;

  const puzzle = new Puzzle($('lienzo-puzzle'), {
    alEmpezar() { if (!enMarcha && !fin) { enMarcha = true; inicio = Date.now(); } },
    alEncajar: Utilidades.sonidoEncaje,
    alCambiar: actualizarEstado,
    alCompletar: deseoCompletado,
  });

  /* ---------- textos de la carta ---------- */
  $('carta-fecha').textContent = MI_CARTA.fecha;
  $('carta-destinatario').textContent = MI_CARTA.destinatario;
  $('carta-introduccion').textContent = MI_CARTA.introduccion;

  /* ---------- icono de enlace ---------- */
  const ICONO_ENLACE = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

  function crearEnlace(url) {
    const enlace = document.createElement('a');
    enlace.className = 'icono-enlace';
    enlace.href = url; enlace.target = '_blank'; enlace.rel = 'noopener';
    enlace.title = 'Abrir enlace';
    enlace.innerHTML = ICONO_ENLACE;
    enlace.addEventListener('click', ev => ev.stopPropagation());   // no abre el puzzle
    return enlace;
  }

  /* ---------- deseo final (sorpresa) ----------
     Un deseo con "final: true" no aparece en la lista hasta
     que se han descubierto todos los demás. */
  function finalDesbloqueado() {
    return deseos.every((d, i) => d.final || resueltos.has(i));
  }
  function disponible(i) { return !deseos[i].final || finalDesbloqueado(); }
  function totalVisibles() { return deseos.filter((_, i) => disponible(i)).length; }

  /* ---------- lista de deseos ---------- */
  function pintarLista() {
    const lista = $('lista-deseos');
    lista.innerHTML = '';
    deseos.forEach((deseo, i) => {
      if (!disponible(i)) return;
      const resuelto = resueltos.has(i);
      const elemento = document.createElement('li');
      elemento.className = 'deseo' + (resuelto ? ' deseo--resuelto' : ' deseo--pendiente')
        + (i === actual ? ' deseo--actual' : '') + (deseo.final ? ' deseo--final' : '');
      elemento.innerHTML = `
        <span class="deseo__numero">${i + 1}</span>
        <span class="deseo__texto"></span>`;
      const texto = elemento.querySelector('.deseo__texto');
      texto.textContent = resuelto ? deseo.titulo : '· · · · · ·';
      if (resuelto && deseo.enlace) texto.after(crearEnlace(deseo.enlace));
      elemento.addEventListener('click', () => abrirDeseo(i));
      lista.appendChild(elemento);
    });
    $('carta').classList.toggle('carta--completa', resueltos.size === deseos.length);
  }

  /* ---------- abrir un deseo (un puzzle) ---------- */
  async function abrirDeseo(indice) {
    actual = indice;
    ocultarRevelacion();
    pintarLista();
    $('titulo-deseo').textContent = deseos[indice].final ? 'El último deseo' : `Deseo ${indice + 1} de ${totalVisibles()}`;
    const imagen = await Imagenes.cargar(deseos[indice], indice);
    if (indice !== actual) return;                     // se pulsó otro mientras cargaba
    const [columnas, filas] = MI_CARTA.piezas.split('x').map(Number);
    const yaResuelto = resueltos.has(indice);
    enMarcha = false; inicio = 0; fin = 0;
    puzzle.cargar(imagen, columnas, filas, yaResuelto);
    if (yaResuelto) mostrarRevelacion(false);
  }

  function siguientePendiente() {
    for (let paso = 1; paso <= deseos.length; paso++) {
      const i = (actual + paso) % deseos.length;
      if (!resueltos.has(i) && disponible(i)) return i;
    }
    return -1;
  }

  /* ---------- al terminar un puzzle (se guarda en el navegador) ---------- */
  function deseoCompletado() {
    enMarcha = false; fin = Date.now();
    resueltos.add(actual);
    Utilidades.guardar(CLAVE_PROGRESO, [...resueltos]);
    Utilidades.sonidoCompletado();
    pintarLista();
    actualizarEstado(puzzle.colocadas, puzzle.total, true);
    mostrarRevelacion(true);
  }

  function mostrarRevelacion(reciente) {
    const deseo = deseos[actual], siguiente = siguientePendiente(), cartaCompleta = siguiente === -1;
    const etiqueta = deseo.final ? 'El último deseo' : `Deseo ${actual + 1}`;
    $('revelacion-etiqueta').textContent = reciente && !deseo.final
      ? `${etiqueta} descubierto · ${Utilidades.formatearTiempo(fin - inicio)}`
      : etiqueta;
    $('revelacion-titulo').textContent = deseo.titulo;
    if (deseo.enlace) $('revelacion-titulo').appendChild(crearEnlace(deseo.enlace));
    $('revelacion-mensaje').textContent = deseo.mensaje || '';
    $('boton-siguiente').textContent = cartaCompleta ? 'Carta completa ✓'
      : deseos[siguiente].final ? 'Queda una sorpresa más →' : 'Siguiente deseo →';
    $('boton-siguiente').disabled = cartaCompleta;
    $('revelacion').classList.add('revelacion--visible');
  }

  function ocultarRevelacion() { $('revelacion').classList.remove('revelacion--visible'); }

  /* ---------- estado: tiempo y piezas ---------- */
  function actualizarEstado(colocadas = puzzle.colocadas, total = puzzle.total, completado = puzzle.completado) {
    if (completado && !inicio) { $('estado').textContent = 'Completado'; return; }
    const tiempo = enMarcha ? Date.now() - inicio : (fin ? fin - inicio : 0);
    $('estado').textContent = `${Utilidades.formatearTiempo(tiempo)} · ${colocadas}/${total}`;
  }
  setInterval(() => { if (enMarcha) actualizarEstado(); }, 500);

  /* ---------- botones ---------- */
  $('boton-ver').addEventListener('click', ocultarRevelacion);
  $('boton-siguiente').addEventListener('click', () => { const i = siguientePendiente(); if (i >= 0) abrirDeseo(i); });

  // pantalla fija: sin zoom ni scroll
  addEventListener('wheel', ev => ev.preventDefault(), { passive: false });
  addEventListener('contextmenu', ev => ev.preventDefault());

  /* ---------- empezar ---------- */
  Utilidades.esperarFuentes().then(() => {
    const primero = deseos.findIndex((_, i) => !resueltos.has(i) && disponible(i));
    abrirDeseo(primero === -1 ? 0 : primero);
  });
})();
