import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { LoadingOverlayComponent } from '../../shared/loading-overlay.component';
import { ErrorDialogComponent } from '../../shared/error-dialog.component';
import { FacturasService, FacturaItem } from '../facturas.service';
import { AdminAuthService } from '../auth.service';

@Component({
  selector: 'app-admin-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, LoadingOverlayComponent, ErrorDialogComponent],
  templateUrl: './admin-facturas.component.html',
  styleUrls: ['./admin-facturas.component.css'],
})
export class AdminFacturasComponent implements OnInit {
  facturas: FacturaItem[] = [];
  ticket = '';
  desde = '';
  hasta = '';
  pagina = 1;
  porPagina = 10;
  totalElementos = 0;
  cargando = false;
  error = '';
  private totalPaginasApi = 1;
  private cargaId = 0;

  constructor(
    private svc: FacturasService,
    private auth: AdminAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get total(): number {
    return this.facturas
      .filter((f) => !this.esCancelada(f))
      .reduce((a, f) => a + (f.total ?? 0), 0);
  }

  get totalPaginas(): number {
    return this.totalPaginasApi;
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get rango(): string {
    if (this.totalElementos === 0) return '0 de 0';
    const inicio = (this.pagina - 1) * this.porPagina + 1;
    const fin = Math.min(this.pagina * this.porPagina, this.totalElementos);
    return `${inicio}–${fin} de ${this.totalElementos}`;
  }

  irAPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas && p !== this.pagina) {
      this.pagina = p;
      this.cargar();
    }
  }

  buscar(): void {
    this.pagina = 1;
    this.cargar();
  }

  salir(): void {
    this.auth.logout();
    void this.router.navigate(['/admin']);
  }

  limpiar(): void {
    this.ticket = '';
    this.desde = '';
    this.hasta = '';
    this.pagina = 1;
    this.cargar();
  }

  cargar(): void {
    const id = ++this.cargaId;
    this.cargando = true;
    this.error = '';
    this.svc
      .obtenerFacturas(this.desde, this.hasta, this.ticket, this.pagina - 1, this.porPagina)
      .subscribe({
        next: (res) => {
          if (id !== this.cargaId) return;
          this.facturas = res.content ?? [];
          this.totalElementos = res.totalElements ?? 0;
          this.totalPaginasApi = Math.max(1, res.totalPages ?? 1);
          if (this.pagina > this.totalPaginasApi) this.pagina = this.totalPaginasApi;
          this.cargando = false;
        },
        error: () => {
          if (id !== this.cargaId) return;
          this.facturas = [];
          this.totalElementos = 0;
          this.cargando = false;
          this.error = 'No se pudieron cargar las facturas. Verifica la conexión e intenta de nuevo.';
        },
      });
  }

  estado(f: FacturaItem): string {
    return f.estatus ?? '';
  }

  esCancelada(f: FacturaItem): boolean {
    return (f.estatus ?? '').toLowerCase() === 'cancelada';
  }

  formatearFecha(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  cliente(f: FacturaItem): string {
    return f.cliente ?? f.razonSocial ?? '';
  }
}
