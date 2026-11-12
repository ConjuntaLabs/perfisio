/* PERFISIO — menu do celular nas páginas públicas
   No telefone os links do cabeçalho ficavam escondidos e não havia como chegar
   neles. Este arquivo põe o botão do menu e a folha que abre com os links.
   Leva o próprio CSS de propósito: assim as páginas que não carregam o
   site.css (home, planos, perfil, clínica, cidade) ganham o menu do mesmo
   jeito, e um CSS velho no cache não deixa o botão sem forma. */
(function () {
  const cabecalho = document.querySelector('.lp-header');
  const nav = cabecalho && cabecalho.querySelector('nav');
  if (!nav || cabecalho.querySelector('.lp-menu')) return;

  const CSS = `
    .lp-menu { display: none; align-items: center; justify-content: center; width: 42px; height: 42px;
      margin-left: auto; border: 1px solid var(--line, #E2E8E6); border-radius: 11px; background: #fff;
      color: var(--ink, #0F2A2E); cursor: pointer; padding: 0; flex: none; }
    .lp-menu:hover { border-color: var(--primary, #0DA189); color: var(--primary-dark, #0A8270); }
    .lp-menu svg { width: 22px; height: 22px; display: block; }
    .lp-menu .barra { stroke: currentColor; stroke-width: 2.1; stroke-linecap: round; fill: none;
      transition: transform .22s ease, opacity .18s ease; transform-origin: center; }
    .lp-header.menu-aberto .lp-menu .de-cima { transform: translateY(5.4px) rotate(45deg); }
    .lp-header.menu-aberto .lp-menu .do-meio { opacity: 0; }
    .lp-header.menu-aberto .lp-menu .de-baixo { transform: translateY(-5.4px) rotate(-45deg); }

    .lp-veu { position: fixed; inset: 0; background: rgba(15, 42, 46, .42); z-index: 48;
      opacity: 0; pointer-events: none; transition: opacity .2s ease; }
    .lp-veu.abre { opacity: 1; pointer-events: auto; }

    @media (max-width: 900px) {
      .lp-menu { display: flex; order: 2; margin-left: 0; }
      .lp-header { position: sticky; flex-wrap: wrap; }
      .lp-header .logo { order: 0; }
      /* fechado, a barra mostra só o que não pode sumir (o carrinho da loja) */
      .lp-header nav { order: 1; margin-left: auto; width: auto; display: flex;
        flex-direction: row; align-items: center; gap: 8px; padding: 0; }
      .lp-header nav > *:not([data-loja-cart]) { display: none; }
      /* aberto, a folha desce com tudo */
      .lp-header.menu-aberto nav { order: 3; width: 100%; margin-left: 0;
        flex-direction: column; align-items: stretch; gap: 0; padding: 6px 0 10px; }
      .lp-header.menu-aberto nav > * { display: block; }
      /* o site.css esconde os links no celular com .lp-header nav a:not(.btn);
         para a folha aberta mostrar de novo, a regra precisa ser mais específica */
      .lp-header.menu-aberto nav a:not(.btn) { display: block; font-size: .98rem; font-weight: 600;
        color: var(--ink, #0F2A2E); padding: 13px 2px; border-bottom: 1px solid var(--line, #E2E8E6); }
      .lp-header.menu-aberto nav a:not(.btn):last-of-type { border-bottom: none; }
      .lp-header.menu-aberto nav .btn { justify-content: center; padding: 12px; margin-top: 8px; width: 100%; }
      .lp-header.menu-aberto nav [data-loja-cart] { order: -1; }
      .lp-header.menu-aberto .lj-rotulo { display: inline; }
    }
  `;

  const folha = document.createElement('style');
  folha.textContent = CSS;
  document.head.appendChild(folha);

  /* o ícone é o menu de sempre com a linha do meio em movimento — a mesma
     ondulação do símbolo da marca, que é do que o PerFisio fala o tempo todo */
  const botao = document.createElement('button');
  botao.className = 'lp-menu';
  botao.type = 'button';
  botao.setAttribute('aria-label', 'Abrir o menu');
  botao.setAttribute('aria-expanded', 'false');
  botao.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path class="barra de-cima" d="M3.5 6.6h17"/>
      <path class="barra do-meio" d="M3.5 12q4.25-3.2 8.5 0t8.5 0"/>
      <path class="barra de-baixo" d="M3.5 17.4h17"/>
    </svg>`;
  cabecalho.appendChild(botao);

  const veu = document.createElement('div');
  veu.className = 'lp-veu';
  document.body.appendChild(veu);

  const aberto = () => cabecalho.classList.contains('menu-aberto');
  function alternar(abrir = !aberto()) {
    cabecalho.classList.toggle('menu-aberto', abrir);
    veu.classList.toggle('abre', abrir);
    botao.setAttribute('aria-expanded', String(abrir));
    botao.setAttribute('aria-label', abrir ? 'Fechar o menu' : 'Abrir o menu');
  }

  botao.addEventListener('click', () => alternar());
  veu.addEventListener('click', () => alternar(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && aberto()) alternar(false); });
  // clicou num link (inclusive âncora da mesma página): o menu sai da frente
  nav.addEventListener('click', e => { if (e.target.closest('a')) alternar(false); });
  // voltou para o tamanho de desktop com o menu aberto
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) alternar(false); });
})();
