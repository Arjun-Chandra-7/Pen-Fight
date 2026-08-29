/* Google OAuth 2.0 & Private Developer Authentication System */
(function () {
  const DEVELOPER_EMAILS = [
    'aarjunchandra@gmail.com',
    'aviralbg.2911@gmail.com'
  ];

  const DEV_PASSCODES = [
    'uchihamadara7',
    'developer7',
    'madara',
    'arjun2026'
  ];

  function isDevEmail(email) {
    if (!email) return false;
    return DEVELOPER_EMAILS.includes(email.trim().toLowerCase());
  }

  window.isDeveloperAccount = function () {
    const u = getCurrentUser();
    return u && (u.isDev || isDevEmail(u.email));
  };

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem('lastBenchUser');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return {
      email: '',
      name: 'Guest Player',
      picture: '',
      isDev: false,
      isGuest: true
    };
  }

  function saveUser(user) {
    localStorage.setItem('lastBenchUser', JSON.stringify(user));
  }

  function getGoogleClientId() {
    return localStorage.getItem('last_bench_google_client_id') || '';
  }

  function setGoogleClientId(id) {
    localStorage.setItem('last_bench_google_client_id', (id || '').trim());
  }

  // Grant developer perks: all pens unlocked + protected, Madara Uchiha God Pen
  window.applyDeveloperPerks = function () {
    const isDev = window.isDeveloperAccount();
    if (isDev) {
      const allPenKeys = ['sky', 'brick', 'violet', 'gold', 'mint', 'graphite', 'madara'];
      allPenKeys.forEach(k => {
        if (window.PEN && window.PEN[k]) {
          window.PEN[k].owned = true;
          window.PEN[k].protected = true;
        }
        if (window.save && window.save.owned && !window.save.owned.includes(k)) {
          window.save.owned.push(k);
        }
      });
      if (window.save) {
        window.save.quest = 5;
      }
      if (typeof window.persist === 'function') window.persist();
      if (typeof window.renderCase === 'function') window.renderCase();
    }
  };

  function formatNameFromEmail(email) {
    if (email.toLowerCase().includes('aarjunchandra')) return 'Arjun Chandra';
    if (email.toLowerCase().includes('aviral')) return 'Aviral';
    const local = email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  function handleAuthSuccess(email, name, picture, isOAuth) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const isDev = isDevEmail(normalizedEmail);
    const displayName = name || formatNameFromEmail(normalizedEmail);

    const user = {
      email: normalizedEmail,
      name: displayName,
      picture: picture || '',
      isDev: isDev,
      isOAuth: !!isOAuth,
      isGuest: false
    };

    saveUser(user);
    updateAuthUI();
    closeModal('#authModal');

    if (isDev) {
      window.applyDeveloperPerks();
      if (typeof toast === 'function') {
        toast(`⚡ DEVELOPER VERIFIED: Welcome, ${user.name}! All Pens & Madara God Pen Active.`);
      }
    } else {
      if (typeof toast === 'function') {
        toast(`✦ Welcome, ${user.name}! Signed in via Google.`);
      }
      if (typeof window.renderCase === 'function') window.renderCase();
    }
  }

  // Real Google OAuth Popup flow
  function triggerGoogleOAuthPopup() {
    const clientId = getGoogleClientId();
    if (!clientId) {
      // Toggle settings accordion and show guidance
      const settings = document.getElementById('clientIdSettings');
      if (settings) settings.classList.remove('hidden');
      const input = document.getElementById('clientIdInput');
      if (input) input.focus();
      if (typeof toast === 'function') {
        toast('Paste your Google Cloud OAuth Client ID below to connect Google popup.');
      }
      return;
    }

    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              })
              .then(res => res.json())
              .then(userInfo => {
                if (userInfo && userInfo.email) {
                  handleAuthSuccess(userInfo.email, userInfo.name, userInfo.picture, true);
                }
              })
              .catch(err => {
                console.error('Google userinfo error:', err);
                if (typeof toast === 'function') toast('Failed to fetch Google profile. Please try again.');
              });
            }
          }
        });
        client.requestAccessToken({ prompt: 'select_account' });
      } catch (e) {
        console.error('Google OAuth init error:', e);
        if (typeof toast === 'function') toast('Google OAuth error: ' + (e.message || 'Check Client ID'));
      }
    } else {
      if (typeof toast === 'function') toast('Google Identity Services SDK is loading...');
    }
  }

  function updateAuthUI() {
    const user = getCurrentUser();
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;

    const isDev = user.isDev || isDevEmail(user.email);

    if (user.isGuest || !user.email) {
      authContainer.innerHTML = `
        <button id="signInBtn" class="google-login-btn" title="Sign in with Google">
          <svg class="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Sign In</span>
        </button>
      `;
      const btn = document.getElementById('signInBtn');
      if (btn) btn.onclick = () => openModal('#authModal');
    } else {
      const avatarHtml = user.picture
        ? `<img class="user-avatar-img" src="${user.picture}" alt="${user.name}">`
        : `<div class="user-avatar-img">${(user.name || 'U')[0].toUpperCase()}</div>`;

      const badgeHtml = isDev
        ? `<span class="dev-badge-tag">👑 DEVELOPER</span>`
        : '';

      authContainer.innerHTML = `
        <button id="userProfileBtn" class="user-profile-btn" title="View Account">
          ${avatarHtml}
          <span class="user-name-text">${user.name}</span>
          ${badgeHtml}
        </button>
      `;

      const pBtn = document.getElementById('userProfileBtn');
      if (pBtn) pBtn.onclick = () => showUserProfileModal(user);
    }
  }

  function showUserProfileModal(user) {
    const isDev = user.isDev || isDevEmail(user.email);
    const modal = document.getElementById('profileModal');
    if (!modal) return;

    const avatarLarge = document.getElementById('profileModalAvatar');
    if (avatarLarge) {
      avatarLarge.innerHTML = user.picture
        ? `<img src="${user.picture}" alt="${user.name}">`
        : `<span>${(user.name || 'U')[0].toUpperCase()}</span>`;
    }

    const nameEl = document.getElementById('profileModalName');
    if (nameEl) nameEl.textContent = user.name;

    const emailEl = document.getElementById('profileModalEmail');
    if (emailEl) emailEl.textContent = user.email;

    const perksEl = document.getElementById('profileModalPerks');
    if (perksEl) {
      if (isDev) {
        perksEl.innerHTML = `
          <div class="profile-perk-item"><span class="icon">👑</span> <b>Developer Status:</b> Verified Owner</div>
          <div class="profile-perk-item"><span class="icon">⚡</span> <b>God Pen:</b> Madara Uchiha (Susanoo Edition)</div>
          <div class="profile-perk-item"><span class="icon">🛡️</span> <b>Desk Immunity:</b> All pens 100% protected against loss</div>
          <div class="profile-perk-item"><span class="icon">🔓</span> <b>Armory:</b> All pens unlocked in pencil case</div>
        `;
      } else {
        perksEl.innerHTML = `
          <div class="profile-perk-item"><span class="icon">👤</span> <b>Rank:</b> Classroom Challenger</div>
          <div class="profile-perk-item"><span class="icon">💾</span> <b>Cloud Save:</b> Synced to Google Account</div>
          <div class="profile-perk-item"><span class="icon">✒️</span> <b>Starter Pen:</b> Cello Butterflow (Protected)</div>
        `;
      }
    }

    openModal('#profileModal');
  }

  function openModal(sel) {
    const el = document.querySelector(sel);
    if (el) el.classList.remove('hidden');
    const input = document.getElementById('googleEmailInput');
    if (input) setTimeout(() => input.focus(), 50);
  }

  function closeModal(sel) {
    const el = document.querySelector(sel);
    if (el) el.classList.add('hidden');
  }

  // Secret cheat code listener (for developer testing)
  let typedBuffer = '';
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    typedBuffer = (typedBuffer + e.key.toLowerCase()).slice(-12);
    if (typedBuffer.includes('madara') || typedBuffer.includes('susanoo') || typedBuffer.includes('godmode')) {
      typedBuffer = '';
      if (window.PEN && window.PEN.madara) {
        window.PEN.madara.owned = true;
        window.PEN.madara.protected = true;
        if (window.save && !window.save.owned.includes('madara')) {
          window.save.owned.push('madara');
        }
        if (typeof window.persist === 'function') window.persist();
        if (typeof window.renderCase === 'function') window.renderCase();
        if (typeof toast === 'function') {
          toast('✦ SHARINGAN AWAKENED: Madara Uchiha God Pen Unlocked! ✦');
        }
        if (typeof tap === 'function') tap(0.08);
      }
    }
  });

  // DOM ready attachment
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    if (window.isDeveloperAccount()) {
      window.applyDeveloperPerks();
    }

    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(b => {
      b.onclick = () => {
        const target = b.dataset.closeModal;
        closeModal('#' + target);
      };
    });

    // Google OAuth Popup Button
    const oauthBtn = document.getElementById('googleOAuthPopupBtn');
    if (oauthBtn) {
      oauthBtn.onclick = triggerGoogleOAuthPopup;
    }

    // Toggle Client ID settings
    const toggleClientIdBtn = document.getElementById('toggleClientIdBtn');
    if (toggleClientIdBtn) {
      toggleClientIdBtn.onclick = () => {
        const settings = document.getElementById('clientIdSettings');
        if (settings) settings.classList.toggle('hidden');
      };
    }

    // Save Client ID
    const saveClientIdBtn = document.getElementById('saveClientIdBtn');
    if (saveClientIdBtn) {
      const clientIdInput = document.getElementById('clientIdInput');
      if (clientIdInput) clientIdInput.value = getGoogleClientId();
      saveClientIdBtn.onclick = () => {
        if (clientIdInput) {
          setGoogleClientId(clientIdInput.value);
          if (typeof toast === 'function') toast('Google OAuth Client ID saved!');
        }
      };
    }

    // Dynamic Developer Passcode group toggle
    const emailInput = document.getElementById('googleEmailInput');
    const passcodeGroup = document.getElementById('devPasscodeGroup');
    if (emailInput && passcodeGroup) {
      emailInput.addEventListener('input', () => {
        const val = emailInput.value.trim().toLowerCase();
        if (isDevEmail(val)) {
          passcodeGroup.classList.remove('hidden');
          const pInput = document.getElementById('devPasscodeInput');
          if (pInput) pInput.required = true;
        } else {
          passcodeGroup.classList.add('hidden');
          const pInput = document.getElementById('devPasscodeInput');
          if (pInput) pInput.required = false;
        }
      });
    }

    // Google Sign-In Form Handler
    const googleForm = document.getElementById('googleSignInForm');
    if (googleForm) {
      googleForm.onsubmit = e => {
        e.preventDefault();
        const input = document.getElementById('googleEmailInput');
        if (input && input.value) {
          const email = input.value.trim().toLowerCase();
          if (isDevEmail(email)) {
            const pInput = document.getElementById('devPasscodeInput');
            const code = pInput ? pInput.value.trim() : '';
            if (!DEV_PASSCODES.includes(code)) {
              if (typeof toast === 'function') toast('❌ Invalid Developer Secret Key. Access denied.');
              return;
            }
          }
          handleAuthSuccess(email);
          input.value = '';
          const pInput = document.getElementById('devPasscodeInput');
          if (pInput) pInput.value = '';
        }
      };
    }

    // Sign Out Button
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
      signOutBtn.onclick = () => {
        localStorage.removeItem('lastBenchUser');
        closeModal('#profileModal');
        updateAuthUI();
        if (typeof toast === 'function') toast('Signed out. Playing as Guest.');
        location.reload();
      };
    }
  });

  if (document.readyState !== 'loading') {
    updateAuthUI();
    if (window.isDeveloperAccount()) {
      window.applyDeveloperPerks();
    }
  }
})();
