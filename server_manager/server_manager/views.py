
from django.shortcuts import render
from django.http import JsonResponse


def stream_page(request):
    return render(request, "index.html")
