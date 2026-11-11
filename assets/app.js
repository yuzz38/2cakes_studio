/* 2CAKES.STUDIO — buildless interaction layer. No requests, payments or automatic sends. */
(function () {
  'use strict';

  var products = window.CAKE_CATALOG || [];
  var productById = {};
  products.forEach(function (p) { productById[p.id] = p; });
  var storageKey = '2cakes-order-v1';
  var cart = [];
  var fruitChoices = [];
  var mochiSize = 6;
  var mochiAmounts = [2, 2, 2];
  var mochiNames = ['Малина — мята', 'Клубника — манго', 'Черника — чёрная смородина — маршмеллоу'];
  var mochiImages = ['mochi-raspberry-detail', 'mochi-mango-detail', 'mochi-berry-detail'];
  var toastTimer;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var dateInput = document.getElementById('order-date');
  var notesInput = document.getElementById('order-notes');
  var cartHost = document.getElementById('cart-items');
  var draft = document.getElementById('order-draft');
  var orderStatus = document.getElementById('order-status');
  var mobileBar = document.querySelector('.mobile-order');
  var orderVisible = false;
  var formatter = new Intl.NumberFormat('ru-RU');

  function price(value) { return formatter.format(value) + ' ₽'; }
  function element(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function announce(text) {
    var toast = document.getElementById('toast');
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3200);
  }
  function bounded(value, min, max) {
    var n = Math.floor(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  }
  function saveCart() {
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch (e) { /* Private/file mode: the order still works in memory. */ }
  }
  try {
    var stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) {
      cart = stored.slice(0, 80).filter(function (item) { return item && typeof item.id === 'string' && Object.prototype.hasOwnProperty.call(productById, item.id); }).map(function (item) {
        return { id: item.id, qty: bounded(item.qty, 1, 50), note: typeof item.note === 'string' ? item.note.slice(0, 600) : '' };
      });
    }
  } catch (e) { cart = []; }

  function todayInIrkutsk() {
    try {
      var parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Irkutsk', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var fields = {};
      parts.forEach(function (part) { fields[part.type] = part.value; });
      return fields.year + '-' + fields.month + '-' + fields.day;
    } catch (e) {
      var now = new Date();
      return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    }
  }
  dateInput.min = todayInIrkutsk();

  /* Header menu: focus stays in the open mobile sheet, Escape returns to the toggle. */
  var menuButton = document.querySelector('.menu-toggle');
  var navigation = document.getElementById('site-nav');
  function closeMenu(returnFocus) {
    navigation.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', function () {
    var open = menuButton.getAttribute('aria-expanded') !== 'true';
    if (!open) { closeMenu(false); return; }
    navigation.classList.add('is-open');
    document.body.classList.add('menu-open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Закрыть меню');
    navigation.querySelector('a').focus();
  });
  navigation.addEventListener('click', function (event) { if (event.target.closest('a')) closeMenu(false); });
  document.querySelector('.header-cart').addEventListener('click', function () { closeMenu(false); });
  document.addEventListener('keydown', function (event) {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { closeMenu(true); return; }
    if (event.key === 'Tab') {
      var links = Array.from(navigation.querySelectorAll('a')).concat([menuButton]);
      var index = links.indexOf(document.activeElement);
      if (event.shiftKey && (index <= 0)) { event.preventDefault(); links[links.length - 1].focus(); }
      else if (!event.shiftKey && (index === links.length - 1 || index === -1)) { event.preventDefault(); links[0].focus(); }
    }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1000) closeMenu(false); });

  /* Category tabs follow the ARIA roving-tabindex keyboard pattern. */
  var tabs = Array.from(document.querySelectorAll('[data-category]'));
  function openCategory(id, scroll, focus) {
    var activeTab = document.querySelector('[data-category="' + id + '"]');
    if (!activeTab) return;
    tabs.forEach(function (tab) {
      var active = tab.dataset.category === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    var tabStrip = activeTab.parentElement;
    if (activeTab.offsetLeft < tabStrip.scrollLeft || activeTab.offsetLeft + activeTab.offsetWidth > tabStrip.scrollLeft + tabStrip.clientWidth) {
      tabStrip.scrollLeft = activeTab.offsetLeft - tabStrip.offsetLeft;
    }
    if (scroll) document.getElementById('catalog').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    if (focus) activeTab.focus({ preventScroll: true });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { openCategory(tab.dataset.category, false, false); });
    tab.addEventListener('keydown', function (event) {
      var next = i;
      if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      openCategory(tabs[next].dataset.category, false, true);
    });
  });
  document.querySelectorAll('[data-open-category]').forEach(function (button) {
    button.addEventListener('click', function () { openCategory(button.dataset.openCategory, true, true); });
  });

  function refreshCatalogPanel(panel) {
    var select = panel.querySelector('.variant-select');
    var product = productById[select.value];
    var qty = bounded(panel.querySelector('.buy-row input').value, 1, 50);
    panel.querySelector('[data-detail]').textContent = product.detail;
    panel.querySelector('[data-price]').textContent = price(product.price * qty);
    var note = panel.querySelector('.photo-note');
    note.textContent = price(product.price) + ' ';
    note.appendChild(element('small', '', 'за ' + product.label));
  }
  document.querySelectorAll('.catalog-panel').forEach(function (panel) {
    var input = panel.querySelector('.buy-row input');
    panel.querySelector('select').addEventListener('change', function () { refreshCatalogPanel(panel); });
    input.addEventListener('input', function () { refreshCatalogPanel(panel); });
    input.addEventListener('change', function () { input.value = bounded(input.value, 1, 50); refreshCatalogPanel(panel); });
    panel.querySelectorAll('[data-qty]').forEach(function (button) {
      button.addEventListener('click', function () {
        input.value = bounded(Number(input.value) + (button.dataset.qty === 'plus' ? 1 : -1), 1, 50);
        refreshCatalogPanel(panel);
      });
    });
    panel.querySelector('[data-add-category]').addEventListener('click', function (event) {
      var id = panel.querySelector('select').value;
      var note = productById[id].category === 'desserts' && fruitChoices.length ? 'Пожелания по вкусам: ' + fruitChoices.join(', ') + '. Распределение уточнить.' : '';
      if (productById[id].category === 'mochi') note = 'Ассорти из доступных вкусов; состав согласовать.';
      addItem(id, bounded(input.value, 1, 50), note, event.currentTarget);
    });
  });

  function addItem(id, quantity, note, button) {
    if (!productById[id]) return;
    var item = cart.find(function (line) { return line.id === id && line.note === note; });
    if (item) item.qty = bounded(item.qty + quantity, 1, 50);
    else if (cart.length < 80) cart.push({ id: id, qty: quantity, note: note || '' });
    else { announce('В заказе много разных позиций. Дополнительные пожелания можно указать в тексте.'); return; }
    renderCart();
    saveCart();
    announce('Добавлено в заказ: ' + productById[id].name);
    if (button && button.animate && !reduced.matches) {
      button.animate([{ transform: 'scale(1)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
    }
  }

  function renderMochi() {
    var total = mochiAmounts.reduce(function (sum, value) { return sum + value; }, 0);
    mochiAmounts.forEach(function (amount, i) {
      document.getElementById('mochi-qty-' + i).textContent = amount;
      document.querySelector('[data-flavor="' + i + '"][data-mochi-change="-1"]').disabled = amount === 0;
      document.querySelector('[data-flavor="' + i + '"][data-mochi-change="1"]').disabled = total >= mochiSize;
    });
    document.getElementById('mochi-status').textContent = total === mochiSize ? 'В коробочке ' + total + ' из ' + mochiSize + '. Готово!' : 'В коробочке ' + total + ' из ' + mochiSize + '. Добавьте ещё ' + (mochiSize - total) + '.';
    document.getElementById('mochi-price').textContent = price(mochiSize === 6 ? 1490 : 2190);
    document.getElementById('add-mochi').disabled = total !== mochiSize;
    document.querySelectorAll('[data-mochi-size]').forEach(function (button) { button.setAttribute('aria-pressed', String(Number(button.dataset.mochiSize) === mochiSize)); });
    var slots = document.getElementById('mochi-slots');
    slots.replaceChildren();
    mochiAmounts.forEach(function (amount, i) {
      for (var j = 0; j < amount; j++) {
        var slot = element('div', 'box-slot');
        var img = element('img');
        img.src = 'assets/images/' + mochiImages[i] + '.webp';
        img.alt = mochiNames[i];
        img.width = 545; img.height = 490;
        slot.appendChild(img); slots.appendChild(slot);
      }
    });
    for (var k = total; k < mochiSize; k++) {
      var empty = element('div', 'box-slot empty', '+');
      empty.setAttribute('aria-label', 'Свободное место'); slots.appendChild(empty);
    }
  }
  document.querySelectorAll('[data-mochi-change]').forEach(function (button) {
    button.addEventListener('click', function () {
      var i = Number(button.dataset.flavor);
      var change = Number(button.dataset.mochiChange);
      var total = mochiAmounts.reduce(function (sum, n) { return sum + n; }, 0);
      if ((change < 0 && mochiAmounts[i] > 0) || (change > 0 && total < mochiSize)) mochiAmounts[i] += change;
      renderMochi();
    });
  });
  document.querySelectorAll('[data-mochi-size]').forEach(function (button) {
    button.addEventListener('click', function () {
      var size = Number(button.dataset.mochiSize);
      if (mochiSize === size) return;
      mochiSize = size;
      // Keep chosen flavors when enlarging; trim the last flavor first when reducing.
      var sum = mochiAmounts.reduce(function (total, n) { return total + n; }, 0);
      while (sum > size) {
        for (var i = 2; i >= 0 && sum > size; i--) { if (mochiAmounts[i] > 0) { mochiAmounts[i]--; sum--; } }
      }
      renderMochi();
    });
  });
  document.getElementById('add-mochi').addEventListener('click', function (event) {
    if (mochiAmounts.reduce(function (sum, n) { return sum + n; }, 0) !== mochiSize) return;
    var note = mochiAmounts.map(function (amount, i) { return amount ? mochiNames[i] + ': ' + amount + ' шт.' : ''; }).filter(Boolean).join('; ');
    addItem(mochiSize === 6 ? 'mochi-0' : 'mochi-1', 1, note, event.currentTarget);
  });
  renderMochi();

  document.querySelectorAll('[data-fruit]').forEach(function (button) {
    button.addEventListener('click', function () {
      var flavor = button.dataset.fruit;
      if (fruitChoices.includes(flavor)) fruitChoices = fruitChoices.filter(function (f) { return f !== flavor; });
      else fruitChoices.push(flavor);
      button.setAttribute('aria-pressed', String(fruitChoices.includes(flavor)));
      document.getElementById('fruit-selection').textContent = fruitChoices.length ? 'Выбрано: ' + fruitChoices.join(', ') + '. Теперь выберите коробку.' : 'Отметьте любимые вкусы — добавим пожелания в заказ.';
    });
  });
  document.getElementById('choose-snickers').addEventListener('click', function () {
    if (!notesInput.value.includes('Сникерс')) notesInput.value = (notesInput.value ? notesInput.value + '\n' : '') + 'Для торта или бенто хочу начинку «Сникерс».';
    refreshDraft();
    announce('Начинка «Сникерс» добавлена в пожелания к заказу.');
  });

  function totalCost() { return cart.reduce(function (sum, item) { return sum + productById[item.id].price * item.qty; }, 0); }
  function updateMobileBar() { mobileBar.hidden = !cart.length || orderVisible || document.body.classList.contains('menu-open'); }
  function renderCart() {
    cartHost.replaceChildren();
    if (!cart.length) {
      var empty = element('div', 'empty-cart');
      empty.appendChild(element('h3', '', 'Пока пусто. Но это поправимо.'));
      empty.appendChild(element('p', '', 'Выберите десерт в каталоге или соберите коробочку моти.'));
      var link = element('a', 'btn btn-secondary', 'Открыть меню'); link.href = '#catalog'; empty.appendChild(link);
      cartHost.appendChild(empty);
    }
    cart.forEach(function (item, index) {
      var product = productById[item.id];
      var row = element('article', 'cart-item');
      var img = element('img'); img.src = 'assets/images/' + product.image + '.webp'; img.alt = product.name; img.width = 76; img.height = 90; img.loading = 'lazy';
      row.appendChild(img);
      var content = element('div'); content.appendChild(element('h3', '', product.name)); content.appendChild(element('p', '', product.detail));
      if (item.note) content.appendChild(element('p', '', item.note));
      var qty = element('div', 'qty');
      ['minus', 'plus'].forEach(function (action, i) {
        if (i === 1) {
          var output = element('output', '', String(item.qty)); output.setAttribute('aria-label', 'Количество: ' + product.name); qty.appendChild(output);
        }
        var button = element('button', '', action === 'minus' ? '−' : '+'); button.type = 'button'; button.dataset.cartAction = action; button.dataset.index = index;
        button.setAttribute('aria-label', (action === 'minus' ? 'Уменьшить' : 'Увеличить') + ' количество: ' + product.name);
        button.disabled = action === 'plus' ? item.qty >= 50 : item.qty <= 1;
        qty.appendChild(button);
      });
      content.appendChild(qty); row.appendChild(content);
      var subtotal = element('div', 'cart-item-price'); subtotal.appendChild(element('span', '', price(product.price * item.qty)));
      var remove = element('button', 'remove-item', 'Убрать'); remove.type = 'button'; remove.dataset.cartAction = 'remove'; remove.dataset.index = index; remove.setAttribute('aria-label', 'Убрать из заказа: ' + product.name); subtotal.appendChild(remove); row.appendChild(subtotal);
      cartHost.appendChild(row);
    });
    var count = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
    document.querySelectorAll('[data-cart-count]').forEach(function (node) { node.textContent = count; });
    document.getElementById('cart-total').textContent = price(totalCost());
    document.getElementById('mobile-total').textContent = price(totalCost());
    updateMobileBar(); refreshDraft();
  }
  cartHost.addEventListener('click', function (event) {
    var button = event.target.closest('[data-cart-action]');
    if (!button) return;
    var index = Number(button.dataset.index); var action = button.dataset.cartAction;
    if (!cart[index]) return;
    if (action === 'remove') cart.splice(index, 1);
    else cart[index].qty = bounded(cart[index].qty + (action === 'plus' ? 1 : -1), 1, 50);
    renderCart(); saveCart();
    var next = cartHost.querySelector('[data-cart-action="' + action + '"][data-index="' + index + '"]');
    if (next && !next.disabled) next.focus({ preventScroll: true });
    else document.querySelector('.order-list > .text-link').focus({ preventScroll: true });
  });

  function refreshDraft() {
    var lines = ['Здравствуйте, 2CAKES.STUDIO! Хочу оформить заказ:', ''];
    cart.forEach(function (item, index) {
      var p = productById[item.id];
      lines.push((index + 1) + '. ' + p.name + ' (' + p.detail + ') — ' + item.qty + ' × ' + price(p.price) + ' = ' + price(item.qty * p.price));
      if (item.note) lines.push('   ' + item.note);
    });
    if (!cart.length) lines.push('Позиции ещё не выбраны.');
    lines.push('', 'Базовый итог: ' + price(totalCost()) + '. Декор и доставка — отдельно по согласованию.');
    if (dateInput.value) { var d = dateInput.value.split('-'); lines.push('Дата: ' + d[2] + '.' + d[1] + '.' + d[0]); }
    var delivery = document.querySelector('input[name="delivery"]:checked');
    if (delivery) lines.push('Получение: ' + delivery.value);
    if (notesInput.value.trim()) lines.push('Пожелания: ' + notesInput.value.trim());
    lines.push('', 'Подтвердите, пожалуйста, наличие, возможность заказа на дату и окончательную стоимость.');
    draft.value = lines.join('\n');
  }
  dateInput.addEventListener('change', function () {
    dateInput.removeAttribute('aria-invalid'); document.getElementById('date-error').textContent = ''; refreshDraft();
  });
  notesInput.addEventListener('input', refreshDraft);
  document.querySelectorAll('input[name="delivery"]').forEach(function (input) { input.addEventListener('change', refreshDraft); });

  function validateOrder() {
    orderStatus.textContent = '';
    if (!cart.length) {
      orderStatus.textContent = 'Добавьте хотя бы один десерт в заказ.';
      document.querySelector('.order-list > .text-link').focus(); return false;
    }
    if (!dateInput.value || !dateInput.validity.valid || dateInput.value < todayInIrkutsk()) {
      dateInput.setAttribute('aria-invalid', 'true');
      document.getElementById('date-error').textContent = !dateInput.value ? 'Выберите день, к которому нужен заказ.' : 'Выберите сегодняшнюю или будущую дату.';
      dateInput.focus(); return false;
    }
    return true;
  }
  function fallbackCopy(text) {
    var field = element('textarea'); field.value = text; field.style.position = 'fixed'; field.style.left = '-9999px'; field.setAttribute('readonly', ''); document.body.appendChild(field); field.select(); field.setSelectionRange(0, text.length);
    var success = false;
    try { success = document.execCommand('copy'); } catch (e) { success = false; }
    field.remove(); return success;
  }
  document.getElementById('copy-order').addEventListener('click', async function () {
    if (!validateOrder()) return;
    refreshDraft();
    var copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(draft.value); copied = true; } catch (e) { copied = fallbackCopy(draft.value); }
    } else copied = fallbackCopy(draft.value);
    if (copied) {
      orderStatus.textContent = 'Текст скопирован. Откройте Direct, вставьте его и отправьте студии.';
      document.getElementById('direct-order').focus({ preventScroll: true });
    } else {
      document.querySelector('.draft-details').open = true;
      draft.focus(); draft.select(); draft.setSelectionRange(0, draft.value.length);
      orderStatus.textContent = 'Браузер не разрешил копирование. Текст выделен — скопируйте его вручную и вставьте в Direct.';
    }
  });
  document.getElementById('direct-order').addEventListener('click', function () {
    orderStatus.textContent = 'Заявка оформляется в переписке. Вставьте скопированный текст в Direct и дождитесь подтверждения студии.';
  });
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) { orderVisible = entries[0].isIntersecting; updateMobileBar(); }, { threshold: 0 });
    observer.observe(document.getElementById('order'));
  }
  renderCart();

  /* Manual reviews slider: swipe, keyboard, buttons; no automatic rotation. */
  var track = document.getElementById('reviews-track');
  var reviews = Array.from(track.querySelectorAll('.review'));
  var prev = document.getElementById('reviews-prev');
  var next = document.getElementById('reviews-next');
  var position = document.getElementById('review-position');
  function reviewWidth() { return reviews.length > 1 ? reviews[1].offsetLeft - reviews[0].offsetLeft : track.clientWidth; }
  function updateReviews() {
    var width = reviewWidth();
    var index = Math.max(0, Math.min(reviews.length - 1, Math.round(track.scrollLeft / width)));
    position.textContent = (index + 1) + ' / ' + reviews.length;
    prev.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 3;
  }
  function slide(direction) {
    track.scrollBy({ left: direction * reviewWidth(), behavior: reduced.matches ? 'auto' : 'smooth' });
  }
  prev.addEventListener('click', function () { slide(-1); });
  next.addEventListener('click', function () { slide(1); });
  track.addEventListener('scroll', updateReviews, { passive: true });
  track.addEventListener('keydown', function (event) {
    if (event.target !== track) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); slide(event.key === 'ArrowRight' ? 1 : -1); }
  });
  document.querySelectorAll('.review-more').forEach(function (button) {
    button.addEventListener('click', function () {
      var review = button.closest('.review'); var expanded = review.classList.toggle('is-expanded');
      button.setAttribute('aria-expanded', String(expanded)); button.textContent = expanded ? 'Свернуть отзыв' : 'Читать целиком';
    });
  });
  updateReviews();
  window.addEventListener('resize', updateReviews);

  /* Native image dialog has its own focus and Escape behavior; links remain the fallback. */
  var dialog = document.getElementById('image-dialog');
  var imageOpener;
  document.querySelectorAll('[data-lightbox]').forEach(function (button) {
    button.addEventListener('click', function () {
      var src = button.dataset.lightbox;
      if (!dialog.showModal) { window.open(src, '_blank', 'noopener'); return; }
      var sourceImage = button.querySelector('img');
      dialog.querySelector('img').src = src;
      dialog.querySelector('img').alt = sourceImage ? sourceImage.alt : 'Корпусные десерты и вкусы';
      dialog.querySelector('a').href = src;
      imageOpener = button;
      dialog.showModal();
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) {
      var rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', function () { if (imageOpener) imageOpener.focus({ preventScroll: true }); });
})();
