/* PERFISIO — entrada do logo com GSAP
   O logo sobe atrás da própria máscara, do mesmo jeito que os títulos entram
   palavra por palavra. O CSS da página já deixa o logo escondido com uma
   animação de reserva: se a GSAP não chegar a tempo (ou nem chegar), o logo
   aparece sozinho em 0,6s e ninguém fica olhando um cabeçalho vazio.

   Este arquivo também é o carregador da GSAP do site: quem mais precisar dela
   chama window.carregarGsap(['ScrollTrigger']) e nada é baixado duas vezes. */
(function () {
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/';
  const pedidos = {};
  const baixar = arquivo => pedidos[arquivo] || (pedidos[arquivo] = new Promise((ok, erro) => {
    const s = document.createElement('script');
    s.src = CDN + arquivo; s.async = true; s.onload = ok; s.onerror = erro;
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

  function animar() {
    if (!window.gsap) return revelar();
    /* a reserva do CSS revela em 0,6s; passado isso o logo já está na tela e
       esconder de novo para animar seria um susto, não uma entrada */
    if (performance.now() > 620) return revelar();
    // marcar e pôr o estado inicial no mesmo quadro: sem piscada entre os dois
    revelar();
    gsap.set(img, { yPercent: 112, y: 0, opacity: 0 });
    gsap.to(img, { yPercent: 0, y: 0, opacity: 1, duration: .7, ease: 'power3.out', delay: .05 });
  }

  /* Em aba de fundo o requestAnimationFrame congela e a GSAP ficaria parada no
     estado inicial — o logo sumiria até alguém olhar. Com a aba escondida
     deixamos a reserva do CSS trabalhar. */
  window.carregarGsap().then(() => {
    if (document.visibilityState === 'visible') return animar();
    document.addEventListener('visibilitychange', function volta() {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', volta);
      animar();
    });
  }).catch(revelar);
})();
