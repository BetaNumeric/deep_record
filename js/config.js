// Constants for UI dimensions and scaling
const GUI_HEIGHT_DIVISOR = 12;        // Top GUI bar height
const TIMELINE_HEIGHT_DIVISOR = 14;   // Bottom timeline height
const TIMELINE_HEIGHT_DIVISOR_SMALL = 36; // Small timeline elements
const TEXT_SIZE_DIVISOR_MEDIUM = 48;  // Medium text scaling
const TEXT_SIZE_DIVISOR_SMALL = 60;   // Small text scaling
const SHIFT_OFFSET = 15;              // Left margin offset

// Constants for zoom and scrolling
const DEFAULT_SCROLL_VALUE = 25;      // Starting zoom level
const MAX_SCROLL_VALUE = 15000000000; // Max zoom out (cosmological scale)
const MOUSE_EDGE_ZOOM_MARGIN = 32;
const MOUSE_EDGE_ZOOM_DELAY_MS = 300;
const MOUSE_EDGE_ZOOM_DOUBLING_MS = 1000;

// Constants for color and transparency
const BACKGROUND_ALPHA = 128;         // Standard background transparency
const BACKGROUND_ALPHA_HIGH = 230;    // High opacity background
const STROKE_ALPHA_LOW = 64;          // Low opacity stroke
const TIMELINE_LABEL_MIN_SPACING = 70;
const CALENDAR_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SOLAR_DENSE_SMOOTH_START_TIME = -100; // 1850 CE in year-1950 axis
const SOLAR_DENSE_SMOOTH_WINDOW_DAYS = 50; // Full width of the centered window
const SOLAR_ANNUAL_VIEW_YEARS = 200; // Match the older record's annual resolution in long views.
const SOLAR_ALIGNMENT_WINDOW_YEARS = 22; // Approximately two solar cycles near the historical join.
const SOLAR_ALIGNMENT_MIN_DAYS = 15;
const SOLAR_ALIGNMENT_MIN_MONTHS = 12;
const ORBITAL_EPOCH_CE = 2000; // ZB18a uses J2000; see Kocken & Zeebe (2026), section 2.1.
const SPRATT_LGM_AGE_BP = 24000; // Published sea-level calibration; Lambeck supplies younger ages.
const PHANDA_START_AGE_BP = 66000000; // Use complete pre-Cenozoic stages; Hansen supplies younger ages.
const FOSTER_START_AGE_BP = 66000000; // CenCO₂PIP supplies the Cenozoic; keep Foster's older fit.
const DEEP_TEMPERATURE_REFERENCE_C = 14; // Hansen's published 1961–1990 absolute reference.

const SOURCE_INFO = {
  giss: { short: 'GISS', basis: 'thermometers', label: 'NASA GISS • monthly observations', cadence: 'month' },
  pages: { short: 'PAGES2k', basis: 'tree rings + more', label: 'PAGES2k • annual April–March reconstruction', cadence: 'year', period: 'Apr–Mar annual', uncertainty: '95% ensemble' },
  osman: { short: 'Osman', basis: 'sediments + model', label: 'Osman 2021 • 200-year means • estimated baseline', period: '200-year mean', uncertainty: '±1σ ensemble' },
  snyder: { short: 'Snyder', basis: 'sediments + model', label: 'Snyder 2016 • global surface reconstruction • estimated baseline', period: '1,000-year grid', uncertainty: '95% reconstruction' },
  hansen: { short: 'Hansen', basis: 'sediments + model', label: 'Hansen 2013 • coarse global temperature estimate' },
  phanda: { short: 'PhanDA', basis: 'sediments + model', label: 'PhanDA 2024 • global air temperature • geological stages', period: 'stage estimate', uncertainty: '90% ensemble' },
  'co2-noaa': { short: 'NOAA', basis: 'air monitoring', label: 'NOAA • Mauna Loa / Maunakea daily observations', cadence: 'day' },
  'co2-scripps': { short: 'Scripps', basis: 'air monitoring', label: 'Scripps • Mauna Loa daily observations', cadence: 'day' },
  'co2-ice': { short: 'Ice cores', basis: 'trapped air', label: 'Bereiter 2015 • Antarctic ice-core composite', uncertainty: '±1σ measurement' },
  'co2-cencopip': { short: 'CenCO₂PIP', basis: 'mixed proxies', label: 'CenCO₂PIP 2023 • 500,000-year means • median reconstruction', period: '500,000-year mean', uncertainty: '95% credible' },
  'co2-foster': { short: 'Foster', basis: 'plants + soils', label: 'Foster et al. 2017 • smoothed proxy reconstruction • most likely CO₂', period: 'smoothed trend', uncertainty: '68% fit range' },
  'sea-satellite': { short: 'Satellites', basis: 'radar', label: 'Colorado • satellite sea level • overlap-aligned', cadence: 'day' },
  'sea-gauges': { short: 'Tide gauges', basis: 'coastal sensors', label: 'Jevrejeva 2014 • monthly global reconstruction', cadence: 'month', uncertainty: 'published error' },
  'sea-kopp': { short: 'Kopp', basis: 'coastal records', label: 'Kopp 2016 • global sea-level reconstruction', uncertainty: '±1σ posterior' },
  'sea-lambeck': { short: 'Lambeck', basis: 'coasts + model', label: 'Lambeck 2014 • ice-volume-equivalent sea level', uncertainty: '±2σ accuracy' },
  'sea-spratt-short': { short: 'Spratt (7)', basis: 'sediments + model', label: 'Spratt & Lisiecki 2016 • seven-record sea-level stack', period: '1,000-year grid', uncertainty: '95% bootstrap' },
  'sea-spratt-long': { short: 'Spratt (5)', basis: 'sediments + model', label: 'Spratt & Lisiecki 2016 • five-record sea-level stack', period: '1,000-year grid', uncertainty: '95% bootstrap' },
  'sea-miller': { short: 'Miller', basis: 'sediments + model', label: 'Miller 2024 • geological global sea-level estimate' },
  'sea-marcilly': { short: 'Marcilly', basis: 'flooding maps', label: 'Marcilly et al. • corrected 2024 • modern-land sea level', period: '10-million-year grid' },
  'solar-satire-m': { short: 'SATIRE-M', basis: 'tree rings + model', label: 'SATIRE-M / PMIP4 • annual proxy reconstruction • adjusted reference', cadence: 'year' },
  'solar-satire-t': { short: 'SATIRE-T', basis: 'sunspots + model', label: 'SATIRE-T / PMIP4 • annual sunspot reconstruction • adjusted reference', cadence: 'year' },
  'solar-cmip6': { short: 'CMIP6', basis: 'solar model', label: 'CMIP6 • SATIRE/NRL model composite • adjusted reference', cadence: 'day' },
  'solar-nnl': { short: 'NNL', basis: 'solar model', label: 'NASA/NOAA/LASP NNL • model • aligned to TSIS', cadence: 'day' },
  'solar-tsis': { short: 'TSIS', basis: 'satellite sensor', label: 'TSIS • observed irradiance at 1 AU', cadence: 'day' },
  'volcano-holvol': { short: 'HolVol', basis: 'ice cores + model', label: 'HolVol v1 • annual mean stratospheric optical depth', cadence: 'year' },
  'volcano-evolv2k': { short: 'eVolv2k', basis: 'ice cores + model', label: 'eVolv2k v3 • annual mean stratospheric optical depth', cadence: 'year' },
  'volcano-cmip6': { short: 'CMIP6', basis: 'mixed records', label: 'CMIP6 v3 • annual mean stratospheric optical depth', cadence: 'year' },
  'orbit-zeebe': { short: 'ZB18a', basis: 'orbital model', label: 'Zeebe 2019 ZB18a • 1,600-year spacing • 2000 epoch' },
  'population-history': { short: 'Estimates', basis: 'records + models', label: 'OWID • historical population estimates', cadence: 'year' },
  'population-projection': { short: 'Projections', basis: 'population model', label: 'OWID • population projection, not an observation', cadence: 'year' }
};
