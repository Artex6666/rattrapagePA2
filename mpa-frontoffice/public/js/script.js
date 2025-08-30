console.log('Script chargé');

// Fonction pour valider une adresse avec notre proxy
async function validateAddress(address) {
  try {
    const searches = [
      { countrycodes: 'fr' },
      { countrycodes: 'fr,be,ch,lu,mc,ad' },
      { countrycodes: '' }
    ];
    
    for (const search of searches) {
      const url = `https://api.axia.quest/annonces/geocode?q=${encodeURIComponent(address)}&limit=1${search.countrycodes ? '&countrycodes=' + search.countrycodes : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.length > 0) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la validation de l\'adresse:', error);
    return true;
  }
}

// Cache pour les suggestions d'adresses
const addressCache = new Map();

// Fonction de normalisation d'adresse pour améliorer la recherche
function normalizeAddressQuery(query) {
  return query
    .toLowerCase()
    .trim()
    .replace(/\bbd\b/g, 'boulevard')
    .replace(/\bboul\b/g, 'boulevard')
    .replace(/\bav\b/g, 'avenue')
    .replace(/\bave\b/g, 'avenue')
    .replace(/\br\b/g, 'rue')
    .replace(/\bpl\b/g, 'place')
    .replace(/\bsq\b/g, 'square')
    .replace(/\bimp\b/g, 'impasse')
    .replace(/\ball\b/g, 'allée')
    .replace(/\bch\b/g, 'chemin')
    .replace(/\bfg\b/g, 'faubourg')
    .replace(/\bqua\b/g, 'quai')
    .replace(/\bpas\b/g, 'passage')
    .replace(/\bcrs\b/g, 'cours')
    .replace(/\bpte\b/g, 'porte')
    .replace(/\bst\b/g, 'saint')
    .replace(/\bste\b/g, 'sainte')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction pour formater proprement une adresse
function formatAddressProfessional(item) {
  const parts = item.display_name.split(', ');
  const address = item.address || {};
  
  let formatted = '';
  
  if (address.house_number && address.road) {
    formatted += `${address.house_number} ${address.road}`;
  } else if (address.road) {
    formatted += address.road;
  } else if (parts[0]) {
    formatted += parts[0];
  }
  
  const city = address.city || address.town || address.village || address.municipality;
  if (city) {
    formatted += formatted ? `, ${city}` : city;
  }
  
  if (address.postcode) {
    formatted += ` ${address.postcode}`;
  }
  
  if (address.country && address.country !== 'France') {
    formatted += `, ${address.country}`;
  }
  
  return formatted || item.display_name.split(', ').slice(0, 2).join(', ');
}

// Fonction pour afficher les suggestions d'adresses
async function showAddressSuggestions(address, inputElement) {
  if (address.length < 3) return;
  
  const normalizedAddress = normalizeAddressQuery(address);
  const cacheKey = normalizedAddress;
  
  if (addressCache.has(cacheKey)) {
    displaySuggestions(addressCache.get(cacheKey), inputElement);
    return;
  }
  
  try {
    const frenchUrl = `https://api.axia.quest/annonces/geocode?q=${encodeURIComponent(normalizedAddress)}&countrycodes=fr&limit=8`;
    const frenchResponse = await fetch(frenchUrl);
    const frenchData = await frenchResponse.json();
    
    let allResults = [];
    
    if (frenchData.length > 0) {
      allResults = frenchData.map(item => ({
        ...item,
        priority: 'France'
      }));
    } else {
      const originalUrl = `https://api.axia.quest/annonces/geocode?q=${encodeURIComponent(address)}&countrycodes=fr&limit=5`;
      const originalResponse = await fetch(originalUrl);
      const originalData = await originalResponse.json();
      
      if (originalData.length > 0) {
        allResults = originalData.map(item => ({
          ...item,
          priority: 'France'
        }));
      } else {
        const europeUrl = `https://api.axia.quest/annonces/geocode?q=${encodeURIComponent(normalizedAddress)}&countrycodes=be,ch,lu,mc,ad,it,es,de,gb&limit=3`;
        const europeResponse = await fetch(europeUrl);
        const europeData = await europeResponse.json();
        
        if (europeData.length > 0) {
          allResults = europeData.map(item => ({
            ...item,
            priority: 'Europe'
          }));
        }
      }
    }
    
    addressCache.set(cacheKey, allResults);
    
    if (addressCache.size > 200) {
      const firstKey = addressCache.keys().next().value;
      addressCache.delete(firstKey);
    }
    
    displaySuggestions(allResults, inputElement);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
  }
}

// Fonction pour afficher les suggestions
function displaySuggestions(data, inputElement) {
  const existingSuggestions = inputElement.parentElement.querySelector('.address-suggestions');
  if (existingSuggestions) {
    existingSuggestions.remove();
  }
  
  if (data.length > 0) {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'address-suggestions';
    suggestionsDiv.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    data.forEach(item => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.style.cssText = `
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      const professionalAddress = formatAddressProfessional(item);
      const countryFlag = item.priority === 'France' ? '🇫🇷' : 
                         item.priority === 'Europe' ? '🇪🇺' : '🌍';
      
      suggestionItem.innerHTML = `
        <div style="flex: 1;">
          <div style="font-weight: 500; color: #333;">${professionalAddress}</div>
          <div style="font-size: 0.75em; color: #888; margin-top: 2px; line-height: 1.2;">${item.display_name}</div>
        </div>
        <span style="font-size: 1em; margin-left: 10px;">${countryFlag}</span>
      `;
      
      suggestionItem.addEventListener('click', () => {
        inputElement.value = professionalAddress;
        inputElement.dataset.fullAddress = item.display_name;
        suggestionsDiv.remove();
      });
      
      suggestionItem.addEventListener('mouseenter', () => {
        suggestionItem.style.backgroundColor = '#f5f5f5';
      });
      
      suggestionItem.addEventListener('mouseleave', () => {
        suggestionItem.style.backgroundColor = 'white';
      });
      
      suggestionsDiv.appendChild(suggestionItem);
    });
    
    inputElement.parentElement.style.position = 'relative';
    inputElement.parentElement.appendChild(suggestionsDiv);
  }
}

// Modal d'erreur Bootstrap
document.body.insertAdjacentHTML('beforeend', `
<div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header bg-danger text-white">
        <h5 class="modal-title" id="errorModalLabel">Erreur</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" id="errorModalBody"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
      </div>
    </div>
  </div>
</div>
`);

function showErrorModal(message) {
  document.getElementById('errorModalBody').innerText = message;
  const modal = new bootstrap.Modal(document.getElementById('errorModal'));
  modal.show();
}

// Fonction pour afficher une notification de succès
function showSuccessNotification(message) {
  const existingNotifications = document.querySelectorAll('.success-notification');
  existingNotifications.forEach(notif => notif.remove());
  
  const notification = document.createElement('div');
  notification.className = 'success-notification alert alert-success alert-dismissible position-fixed';
  notification.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: none;
    border-radius: 8px;
  `;
  
  notification.innerHTML = `
    <i class="bi bi-check-circle-fill me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Gestion de l'inscription
if (document.getElementById('registerForm')) {
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('input', function() {
      this.value = this.value.toLowerCase();
    });
  }
  
  document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const firstname = this.firstname.value;
    const lastname = this.lastname.value;
    const name = firstname + ' ' + lastname;
    let email = this.email.value;
    email = email.toLowerCase();
    const password = this.password.value;
    const type = 'client';
    
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regex.test(password)) {
      showErrorModal('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.');
      return;
    }
    
    try {
      const res = await fetch('https://api.axia.quest/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName: firstname, lastName: lastname, email, password })
      });
      
      if (res.ok) {
        const loginRes = await fetch('https://api.axia.quest/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.user) {
          window.location.href = '/';
        } else {
          showErrorModal(loginData.error || 'Inscription réussie, mais connexion impossible.');
        }
      } else {
        const data = await res.json();
        showErrorModal(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      showErrorModal('Erreur réseau');
    }
  });
}

// Gestion de la connexion
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = this.email.value;
    const password = this.password.value;
    
    try {
      const res = await fetch('https://api.axia.quest/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (res.ok && data.user) {
        window.location.href = '/';
      } else {
        showErrorModal(data.error || 'Identifiants invalides');
      }
    } catch (err) {
      showErrorModal('Erreur réseau');
    }
  });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  // Initialisation des sliders
  if (document.getElementById('annoncesTrack')) {
    sliderShow3('annoncesTrack', 'annonce-item', 'annoncePrevBtn', 'annonceNextBtn');
  }
  if (document.getElementById('avisTrack')) {
    sliderShow3('avisTrack', 'avis-item', 'avisPrevBtn', 'avisNextBtn');
  }
});

// Fonction slider pour les carrousels
function sliderShow3(trackId, itemClass, prevBtnId, nextBtnId, auto = true) {
  const track = document.getElementById(trackId);
  const allItems = Array.from(track.querySelectorAll('.' + itemClass));
  const data = allItems.map(item => item.outerHTML);
  let center = 1;
  
  if (data.length < 1) return;
  
  function render(visibleCount = 3) {
    track.classList.remove('animating');
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    track.innerHTML = '';
    
    for (let i = 0; i < visibleCount; i++) {
      let idx = (center - Math.floor(visibleCount/2) + i + data.length) % data.length;
      let temp = document.createElement('div');
      temp.innerHTML = data[idx];
      let el = temp.firstElementChild;
      el.classList.remove('center', 'side');
      
      if (visibleCount === 1) {
        el.classList.add('center');
      } else if (i === 1) {
        el.classList.add('center');
      } else {
        el.classList.add('side');
      }
      
      el.style.display = '';
      track.appendChild(el);
    }
  }
  
  function slide(direction) {
    const isMobile = window.matchMedia('(max-width: 600px), (orientation: portrait)').matches;
    let visibleCount = isMobile ? 1 : 3;
    let newIdx = direction === 'left'
      ? (center + Math.ceil(visibleCount/2)) % data.length
      : (center - Math.ceil(visibleCount/2) + data.length) % data.length;
    
    render(visibleCount);
    Array.from(track.children).forEach(el => el.classList.remove('center'));
    
    let temp = document.createElement('div');
    temp.innerHTML = data[newIdx];
    let el = temp.firstElementChild;
    el.classList.remove('center', 'side');
    el.classList.add('side');
    el.style.display = '';
    
    if (direction === 'left') {
      track.appendChild(el);
    } else {
      track.insertBefore(el, track.firstChild);
    }
    
    track.classList.add('animating');
    track.style.transition = 'none';
    
    if (direction === 'left') {
      track.style.transform = 'translateX(0)';
    } else {
      track.style.transform = isMobile ? 'translateX(-100%)' : 'translateX(-33.3333%)';
    }
    
    setTimeout(() => {
      track.style.transition = 'transform 0.5s cubic-bezier(.4,2,.6,1)';
      if (direction === 'left') {
        track.style.transform = isMobile ? 'translateX(-100%)' : 'translateX(-33.3333%)';
      } else {
        track.style.transform = 'translateX(0)';
      }
    }, 10);
    
    setTimeout(() => {
      center = direction === 'left'
        ? (center + 1) % data.length
        : (center - 1 + data.length) % data.length;
      render(visibleCount);
    }, 510);
  }
  
  function renderResponsive() {
    const isMobile = window.matchMedia('(max-width: 600px), (orientation: portrait)').matches;
    render(isMobile ? 1 : 3);
  }
  
  renderResponsive();
  document.getElementById(prevBtnId).onclick = () => slide('right');
  document.getElementById(nextBtnId).onclick = () => slide('left');
  
  let interval = null;
  if (auto) {
    interval = setInterval(() => slide('left'), 3500);
    track.parentElement.addEventListener('mouseenter', () => clearInterval(interval));
    track.parentElement.addEventListener('mouseleave', () => {
      interval = setInterval(() => slide('left'), 3500);
    });
  }
  
  window.addEventListener('resize', renderResponsive);
}
