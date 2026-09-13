// Renders the catalog from data/itens.json. Items arrive through community
// pull requests, so text is always set with textContent and only https links
// are turned into anchors.
(() => {
  const TIPOS = { skill: 'Skill', repositorio: 'Repositório' };
  const REPOSITORIO = /^[\w.-]+\/[\w.-]+$/;
  const SVG = 'http://www.w3.org/2000/svg';
  const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
  const completo = new Intl.NumberFormat('pt-BR');
  const estado = { tipo: '', categoria: '', busca: '' };
  let itens = [];
  let estrelas = {};

  const $ = (id) => document.getElementById(id);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  const linkSeguro = (url) => (typeof url === 'string' && /^https:\/\//.test(url) ? url : null);
  const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  async function lerJson(caminho) {
    const resposta = await fetch(caminho, { cache: 'no-cache' });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return resposta.json();
  }

  function lerUrl() {
    const p = new URLSearchParams(location.search);
    estado.tipo = TIPOS[p.get('tipo')] ? p.get('tipo') : '';
    estado.categoria = p.get('categoria') || '';
    estado.busca = p.get('q') || '';
  }

  function salvarUrl() {
    const p = new URLSearchParams();
    if (estado.tipo) p.set('tipo', estado.tipo);
    if (estado.categoria) p.set('categoria', estado.categoria);
    if (estado.busca) p.set('q', estado.busca);
    const qs = p.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
  }

  function iconeEstrela() {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('d', 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z');
    svg.append(path);
    return svg;
  }

  // Star counts come from data/estrelas.json, refreshed daily by a GitHub
  // Action, so visitors never hit the GitHub API rate limit.
  function seloEstrelas(item) {
    if (!REPOSITORIO.test(item.repositorio ?? '')) return null;
    const total = estrelas[item.repositorio.toLowerCase()];
    if (typeof total !== 'number') return null;
    const selo = el('a', 'estrelas');
    selo.href = `https://github.com/${item.repositorio}/stargazers`;
    selo.rel = 'noopener';
    selo.title = `${completo.format(total)} estrelas no GitHub (${item.repositorio})`;
    selo.setAttribute('aria-label', selo.title);
    selo.append(iconeEstrela(), compacto.format(total));
    return selo;
  }

  function blocoInstalar(item) {
    const comandos = item.instalar.join('\n');
    const bloco = el('div', 'instalar');
    const topo = el('div', 'instalar-topo');
    const codigo = el('pre', 'codigo');
    codigo.append(el('code', null, comandos));
    const copiar = el('button', 'copiar', 'Copiar');
    copiar.type = 'button';
    copiar.setAttribute('aria-label', `Copiar comandos de instalação de ${item.nome}`);
    copiar.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(comandos);
        copiar.textContent = 'Copiado';
      } catch {
        copiar.textContent = 'Erro';
      }
      setTimeout(() => { copiar.textContent = 'Copiar'; }, 1600);
    });
    topo.append(el('p', 'bloco-rotulo', 'Como instalar'), copiar);
    bloco.append(topo, codigo);
    return bloco;
  }

  function card(item) {
    const art = el('article', 'item');

    const topo = el('div', 'item-topo');
    topo.append(el('span', `tipo tipo--${item.tipo}`, TIPOS[item.tipo]), el('span', 'categoria', item.categoria));
    art.append(topo);

    const cabeca = el('div', 'item-cabeca');
    const nome = el('h3', 'item-nome');
    const href = linkSeguro(item.link);
    if (href) {
      const a = el('a', null, item.nome);
      a.href = href;
      a.rel = 'noopener';
      nome.append(a);
    } else {
      nome.textContent = item.nome;
    }
    cabeca.append(nome);
    const selo = seloEstrelas(item);
    if (selo) cabeca.append(selo);
    art.append(cabeca);

    const origem = [item.repositorio, item.licenca].filter(Boolean).join(' · ');
    if (origem) art.append(el('p', 'item-origem', origem));
    art.append(el('p', 'item-desc', item.descricao));

    const porque = el('div', 'porque');
    porque.append(el('p', 'bloco-rotulo', 'Por que recomendamos'), el('p', null, item.porque));
    art.append(porque);

    if (item.instalar?.length) art.append(blocoInstalar(item));
    if (item.agentes?.length) art.append(el('p', 'agentes', `Funciona com: ${item.agentes.join(', ')}`));
    if (item.tags?.length) {
      const tags = el('ul', 'tags');
      item.tags.forEach((t) => tags.append(el('li', null, `#${t}`)));
      art.append(tags);
    }
    return art;
  }

  function filtrar() {
    const termo = normalizar(estado.busca.trim());
    return itens.filter((i) =>
      (!estado.tipo || i.tipo === estado.tipo) &&
      (!estado.categoria || i.categoria === estado.categoria) &&
      (!termo || normalizar([i.nome, i.descricao, i.porque, i.repositorio || '', ...(i.tags || [])].join(' ')).includes(termo)));
  }

  function renderCategorias() {
    const categorias = [...new Set(itens.map((i) => i.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    $('filtro-categoria').replaceChildren(...['', ...categorias].map((c) => {
      const botao = el('button', null, c || 'Todas as categorias');
      botao.type = 'button';
      botao.dataset.categoria = c;
      return botao;
    }));
  }

  function render() {
    const lista = filtrar();
    $('grade').replaceChildren(...lista.map(card));
    $('vazio').hidden = lista.length > 0;
    $('contagem').textContent = `${lista.length} de ${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`;
    document.querySelectorAll('#filtro-tipo button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === estado.tipo)));
    document.querySelectorAll('#filtro-categoria button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.categoria === estado.categoria)));
    salvarUrl();
  }

  async function iniciar() {
    lerUrl();
    $('busca').value = estado.busca;
    const [dadosItens, dadosEstrelas] = await Promise.allSettled([lerJson('data/itens.json'), lerJson('data/estrelas.json')]);
    if (dadosItens.status !== 'fulfilled') {
      $('contagem').textContent = 'Não foi possível carregar o catálogo.';
      return;
    }
    itens = dadosItens.value.itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    // Stars are optional: without the file the cards simply show no badge.
    if (dadosEstrelas.status === 'fulfilled') {
      estrelas = dadosEstrelas.value.repositorios ?? {};
      const data = new Date(dadosEstrelas.value.atualizado);
      if (!Number.isNaN(data.getTime())) {
        $('nota-estrelas').textContent = `Estrelas do GitHub atualizadas em ${data.toLocaleDateString('pt-BR')}.`;
        $('nota-estrelas').hidden = false;
      }
    }

    renderCategorias();
    render();

    $('filtro-tipo').addEventListener('click', (e) => {
      const botao = e.target.closest('button');
      if (!botao) return;
      estado.tipo = botao.dataset.tipo;
      render();
    });
    $('filtro-categoria').addEventListener('click', (e) => {
      const botao = e.target.closest('button');
      if (!botao) return;
      estado.categoria = botao.dataset.categoria;
      render();
    });
    $('busca').addEventListener('input', (e) => {
      estado.busca = e.target.value;
      render();
    });
    $('limpar').addEventListener('click', () => {
      Object.assign(estado, { tipo: '', categoria: '', busca: '' });
      $('busca').value = '';
      render();
    });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
