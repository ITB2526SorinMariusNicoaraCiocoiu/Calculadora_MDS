/* ════════════════════════════════════════════════════
   ITB — Calculadora d'Estalvi Energètic
   script.js · ASIXc1A · 2024–2025
   Sorin Nicoara & Maximilian Rogespier
════════════════════════════════════════════════════ */

// ── DADES BASE (extretes de dataclean.json / ITB Leaks) ──────────────────────
const DATA = {
  electric: {
    annual: 234341,           // kWh/any (font: notes projecte estudiants)
    schoolRatio: 0.85,        // 85% del consum és en mesos lectius
    monthlyFactor: [          // Set Oct Nov Des Gen Feb Mar Abr Mai Jun Jul Ago
      1.05, 1.15, 1.30, 1.40, 1.40, 1.25, 1.10, 0.95, 0.90, 0.95, 0.55, 0.50
    ]
  },
  water: {
    annualM3: 2360,           // m³/any (extret de lectures horaries: 8100L/dia lectiu)
    schoolRatio: 0.823,
    monthlyFactor: [          // Set Oct Nov Des Gen Feb Mar Abr Mai Jun Jul Ago
      1.05, 1.00, 0.95, 0.90, 0.85, 0.90, 1.00, 1.10, 1.15, 1.10, 0.75, 0.60
    ],
    hourlyReal: {             // Litres/hora del 28/02/2024 (dia lectiu real — ITB Leaks)
      hours: ['00h','01h','02h','03h','04h','05h','06h','07h','08h','09h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h','20h','21h','22h','23h'],
      values: [205,154,130,140,155,158,158,158,275,278,455,440,390,470,500,445,400,400,530,450,410,325,170,250]
    }
  },
  supplies: {
    annual: 800,             // € /any (extrapolació de 665,83€ ABR–NOV 2024)
    schoolRatio: 0.875,
    monthlyFactor: [         // Set Oct Nov Des Gen Feb Mar Abr Mai Jun Jul Ago
      1.30, 1.20, 1.10, 0.90, 1.00, 1.00, 1.05, 1.10, 1.10, 0.95, 0.20, 0.10
    ]
  },
  cleaning: {
    annual: 1200,            // € /any (extrapolació de 995,85€ MAI–JUN 2024)
    schoolRatio: 0.875,
    monthlyFactor: [         // Set Oct Nov Des Gen Feb Mar Abr Mai Jun Jul Ago
      1.20, 1.10, 1.05, 1.00, 1.00, 1.00, 1.05, 1.10, 1.20, 1.10, 0.60, 0.50
    ]
  }
};

const MONTHS = ['Set','Oct','Nov','Des','Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago'];
const MONTHS_FULL = ['Setembre','Octubre','Novembre','Desembre','Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost'];
const REDUCTION_RATE = 0.112; // Taxa anual per arribar a -30% en 3 anys: 1-(1-0.3)^(1/3)

// ── UTILITATS ────────────────────────────────────────────────────────────────
function calcMonthly(base, factors) {
  const sum = factors.reduce((a, b) => a + b, 0);
  return factors.map(f => parseFloat(((base * f) / sum * 12).toFixed(1)));
}

function calcSchoolPeriod(base, factors) {
  // Setembre (índex 0) fins a Juny (índex 9)
  const schoolFactors = factors.slice(0, 10);
  const totalFactors = factors.reduce((a, b) => a + b, 0);
  return schoolFactors.reduce((acc, f) => acc + (base * f / totalFactors * 12), 0);
}

function applyReduction(values, rate = 0.30) {
  return values.map(v => parseFloat((v * (1 - rate)).toFixed(1)));
}

function fmt(n) {
  return Math.round(n).toLocaleString('ca-ES');
}

// ── CHART DEFAULT CONFIG ──────────────────────────────────────────────────────
Chart.defaults.color = '#8b949e';
Chart.defaults.borderColor = '#30363d';
Chart.defaults.font.family = "'Outfit', sans-serif";

function baseChartOptions(yLabel = '') {
  return {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c2230',
        borderColor: '#30363d',
        borderWidth: 1,
        titleColor: '#e6edf3',
        bodyColor: '#8b949e',
        padding: 12,
        callbacks: {
          label: ctx => ` ${ctx.parsed.y.toLocaleString('ca-ES')} ${yLabel}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(48,54,61,0.5)' },
        ticks: { font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(48,54,61,0.5)' },
        ticks: { font: { size: 11 } }
      }
    }
  };
}

// ── CHARTS ───────────────────────────────────────────────────────────────────
let charts = {};

function buildElectricChart() {
  const monthly = calcMonthly(DATA.electric.annual, DATA.electric.monthlyFactor);
  const improved = applyReduction(monthly);

  const ctx = document.getElementById('chart-electric').getContext('2d');
  charts.electric = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Any actual',
          data: monthly,
          backgroundColor: 'rgba(0,230,118,0.7)',
          borderColor: '#00e676',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Amb millores (-30%)',
          data: improved,
          backgroundColor: 'rgba(255,107,53,0.6)',
          borderColor: '#ff6b35',
          borderWidth: 1,
          borderRadius: 4,
          hidden: true
        }
      ]
    },
    options: {
      ...baseChartOptions('kWh'),
      plugins: {
        ...baseChartOptions('kWh').plugins,
        legend: {
          display: true,
          labels: { color: '#8b949e', font: { size: 11 }, padding: 20, usePointStyle: true }
        }
      }
    }
  });
}

function buildWaterHourlyChart() {
  const { hours, values } = DATA.water.hourlyReal;
  const ctx = document.getElementById('chart-water-hourly').getContext('2d');
  charts.waterHourly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours,
      datasets: [{
        label: 'Litres/hora',
        data: values,
        backgroundColor: values.map(v =>
          v >= 400 ? 'rgba(244,67,54,0.7)' :
          v >= 250 ? 'rgba(255,202,40,0.7)' :
          'rgba(41,182,246,0.7)'
        ),
        borderColor: values.map(v =>
          v >= 400 ? '#f44336' : v >= 250 ? '#ffca28' : '#29b6f6'
        ),
        borderWidth: 1,
        borderRadius: 3
      }]
    },
    options: {
      ...baseChartOptions('L'),
      plugins: {
        ...baseChartOptions('L').plugins,
        tooltip: {
          ...baseChartOptions('L').plugins.tooltip,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} litres`,
            afterLabel: ctx => ctx.parsed.y >= 400 ? '⚠️ Consum elevat' : ctx.parsed.y >= 250 ? '⚡ Consum moderat' : '✓ Consum normal'
          }
        }
      }
    }
  });
}

function buildWaterMonthlyChart() {
  const monthly = calcMonthly(DATA.water.annualM3, DATA.water.monthlyFactor);
  const improved = applyReduction(monthly);
  const ctx = document.getElementById('chart-water-monthly').getContext('2d');
  charts.waterMonthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Any actual',
          data: monthly,
          borderColor: '#29b6f6',
          backgroundColor: 'rgba(41,182,246,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#29b6f6',
          pointRadius: 4
        },
        {
          label: 'Amb millores (-30%)',
          data: improved,
          borderColor: '#ff7043',
          backgroundColor: 'rgba(255,112,67,0.08)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ff7043',
          pointRadius: 4,
          hidden: true
        }
      ]
    },
    options: {
      ...baseChartOptions('m³'),
      plugins: {
        ...baseChartOptions('m³').plugins,
        legend: {
          display: true,
          labels: { color: '#8b949e', font: { size: 11 }, padding: 20, usePointStyle: true }
        }
      }
    }
  });
}

function buildSuppliesChart() {
  const monthly = calcMonthly(DATA.supplies.annual, DATA.supplies.monthlyFactor);
  const ctx = document.getElementById('chart-supplies').getContext('2d');
  charts.supplies = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [{
        label: '€ consumibles',
        data: monthly,
        backgroundColor: monthly.map(v =>
          v > 100 ? 'rgba(255,202,40,0.8)' :
          v > 60  ? 'rgba(255,202,40,0.5)' :
          'rgba(255,202,40,0.2)'
        ),
        borderColor: '#ffca28',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: baseChartOptions('€')
  });
}

function buildCleaningChart() {
  const monthly = calcMonthly(DATA.cleaning.annual, DATA.cleaning.monthlyFactor);
  const ctx = document.getElementById('chart-cleaning').getContext('2d');
  charts.cleaning = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [{
        label: '€ neteja',
        data: monthly,
        backgroundColor: 'rgba(255,112,67,0.6)',
        borderColor: '#ff7043',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: baseChartOptions('€')
  });
}

function buildProjectionChart() {
  const years = ['2025', '2026', '2027', '2028'];
  const electric  = [234341, 207880, 184628, 164039];
  const water     = [2360,   2095,   1861,   1652];
  // Normalitzem a % per comparar
  const eNorm = electric.map(v => parseFloat((v / 234341 * 100).toFixed(1)));
  const wNorm = water.map(v => parseFloat((v / 2360 * 100).toFixed(1)));

  const ctx = document.getElementById('chart-projection').getContext('2d');
  charts.projection = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Electricitat (% del valor base)',
          data: eNorm,
          borderColor: '#00e676',
          backgroundColor: 'rgba(0,230,118,0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#00e676',
          pointRadius: 6
        },
        {
          label: 'Aigua (% del valor base)',
          data: wNorm,
          borderColor: '#29b6f6',
          backgroundColor: 'rgba(41,182,246,0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#29b6f6',
          pointRadius: 6
        },
        {
          label: 'Objectiu -30%',
          data: [100, 100, 100, 70],
          borderColor: 'rgba(244,67,54,0.5)',
          borderWidth: 1.5,
          borderDash: [8, 4],
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      ...baseChartOptions('%'),
      plugins: {
        ...baseChartOptions('%').plugins,
        legend: {
          display: true,
          labels: { color: '#8b949e', font: { size: 11 }, padding: 20, usePointStyle: true }
        },
        tooltip: {
          backgroundColor: '#1c2230',
          borderColor: '#30363d',
          borderWidth: 1,
          titleColor: '#e6edf3',
          bodyColor: '#8b949e',
          padding: 12,
          callbacks: {
            label: ctx => {
              if (ctx.dataset.label.includes('Objectiu')) return ` Objectiu: 70%`;
              const idx = ctx.dataIndex;
              if (ctx.dataset.label.includes('Electricitat')) {
                return ` ${ctx.parsed.y.toFixed(1)}% = ${fmt(electric[idx])} kWh`;
              }
              return ` ${ctx.parsed.y.toFixed(1)}% = ${fmt(water[idx])} m³`;
            }
          }
        }
      },
      scales: {
        ...baseChartOptions('%').scales,
        y: {
          ...baseChartOptions('%').scales.y,
          min: 60,
          max: 105,
          ticks: { callback: v => v + '%', font: { size: 11 } }
        }
      }
    }
  });
}

// ── TABS ─────────────────────────────────────────────────────────────────────
function initTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById('tab-' + btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ── IMPROVEMENT TOGGLES ───────────────────────────────────────────────────────
function initToggles() {
  const toggles = document.querySelectorAll('.improvement-toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('change', e => {
      const active = e.target.checked;
      const tab = e.target.id.replace('toggle-', '');
      updateCalculations(tab, active);
    });
  });
}

function updateCalculations(tab, improved) {
  const R = 0.30;
  const vals = {
    electric:  { c1: 234341, c2: Math.round(calcSchoolPeriod(234341, DATA.electric.monthlyFactor)) },
    water:     { c3: 2360,   c4: Math.round(calcSchoolPeriod(DATA.water.annualM3, DATA.water.monthlyFactor)) },
    supplies:  { c5: 800,    c6: Math.round(calcSchoolPeriod(DATA.supplies.annual, DATA.supplies.monthlyFactor)) },
    cleaning:  { c7: 1200,   c8: Math.round(calcSchoolPeriod(DATA.cleaning.annual, DATA.cleaning.monthlyFactor)) }
  };

  const map = {
    electric: ['c1', 'c2'],
    water:    ['c3', 'c4'],
    supplies: ['c5', 'c6'],
    cleaning: ['c7', 'c8']
  };

  map[tab]?.forEach(id => {
    const base = Object.values(vals[tab])[map[tab].indexOf(id)];
    const el = document.getElementById(id + '-val');
    const saving = document.getElementById(id + '-saving');
    if (el) el.textContent = improved ? fmt(Math.round(base * (1 - R))) : fmt(base);
    if (saving) saving.classList.toggle('hidden', !improved);
  });

  // Sync charts
  if (tab === 'electric' && charts.electric) {
    charts.electric.data.datasets[1].hidden = !improved;
    charts.electric.update();
  }
  if (tab === 'water' && charts.waterMonthly) {
    charts.waterMonthly.data.datasets[1].hidden = !improved;
    charts.waterMonthly.update();
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Precalculate school period values
  const c2base = Math.round(calcSchoolPeriod(DATA.electric.annual, DATA.electric.monthlyFactor));
  const c4base = Math.round(calcSchoolPeriod(DATA.water.annualM3, DATA.water.monthlyFactor));
  const c6base = Math.round(calcSchoolPeriod(DATA.supplies.annual, DATA.supplies.monthlyFactor));
  const c8base = Math.round(calcSchoolPeriod(DATA.cleaning.annual, DATA.cleaning.monthlyFactor));

  document.getElementById('c2-val').textContent = fmt(c2base);
  document.getElementById('c4-val').textContent = fmt(c4base);
  document.getElementById('c6-val').textContent = fmt(c6base);
  document.getElementById('c8-val').textContent = fmt(c8base);

  // Update save values
  document.getElementById('c2-save-val').textContent = fmt(Math.round(c2base * 0.7));
  document.getElementById('c4-save-val').textContent = fmt(Math.round(c4base * 0.7));
  document.getElementById('c6-save-val').textContent = fmt(Math.round(c6base * 0.7));
  document.getElementById('c8-save-val').textContent = fmt(Math.round(c8base * 0.7));

  initTabs();
  initToggles();
  buildElectricChart();
  buildWaterHourlyChart();
  buildWaterMonthlyChart();
  buildSuppliesChart();
  buildCleaningChart();
  buildProjectionChart();

  console.log(`
  ╔══════════════════════════════════════╗
  ║  ITB — Calculadora Estalvi Energètic ║
  ║  ASIXc1A · Nicoara & Rogespier       ║
  ╚══════════════════════════════════════╝
  Dades carregades: 8 càlculs actius.
  Reducció anual necessària: ${(REDUCTION_RATE * 100).toFixed(1)}%/any
  per arribar al -30% en 3 anys.
  `);

  // ── CALCULADORA INTERACTIVA ──────────────────────────────────
  document.querySelectorAll('.calc-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.calc-period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});

// ══════════════════════════════════════════════════════════════
//  CALCULADORA INTERACTIVA — lògica de càlcul
// ══════════════════════════════════════════════════════════════

function getCalcPeriod() {
  const btn = document.querySelector('.calc-period-btn.active');
  return btn ? btn.dataset.period : 'mes';
}

function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toFixed(1);
}

function fmtEur(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toFixed(0);
}

function gv(id) { return parseFloat(document.getElementById(id).value) || 0; }

function runCalc() {
  const period = getCalcPeriod();
  const mult   = period === 'mes' ? 1 : period === 'curs' ? 9 : 12;
  const season = parseFloat(document.getElementById('ci_e_estacio').value) || 1.0;

  // --- inputs ---
  const eKwhMes = gv('ci_e_kwh');
  const ePreu   = gv('ci_e_preu') || 0.18;
  const eSup    = gv('ci_e_sup')  || 1;
  const eRed    = gv('ci_e_red')  / 100;

  const wM3Mes  = gv('ci_w_m3');
  const wPreu   = gv('ci_w_preu') || 2.50;
  const wRed    = gv('ci_w_red')  / 100;

  const cCostMes = gv('ci_c_cost');
  const cRed     = gv('ci_c_red') / 100;

  const nCostMes = gv('ci_n_cost');
  const nRed     = gv('ci_n_red') / 100;

  // --- totals per període ---
  const eKwh  = eKwhMes  * mult * season;
  const eCost = eKwh     * ePreu;
  const wM3   = wM3Mes   * mult;
  const wCost = wM3      * wPreu;
  const cCost = cCostMes * mult;
  const nCost = nCostMes * mult;
  const total = eCost + wCost + cCost + nCost;

  // --- savings ---
  const saving = eCost * eRed + wCost * wRed + cCost * cRed + nCost * nRed;

  // --- CO2 ---
  const co2 = eKwh * 0.321;

  // --- efficiency kWh/m²/mes ---
  const effRatio = eKwhMes / eSup;
  let effLabel;
  if      (effRatio < 5)  effLabel = 'Classe A — excel·lent';
  else if (effRatio < 10) effLabel = 'Classe B — bo';
  else if (effRatio < 20) effLabel = 'Classe C — millorable';
  else                    effLabel = 'Classe D — crític';

  const periodLabel = { mes: 'Mes', curs: 'Curs lectiu (9 mesos)', any: 'Any complet' }[period];

  // --- update DOM ---
  document.getElementById('cr_kwh').textContent   = eKwhMes > 0 ? fmtNum(eKwh) : '—';
  document.getElementById('cr_kwh_u').textContent  = 'kWh · ' + periodLabel;
  document.getElementById('cr_kwh_d').textContent  = eKwhMes > 0
    ? `${fmtEur(eCost)} € | ${fmtNum(effRatio)} kWh/m²/mes → ${effLabel}` : '';

  document.getElementById('cr_m3').textContent   = wM3Mes > 0 ? fmtNum(wM3) : '—';
  document.getElementById('cr_m3_u').textContent  = 'm³ · ' + periodLabel;
  document.getElementById('cr_m3_d').textContent  = wM3Mes > 0 ? `${fmtEur(wCost)} €` : '';

  document.getElementById('cr_co2').textContent   = eKwhMes > 0 ? fmtNum(co2) : '—';
  document.getElementById('cr_total').textContent  = total > 0 ? fmtEur(total) : '—';
  document.getElementById('cr_saving').textContent = saving > 0 ? fmtEur(saving) : '—';

  const badge = document.getElementById('cr_eff_badge');
  if (eKwhMes > 0) {
    badge.textContent = effLabel;
    badge.style.display = 'inline-block';
    badge.className = 'calc-saving';
  } else {
    badge.style.display = 'none';
  }

  // --- bars ---
  const bars = [
    { label: 'Electricitat', cost: eCost, color: 'var(--green)' },
    { label: 'Aigua',        cost: wCost, color: 'var(--blue)'  },
    { label: 'Consumibles',  cost: cCost, color: 'var(--amber)' },
    { label: 'Neteja',       cost: nCost, color: 'var(--orange)' },
  ];
  const maxBar = Math.max(...bars.map(b => b.cost), 1);
  document.getElementById('cr_bars').innerHTML = bars.map(b => `
    <div class="cr-bar-row">
      <span class="cr-bar-label">${b.label}</span>
      <div class="cr-bar-track"><div class="cr-bar-fill" style="width:${(b.cost/maxBar*100).toFixed(1)}%;background:${b.color}"></div></div>
      <span class="cr-bar-num">${b.cost > 0 ? fmtEur(b.cost) + ' €' : '—'}</span>
    </div>
  `).join('');

  // --- monthly projection ---
  const monthWrap = document.getElementById('cr_monthly_wrap');
  if (period !== 'mes' && eKwhMes > 0) {
    monthWrap.style.display = 'block';
    document.getElementById('cr_period_title').textContent = periodLabel;
    const monthNames = period === 'curs'
      ? ['Set','Oct','Nov','Des','Gen','Feb','Mar','Abr','Mai']
      : ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];
    // use existing DATA monthly factors for electricity (starting Sept for curs)
    const ef = DATA.electric.monthlyFactor;
    const startIdx = period === 'curs' ? 0 : 0; // factors already start at Set=0
    const factSum  = ef.reduce((a,b) => a+b, 0);
    document.getElementById('cr_monthly_grid').innerHTML = monthNames.map((m, i) => {
      const idx = period === 'curs' ? i : i; // Gen=4 in factor array
      const fi  = period === 'curs' ? i : (4 + i) % 12;
      const val = (eKwhMes * 12 / factSum) * ef[fi] * ePreu * season;
      return `<div class="calc-month-cell"><div class="calc-month-name">${m}</div><div class="calc-month-val">${fmtEur(val)} €</div></div>`;
    }).join('');
  } else {
    monthWrap.style.display = 'none';
  }

  // --- suggestions ---
  const sugg = [];
  if (eKwhMes > 0) {
    sugg.push(`Electricitat: aplicant un ${(eRed*100).toFixed(0)}% de reducció, estalviaràs <strong>${fmtEur(eCost * eRed)} €</strong> en el període.`);
    if (season > 1.1) sugg.push('La climatització és el principal consum estacional. Programa els termostats i revisa aïllaments.');
    sugg.push('Instal·la sensors de presència a les aules per eliminar consum innecessari d\'il·luminació.');
  }
  if (wM3Mes > 0) {
    sugg.push(`Aigua: amb un ${(wRed*100).toFixed(0)}% de reducció l'estalvi seria <strong>${fmtEur(wCost * wRed)} €</strong>.`);
    sugg.push('Instal·la airejadors i temporitzadors en aixetes per reduir el consum sense impacte en l\'ús.');
  }
  if (cCostMes > 0) sugg.push('Activa la impressió a doble cara per defecte i promou la documentació digital per reduir el paper.');
  if (nCostMes > 0) sugg.push('Considera productes de neteja ecològics (Ecolabel/ozó aquós). Igual d\'efectius i menys residus químics.');
  if (saving > 0) sugg.push(`<strong>Estalvi total potencial al ${periodLabel.toLowerCase()}: ${fmtEur(saving)} €</strong> aplicant tots els objectius de reducció.`);
  if (sugg.length === 0) sugg.push('Introdueix dades als camps superiors per obtenir recomanacions personalitzades.');

  document.getElementById('cr_suggestions').innerHTML = sugg.map(s => `<li>${s}</li>`).join('');

  document.getElementById('calc-results').style.display = 'block';
  document.getElementById('calc-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetCalc() {
  ['ci_e_kwh','ci_e_sup','ci_w_m3','ci_c_cost','ci_n_cost'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('calc-results').style.display = 'none';
  document.getElementById('tab-calculadora').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
