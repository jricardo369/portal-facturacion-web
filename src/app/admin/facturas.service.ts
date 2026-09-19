import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminAuthService } from './auth.service';

export interface FacturaItem {
  idFactura?: number | null;
  folio?: string | null;
  serie?: string | null;
  fecha?: string | null;
  cliente?: string | null;
  rfc?: string | null;
  razonSocial?: string | null;
  noTicket?: string | null;
  subtotal?: number | null;
  impuesto?: number | null;
  total?: number | null;
  estatus?: string | null;
  uuid?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PaginaFactura {
  content?: FacturaItem[] | null;
  page?: number | null;
  size?: number | null;
  totalElements?: number | null;
  totalPages?: number | null;
}

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private readonly BASE = 'http://localhost:8080/api/v1/facturas';

  constructor(private http: HttpClient, private auth: AdminAuthService) {}

  obtenerFacturas(desde: string, hasta: string, noTicket: string, page: number, size: number): Observable<PaginaFactura> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (desde?.trim()) params = params.set('desde', `${desde}T00:00:00Z`);
    if (hasta?.trim()) params = params.set('hasta', `${hasta}T23:59:59.999Z`);
    if (noTicket?.trim()) params = params.set('noTicket', noTicket.trim());
    return this.http.get<PaginaFactura>(this.BASE, { params, headers: this.headers() });
  }

  private headers(): HttpHeaders {
    const session = this.auth.getSession<{ token?: string; tokenType?: string }>();
    const token = session?.token?.trim();
    if (!token) return new HttpHeaders();
    const tipo = session?.tokenType?.trim() || 'Bearer';
    return new HttpHeaders().set('Authorization', `${tipo} ${token}`);
  }
}
