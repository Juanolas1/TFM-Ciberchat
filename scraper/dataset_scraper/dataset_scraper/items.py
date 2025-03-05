import scrapy

class AnswerItem(scrapy.Item):
    username = scrapy.Field()       # Nombre del usuario que responde
    rank = scrapy.Field()           # Rango del usuario (n00b, Apprentice, etc.)
    published_at = scrapy.Field()   # Fecha y hora de publicación
    response_text = scrapy.Field()  # Texto completo de la respuesta

class DatasetscraperItem(scrapy.Item):
    url = scrapy.Field()            # URL desde la que se obtiene la información
    title = scrapy.Field()          # Título de la pregunta
    ask = scrapy.Field()            # La pregunta inicial completa
    answers = scrapy.Field()        # Lista de respuestas (AnswerItem)
    correct_answer = scrapy.Field() # Respuesta marcada como correcta (si la hay)
    timestamp_creation = scrapy.Field() # Fecha y hora de creación del post
    timestamp_edit = scrapy.Field() # Fecha y hora de edición del post (si existe)
    other_information = scrapy.Field() # Información adicional