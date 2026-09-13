# Como contribuir

O DevSkillsHub é uma curadoria. Cada item precisa ter sido usado ou testado por
quem sugere e explicar, com base nessa experiência, por que vale a pena.

## Duas formas de sugerir

### 1. Pelo formulário (mais simples)

Abra uma [sugestão](https://github.com/hugobastoss/devskillshub/issues/new?template=sugerir-item.yml).
Se ela for aprovada, a curadoria adiciona o item ao catálogo.

### 2. Por pull request

1. Faça um fork do repositório.
2. Adicione o item ao final da lista em `data/itens.json`.
3. Rode `node scripts/validar-itens.mjs` para conferir o formato.
4. Abra o pull request. A mesma validação roda automaticamente nele.

## Campos de cada item

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | sim | Identificador único em kebab-case, ex.: `ui-ux-pro-max` |
| `nome` | sim | Nome exibido no card |
| `tipo` | sim | `skill` ou `repositorio` |
| `categoria` | sim | Ex.: Design, Documentos, Metodologia. Prefira uma categoria que já existe |
| `descricao` | sim | O que faz, em até 220 caracteres |
| `porque` | sim | Por que você recomenda, em até 320 caracteres |
| `link` | sim | URL `https` do repositório ou da página oficial |
| `repositorio` | não | `dono/repo` no GitHub |
| `instalar` | não | Lista de comandos, um por posição |
| `agentes` | não | Ferramentas compatíveis, ex.: Claude Code, Cursor |
| `licenca` | não | Ex.: MIT, Apache-2.0 |
| `tags` | não | Palavras-chave curtas |
| `adicionado` | sim | Data no formato AAAA-MM-DD |

Exemplo:

```json
{
  "id": "minha-skill",
  "nome": "Minha Skill",
  "tipo": "skill",
  "categoria": "Produtividade",
  "descricao": "O que a skill faz, em uma ou duas frases.",
  "porque": "Como você usa e o que ganhou com isso.",
  "link": "https://github.com/dono/minha-skill",
  "repositorio": "dono/minha-skill",
  "instalar": ["/plugin marketplace add dono/minha-skill", "/plugin install minha-skill@minha-skill"],
  "agentes": ["Claude Code"],
  "licenca": "MIT",
  "tags": ["exemplo"],
  "adicionado": "2026-09-13"
}
```

## O que a curadoria avalia

- **Uso real:** o campo `porque` conta uma experiência concreta, e não só repete a descrição.
- **Segurança:** o código está aberto para revisão e não faz nada além do que promete. Skills e plugins executam instruções e scripts no computador de quem instala.
- **Manutenção:** o repositório está ativo ou é estável o bastante para uso.
- **Licença:** está clara no repositório.
- **Sem duplicatas:** o item ainda não está no catálogo.
