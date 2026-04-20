// src/data/fallas.ts — Fallas X-Plane + Maniobras con criterios completos
// MODENACEAC 6XSIM · Eduardo Forgan

import type { SistemaFallas } from '../types';

// ══════════════════════════════════════════════════════════════════════════
// FALLAS X-PLANE
// ══════════════════════════════════════════════════════════════════════════

export const FALLAS_AW109: SistemaFallas[] = [
  {
    sistema: 'Motor y Planta de Poder',
    icono: '🔴', color: '#A32D2D', nota: 'AW109E: 2× PW206C · FADEC · FMM backup', aeronave: 'AW109',
    fallas: [
      { id:'m1_falla',    nombre:'Falla motor #1 (PW206C)',          dataref:'sim/operation/failures/rel_engfai0',  sistema:'Motor', aeronave:'AW109', activa:false },
      { id:'m2_falla',    nombre:'Falla motor #2 (PW206C)',          dataref:'sim/operation/failures/rel_engfai1',  sistema:'Motor', aeronave:'AW109', activa:false },
      { id:'aceite_p1',   nombre:'Baja presión aceite motor #1',     dataref:'sim/operation/failures/rel_engoilP0', sistema:'Motor', aeronave:'AW109', activa:false },
      { id:'aceite_p2',   nombre:'Baja presión aceite motor #2',     dataref:'sim/operation/failures/rel_engoilP1', sistema:'Motor', aeronave:'AW109', activa:false },
      { id:'egt_1',       nombre:'Alta temperatura EGT/TOT #1',      dataref:'sim/operation/failures/rel_engoilT0', sistema:'Motor', aeronave:'AW109', activa:false },
      { id:'egt_2',       nombre:'Alta temperatura EGT/TOT #2',      dataref:'sim/operation/failures/rel_engoilT1', sistema:'Motor', aeronave:'AW109', activa:false },
      { id:'fadec_1',     nombre:'Falla FADEC/governor motor #1',    dataref:'sim/operation/failures/rel_govern0',  sistema:'Motor', aeronave:'AW109', activa:false },
      { id:'fadec_2',     nombre:'Falla FADEC/governor motor #2',    dataref:'sim/operation/failures/rel_govern1',  sistema:'Motor', aeronave:'AW109', activa:false },
      { id:'arranque_1',  nombre:'Falla arranque motor #1',          dataref:'sim/operation/failures/rel_startr0',  sistema:'Motor', aeronave:'AW109', activa:false },
      { id:'arranque_2',  nombre:'Falla arranque motor #2',          dataref:'sim/operation/failures/rel_startr1',  sistema:'Motor', aeronave:'AW109', activa:false },
    ],
  },
  {
    sistema: 'Transmisión y Rotor Principal',
    icono: '⚙️', color: '#534AB7', nota: 'MGB · chip detector · NR', aeronave: 'AW109',
    fallas: [
      { id:'mgb',        nombre:'Falla caja transmisión MGB',    dataref:'sim/operation/failures/rel_gearbox',       sistema:'Transmisión', aeronave:'AW109', activa:false },
      { id:'aceite_mgb', nombre:'Baja presión aceite MGB',       dataref:'sim/operation/failures/rel_gear_oil',      sistema:'Transmisión', aeronave:'AW109', activa:false },
      { id:'chip_mgb',   nombre:'Chip detector MGB activado',    dataref:'sim/operation/failures/rel_gearbox',       sistema:'Transmisión', aeronave:'AW109', activa:false },
      { id:'nr_bajo',    nombre:'NR bajo límite mínimo',         dataref:'sim/operation/failures/rel_rotor',         sistema:'Transmisión', aeronave:'AW109', activa:false },
      { id:'freno_rot',  nombre:'Falla freno de rotor',          dataref:'sim/operation/failures/rel_rotor',         sistema:'Transmisión', aeronave:'AW109', activa:false },
    ],
  },
  {
    sistema: 'Rotor de Cola y TGB',
    icono: '🔄', color: '#BA7517', nota: 'TR · eje transmisión · TGB · YD', aeronave: 'AW109',
    fallas: [
      { id:'tr_falla',   nombre:'Falla rotor de cola (TR)',       dataref:'sim/operation/failures/rel_tail_rotor',     sistema:'Cola', aeronave:'AW109', activa:false },
      { id:'eje_cola',   nombre:'Falla eje transmisión cola',     dataref:'sim/operation/failures/rel_taildriveshaft', sistema:'Cola', aeronave:'AW109', activa:false },
      { id:'tgb',        nombre:'Falla caja engranajes TGB',      dataref:'sim/operation/failures/rel_gearbox',        sistema:'Cola', aeronave:'AW109', activa:false },
      { id:'yd',         nombre:'Falla amortiguador YD',          dataref:'sim/operation/failures/rel_yaw_damper',     sistema:'Cola', aeronave:'AW109', activa:false },
      { id:'pedales',    nombre:'Pedales bloqueados / pérdida yaw',dataref:'sim/operation/failures/rel_tail_rotor',    sistema:'Cola', aeronave:'AW109', activa:false },
    ],
  },
  {
    sistema: 'Hidráulico',
    icono: '💧', color: '#185FA5', nota: 'N.1 · N.2 · Utilitario', aeronave: 'AW109',
    fallas: [
      { id:'hyd1',       nombre:'Falla bomba hidráulica N.1',     dataref:'sim/operation/failures/rel_hydpmp0',     sistema:'Hidráulico', aeronave:'AW109', activa:false },
      { id:'hyd2',       nombre:'Falla bomba hidráulica N.2',     dataref:'sim/operation/failures/rel_hydpmp1',     sistema:'Hidráulico', aeronave:'AW109', activa:false },
      { id:'hyd_e1',     nombre:'Falla bomba hidráulica elect. #1',dataref:'sim/operation/failures/rel_hydpmp_ele', sistema:'Hidráulico', aeronave:'AW109', activa:false },
      { id:'hyd_e2',     nombre:'Falla bomba hidráulica elect. #2',dataref:'sim/operation/failures/rel_hydpmp_el2', sistema:'Hidráulico', aeronave:'AW109', activa:false },
      { id:'servo_cic',  nombre:'Falla servocontrol cíclico',     dataref:'sim/operation/failures/rel_hydpmp0',     sistema:'Hidráulico', aeronave:'AW109', activa:false },
      { id:'servo_col',  nombre:'Falla servocontrol colectivo',   dataref:'sim/operation/failures/rel_hydpmp1',     sistema:'Hidráulico', aeronave:'AW109', activa:false },
      { id:'tren_act',   nombre:'Falla actuador tren aterrizaje', dataref:'sim/operation/failures/rel_gear_act',    sistema:'Hidráulico', aeronave:'AW109', activa:false },
    ],
  },
  {
    sistema: 'Eléctrico',
    icono: '⚡', color: '#BA7517', nota: '2× Starter-Gen 28VDC · batería NiCd · 2× inversores AC', aeronave: 'AW109',
    fallas: [
      { id:'gen1',       nombre:'Falla generador #1 (Starter-Gen)',dataref:'sim/operation/failures/rel_genera0',  sistema:'Eléctrico', aeronave:'AW109', activa:false },
      { id:'gen2',       nombre:'Falla generador #2 (Starter-Gen)',dataref:'sim/operation/failures/rel_genera1',  sistema:'Eléctrico', aeronave:'AW109', activa:false },
      { id:'bateria',    nombre:'Falla batería principal NiCd',    dataref:'sim/operation/failures/rel_bat_lo0',  sistema:'Eléctrico', aeronave:'AW109', activa:false },
      { id:'inv1',       nombre:'Falla inversor AC #1 (115V)',     dataref:'sim/operation/failures/rel_invert0',  sistema:'Eléctrico', aeronave:'AW109', activa:false },
      { id:'inv2',       nombre:'Falla inversor AC #2 (26V)',      dataref:'sim/operation/failures/rel_invert1',  sistema:'Eléctrico', aeronave:'AW109', activa:false },
      { id:'bus_av',     nombre:'Falla bus de aviónica',           dataref:'sim/operation/failures/rel_avionics', sistema:'Eléctrico', aeronave:'AW109', activa:false },
    ],
  },
  {
    sistema: 'Combustible',
    icono: '⛽', color: '#1D9E75', nota: 'Bombas · crossfeed · válvulas shutoff', aeronave: 'AW109',
    fallas: [
      { id:'fuel1',      nombre:'Falla bomba combustible motor #1',dataref:'sim/operation/failures/rel_fuelpmp0',  sistema:'Combustible', aeronave:'AW109', activa:false },
      { id:'fuel2',      nombre:'Falla bomba combustible motor #2',dataref:'sim/operation/failures/rel_fuelpmp1',  sistema:'Combustible', aeronave:'AW109', activa:false },
      { id:'crossfeed',  nombre:'Falla válvula crossfeed',         dataref:'sim/operation/failures/rel_fuelpmp0',  sistema:'Combustible', aeronave:'AW109', activa:false },
      { id:'fuel_sensor',nombre:'Falla sensor nivel combustible',  dataref:'sim/operation/failures/rel_fuel_qnty', sistema:'Combustible', aeronave:'AW109', activa:false },
    ],
  },
  {
    sistema: 'Instrumentos y IDS',
    icono: '🎛️', color: '#534AB7', nota: 'EDU 1 · EDU 2 · DAU · AHRS · ADC', aeronave: 'AW109',
    fallas: [
      { id:'alt',        nombre:'Falla altímetro',                 dataref:'sim/operation/failures/rel_ss_alt',   sistema:'Instrumentos', aeronave:'AW109', activa:false },
      { id:'ahrs',       nombre:'Falla horizonte / AHRS',          dataref:'sim/operation/failures/rel_ss_ahrs',  sistema:'Instrumentos', aeronave:'AW109', activa:false },
      { id:'adc',        nombre:'Falla ADC / pitot-estático',      dataref:'sim/operation/failures/rel_ss_adc',   sistema:'Instrumentos', aeronave:'AW109', activa:false },
      { id:'vsi',        nombre:'Falla variometro VSI',            dataref:'sim/operation/failures/rel_ss_vvi',   sistema:'Instrumentos', aeronave:'AW109', activa:false },
      { id:'asi',        nombre:'Falla anemómetro IAS',            dataref:'sim/operation/failures/rel_ss_asi',   sistema:'Instrumentos', aeronave:'AW109', activa:false },
      { id:'edu1',       nombre:'Falla EDU 1 — pantalla primaria', dataref:'sim/operation/failures/rel_efis_1',   sistema:'Instrumentos', aeronave:'AW109', activa:false },
      { id:'edu2',       nombre:'Falla EDU 2 — pantalla secundaria',dataref:'sim/operation/failures/rel_efis_2',  sistema:'Instrumentos', aeronave:'AW109', activa:false },
      { id:'pitot',      nombre:'Falla calentador Pitot',          dataref:'sim/operation/failures/rel_pitot',    sistema:'Instrumentos', aeronave:'AW109', activa:false },
    ],
  },
  {
    sistema: 'Comunicaciones y Navegación',
    icono: '📡', color: '#185FA5', nota: 'VHF · ILS · GPS · Transponder', aeronave: 'AW109',
    fallas: [
      { id:'com1',       nombre:'Falla VHF COM 1',                 dataref:'sim/operation/failures/rel_com0',     sistema:'Com/Nav', aeronave:'AW109', activa:false },
      { id:'nav1',       nombre:'Falla NAV 1 / ILS',               dataref:'sim/operation/failures/rel_nav0',     sistema:'Com/Nav', aeronave:'AW109', activa:false },
      { id:'gps',        nombre:'Falla GPS',                       dataref:'sim/operation/failures/rel_gps',      sistema:'Com/Nav', aeronave:'AW109', activa:false },
      { id:'xpdr',       nombre:'Falla transponder',               dataref:'sim/operation/failures/rel_xpndr',    sistema:'Com/Nav', aeronave:'AW109', activa:false },
    ],
  },
  {
    sistema: 'Autopiloto AFCS',
    icono: '🤖', color: '#534AB7', nota: 'AFCS General · Roll · Pitch · Yaw Damper', aeronave: 'AW109',
    fallas: [
      { id:'afcs_gen',   nombre:'Falla AFCS general',              dataref:'sim/operation/failures/rel_ap',       sistema:'AFCS', aeronave:'AW109', activa:false },
      { id:'afcs_roll',  nombre:'Falla AFCS canal roll',           dataref:'sim/operation/failures/rel_ap_roll',  sistema:'AFCS', aeronave:'AW109', activa:false },
      { id:'afcs_pitch', nombre:'Falla AFCS canal pitch',          dataref:'sim/operation/failures/rel_ap_ptch',  sistema:'AFCS', aeronave:'AW109', activa:false },
      { id:'afcs_yaw',   nombre:'Falla AFCS canal yaw',            dataref:'sim/operation/failures/rel_ap_yaw',   sistema:'AFCS', aeronave:'AW109', activa:false },
      { id:'yd_afcs',    nombre:'Falla yaw damper',                dataref:'sim/operation/failures/rel_yaw_damper',sistema:'AFCS', aeronave:'AW109', activa:false },
    ],
  },
  {
    sistema: 'Tren de Aterrizaje',
    icono: '🛬', color: '#1D9E75', nota: 'Actuadores · indicadores · frenos', aeronave: 'AW109',
    fallas: [
      { id:'tren_ext',   nombre:'Falla extensión tren aterrizaje', dataref:'sim/operation/failures/rel_gear',     sistema:'Tren', aeronave:'AW109', activa:false },
      { id:'tren_ind',   nombre:'Falla indicación tren',           dataref:'sim/operation/failures/rel_gear_ind', sistema:'Tren', aeronave:'AW109', activa:false },
      { id:'frenos',     nombre:'Falla frenos principales',        dataref:'sim/operation/failures/rel_brake',    sistema:'Tren', aeronave:'AW109', activa:false },
    ],
  },
];

export const FALLAS_R44: SistemaFallas[] = [
  {
    sistema: 'Motor Lycoming O-540',
    icono: '🔴', color: '#A32D2D', nota: 'Motor pistón · carburador · encendido', aeronave: 'R44',
    fallas: [
      { id:'r_motor',    nombre:'Falla de motor (engine failure)',  dataref:'sim/operation/failures/rel_engfai0',  sistema:'Motor', aeronave:'R44', activa:false },
      { id:'r_encendido',nombre:'Falla sistema de encendido',       dataref:'sim/operation/failures/rel_ignition', sistema:'Motor', aeronave:'R44', activa:false },
      { id:'r_carb_ice', nombre:'Hielo de carburador (carb ice)',   dataref:'sim/operation/failures/rel_carb_ice', sistema:'Motor', aeronave:'R44', activa:false },
      { id:'r_aceite_p', nombre:'Baja presión de aceite',          dataref:'sim/operation/failures/rel_engoilP0', sistema:'Motor', aeronave:'R44', activa:false },
      { id:'r_aceite_t', nombre:'Alta temperatura aceite',         dataref:'sim/operation/failures/rel_engoilT0', sistema:'Motor', aeronave:'R44', activa:false },
      { id:'r_fuel_pump',nombre:'Falla bomba de combustible',       dataref:'sim/operation/failures/rel_fuelpmp0', sistema:'Motor', aeronave:'R44', activa:false },
      { id:'r_fuel_pr',  nombre:'Baja presión combustible',        dataref:'sim/operation/failures/rel_fuel_pr',  sistema:'Motor', aeronave:'R44', activa:false },
      { id:'r_bujias',   nombre:'Falla de bujías (mag check)',     dataref:'sim/operation/failures/rel_mag0',     sistema:'Motor', aeronave:'R44', activa:false },
    ],
  },
  {
    sistema: 'Transmisión y Rotores',
    icono: '⚙️', color: '#534AB7', nota: 'Governor · embrague · rotor principal · TR', aeronave: 'R44',
    fallas: [
      { id:'r_governor', nombre:'Falla governor RPM',              dataref:'sim/operation/failures/rel_govern0',       sistema:'Transmisión', aeronave:'R44', activa:false },
      { id:'r_embrague', nombre:'Falla sistema de embrague',       dataref:'sim/operation/failures/rel_gearbox',       sistema:'Transmisión', aeronave:'R44', activa:false },
      { id:'r_tr_falla', nombre:'Falla rotor de cola',             dataref:'sim/operation/failures/rel_tail_rotor',    sistema:'Transmisión', aeronave:'R44', activa:false },
      { id:'r_nr_bajo',  nombre:'NR bajo — bajo RPM rotor',        dataref:'sim/operation/failures/rel_rotor',         sistema:'Transmisión', aeronave:'R44', activa:false },
      { id:'r_eje_cola', nombre:'Falla eje transmisión cola',      dataref:'sim/operation/failures/rel_taildriveshaft',sistema:'Transmisión', aeronave:'R44', activa:false },
    ],
  },
  {
    sistema: 'Eléctrico y Combustible',
    icono: '⚡', color: '#BA7517', nota: 'Alternador · batería · cantidad combustible', aeronave: 'R44',
    fallas: [
      { id:'r_alt',      nombre:'Falla alternador',                dataref:'sim/operation/failures/rel_genera0',  sistema:'Eléctrico', aeronave:'R44', activa:false },
      { id:'r_bateria',  nombre:'Falla batería',                   dataref:'sim/operation/failures/rel_bat_lo0',  sistema:'Eléctrico', aeronave:'R44', activa:false },
      { id:'r_fuel_qty', nombre:'Falla sensor cantidad combustible',dataref:'sim/operation/failures/rel_fuel_qnty',sistema:'Eléctrico', aeronave:'R44', activa:false },
    ],
  },
  {
    sistema: 'Instrumentos',
    icono: '🎛️', color: '#534AB7', nota: 'Instrumentos analógicos · pitot · estática', aeronave: 'R44',
    fallas: [
      { id:'r_alt_inst', nombre:'Falla altímetro analógico',       dataref:'sim/operation/failures/rel_ss_alt',   sistema:'Instrumentos', aeronave:'R44', activa:false },
      { id:'r_vsi',      nombre:'Falla variometro VSI',            dataref:'sim/operation/failures/rel_ss_vvi',   sistema:'Instrumentos', aeronave:'R44', activa:false },
      { id:'r_asi',      nombre:'Falla anemómetro',                dataref:'sim/operation/failures/rel_ss_asi',   sistema:'Instrumentos', aeronave:'R44', activa:false },
      { id:'r_ahrs',     nombre:'Falla horizonte artificial',      dataref:'sim/operation/failures/rel_ss_ahrs',  sistema:'Instrumentos', aeronave:'R44', activa:false },
      { id:'r_pitot',    nombre:'Falla tubo Pitot',                dataref:'sim/operation/failures/rel_pitot',    sistema:'Instrumentos', aeronave:'R44', activa:false },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// MANIOBRAS CON CRITERIOS DETALLADOS
// ══════════════════════════════════════════════════════════════════════════

export interface FallaSugerida {
  fallaId:  string;
  nombre:   string;
  momento:  string;   // Cuándo inyectar la falla
}

export interface CriterioDetalle {
  AS:  string;   // Apenas Satisface — errores notables pero procedimental
  S:   string;   // Satisface — correcto con deficiencias menores
  SB:  string;   // Satisface Bien — preciso y correcto
}

export interface Maniobra {
  id:          string;
  nombre:      string;
  categoria:   string;
  objetivo:    string;          // Qué evalúa esta maniobra
  procedimiento: string[];      // Pasos esperados
  tolerancias: string[];        // Límites cuantitativos
  criterios:   CriterioDetalle;
  fallas:      FallaSugerida[]; // Fallas que se pueden usar
  referencia:  string;          // RAA / RFM / POH
}

export const MANIOBRAS_AW109: Maniobra[] = [
  {
    id: 'm_hover',
    nombre: 'Hover estacionario IGE',
    categoria: 'Control básico',
    objetivo: 'Demostrar control preciso del helicóptero en hover estacionario dentro del efecto de suelo.',
    procedimiento: [
      'Establecer hover a 3–5 ft AGL sobre punto de referencia fijo',
      'Mantener posición estacionaria por al menos 30 segundos',
      'Control coordinado de cíclico, colectivo y pedales',
      'Verificar parámetros de motor: NR 102%, torque dentro de límites',
    ],
    tolerancias: [
      'Posición horizontal: ±3 ft del punto de referencia',
      'Altitud: ±1 ft de la altura seleccionada',
      'Rumbo: ±10° del rumbo inicial',
      'NR: 102% ±2%',
    ],
    criterios: {
      AS: 'Mantiene posición con correcciones grandes y frecuentes. Deriva > 5 ft. Requiere asistencia verbal del instructor.',
      S:  'Posición mantenida con correcciones moderadas. Deriva puntual dentro de ±4 ft. Control del rumbo adecuado.',
      SB: 'Control suave y preciso. Posición dentro de ±2 ft sostenida. Correcciones pequeñas y anticipadas.',
    },
    fallas: [
      { fallaId: 'nr_bajo',    nombre: 'NR bajo límite',       momento: 'Al establecer hover para evaluar manejo de emergencia' },
      { fallaId: 'hyd1',       nombre: 'Falla hidráulica N.1', momento: 'Durante hover estacionario' },
    ],
    referencia: 'AW109E RFM Capítulo 11 · RAA 61.57 §(a)',
  },
  {
    id: 'm_despegue',
    nombre: 'Despegue vertical',
    categoria: 'Control básico',
    objetivo: 'Ejecutar despegue vertical desde superficie hasta altura de transición con control coordinado.',
    procedimiento: [
      'Verificar área despejada y parámetros de motor en limits',
      'Aumentar colectivo suavemente hasta levantar skids',
      'Estabilizar en hover IGE, verificar todos los sistemas',
      'Ascender verticalmente a 50 ft AGL, luego iniciar transición',
      'Aceleración de transición con cabeceo adelante hasta 40 kts',
    ],
    tolerancias: [
      'Desviación lateral durante despegue: ±3 ft de la línea de despegue',
      'Velocidad de ascenso: < 500 fpm hasta 50 ft',
      'Rumbo: ±10°',
      'TOT: < 860°C (límite continuo)',
    ],
    criterios: {
      AS: 'Despegue con correcciones abruptas. Desviación lateral > 5 ft. Ascenso irregular. Algún parámetro momentáneamente fuera de límites.',
      S:  'Despegue coordinado. Desviación lateral < 4 ft. Ascenso controlado aunque con correcciones visibles.',
      SB: 'Despegue suave y coordinado. Línea de despegue limpia. Transición fluida sin exceder límites de motor.',
    },
    fallas: [
      { fallaId: 'm1_falla', nombre: 'Falla motor #1',  momento: 'Durante ascenso al pasar 50 ft para evaluar OEI' },
      { fallaId: 'egt_1',    nombre: 'Alta TOT motor #1', momento: 'Al iniciar ascenso' },
    ],
    referencia: 'AW109E RFM Capítulo 11 · RAA 61.57 §(b)',
  },
  {
    id: 'm_autorot',
    nombre: 'Autorrotación completa',
    categoria: 'Emergencias',
    objetivo: 'Ejecutar la secuencia completa de autorrotación desde falla de motor hasta aterrizaje o go-around seguro.',
    procedimiento: [
      'Al detectar falla: colectivo a mínimo en < 2 segundos',
      'Bajar colectivo manteniendo NR 102–110% (R: 97–110%)',
      'Establecer velocidad de planeo 65–70 kts (velocidad mejor planeo)',
      'Identificar área de aterrizaje — mínimo 100 ft para maniobrar',
      'Flare a 40–50 ft con cabeceo atrás para reducir velocidad',
      'Colectivo final para absorber impacto o go-around',
    ],
    tolerancias: [
      'Tiempo de respuesta a falla: < 2 segundos (colectivo a mínimo)',
      'NR en autorrotación: 102–110%',
      'Velocidad de planeo: 60–75 kts',
      'Punto de flare: 40–60 ft AGL',
    ],
    criterios: {
      AS: 'Respuesta tardía > 3s. NR momentáneamente < 95% o > 115%. Velocidad o punto de flare inadecuados pero con aterrizaje sin daño.',
      S:  'Respuesta en 2–3s. NR estabilizado dentro de límites en < 5s. Velocidad de planeo ±10 kts. Flare en zona aceptable.',
      SB: 'Respuesta < 2s. NR siempre en rango. Velocidad precisa. Flare en punto correcto. Aterrizaje / go-around suave y controlado.',
    },
    fallas: [
      { fallaId: 'm1_falla', nombre: 'Falla motor #1 completa', momento: 'En crucero > 1.000 ft para dar tiempo de reacción inicial' },
      { fallaId: 'm2_falla', nombre: 'Falla motor #2 completa', momento: 'Alternativa: falla del segundo motor' },
    ],
    referencia: 'AW109E RFM §2-9 Emergencias · RAA 61.57 §(a)(1)',
  },
  {
    id: 'm_falla1',
    nombre: 'Falla de motor OEI > 500 ft',
    categoria: 'Emergencias',
    objetivo: 'Demostrar manejo de falla de un motor en operación bimotor sobre 500 ft AGL.',
    procedimiento: [
      'Reconocer y confirmar motor fallado (N1 cae, TOT decrece, torque a cero)',
      'Identificar motor fallado: "Motor #1 / #2 falla confirmada"',
      'Motor bueno: potencia de emergencia si requerido (Tq < 100%)',
      'Completar lista de emergencia OEI en memoria',
      'Decidir: continuar vuelo OEI o aterrizaje de precaución',
      'Comunicar: "MAYDAY MAYDAY MAYDAY"',
    ],
    tolerancias: [
      'Identificación del motor fallado: < 5 segundos',
      'Potencia motor bueno: dentro de límites OEI (TOT < 940°C / 30s)',
      'Altitud: no perder más de 100 ft sin intención',
      'Rumbo: ±15°',
    ],
    criterios: {
      AS: 'Identificación correcta pero > 8s. Acciones de emergencia completadas con omisiones. Pierde > 200 ft sin recuperación clara.',
      S:  'Identificación en 5–8s. Lista de emergencia completa con guía mínima. Control de aeronave adecuado. Decisión comunicada.',
      SB: 'Identificación < 5s. Acciones de memoria precisas y fluidas. Control de aeronave excelente. Briefing completo.',
    },
    fallas: [
      { fallaId: 'm1_falla', nombre: 'Falla motor #1',  momento: 'En crucero a > 1.000 ft AGL' },
      { fallaId: 'm2_falla', nombre: 'Falla motor #2',  momento: 'Alternativa para variar el escenario' },
    ],
    referencia: 'AW109E RFM §2-8 · RAA 61.57 §(a)(1)',
  },
  {
    id: 'm_falla2',
    nombre: 'Falla de motor OEI < 500 ft',
    categoria: 'Emergencias',
    objetivo: 'Demostrar manejo de falla de motor en fase crítica por debajo de 500 ft durante ascenso inicial.',
    procedimiento: [
      'Reconocer falla inmediatamente al verificar descenso de N1',
      'Potencia máxima motor bueno (dentro de OEI limits)',
      'Mantener control de aeronave y velocidad > 40 kts',
      'Evaluar: aterrizaje inmediato vs continuar ascenso OEI',
      'Si aterrizaje: seleccionar terreno apropiado en < 5s',
    ],
    tolerancias: [
      'Mantenimiento de altitud o tasa de descenso controlada < 300 fpm',
      'Velocidad: > 40 kts en todo momento',
      'No perder el control de rumbo (± 20°)',
    ],
    criterios: {
      AS: 'Reacción tardía. Pierde altitud significativa o velocidad < 35 kts. Decisión de aterrizaje tardía pero sin pérdida de control.',
      S:  'Reacción correcta con leve demora. Control de aeronave mantenido. Decisión de aterrizaje tomada dentro del tiempo esperado.',
      SB: 'Reacción inmediata. Control perfecto bajo la presión de baja altitud. Decisión clara y ejecución segura.',
    },
    fallas: [
      { fallaId: 'm1_falla', nombre: 'Falla motor #1', momento: 'Al pasar 200–400 ft en ascenso (zona crítica)' },
    ],
    referencia: 'AW109E RFM §2-8 · Diagrama H/V',
  },
  {
    id: 'm_tr',
    nombre: 'Falla rotor de cola',
    categoria: 'Emergencias',
    objetivo: 'Reconocer y manejar la falla del rotor de cola en diferentes fases del vuelo.',
    procedimiento: [
      'En hover: aterrizaje inmediato — colectivo a mínimo, aterrizaje en menos de 5s',
      'En crucero > 40 kts: reducir potencia, mantener velocidad, aterrizaje corrido',
      'En aterrizaje corrido: velocidad 40–60 kts, aterrizaje con avance',
      'No intentar hover sin rotor de cola operativo',
    ],
    tolerancias: [
      'En hover: aterrizaje en < 5 segundos tras reconocer falla',
      'En crucero: velocidad de aterrizaje 40–60 kts',
      'Sin pérdida de control direccional significativa',
    ],
    criterios: {
      AS: 'Reconoce falla pero reacciona incorrectamente (ej: intenta hover en crucero). Aterrizaje duro pero sin vuelco.',
      S:  'Reconoce falla. Selecciona procedimiento correcto según fase de vuelo. Aterrizaje controlado con algo de desvío de rumbo.',
      SB: 'Reconocimiento inmediato. Procedimiento correcto sin duda. Aterrizaje preciso y controlado.',
    },
    fallas: [
      { fallaId: 'tr_falla', nombre: 'Falla rotor de cola', momento: 'En hover estacionario para la versión más crítica' },
      { fallaId: 'eje_cola', nombre: 'Falla eje transmisión cola', momento: 'En crucero a 80 kts para evaluar aterrizaje corrido' },
    ],
    referencia: 'AW109E RFM §2-11 · RAA 61.57 §(a)(1)',
  },
  {
    id: 'm_ils',
    nombre: 'Aproximación ILS en IMC',
    categoria: 'IFR',
    objetivo: 'Ejecutar una aproximación ILS completa bajo condiciones IMC hasta minimums o go-around.',
    procedimiento: [
      'Configurar NAV1 en la frecuencia ILS del aeródromo',
      'Briefing de aproximación: MDA/DH, ruta de missed approach',
      'Interceptar localizer a 30° no más de 2 dots de desviación',
      'Interceptar glideslope desde abajo, configurar para descenso',
      'Seguir localizer y glideslope dentro de ±1 dot',
      'Al llegar a DH: decidir aterrizar o go-around',
    ],
    tolerancias: [
      'Localizer: ±½ dot durante el segmento final',
      'Glideslope: ±½ dot durante el segmento final',
      'Velocidad: Vapp ±5 kts',
      'Altitud en FAF: ±100 ft',
    ],
    criterios: {
      AS: 'Desviación > 1 dot en localizer o glideslope. Velocidad > ±10 kts. Llega a DH pero con correcciones abruptas.',
      S:  'Mantiene ±1 dot en ambas agujas. Velocidad ±8 kts. Decisión en DH correcta. Estabilizado en FAF.',
      SB: 'Preciso ±½ dot. Velocidad ±4 kts. Aproximación estabilizada desde FAF. Decisión clara y ejecución perfecta.',
    },
    fallas: [
      { fallaId: 'nav1',    nombre: 'Falla NAV 1 / ILS',   momento: 'En FAF para simular falla de radioayuda en IMC' },
      { fallaId: 'ahrs',    nombre: 'Falla AHRS',           momento: 'Al comenzar el descenso inicial' },
      { fallaId: 'afcs_gen',nombre: 'Falla AFCS general',   momento: 'Al interceptar glideslope para evaluar vuelo manual IMC' },
    ],
    referencia: 'AW109E RFM Capítulo 12 · RAA 61.57 §(c)(1)',
  },
  {
    id: 'm_hovige',
    nombre: 'Hover OGE fuera efecto suelo',
    categoria: 'Control avanzado',
    objetivo: 'Demostrar control preciso del helicóptero en hover fuera del efecto de suelo (> 1 diámetro de rotor).',
    procedimiento: [
      'Ascender a altura donde efecto de suelo es despreciable (> 50 ft para AW109)',
      'Establecer hover estacionario en esa altura',
      'Mantener posición con mayor demanda de potencia que IGE',
      'Verificar que torque y TOT están dentro de límites OGE',
    ],
    tolerancias: [
      'Posición horizontal: ±5 ft',
      'Altitud: ±3 ft de la altura seleccionada',
      'Rumbo: ±15°',
      'Parámetros de motor: dentro de límites continuos',
    ],
    criterios: {
      AS: 'Deriva notable > 8 ft. Correcciones abruptas que generan oscilaciones. Parámetros de motor en o cerca de límites.',
      S:  'Posición mantenida dentro de ±5 ft. Correcciones moderadas. Control de rumbo aceptable. Parámetros bien monitoreados.',
      SB: 'Control suave y preciso dentro de ±3 ft. Anticipación de movimientos. Excelente gestión de potencia.',
    },
    fallas: [
      { fallaId: 'hyd1',  nombre: 'Falla hidráulica N.1', momento: 'En hover OGE estabilizado' },
    ],
    referencia: 'AW109E RFM §5-20 · RAA 61.57 §(b)',
  },
  {
    id: 'm_hyd',
    nombre: 'Falla sistema hidráulico',
    categoria: 'Sistemas',
    objetivo: 'Reconocer falla hidráulica, ejecutar lista de emergencia y aterrizar con fuerzas de control aumentadas.',
    procedimiento: [
      'Reconocer indicación (luz HYD, variación en control)',
      'Lista de emergencia hidráulica en memoria',
      'Reducir velocidad a < 80 kts para reducir fuerzas de control',
      'Avisar tripulación y ATC',
      'Planificar aterrizaje a la brevedad',
      'Aterrizar con velocidad mayor que normal (más inercia)',
    ],
    tolerancias: [
      'Reconocimiento de falla: < 5 segundos',
      'Velocidad tras falla: < 80 kts',
      'Lista de emergencia completada antes del aterrizaje',
    ],
    criterios: {
      AS: 'Reconoce falla > 10s. Lista de emergencia incompleta. Intenta mantener velocidad normal (> 100 kts).',
      S:  'Reconocimiento en 5–10s. Lista completada. Reduce velocidad aunque tarda en decidir el aterrizaje.',
      SB: 'Reconocimiento inmediato. Lista perfecta. Velocidad reducida, aterrizaje planificado y ejecutado correctamente.',
    },
    fallas: [
      { fallaId: 'hyd1',    nombre: 'Falla bomba hidráulica N.1', momento: 'En crucero a velocidad estabilizada' },
      { fallaId: 'hyd2',    nombre: 'Falla bomba hidráulica N.2', momento: 'Alternativa: falla segundo sistema' },
      { fallaId: 'servo_cic',nombre: 'Falla servocontrol cíclico', momento: 'En hover para evaluación más exigente' },
    ],
    referencia: 'AW109E RFM §2-13 Hidráulico',
  },
  {
    id: 'm_afcs',
    nombre: 'Falla AFCS en IMC',
    categoria: 'Sistemas',
    objetivo: 'Recuperar control del helicóptero ante falla total del AFCS durante vuelo en condiciones IMC.',
    procedimiento: [
      'Al detectar falla AFCS: descoupling manual y asunción de control',
      'Establecer actitud de vuelo nivelado por referencia de instrumentos',
      'Salida de IMC si posible, o mantener vuelo controlado',
      'Informar ATC, solicitar vectores para aproximación de precisión',
      'Aproximación manual sin AFCS con velocidades apropiadas',
    ],
    tolerancias: [
      'Recuperación de actitud tras falla: < 10 segundos',
      'Altitud en IMC: ±100 ft tras estabilización',
      'Velocidad: ±10 kts del objetivo',
    ],
    criterios: {
      AS: 'Recuperación tardía > 15s o con variación de actitud > 30° antes de estabilizar. Requiere asistencia verbal.',
      S:  'Recuperación en 10–15s. Control establecido aunque con algo de oscilación inicial. Vuelo controlado subsiguiente.',
      SB: 'Recuperación < 10s. Control suave desde el inicio. Vuelo en IMC correcto. Aproximación bien ejecutada.',
    },
    fallas: [
      { fallaId: 'afcs_gen',  nombre: 'Falla AFCS general',   momento: 'En IMC simulado durante crucero estabilizado' },
      { fallaId: 'afcs_pitch',nombre: 'Falla AFCS canal pitch',momento: 'Alternativa más específica' },
    ],
    referencia: 'AW109E RFM §2-15 AFCS · RAA 61.57 §(c)',
  },
  {
    id: 'm_traslac',
    nombre: 'Traslación desde hover',
    categoria: 'Control básico',
    objetivo: 'Ejecutar la transición de hover a vuelo traslacional con control coordinado y sin pérdidas de altitud.',
    procedimiento: [
      'Desde hover estabilizado, aplicar cabeceo adelante suavemente',
      'Compensar con pedales la reacción del rotor de cola',
      'Aumentar colectivo para compensar pérdida en traslación',
      'Acelerar hasta 40 kts manteniendo altitud constante',
      'Continuar ascenso al pasar velocidad de traslación efectiva',
    ],
    tolerancias: [
      'Pérdida de altitud durante traslación: < 5 ft',
      'Desvío de rumbo: ±10°',
      'Velocidad al completar traslación: 40–50 kts',
    ],
    criterios: {
      AS: 'Pérdida de altitud > 10 ft. Desvío de rumbo > 15°. Traslación brusca con rebote de altitud.',
      S:  'Pérdida de altitud < 8 ft. Rumbo desviado < 12°. Traslación controlada aunque no completamente suave.',
      SB: 'Altitud prácticamente constante. Rumbo preciso. Traslación suave y progresiva. Control anticipado.',
    },
    fallas: [],
    referencia: 'AW109E RFM §5-5',
  },
];

export const MANIOBRAS_R44: Maniobra[] = [
  {
    id: 'r_hover',
    nombre: 'Hover estacionario IGE',
    categoria: 'Control básico',
    objetivo: 'Demostrar control preciso del R44 en hover IGE sin asistencia del instructor.',
    procedimiento: [
      'Establecer hover a 2–4 ft AGL sobre punto fijo',
      'Mantener por 30 segundos con correcciones mínimas',
      'NR: 102% (governor), colectivo, cíclico y pedales coordinados',
    ],
    tolerancias: [
      'Posición horizontal: ±3 ft',
      'Altitud: ±1 ft',
      'Rumbo: ±10°',
      'NR: 102% ±2% (governor activo)',
    ],
    criterios: {
      AS: 'Correcciones grandes. Deriva > 5 ft. Governor activo pero con fluctuaciones de RPM.',
      S:  'Hover mantenido ±4 ft con correcciones visibles pero controladas. RPM estable.',
      SB: 'Control suave. Deriva < 2 ft. Anticipación de movimientos. RPM perfectamente estable.',
    },
    fallas: [
      { fallaId: 'r_governor', nombre: 'Falla governor RPM', momento: 'En hover estabilizado para evaluar gestión manual de RPM' },
    ],
    referencia: 'R44 POH §4 · RAA 61.57 §(a)',
  },
  {
    id: 'r_despegue',
    nombre: 'Despegue y aterrizaje vertical',
    categoria: 'Control básico',
    objetivo: 'Ejecutar despegue y aterrizaje vertical con control preciso.',
    procedimiento: [
      'Checks previos: RPM 102%, instrumentos en verde',
      'Aumentar colectivo hasta levantar skids, estabilizar en hover IGE',
      'Ascender verticalmente a 50 ft AGL',
      'Descender verticalmente a la posición original',
      'Aterrizaje suave: colectivo a mínimo al primer contacto',
    ],
    tolerancias: [
      'Desviación lateral durante despegue/aterrizaje: ±2 ft',
      'Rumbo: ±10°',
      'Tasa de descenso final: < 100 fpm',
      'RPM: 102% ±2% en todo momento',
    ],
    criterios: {
      AS: 'Movimiento lateral > 4 ft. Aterrizaje duro (tasa > 200 fpm). RPM fluctúa > ±5%.',
      S:  'Desviación < 3 ft. Aterrizaje aceptable. RPM estable con alguna fluctuación pequeña.',
      SB: 'Línea perfectamente vertical. Aterrizaje suave. RPM constante en todo el procedimiento.',
    },
    fallas: [
      { fallaId: 'r_nr_bajo', nombre: 'NR bajo — bajo RPM', momento: 'Durante ascenso para evaluar reacción' },
    ],
    referencia: 'R44 POH §4 · RAA 61.57 §(b)',
  },
  {
    id: 'r_autorot',
    nombre: 'Autorrotación con contacto',
    categoria: 'Emergencias',
    objetivo: 'Ejecutar autorrotación completa desde falla de motor hasta aterrizaje en superficie.',
    procedimiento: [
      'Falla de motor: colectivo a mínimo en < 2 segundos',
      'NR objetivo: 97–110% (no sobrepasar en descenso)',
      'Velocidad de planeo: 70 kts (velocidad de menor tasa de descenso)',
      'Flare a 40 ft: cabeceo atrás para reducir velocidad groundspeed',
      'Colectivo final a 8–10 ft para absorber impacto',
    ],
    tolerancias: [
      'Tiempo de respuesta: < 2 segundos',
      'NR: 97–110% en todo el descenso',
      'Velocidad de planeo: 65–80 kts',
      'Punto de flare: 35–50 ft AGL',
    ],
    criterios: {
      AS: 'Respuesta tardía > 3s. NR fuera de rango momentáneamente. Flare alto o bajo pero aterrizaje sin daño severo.',
      S:  'Respuesta en 2–3s. NR dentro de límites. Velocidad correcta. Flare en zona aceptable. Aterrizaje controlado.',
      SB: 'Respuesta < 2s. NR óptimo. Velocidad precisa. Flare perfecto. Aterrizaje suave con colectivo bien sincronizado.',
    },
    fallas: [
      { fallaId: 'r_motor', nombre: 'Falla de motor', momento: 'En crucero > 800 ft AGL para autorrotación completa' },
    ],
    referencia: 'R44 POH §3-7 Emergencias · RAA 61.57 §(a)(1)',
  },
  {
    id: 'r_falla1',
    nombre: 'Falla de motor > 500 ft',
    categoria: 'Emergencias',
    objetivo: 'Responder a falla de motor sobre 500 ft y ejecutar autorrotación de precisión a área seleccionada.',
    procedimiento: [
      'Falla de motor: colectivo a mínimo inmediatamente',
      'Seleccionar área de aterrizaje apropiada',
      'Velocidad de planeo: 70 kts',
      'Configurar la aproximación hacia el área seleccionada',
      'Flare y colectivo final para aterrizaje o go-around a 100 ft',
    ],
    tolerancias: [
      'Tiempo respuesta: < 2 segundos',
      'NR: 97–110%',
      'Velocidad: 65–80 kts',
      'Aterrizaje dentro de ±50 ft del punto seleccionado',
    ],
    criterios: {
      AS: 'Respuesta lenta > 3s o área de aterrizaje no alcanzada. NR fuera de rango. Aterrizaje > 80 ft del objetivo.',
      S:  'Respuesta en 2–3s. Área alcanzada. NR controlado. Aterrizaje dentro de ±60 ft.',
      SB: 'Respuesta < 2s. Autorrotación precisa. Aterrizaje dentro de ±30 ft del punto seleccionado.',
    },
    fallas: [
      { fallaId: 'r_motor',    nombre: 'Falla de motor', momento: 'En crucero a 800–1.500 ft AGL' },
      { fallaId: 'r_carb_ice', nombre: 'Hielo de carburador', momento: 'En descenso con temperatura marginal' },
    ],
    referencia: 'R44 POH §3-7 · RAA 61.57 §(a)(1)',
  },
  {
    id: 'r_falla2',
    nombre: 'Falla de motor 8–500 ft',
    categoria: 'Emergencias',
    objetivo: 'Manejar falla de motor en la zona crítica de la curva H/V del R44.',
    procedimiento: [
      'En la zona crítica H/V el tiempo de reacción es mínimo',
      'Falla: colectivo a mínimo SIN demora',
      'NO existe tiempo para seleccionar área: aterrizar de frente',
      'Si < 8 ft: terminar de aterrizar con colectivo',
      'Si 8–500 ft en la curva prohibida: aterrizaje en área de frente',
    ],
    tolerancias: [
      'Tiempo de respuesta: < 1 segundo (zona crítica)',
      'No intentar hover o cambio de dirección',
      'Aterrizaje controlado sin vuelco',
    ],
    criterios: {
      AS: 'Respuesta > 1.5s o intento de seleccionar área alternativa perdiendo control.',
      S:  'Respuesta rápida pero con algo de indecisión. Aterrizaje controlado sin daño mayor.',
      SB: 'Respuesta instantánea. Decisión correcta inmediata. Aterrizaje seguro.',
    },
    fallas: [
      { fallaId: 'r_motor', nombre: 'Falla de motor', momento: 'Precisamente en la zona crítica H/V al pasar 200 ft' },
    ],
    referencia: 'R44 POH §3-7 · Diagrama H/V Robinson',
  },
  {
    id: 'r_tr',
    nombre: 'Pérdida de rotor de cola',
    categoria: 'Emergencias',
    objetivo: 'Reconocer y manejar la pérdida de control direccional por falla del rotor de cola.',
    procedimiento: [
      'En hover: reducir colectivo a mínimo y aterrizar inmediatamente',
      'En vuelo traslacional: reducir potencia, mantener 40–60 kts',
      'Aterrizaje corrido con velocidad de avance para control direccional',
      'Sin intentar reducir velocidad a hover antes del aterrizaje',
    ],
    tolerancias: [
      'En hover: tiempo hasta inicio de aterrizaje < 3 segundos',
      'En traslación: velocidad de aterrizaje 40–60 kts',
      'Sin pérdida de control significativa',
    ],
    criterios: {
      AS: 'Reconocimiento correcto pero acción inapropiada. Intento de hover con TR no funcional.',
      S:  'Reconocimiento en 3–5s. Procedimiento correcto. Aterrizaje controlado.',
      SB: 'Reconocimiento inmediato < 3s. Procedimiento perfecto. Aterrizaje suave.',
    },
    fallas: [
      { fallaId: 'r_tr_falla', nombre: 'Falla rotor de cola', momento: 'En hover para el caso más crítico' },
    ],
    referencia: 'R44 POH §3-8',
  },
  {
    id: 'r_hyd',
    nombre: 'Falla sistema hidráulico R44',
    categoria: 'Sistemas',
    objetivo: 'Reconocer falla del servocontrol hidráulico y adaptar el control a fuerzas aumentadas.',
    procedimiento: [
      'Reconocer aumento de fuerzas de control',
      'Seleccionar switch hidráulico OFF para confirmar',
      'Reducir velocidad a < 60 kts para fuerzas manejables',
      'Lista de emergencia en memoria',
      'Aterrizar con velocidad aumentada (no intentar hover)',
    ],
    tolerancias: [
      'Reconocimiento: < 5 segundos',
      'Velocidad tras falla: < 60 kts',
      'Sin pérdida de control en ningún momento',
    ],
    criterios: {
      AS: 'Reconocimiento tardío. Mantiene velocidad alta (> 70 kts). Lista de emergencia omitida.',
      S:  'Reconocimiento en 5–10s. Reduce velocidad. Lista completada con guía mínima.',
      SB: 'Reconocimiento inmediato. Reducción de velocidad precisa. Aterrizaje correcto.',
    },
    fallas: [
      { fallaId: 'r_hyd', nombre: 'Falla hidráulica R44 (sin dataref directo — usar servo)', momento: 'En crucero estabilizado' },
    ],
    referencia: 'R44 POH §3-9 Hidráulico',
  },
  {
    id: 'r_gov',
    nombre: 'Falla governor RPM',
    categoria: 'Sistemas',
    objetivo: 'Reconocer falla del governor y controlar manualmente el RPM del rotor.',
    procedimiento: [
      'Reconocer fluctuación de RPM o luz de advertencia',
      'Asumir control manual de la maneta de aceleración',
      'Mantener NR en 102% ajustando maneta',
      'Comunicar falla al ATC',
      'Aterrizaje con control manual de RPM',
    ],
    tolerancias: [
      'NR manual: 97–110% (idealmente 102%)',
      'Sin overspeed sostenido > 110%',
      'Sin underspeed < 95%',
    ],
    criterios: {
      AS: 'NR oscila fuera de 90–115%. Necesita recordatorio del instructor. Aterrizaje logrado.',
      S:  'NR mantenido 95–108% con correcciones frecuentes. Control adecuado en aterrizaje.',
      SB: 'NR estabilizado en 100–104% con correcciones suaves. Aterrizaje con RPM correcto.',
    },
    fallas: [
      { fallaId: 'r_governor', nombre: 'Falla governor RPM', momento: 'En crucero estabilizado a altitud segura' },
    ],
    referencia: 'R44 POH §3-6 Governor',
  },
  {
    id: 'r_aprox',
    nombre: 'Aproximación de precisión',
    categoria: 'Normal',
    objetivo: 'Ejecutar aproximación para aterrizaje con parámetros controlados y estabilizada desde 300 ft.',
    procedimiento: [
      'Establecer trayectoria de aproximación a 300 AGL (aprox. 8–10° visual)',
      'Reducir velocidad progresivamente en la final',
      'Cruzar fence / umbral a 20–30 kts y 50 ft AGL',
      'Flare y hover a 3 ft antes de aterrizaje',
      'Aterrizaje suave en punto designado',
    ],
    tolerancias: [
      'Velocidad en cruce de fence: 15–30 kts',
      'Altitud en cruce de fence: 30–60 ft AGL',
      'Punto de aterrizaje: ±10 ft del objetivo',
      'Aterrizaje sin rebote',
    ],
    criterios: {
      AS: 'Aproximación inestabilizada. Velocidad o altitud fuera de límites en fence. Punto de aterrizaje > 20 ft.',
      S:  'Aproximación mayormente estabilizada. Cruce de fence dentro de límites. Aterrizaje correcto.',
      SB: 'Aproximación perfectamente estabilizada. Parámetros precisos. Aterrizaje suave en punto designado.',
    },
    fallas: [],
    referencia: 'R44 POH §4-8',
  },
];

export const AERODROMOS = [
  { icao:'SAEZ', nombre:'Buenos Aires — Ezeiza' },
  { icao:'SABE', nombre:'Buenos Aires — Aeroparque' },
  { icao:'SARC', nombre:'Resistencia' },
  { icao:'SAME', nombre:'Mendoza' },
  { icao:'SACO', nombre:'Córdoba' },
  { icao:'SAWH', nombre:'Ushuaia' },
  { icao:'SAZH', nombre:'Sauce Viejo' },
  { icao:'SAAG', nombre:'Junín' },
  { icao:'SADP', nombre:'Don Torcuato' },
  { icao:'SASA', nombre:'Salta' },
];
