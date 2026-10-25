# Xeque na Esteira

Jogo de xadrez para navegador: o jogador defende o rei contra ondas de peças inimigas usando peças aleatórias que chegam por uma esteira. Feito para ensinar xadrez a adolescentes a partir de 12 anos; vai para o portfólio do autor. Publicado no GitHub Pages, com ranking no Firebase.

## Arquivos
- `index.html` — página inicial (apresentação, login, níveis, ranking).
- `jogo.html` — o jogo inteiro (HTML + CSS + JS, sem build).
- `js/pecas.js` — desenho das peças (SVG), usado pelas duas páginas.
- `js/rede.js` — login Google + ranking no Firestore; expõe `NET` (o jogo usa `window.NET`).
- `js/firebase-config.js` — config do projeto Firebase (vazia = só recordes locais).
- `firestore.rules`, `firestore.indexes.json`, `firebase.json` — regras e índice do ranking.
- `README.md` — passo a passo de Firebase e GitHub Pages.

## Para economizar tokens
- `jogo.html` tem ~68 KB. **Não leia o arquivo inteiro.** Use Grep pelo nome da seção ou função abaixo e leia só o trecho.
- Edite com Edit (trechos pequenos), nunca reescreva o arquivo.
- Não explique o que vai fazer; ao terminar, liste só o que mudou.

## Mapa do código de `jogo.html` (procure por estes nomes)
| Assunto | Onde procurar |
|---|---|
| Tokens de cor, fontes, layout | `:root{` no `<style>` |
| Animações e efeitos (CSS) | `/* juice */` |
| Desenho das peças (SVG) | `js/pecas.js` (`const PAL=`, `function pieceSVG`) |
| Ondas inimigas | `const WAVES=` |
| Níveis de dificuldade | `const DIFF=` (fácil, normal, difícil, mestre) |
| Ranking, login e pontuação | `const RK=`, `function syncAcct`, `function scoreBlock`, `function wireScore`, `function finalScore`, `function nickError`; `<script type="module">` no fim |
| Sons (Web Audio) | `const SFX=`, `function tone`, `function noise` |
| Música procedural | `/* ---------- música procedural` |
| Animação de movimento / jogada inválida | `function animMove`, `function invalidAt` |
| Vozes e zoação dos inimigos | `const VOX=`, `function taunt`, `function say` |
| Comemorações do jogador | `const ALLY=`, `function cheer` |
| Regras de movimento | `function moves`, `function legalMoves`, `function legalPlacements` |
| IA dos inimigos | `function bestMove`, `function makePlan` |
| Fluxo do turno | `function startTurn`, `function endPlayer`, `async function enemyTurn` |
| Ondas e vitória | `function spawn`, `function checkWave` |
| Cliques | `function clickCell`, `function clickSlot` |
| Renderização | `function render` (tabuleiro, esteira, painel, telas de menu/fim) |

## Regras do jogo (resumo)
- Tabuleiro 8×8; linha 0 = entrada dos inimigos, linhas 5–7 = onde o jogador coloca peças da esteira.
- Um turno = uma ação: colocar peça da esteira OU mover peça própria (movimentos de xadrez, sem roque nem en passant).
- Esteira com até 5 peças (4 no Mestre); quando lota, a mais antiga cai.
- Derrota só por xeque-mate. Inimigos nunca capturam o rei.
- Bloqueio total (`function checkBlock`): as 8 casas da linha 0 ocupadas por peças do jogador = vitória imediata, +1000 de bônus (`BLOCK_BONUS`), campo `block` no ranking.
- Próxima onda começa quando sobram ≤2 inimigos; a última precisa ser zerada.
- Pontuação: capturas×10 + 100/onda + 800 vitória + 1000 bloqueio total + bônus de rapidez, × multiplicador do nível.

## Estado e decisões
- Estado global em `S` (tabuleiro, esteira, onda, turno, fase: `menu`/`player`/`enemy`/`over`/`won`).
- Preferências no `localStorage` com prefixo `xne-` (som, música, nível, recordes, apelido), sempre em try/catch.
- Sons, música e vozes são gerados no navegador (Web Audio + speechSynthesis); não há arquivos de áudio.
- A rainha usa voz feminina; o cavalo só relincha (sem fala). As falas não pausam o jogo.
- Ranking: login só com Google; jogar sem conta é permitido, mas não envia pontuação. Documento `scores/{uid}_{nivel}` guarda só a melhor pontuação; as regras exigem que o recorde só suba e que a pontuação seja plausível.
- Apelidos do ranking: 3–16 caracteres, filtro de palavrões; nunca pedir, gravar ou exibir nome real ou e-mail da conta.
- Os módulos (`js/rede.js`) só carregam via http; por `file://` o jogo funciona com recordes locais.
