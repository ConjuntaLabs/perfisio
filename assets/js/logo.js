/* PERFISIO — entrada do logo com GSAP
   O símbolo entra primeiro (a onda sobe, o ponto cai no lugar) e a palavra
   "Perfisio" vem atrás, letra por letra, subindo por trás da borda do próprio
   SVG — o mesmo gesto da entrada dos títulos, que sobem palavra por palavra.

   Para animar as partes em separado o <img> é trocado por um SVG na página.
   Se o arquivo não chegar a tempo, o logo continua sendo a imagem de sempre e
   entra inteiro; se nem a GSAP chegar, o CSS da página revela o logo em 0,6s.

   Este arquivo também é o carregador da GSAP do site: quem mais precisar dela
   chama window.carregarGsap(['ScrollTrigger']) e nada é baixado duas vezes. */
(function () {
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/';
  const pedidos = {};
  const baixar = arquivo => pedidos[arquivo] || (pedidos[arquivo] = new Promise((ok, erro) => {
    const s = document.createElement('script');
    s.src = arquivo.startsWith('http') ? arquivo : CDN + arquivo;
    s.async = true; s.onload = ok; s.onerror = erro;
    document.head.appendChild(s);
  }));
  window.carregarGsap = (plugins = []) =>
    Promise.all([baixar('gsap.min.js'), ...plugins.map(p => baixar(p + '.min.js'))])
      .then(() => window.gsap);

  const logo = document.querySelector('.lp-header .logo');
  const img = logo && logo.querySelector('img');
  if (!img) return;

  const revelar = () => document.documentElement.classList.add('logo-ok');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { revelar(); return; }

  /* o mesmo arquivo que o <img> já está baixando, agora como texto: vem do
     cache do navegador, não é uma segunda viagem à rede */
  const pegarDesenho = () => fetch(img.currentSrc || img.src)
    .then(r => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
    .then(texto => {
      const svg = new DOMParser().parseFromString(texto, 'image/svg+xml').documentElement;
      if (svg.tagName.toLowerCase() !== 'svg') throw new Error('não é svg');
      const partes = [...svg.querySelectorAll('path')];
      if (partes.length < 4) throw new Error('desenho inesperado');
      /* sem width/height o SVG passa a seguir o CSS (26px, 19px no celular);
         a proporção vem do viewBox porque nem todo navegador a deduz sozinho
         quando a largura é auto */
      const caixa = (svg.getAttribute('viewBox') || '0 0 468 80').split(/[\s,]+/);
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.style.aspectRatio = `${caixa[2]} / ${caixa[3]}`;
      svg.setAttribute('class', 'marca');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', img.alt || 'PerFisio');
      /* o ponto e a onda são as duas primeiras formas; as letras vêm depois,
         e no arquivo estão da direita para a esquerda — ordenar pelo x para
         "Perfisio" se escrever na ordem de leitura */
      const ponto = partes[0];
      const onda = partes[1];
      const letras = partes.slice(2).sort((a, b) =>
        a.getAttribute('d').match(/[\d.]+/)[0] - b.getAttribute('d').match(/[\d.]+/)[0]);
      return { svg, ponto, onda, letras };
    });

  function animar(desenho) {
    if (!window.gsap) return revelar();
    /* a reserva do CSS revela em 0,6s; passado isso o logo já está na tela e
       esconder de novo para animar seria um susto, não uma entrada */
    if (performance.now() > 620) return revelar();

    // trocar a imagem pelo desenho e pôr o estado inicial no mesmo quadro,
    // sem deixar o navegador pintar nada pela metade
    revelar();
    const alvos = [];
    if (desenho) {
      img.replaceWith(desenho.svg);
      gsap.set([desenho.onda, ...desenho.letras], { y: 76, opacity: 0 });
      gsap.set(desenho.ponto, { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
      alvos.push(desenho.svg, desenho.onda, desenho.ponto, ...desenho.letras);
    } else {
      gsap.set(img, { yPercent: 112, y: 0, opacity: 0 });
      alvos.push(img);
    }

    const entrada = gsap.timeline({ delay: .05 });
    if (desenho) {
      entrada
        .to(desenho.onda, { y: 0, opacity: 1, duration: .62, ease: 'back.out(1.6)' })
        .to(desenho.ponto, { scale: 1, opacity: 1, duration: .42, ease: 'back.out(2.6)' }, '-=.34')
        .to(desenho.letras, { y: 0, opacity: 1, duration: .5, ease: 'power3.out', stagger: .035 }, '-=.3');
    } else {
      entrada.to(img, { yPercent: 0, y: 0, opacity: 1, duration: .7, ease: 'power3.out' });
    }

    /* Rede de segurança: a GSAP anda com o requestAnimationFrame, e o navegador
       congela o rAF também quando a janela está só encoberta — aí a aba continua
       "visível", a animação para no estado inicial e o logo some do cabeçalho.
       O setTimeout continua correndo nessas horas: se 1,6s depois a entrada não
       acabou, tiramos o que a GSAP escreveu e o logo fica onde deve ficar. */
    setTimeout(() => {
      if (entrada.progress() === 1) return;
      entrada.kill();
      gsap.set(alvos, { clearProps: 'all' });
    }, 1600);
  }

  /* Em aba de fundo o requestAnimationFrame congela e a GSAP ficaria parada no
     estado inicial — o logo sumiria até alguém olhar. Com a aba escondida
     deixamos a reserva do CSS trabalhar. */
  Promise.all([window.carregarGsap(), pegarDesenho().catch(() => null)]).then(([, desenho]) => {
    if (document.visibilityState === 'visible') return animar(desenho);
    document.addEventListener('visibilitychange', function volta() {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', volta);
      animar(desenho);
    });
  }).catch(revelar);
})();
