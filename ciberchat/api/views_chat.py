import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Chat, Message

# Vista para listar y crear chats
@require_http_methods(["GET", "POST"])
def chat_list_create(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "No estás autenticado"}, status=401)
    
    # GET: Obtener todos los chats del usuario
    if request.method == "GET":
        # Filtro para búsqueda en chats (opcional)
        search_query = request.GET.get('search', '')
        
        if search_query:
            # Buscar en títulos y mensajes
            chats = Chat.objects.filter(
                Q(user=request.user) & 
                (Q(title__icontains=search_query) | Q(messages__content__icontains=search_query))
            ).distinct()
        else:
            chats = Chat.objects.filter(user=request.user)
        
        data = [{
            "id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "last_message": chat.last_message,
            "unread_count": chat.unread_count
        } for chat in chats]
        
        return JsonResponse(data, safe=False)
    
    # POST: Crear un nuevo chat
    elif request.method == "POST":
        data = json.loads(request.body)
        title = data.get("title", "Nuevo chat")
        
        chat = Chat.objects.create(
            user=request.user,
            title=title
        )
        
        return JsonResponse({
            "id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "last_message": "",
            "unread_count": 0
        }, status=201)

# Vista para obtener, actualizar o eliminar un chat específico
@require_http_methods(["GET", "PUT", "DELETE"])
def chat_detail(request, chat_id):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "No estás autenticado"}, status=401)
    
    chat = get_object_or_404(Chat, id=chat_id, user=request.user)
    
    # GET: Obtener detalles del chat
    if request.method == "GET":
        return JsonResponse({
            "id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "last_message": chat.last_message,
            "unread_count": chat.unread_count
        })
    
    # PUT: Actualizar el chat (p.ej. cambiar el título)
    elif request.method == "PUT":
        data = json.loads(request.body)
        title = data.get("title")
        
        if title:
            chat.title = title
            chat.save()
        
        return JsonResponse({
            "id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "last_message": chat.last_message,
            "unread_count": chat.unread_count
        })
    
    # DELETE: Eliminar el chat
    elif request.method == "DELETE":
        chat.delete()
        return JsonResponse({"detail": "Chat eliminado con éxito"})

# Vista para listar y crear mensajes en un chat
@require_http_methods(["GET", "POST"])
def message_list_create(request, chat_id):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "No estás autenticado"}, status=401)
    
    chat = get_object_or_404(Chat, id=chat_id, user=request.user)
    
    # GET: Obtener mensajes del chat
    if request.method == "GET":
        # Marcar mensajes del asistente como leídos
        unread_messages = chat.messages.filter(read=False, sender="assistant")
        unread_messages.update(read=True)
        
        # Filtrar mensajes para búsqueda (opcional)
        search_query = request.GET.get('search', '')
        
        if search_query:
            messages = chat.messages.filter(content__icontains=search_query)
        else:
            messages = chat.messages.all()
        
        data = [{
            "id": message.id,
            "content": message.content,
            "sender": message.sender,
            "timestamp": message.timestamp.isoformat(),
            "read": message.read
        } for message in messages]
        
        return JsonResponse(data, safe=False)
    
    # POST: Crear un nuevo mensaje
    elif request.method == "POST":
        data = json.loads(request.body)
        content = data.get("content")
        
        if not content:
            return JsonResponse({"detail": "El contenido no puede estar vacío"}, status=400)
        
        # Crear mensaje del usuario
        user_message = Message.objects.create(
            chat=chat,
            content=content,
            sender="user",
            read=True  # Los mensajes del usuario siempre se marcan como leídos
        )
        
        # Actualizar la fecha de modificación del chat
        chat.save()
        
        # Aquí es donde se integraría la llamada al LLM
        # Por ahora, simulamos una respuesta simple
        assistant_message = Message.objects.create(
            chat=chat,
            content="Esta es una respuesta automática. En el futuro, aquí se integrará la respuesta del LLM.",
            sender="assistant",
            read=False
        )
        
        return JsonResponse({
            "id": user_message.id,
            "content": user_message.content,
            "sender": user_message.sender,
            "timestamp": user_message.timestamp.isoformat(),
            "read": user_message.read
        }, status=201)

# Vista para buscar mensajes en todos los chats
@require_http_methods(["GET"])
def search_messages(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "No estás autenticado"}, status=401)
    
    search_query = request.GET.get('q', '')
    
    if not search_query:
        return JsonResponse({"detail": "Se requiere un término de búsqueda"}, status=400)
    
    # Buscar mensajes que coincidan con la consulta
    messages = Message.objects.filter(
        chat__user=request.user,
        content__icontains=search_query
    ).select_related('chat').order_by('-timestamp')
    
    # Agrupar por chat para mostrar resultados organizados
    results = {}
    for message in messages:
        chat_id = message.chat.id
        if chat_id not in results:
            results[chat_id] = {
                "chat_id": chat_id,
                "chat_title": message.chat.title,
                "messages": []
            }
        
        results[chat_id]["messages"].append({
            "id": message.id,
            "content": message.content,
            "sender": message.sender,
            "timestamp": message.timestamp.isoformat()
        })
    
    return JsonResponse(list(results.values()), safe=False)