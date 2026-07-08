/**
 * MAGD MARKET — Login Page
 */
document.addEventListener('DOMContentLoaded', () => {
  authManager.init().then(user => { if(user) window.location.href='index.html'; });

  document.getElementById('togglePw')?.addEventListener('click', () => {
    const inp=document.getElementById('loginPassword'), ico=document.querySelector('#togglePw i');
    if(inp.type==='password'){inp.type='text'; ico.className='fa fa-eye-slash';}
    else{inp.type='password'; ico.className='fa fa-eye';}
  });

  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');
  errEl.style.display='none';
  document.getElementById('emailError').textContent='';
  document.getElementById('passwordError').textContent='';
  let valid=true;
  if(!email)    { document.getElementById('emailError').textContent='Email is required';    valid=false; }
  if(!password) { document.getElementById('passwordError').textContent='Password is required'; valid=false; }
  if(!valid) return;
  btn.disabled=true;
  document.getElementById('loginBtnText').style.display='none';
  document.getElementById('loginSpinner').style.display='inline-flex';
  try {
    const res = await api.auth.login({email, password});
    showToast('Welcome back!','success');
    const next = new URLSearchParams(window.location.search).get('next');
    setTimeout(() => window.location.href = res.data?.role==='admin' ? (next||'admin.html') : (next||'index.html'), 800);
  } catch (err) {
    errEl.innerHTML=`<i class="fa fa-exclamation-circle"></i> ${err.message||'Invalid email or password'}`;
    errEl.style.display='flex';
    btn.disabled=false;
    document.getElementById('loginBtnText').style.display='';
    document.getElementById('loginSpinner').style.display='none';
  }
}
