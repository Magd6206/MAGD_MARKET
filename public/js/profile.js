/**
 * MAGD MARKET — Profile Page
 */
let isEditing = false;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await authManager.init();
  if (!user) { document.getElementById('authRequiredMsg').style.display='flex'; return; }
  document.getElementById('profileContent').style.display='block';
  await loadProfile();
  bindForm();
});

async function loadProfile() {
  try {
    const res  = await api.users.me(); populateProfile(res.data);
  } catch { showToast('Could not load profile','error'); }
}

function populateProfile(user) {
  document.getElementById('profileName').textContent  = user.name  || '—';
  document.getElementById('profileEmail').textContent = user.email || '—';
  document.getElementById('pfName').value    = user.name    || '';
  document.getElementById('pfEmail').value   = user.email   || '';
  document.getElementById('pfPhone').value   = user.phone   || '';
  document.getElementById('pfAddress').value = user.address || '';
}

function bindForm() {
  document.getElementById('editToggleBtn')?.addEventListener('click', () => toggleEdit());
  document.getElementById('cancelEditBtn')?.addEventListener('click', () => { toggleEdit(false); loadProfile(); });
  document.getElementById('profileForm')?.addEventListener('submit', saveProfile);
}

function toggleEdit(forceState = null) {
  isEditing = forceState !== null ? forceState : !isEditing;
  ['pfName','pfEmail','pfPhone','pfAddress'].forEach(id => document.getElementById(id).disabled = !isEditing);
  document.getElementById('profileFormActions').style.display = isEditing ? 'flex' : 'none';
  document.getElementById('editToggleBtn').innerHTML = isEditing ? '<i class="fa fa-times"></i> Cancel' : '<i class="fa fa-edit"></i> Edit';
}

async function saveProfile(e) {
  e.preventDefault();
  const errEl=document.getElementById('profileError'), succEl=document.getElementById('profileSuccess');
  errEl.style.display='none'; succEl.style.display='none';
  const body = {
    name:    document.getElementById('pfName').value.trim(),
    email:   document.getElementById('pfEmail').value.trim(),
    phone:   document.getElementById('pfPhone').value.trim(),
    address: document.getElementById('pfAddress').value.trim(),
  };
  try {
    const res = await api.users.updateMe(body); populateProfile(res.data);
    succEl.innerHTML='<i class="fa fa-check-circle"></i> Profile updated successfully!'; succEl.style.display='flex';
    toggleEdit(false); showToast('Profile updated!','success');
  } catch (err) {
    errEl.innerHTML=`<i class="fa fa-exclamation-circle"></i> ${err.message||'Update failed'}`; errEl.style.display='flex';
  }
}
