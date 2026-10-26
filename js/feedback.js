/* Feedback por e-mail via Web3Forms (web3forms.com).
   O e-mail de destino fica guardado na conta do Web3Forms, nunca no código do site.
   Para gerar a chave: abra web3forms.com, digite seu e-mail e a chave chega por e-mail.
   Com a chave vazia, o formulário aparece desativado. */
export const FEEDBACK_KEY='6ef360c4-5b73-44ed-b23c-6f6007625fd0';

export const feedbackOn=()=>!!FEEDBACK_KEY;

export async function sendFeedback({tipo,mensagem,apelido,botcheck}){
  // FormData (e não JSON) para o navegador não fazer a pré-consulta CORS, que o Web3Forms recusa.
  const fd=new FormData();
  Object.entries({
    access_key:FEEDBACK_KEY,
    subject:`Xeque na Esteira: ${tipo}`,
    from_name:apelido||'Jogador sem apelido',
    tipo,mensagem,
    apelido:apelido||'(não informado)',
    pagina:location.href,
    navegador:navigator.userAgent
  }).forEach(([k,v])=>fd.append(k,v));
  if(botcheck)fd.append('botcheck','on');
  const r=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{Accept:'application/json'},body:fd});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||!j.success)throw new Error(j.message||'http '+r.status);
}
