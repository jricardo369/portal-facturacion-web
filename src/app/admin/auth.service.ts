import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  usuario: string;
  password: string;
}

export type LoginResponse = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly KEY = 'auth_session';
  private readonly LEGACY_KEY = 'admin_session';
  private readonly URL = 'http://localhost:8080/api/v1/auth/login';

  constructor(private http: HttpClient) {}

  login(usuario: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { usuario: usuario.trim(), password };
    return this.http.post<LoginResponse>(this.URL, body).pipe(
      tap((res) => localStorage.setItem(this.KEY, JSON.stringify(res ?? {})))
    );
  }

  logout(): void {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.LEGACY_KEY);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(this.KEY) !== null || localStorage.getItem(this.LEGACY_KEY) !== null;
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
