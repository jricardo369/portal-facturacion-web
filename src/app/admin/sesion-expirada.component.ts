import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AdminAuthService } from './auth.service';
import { SesionInactivaService } from './sesion-inactiva.service';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';

@Component({
    selector: 'app-sesion-expirada',
    imports: [FormsModule, LoadingOverlayComponent],
    templateUrl: './sesion-expirada.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./sesion-expirada.component.css']
})
export class SesionExpiradaComponent implements OnDestroy {
  visible = false;
  usuario = '';
  password = '';
  error = '';
  mostrar = false;
  cargando = false;
  private suscripcion = new Subscription();

  constructor(
    private auth: AdminAuthService,
    private sesionInactiva: SesionInactivaService,
    private router: Router
  ) {
    this.suscripcion.add(
      this.sesionInactiva.dialogo$.subscribe(() => this.abrir())
    );
    this.suscripcion.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => {
          if (!this.sesionInactiva.esRutaActualProtegida() && !this.cargando) {
            this.cerrar();
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
  }

  get usuarioLogueado(): string {
    return this.auth.getUsuarioLogueado() ?? '';
  }

  continuar(): void {
    this.error = '';
    const usuario = this.usuario.trim();
    if (!usuario || !this.password) {
      this.error = 'Capture usuario y contraseña.';
      return;
    }
    const logueado = this.auth.getUsuarioLogueado();
    if (!logueado || usuario.toLowerCase() !== logueado.toLowerCase()) {
      this.error = 'El usuario no coincide con el usuario logeado.';
      return;
    }
    this.cargando = true;
    this.auth.login(usuario, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.cerrar();
        this.sesionInactiva.reanudar();
      },
      error: (e) => {
        this.cargando = false;
        this.error =
          e?.status === 401
            ? 'Usuario o contraseña incorrectos.'
            : 'No se pudo verificar la sesión. Intente de nuevo.';
      },
    });
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.cerrar();
    void this.router.navigate(['/admin']);
  }

  private abrir(): void {
    this.usuario = '';
    this.password = '';
    this.error = '';
    this.mostrar = false;
    this.visible = true;
  }

  private cerrar(): void {
    this.visible = false;
  }
}