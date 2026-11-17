/* PERFISIO — entrada e movimento do título do hero
   A ideia é fisioterapia: as palavras chegam tortas, cada uma inclinada para
   um lado, e vão se alinhando uma a uma até a frase ficar reta — é o ajuste de
   postura. Depois de alinhada, uma onda atravessa "fisioterapeuta certo" de
   tempos em tempos, levantando letra por letra e acendendo a cor no caminho:
   o mesmo movimento da onda da marca, que é do que o site fala o tempo todo.

   A página inteira funciona sem isto: o CSS revela o título em 0,5s se a GSAP
   não chegar, e com prefers-reduced-motion nada se mexe. */
(function () {
  const h1 = document.querySelector('.hero h1.anima');
  if (!h1) return;

  const revelar = () => document.documentElement.classList.add('titulo-ok');
  const parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (parado || typeof window.carregarGsap !== 'function') { revelar(); return; }

  const VERDE = '#0A8270';   // cor de repouso do destaque (--primary-dark)
  const ACESO = '#0DA189';   // o verde da marca, que acende quando a onda passa

  /* cada palavra vira <span class="pal">, preservando o <em> e o <br> */
  function emPalavras(raiz) {
    const palavras = [];
    const visitar = no => [...no.childNodes].forEach(filho => {
      if (filho.nodeType === 3) {
        const frag = document.createDocumentFragment();
        filho.textContent.split(/(\s+)/).forEach(pedaco => {
          if (!pedaco) return;
          if (!pedaco.trim()) return frag.appendChild(document.createTextNode(pedaco));
          const span = document.createElement('span');
          span.className = 'pal';
          span.textContent = pedaco;
          frag.appendChild(span);
          palavras.push(span);
        });
        filho.replaceWith(frag);
      } else if (filho.nodeType === 1 && filho.tagName !== 'BR') visitar(filho);
    });
    visitar(raiz);
    return palavras;
  }

  /* dentro do destaque a onda precisa de letras, não de palavras */
  function emLetras(palavra) {
    const letras = [];
    const texto = palavra.textContent;
    palavra.textContent = '';
    [...texto].forEach(caractere => {
      const span = document.createElement('span');
      span.className = 'let';
      span.textContent = caractere;
      palavra.appendChild(span);
      letras.push(span);
    });
    return letras;
  }

  function animar() {
    if (!window.gsap) return revelar();
    // o CSS revela em 0,7s; passado isso o título já está na tela e escondê-lo
    // de novo para animar seria um susto, não uma entrada
    if (performance.now() > 700) return revelar();

    const palavras = emPalavras(h1);
    if (!palavras.length) return revelar();
    const destaque = [];
    palavras.forEach(p => { if (p.closest('em')) destaque.push(...emLetras(p)); });

    /* as peças da onda, na ordem da leitura: as palavras comuns inteiras e,
       no destaque, letra por letra */
    const pecas = [];
    palavras.forEach(p => (p.closest('em') ? pecas.push(...p.querySelectorAll('.let')) : pecas.push(p)));

    revelar();
    const torto = i => (i % 2 ? 1 : -1) * (3.4 + (i % 3));
    gsap.set(palavras, { transformOrigin: '50% 100%' });
    gsap.set(destaque, { color: '#20484A' });   // o destaque chega apagado e acende na primeira onda

    const entrada = gsap.timeline({ delay: .06 });
    entrada.from(palavras, {
      y: 34, rotation: torto, opacity: 0,
      duration: .82, ease: 'back.out(1.5)', stagger: .075,
    });

    // a primeira onda emenda na chegada: a frase alinha e já se move
    const onda = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 4.2 });
    onda.to(pecas, {
      keyframes: [
        { y: -9, duration: .32, ease: 'sine.out' },
        { y: 0, duration: .44, ease: 'sine.in' },
      ],
      stagger: .042,
    }, 0)
      .to(destaque, {
        keyframes: [
          { color: ACESO, duration: .3, ease: 'sine.out' },
          { color: VERDE, duration: .5, ease: 'sine.in' },
        ],
        stagger: .042,
      }, 0);

    entrada.add(() => onda.play(), '-=.25');

    /* a onda é eterna: fora da tela ela só gasta bateria */
    if (window.IntersectionObserver) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? onda.play() : onda.pause()), { threshold: 0 })
        .observe(h1);
    }

    /* Rede de segurança: a GSAP anda com o requestAnimationFrame, e o navegador
       congela o rAF quando a janela está encoberta — a aba continua "visível",
       a entrada para no estado inicial e o título some. O setTimeout continua
       correndo nessas horas. */
    setTimeout(() => {
      if (entrada.progress() === 1) return;
      entrada.kill();
      gsap.set(palavras, { clearProps: 'all' });
      gsap.set(destaque, { clearProps: 'all' });
    }, 1800);
  }

  window.carregarGsap().then(() => {
    if (document.visibilityState === 'visible') return animar();
    document.addEventListener('visibilitychange', function volta() {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', volta);
      animar();
    });
  }).catch(revelar);
})();
