# Xeque na Esteira

Jogo de xadrez para navegador. Peças aleatórias chegam por uma esteira, ondas de inimigos descem pelo tabuleiro e você precisa proteger o rei do xeque-mate.

O jogo foi feito para ensinar xadrez a adolescentes a partir de 12 anos: cada turno é um pequeno problema de defesa, os inimigos mostram com setas o que vão fazer e o jogo explica por que uma jogada não vale.

**Jogar:** https://gabrielajacottet.github.io/xeque-na-esteira/

## Destaques

- Regras de xadrez completas para cada peça (sem roque nem en passant), com xeque e xeque-mate.
- IA dos inimigos que avalia capturas, xeques, avanço e risco, em quatro níveis de dificuldade.
- Personagens em SVG desenhados no código, com expressões e animações.
- Efeitos, música procedural e falas das peças gerados pelo navegador (Web Audio e síntese de voz), sem arquivos de áudio.
- Ranking global com login pelo Google (Firebase). Dá para jogar sem conta; nesse caso a pontuação fica só no aparelho.

## Estrutura

| Arquivo | O que é |
|---|---|
| `index.html` | Página inicial: apresentação, login, níveis e ranking |
| `jogo.html` | O jogo |
| `js/pecas.js` | Desenho das peças (SVG), usado pelas duas páginas |
| `js/rede.js` | Login com Google e ranking no Firestore |
| `js/firebase-config.js` | Configuração do seu projeto Firebase |
| `firestore.rules` | Regras de segurança do ranking |
| `firestore.indexes.json` | Índice usado pela consulta do ranking |

Não há build nem dependências para instalar. O Firebase é carregado do CDN oficial só quando está configurado.

## Rodar no computador

O jogo abre direto com dois cliques em `jogo.html`. O login e o ranking global usam módulos JavaScript, que o navegador só carrega por um servidor. Para testar tudo, rode um servidor simples na pasta:

```sh
python -m http.server 8000
# ou: npx serve
```

Depois abra `http://localhost:8000`.

## Configurar o ranking (Firebase)

1. Em [console.firebase.google.com](https://console.firebase.google.com), crie um projeto (o plano gratuito Spark basta).
2. **Authentication** > Começar > Método de login > ative **Google**.
3. **Firestore Database** > Criar banco de dados (modo de produção).
4. Em **Firestore** > **Regras**, cole o conteúdo de `firestore.rules` e publique.
5. Em **Firestore** > **Índices**, crie um índice composto na coleção `scores`: `difficulty` crescente e `score` decrescente. Outra opção: abra o ranking uma vez, e o console do navegador mostra um link que cria o índice.
6. Em **Configurações do projeto** > **Seus apps**, adicione um app Web e copie o objeto de configuração para `js/firebase-config.js`.
7. Em **Authentication** > **Configurações** > **Domínios autorizados**, adicione `SEU-USUARIO.github.io`.

Com a CLI do Firebase, os passos 4 e 5 viram `firebase deploy --only firestore`.

As chaves de `firebase-config.js` são públicas por natureza e podem ficar no repositório. Quem protege os dados são as regras: só quem está logado grava, cada jogador só mexe no próprio recorde, o recorde só pode subir e a pontuação precisa ser coerente com o resultado da partida.

### Moderação

O ranking mostra só o apelido (3 a 16 caracteres, com filtro de palavrões). Nome e e-mail da conta Google não são gravados. Para remover um apelido, apague o documento em **Firestore** > `scores`.

## Publicar no GitHub Pages

1. Crie um repositório e envie estes arquivos.
2. **Settings** > **Pages** > Source: *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. Em alguns minutos o site aparece em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
