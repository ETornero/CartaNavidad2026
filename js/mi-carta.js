/* =========================================================
   MI CARTA — el único archivo que necesitas editar
   ---------------------------------------------------------
   · Cambia los textos de la carta a tu gusto.
   · Cada deseo es un puzzle. Pon tus fotos en la carpeta
     "imagenes" y escribe aquí su nombre de archivo.
   · Si una imagen no existe, se dibuja una tarjeta con el
     emoji y el título del deseo.
   · "enlace" (opcional) añade un icono de link junto al
     nombre del deseo cuando se descubre.
   · Las imágenes se recortan solas a 16:9 (centradas).
   · Los deseos completados se guardan en el navegador.
     Para borrar el progreso (por ejemplo, tras hacer
     pruebas), cambia el número de "version" de abajo.
   ========================================================= */

const MI_CARTA = {
  version: 4,
  fecha: 'Navidad 2026',
  destinatario: 'Querida Mamá Noel:',
  introduccion: 'Este año me he portado (casi siempre) bien. Aquí tienes algunas ideas de cosas que me gustaría; no hace falta que sean todas, elige las que tú quieras. Resuelve cada puzzle para descubrirlas.',

  // Piezas de cada puzzle: '4x3' (12) · '6x4' (24) · '8x5' (40) · '12x7' (84) · '16x9' (144)
  piezas: '8x5',

  deseos: [
    {
      titulo: 'Caja Fractal North',
      nota: 'La caja con el frontal de madera, para montar mi nuevo PC.',
      imagen: 'imagenes/FractalNorth.jpg',
      enlace: 'https://www.amazon.es/dp/B09V8HNWW9/?coliid=IW28GYBHAQCJN&colid=2BHKFDP6HDEKS&ref_=list_c_wl_lv_ov_lig_dp_it&th=1',
      emoji: '🖥️',
    },
    {
      titulo: 'Pijama',
      imagen: 'imagenes/Pijama.jpg',
      emoji: '🌙',
    },
    {
      titulo: 'Arctic P12 Pro',
      imagen: 'imagenes/ArcticP12Pro.jpg',
      enlace: 'https://www.amazon.es/dp/B0DJDC74BP/?coliid=I19VYOJXW9F0O1&colid=2BHKFDP6HDEKS&psc=1&ref_=list_c_wl_lv_ov_lig_dp_it',
      emoji: '🌀',
    },
    {
      titulo: 'Perfume',
      imagen: 'imagenes/Perfume.jpg',
      emoji: '🧴',
    },
    {
      titulo: 'Placa MSI B850',
      imagen: 'imagenes/MsiB850.jpg',
      enlace: 'https://www.amazon.es/dp/B096Y42JTK/?coliid=I11S3SA5WMDY93&colid=2BHKFDP6HDEKS&psc=1&ref_=list_c_wl_lv_ov_lig_dp_it',
      emoji: '🐉',
    },
    {
      titulo: 'Ryzen 7 9800X3D',
      imagen: 'imagenes/Ryzen9800X3D.jpg',
      enlace: 'https://www.amazon.es/dp/B0DKFMSMYK/?coliid=I1GHYY1V6QGYAZ&colid=2BHKFDP6HDEKS&psc=1&ref_=list_c_wl_lv_ov_lig_dp_it',
      emoji: '🧠',
    },
    {
      titulo: 'Tomo de Re:Zero',
      imagen: 'imagenes/ReZero.jpg',
      enlace: 'https://www.amazon.es/gp/product/B0GYSQVJLJ/ref=ewc_pr_img_3?smid=A1AT7YVPFBWXBL&psc=1',
      emoji: '📖',
    },
    {
      titulo: 'Liquid Freezer III',
      imagen: 'imagenes/LiquidFreezer3.jpg',
      enlace: 'https://www.amazon.es/dp/B0DPHRVNGL/?coliid=I2PKN0UUWGRSMI&colid=2BHKFDP6HDEKS&ref_=list_c_wl_lv_ov_lig_dp_it&th=1',
      emoji: '❄️',
    },
    {
      titulo: 'RAM Crucial DDR5',
      imagen: 'imagenes/CrucialDDR5.jpg',
      enlace: 'https://www.amazon.es/dp/B0CTHXMYL8/?coliid=I2MZHD06CPD16C&colid=2BHKFDP6HDEKS&ref_=list_c_wl_lv_ov_lig_dp_it&th=1',
      emoji: '💾',
    },
    {
      titulo: 'Tú (importante)',
      imagen: 'imagenes/Tu.jpg',
      final: true,      // no aparece hasta descubrir todos los demás
      mensaje: 'Quiero que tú seas mi verdadero regalo...',
      emoji: '🎁',
    },
  ],
};
