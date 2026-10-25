/* Login (conta Google) e ranking global no Firestore.
   Cada jogador tem um documento por nível: scores/{uid}_{nivel}, com a melhor pontuação.
   Nunca guardamos nome real nem e-mail: só o apelido escolhido. */
import {FIREBASE_CONFIG} from './firebase-config.js';

const V='10.12.2',CDN=`https://www.gstatic.com/firebasejs/${V}`;
const listeners=new Set();
let A=null,F=null,auth=null,db=null,user=null;

export const NET={
  enabled:false,
  ready:false,
  get user(){return user},
  onChange(fn){listeners.add(fn);return()=>listeners.delete(fn)},
  async login(){
    if(!this.enabled)throw new Error('ranking desativado');
    try{await A.signInWithPopup(auth,new A.GoogleAuthProvider())}
    catch(e){
      if(e.code==='auth/popup-closed-by-user'||e.code==='auth/cancelled-popup-request')return false;
      if(e.code==='auth/popup-blocked')throw new Error('O navegador bloqueou a janela de login. Libere pop-ups para este site.');
      throw new Error('Não foi possível entrar agora. Tente de novo.');
    }
    return true;
  },
  async logout(){if(this.enabled)await A.signOut(auth)},
  async top(diff){
    const q=F.query(F.collection(db,'scores'),F.where('difficulty','==',diff),F.orderBy('score','desc'),F.limit(10));
    return(await F.getDocs(q)).docs.map(d=>d.data());
  },
  async best(diff){
    if(!user)return null;
    const s=await F.getDoc(F.doc(db,'scores',`${user.uid}_${diff}`));
    return s.exists()?s.data():null;
  },
  /* Só grava se for o novo recorde do jogador neste nível (as regras também exigem isso). */
  async submit({nick,difficulty,score,turns,waves,won,block}){
    if(!user)throw new Error('sem login');
    const old=await this.best(difficulty);
    if(old&&old.score>=score)return{saved:false,best:old.score};
    await F.setDoc(F.doc(db,'scores',`${user.uid}_${difficulty}`),{uid:user.uid,nick,difficulty,score,turns,waves,won,block:!!block,at:F.serverTimestamp()});
    return{saved:true,best:score};
  }
};

const emit=()=>listeners.forEach(fn=>{try{fn(NET)}catch(e){console.error(e)}});

if(FIREBASE_CONFIG.apiKey&&FIREBASE_CONFIG.projectId){
  try{
    const[app,a,f]=await Promise.all([import(`${CDN}/firebase-app.js`),import(`${CDN}/firebase-auth.js`),import(`${CDN}/firebase-firestore.js`)]);
    A=a;F=f;
    const fb=app.initializeApp(FIREBASE_CONFIG);
    auth=A.getAuth(fb);db=F.getFirestore(fb);
    NET.enabled=true;
    A.onAuthStateChanged(auth,u=>{user=u;NET.ready=true;emit()});
  }catch(e){console.warn('Firebase indisponível; usando recordes locais.',e);NET.ready=true}
}else NET.ready=true;
