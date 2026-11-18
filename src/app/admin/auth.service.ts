import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE } from '../shared/api-base';

export interface LoginRequest {
  usuario: string;
  password: string;
}

export type LoginResponse = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly KEY = 'auth_session';
  private readonly LEGACY_KEY = 'admin_session';
  private readonly URL = `${API_BASE}/auth/login`;

  constructor(private http: HttpClient) {}

  login(usuario: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { usuario: usuario.trim(), password };
    return this.http.post<LoginResponse>(this.URL, body).pipe(
      tap((res) => {
        const sesion = { ...(res ?? {}), usuario: usuario.trim() };
        localStorage.setItem(this.KEY, JSON.stringify(sesion));
      })
    );
  }

  getUsuarioLogueado(): string | null {
    const session = this.getSession<Record<string, unknown>>();
    if (!session) return null;
    for (const key of ['usuario', 'username', 'user', 'login', 'email']) {
      const v = session[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
  }

  logout(): void {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.LEGACY_KEY);
  }

  isLoggedIn(): boolean {
    return this.isTokenValido();
  }

  isTokenValido(): boolean {
    const session = this.getSession<Record<string, unknown>>();
    if (!session) return false;
    const token = this.extraerToken(session);
    if (!token) return false;
    const exp = this.obtenerExpiracion(token);
    if (exp === null) return true;
    return exp > Math.floor(Date.now() / 1000);
  }

  private extraerToken(session: Record<string, unknown>): string | null {
    const candidatos: unknown[] = [];
    const agregar = (valor: unknown): void => {
      if (valor && !candidatos.includes(valor)) candidatos.push(valor);
    };
    for (const key of ['token', 'accessToken', 'access_token', 'jwt', 'idToken']) agregar(session[key]);
    for (const key of Object.keys(session)) {
      const valor = session[key];
      if (valor && typeof valor === 'object') agregar((valor as Record<string, unknown>)['token']);
    }
    for (const valor of candidatos) {
      if (typeof valor === 'string' && valor.trim()) return valor.trim();
    }
    return null;
  }

  private obtenerExpiracion(token: string): number | null {
    const partes = token.split('.');
    if (partes.length < 2) return null;
    try {
      const normalizado = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(normalizado)) as { exp?: unknown };
      const exp = Number(payload.exp);
      return Number.isFinite(exp) ? exp : null;
    } catch {
      return null;
    }
  }

  getSession<T = LoginResponse>(): T | null {
    const raw = localStorage.getItem(this.KEY) ?? localStorage.getItem(this.LEGACY_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}
