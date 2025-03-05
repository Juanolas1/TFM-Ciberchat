from django.urls import path
from . import views, views_chat

urlpatterns = [
    # Rutas de autenticación
    path("login/", views.login_view, name="api-login"),
    path("logout/", views.logout_view, name="api-logout"),
    path("session/", views.session_view, name="api-session"),
    path("whoami/", views.whoami_view, name="api-whoami"),
    path("register/", views.register_view, name="api-register"),
    
    # Rutas para el chat
    path("chats/", views_chat.chat_list_create, name="api-chat-list-create"),
    path("chats/<int:chat_id>/", views_chat.chat_detail, name="api-chat-detail"),
    path("chats/<int:chat_id>/messages/", views_chat.message_list_create, name="api-message-list-create"),
    path("search/messages/", views_chat.search_messages, name="api-search-messages"),
]