import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" role="status" aria-live="polite" [attr.aria-label]="texto">
      <div class="loader">
        <img class="loader-logo" src="assets/logo.png" alt="Oso Despierto" />
      </div>
      <p class="loading-texto">{{ texto }}</p>
    </div>
  `,
  styles: [`
    .loading-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; gap: 18px; align-items: center; justify-content: center; background: rgba(255,255,255,.92); backdrop-filter: blur(2px); }
    .loader { position: relative; width: 140px; height: 140px; display: grid; place-items: center; }
    .loader::before { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 8px solid #F5C6BC; border-top-color: #E8412A; animation: girar 0.9s linear infinite; }
    .loader-logo { width: 92px; height: 92px; object-fit: contain; border-radius: 50%; }
    .loading-texto { margin: 0; font-family: "Comfortaa", "Nunito", sans-serif; font-size: 16px; font-weight: 700; color: #235451; }
    @keyframes girar { to { transform: rotate(360deg); } }
  `],
})
export class LoadingOverlayComponent {
  @Input() texto = 'Cargando…';
}
