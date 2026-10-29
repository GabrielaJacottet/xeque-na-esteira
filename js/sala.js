/* Salas do PvP online no Firestore: salas/{CÓDIGO}.
   O documento guarda a partida inteira (tabuleiro como texto de 64 letras, esteira, vez, relógios, lances).
   Quem joga calcula o lance no próprio aparelho e grava o estado novo; as regras do Firestore
   garantem que só quem está na vez grava e que o lance anda de 1 em 1. */
import {NET,fb} from './rede.js';

const ABC='ABCDEFGHJKLMNPQRSTUVWXYZ';  // sem I e O, para não confundir com 1 e 0
const newCode=()=>Array.from({length:5},()=>ABC[Math.floor(Math.random()*ABC.length)]).join('');
const ref=code=>{const{F,db}=fb();return F.doc(db,'salas',code)};
const fail=e=>{
  if(e&&e.code==='permission-denied')return new Error('O servidor recusou. Confira o código ou recarregue a página.');
  if(e&&e.code==='unavailable')return new Error('Sem conexão com o servidor. Confira a internet.');
  return e instanceof Error?e:new Error('Algo deu errado. Tente de novo.');
};

export const SALA={
  get uid(){return fb().uid},
  /* Garante um login (convidado se ninguém entrou com Google). */
  async ensureLogin(){if(!NET.player)await NET.guest()},

  /* Cria a sala e devolve o código. st: estado inicial da partida (board, belt, seed, drawn, toMove, ply, left, last, log). */
  async create(nick,clock,st){
    const{F,db}=fb(),uid=fb().uid;
    try{
      for(let i=0;i<6;i++){
        const code=newCode(),r=ref(code);
        const ok=await F.runTransaction(db,async tx=>{
          if((await tx.get(r)).exists())return false;
          tx.set(r,{code,status:'waiting',host:uid,hostNick:nick,guest:null,guestNick:null,w:null,b:null,clock,limit:40,...st,over:null,
            lastAt:F.serverTimestamp(),createdAt:F.serverTimestamp()});
          return true;
        });
        if(ok)return code;
      }
    }catch(e){throw fail(e)}
    throw new Error('Não consegui criar a sala. Tente de novo.');
  },

  /* Entra na sala. Quem já está nela (recarregou a página) só volta. As cores são sorteadas aqui. */
  async join(code,nick){
    const{F,db}=fb(),uid=fb().uid,r=ref(code);
    try{
      await F.runTransaction(db,async tx=>{
        const s=await tx.get(r);
        if(!s.exists())throw new Error('Não achei essa sala. Confira o código.');
        const d=s.data();
        if(d.host===uid||d.guest===uid)return;
        if(d.guest)throw new Error('Essa sala já tem dois jogadores.');
        const hostW=Math.random()<.5;
        tx.update(r,{guest:uid,guestNick:nick,status:'playing',w:hostW?d.host:uid,b:hostW?uid:d.host,lastAt:F.serverTimestamp()});
      });
    }catch(e){throw fail(e)}
  },

  /* Acompanha a sala em tempo real. cb(dados ou null, erro). */
  watch(code,cb){
    const{F}=fb();
    return F.onSnapshot(ref(code),s=>cb(s.exists()?s.data({serverTimestamps:'estimate'}):null),e=>cb(null,fail(e)));
  },

  /* Grava o estado depois do lance (patch.ply = lance anterior + 1). */
  async move(code,patch){
    const{F}=fb();
    try{await F.updateDoc(ref(code),{...patch,lastAt:F.serverTimestamp()})}catch(e){throw fail(e)}
  },
  /* O relógio de quem está na vez zerou: o outro jogador reivindica a vitória (as regras conferem o horário). */
  async claimTime(code,winner){
    const{F}=fb();
    try{await F.updateDoc(ref(code),{status:'over',over:{winner,why:'tempo'}})}catch(e){throw fail(e)}
  },
  async resign(code,winner){
    const{F}=fb();
    try{await F.updateDoc(ref(code),{status:'over',over:{winner,why:'desistencia'}})}catch(e){throw fail(e)}
  },
  /* Revanche: partida nova na mesma sala, com as cores trocadas. */
  async rematch(code,d,st){
    const{F}=fb();
    try{await F.updateDoc(ref(code),{...st,status:'playing',over:null,w:d.b,b:d.w,lastAt:F.serverTimestamp()})}catch(e){throw fail(e)}
  }
};
