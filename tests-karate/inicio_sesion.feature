Feature: Smoke Test de API con Karate

  Background:
    * url 'http://localhost:8001'
    # Paso de Login para obtener el token
    * form field username = 'admin'
    * form field password = '123'
    * form field grant_type = 'password'
    * path 'token'
    * method post
    * status 200gg
    * def authToken = response.access_token

  Scenario: Verificar lista de productos
    * path 'products'
    * header Authorization = 'Bearer ' + authToken
    * method get
    * status 200
    * match each response == { id: '#number', name: '#string', description: '#string', category: '#string', price: '#number', stock: '#number' }