// src/store/configStore.ts
// Configuración persistida entre sesiones

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AeronaveId, ConfigMeteo } from '../types';

const STORAGE_KEY = '@6xsim_config';

export interface ConfigState {
  // Instrucción
  aeronave:          AeronaveId;
  xplane_ip:         string;
  icao:              string;
  hora_local:        string;
  piloto_nombre:     string;
  piloto_licencia:   string;
  instructor_nombre: string;
  meteo:             ConfigMeteo;

  // Acciones
  setAeronave:       (a: AeronaveId) => void;
  setXPlaneIP:       (ip: string) => void;
  setIcao:           (icao: string) => void;
  setHora:           (h: string) => void;
  setPiloto:         (nombre: string, licencia: string) => void;
  setInstructor:     (nombre: string) => void;
  setMeteo:          (m: Partial<ConfigMeteo>) => void;
  cargar:            () => Promise<void>;
  guardar:           () => Promise<void>;
}

const meteoDefault: ConfigMeteo = {
  viento_dir:     240,
  viento_kts:     8,
  visibilidad_sm: 10,
  turbulencia:    0,
  tipo_nubes:     'CAVOK',
  techo_ft:       5000,
  temperatura_c:  18,
};

export const useConfigStore = create<ConfigState>((set, get) => ({
  aeronave:          'AW109',
  xplane_ip:         '192.168.1.100',
  icao:              'SAEZ',
  hora_local:        '10:00',
  piloto_nombre:     '',
  piloto_licencia:   '',
  instructor_nombre: 'May. Laura Rivas',
  meteo:             meteoDefault,

  setAeronave:   (a)    => { set({ aeronave: a }); get().guardar(); },
  setXPlaneIP:   (ip)   => { set({ xplane_ip: ip }); get().guardar(); },
  setIcao:       (icao) => { set({ icao }); get().guardar(); },
  setHora:       (h)    => { set({ hora_local: h }); get().guardar(); },
  setPiloto:     (n, l) => { set({ piloto_nombre: n, piloto_licencia: l }); get().guardar(); },
  setInstructor: (n)    => { set({ instructor_nombre: n }); get().guardar(); },
  setMeteo:      (m)    => {
    set((s) => ({ meteo: { ...s.meteo, ...m } }));
    get().guardar();
  },

  cargar: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({ ...saved, meteo: { ...meteoDefault, ...saved.meteo } });
      }
    } catch { /* primera vez — usar defaults */ }
  },

  guardar: async () => {
    try {
      const { cargar: _c, guardar: _g, setAeronave: _sa, setXPlaneIP: _si,
              setIcao: _ii, setHora: _sh, setPiloto: _sp, setInstructor: _st,
              setMeteo: _sm, ...data } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignorar errores de storage */ }
  },
}));
