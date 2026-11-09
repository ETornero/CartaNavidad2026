/* =========================================================
   IMÁGENES — carga las fotos de los deseos en formato 16:9
   Si una foto no existe, dibuja una tarjeta minimalista.
   ========================================================= */

const Imagenes = (() => {
  const ANCHO = 1920, ALTO = 1080;
  const cache = {};

  // Tonos de las tarjetas de reserva (se van alternando)
  const TONOS = [
    { fondo: '#ffffff', tinta: '#9a3a41' },
    { fondo: '#9a3a41', tinta: '#ffffff', texto: '#ffffff' },
    { fondo: '#faf3f3', tinta: '#853239' },
    { fondo: '#853239', tinta: '#ffffff', texto: '#ffffff' },
  ];

  function crearLienzo() {
    const lienzo = document.createElement('canvas');
    lienzo.width = ANCHO; lienzo.height = ALTO;
    return lienzo;
  }

  // Recorta la imagen al centro para que quede 16:9
  function recortar16x9(imagen) {
    const lienzo = crearLienzo(), ctx = lienzo.getContext('2d');
    const proporcion = imagen.width / imagen.height, objetivo = ANCHO / ALTO;
    let ancho = imagen.width, alto = imagen.height, x = 0, y = 0;
    if (proporcion > objetivo) { ancho = alto * objetivo; x = (imagen.width - ancho) / 2; }
    else { alto = ancho / objetivo; y = (imagen.height - alto) / 2; }
    ctx.imageSmoothingQuality = 'high';   // escalado de mejor calidad
    ctx.drawImage(imagen, x, y, ancho, alto, 0, 0, ANCHO, ALTO);
    return lienzo;
  }

  function escribirEnLineas(ctx, texto, x, y, anchoMax, altoLinea) {
    const palabras = texto.split(' ');
    let linea = '';
    for (const palabra of palabras) {
      const prueba = linea ? linea + ' ' + palabra : palabra;
      if (ctx.measureText(prueba).width > anchoMax && linea) {
        ctx.fillText(linea, x, y); linea = palabra; y += altoLinea;
      } else linea = prueba;
    }
    ctx.fillText(linea, x, y);
    return y;
  }

  // Tarjeta minimalista para un deseo sin foto
  function dibujarReserva(deseo, indice) {
    const lienzo = crearLienzo(), c = lienzo.getContext('2d');
    const tono = TONOS[indice % TONOS.length], azar = Utilidades.aleatorioConSemilla(indice + 11);

    c.fillStyle = tono.fondo; c.fillRect(0, 0, ANCHO, ALTO);

    // Textura de estrellitas y puntos (ayuda a orientarse en el puzzle)
    c.fillStyle = tono.tinta;
    for (let y = 40; y < ALTO; y += 70) {
      for (let x = 40 + ((y / 70) % 2) * 35; x < ANCHO; x += 70) {
        c.globalAlpha = .05 + azar() * .1;
        const r = 2 + azar() * 4;
        if (azar() < .15) dibujarEstrella(c, x, y, r * 2.4);
        else { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
      }
    }
    c.globalAlpha = 1;

    // Círculo y emoji
    c.fillStyle = tono.tinta; c.globalAlpha = .1;
    c.beginPath(); c.arc(1380, 540, 340, 0, Math.PI * 2); c.fill();
    c.globalAlpha = .25; c.lineWidth = 3; c.strokeStyle = tono.tinta;
    c.beginPath(); c.arc(1380, 540, 400, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '330px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    c.fillText(deseo.emoji || '🎁', 1380, 560);

    // Textos
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = tono.tinta;
    c.font = '500 34px Inter, sans-serif';
    c.fillText(`DESEO Nº ${indice + 1}`.split('').join(' '), 160, 380);
    c.fillStyle = tono.texto || '#5c0f1a';
    c.font = '700 150px Caveat, cursive';
    let y = escribirEnLineas(c, deseo.titulo, 150, 520, 820, 140);
    if (deseo.nota) {
      c.font = '400 40px Inter, sans-serif'; c.fillStyle = tono.texto || 'rgba(92,15,26,.75)';
      escribirEnLineas(c, deseo.nota, 160, y + 100, 760, 56);
    }

    // Marco fino
    c.strokeStyle = tono.tinta; c.globalAlpha = .35; c.lineWidth = 3;
    c.strokeRect(50, 50, ANCHO - 100, ALTO - 100);
    c.globalAlpha = 1;
    return lienzo;
  }

  function dibujarEstrella(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath(); c.fill();
  }

  // Devuelve (con promesa) un lienzo 16:9 listo para el puzzle
  function cargar(deseo, indice) {
    if (cache[indice]) return Promise.resolve(cache[indice]);
    return new Promise(resolver => {
      const terminar = lienzo => { cache[indice] = lienzo; resolver(lienzo); };
      if (!deseo.imagen) return terminar(dibujarReserva(deseo, indice));
      const imagen = new Image();
      imagen.onload = () => terminar(recortar16x9(imagen));
      imagen.onerror = () => terminar(dibujarReserva(deseo, indice));
      imagen.src = deseo.imagen;
    });
  }

  return { cargar };
})();
