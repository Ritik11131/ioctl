import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { UiService } from '../../layout/service/ui.service';
import { AuthService } from '../service/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator],
    template: `
        <!-- <app-floating-configurator /> -->
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="assets/images/Indane.png" alt="Indane Logo" class="mx-auto mb-4 w-32 h-auto" />
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome!</div>
                            <span class="text-gray-500 dark:text-gray-400 font-medium">Sign in to continue</span>
                        </div>

                        <div>
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email1" type="text" placeholder="Email address" class="w-full md:w-[30rem] mb-8" [(ngModel)]="usernameOrEmail" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                            <p-password id="password1" [(ngModel)]="password" placeholder="Password" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                            <!-- <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="checked" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">Remember me</label>
                                </div>
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
                            </div> -->
                            <p-button label="Sign In" styleClass="w-full" (onClick)="signIn()"></p-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    usernameOrEmail: string = 'abhishek.jiyoun@gmail.com';

    password: string = '123456';

    checked: boolean = false;

    constructor(
        private uiService: UiService,
        private authService: AuthService,
        private router: Router
    ) {}

    async signIn(): Promise<any> {
        this.uiService.toggleLoader(true);
        try {
            await this.authService.login(this.usernameOrEmail, this.password);
            this.router.navigate(['/pages/rtd-approval']);
            this.uiService.showToast('success', 'Success', 'Welcome');
        } catch (error: any) {
            console.error(error);
            this.uiService.showToast('error', 'Error', 'Failed to logIN');
        } finally {
            this.uiService.toggleLoader(false);
        }
    }
}
