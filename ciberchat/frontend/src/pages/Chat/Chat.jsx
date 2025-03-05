import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from 'universal-cookie';
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBIcon,
  MDBTypography,
  MDBInputGroup,
  MDBBtn,
  MDBTooltip,
  MDBSpinner
} from "mdb-react-ui-kit";
import { useAuth } from "../../context/AuthContext";
import "./Chat.css";

const cookies = new Cookies();

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { whoami } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingChatTitle, setEditingChatTitle] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [allChatMessages, setAllChatMessages] = useState({});
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);
  // Referencia para rastrear si debemos reorganizar los chats después de enviar un mensaje
  const shouldReorderChatsRef = useRef(false);

  // Obtener información del usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await whoami();
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error al obtener información del usuario:", error);
      }
    };
    fetchCurrentUser();
  }, [whoami]);

  // Obtener los chats del usuario
  useEffect(() => {
    if (currentUser) {
      fetchChats();
    }
  }, [currentUser]);

  // Obtener mensajes cuando cambia el chat seleccionado
  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    } else if (chats.length > 0) {
      // Si no hay chatId en la URL pero hay chats, selecciona el primero
      const firstChatId = chats[0].id;
      fetchMessages(firstChatId);
      
      // Actualizar la URL para reflejar el chat seleccionado sin recargar la página
      navigate(`/chat/${firstChatId}`, { replace: true });
    }
  }, [chatId, chats, navigate]);

  // Cargar todos los mensajes de todos los chats para la búsqueda
  useEffect(() => {
    if (chats.length > 0 && searchTerm.length > 2) {
      fetchAllChatMessages();
    }
  }, [searchTerm, chats]);

  // Scroll al último mensaje
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus en el input de edición cuando se activa
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Función para obtener los chats del usuario
  const fetchChats = async () => {
    try {
      // En un futuro, reemplazar con una llamada real a la API
      const response = await fetch("/api/chats/", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      } else {
        // Datos de ejemplo mientras implementas el backend
        setChats([
          { 
            id: 1, 
            title: "Chat sobre Python", 
            last_message: "¿Puedes explicarme cómo funcionan los decoradores?",
            created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            unread_count: 0
          },
          { 
            id: 2, 
            title: "Ayuda con React", 
            last_message: "Estoy teniendo problemas con los hooks",
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            unread_count: 2
          },
          { 
            id: 3, 
            title: "Consulta sobre Django", 
            last_message: "¿Cómo puedo implementar autenticación JWT?",
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            unread_count: 0
          }
        ]);
      }
    } catch (error) {
      console.error("Error al obtener los chats:", error);
    }
  };

  // Función para obtener los mensajes de un chat
  const fetchMessages = async (id) => {
    try {
      // Actualizar la URL para reflejar el chat seleccionado
      if (id !== chatId) {
        navigate(`/chat/${id}`, { replace: true });
      }
      
      // En un futuro, reemplazar con una llamada real a la API
      const response = await fetch(`/api/chats/${id}/messages/`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        const selectedChat = chats.find(chat => chat.id === parseInt(id));
        if (selectedChat) {
          setCurrentChat(selectedChat);
        }
        
        // Guardar mensajes en el estado para búsquedas
        setAllChatMessages(prev => ({
          ...prev,
          [id]: data
        }));
      } else {
        // Datos de ejemplo mientras implementas el backend
        const mockMessages = [
          {
            id: 1,
            content: "Hola, ¿en qué puedo ayudarte hoy?",
            sender: "assistant",
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            content: "Tengo una consulta sobre programación",
            sender: "user",
            timestamp: new Date(Date.now() - 59 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            content: "¡Claro! ¿Qué te gustaría saber específicamente?",
            sender: "assistant",
            timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString()
          }
        ];
        setMessages(mockMessages);
        const selectedChat = chats.find(chat => chat.id === parseInt(id));
        if (selectedChat) {
          setCurrentChat(selectedChat);
        }
        
        // Para el chat 1 de ejemplo, añadimos mensajes con contenido distinto para probar la búsqueda
        if (id === 1) {
          const pythonMessages = [
            ...mockMessages,
            {
              id: 4,
              content: "Me gustaría entender cómo funcionan los decoradores en Python",
              sender: "user",
              timestamp: new Date(Date.now() - 57 * 60 * 1000).toISOString()
            },
            {
              id: 5,
              content: "Los decoradores en Python son funciones que modifican el comportamiento de otras funciones. Permiten ejecutar código antes y después de la función decorada.",
              sender: "assistant",
              timestamp: new Date(Date.now() - 56 * 60 * 1000).toISOString()
            }
          ];
          setAllChatMessages(prev => ({
            ...prev,
            [id]: pythonMessages
          }));
        } 
        // Para el chat 2 de ejemplo
        else if (id === 2) {
          const reactMessages = [
            ...mockMessages,
            {
              id: 4,
              content: "Estoy teniendo problemas al usar useEffect en React",
              sender: "user",
              timestamp: new Date(Date.now() - 57 * 60 * 1000).toISOString()
            },
            {
              id: 5,
              content: "useEffect es un hook para manejar efectos secundarios. Recuerda incluir todas las dependencias en el array.",
              sender: "assistant",
              timestamp: new Date(Date.now() - 56 * 60 * 1000).toISOString()
            }
          ];
          setAllChatMessages(prev => ({
            ...prev,
            [id]: reactMessages
          }));
        }
        // Para el chat 3 de ejemplo
        else if (id === 3) {
          const djangoMessages = [
            ...mockMessages,
            {
              id: 4,
              content: "Necesito implementar JWT en Django para mi API",
              sender: "user",
              timestamp: new Date(Date.now() - 57 * 60 * 1000).toISOString()
            },
            {
              id: 5,
              content: "Para JWT en Django, puedes usar Django REST framework con la librería djangorestframework-simplejwt.",
              sender: "assistant",
              timestamp: new Date(Date.now() - 56 * 60 * 1000).toISOString()
            }
          ];
          setAllChatMessages(prev => ({
            ...prev,
            [id]: djangoMessages
          }));
        } else {
          setAllChatMessages(prev => ({
            ...prev,
            [id]: mockMessages
          }));
        }
      }
    } catch (error) {
      console.error("Error al obtener los mensajes:", error);
    }
  };

  // Función para cargar todos los mensajes de todos los chats para búsqueda
  const fetchAllChatMessages = async () => {
    setIsSearching(true);
    try {
      // En producción, idealmente harías una única llamada al backend que devuelva
      // los mensajes de todos los chats que coinciden con la búsqueda
      
      // Para el ejemplo, cargaremos mensajes para los chats que aún no tenemos
      const chatsMissingMessages = chats.filter(chat => !allChatMessages[chat.id]);
      
      const promises = chatsMissingMessages.map(chat => 
        // En un futuro, reemplazar con llamadas reales
        fetch(`/api/chats/${chat.id}/messages/`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          
          // Simulación de mensajes diferentes para cada chat
          if (chat.id === 1) {
            return [
              { id: 1, content: "Hola, ¿en qué puedo ayudarte?", sender: "assistant", timestamp: new Date().toISOString() },
              { id: 2, content: "Quiero aprender sobre decoradores en Python", sender: "user", timestamp: new Date().toISOString() },
              { id: 3, content: "Los decoradores son una forma de modificar funciones", sender: "assistant", timestamp: new Date().toISOString() }
            ];
          } else if (chat.id === 2) {
            return [
              { id: 1, content: "Hola, ¿en qué puedo ayudarte?", sender: "assistant", timestamp: new Date().toISOString() },
              { id: 2, content: "Tengo problemas con los hooks en React", sender: "user", timestamp: new Date().toISOString() },
              { id: 3, content: "React hooks permiten usar estado y efectos en componentes funcionales", sender: "assistant", timestamp: new Date().toISOString() }
            ];
          } else {
            return [
              { id: 1, content: "Hola, ¿en qué puedo ayudarte?", sender: "assistant", timestamp: new Date().toISOString() },
              { id: 2, content: "¿Cómo implemento JWT en Django?", sender: "user", timestamp: new Date().toISOString() },
              { id: 3, content: "Para JWT en Django, puedes usar django-rest-framework-simplejwt", sender: "assistant", timestamp: new Date().toISOString() }
            ];
          }
        })
        .then(data => ({ chatId: chat.id, messages: data }))
      );
      
      const results = await Promise.all(promises);
      
      const newChatMessages = { ...allChatMessages };
      results.forEach(result => {
        newChatMessages[result.chatId] = result.messages;
      });
      
      setAllChatMessages(newChatMessages);
    } catch (error) {
      console.error("Error al cargar todos los mensajes:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Función para enviar un nuevo mensaje
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      content: newMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
      isSending: true
    };
    
    // Guardar el ID del chat actual para asegurar que seguimos en el mismo chat después de enviar
    const currentChatId = currentChat.id;
    
    // Indicar que este chat debe moverse al principio de la lista
    shouldReorderChatsRef.current = true;
    
    // Añadir mensaje temporal al estado
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    
    try {
      // En un futuro, reemplazar con una llamada real a la API
      const response = await fetch(`/api/chats/${currentChatId}/messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": cookies.get("csrftoken"),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          content: tempMessage.content
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Actualizar el mensaje temporal con los datos reales
        setMessages(prev => 
          prev.map(msg => msg.id === tempId ? data : msg)
        );
        
        // Actualizar allChatMessages con el nuevo mensaje
        setAllChatMessages(prev => ({
          ...prev,
          [currentChatId]: [...(prev[currentChatId] || []), data]
        }));
        
        // Actualizar la lista de chats: mover el chat actual al principio y actualizar su último mensaje
        const nowTime = new Date().toISOString();
        setChats(prev => {
          // Encontrar el chat actual
          const currentChatIndex = prev.findIndex(chat => chat.id === currentChatId);
          if (currentChatIndex === -1) return prev;
          
          // Crear una copia del array para no mutar el estado directamente
          const updatedChats = [...prev];
          
          // Actualizar el chat con el último mensaje
          const updatedChat = {
            ...updatedChats[currentChatIndex],
            last_message: tempMessage.content.substring(0, 50) + (tempMessage.content.length > 50 ? "..." : ""),
            updated_at: nowTime
          };
          
          // Eliminar el chat de su posición actual
          updatedChats.splice(currentChatIndex, 1);
          
          // Insertar el chat actualizado al principio del array
          updatedChats.unshift(updatedChat);
          
          return updatedChats;
        });
        
        // Simular respuesta del asistente (eliminar cuando implemente el backend real)
        simulateAssistantResponse(currentChatId);
      } else {
        // Simular respuesta del asistente para testing
        simulateAssistantResponse(currentChatId);
      }
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      // Marcar el mensaje como error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? {...msg, isSending: false, error: true} 
            : msg
        )
      );
    }
  };

  // Función para simular la respuesta del asistente (eliminar cuando implemente el backend real)
  const simulateAssistantResponse = (chatId) => {
    setTimeout(() => {
      const assistantMessage = {
        id: Date.now(),
        content: "Esto es una respuesta simulada. En el futuro, aquí aparecerán las respuestas reales del LLM.",
        sender: "assistant",
        timestamp: new Date().toISOString()
      };
      
      // Agregar el mensaje del asistente
      setMessages(prev => [...prev, assistantMessage]);
      
      // Actualizar allChatMessages con la respuesta del asistente
      setAllChatMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), assistantMessage]
      }));
      
      // Actualizar el último mensaje del chat en la lista de chats (sin cambiar el orden)
      setChats(prev => {
        return prev.map(chat => 
          chat.id === chatId 
            ? {
                ...chat, 
                last_message: assistantMessage.content.substring(0, 50) + (assistantMessage.content.length > 50 ? "..." : "")
              } 
            : chat
        );
      });
    }, 1000);
  };

  // Función para crear un nuevo chat o abrir uno vacío existente
  const createNewChat = async () => {
    // Comprobar si ya existe un chat vacío
    const emptyChat = chats.find(chat => {
      // Un chat vacío es aquel que no tiene último mensaje o tiene un array de mensajes vacío
      return !chat.last_message && (!allChatMessages[chat.id] || allChatMessages[chat.id].length === 0);
    });

    // Si ya existe un chat vacío, seleccionarlo en lugar de crear uno nuevo
    if (emptyChat) {
      // Solo cambiar al chat vacío si no estamos ya en él
      if (!currentChat || currentChat.id !== emptyChat.id) {
        fetchMessages(emptyChat.id);
      }
      return;
    }

    // Si no hay chats vacíos, crear uno nuevo
    try {
      // En un futuro, reemplazar con una llamada real a la API
      const response = await fetch("/api/chats/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": cookies.get("csrftoken"),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          title: "Nuevo chat"
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Añadir el nuevo chat al principio de la lista
        setChats(prev => [data, ...prev]);
        
        // Establecer el nuevo chat como el chat actual
        setCurrentChat(data);
        setMessages([]);
        setAllChatMessages(prev => ({
          ...prev,
          [data.id]: []
        }));
        
        // Actualizar la URL
        navigate(`/chat/${data.id}`, { replace: true });
        
        // Activar la edición para el nuevo chat
        setEditingChatId(data.id);
        setEditingChatTitle(data.title);
      } else {
        // Simulación para testing
        const nowTime = new Date().toISOString();
        const newChat = {
          id: Date.now(),
          title: "Nuevo chat",
          last_message: "",
          created_at: nowTime,
          updated_at: nowTime,
          unread_count: 0
        };
        
        // Añadir el nuevo chat al principio de la lista
        setChats(prev => [newChat, ...prev]);
        
        // Establecer el nuevo chat como el chat actual
        setCurrentChat(newChat);
        setMessages([]);
        setAllChatMessages(prev => ({
          ...prev,
          [newChat.id]: []
        }));
        
        // Actualizar la URL
        navigate(`/chat/${newChat.id}`, { replace: true });
        
        // Activar la edición para el nuevo chat
        setEditingChatId(newChat.id);
        setEditingChatTitle(newChat.title);
      }
    } catch (error) {
      console.error("Error al crear un nuevo chat:", error);
    }
  };

  // Función para iniciar la edición de un chat
  const startEditingChat = (chat) => {
    setEditingChatId(chat.id);
    setEditingChatTitle(chat.title);
  };

  // Función para guardar el título editado
  const saveEditedTitle = async () => {
    if (!editingChatTitle.trim()) {
      setEditingChatTitle("Nuevo chat");
    }

    try {
      // En un futuro, reemplazar con una llamada real a la API
      const response = await fetch(`/api/chats/${editingChatId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": cookies.get("csrftoken"),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          title: editingChatTitle
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(prev => 
          prev.map(chat => 
            chat.id === editingChatId 
              ? {...chat, title: data.title} 
              : chat
          )
        );
        
        if (currentChat && currentChat.id === editingChatId) {
          setCurrentChat(prev => ({...prev, title: data.title}));
        }
      } else {
        // Simulación para testing
        setChats(prev => 
          prev.map(chat => 
            chat.id === editingChatId 
              ? {...chat, title: editingChatTitle} 
              : chat
          )
        );
        
        if (currentChat && currentChat.id === editingChatId) {
          setCurrentChat(prev => ({...prev, title: editingChatTitle}));
        }
      }
    } catch (error) {
      console.error("Error al actualizar el título del chat:", error);
    } finally {
      setEditingChatId(null);
      setEditingChatTitle("");
    }
  };

  // Manejar tecla Enter para guardar el título
  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEditedTitle();
    }
  };

  // Filtrar chats según término de búsqueda (incluyendo mensajes anteriores)
  const filteredChats = chats.filter(chat => {
    // Si no hay término de búsqueda, mostrar todos los chats
    if (!searchTerm.trim()) return true;
    
    // Buscar en el título
    if (chat.title.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    
    // Buscar en el último mensaje
    if (chat.last_message && chat.last_message.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    
    // Buscar en todos los mensajes de ese chat
    const chatMessages = allChatMessages[chat.id] || [];
    return chatMessages.some(message => 
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Formatear la fecha
// Formatear la fecha y hora de los mensajes
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const dateTime = date.getTime();
  
  // Formato de hora (siempre se muestra)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Si es hoy, solo mostrar la hora
  if (dateTime >= today) {
    return timeStr;
  }
  
  // Si es ayer, mostrar "Ayer" y la hora
  if (dateTime >= yesterday && dateTime < today) {
    return `Ayer, ${timeStr}`;
  }
  
  // Si es este año, mostrar fecha sin año
  if (date.getFullYear() === now.getFullYear()) {
    const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return `${dateStr}, ${timeStr}`;
  }
  
  // Si es un año diferente, mostrar fecha completa
  return `${date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}, ${timeStr}`;
};

  // Función para cambiar al chat seleccionado
  const selectChat = (chatId) => {
    if (editingChatId) return; // No cambiar de chat si estamos editando
    fetchMessages(chatId);
  };


  
  return (
    <MDBContainer fluid className="py-5 chat-container">
      <MDBRow>
        <MDBCol md="12">
          <MDBCard id="chat3" style={{ borderRadius: "15px" }}>
            <MDBCardBody>
              <MDBRow>
                <MDBCol md="6" lg="5" xl="4" className="mb-4 mb-md-0">
                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Mis Chats</h5>
                      <MDBBtn color="primary" size="sm" onClick={createNewChat}>
                        <MDBIcon fas icon="plus" className="me-1" /> Nuevo
                      </MDBBtn>
                    </div>
                    
                    <MDBInputGroup className="rounded mb-3">
                      <input
                        className="form-control rounded"
                        placeholder="Buscar en mensajes y chats"
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <span className="input-group-text border-0">
                        {isSearching ? (
                          <MDBSpinner size="sm" />
                        ) : (
                          <MDBIcon fas icon="search" />
                        )}
                      </span>
                    </MDBInputGroup>

                    <div className="chat-list-container">
                      {searchTerm.length > 0 && (
                        <div className="search-info mb-2">
                          <small className="text-muted">
                            {isSearching ? 'Buscando...' : `Resultados para "${searchTerm}"`}
                          </small>
                        </div>
                      )}
                      <MDBTypography listUnStyled className="mb-0">
                        {filteredChats.map((chat) => (
                          <li key={chat.id} className={`p-2 border-bottom ${currentChat && chat.id === currentChat.id ? 'active-chat' : ''}`}>
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex flex-row flex-grow-1"
                                onClick={() => selectChat(chat.id)}>
                                <div>
                                  <div className="chat-avatar">
                                    <MDBIcon fas icon="comment-alt" size="2x" className="text-primary" />
                                    {chat.unread_count > 0 && (
                                      <span className="badge bg-success badge-dot"></span>
                                    )}
                                  </div>
                                </div>
                                <div className="pt-1 ms-2 flex-grow-1">
                                  {editingChatId === chat.id ? (
                                    <div className="d-flex align-items-center">
                                      <input
                                        ref={editInputRef}
                                        type="text"
                                        className="form-control form-control-sm edit-title-input"
                                        value={editingChatTitle}
                                        onChange={(e) => setEditingChatTitle(e.target.value)}
                                        onKeyPress={handleEditKeyPress}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <MDBBtn 
                                        color="success" 
                                        size="sm" 
                                        className="ms-2 save-title-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          saveEditedTitle();
                                        }}
                                      >
                                        <MDBIcon fas icon="check" />
                                      </MDBBtn>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="d-flex justify-content-between align-items-center">
                                        <p className="fw-bold mb-0">{chat.title}</p>
                                        <MDBTooltip tag="a" title="Editar nombre">
                                          <MDBIcon 
                                            fas 
                                            icon="edit" 
                                            size="sm" 
                                            className="ms-2 text-muted edit-icon"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingChat(chat);
                                            }}
                                          />
                                        </MDBTooltip>
                                      </div>
                                      <p className="small text-muted text-truncate" style={{ maxWidth: "200px" }}>
                                        {chat.last_message || "Nuevo chat"}
                                      </p>
                                      {searchTerm && allChatMessages[chat.id] && (
                                        <div className="search-match-info">
                                          {allChatMessages[chat.id].some(msg => 
                                            msg.content.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                            (!chat.last_message || !chat.last_message.toLowerCase().includes(searchTerm.toLowerCase()))
                                          ) && (
                                            <small className="badge bg-info text-white">
                                              Coincidencia en mensajes anteriores
                                            </small>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="pt-1 ms-2">
                                <p className="small text-muted mb-1">
                                  {formatTimestamp(chat.updated_at || chat.created_at)}
                                </p>
                                {chat.unread_count > 0 && (
                                  <span className="badge bg-danger rounded-pill float-end">
                                    {chat.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                        {filteredChats.length === 0 && !isSearching && searchTerm && (
                          <li className="p-3 text-center">
                            <MDBIcon fas icon="search" className="me-2" />
                            No se encontraron resultados para "{searchTerm}"
                          </li>
                        )}
                      </MDBTypography>
                    </div>
                  </div>
                </MDBCol>

                <MDBCol md="6" lg="7" xl="8">
                  {currentChat ? (
                    <>
                      <div className="chat-header p-3 border-bottom d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">{currentChat.title}</h6>
                        <MDBTooltip tag="a" title="Editar nombre">
                          <MDBIcon 
                            fas 
                            icon="edit" 
                            size="sm" 
                            className="ms-2 text-muted edit-icon"
                            onClick={() => startEditingChat(currentChat)}
                          />
                        </MDBTooltip>
                      </div>
                      
                      <div className="messages-container pt-3 px-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`d-flex flex-row ${
                              msg.sender === "user" ? "justify-content-end" : "justify-content-start"
                            } mb-4`}
                          >
                            {msg.sender === "assistant" && (
                              <img
                                src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp"
                                alt="avatar"
                                style={{ width: "45px", height: "100%" }}
                              />
                            )}
                            
                            <div>
                              <p
                                className={`small p-2 ${
                                  msg.sender === "user"
                                    ? "me-3 mb-1 text-white rounded-3 bg-primary"
                                    : "ms-3 mb-1 rounded-3"
                                } ${msg.isSending ? "opacity-50" : ""} ${msg.error ? "bg-danger" : ""}`}
                                style={msg.sender === "assistant" ? { backgroundColor: "#f5f6f7" } : {}}
                              >
                                {msg.content}
                                {msg.isSending && <span className="ms-2 spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                                {msg.error && <MDBIcon fas icon="exclamation-circle" className="ms-2" />}
                              </p>
                              <p
                                className={`small ${
                                  msg.sender === "user" ? "me-3" : "ms-3"
                                } mb-3 rounded-3 text-muted ${
                                  msg.sender === "user" ? "text-end" : ""
                                }`}
                              >
                                {formatTimestamp(msg.timestamp)}
                              </p>
                            </div>
                            
                            {msg.sender === "user" && (
                              <img
                                src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp"
                                alt="avatar"
                                style={{ width: "45px", height: "100%" }}
                              />
                            )}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      
                      <div className="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-2">
                        <img
                          src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp"
                          alt="avatar"
                          style={{ width: "40px", height: "100%" }}
                        />
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          placeholder="Escribe tu mensaje..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
                        />
                        <a className="ms-1 text-muted" href="#!">
                          <MDBIcon fas icon="paperclip" />
                        </a>
                        <a className="ms-3 text-muted" href="#!">
                          <MDBIcon fas icon="smile" />
                        </a>
                        <a className="ms-3" href="#!" onClick={sendMessage}>
                          <MDBIcon fas icon="paper-plane" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <div className="text-center">
                        <MDBIcon fas icon="comments" size="3x" className="text-primary mb-3" />
                        <h5>Selecciona un chat o crea uno nuevo</h5>
                        <MDBBtn color="primary" size="sm" className="mt-3" onClick={createNewChat}>
                          <MDBIcon fas icon="plus" className="me-1" /> Nuevo Chat
                        </MDBBtn>
                      </div>
                    </div>
                  )}
                </MDBCol>
              </MDBRow>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default Chat;