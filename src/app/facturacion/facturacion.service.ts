import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClienteDatos {
  idCliente?: number | null;
  rfc?: string | null;
  razonSocial?: string | null;
  calle?: string | null;
  numExterior?: string | null;
  numInterior?: string | null;
  referencia?: string | null;
  estado?: string | null;
  municipio?: string | null;
  colonia?: string | null;
  codigoPostal?: string | null;
  correoElectronico?: string | null;
  regimenFiscal?: string | null;
  usoFactura?: string | null;
  estatus?: boolean | null;
}

export interface TicketItem {
  id?: string | number | null;
  descripcion?: string | null;
  cantidad?: number | null;
  precioUnitario?: number | null;
  importe?: number | null;
}

export interface TicketPago {
  id?: string | number | null;
  metodo?: string | null;
  monto?: number | null;
}

export interface DatosFacturaResponse {
  numeroTicket?: string | null;
  total?: number | null;
  subtotal?: number | null;
  impuestos?: number | null;
  tipoVenta?: string | null;
  fechaEmision?: string | null;
  fechaCierre?: string | null;
  clienteTicket?: string | null;
  facturable?: boolean | null;
  items?: TicketItem[] | null;
  pagos?: TicketPago[] | null;
  tipoPago?: string | null;
  cliente?: ClienteDatos | null;
}

export type DatosFacturaPayload = DatosFacturaResponse;

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private readonly BASE = '/api/v1/facturacion';

  constructor(private http: HttpClient) {}

  obtenerDatosFactura(rfc: string, numeroTicket: string, fecha?: string, total?: number): Observable<DatosFacturaResponse> {
    let params = new HttpParams().set('numeroTicket', numeroTicket.trim());
    if (rfc?.trim()) params = params.set('rfc', rfc.trim());
    if (fecha?.trim()) params = params.set('fecha', fecha.trim());
    if (total !== undefined && total !== null && Number.isFinite(Number(total))) {
      params = params.set('total', String(total));
    }
    return this.http.get<DatosFacturaResponse>(`${this.BASE}/datos-factura`, { params, headers: this.headers() });
  }

  consultarFacturaPorTicket(numeroTicket: string): Observable<DatosFacturaResponse> {
    const params = new HttpParams().set('numeroTicket', numeroTicket.trim());
    return this.http.get<DatosFacturaResponse>(`${this.BASE}/factura`, { params, headers: this.headers() });
  }

  buscarFactura(filtro: string): Observable<DatosFacturaResponse> {
    const params = new HttpParams().set('filtro', filtro.trim());
    return this.http.get<DatosFacturaResponse>(`${this.BASE}/factura/buscar`, { params, headers: this.headers() });
  }

  refacturar(datos: DatosFacturaPayload): Observable<DatosFacturaResponse> {
    return this.http.post<DatosFacturaResponse>(`${this.BASE}/refacturar`, datos, { headers: this.headers() });
  }

  facturar(datos: DatosFacturaResponse): Observable<DatosFacturaResponse> {
    return this.http.post<DatosFacturaResponse>(`${this.BASE}/facturar`, datos, { headers: this.headers() });
  }

  enviarCorreo(correoElectronico: string, numeroTicket: string): Observable<any> {
    return this.http.post<any>(`${this.BASE}/enviar-correo`,
      { correoElectronico, numeroTicket }, { headers: this.headers() });
  }

  reenviarFactura(correoElectronico: string, numeroTicket: string): Observable<any> {
    return this.http.post<any>(`${this.BASE}/reenviar-factura`,
      { correoElectronico, numeroTicket }, { headers: this.headers() });
  }

  private headers(): HttpHeaders {
    let headers = new HttpHeaders();
    try {
      const raw = localStorage.getItem('auth_session') ?? localStorage.getItem('admin_session');
      if (raw) {
        const session = JSON.parse(raw) as Record<string, unknown>;
        const token = this.extraerToken(session);
        if (token) headers = headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      return headers;
    }
    return headers;
  }

  private extraerToken(session: Record<string, unknown>): string | null {
    const directa: unknown[] = [];
    const agregar = (v: unknown): void => {
      if (v && !directa.includes(v)) directa.push(v);
    };
    for (const key of ['token', 'accessToken', 'access_token', 'jwt', 'idToken']) agregar(session[key]);
    for (const key of Object.keys(session)) {
      const v = session[key];
      if (v && typeof v === 'object') agregar((v as Record<string, unknown>)['token']);
    }
    for (const v of directa) {
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
  }
}
