from django.db import models
from django.contrib.auth.models import User
import os

class Chat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats')
    title = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.title} ({self.user.username})"
    
    @property
    def last_message(self):
        last = self.messages.order_by('-timestamp').first()
        if last:
            return last.content[:50] + ("..." if len(last.content) > 50 else "")
        return ""
    
    @property
    def unread_count(self):
        return self.messages.filter(read=False, sender="assistant").count()

class Message(models.Model):
    SENDER_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender}: {self.content[:30]}..."

def file_upload_path(instance, filename):

    return f'uploads/{instance.message.chat.user.id}/{instance.message.chat.id}/{instance.message.id}/{filename}'

class Attachment(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to=file_upload_path)
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.IntegerField()  # Tamaño en bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    indexed = models.BooleanField(default=False)

    def __str__(self):
        return self.filename
    
    def save(self, *args, **kwargs):

        if self.file and not self.filename:
            self.filename = os.path.basename(self.file.name)
        super().save(*args, **kwargs)