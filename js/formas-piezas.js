/* =========================================================
   FORMAS DE LAS PIEZAS
   ---------------------------------------------------------
   Cada pieza tiene 4 lados: [arriba, derecha, abajo, izquierda]
     1  = saliente hacia fuera
    -1  = hueco hacia dentro
     0  = lado recto (solo en el borde del puzzle)
   Todos los lados interiores tienen saliente o hueco.
   ========================================================= */

const FormasPiezas = (() => {

  // Curva del saliente clásico. u = a lo largo del lado, v = hacia fuera.
  // Medidas relativas al tamaño de la pieza.
  const SALIENTE = [
    [.42, .02, .44, .08, .40, .14],
    [.33, .24, .38, .32, .50, .32],
    [.62, .32, .67, .24, .60, .14],
    [.56, .08, .58, .02, .62, 0],
  ];

  // Decide al azar qué lados son salientes y cuáles huecos.
  // Devuelve una tabla [fila][columna] con los 4 lados de cada pieza.
  function crearLados(columnas, filas) {
    const azar = () => (Math.random() < .5 ? 1 : -1);
    const horizontales = [], verticales = [];
    for (let f = 0; f < filas; f++) {
      horizontales[f] = []; verticales[f] = [];
      for (let c = 0; c < columnas; c++) { horizontales[f][c] = azar(); verticales[f][c] = azar(); }
    }
    const lados = [];
    for (let f = 0; f < filas; f++) {
      lados[f] = [];
      for (let c = 0; c < columnas; c++) {
        lados[f][c] = [
          f === 0            ? 0 : -horizontales[f - 1][c],  // arriba
          c === columnas - 1 ? 0 :  verticales[f][c],        // derecha
          f === filas - 1    ? 0 :  horizontales[f][c],      // abajo
          c === 0            ? 0 : -verticales[f][c - 1],    // izquierda
        ];
      }
    }
    return lados;
  }

  function trazarLado(trazo, x0, y0, x1, y1, signo, tamano) {
    if (!signo) { trazo.lineTo(x1, y1); return; }
    const dx = x1 - x0, dy = y1 - y0, largo = Math.hypot(dx, dy);
    const ux = dx / largo, uy = dy / largo, nx = uy, ny = -ux;   // n = normal hacia fuera
    const punto = (u, v) => {
      const a = largo / 2 + (u - .5) * tamano, b = v * tamano * signo;
      return [x0 + ux * a + nx * b, y0 + uy * a + ny * b];
    };
    trazo.lineTo(...punto(.38, 0));
    for (const k of SALIENTE) trazo.bezierCurveTo(...punto(k[0], k[1]), ...punto(k[2], k[3]), ...punto(k[4], k[5]));
    trazo.lineTo(x1, y1);
  }

  // Devuelve la silueta (Path2D) de una pieza de ancho x alto, con origen en su esquina superior izquierda
  function trazarPieza(lados, ancho, alto) {
    const tamano = Math.min(ancho, alto), t = new Path2D();
    t.moveTo(0, 0);
    trazarLado(t, 0, 0, ancho, 0, lados[0], tamano);
    trazarLado(t, ancho, 0, ancho, alto, lados[1], tamano);
    trazarLado(t, ancho, alto, 0, alto, lados[2], tamano);
    trazarLado(t, 0, alto, 0, 0, lados[3], tamano);
    t.closePath();
    return t;
  }

  return { crearLados, trazarPieza };
})();
