// Validates data/itens.json. Runs in CI on every pull request that touches the
// catalog, and locally with: node scripts/validar-itens.mjs
import { readFileSync } from 'node:fs';

const TIPOS = ['skill', 'repositorio'];
const CAMPOS = new Set(['id', 'nome', 'tipo', 'categoria', 'descricao', 'porque', 'link', 'repositorio', 'instalar', 'agentes', 'licenca', 'tags', 'adicionado']);

let dados;
try {
  dados = JSON.parse(readFileSync(new URL('../data/itens.json', import.meta.url), 'utf8'));
} catch (e) {
  console.error(`data/itens.json não é um JSON válido: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(dados.itens)) {
  console.error('data/itens.json precisa ter a lista "itens".');
  process.exit(1);
}

const texto = (v) => typeof v === 'string' && v.trim().length > 0;
const listaDeTextos = (v) => Array.isArray(v) && v.length > 0 && v.every(texto);
const erros = [];
const ids = new Set();

dados.itens.forEach((item, i) => {
  const onde = `itens[${i}]${texto(item.id) ? ` (${item.id})` : ''}`;
  const erro = (msg) => erros.push(`${onde}: ${msg}`);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.id ?? '')) erro('"id" deve estar em kebab-case, ex.: "minha-skill"');
  else if (ids.has(item.id)) erro('"id" repetido');
  else ids.add(item.id);

  for (const campo of ['nome', 'categoria', 'descricao', 'porque']) {
    if (!texto(item[campo])) erro(`"${campo}" é obrigatório`);
  }
  if (!TIPOS.includes(item.tipo)) erro(`"tipo" deve ser ${TIPOS.join(' ou ')}`);
  if (!/^https:\/\/\S+$/.test(item.link ?? '')) erro('"link" deve ser uma URL https');
  if (item.repositorio != null && !/^[\w.-]+\/[\w.-]+$/.test(item.repositorio)) erro('"repositorio" deve ter o formato dono/repo');
  for (const campo of ['instalar', 'agentes', 'tags']) {
    if (item[campo] != null && !listaDeTextos(item[campo])) erro(`"${campo}" deve ser uma lista de textos`);
  }
  if (item.licenca != null && !texto(item.licenca)) erro('"licenca" deve ser um texto');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.adicionado ?? '')) erro('"adicionado" deve ser uma data AAAA-MM-DD');
  if (texto(item.descricao) && item.descricao.length > 220) erro('"descricao" deve ter no máximo 220 caracteres');
  if (texto(item.porque) && item.porque.length > 320) erro('"porque" deve ter no máximo 320 caracteres');
  Object.keys(item).filter((k) => !CAMPOS.has(k)).forEach((k) => erro(`campo desconhecido "${k}"`));
});

if (erros.length) {
  console.error(`Encontrei ${erros.length} problema(s) em data/itens.json:\n- ${erros.join('\n- ')}`);
  process.exit(1);
}
console.log(`OK: ${dados.itens.length} itens válidos.`);
