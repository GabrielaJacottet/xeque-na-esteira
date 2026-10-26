/* Feedback por e-mail via Web3Forms (web3forms.com).
   O e-mail de destino fica guardado na conta do Web3Forms, nunca no código do site.
   Para gerar a chave: abra web3forms.com, digite seu e-mail e a chave chega por e-mail.
   Com a chave vazia, o formulário aparece desativado. */
export const FEEDBACK_KEY='';

export const feedbackOn=()=>!!FEEDBACK_KEY;

export async function sendFeedback({tipo,mensagem,apelido,botcheck}){
  const r=await fetch('https://api.web3forms.com/submit',{
    method:'POST',
    headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({
      access_key:FEEDBACK_KEY,
      subject:`Xeque na Esteira: ${tipo}`,
      from_name:apelido||'Jogador sem apelido',
      tipo,mensagem,
      apelido:apelido||'(não informado)',
      pagina:location.href,
      navegador:navigator.userAgent,
      botcheck
    })
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok||!j.success)throw new Error(j.message||'http '+r.status);
}
