import scrapy
from scrapy import Request
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
                
                # Patrón mejorado para detectar "solved" en distintos formatos pero no "unsolved"
                # Busca "solved" solo, entre paréntesis, corchetes, llaves o comillas
                is_solved = bool(re.search(r'(\[solved\]|\(solved\)|{solved}|"solved"|^solved| solved\b|\bsolved\b)', title, re.IGNORECASE))
                is_unsolved = bool(re.search(r'unsolved', title, re.IGNORECASE))
                
                # Solo procesar los temas que están marcados como solved pero no como unsolved
                if is_solved and not is_unsolved:
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
        """Extrae toda la información detallada de un tema, capturando correctamente fecha de publicación y edición."""
        logging.info(f"Procesando tema: {response.url}")
        
        # Creamos el ítem directamente sin usar ItemLoader
        result = DatasetscraperItem()
        result['url'] = response.url
        
        # Título del tema
        title = response.xpath('//a[@class="maintitle"]/text()').get()
        if title:
            result['title'] = title.strip()
        
        # Todas las filas de posts
        post_rows = response.xpath(
            '//table[@class="forumline"]/tr[td[contains(@class,"row1") or contains(@class,"row2")]]'
        )
        
        if not post_rows:
            logging.warning(f"No se encontraron posts en {response.url}")
            return
        
        # Primer post = pregunta
        first = post_rows[0]
        
        # 1) ask: contenido HTML del mensaje, dentro de la segunda <td>
        # 1) ask: unimos todo el texto de la segunda celda (excepto firmas y metadatos)
        ask_html = ' '.join(
            t.strip() for t in first.xpath(
                './/td[contains(@class,"row")][2]//text()['
                'not(ancestor::span[@class="gensmall"]) and '
                'not(ancestor::span[contains(@class,"postdetails")]) and '
                'not(ancestor::span[contains(@style,"color: navy")])'
                ']'
            ).getall()
            if t.strip()
        )
        # Eliminar delimitador de 17 '_' y todo lo que venga después
        ask_html = re.sub(r'_{17}[\s\S]*$', '', ask_html).strip()
        result['ask'] = ask_html

        
        # 2) timestamp_creation: texto completo del <span class="postdetails"> solo en la segunda <td>
        creation_text = first.xpath(
            'string(.//td[contains(@class,"row")][2]//span[contains(@class,"postdetails")])'
        ).get()
        result['timestamp_creation'] = creation_text.strip() if creation_text else None
        
        # 3) timestamp_edit: texto completo del <span class="gensmall"> solo en la segunda <td>
        edit_text = first.xpath(
            'string(.//td[contains(@class,"row")][2]//span[contains(@class,"gensmall")])'
        ).get()
        result['timestamp_edit'] = edit_text.strip() if edit_text else None
        
        # 4) correct_answer e información adicional
        result['correct_answer'] = None
        result['other_information'] = {}
        
        # 5) respuestas (todas las demás filas)
        answers = []
        for row in post_rows[1:]:
            answer = {}
            
            # usuario
            user = row.xpath('.//span[@class="name"]/b/text()').get()
            if user:
                answer['username'] = user.strip()
            
            # rango (primera línea de postdetails)
            rank = row.xpath(
                'string(.//td[contains(@class,"row")][1]//span[contains(@class,"postdetails")])'
            ).get()
            if rank:
                answer['rank'] = rank.strip().split('\n')[0]
            
            # published_at (misma postdetails)
            pub_text = row.xpath(
                'string(.//td[contains(@class,"row")][2]//span[contains(@class,"postdetails")])'
            ).get()
            if pub_text:
                answer['published_at'] = pub_text.strip()
            
            # contenido HTML de la respuesta: tomamos específicamente el ÚLTIMO span.postbody
            resp_html = ' '.join(
                t.strip() for t in row.xpath(
                    './/td[contains(@class,"row")][2]//text()['
                    'not(ancestor::span[@class="gensmall"]) and '
                    'not(ancestor::span[contains(@class,"postdetails")]) and '
                    'not(ancestor::span[contains(@style,"color: navy")])'
                    ']'
                ).getall()
                if t.strip()
            )
            resp_html = re.sub(r'_{17}[\s\S]*$', '', resp_html).strip()
            if resp_html:
                answer['response_text'] = resp_html.strip()
            
            answers.append(answer)
        
        if answers:
            result['answers'] = answers
            logging.info(f"Encontradas {len(answers)} respuestas")
        
        yield result
