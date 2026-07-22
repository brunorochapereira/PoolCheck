(() => {
  const $ = id => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const navButtons = [...document.querySelectorAll('.bottom-nav button')];
  let deferredInstall = null;
  let onboardingStep = 0;
  let onboardingDraft = {};
  let pendingProductStep = null;

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatNumber = (value, digits = 1) => Number(value).toLocaleString('pt-PT', {
    maximumFractionDigits: digits
  });

  const formatDate = value => new Date(value).toLocaleString('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  function toast(message) {
    const element = $('toast');
    element.textContent = message;
    element.classList.add('show');
    window.setTimeout(() => element.classList.remove('show'), 2400);
  }

  function go(view) {
    screens.forEach(screen => screen.classList.toggle('active', screen.id === view));
    navButtons.forEach(button => button.classList.toggle('active', button.dataset.view === view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'assistant') renderAssistant();
    if (view === 'details') renderDetails();
  }

  navButtons.forEach(button => {
    button.onclick = () => go(button.dataset.view);
  });

  document.querySelectorAll('[data-go]').forEach(button => {
    button.onclick = () => go(button.dataset.go);
  });

  function daysSince(date) {
    if (!date) return Infinity;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  }

  function taskIntervalDays(item) {
    if (Number(item.intervalDays) > 0 && (!item.intervalValue || !item.intervalUnit)) {
      return Number(item.intervalDays);
    }
    const value = Math.max(1, Number(item.intervalValue) || 1);
    if (item.intervalUnit === 'weeks') return value * 7;
    if (item.intervalUnit === 'months') return value * 30;
    return value;
  }

  function normaliseMaintenance() {
    let changed = false;
    const state = PoolStore.get();
    state.maintenance.forEach(item => {
      if (item.enabled === undefined) {
        item.enabled = true;
        changed = true;
      }
      if (!item.intervalValue || !item.intervalUnit) {
        const days = Math.max(1, Number(item.intervalDays) || 7);
        item.intervalValue = days % 7 === 0 ? days / 7 : days;
        item.intervalUnit = days % 7 === 0 ? 'weeks' : 'days';
        changed = true;
      }
      const intervalDays = taskIntervalDays(item);
      if (item.intervalDays !== intervalDays) {
        item.intervalDays = intervalDays;
        changed = true;
      }
    });
    if (changed) PoolStore.update(() => {});
  }

  function maintenanceDue(item) {
    return item.enabled !== false && daysSince(item.lastDone) >= taskIntervalDays(item);
  }

  function recurrenceLabel(item) {
    const amount = Math.max(1, Number(item.intervalValue) || 1);
    const unit = item.intervalUnit || 'days';
    if (unit === 'days') return amount === 1 ? 'Todos os dias' : `A cada ${amount} dias`;
    if (unit === 'weeks') return amount === 1 ? 'Todas as semanas' : `A cada ${amount} semanas`;
    return amount === 1 ? 'Todos os meses' : `A cada ${amount} meses`;
  }

  function formatRelativeTask(item) {
    if (item.enabled === false) return 'Tarefa desativada';
    if (!item.lastDone) return `${recurrenceLabel(item)} · Ainda não realizada`;
    const remaining = taskIntervalDays(item) - daysSince(item.lastDone);
    if (remaining <= 0) return `${recurrenceLabel(item)} · Pendente`;
    if (remaining === 1) return `${recurrenceLabel(item)} · Amanhã`;
    return `${recurrenceLabel(item)} · Dentro de ${remaining} dias`;
  }

  function completeMaintenance(id) {
    PoolStore.update(state => {
      const task = state.maintenance.find(item => item.id === id);
      if (task) task.lastDone = new Date().toISOString();
    });
    renderAll();
    toast('Manutenção registada.');
  }

  function openMaintenanceEditor(id) {
    const task = PoolStore.get().maintenance.find(item => item.id === id);
    if (!task) return;
    $('maintenanceTaskId').value = task.id;
    $('maintenanceTitle').value = task.title;
    $('maintenanceEnabled').checked = task.enabled !== false;
    $('maintenanceIntervalValue').value = task.intervalValue || 1;
    $('maintenanceIntervalUnit').value = task.intervalUnit || 'days';
    $('maintenanceModalTitle').textContent = task.title;
    $('maintenanceModal').classList.remove('hidden');
    updateMaintenancePreview();
  }

  function closeMaintenanceEditor() {
    $('maintenanceModal').classList.add('hidden');
  }

  function updateMaintenancePreview() {
    const intervalValue = Math.max(1, Number($('maintenanceIntervalValue').value) || 1);
    const intervalUnit = $('maintenanceIntervalUnit').value;
    $('maintenancePreview').textContent = `Próxima execução: ${recurrenceLabel({ intervalValue, intervalUnit }).toLowerCase()}, contada a partir da última conclusão.`;
  }

  function renderMaintenance() {
    const state = PoolStore.get();
    const list = $('maintenanceList');
    const settings = $('maintenanceSettingsList');

    if (list) {
      const active = state.maintenance.filter(item => item.enabled !== false);
      list.innerHTML = active.length
        ? active.map(item => `
          <div class="maintenance-item ${maintenanceDue(item) ? 'due' : ''}">
            <div class="maintenance-copy">
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(formatRelativeTask(item))}</small>
            </div>
            <div class="maintenance-actions">
              <button class="text-button maintenance-edit" data-edit-maintenance="${escapeHtml(item.id)}">Editar</button>
              <button class="maintenance-done" data-maintenance="${escapeHtml(item.id)}">Concluir</button>
            </div>
          </div>`).join('')
        : '<p class="muted">Não existem tarefas de manutenção ativas.</p>';
    }

    if (settings) {
      settings.innerHTML = state.maintenance.map(item => `
        <div class="maintenance-setting ${item.enabled === false ? 'disabled' : ''}">
          <label>
            <input type="checkbox" data-toggle-maintenance="${escapeHtml(item.id)}" ${item.enabled !== false ? 'checked' : ''}>
            <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(recurrenceLabel(item))}</small></span>
          </label>
          <button class="text-button" data-edit-maintenance="${escapeHtml(item.id)}">Editar</button>
        </div>`).join('');
    }

    document.querySelectorAll('[data-maintenance]').forEach(button => {
      button.onclick = () => completeMaintenance(button.dataset.maintenance);
    });

    document.querySelectorAll('[data-edit-maintenance]').forEach(button => {
      button.onclick = () => openMaintenanceEditor(button.dataset.editMaintenance);
    });

    document.querySelectorAll('[data-toggle-maintenance]').forEach(input => {
      input.onchange = () => {
        PoolStore.update(state => {
          const task = state.maintenance.find(item => item.id === input.dataset.toggleMaintenance);
          if (task) task.enabled = input.checked;
        });
        renderAll();
        toast(input.checked ? 'Tarefa ativada.' : 'Tarefa desativada.');
      };
    });
  }

  function renderWeather() {
    const state = PoolStore.get();
    const weather = state.weather;
    const card = $('weatherImpactCard');
    if (!card) return;

    const impact = weather.impact;
    card.classList.toggle('hidden', !weather.enabled || !impact || impact.level === 0);

    if (impact && impact.level > 0) {
      $('weatherImpactTitle').textContent = impact.title;
      $('weatherImpactMessage').textContent = impact.message;
      $('weatherImpactBadge').textContent = impact.level >= 3 ? 'Urgente' : 'Previsão';
      $('weatherImpactBadge').classList.toggle('urgent', impact.level >= 3);
      $('weatherImpactActions').innerHTML = actionHTML(impact.actions || []);
    }

    if ($('weatherSettingsStatus')) {
      $('weatherEnabled').checked = weather.enabled !== false;
      $('weatherAutoTasks').checked = weather.autoTasks !== false;
      const updated = weather.updatedAt ? formatDate(weather.updatedAt) : 'Nunca';
      $('weatherSettingsStatus').textContent = weather.updatedAt
        ? `Última atualização: ${updated}. A previsão é analisada automaticamente em background.`
        : 'Autorize a localização para ativar a análise meteorológica em background.';
    }
  }

  async function updateWeather(silent = false) {
    const state = PoolStore.get();
    if (state.weather.enabled === false) return;
    if (!navigator.geolocation) {
      if (!silent) toast('Este dispositivo não suporta localização.');
      return;
    }

    if ($('updateWeatherBtn')) $('updateWeatherBtn').textContent = 'A obter...';

    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const { latitude, longitude } = position.coords;
        const weather = await PoolWeather.fetchForecast(latitude, longitude, PoolStore.get().pool);
        weather.enabled = PoolStore.get().weather.enabled !== false;
        weather.autoTasks = PoolStore.get().weather.autoTasks !== false;
        PoolStore.update(current => { current.weather = weather; });
        renderAll();
        if (!silent) toast(weather.impact?.level ? 'Previsão analisada.' : 'Previsão atualizada.');
      } catch (error) {
        if (!silent) toast('Não foi possível obter a previsão.');
      } finally {
        if ($('updateWeatherBtn')) $('updateWeatherBtn').textContent = 'Atualizar agora';
      }
    }, () => {
      if ($('updateWeatherBtn')) $('updateWeatherBtn').textContent = 'Atualizar agora';
      if (!silent) toast('A localização não foi autorizada.');
    }, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 1800000
    });
  }

  function refreshWeatherInBackground() {
    const weather = PoolStore.get().weather;
    if (weather.enabled !== false && PoolWeather.stale(weather)) updateWeather(true);
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      toast('As notificações não são suportadas neste dispositivo.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast('As notificações não foram autorizadas.');
      return;
    }
    PoolStore.update(state => { state.notificationsEnabled = true; });
    $('notificationBtn').textContent = 'Lembrete ativo';
    toast('Lembretes de manutenção ativados.');
    checkMaintenanceNotification(true);
  }

  async function checkMaintenanceNotification(force = false) {
    const state = PoolStore.get();
    if (!('Notification' in window) || !state.notificationsEnabled || Notification.permission !== 'granted') return;
    const due = state.maintenance.filter(item => item.enabled !== false && maintenanceDue(item));
    if (!due.length) return;
    const notifiedRecently = state.lastMaintenanceNotification && daysSince(state.lastMaintenanceNotification) < 1;
    if (notifiedRecently && !force) return;

    const title = 'Manutenção da piscina';
    const body = due.length === 1 ? due[0].title : `Tem ${due.length} tarefas de manutenção pendentes.`;
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration) await registration.showNotification(title, { body, icon: '', tag: 'poolcheck-maintenance' });
      else new Notification(title, { body });
    } catch (error) {
      new Notification(title, { body });
    }
    PoolStore.update(current => { current.lastMaintenanceNotification = new Date().toISOString(); });
  }

  function latest() {
    return PoolStore.get().analyses[0] || null;
  }

  function resultFor(analysis) {
    return analysis ? PoolChemistry.analyse(analysis, PoolStore.get().pool, PoolStore.get().products) : null;
  }

  function actionHTML(items) {
    if (!items.length) {
      return '<div class="action-item"><span class="action-number">✓</span><div><strong>Nenhuma ação necessária</strong><p>Volte a analisar dentro de 7 dias ou após chuva intensa, utilização elevada ou alteração visível da água.</p></div></div>';
    }
    return items.map((item, index) => `
      <div class="action-item">
        <span class="action-number">${index + 1}</span>
        <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.reason)}</p></div>
      </div>`).join('');
  }

  function renderToday() {
    const analysis = latest();
    const result = resultFor(analysis);
    const plan = PoolStore.get().activePlan;
    const card = $('statusCard');
    card.className = `status-card ${result?.status || 'neutral'}`;
    $('todayTitle').textContent = result?.label || 'Sem análise';
    $('statusMessage').textContent = result?.message || 'Faça a primeira análise para saber se a piscina está pronta.';
    $('todayActions').innerHTML = actionHTML(result?.issues || []);
    $('urgentBadge').classList.toggle('hidden', !result?.allIssues.some(item => item.severity === 3));

    const button = $('primaryAction');
    if (plan && !plan.completed) {
      button.textContent = 'Continuar tratamento';
      button.onclick = () => go('assistant');
    } else if (!analysis) {
      button.textContent = 'Analisar água';
      button.onclick = () => go('analysis');
    } else {
      button.textContent = 'Fazer nova análise';
      button.onclick = () => go('analysis');
    }

    if (plan && !plan.completed) {
      $('nextTask').textContent = `Passo ${plan.current + 1} de ${plan.steps.length}`;
      $('nextTaskDetail').textContent = plan.steps[plan.current]?.title || 'Continuar plano.';
    } else if (analysis) {
      $('nextTask').textContent = 'Nova análise dentro de 7 dias';
      $('nextTaskDetail').textContent = `Última análise: ${new Date(analysis.date).toLocaleDateString('pt-PT')}.`;
    } else {
      $('nextTask').textContent = 'Primeira análise';
      $('nextTaskDetail').textContent = 'Ainda não existe uma análise registada.';
    }
  }

  function advancePlanStep() {
    PoolStore.update(state => {
      const plan = state.activePlan;
      if (!plan || plan.completed) return;
      plan.steps[plan.current].done = true;
      plan.current += 1;
      if (plan.current >= plan.steps.length) plan.completed = true;
    });
    renderAll();
    renderAssistant();
  }

  function openProductUse(step) {
    const product = PoolStore.get().products?.[step.productId];
    if (!product) {
      advancePlanStep();
      return;
    }
    pendingProductStep = step;
    const unitText = step.productUnit === 'kg'
      ? `${formatNumber(step.productAmount * 1000, 0)} g`
      : `${formatNumber(step.productAmount)} ${step.productUnit}`;
    $('productUseText').textContent = `${product.name}: ${unitText}. Quantidade atual: ${formatNumber(product.quantity)} ${product.unit}.`;
    $('productUseModal').classList.remove('hidden');
  }

  function closeProductUse() {
    $('productUseModal').classList.add('hidden');
    pendingProductStep = null;
  }

  function consumePendingProduct() {
    if (!pendingProductStep) return;
    const step = pendingProductStep;
    const currentProduct = PoolStore.get().products?.[step.productId];
    const used = Math.max(0, Number(step.productAmount) || 0);
    if (!currentProduct || Number(currentProduct.quantity) < used) {
      closeProductUse();
      renderAll();
      toast('A quantidade disponível já não é suficiente. Faça uma nova análise para recalcular o plano.');
      return;
    }
    PoolStore.update(state => {
      const product = state.products[step.productId];
      const before = Number(product.quantity) || 0;
      product.quantity = Number((before - used).toFixed(3));
      state.productHistory.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        date: new Date().toISOString(),
        productId: step.productId,
        productName: product.name,
        amount: used,
        unit: step.productUnit,
        before,
        after: product.quantity
      });
    });
    closeProductUse();
    advancePlanStep();
    toast('Quantidade do produto atualizada.');
  }

  function renderAssistant() {
    const plan = PoolStore.get().activePlan;
    const box = $('planCard');

    if (!plan) {
      $('assistantIntro').textContent = 'Faça uma análise para criar um plano.';
      box.innerHTML = '<div class="action-item"><span class="action-number">1</span><div><strong>Comece pela análise da água</strong><p>O PoolCheck criará a ordem correta das ações.</p></div></div><button class="primary full" id="assistantAnalyse">Analisar água</button>';
      $('assistantAnalyse').onclick = () => go('analysis');
      return;
    }

    if (plan.completed || plan.current >= plan.steps.length) {
      $('assistantIntro').textContent = 'Tratamento concluído.';
      box.innerHTML = '<div class="plan-step"><p class="eyebrow">Concluído</p><h2>Plano terminado</h2><p>Faça uma nova análise na data indicada para confirmar os resultados.</p><button class="primary full" id="finishPlan">Voltar ao estado</button></div>';
      $('finishPlan').onclick = () => {
        PoolStore.update(state => {
          state.lastCompletedPlan = state.activePlan;
          state.activePlan = null;
        });
        renderAll();
        go('today');
      };
      return;
    }

    const step = plan.steps[plan.current];
    const percentage = Math.round((plan.current / plan.steps.length) * 100);
    $('assistantIntro').textContent = 'Siga apenas esta instrução. O passo seguinte aparecerá depois.';

    const actionButtons = step.blocked
      ? `<button class="primary full" id="retestNow">${step.retest ? 'Fazer nova medição' : 'Voltar à análise'}</button><button class="secondary full" id="skipBlocked">Ignorar por agora</button>`
      : `<button class="primary full" id="completeStep">Concluído</button>${step.retest ? '<button class="secondary full" id="retestNow">Fazer nova medição</button>' : ''}`;

    box.innerHTML = `
      <div class="plan-step">
        <div class="plan-progress"><strong>Passo ${plan.current + 1} de ${plan.steps.length}</strong><span>${percentage}%</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${percentage}%"></div></div>
        ${step.slowOnly ? '<span class="alternative-pill">Correção gradual</span>' : ''}
        <p class="eyebrow">${escapeHtml(step.reason)}</p>
        <h2>${escapeHtml(step.title)}</h2>
        <div class="instruction ${step.blocked ? 'blocked-step' : ''}">${escapeHtml(step.instruction)}</div>
        ${step.noSwim ? '<p class="muted"><strong>Não utilize a piscina durante este período.</strong></p>' : ''}
        ${step.waitHours ? `<p class="muted">Depois de aplicar, aguarde aproximadamente ${formatNumber(step.waitHours)} horas.</p>` : ''}
        <div class="button-stack">${actionButtons}</div>
      </div>`;

    if ($('completeStep')) {
      $('completeStep').onclick = () => {
        if (step.productId && Number(step.productAmount) > 0) openProductUse(step);
        else advancePlanStep();
      };
    }
    if ($('retestNow')) $('retestNow').onclick = () => go('analysis');
    if ($('skipBlocked')) $('skipBlocked').onclick = advancePlanStep;
  }

  function renderProducts() {
    const state = PoolStore.get();
    const products = Object.values(state.products || {});
    const categories = [...new Set(products.map(product => product.category))];
    const activeCount = products.filter(product => product.enabled).length;
    if ($('productsCount')) $('productsCount').textContent = `${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}`;

    if (!$('productsList')) return;
    $('productsList').innerHTML = categories.map(category => {
      const categoryProducts = products.filter(product => product.category === category);
      return `
        <section class="product-category">
          <h3>${escapeHtml(category)}</h3>
          ${categoryProducts.map(product => `
            <div class="product-item ${product.enabled ? 'enabled' : ''}">
              <label class="product-main">
                <input type="checkbox" data-product-enabled="${escapeHtml(product.id)}" ${product.enabled ? 'checked' : ''}>
                <span class="product-copy">
                  <strong>${escapeHtml(product.name)}</strong>
                  <small>${product.enabled ? 'Disponível' : 'Não disponível'}</small>
                </span>
              </label>
              <label class="product-quantity">
                <input type="number" min="0" step="${product.step || 0.1}" value="${Number(product.quantity) || 0}" data-product-quantity="${escapeHtml(product.id)}" aria-label="Quantidade de ${escapeHtml(product.name)}">
                <span>${escapeHtml(product.unit)}</span>
              </label>
            </div>`).join('')}
        </section>`;
    }).join('');

    document.querySelectorAll('[data-product-enabled]').forEach(input => {
      input.onchange = () => {
        PoolStore.update(current => {
          const product = current.products[input.dataset.productEnabled];
          if (product) product.enabled = input.checked;
        });
        renderProducts();
        toast(input.checked ? 'Produto ativado.' : 'Produto desativado.');
      };
    });

    document.querySelectorAll('[data-product-quantity]').forEach(input => {
      input.onchange = () => {
        PoolStore.update(current => {
          const product = current.products[input.dataset.productQuantity];
          if (product) product.quantity = Math.max(0, Number(input.value) || 0);
        });
        renderProducts();
        toast('Quantidade atualizada.');
      };
    });
  }

  function openWaterTopUp() {
    const state = PoolStore.get();
    $('waterTopUpForm').classList.remove('hidden');
    $('waterTopUpResult').classList.add('hidden');
    $('waterTopUpForm').reset();
    $('waterTopUpArea').value = state.pool.surfaceArea || '';
    $('waterTopUpReason').value = 'evaporation';
    $('waterTopUpPreview').textContent = state.pool.surfaceArea
      ? 'Indique os centímetros adicionados para calcular a reposição.'
      : 'Indique os centímetros e a área da superfície da piscina.';
    $('waterTopUpModal').classList.remove('hidden');
    window.setTimeout(() => $('waterTopUpCm').focus(), 50);
  }

  function closeWaterTopUp() {
    $('waterTopUpModal').classList.add('hidden');
  }

  function waterInputValues() {
    return {
      centimetres: Number($('waterTopUpCm').value),
      surfaceArea: Number($('waterTopUpArea').value),
      reason: $('waterTopUpReason').value
    };
  }

  function updateWaterTopUpPreview() {
    const values = waterInputValues();
    if (!values.centimetres || !values.surfaceArea) {
      $('waterTopUpPreview').textContent = 'Indique os centímetros e a área para estimar a água adicionada.';
      return;
    }
    try {
      const state = PoolStore.get();
      const result = PoolWater.calculate({
        ...values,
        poolVolume: state.pool.volume,
        pool: state.pool,
        latestAnalysis: latest(),
        history: state.waterTopUps
      });
      $('waterTopUpPreview').innerHTML = `<strong>${escapeHtml(PoolWater.formatSummary(result))}</strong><span>${escapeHtml(result.title)}. Não será calculada nenhuma dose automática.</span>`;
    } catch (error) {
      $('waterTopUpPreview').textContent = error.message;
    }
  }

  function renderWaterTopUpResult(result) {
    const warnings = Array.isArray(result.warnings) ? result.warnings : [];
    const instructions = Array.isArray(result.instructions) ? result.instructions : [];
    const warningHtml = warnings.length
      ? `<div class="water-warnings">${warnings.map(warning => `<p>${escapeHtml(warning)}</p>`).join('')}</div>`
      : '';
    $('waterTopUpForm').classList.add('hidden');
    $('waterTopUpResult').classList.remove('hidden');
    $('waterTopUpResult').innerHTML = `
      <div class="water-result-header ${escapeHtml(result.level)}">
        <span>${result.level === 'major' ? '!' : '✓'}</span>
        <div><p class="eyebrow">${escapeHtml(result.title)}</p><h2>${formatNumber(result.litres, 0)} litros</h2><small>${formatNumber(result.percentage)}% do volume da piscina</small></div>
      </div>
      <p>${escapeHtml(result.causeMessage)}</p>
      <div class="water-instructions">
        ${instructions.map((instruction, index) => `<div><span>${index + 1}</span><p>${escapeHtml(instruction)}</p></div>`).join('')}
      </div>
      ${warningHtml}
      <div class="button-stack">
        <button class="primary full" id="waterAnalyseNow">Fazer nova análise</button>
        <button class="secondary full" id="waterCloseResult">Fechar</button>
      </div>`;
    $('waterAnalyseNow').onclick = () => {
      closeWaterTopUp();
      go('analysis');
      openAnalysis(false);
    };
    $('waterCloseResult').onclick = closeWaterTopUp;
  }

  function saveWaterTopUp(event) {
    event.preventDefault();
    const state = PoolStore.get();
    try {
      const values = waterInputValues();
      const result = PoolWater.calculate({
        ...values,
        poolVolume: state.pool.volume,
        pool: state.pool,
        latestAnalysis: latest(),
        history: state.waterTopUps
      });
      const entry = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        date: result.createdAt,
        ...result
      };
      PoolStore.update(current => {
        current.waterTopUps.unshift(entry);
        current.pool.surfaceArea = values.surfaceArea;
      });
      renderAll();
      renderWaterTopUpResult(entry);
      toast('Reposição registada.');
    } catch (error) {
      toast(error.message || 'Não foi possível calcular a reposição.');
    }
  }

  function renderWaterTopUps() {
    const state = PoolStore.get();
    const entries = state.waterTopUps || [];
    const latestEntry = entries[0];

    if ($('waterTopUpToday')) {
      $('waterTopUpToday').innerHTML = latestEntry
        ? `<div class="water-latest"><div><strong>${formatNumber(latestEntry.litres, 0)} L adicionados</strong><small>${escapeHtml(latestEntry.reasonLabel || PoolWater.reasons[latestEntry.reason] || 'Reposição')} · ${formatDate(latestEntry.date)}</small></div><span>${formatNumber(latestEntry.percentage)}%</span></div><p>Depois da circulação, confirme o cloro livre e o pH antes de adicionar produtos.</p><button class="secondary full" data-water-analysis>Fazer análise</button>`
        : '<div class="water-empty"><strong>Sem reposições registadas</strong><p>Ao acrescentar água, registe os centímetros para receber a recomendação adequada.</p></div>';
    }

    if ($('waterTopUpHistory')) {
      $('waterTopUpHistory').innerHTML = entries.length
        ? entries.slice(0, 10).map(entry => `
          <div class="history-item water-history-item">
            <div><strong>${formatNumber(entry.litres, 0)} L · ${formatNumber(entry.percentage)}%</strong><small>${escapeHtml(entry.reasonLabel || PoolWater.reasons[entry.reason] || 'Reposição')} · ${formatDate(entry.date)}</small></div>
            <span class="water-level-badge ${escapeHtml(entry.level)}">${entry.level === 'major' ? 'Significativa' : entry.level === 'partial' ? 'Relevante' : 'Pequena'}</span>
          </div>`).join('')
        : '<p class="muted">Ainda não existem reposições registadas.</p>';
    }

    document.querySelectorAll('[data-water-analysis]').forEach(button => {
      button.onclick = () => {
        go('analysis');
        openAnalysis(false);
      };
    });
  }

  function renderDetails() {
    const state = PoolStore.get();
    const pool = state.pool;
    const coverNames = {
      none: 'Sem cobertura',
      bubble: 'Manta de bolhas',
      bars: 'Cobertura de barras',
      automatic: 'Cobertura automática',
      shelter: 'Abrigo'
    };

    $('poolSummary').innerHTML = [
      ['Nome', pool.name],
      ['Tipo', label(pool.type)],
      ['Volume', `${formatNumber(pool.volume)} m³`],
      ['Área da superfície', pool.surfaceArea ? `${formatNumber(pool.surfaceArea)} m²` : 'Não definida'],
      ['Tratamento', label(pool.treatment)],
      ['Maior filtração', `A partir de ${formatNumber(pool.highTempThreshold, 0)} °C`],
      ['Cobertura', coverNames[pool.coverType] || (pool.hasCover ? 'Sim' : 'Não')]
    ].map(item => `<div class="summary-item"><span>${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong></div>`).join('');

    const analysis = latest();
    $('technicalValues').innerHTML = analysis
      ? [
          ['pH', analysis.ph],
          ['Cloro livre', `${analysis.freeChlorine} ppm`],
          ['Alcalinidade', `${analysis.alkalinity} ppm`],
          ['Temperatura', analysis.waterTemp ? `${analysis.waterTemp} °C` : 'Não registada'],
          ['Cloro total', analysis.totalChlorine ?? 'Não registado'],
          ['Estabilizador', analysis.cya ?? 'Não registado']
        ].map(item => `<div class="technical-item"><span>${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong></div>`).join('')
      : '<p class="muted">Ainda não existem valores.</p>';

    $('historyList').innerHTML = state.analyses.length
      ? state.analyses.slice(0, 10).map(item => {
          const result = resultFor(item);
          return `<div class="history-item"><strong>${escapeHtml(result.label)}</strong><small>${formatDate(item.date)}</small></div>`;
        }).join('')
      : '<p class="muted">Ainda não existe histórico.</p>';

    renderProducts();
    renderWaterTopUps();
    renderWeather();
  }

  function label(value) {
    return ({
      enterrada: 'Enterrada',
      elevada: 'Elevada',
      spa: 'Spa',
      cloro: 'Cloro',
      sal: 'Sal',
      bromo: 'Bromo'
    })[value] || value;
  }

  function renderAll() {
    normaliseMaintenance();
    renderToday();
    renderDetails();
    renderWeather();
    renderMaintenance();
    renderProducts();
    renderWaterTopUps();
    if ($('notificationBtn')) {
      $('notificationBtn').textContent = PoolStore.get().notificationsEnabled ? 'Lembrete ativo' : 'Ativar lembrete';
    }
  }

  function openAnalysis(photo) {
    $('analysisFormCard').classList.remove('hidden');
    $('photoField').classList.toggle('hidden', !photo);
    $('analysisFormCard').scrollIntoView({ behavior: 'smooth' });
  }

  if ($('updateWeatherBtn')) $('updateWeatherBtn').onclick = () => updateWeather(false);
  if ($('weatherEnabled')) {
    $('weatherEnabled').onchange = event => {
      PoolStore.update(state => { state.weather.enabled = event.target.checked; });
      renderAll();
      if (event.target.checked) updateWeather(false);
    };
  }
  if ($('weatherAutoTasks')) {
    $('weatherAutoTasks').onchange = event => {
      PoolStore.update(state => { state.weather.autoTasks = event.target.checked; });
    };
  }
  $('notificationBtn').onclick = enableNotifications;

  if ($('manageMaintenanceBtn')) {
    $('manageMaintenanceBtn').onclick = () => {
      go('details');
      window.setTimeout(() => $('maintenanceSettingsList')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    };
  }

  document.querySelectorAll('[data-close-maintenance]').forEach(element => {
    element.onclick = closeMaintenanceEditor;
  });

  $('maintenanceIntervalValue').oninput = updateMaintenancePreview;
  $('maintenanceIntervalUnit').onchange = updateMaintenancePreview;
  $('maintenanceForm').onsubmit = event => {
    event.preventDefault();
    const id = $('maintenanceTaskId').value;
    const intervalValue = Math.max(1, Number($('maintenanceIntervalValue').value) || 1);
    const intervalUnit = $('maintenanceIntervalUnit').value;
    PoolStore.update(state => {
      const task = state.maintenance.find(item => item.id === id);
      if (!task) return;
      task.title = $('maintenanceTitle').value.trim();
      task.enabled = $('maintenanceEnabled').checked;
      task.intervalValue = intervalValue;
      task.intervalUnit = intervalUnit;
      task.intervalDays = taskIntervalDays(task);
    });
    closeMaintenanceEditor();
    renderAll();
    toast('Recorrência atualizada.');
  };

  $('photoAnalysisBtn').onclick = () => openAnalysis(true);
  $('manualAnalysisBtn').onclick = () => openAnalysis(false);
  $('closeAnalysisForm').onclick = () => $('analysisFormCard').classList.add('hidden');

  $('analysisForm').onsubmit = event => {
    event.preventDefault();
    const analysis = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      date: new Date().toISOString(),
      ph: Number($('ph').value),
      freeChlorine: Number($('freeChlorine').value),
      alkalinity: Number($('alkalinity').value),
      waterTemp: $('waterTemp').value ? Number($('waterTemp').value) : null,
      totalChlorine: $('totalChlorine').value ? Number($('totalChlorine').value) : null,
      cya: $('cya').value ? Number($('cya').value) : null,
      hardness: $('hardness').value ? Number($('hardness').value) : null,
      notes: $('analysisNotes').value
    };
    const result = PoolChemistry.analyse(analysis, PoolStore.get().pool, PoolStore.get().products);
    PoolStore.update(state => {
      state.analyses.unshift(analysis);
      state.activePlan = PoolChemistry.planFrom(result);
    });
    event.target.reset();
    $('analysisFormCard').classList.add('hidden');
    renderAll();
    toast('Análise guardada e plano criado.');
    go('assistant');
  };

  $('editPoolBtn').onclick = () => {
    const pool = PoolStore.get().pool;
    $('poolForm').classList.toggle('hidden');
    $('poolName').value = pool.name;
    $('poolType').value = pool.type;
    $('poolVolume').value = pool.volume;
    $('poolSurfaceArea').value = pool.surfaceArea || '';
    $('treatmentType').value = pool.treatment;
    $('highTempThreshold').value = pool.highTempThreshold;
    $('coverType').value = pool.coverType || (pool.hasCover ? 'bubble' : 'none');
    $('coverUsage').value = pool.coverUsage || 'usually';
  };

  $('poolForm').onsubmit = event => {
    event.preventDefault();
    const coverType = $('coverType').value;
    PoolStore.update(state => {
      state.pool = {
        ...state.pool,
        name: $('poolName').value,
        type: $('poolType').value,
        volume: Number($('poolVolume').value),
        surfaceArea: $('poolSurfaceArea').value ? Number($('poolSurfaceArea').value) : null,
        treatment: $('treatmentType').value,
        highTempThreshold: Number($('highTempThreshold').value) || 28,
        hasCover: coverType !== 'none',
        coverType,
        coverUsage: $('coverUsage').value
      };
    });
    $('poolForm').classList.add('hidden');
    renderAll();
    toast('Perfil atualizado.');
  };

  $('toggleTechnical').onclick = () => {
    const element = $('technicalValues');
    element.classList.toggle('hidden');
    $('toggleTechnical').textContent = element.classList.contains('hidden') ? 'Mostrar' : 'Ocultar';
  };

  $('exportBtn').onclick = () => {
    const blob = new Blob([PoolStore.export()], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'poolcheck-v3-dados.json';
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  $('importFile').onchange = async event => {
    try {
      PoolStore.replace(JSON.parse(await event.target.files[0].text()));
      renderAll();
      toast('Dados importados.');
    } catch (error) {
      toast('Não foi possível importar o ficheiro.');
    }
  };

  $('resetBtn').onclick = () => {
    if (confirm('Apagar todos os dados e reiniciar a aplicação?')) {
      PoolStore.reset();
      location.reload();
    }
  };

  if ($('openWaterTopUpBtn')) $('openWaterTopUpBtn').onclick = openWaterTopUp;
  if ($('openWaterTopUpDetailsBtn')) $('openWaterTopUpDetailsBtn').onclick = openWaterTopUp;
  document.querySelectorAll('[data-close-water-topup]').forEach(element => {
    element.onclick = closeWaterTopUp;
  });
  $('waterTopUpCm').oninput = updateWaterTopUpPreview;
  $('waterTopUpArea').oninput = updateWaterTopUpPreview;
  $('waterTopUpReason').onchange = updateWaterTopUpPreview;
  $('waterTopUpForm').onsubmit = saveWaterTopUp;

  document.querySelectorAll('[data-close-product-use]').forEach(element => {
    element.onclick = closeProductUse;
  });
  $('confirmProductUse').onclick = consumePendingProduct;
  $('skipProductUse').onclick = () => {
    closeProductUse();
    advancePlanStep();
  };

  const steps = [
    { title: 'Bem-vindo ao PoolCheck', text: 'Vamos configurar a sua piscina. Demora cerca de 2 minutos.', type: 'intro' },
    { title: 'Que piscina tem?', key: 'type', options: [['enterrada', 'Enterrada'], ['elevada', 'Elevada'], ['spa', 'Spa']] },
    { title: 'Qual é o volume?', key: 'volume', input: 'number', placeholder: '36', label: 'Volume da piscina', suffix: 'm³' },
    { title: 'Qual é a área da superfície?', key: 'surfaceArea', input: 'number', placeholder: '24', label: 'Área da superfície', suffix: 'm²', optional: true },
    { title: 'Como trata a água?', key: 'treatment', options: [['cloro', 'Cloro'], ['sal', 'Sal'], ['bromo', 'Bromo']] },
    { title: 'Tudo pronto', text: 'Agora faça a primeira análise para saber se a piscina está pronta.', type: 'finish' }
  ];

  function renderOnboarding() {
    const step = steps[onboardingStep];
    $('onboardingProgress').textContent = `${onboardingStep + 1} de ${steps.length}`;
    let body = `<div class="onboarding-panel"><p class="eyebrow">Configuração inicial</p><h1>${escapeHtml(step.title)}</h1>${step.text ? `<p class="muted">${escapeHtml(step.text)}</p>` : ''}`;

    if (step.options) {
      body += `<div class="option-list">${step.options.map(option => `<button class="option-button ${onboardingDraft[step.key] === option[0] ? 'selected' : ''}" data-value="${escapeHtml(option[0])}">${escapeHtml(option[1])}</button>`).join('')}</div>`;
    }

    if (step.input) {
      body += `<label>${escapeHtml(step.label || 'Valor')} ${step.optional ? '<small>(opcional)</small>' : ''}<input id="onboardingInput" type="${step.input}" min="1" step="0.1" placeholder="${escapeHtml(step.placeholder)}" value="${escapeHtml(onboardingDraft[step.key] || '')}"></label>`;
    }

    body += `<div class="onboarding-actions">${onboardingStep ? '<button id="onboardingBack" class="secondary">Anterior</button>' : '<span></span>'}<button id="onboardingNext" class="primary">${step.type === 'finish' ? 'Começar análise' : 'Continuar'}</button></div></div>`;
    $('onboardingContent').innerHTML = body;

    document.querySelectorAll('.option-button').forEach(button => {
      button.onclick = () => {
        onboardingDraft[step.key] = button.dataset.value;
        renderOnboarding();
      };
    });

    if ($('onboardingBack')) {
      $('onboardingBack').onclick = () => {
        onboardingStep -= 1;
        renderOnboarding();
      };
    }

    $('onboardingNext').onclick = () => {
      if (step.input) {
        const value = Number($('onboardingInput').value);
        if (!value && !step.optional) {
          toast('Indique o valor solicitado.');
          return;
        }
        onboardingDraft[step.key] = value || null;
      }
      if (step.options && !onboardingDraft[step.key]) {
        toast('Selecione uma opção.');
        return;
      }
      if (step.type === 'finish') {
        PoolStore.update(state => {
          state.onboardingComplete = true;
          state.pool = { ...state.pool, ...onboardingDraft };
        });
        $('onboarding').classList.add('hidden');
        document.querySelector('.bottom-nav').classList.remove('hidden');
        renderAll();
        go('analysis');
      } else {
        onboardingStep += 1;
        renderOnboarding();
      }
    };
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstall = event;
    $('installBtn').classList.remove('hidden');
  });

  $('installBtn').onclick = async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    deferredInstall = null;
    $('installBtn').classList.add('hidden');
  };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

  refreshWeatherInBackground();
  checkMaintenanceNotification();

  if (!PoolStore.get().onboardingComplete) {
    screens.forEach(screen => screen.classList.remove('active'));
    $('onboarding').classList.remove('hidden');
    $('onboarding').classList.add('active');
    document.querySelector('.bottom-nav').classList.add('hidden');
    renderOnboarding();
  } else {
    renderAll();
  }
})();
