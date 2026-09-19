import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subject, Subscription, filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SesionInactivaService implements OnDestroy {
  private readonly IDLE_MILIS = 15 * 60 * 1000;
  private readonly EVENTOS = [
    'pointerdown',
    'keydown',
    'touchstart',
    'wheel',
    'scroll',
  ] as const;
  private readonly THROTTLE_MILIS = 1000;

  private activo = false;
  private temporizador?: ReturnType<typeof setTimeout>;
  private suscripcion = new Subscription();
  private ultimoReinicio = 0;
  private manejarActividad = (): void => this.reiniciar();
  private dialogo = new Subject<void>();

  dialogo$: Observable<void> = this.dialogo.asObservable();

  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {}

  iniciar(): void {
    if (this.activo) return;
    this.activo = true;
    this.suscripcion.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => this.sincronizar())
    );
    this.sincronizar();
  }

  ngOnDestroy(): void {
    this.detener();
  }

  private sincronizar(): void {
    if (this.esProtegida(this.router.url)) {
      this.armar();
    } else {
      this.desarmar();
    }
  }

  private esProtegida(url: string): boolean {
    const normalizada = url.split('?')[0].split('#')[0];
    if (normalizada === '/refacturar') return true;
    if (normalizada === '/admin' || normalizada === '/admin/') return false;
    return normalizada.startsWith('/admin/');
  }

  private armar(): void {
    window.clearTimeout(this.temporizador);
    this.temporizador = this.ngZone.runOutsideAngular(() =>
      setTimeout(() => this.ngZone.run(() => this.expiro()), this.IDLE_MILIS)
    );
    for (const evento of this.EVENTOS) {
      document.addEventListener(evento, this.manejarActividad, { passive: true });
    }
    document.addEventListener('mousemove', this.manejarActividad, { passive: true });
  }

  private desarmar(): void {
    window.clearTimeout(this.temporizador);
    this.temporizador = undefined;
    for (const evento of this.EVENTOS) {
      document.removeEventListener(evento, this.manejarActividad);
    }
    document.removeEventListener('mousemove', this.manejarActividad);
  }

  private reiniciar(): void {
    if (!this.temporizador) return;
    const ahora = Date.now();
    if (ahora - this.ultimoReinicio < this.THROTTLE_MILIS) return;
    this.ultimoReinicio = ahora;
    window.clearTimeout(this.temporizador);
    this.temporizador = this.ngZone.runOutsideAngular(() =>
      setTimeout(() => this.ngZone.run(() => this.expiro()), this.IDLE_MILIS)
    );
  }

  private expiro(): void {
    this.desarmar();
    this.dialogo.next();
  }

  reanudar(): void {
    this.sincronizar();
  }

  esRutaActualProtegida(): boolean {
    return this.esProtegida(this.router.url);
  }

  private detener(): void {
    this.desarmar();
    this.suscripcion.unsubscribe();
    this.activo = false;
  }
}