describe('Login con Azure B2C', () => {

  it('Debe iniciar sesión correctamente vía Azure B2C', () => {
    
    // 1. Inicia en tu aplicación local
    cy.visit('/'); 
    
    // 2. Haz click en TU botón de login (el de Angular)
    // Cambia 'button-login' por el ID o clase de tu botón
    cy.get('#btn-login-home').click(); 

    // 3. AQUÍ OCURRE LA MAGIA: Manejo del dominio externo
    // Reemplaza la URL con TU dominio real de B2C
    cy.origin('https://tutenant.b2clogin.com', () => {
      
      // Todo lo que escribas aquí ocurre DENTRO de la página de Microsoft/Azure
      
      // Azure suele usar IDs como 'email' o 'signInName'
      cy.get('#email, #signInName').type('usuario_test@dominio.com');
      
      // El input de password suele ser 'password'
      cy.get('#password').type('TuPasswordSeguro123');

      // El botón suele ser 'next' o 'submit'
      cy.get('#next').click();
    });

    // 4. De vuelta en Localhost (Angular)
    // Una vez que Azure redirige de vuelta, Cypress retoma el control aquí
    
    // Verifica que la URL ya no sea la de login
    cy.url().should('include', '/dashboard');
    
    // O verifica que aparezca un elemento que solo ve un usuario logueado
    cy.contains('Cerrar Sesión').should('be.visible');
  });

});