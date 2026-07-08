/**
 * MAGD MARKET — Sign Up Page
 */
document.addEventListener('DOMContentLoaded', () => {
  authManager.init().then(user => { if(user) window.location.href='index.html'; });

  document.getElementById('togglePwSignup')?.addEventListener('click', () => {
    const inp=document.getElementById('signupPassword'), ico=document.querySelector('#togglePwSignup i');
    if(inp.type==='password'){inp.type='text'; ico.className='fa fa-eye-slash';}
    else{inp.type='password'; ico.className='fa fa-eye';}
  });

  document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
});

async function handleSignup(e) {
  e.preventDefault();
  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const phone    = document.getElementById('signupPhone').value.trim();
  const address  = document.getElementById('signupAddress').value.trim();
  const errEl    = document.getElementById('signupError');
  const succEl   = document.getElementById('signupSuccess');
  errEl.style.display='none'; succEl.style.display='none';
  let valid=true;
  if(!name)                       { showToast('Name is required','warning');                           valid=false; }
  if(!email)                      { showToast('Email is required','warning');                          valid=false; }
  if(!password||password.length<6){ showToast('Password must be at least 6 characters','warning');    valid=false; }
  if(!valid) return;
  const btn=document.getElementById('signupBtn');
  btn.disabled=true;
  document.getElementById('signupBtnText').style.display='none';
  document.getElementById('signupSpinner').style.display='inline-flex';
  try {
    await api.auth.signup({name,email,password,phone,address});
    succEl.innerHTML='<i class="fa fa-check-circle"></i> Account created! Redirecting to login...';
    succEl.style.display='flex';
    setTimeout(()=>window.location.href='login.html', 1800);
  } catch (err) {
    errEl.innerHTML=`<i class="fa fa-exclamation-circle"></i> ${err.message||'Could not create account'}`;
    errEl.style.display='flex';
    btn.disabled=false;
    document.getElementById('signupBtnText').style.display='';
    document.getElementById('signupSpinner').style.display='none';
  }
}
