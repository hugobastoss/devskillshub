// Renders the catalog from data/itens.json. Items arrive through community
// pull requests, so text is always set with textContent and only https links
// are turned into anchors.
(() => {
  const TIPOS = { skill: 'Skill', repositorio: 'Repositório' };
  const estado = { tipo: '', categoria: '', busca: '' };
  let itens = [];

  const $ = (id) => document.getElementById(id);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  const linkSeguro = (url) => (typeof url === 'string' && /^https:\/\//.test(url) ? url : null);
  const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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
    art.append(nome);

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
    try {
      const resposta = await fetch('data/itens.json', { cache: 'no-cache' });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      itens = (await resposta.json()).itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } catch {
      $('contagem').textContent = 'Não foi possível carregar o catálogo.';
      return;
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
