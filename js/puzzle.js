/* =========================================================
   PUZZLE — el tablero, las piezas y cómo se arrastran
   ---------------------------------------------------------
   El tablero mide 16 x 9 "unidades" (formato 16:9). Las
   posiciones se guardan en esas unidades, así que al cambiar
   el tamaño de la ventana las piezas no se pierden.
   ========================================================= */

class Puzzle {
  constructor(lienzo, avisos = {}) {
    this.lienzo = lienzo;
    this.ctx = lienzo.getContext('2d');
    this.contenedor = lienzo.parentElement;
    this.avisos = Object.assign({ alEmpezar() {}, alEncajar() {}, alCambiar() {}, alCompletar() {} }, avisos);

    this.ANCHO = 16;
    this.ALTO = 9;
    this.margenSuperior = 72;
    this.RADIO = 12;                  // esquinas redondeadas de la imagen (en píxeles)         // espacio para los controles de arriba

    this.piezas = [];
    this.orden = [];                  // orden de dibujo (la última, encima)
    this.arrastre = null;
    this.completado = false;
    this.opacidadFinal = 0;
    this.confeti = [];
    this.pendienteDibujar = true;
    this.contextoPrueba = document.createElement('canvas').getContext('2d');

    this._escucharEventos();
    this._calcularMedidas();
    requestAnimationFrame(t => this._bucle(t));
  }

  /* ---------- acciones públicas ---------- */

  cargar(imagen, columnas, filas, yaResuelto = false) {
    this.imagen = imagen;
    this.columnas = columnas;
    this.filas = filas;
    this.anchoPieza = this.ANCHO / columnas;
    this.altoPieza = this.ALTO / filas;
    this.relleno = Math.min(this.anchoPieza, this.altoPieza) * .42;   // margen para salientes y sombra

    const lados = FormasPiezas.crearLados(columnas, filas);
    this.piezas = [];
    this.rejilla = [];
    let grupo = 0;
    for (let f = 0; f < filas; f++) {
      this.rejilla[f] = [];
      for (let c = 0; c < columnas; c++) {
        const pieza = { fila: f, columna: c, x: 0, y: 0, grupo: grupo++, fija: false, lados: lados[f][c] };
        this.rejilla[f][c] = pieza;
        this.piezas.push(pieza);
      }
    }

    this.completado = false;
    this.opacidadFinal = 0;
    this.confeti = [];
    this.arrastre = null;
    this._calcularMedidas();
    this.piezas.forEach(p => this._pintarPieza(p));

    if (yaResuelto) {
      this.piezas.forEach(p => { p.x = p.columna * this.anchoPieza; p.y = p.fila * this.altoPieza; p.fija = true; p.grupo = 0; });
      this.completado = true;
      this.opacidadFinal = 1;
    } else {
      this._repartirPiezas();
    }
    this.orden = Utilidades.barajar(this.piezas);
    this.pendienteDibujar = true;
    this._avisarCambio();
  }

  get colocadas() { return this.piezas.filter(p => p.fija).length; }
  get total() { return this.piezas.length; }


  redimensionar() {
    this._calcularMedidas();
    this.piezas.forEach(p => this._pintarPieza(p));
    this._mantenerDentro();
    this.pendienteDibujar = true;
  }

  /* ---------- medidas y colocación ---------- */

  _calcularMedidas() {
    const caja = this.contenedor.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.anchoPx = Math.max(1, caja.width);
    this.altoPx = Math.max(1, caja.height);
    this.lienzo.width = this.anchoPx * this.dpr;
    this.lienzo.height = this.altoPx * this.dpr;

    const arriba = this.margenSuperior;
    const anchoUtil = this.anchoPx - 32, altoUtil = this.altoPx - arriba - 16;
    const vertical = altoUtil > anchoUtil * 1.1;

    let escala = vertical
      ? Math.min(anchoUtil * .94 / this.ANCHO, altoUtil * .4 / this.ALTO)
      : Math.min(anchoUtil * .68 / this.ANCHO, altoUtil * .7 / this.ALTO);
    // Solo con piezas muy grandes (pocas piezas) encogemos el tablero para que quepan a los lados
    if (this.anchoPieza > 2.5 && !vertical) {
      const anchoNecesario = this.ANCHO + 2 * (this.anchoPieza + 2 * this.relleno) + .6;
      escala = Math.min(escala, Math.max(anchoUtil * .42 / this.ANCHO, anchoUtil / anchoNecesario));
    }

    this.escala = escala;
    this.origenX = (this.anchoPx - this.ANCHO * escala) / 2;
    this.origenY = arriba + (altoUtil - this.ALTO * escala) / 2;
    this.zonaVisible = {
      x0: (16 - this.origenX) / escala,
      y0: (arriba - this.origenY) / escala,
      x1: (this.anchoPx - 16 - this.origenX) / escala,
      y1: (this.altoPx - 16 - this.origenY) / escala,
    };
  }

  // Coloca las piezas sueltas alrededor del tablero, evitando taparlo
  _repartirPiezas() {
    const z = this.zonaVisible, aw = this.anchoPieza, ah = this.altoPieza, m = this.relleno * .6;
    const tablero = { x0: -this.relleno, y0: -this.relleno, x1: this.ANCHO + this.relleno, y1: this.ALTO + this.relleno };
    const colocadas = [];

    for (const pieza of Utilidades.barajar(this.piezas)) {
      let mejor = null, mejorPuntos = Infinity;
      for (let intento = 0; intento < 400 && mejorPuntos > 0; intento++) {
        const x = z.x0 + m + Math.random() * Math.max(0, z.x1 - z.x0 - aw - 2 * m);
        const y = z.y0 + m + Math.random() * Math.max(0, z.y1 - z.y0 - ah - 2 * m);
        const solapeX = Math.max(0, Math.min(x + aw, tablero.x1) - Math.max(x, tablero.x0));
        const solapeY = Math.max(0, Math.min(y + ah, tablero.y1) - Math.max(y, tablero.y0));
        let puntos = solapeX * solapeY / (aw * ah) * 100;          // tapar el tablero penaliza mucho
        for (const otra of colocadas)
          if (Math.abs(otra.x - x) < aw * .9 && Math.abs(otra.y - y) < ah * .9) puntos++;  // solapar piezas, poco
        if (puntos < mejorPuntos) { mejorPuntos = puntos; mejor = [x, y]; }
      }
      [pieza.x, pieza.y] = mejor;
      colocadas.push(pieza);
    }
  }

  // Si una pieza se ha quedado fuera de la pantalla, la mete dentro
  _mantenerDentro() {
    const z = this.zonaVisible, revisados = new Set();
    for (const p of this.piezas) {
      if (p.fija || revisados.has(p.grupo)) continue;
      revisados.add(p.grupo);
      const grupo = this._piezasDelGrupo(p.grupo);
      const x0 = Math.min(...grupo.map(q => q.x)), y0 = Math.min(...grupo.map(q => q.y));
      const x1 = Math.max(...grupo.map(q => q.x)) + this.anchoPieza, y1 = Math.max(...grupo.map(q => q.y)) + this.altoPieza;
      let dx = 0, dy = 0;
      if (x1 > z.x1) dx = z.x1 - x1; if (x0 + dx < z.x0) dx = z.x0 - x0;
      if (y1 > z.y1) dy = z.y1 - y1; if (y0 + dy < z.y0) dy = z.y0 - y0;
      this._moverGrupo(p.grupo, dx, dy);
    }
  }

  /* ---------- dibujo de cada pieza (se hace una vez y se reutiliza) ---------- */

  _pintarPieza(pieza) {
    const e = this.escala, ancho = this.anchoPieza * e, alto = this.altoPieza * e;
    const relleno = this.relleno * e, tamano = Math.min(ancho, alto);
    pieza.silueta = FormasPiezas.trazarPieza(pieza.lados, ancho, alto);

    const lienzo = pieza.lienzo || (pieza.lienzo = document.createElement('canvas'));
    lienzo.width = Math.ceil((ancho + 2 * relleno) * this.dpr);
    lienzo.height = Math.ceil((alto + 2 * relleno) * this.dpr);
    const c = lienzo.getContext('2d');
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.translate(relleno, relleno);

    // sombra suave (se dibuja la forma fuera del lienzo y solo se ve su sombra,
    // así no queda ningún borde alrededor de la pieza)
    const lejos = 10000;
    c.save();
    c.translate(-lejos, 0);
    c.shadowColor = Utilidades.colorCss('--sombra'); c.shadowBlur = tamano * .07 * this.dpr;
    c.shadowOffsetX = lejos * this.dpr; c.shadowOffsetY = tamano * .025 * this.dpr;
    c.fillStyle = '#000'; c.fill(pieza.silueta);
    c.restore();

    // trozo de imagen, sin bordes
    c.save();
    c.clip(pieza.silueta);
    // las esquinas de la imagen completa también van redondeadas
    this._rectanguloRedondeado(c, -pieza.columna * ancho, -pieza.fila * alto, this.ANCHO * e, this.ALTO * e, this.RADIO);
    c.clip();
    c.drawImage(this.imagen, -pieza.columna * ancho, -pieza.fila * alto, this.ANCHO * e, this.ALTO * e);
    c.restore();
  }

  /* ---------- dibujo general ---------- */

  _bucle() {
    const animando = this.confeti.length || (this.completado && this.opacidadFinal < 1);
    if (this.pendienteDibujar || animando) { this._dibujar(); this.pendienteDibujar = false; }
    requestAnimationFrame(t => this._bucle(t));
  }

  _dibujar() {
    const c = this.ctx, e = this.escala;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.anchoPx, this.altoPx);
    if (!this.imagen) return;

    const x = this.origenX, y = this.origenY, ancho = this.ANCHO * e, alto = this.ALTO * e;

    // al completar, la imagen crece hasta ocupar casi toda la mesa
    if (this.completado) { this._dibujarImagenFinal(x, y, ancho, alto); this._dibujarConfeti(); return; }

    // tablero
    c.fillStyle = Utilidades.colorCss('--rojo-oscuro');
    this._rectanguloRedondeado(c, x - 6, y - 6, ancho + 12, alto + 12, this.RADIO + 6); c.fill();
    c.strokeStyle = Utilidades.colorCss('--linea'); c.lineWidth = 1; c.stroke();

    c.beginPath();
    for (let i = 1; i < this.columnas; i++) { c.moveTo(x + i * this.anchoPieza * e, y); c.lineTo(x + i * this.anchoPieza * e, y + alto); }
    for (let i = 1; i < this.filas; i++) { c.moveTo(x, y + i * this.altoPieza * e); c.lineTo(x + ancho, y + i * this.altoPieza * e); }
    c.strokeStyle = 'rgba(255,255,255,.07)'; c.stroke();

    // piezas
    const relleno = this.relleno * e;
    for (const p of this.orden) {
      const levantada = this.arrastre && p.grupo === this.arrastre.grupo ? 3 : 0;
      c.drawImage(p.lienzo, x + p.x * e - relleno, y + p.y * e - relleno - levantada,
                  p.lienzo.width / this.dpr, p.lienzo.height / this.dpr);
    }

    this._dibujarConfeti();
  }

  _dibujarImagenFinal(x, y, ancho, alto) {
    const c = this.ctx;
    this.opacidadFinal = Math.min(1, this.opacidadFinal + .025);
    const t = 1 - Math.pow(1 - this.opacidadFinal, 3);            // suavizado
    // tamaño grande: lo máximo que cabe en la mesa en 16:9
    const arriba = this.margenSuperior, margen = 32;
    const anchoMax = this.anchoPx - margen * 2, altoMax = this.altoPx - arriba - margen;
    const anchoG = Math.min(anchoMax, altoMax * this.ANCHO / this.ALTO), altoG = anchoG * this.ALTO / this.ANCHO;
    const xG = (this.anchoPx - anchoG) / 2, yG = arriba + (altoMax - altoG) / 2;
    const mezcla = (a, b) => a + (b - a) * t;
    const fx = mezcla(x, xG), fy = mezcla(y, yG), fw = mezcla(ancho, anchoG), fh = mezcla(alto, altoG);

    c.save();
    c.shadowColor = Utilidades.colorCss('--sombra'); c.shadowBlur = 40; c.shadowOffsetY = 14;
    this._rectanguloRedondeado(c, fx, fy, fw, fh, this.RADIO);
    c.fillStyle = '#000'; c.fill();
    c.restore();
    c.save();
    this._rectanguloRedondeado(c, fx, fy, fw, fh, this.RADIO); c.clip();
    c.drawImage(this.imagen, fx, fy, fw, fh);
    c.restore();
  }

  _dibujarConfeti() {
    const c = this.ctx;
    for (const k of this.confeti) {
      k.vy += .12; k.x += k.vx; k.y += k.vy; k.vx *= .99; k.giro += k.velocidadGiro; k.vida -= .006;
      c.save(); c.globalAlpha = Math.max(0, k.vida); c.translate(k.x, k.y); c.rotate(k.giro);
      c.fillStyle = k.color; c.fillRect(-k.r, -k.r * .35, k.r * 2, k.r * .7); c.restore();
    }
    this.confeti = this.confeti.filter(k => k.vida > 0 && k.y < this.altoPx + 20);
  }

  _rectanguloRedondeado(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  _lanzarConfeti() {
    const colores = ['--blanco', '--rosa', '--blanco'].map(Utilidades.colorCss);
    const ancho = this.ANCHO * this.escala;
    for (let i = 0; i < 90; i++) {
      this.confeti.push({
        x: this.origenX + Math.random() * ancho, y: this.origenY - 10 - Math.random() * 60,
        vx: (Math.random() - .5) * 2, vy: Math.random() * 2,
        r: 3 + Math.random() * 4, giro: Math.random() * 6, velocidadGiro: (Math.random() - .5) * .2,
        color: colores[i % colores.length], vida: 1,
      });
    }
  }

  /* ---------- arrastrar y encajar ---------- */

  _piezasDelGrupo(grupo) { return this.piezas.filter(p => p.grupo === grupo); }

  _moverGrupo(grupo, dx, dy) {
    for (const p of this.piezas) if (p.grupo === grupo) { p.x += dx; p.y += dy; }
  }

  _piezaEn(px, py) {
    const e = this.escala, relleno = this.relleno * e;
    this.contextoPrueba.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = this.orden.length - 1; i >= 0; i--) {
      const p = this.orden[i];
      if (p.fija) continue;
      const lx = px - (this.origenX + p.x * e), ly = py - (this.origenY + p.y * e);
      if (lx < -relleno || ly < -relleno || lx > this.anchoPieza * e + relleno || ly > this.altoPieza * e + relleno) continue;
      if (this.contextoPrueba.isPointInPath(p.silueta, lx, ly)) return p;
    }
    return null;
  }

  _intentarEncajar(grupo) {
    const tolerancia = Math.min(this.anchoPieza, this.altoPieza) * .28;
    let encajada = false, seguir = true;

    // 1) con las piezas vecinas
    while (seguir) {
      seguir = false;
      busqueda:
      for (const p of this._piezasDelGrupo(grupo)) {
        for (const [df, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const vecina = this.rejilla[p.fila + df] && this.rejilla[p.fila + df][p.columna + dc];
          if (!vecina || vecina.grupo === grupo) continue;
          const dx = vecina.x - (p.x + dc * this.anchoPieza), dy = vecina.y - (p.y + df * this.altoPieza);
          if (Math.hypot(dx, dy) < tolerancia) {
            this._moverGrupo(grupo, dx, dy);
            const otroGrupo = vecina.grupo, fijar = vecina.fija || p.fija;
            this.piezas.forEach(q => { if (q.grupo === otroGrupo) q.grupo = grupo; });
            if (fijar) this.piezas.forEach(q => { if (q.grupo === grupo) q.fija = true; });
            encajada = seguir = true;
            break busqueda;
          }
        }
      }
    }

    // 2) con su sitio en el tablero
    const piezasGrupo = this._piezasDelGrupo(grupo), p = piezasGrupo[0];
    if (!p.fija) {
      const dx = p.columna * this.anchoPieza - p.x, dy = p.fila * this.altoPieza - p.y;
      if (Math.hypot(dx, dy) < tolerancia || piezasGrupo.length === this.piezas.length) {
        this._moverGrupo(grupo, dx, dy);
        piezasGrupo.forEach(q => q.fija = true);
        encajada = true;
      }
    }

    // capas: fijas abajo, el grupo recién soltado arriba
    const fijas = this.orden.filter(q => q.fija);
    const sueltas = this.orden.filter(q => !q.fija && q.grupo !== grupo);
    const mias = this.orden.filter(q => !q.fija && q.grupo === grupo);
    this.orden = fijas.concat(sueltas, mias);

    if (encajada) this.avisos.alEncajar();
    this._avisarCambio();

    if (!this.completado && this.piezas.every(q => q.fija)) {
      this.completado = true;
      this._lanzarConfeti();
      setTimeout(() => this.avisos.alCompletar(), 700);
    }
  }

  _avisarCambio() { this.avisos.alCambiar(this.colocadas, this.total, this.completado); }

  _escucharEventos() {
    const posicion = ev => {
      const caja = this.lienzo.getBoundingClientRect();
      return [Math.max(0, Math.min(this.anchoPx, ev.clientX - caja.left)),
              Math.max(0, Math.min(this.altoPx, ev.clientY - caja.top))];
    };

    this.lienzo.addEventListener('pointerdown', ev => {
      if (this.completado) return;
      const [px, py] = posicion(ev), pieza = this._piezaEn(px, py);
      if (!pieza) return;
      this.lienzo.setPointerCapture(ev.pointerId);
      this.avisos.alEmpezar();
      const grupo = pieza.grupo;
      this.orden = this.orden.filter(q => q.grupo !== grupo).concat(this.orden.filter(q => q.grupo === grupo));
      this.arrastre = { grupo, puntero: ev.pointerId, x: px, y: py };
      this.lienzo.style.cursor = 'grabbing';
      this.pendienteDibujar = true;
    });

    this.lienzo.addEventListener('pointermove', ev => {
      const [px, py] = posicion(ev);
      if (this.arrastre && ev.pointerId === this.arrastre.puntero) {
        this._moverGrupo(this.arrastre.grupo, (px - this.arrastre.x) / this.escala, (py - this.arrastre.y) / this.escala);
        this.arrastre.x = px; this.arrastre.y = py;
        this.pendienteDibujar = true;
      } else if (ev.pointerType === 'mouse') {
        this.lienzo.style.cursor = this._piezaEn(px, py) ? 'grab' : 'default';
      }
    });

    const soltar = ev => {
      if (!this.arrastre || ev.pointerId !== this.arrastre.puntero) return;
      const grupo = this.arrastre.grupo;
      this.arrastre = null;
      this.lienzo.style.cursor = 'default';
      this._mantenerDentro();
      this._intentarEncajar(grupo);
      this.pendienteDibujar = true;
    };
    this.lienzo.addEventListener('pointerup', soltar);
    this.lienzo.addEventListener('pointercancel', soltar);

    let espera;
    new ResizeObserver(() => {
      clearTimeout(espera);
      espera = setTimeout(() => this.redimensionar(), 60);
    }).observe(this.contenedor);
  }
}
