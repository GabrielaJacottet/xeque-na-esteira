/* Regras do Xeque na Esteira para os dois lados: brancas embaixo, pretas em cima.
   Funções puras: recebem o tabuleiro (b[linha][coluna] = {t, side} ou null) e não mexem em estado global.
   Por enquanto só o PvP usa este arquivo; o jogo solo ainda tem a própria cópia em jogo.html. */
const RG=(()=>{
  const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
  const inB=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
  const opp=s=>s==='w'?'b':'w';
  const clone=b=>b.map(row=>row.map(x=>x?{...x}:null));
  const empty=()=>Array.from({length:8},()=>Array(8).fill(null));
  /* Área de colocação: as 3 fileiras do próprio lado. */
  const zone=side=>side==='w'?[5,6,7]:[0,1,2];

  function moves(b,r,c,atk){
    const p=b[r][c],out=[],o=opp(p.side);
    if(p.t==='p'){
      const d=p.side==='w'?-1:1;
      if(!atk&&inB(r+d,c)&&!b[r+d][c])out.push([r+d,c]);
      for(const dc of[-1,1]){const rr=r+d,cc=c+dc;if(!inB(rr,cc))continue;const q=b[rr][cc];if(atk||(q&&q.side===o))out.push([rr,cc])}
      return out;
    }
    const ray=(dr,dc,slide)=>{let rr=r+dr,cc=c+dc;while(inB(rr,cc)){const q=b[rr][cc];if(!q)out.push([rr,cc]);else{if(atk||q.side===o)out.push([rr,cc]);break}if(!slide)break;rr+=dr;cc+=dc}};
    const D=[[1,1],[1,-1],[-1,1],[-1,-1]],O=[[1,0],[-1,0],[0,1],[0,-1]];
    if(p.t==='n')[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([a,c2])=>ray(a,c2,false));
    if(p.t==='k')[...D,...O].forEach(([a,c2])=>ray(a,c2,false));
    if(p.t==='b'||p.t==='q')D.forEach(([a,c2])=>ray(a,c2,true));
    if(p.t==='r'||p.t==='q')O.forEach(([a,c2])=>ray(a,c2,true));
    return out;
  }
  function each(b,side,fn){for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(p&&p.side===side)fn(p,r,c)}}
  function kingPos(b,side){let k=null;each(b,side,(p,r,c)=>{if(p.t==='k')k=[r,c]});return k}
  function attacked(b,by,r,c){let hit=false;each(b,by,(p,pr,pc)=>{if(!hit&&moves(b,pr,pc,true).some(([a,d])=>a===r&&d===c))hit=true});return hit}
  function inCheck(b,side){const k=kingPos(b,side);return k?attacked(b,opp(side),k[0],k[1]):false}
  /* Move a peça e devolve a capturada. Peão que chega ao fim vira rainha. */
  function apply(b,fr,fc,tr,tc){const p=b[fr][fc],cap=b[tr][tc];b[tr][tc]=p;b[fr][fc]=null;if(p.t==='p'&&((p.side==='w'&&tr===0)||(p.side==='b'&&tr===7)))p.t='q';return cap}

  function legalMoves(b,r,c){
    const side=b[r][c].side;
    return moves(b,r,c,false).filter(([tr,tc])=>{const t=b[tr][tc];if(t&&t.t==='k')return false;const x=clone(b);apply(x,r,c,tr,tc);return!inCheck(x,side)});
  }
  function legalPlacements(b,t,side){
    const out=[];for(const r of zone(side))for(let c=0;c<8;c++){if(b[r][c])continue;const x=clone(b);x[r][c]={t,side};if(!inCheck(x,side))out.push([r,c])}return out;
  }
  /* Por que a peça não pode ir para certas casas: devolve [{to:[r,c], by:[[r,c],...]}] só das casas proibidas.
     by = peças inimigas que atacariam o rei depois do lance (casa atacada, peça cravada ou xeque que continua). */
  function whyNot(b,r,c){
    const side=b[r][c].side,o=opp(side),out=[];
    for(const[tr,tc]of moves(b,r,c,false)){
      const t=b[tr][tc];if(t&&t.t==='k')continue;
      const x=clone(b);apply(x,r,c,tr,tc);const k=kingPos(x,side);if(!k)continue;
      const by=[];each(x,o,(p,pr,pc)=>{if(moves(x,pr,pc,true).some(([a,d])=>a===k[0]&&d===k[1]))by.push([pr,pc])});
      if(by.length)out.push({to:[tr,tc],by});
    }
    return out;
  }
  function hasAnyLegal(b,belt,side){
    let ok=false;each(b,side,(p,r,c)=>{if(!ok&&legalMoves(b,r,c).length)ok=true});
    return ok||[...new Set(belt)].some(t=>legalPlacements(b,t,side).length);
  }
  /* Soma do valor das peças no tabuleiro (o rei não conta). Desempata no limite de turnos. */
  function material(b,side){let s=0;each(b,side,p=>{s+=VAL[p.t]});return s}

  /* Sorteio com semente: a peça número i depende só da semente e de i (i-ésimo valor do mulberry32),
     então os dois aparelhos veem a mesma esteira sem precisar trocar o sorteio. */
  function rand(seed,i){
    let t=(seed+Math.imul(i+1,0x6D2B79F5))>>>0;
    t=Math.imul(t^t>>>15,t|1);
    t^=t+Math.imul(t^t>>>7,t|61);
    return((t^t>>>14)>>>0)/4294967296;
  }
  function pieceAt(seed,i,weights){
    const tot=weights.reduce((a,[,w])=>a+w,0);let x=rand(seed,i)*tot;
    for(const[t,w]of weights){if((x-=w)<0)return t}
    return'p';
  }

  /* ---------- explicações para quem está aprendendo ----------
     Frases que dizem por que uma peça não pode ir para uma casa. Usadas pelo solo e pelo PvP. */
  const NOME={p:'peão',n:'cavalo',b:'bispo',r:'torre',q:'rainha',k:'rei'},ART={p:'o',n:'o',b:'o',r:'a',q:'a',k:'o'};
  const sq=(r,c)=>'abcdefgh'[c]+(8-r);
  const up=s=>s[0].toUpperCase()+s.slice(1);
  const fem=t=>ART[t]==='a';
  const named=(b,[r,c])=>{const q=b[r][c];return `${ART[q.t]} ${NOME[q.t]} em ${sq(r,c)}`};
  const list=(a,conj='e')=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+` ${conj} `+a.at(-1);
  /* Agrupa as casas proibidas pela peça inimiga que cobre mais delas, para a frase ficar curta. */
  function cover(why){
    const left=new Set(why.map(w=>w.to+'')),out=[];
    while(left.size){
      const by=new Map();
      for(const w of why)if(left.has(w.to+''))for(const a of w.by){const k=a+'';if(!by.has(k))by.set(k,{a,ts:[]});by.get(k).ts.push(sq(...w.to))}
      const best=[...by.values()].sort((x,y)=>y.ts.length-x.ts.length)[0];
      out.push(best);for(const w of why)if(best.ts.includes(sq(...w.to)))left.delete(w.to+'');
    }
    return out;
  }
  /* Frase sobre as casas proibidas (marcadas com X) da peça em (r,c), ou null se não há nada a explicar.
     canPlay: o que o jogador ainda pode fazer se o rei estiver preso sem xeque, ex. "coloque uma peça da esteira". */
  function explain(b,r,c,canPlay){
    const p=b[r][c],side=p.side,chk=inCheck(b,side),why=whyNot(b,r,c),has=legalMoves(b,r,c).length,Nm=`${up(ART[p.t])} ${NOME[p.t]}`;
    if(p.t==='k'){
      if(!why.length)return has?null:'O rei está cercado pelas suas próprias peças.';
      const txt=cover(why).map(g=>`${named(b,g.a)} ataca ${list(g.ts.sort())}`).join('; ');
      if(has)return `As casas com X são proibidas para o rei, porque ele ficaria atacado: ${txt}.`;
      return `O rei não pode andar, porque todas as casas em volta estão atacadas: ${txt}. `+(chk
        ?'Para sair do xeque, bloqueie o ataque (pode ser colocando uma peça da esteira) ou capture o atacante.'
        :`Ele não está em xeque, então ainda dá para jogar: ${canPlay}.`);
    }
    if(!why.length)return has?null:`${Nm} está ${fem(p.t)?'bloqueada':'bloqueado'}: não tem casa livre para ir.`;
    const by=named(b,why[0].by[0]);
    if(chk)return has?`As casas com X não tiram o rei do xeque: ${by} continuaria atacando.`:`${Nm} não consegue tirar o rei do xeque: ${by} continua atacando.`;
    return `${Nm} está ${fem(p.t)?'cravada':'cravado'}: se ${fem(p.t)?'ela':'ele'} sair${has?' da linha':''}, ${by} dá xeque no seu rei.`;
  }
  /* Motivo curto de uma casa proibida (um item de whyNot), para a dica da casa e para o clique errado. */
  function forbid(b,w,isKing){
    const n=w.by.map(a=>named(b,a));
    return isKing?`${list(n)} ${n.length>1?'atacam':'ataca'} essa casa`:`${n[0]} daria xeque no seu rei`;
  }

  return{VAL,inB,opp,clone,empty,zone,moves,each,kingPos,attacked,inCheck,apply,legalMoves,legalPlacements,whyNot,hasAnyLegal,material,rand,pieceAt,list,explain,forbid};
})();
