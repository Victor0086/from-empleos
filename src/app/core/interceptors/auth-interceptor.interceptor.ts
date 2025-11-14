import { Injectable } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

// Interceptor funcional
export const authInterceptorProvider: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt');
  console.log('Token enviado en el header Authorization:', token);
  if (!token) {
    return next(req);
  }
  const req1 = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });
  return next(req1);
};
