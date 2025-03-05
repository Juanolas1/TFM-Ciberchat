import scrapy
from scrapy import Request
from scrapy.loader import ItemLoader
from dataset_scraper.items import DatasetscraperItem, AnswerItem
import re
import logging

class GentooSpider(scrapy.Spider):
    name = "gentoo"
    allowed_domains = ["forums.gentoo.org"]
    
    # URLs de los foros con sus límites máximos de página
    forum_configs = [
        # (URL base, ID del foro, máximo offset)
        ("https://forums.gentoo.org/viewforum-f-13.html", "13", 98550),
        ("https://forums.gentoo.org/viewforum-f-18.html", "18", 76000),
        ("https://forums.gentoo.org/viewforum-f-23.html", "23", 75600),
        ("https://forums.gentoo.org/viewforum-f-8.html", "8", 108850)
    ]
    
    # Índice actual y offset
    current_forum_index = 0
    current_page_offset = 0
    
    def start_requests(self):
        """Inicia el proceso con la primera URL"""
        first_url = self.forum_configs[0][0]
        logging.info(f"Iniciando spider con la primera URL: {first_url}")
        yield Request(url=first_url, callback=self.parse)
    
    def get_next_page_url(self):
        """
        Genera la URL para la siguiente página basada en el offset actual
        """
        if self.current_forum_index >= len(self.forum_configs):
            return None
        
        forum_id = self.forum_configs[self.current_forum_index][1]
        max_offset = self.forum_configs[self.current_forum_index][2]
        
        # Si el offset actual supera el máximo, hemos terminado con este foro
        if self.current_page_offset > max_offset:
            return None
            
        # Si el offset es 0, usamos la URL base sin modificar
        if self.current_page_offset == 0:
            return self.forum_configs[self.current_forum_index][0]
        
        # Si no, generamos la URL con el offset
        return f"https://forums.gentoo.org/viewforum-f-{forum_id}-topicdays-0-start-{self.current_page_offset}.html"
    
    def move_to_next_forum(self):
        """
        Avanza al siguiente foro y reinicia el offset
        """
        self.current_forum_index += 1
        self.current_page_offset = 0
        
        if self.current_forum_index < len(self.forum_configs):
            next_url = self.get_next_page_url()
            logging.info(f"Pasando al siguiente foro: {next_url}")
            return next_url
        else:
            logging.info("Se han recorrido todos los foros. Finalizando.")
            return None
    
    def parse(self, response):
        """Procesa cada página del foro y encuentra los temas marcados como solved."""
        current_url = response.url
        logging.info(f"Procesando página del foro: {current_url}")
        
        # Verificar si estamos en una página sin artículos
        no_articles = response.xpath('//span[@class="gen" and contains(text(), "No hay mensajes en este foro")]')
        if no_articles:
            logging.info(f"No hay más artículos en esta URL. Pasando al siguiente foro.")
            next_forum_url = self.move_to_next_forum()
            if next_forum_url:
                yield Request(url=next_forum_url, callback=self.parse)
            return
        
        # Extraer todos los temas de la página
        topics = response.xpath('//tr/td[@class="row1"]/span[@class="topictitle"]/a')
        solved_topics_found = 0
        
        for topic in topics:
            title = topic.xpath('text()').get()
            if title:
                title = title.strip()
                # Buscar "solved" en el título independientemente de mayúsculas/minúsculas
                if re.search(r'solved', title, re.IGNORECASE):
                    solved_topics_found += 1
                    topic_url = response.urljoin(topic.xpath('@href').get())
                    logging.info(f"Encontrado tema solved #{solved_topics_found}: {title} - {topic_url}")
                    yield Request(url=topic_url, callback=self.parse_topic)
        
        logging.info(f"Total de temas solved encontrados en esta página: {solved_topics_found}")
        
        # Avanzar a la siguiente página (incrementando el offset en 50)
        self.current_page_offset += 50
        next_page_url = self.get_next_page_url()
        
        if next_page_url:
            logging.info(f"Avanzando a la siguiente página: {next_page_url}")
            yield Request(url=next_page_url, callback=self.parse)
        else:
            # Si no hay más páginas para este foro, pasar al siguiente
            next_forum_url = self.move_to_next_forum()
            if next_forum_url:
                yield Request(url=next_forum_url, callback=self.parse)
    
    def parse_topic(self, response):
        """Extrae toda la información detallada de un tema."""
        logging.info(f"Procesando tema: {response.url}")
        
        try:
            # Crear un DatasetscraperItem
            loader = ItemLoader(item=DatasetscraperItem(), response=response)
            
            # Extraer URL
            loader.add_value('url', response.url)
            
            # Extraer título
            title = response.xpath('//a[@class="maintitle"]/text()').get()
            if title:
                title = title.strip()
                loader.add_value('title', title)
                logging.info(f"Título: {title}")
            
            # Obtener todas las filas de la tabla que contienen los posts
            all_post_rows = response.xpath('//table[@class="forumline"]/tr[td[contains(@class, "row1") or contains(@class, "row2")]]')
            
            if all_post_rows:
                # El primer post siempre es la pregunta
                first_post = all_post_rows[0]
                
                # Extraer el texto completo de la pregunta
                ask_text = first_post.xpath('.//span[@class="postbody"]').get()
                if ask_text:
                    loader.add_value('ask', ask_text)
                
                # Extraer timestamp de creación
                creation_time = first_post.xpath('.//span[@class="postdetails"]/text()[contains(., "Publicado:")]').get()
                if creation_time:
                    creation_match = re.search(r'Publicado:\s*(.*?)(?:\s*$|\s*\n|\s*<)', creation_time)
                    if creation_match:
                        loader.add_value('timestamp_creation', creation_match.group(1).strip())
                        logging.info(f"Timestamp de creación: {creation_match.group(1).strip()}")
                
                # Extraer timestamp de edición (si existe)
                edit_elements = first_post.xpath('.//*[contains(text(), "Editado por")]')
                for element in edit_elements:
                    text = element.get()
                    if text:
                        edit_match = re.search(r'Editado por .* el\s*(.*?)(?:\s*$|\s*\n|\s*<)', text)
                        if edit_match:
                            loader.add_value('timestamp_edit', edit_match.group(1).strip())
                            logging.info(f"Timestamp de edición: {edit_match.group(1).strip()}")
                            break
                
                # Extraer todas las respuestas (excluyendo el primer post)
                answer_rows = all_post_rows[1:] if len(all_post_rows) > 1 else []
                answers = []
                
                for answer_row in answer_rows:
                    answer_loader = ItemLoader(item=AnswerItem())
                    
                    # Extraer nombre de usuario
                    username = answer_row.xpath('.//span[@class="name"]/b/text()').get()
                    if username:
                        answer_loader.add_value('username', username.strip())
                    
                    # Extraer rango
                    rank_text = answer_row.xpath('.//span[@class="postdetails"]/text()').get()
                    if rank_text:
                        # El rango suele estar en la primera línea
                        rank = rank_text.strip().split('\n')[0] if '\n' in rank_text else rank_text.strip()
                        answer_loader.add_value('rank', rank)
                    
                    # Extraer fecha de publicación
                    published_at = answer_row.xpath('.//span[@class="postdetails"]/text()[contains(., "Publicado:")]').get()
                    if published_at:
                        published_match = re.search(r'Publicado:\s*(.*?)(?:\s*$|\s*\n|\s*<)', published_at)
                        if published_match:
                            answer_loader.add_value('published_at', published_match.group(1).strip())
                    
                    # Extraer texto completo de la respuesta
                    response_text = answer_row.xpath('.//span[@class="postbody"]').get()
                    if response_text:
                        answer_loader.add_value('response_text', response_text)
                    
                    # Añadir esta respuesta a la lista
                    answers.append(answer_loader.load_item())
                
                # Añadir todas las respuestas al item principal
                if answers:
                    loader.add_value('answers', answers)
                    logging.info(f"Encontradas {len(answers)} respuestas")
                
                # Generar el item completo
                yield loader.load_item()
            else:
                logging.warning(f"No se encontraron posts en {response.url}")
                
        except Exception as e:
            logging.error(f"Error al procesar {response.url}: {str(e)}")