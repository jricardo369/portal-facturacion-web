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
  id?: number | null;
  descripcion?: string | null;
  cantidad?: number | null;
  precioUnitario?: number | null;
  importe?: number | null;
}

export interface TicketPago {
  id?: number | null;
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

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private readonly BASE = 'http://localhost:8080/api/v1/facturacion';

  constructor(private http: HttpClient) {}

  obtenerDatosFactura(rfc: string, numeroTicket: string): Observable<DatosFacturaResponse> {
    let params = new HttpParams().set('numeroTicket', numeroTicket.trim());
    if (rfc?.trim()) params = params.set('rfc', rfc.trim());
    return this.http.get<DatosFacturaResponse>(`${this.BASE}/datos-factura`, { params, headers: this.headers() });
  }

  consultarFacturaPorTicket(numeroTicket: string): Observable<DatosFacturaResponse> {
    const params = new HttpParams().set('numeroTicket', numeroTicket.trim());
    return this.http.get<DatosFacturaResponse>(`${this.BASE}/factura`, { params, headers: this.headers() });
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
        const session = JSON.parse(raw) as { token?: string; tokenType?: string };
        if (session?.token) headers = headers.set('Authorization', `Bearer ${session.token}`);
      }
    } catch {
      return headers;
    }
    return headers;
  }
}
