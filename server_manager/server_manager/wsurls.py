"""
URL configuration for server_manager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.http import HttpResponse
from django.contrib import admin
from django.urls import path
from core.telemetry import telemetryWebSocketConnector
from core.controlapi import *
from core.mseFmp4 import *

urlpatterns = [
    path("control/js", jsWsConnector.as_asgi()),
    path("control/client",clientWsConnector.as_asgi()),
    path("uartunnel", telemetryWebSocketConnector.as_asgi()),
    path('mse/client', streamingFmp4WebsocketConnector.as_asgi()),
    path('mse/js',streamingFmp4WebsocketConnectorJS.as_asgi())
]
