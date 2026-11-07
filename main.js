document.addEventListener("DOMContentLoaded", function () {

  // --- Pila de tarjetas de "Sobre mi proyecto" ---
  (function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var outer = document.getElementById('stackOuter');
    var pin = outer ? outer.querySelector('.stack-pin') : null;
    var cards = Array.prototype.slice.call(document.querySelectorAll('#stackCards .stack-card'));
    if (!outer || !pin || !cards.length || reduceMotion) return;

    var n = cards.length;
    cards.forEach(function (card, i) {
      card.style.zIndex = n - i; // La primera tarjeta inicia arriba de todas
    });

    var ticking = false;

    function update() {
      ticking = false;
      var rect = outer.getBoundingClientRect();
      var total = outer.offsetHeight - pin.offsetHeight;
      var progress = total > 0 ? (-rect.top) / total : 0;
      progress = Math.max(0, Math.min(1, progress));

      for (var i = 0; i < n; i++) {
        var card = cards[i];
        var restY = i * 7;
        var restRot = (i % 2 === 0 ? -1 : 1) * (1 + i * 0.3);
        var restScale = 1 - i * 0.012;

        if (i === n - 1) {
          // La última tarjeta se queda quieta
          card.style.transform = 'translateY(' + restY + 'px) rotate(' + restRot + 'deg) scale(' + restScale + ')';
          card.style.opacity = 1;
          continue;
        }

        var segStart = i / (n - 1);
        var segEnd = (i + 1) / (n - 1);
        var local = (progress - segStart) / (segEnd - segStart);
        local = Math.max(0, Math.min(1, local));

        var y = restY - local * 160;
        var rot = restRot - local * 10;
        var scale = restScale * (1 - local * 0.06);
        card.style.transform = 'translateY(' + y + 'px) rotate(' + rot + 'deg) scale(' + scale + ')';
        card.style.opacity = 1 - local;
      }
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  // --- Carrusel de tipos de proyectos ---
  (function () {
    var pista = document.querySelector('.carrusel .grid');
    var prev = document.getElementById('carrusel-prev');
    var next = document.getElementById('carrusel-next');
    if (!pista || !prev || !next) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function paso() {
      var tarjeta = pista.querySelector('.card');
      return tarjeta ? tarjeta.getBoundingClientRect().width + 16 : pista.clientWidth;
    }
    var controles = prev.parentElement;
    function actualizar() {
      // Las flechas solo aparecen cuando hay tarjetas fuera de la vista
      controles.hidden = pista.scrollWidth <= pista.clientWidth + 2;
      prev.disabled = pista.scrollLeft <= 2;
      next.disabled = pista.scrollLeft >= pista.scrollWidth - pista.clientWidth - 2;
    }
    function mover(dir) {
      pista.scrollBy({ left: dir * paso(), behavior: reduce ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', function () { mover(-1); });
    next.addEventListener('click', function () { mover(1); });
    pista.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar);
    actualizar();
  })();

  // --- Donación ---
  var tarjeta = document.getElementById('tarjeta-donacion');
  if (!tarjeta) return;

  var inicial = tarjeta.innerHTML;
  var MONTO_MINIMO = 1000;

  function soloDigitos(texto) {
    return parseInt(String(texto).replace(/[^\d]/g, ''), 10);
  }

  function enfocarTitulo() {
    var titulo = tarjeta.querySelector('h3');
    if (titulo) titulo.focus();
  }

  function iniciar() {
    var tiers = tarjeta.querySelectorAll('.tier-btn');
    var input = document.getElementById('input-monto');
    var error = document.getElementById('error-monto');
    var donar = document.getElementById('btn-donar');

    function elegir(btn) {
      tiers.forEach(function (b) {
        var activo = b === btn;
        b.classList.toggle('active', activo);
        b.setAttribute('aria-pressed', activo ? 'true' : 'false');
      });
    }

    function limpiarError() {
      error.hidden = true;
      error.textContent = '';
      input.removeAttribute('aria-invalid');
    }

    tiers.forEach(function (b) {
      b.addEventListener('click', function () {
        elegir(b);
        input.value = '';
        limpiarError();
      });
    });

    input.addEventListener('input', function () {
      if (input.value.trim()) elegir(null);
      limpiarError();
    });

    donar.addEventListener('click', function () {
      var monto;
      var texto = input.value.trim();

      if (texto) {
        monto = soloDigitos(texto);
        if (!monto || monto < MONTO_MINIMO) {
          error.textContent = 'Escribe un monto de al menos $1.000, por ejemplo 30.000.';
          error.hidden = false;
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          return;
        }
      } else {
        var activo = tarjeta.querySelector('.tier-btn.active');
        monto = activo ? soloDigitos(activo.textContent) : 0;
        if (!monto) {
          error.textContent = 'Elige un monto o escribe otro.';
          error.hidden = false;
          return;
        }
      }

      mostrarQR(monto);
    });
  }

  function mostrarQR(monto) {
    var texto = '$' + monto.toLocaleString('es-CO');

    tarjeta.innerHTML =
      '<div class="don-center">' +
        '<h3 tabindex="-1">Escanea para donar</h3>' +
        '<p class="don-sub">Abre tu app de Nequi y transfiere <strong>' + texto + ' COP</strong>.</p>' +
        '<div class="don-qr"><img src="qr_nequi.jpeg" alt="Código QR de Nequi para donar"></div>' +
        '<div class="don-stack">' +
          '<button type="button" id="btn-ya-transferi" class="btn btn-primary">Ya transferí</button>' +
          '<button type="button" id="btn-volver" class="btn btn-ghost">Volver</button>' +
        '</div>' +
      '</div>';
    enfocarTitulo();

    document.getElementById('btn-volver').addEventListener('click', function () {
      tarjeta.innerHTML = inicial;
      iniciar();
      enfocarTitulo();
    });

    document.getElementById('btn-ya-transferi').addEventListener('click', function () {
      tarjeta.innerHTML =
        '<div class="don-center">' +
          '<span class="don-thanks" aria-hidden="true">💜</span>' +
          '<h3 tabindex="-1">¡Gracias por tu apoyo!</h3>' +
          '<p class="don-sub">Tu donación de <strong>' + texto + ' COP</strong> me ayuda a seguir con el Proyecto W.E.B.</p>' +
          '<a class="btn btn-ghost" href="index.html">Volver al inicio</a>' +
        '</div>';
      enfocarTitulo();
    });
  }

  iniciar();
});
