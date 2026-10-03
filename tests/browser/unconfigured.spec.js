import {test,expect} from '@playwright/test';
test('without backend configuration, no fake registration or login is offered',async({page})=>{
 await page.goto('/cadastro');
 await expect(page.getByText('O painel ainda está sendo preparado.',{exact:false})).toBeVisible();
 await expect(page.getByRole('button',{name:'Criar conta',exact:true})).toBeDisabled();
 await page.goto('/login');
 await expect(page.getByRole('button',{name:'Entrar',exact:true})).toBeDisabled();
 await page.goto('/dashboard');await expect(page).toHaveURL(/login/);
});
