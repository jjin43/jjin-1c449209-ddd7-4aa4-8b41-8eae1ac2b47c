import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    try {
      const current = await firstValueFrom(this.auth.currentUser$);
      if (current) {
        this.router.navigate(['/tasks']);
        return;
      }
    } catch {}

    // fast-path didn't find a user; ask server to confirm session
    try {
      const me = await this.auth.me();
      if (me) this.router.navigate(['/tasks']);
    } catch {}
  }

  async submit() {
    this.error = null;
    try {
      console.log('[LoginComponent] submitting', { email: this.email, passwordLen: this.password?.length });
      await this.auth.login(this.email, this.password);
    } catch (err: any) {
      this.error = err?.message || 'Login failed';
    }
    if (!this.error) {
      this.router.navigate(['/tasks']);
    }

  }
}
