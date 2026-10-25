import type { Local } from './modelos.ts';

const mesas = () => [2, 2, 4, 4, 4, 6, 6, 8].map((capacidad, i) => ({ id: `M${i + 1}`, capacidad }));

// Locales y cupos ilustrativos del prototipo; no son disponibilidad real.
export const locales: Local[] = [
  { id: 'centro', nombre: 'McDonald’s Centro', zona: 'Montevideo · Centro', descripcion: 'Una pausa rica en medio de la ciudad.', mesas: mesas() },
  { id: 'pocitos', nombre: 'McDonald’s Pocitos', zona: 'Montevideo · Pocitos', descripcion: 'El punto de encuentro de tus próximos planes.', mesas: mesas() },
  { id: 'carrasco', nombre: 'McDonald’s Carrasco', zona: 'Montevideo · Carrasco', descripcion: 'Más espacio para compartir en familia.', mesas: mesas() },
];

export const DURACION_MINUTOS = 90;
export const ANTICIPACION_MINUTOS = 30;
export const HORIZONTE_DIAS = 30;
export const horarios = Array.from({ length: 23 }, (_, i) => {
  const minutos = 11 * 60 + i * 30;
  return `${Math.floor(minutos / 60).toString().padStart(2, '0')}:${(minutos % 60).toString().padStart(2, '0')}`;
});

/** Las fechas de las reservas se interpretan siempre en Uruguay (UTC−03:00). */
export function fechaUruguay(ahora = new Date()): string {
  return new Date(ahora.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
}

export function fechaMaxima(ahora = new Date()): string {
  return fechaUruguay(new Date(ahora.getTime() + HORIZONTE_DIAS * 86400_000));
}

export function instante(fecha: string, hora: string): number {
  return Date.parse(`${fecha}T${hora}:00-03:00`);
}
