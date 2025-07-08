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
  MDBSpinner,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBBadge
} from "mdb-react-ui-kit";
import { useAuth } from "../../context/AuthContext";
import "./Chat.css";
import MarkdownRenderer from '../../components/MarkdownRenderer';

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
  const fileInputRef = useRef(null);
  
  // Nuevos estados para manejar archivos
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState(null);
  
  // Estados para streaming
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  
  // Referencia para rastrear si debemos reorganizar los chats después de enviar un mensaje
  const shouldReorderChatsRef = useRef(false);
  // Referencia para rastrear si los mensajes se acaban de cargar
  const messagesJustLoaded = useRef(true);

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

  // Scroll al último mensaje, con comportamiento condicional
  useEffect(() => {
    if (messagesJustLoaded.current) {
      scrollToBottomInstant();
      messagesJustLoaded.current = false;
    } else {
      scrollToBottomSmooth();
    }
  }, [messages]);

  // Focus en el input de edición cuando se activa
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);

  // Para scroll instantáneo (cuando se cargan mensajes)
  const scrollToBottomInstant = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  // Para scroll suave (cuando se envía un nuevo mensaje)
  const scrollToBottomSmooth = () => {
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
    // Marcar que los mensajes se están cargando para usar scroll instantáneo
    messagesJustLoaded.current = true;
    
    try {
      // Actualizar la URL para reflejar el chat seleccionado
      if (id !== chatId) {
        navigate(`/chat/${id}`, { replace: true });
      }
      
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
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            attachments: []
          },
          {
            id: 2,
            content: "Tengo una consulta sobre programación",
            sender: "user",
            timestamp: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
            attachments: []
          },
          {
            id: 3,
            content: "¡Claro! ¿Qué te gustaría saber específicamente?",
            sender: "assistant",
            timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
            attachments: []
          }
        ];
        setMessages(mockMessages);
        const selectedChat = chats.find(chat => chat.id === parseInt(id));
        if (selectedChat) {
          setCurrentChat(selectedChat);
        }
        
        if (id === 1) {
          const pythonMessages = [
            ...mockMessages,
            {
              id: 4,
              content: "Me gustaría entender cómo funcionan los decoradores en Python",
              sender: "user",
              timestamp: new Date(Date.now() - 57 * 60 * 1000).toISOString(),
              attachments: []
            },
            {
              id: 5,
              content: "Los decoradores en Python son funciones que modifican el comportamiento de otras funciones. Permiten ejecutar código antes y después de la función decorada.",
              sender: "assistant",
              timestamp: new Date(Date.now() - 56 * 60 * 1000).toISOString(),
              attachments: []
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
              timestamp: new Date(Date.now() - 57 * 60 * 1000).toISOString(),
              attachments: []
            },
            {
              id: 5,
              content: "useEffect es un hook para manejar efectos secundarios. Recuerda incluir todas las dependencias en el array.",
              sender: "assistant",
              timestamp: new Date(Date.now() - 56 * 60 * 1000).toISOString(),
              attachments: []
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
              timestamp: new Date(Date.now() - 57 * 60 * 1000).toISOString(),
              attachments: []
            },
            {
              id: 5,
              content: "Para JWT en Django, puedes usar Django REST framework con la librería djangorestframework-simplejwt.",
              sender: "assistant",
              timestamp: new Date(Date.now() - 56 * 60 * 1000).toISOString(),
              attachments: []
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

  const fetchAllChatMessages = async () => {
    setIsSearching(true);
    try {
      const chatsMissingMessages = chats.filter(chat => !allChatMessages[chat.id]);
      
      const promises = chatsMissingMessages.map(chat => 
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
          
          if (chat.id === 1) {
            return [
              { id: 1, content: "Hola, ¿en qué puedo ayudarte?", sender: "assistant", timestamp: new Date().toISOString(), attachments: [] },
              { id: 2, content: "Quiero aprender sobre decoradores en Python", sender: "user", timestamp: new Date().toISOString(), attachments: [] },
              { id: 3, content: "Los decoradores son una forma de modificar funciones", sender: "assistant", timestamp: new Date().toISOString(), attachments: [] }
            ];
          } else if (chat.id === 2) {
            return [
              { id: 1, content: "Hola, ¿en qué puedo ayudarte?", sender: "assistant", timestamp: new Date().toISOString(), attachments: [] },
              { id: 2, content: "Tengo problemas con los hooks en React", sender: "user", timestamp: new Date().toISOString(), attachments: [] },
              { id: 3, content: "React hooks permiten usar estado y efectos en componentes funcionales", sender: "assistant", timestamp: new Date().toISOString(), attachments: [] }
            ];
          } else {
            return [
              { id: 1, content: "Hola, ¿en qué puedo ayudarte?", sender: "assistant", timestamp: new Date().toISOString(), attachments: [] },
              { id: 2, content: "¿Cómo implemento JWT en Django?", sender: "user", timestamp: new Date().toISOString(), attachments: [] },
              { id: 3, content: "Para JWT en Django, puedes usar django-rest-framework-simplejwt", sender: "assistant", timestamp: new Date().toISOString(), attachments: [] }
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

  // Función para manejar la selección de archivos
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  // Función para eliminar un archivo seleccionado
  const removeSelectedFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Función para abrir el selector de archivos
  const openFileSelector = () => {
    fileInputRef.current.click();
  };

  // Función para ver un archivo adjunto
  const viewAttachment = (attachment) => {
    setViewingAttachment(attachment);
    setShowAttachmentModal(true);
  };

  // Función para obtener el ícono según el tipo de archivo
  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) return "image";
    if (fileType.includes('pdf')) return "file-pdf";
    if (fileType.includes('word') || fileType.includes('document')) return "file-word";
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return "file-excel";
    if (fileType.includes('zip') || fileType.includes('compressed')) return "file-archive";
    if (fileType.includes('text')) return "file-alt";
    if (fileType.includes('audio')) return "file-audio";
    if (fileType.includes('video')) return "file-video";
    if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('html') || fileType.includes('css')) return "file-code";
    return "file";
  };

  // Función para formatear el tamaño del archivo
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  // Función para enviar un nuevo mensaje con streaming
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (isStreaming) return;
    
    messagesJustLoaded.current = false;
    
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      content: newMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
      isSending: true,
      attachments: selectedFiles.map((file, index) => ({
        id: `temp-${tempId}-${index}`,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        temp: true
      }))
    };
    
    const currentChatId = currentChat.id;
    
    setMessages(prev => [...prev, tempMessage]);
    const messageContent = newMessage;
    setNewMessage("");
    const filesToSend = selectedFiles;
    setSelectedFiles([]);
    
    setIsStreaming(true);
    
    try {
      const formData = new FormData();
      formData.append("content", messageContent);
      
      // Agregar archivos al FormData
      filesToSend.forEach(file => {
        formData.append("files", file);
      });
      
      const response = await fetch(`/api/chats/${currentChatId}/messages/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": cookies.get("csrftoken"),
        },
        credentials: "same-origin",
        body: formData,
      });
      
      if (response.ok) {
        // Procesar streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        let assistantMessageId = null;
        let assistantContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'user_message') {
                  // Actualizar mensaje del usuario con datos reales
                  setMessages(prev => 
                    prev.map(msg => msg.id === tempId ? {
                      ...parsed.message,
                      attachments: parsed.message.attachments || []
                    } : msg)
                  );
                } else if (parsed.type === 'assistant_start') {
                  // Crear mensaje del asistente
                  assistantMessageId = parsed.message_id;
                  const assistantMessage = {
                    id: parsed.message_id,
                    content: '',
                    sender: 'assistant',
                    timestamp: parsed.timestamp,
                    isStreaming: true,
                    attachments: []
                  };
                  setMessages(prev => [...prev, assistantMessage]);
                  setStreamingMessageId(parsed.message_id);
                } else if (parsed.type === 'chunk' && assistantMessageId) {
                  // Actualizar contenido del mensaje del asistente
                  assistantContent += parsed.content;
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantContent }
                      : msg
                  ));
                } else if (parsed.type === 'reset' && assistantMessageId) {
                  // Reiniciar contenido del asistente
                  assistantContent = '';
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: '' }
                      : msg
                  ));
                } else if (parsed.type === 'complete') {
                  // Finalizar streaming
                  if (assistantMessageId) {
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, isStreaming: false }
                        : msg
                    ));
                  }
                  
                  // Actualizar título del chat si cambió
                  if (parsed.chat_title_updated) {
                    setCurrentChat(prev => ({
                      ...prev,
                      title: parsed.chat_title_updated
                    }));
                    
                    setChats(prev => 
                      prev.map(chat => 
                        chat.id === currentChatId 
                          ? { ...chat, title: parsed.chat_title_updated }
                          : chat
                      )
                    );
                  }
                  
                  // Actualizar la lista de chats: mover el chat actual al principio
                  const nowTime = new Date().toISOString();
                  setChats(prev => {
                    const currentChatIndex = prev.findIndex(chat => chat.id === currentChatId);
                    if (currentChatIndex === -1) return prev;
                    
                    const updatedChats = [...prev];
                    const updatedChat = {
                      ...updatedChats[currentChatIndex],
                      last_message: messageContent.substring(0, 50) + (messageContent.length > 50 ? "..." : ""),
                      updated_at: nowTime
                    };
                    
                    updatedChats.splice(currentChatIndex, 1);
                    updatedChats.unshift(updatedChat);
                    
                    return updatedChats;
                  });
                  
                  setIsStreaming(false);
                  setStreamingMessageId(null);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } else {
        // Fallback para cuando no hay streaming disponible
        setIsStreaming(false);
        
        // Simulación para testing
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? {
                  ...msg, 
                  isSending: false,
                  attachments: msg.attachments.map(attachment => ({
                    ...attachment,
                    url: URL.createObjectURL(filesToSend[msg.attachments.indexOf(attachment)]),
                    temp: false
                  }))
                } 
              : msg
          )
        );
        
        // Simular respuesta del asistente
        simulateAssistantResponse(currentChatId, messageContent);
      }
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      setIsStreaming(false);
      setStreamingMessageId(null);
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

  const simulateAssistantResponse = (chatId, userMessage) => {
    setTimeout(() => {
      let responseContent = "Esto es una respuesta simulada. En el futuro, aquí aparecerán las respuestas reales del LLM.";
      
      const lastUserMessage = messages.filter(m => m.sender === "user").pop();
      if (lastUserMessage && lastUserMessage.attachments && lastUserMessage.attachments.length > 0) {
        const fileNames = lastUserMessage.attachments.map(a => a.filename).join(", ");
        responseContent += `\n\nVeo que has adjuntado los siguientes archivos: ${fileNames}`;
      }
      
      const assistantMessage = {
        id: Date.now(),
        content: responseContent,
        sender: "assistant",
        timestamp: new Date().toISOString(),
        attachments: []
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      setAllChatMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), assistantMessage]
      }));
      
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
  
  const createNewChat = async () => {
    const emptyChat = chats.find(chat => {
      return !chat.last_message && (!allChatMessages[chat.id] || allChatMessages[chat.id].length === 0);
    });

    if (emptyChat) {
      if (!currentChat || currentChat.id !== emptyChat.id) {
        fetchMessages(emptyChat.id);
      }
      return;
    }

    try {
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
        
        setChats(prev => [data, ...prev]);
        
        setCurrentChat(data);
        setMessages([]);
        setAllChatMessages(prev => ({
          ...prev,
          [data.id]: []
        }));
        
        navigate(`/chat/${data.id}`, { replace: true });
      } else {
        const nowTime = new Date().toISOString();
        const newChat = {
          id: Date.now(),
          title: "Nuevo chat",
          last_message: "",
          created_at: nowTime,
          updated_at: nowTime,
          unread_count: 0
        };
        
        setChats(prev => [newChat, ...prev]);
        
        setCurrentChat(newChat);
        setMessages([]);
        setAllChatMessages(prev => ({
          ...prev,
          [newChat.id]: []
        }));
        
        navigate(`/chat/${newChat.id}`, { replace: true });
        
        setEditingChatId(newChat.id);
        setEditingChatTitle(newChat.title);
      }
    } catch (error) {
      console.error("Error al crear un nuevo chat:", error);
    }
  };
  
  const startEditingChat = (chat) => {
    setEditingChatId(chat.id);
    setEditingChatTitle(chat.title);
  };
  
  const saveEditedTitle = async () => {
    if (!editingChatTitle.trim()) {
      setEditingChatTitle("Nuevo chat");
    }

    try {
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
    if (editingChatId || isStreaming) return;
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
                      <h5 className="mb-0">Mis chats</h5>
                      <div className="d-flex gap-2">
                        <MDBBtn 
                          color="info" 
                          size="sm" 
                          onClick={() => navigate('/')}
                          disabled={isStreaming}
                        >
                          <i className="fas fa-home me-1"></i> Dashboard
                        </MDBBtn>
                        <MDBBtn 
                          color="primary" 
                          size="sm" 
                          onClick={createNewChat}
                          disabled={isStreaming}
                        >
                          <i className="fas fa-plus me-1"></i> Nuevo
                        </MDBBtn>
                      </div>
                    </div>
                    
                    <MDBInputGroup className="rounded mb-3">
                      <input
                        className="form-control rounded"
                        placeholder="Buscar en mensajes y chats"
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isStreaming}
                      />
                      <span className="input-group-text border-0">
                        {isSearching ? (
                          <MDBSpinner size="sm" />
                        ) : (
                          <i className="fas fa-search"></i>
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
                                onClick={() => selectChat(chat.id)}
                                style={{ cursor: (editingChatId || isStreaming) ? 'not-allowed' : 'pointer' }}
                              >
                                <div>
                                  <div className="chat-avatar">
                                    <i className="fas fa-comment-alt fa-2x text-primary"></i>
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
                                        <i className="fas fa-check"></i>
                                      </MDBBtn>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="d-flex justify-content-between align-items-center">
                                        <p className="fw-bold mb-0">{chat.title}</p>
                                        <i 
                                            className="fas fa-edit fa-sm ms-2 text-muted edit-icon"
                                            style={{ opacity: isStreaming ? 0.3 : 0.6, cursor: isStreaming ? 'not-allowed' : 'pointer' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isStreaming) {
                                                startEditingChat(chat);
                                              }
                                            }}
                                          />
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
                            <i className="fas fa-search me-2"></i>
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
                        {editingChatId === currentChat.id ? (
                          <div className="d-flex align-items-center flex-grow-1">
                            <input
                              ref={editInputRef}
                              type="text"
                              className="form-control form-control-sm edit-title-input"
                              value={editingChatTitle}
                              onChange={(e) => setEditingChatTitle(e.target.value)}
                              onKeyPress={handleEditKeyPress}
                            />
                            <MDBBtn 
                              color="success" 
                              size="sm" 
                              className="ms-2 save-title-btn"
                              onClick={saveEditedTitle}
                            >
                              <MDBIcon fas icon="check" />
                            </MDBBtn>
                          </div>
                        ) : (
                          <>
                            <h6 className="mb-0">{currentChat.title}</h6>
                            <i 
                              className="fas fa-edit fa-sm ms-2 text-muted edit-icon"
                              style={{ opacity: isStreaming ? 0.3 : 0.6, cursor: isStreaming ? 'not-allowed' : 'pointer' }}
                              onClick={() => !isStreaming && startEditingChat(currentChat)}
                            />
                          </>
                        )}
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
                                {msg.sender === "assistant" ? (
                                  <div>
                                    <MarkdownRenderer content={msg.content} />
                                    {msg.isStreaming && (
                                      <span className="streaming-cursor">▋</span>
                                    )}
                                  </div>
                                ) : (
                                  msg.content
                                )}
                                {msg.isSending && <span className="ms-2 spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                                {msg.error && <i className="fas fa-exclamation-circle ms-2"></i>}
                              </p>
                              
                              {/* Mostrar los archivos adjuntos si existen */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className={`attachments-container ${
                                  msg.sender === "user" ? "me-3" : "ms-3"
                                } mb-2`}>
                                  {msg.attachments.map((attachment, index) => (
                                    <div 
                                      key={`${msg.id}-attachment-${index}`} 
                                      className={`attachment-card ${
                                        msg.sender === "user" ? "user-attachment" : "assistant-attachment"
                                      }`}
                                      onClick={() => viewAttachment(attachment)}
                                    >
                                      <i 
                                        className={`fas ${getFileIcon(attachment.file_type)} fa-lg mb-2`}
                                      />
                                      <div className="attachment-name text-truncate">
                                        {attachment.filename}
                                      </div>
                                      <div className="attachment-size">
                                        {formatFileSize(attachment.file_size)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
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
                      
                      {/* Área de entrada de mensaje con archivos seleccionados */}
                      <div className="message-input-area">
                        {/* Mostrar archivos seleccionados si existen */}
                        {selectedFiles.length > 0 && (
                          <div className="selected-files-container">
                            <div className="selected-files-header">
                              <h6 className="mb-0">Archivos seleccionados ({selectedFiles.length})</h6>
                            </div>
                            <div className="selected-files-list">
                              {selectedFiles.map((file, index) => (
                                <div key={`selected-file-${index}`} className="selected-file-item">
                                  <div className="file-info">
                                    <i className={`fas ${getFileIcon(file.type)} me-2`}></i>
                                    <div className="file-details">
                                      <div className="file-name text-truncate">{file.name}</div>
                                      <div className="file-size">{formatFileSize(file.size)}</div>
                                    </div>
                                  </div>
                                  <MDBBtn 
                                    color="light" 
                                    size="sm" 
                                    floating 
                                    className="remove-file-btn"
                                    onClick={() => removeSelectedFile(index)}
                                    disabled={isStreaming}
                                  >
                                    <i className="fas fa-times"></i>
                                  </MDBBtn>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Indicador de streaming */}
                        {isStreaming && (
                          <div className="streaming-indicator">
                            <div className="d-flex align-items-center text-muted">
                              <MDBSpinner size="sm" className="me-2" />
                              <small>El asistente está escribiendo...</small>
                            </div>
                          </div>
                        )}
                        
                        {/* Área de entrada de mensaje */}
                        <div className="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-2">
                          <img
                            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp"
                            alt="avatar"
                            style={{ width: "40px", height: "100%" }}
                          />
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder={isStreaming ? "Esperando respuesta..." : "Escribe tu mensaje..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isStreaming && sendMessage(e)}
                            disabled={isStreaming}
                          />
                          
                          {/* Input de archivo oculto */}
                          <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                          />
                          
                          {/* Botón para adjuntar archivos */}
                          <a 
                            className={`ms-1 text-muted ${isStreaming ? 'disabled' : ''}`} 
                            href="#!" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isStreaming) {
                                openFileSelector();
                              }
                            }}
                          >
                            <i className="fas fa-paperclip"></i>
                            {selectedFiles.length > 0 && (
                              <MDBBadge color="danger" dot pill className="attachment-badge" />
                            )}
                          </a>
                          <a className={`ms-3 text-muted ${isStreaming ? 'disabled' : ''}`} href="#!">
                            <i className="fas fa-smile"></i>
                          </a>
                          <a 
                            className={`ms-3 ${isStreaming ? 'text-muted disabled' : ''}`} 
                            href="#!" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isStreaming) {
                                sendMessage(e);
                              }
                            }}
                          >
                            {isStreaming ? (
                              <MDBSpinner size="sm" />
                            ) : (
                              <i className="fas fa-paper-plane"></i>
                            )}
                          </a>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <div className="text-center">
                        <i className="fas fa-comments fa-3x text-primary mb-3"></i>
                        <h5>Selecciona un chat o crea uno nuevo</h5>
                        <MDBBtn 
                          color="primary" 
                          size="sm" 
                          className="mt-3" 
                          onClick={createNewChat}
                          disabled={isStreaming}
                        >
                          <i className="fas fa-plus me-1"></i> Nuevo Chat
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
      
      {/* Modal para ver archivos adjuntos */}
      <MDBModal show={showAttachmentModal} tabIndex='-1' setShow={setShowAttachmentModal}>
        <MDBModalDialog centered>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>
                {viewingAttachment?.filename || 'Visualización de archivo'}
              </MDBModalTitle>
              <MDBBtn 
                className='btn-close' 
                color='none' 
                onClick={() => setShowAttachmentModal(false)}
              ></MDBBtn>
            </MDBModalHeader>
            <MDBModalBody>
              {viewingAttachment && (
                <div className="attachment-preview">
                  {viewingAttachment.file_type.includes('image') ? (
                    <img 
                      src={viewingAttachment.url} 
                      alt={viewingAttachment.filename}
                      className="img-fluid"
                    />
                  ) : (
                    <div className="file-info-large text-center">
                      <i 
                        className={`fas ${getFileIcon(viewingAttachment.file_type)} fa-5x mb-3`}
                      />
                      <h5>{viewingAttachment.filename}</h5>
                      <p>{formatFileSize(viewingAttachment.file_size)}</p>
                      <p className="text-muted">{viewingAttachment.file_type}</p>
                    </div>
                  )}
                </div>
              )}
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color='secondary' onClick={() => setShowAttachmentModal(false)}>
                Cerrar
              </MDBBtn>
              {viewingAttachment && viewingAttachment.url && (
                <MDBBtn color='primary' tag="a" href={viewingAttachment.url} target="_blank" rel="noopener noreferrer" download={viewingAttachment.filename}>
                  Descargar
                </MDBBtn>
              )}
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </MDBContainer>
  );
};

export default Chat;