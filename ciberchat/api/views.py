from django.shortcuts import render

# Create your views here.

import json
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST

@require_POST
def login_view(request):
    data = json.loads(request.body)
    username = data.get("username")
    password = data.get("password")

    if username is None or password is None:
        return JsonResponse({"detail":"Por favor, indique contraseña y usuario"})
    
    user = authenticate(username=username, password=password)
    if user is None:
        return JsonResponse({"detail":"Credenciales incorrectas"},status=400)
    
    login(request,user)
    return JsonResponse({"details":"Logueado con éxito"})

def logout_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail":"No estás logueado"}, status=400)
    logout(request)
    return JsonResponse({"detail":"Sesión cerrada con éxtio"})
    

@ensure_csrf_cookie
def session_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"isAuthenticated": False})
    return JsonResponse({"isAuthenticated": True})

def whoami_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"isAuthenticated": False})
    return JsonResponse({"username": request.user.username})


# Agrega esto a tu archivo views.py existente
import json
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db import IntegrityError

@require_POST
def register_view(request):
    data = json.loads(request.body)
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    
    # Validación básica
    if not username or not email or not password:
        return JsonResponse({'detail': 'Por favor, proporciona nombre de usuario, email y contraseña'}, status=400)
    
    try:
        # Crear el usuario
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        return JsonResponse({'detail': 'Usuario registrado con éxito'})
    except IntegrityError:
        # Error si el usuario o email ya existe
        return JsonResponse({'detail': 'El nombre de usuario o email ya está en uso'}, status=400)
    except Exception as e:
        return JsonResponse({'detail': f'Error al registrar el usuario: {str(e)}'}, status=500)