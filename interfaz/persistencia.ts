import { ErrorReserva, type RepositorioReservas, type Reserva } from '../dominio/modelos.ts';
const CLAVE = 'mc-mesa.reservas.v1';

function esReserva(valor: unknown): valor is Reserva {
  if (!valor || typeof valor !== 'object') return false;
  const r = valor as Record<string, unknown>;
  return ['id', 'codigo', 'mesaId', 'localId', 'fecha', 'hora', 'nombre', 'email', 'telefono', 'notas', 'creadaEn'].every(k => typeof r[k] === 'string')
    && typeof r.personas === 'number' && (r.estado === 'confirmada' || r.estado === 'cancelada');
}

export class RepositorioLocal implements RepositorioReservas {
  listar(): Reserva[] {
    try {
      const contenido = localStorage.getItem(CLAVE);
      if (!contenido) return [];
      const datos: unknown = JSON.parse(contenido);
      if (!Array.isArray(datos) || !datos.every(esReserva)) throw new Error('Formato incorrecto');
      return datos;
    } catch {
      throw new ErrorReserva('No se pudieron leer las reservas de este navegador. Habilitá el almacenamiento local o probá en otro navegador.');
    }
  }

  guardar(reserva: Reserva): void {
    const reservas = this.listar();
    const indice = reservas.findIndex(r => r.id === reserva.id);
    if (indice === -1) reservas.push(reserva);
    else reservas[indice] = reserva;
    try { localStorage.setItem(CLAVE, JSON.stringify(reservas)); }
    catch { throw new ErrorReserva('No pudimos guardar tu reserva. Revisá el espacio y los permisos de este navegador.'); }
  }
}
