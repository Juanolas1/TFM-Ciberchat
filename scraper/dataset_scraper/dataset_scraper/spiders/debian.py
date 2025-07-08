import scrapy
from scrapy import Request
from dataset_scraper.items import DatasetscraperItem, AnswerItem
import re
import logging

class DebianSpider(scrapy.Spider):
    name = "debian"
    allowed_domains = ["forums.debian.net"]
    custom_settings = {
        "DOWNLOAD_TIMEOUT": 60,
        "DOWNLOAD_DELAY": 2,
        "USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    }
    # URLs of the forums with their maximum pagination limits
    forum_configs = [
        # (URL base, forum ID, maximum start value)
        ("https://forums.debian.net/viewforum.php?f=5", "5", 21950),
        ("https://forums.debian.net/viewforum.php?f=7", "7", 9500),
        ("https://forums.debian.net/viewforum.php?f=8", "8", 2650),
        ("https://forums.debian.net/viewforum.php?f=10", "10", 23450)
    ]
    # Current forum index and pagination
    current_forum_index = 0
    current_page_start = 0
    page_increment = 50  # Each page has 50 topics

    def start_requests(self):
        """Starts the spider with the first URL"""
        first_url = self.forum_configs[0][0]
        logging.info(f"Starting spider with first URL: {first_url}")
        yield Request(url=first_url, callback=self.parse)

    def get_next_page_url(self):
        """
        Generates the URL for the next page based on the current pagination
        """
        if self.current_forum_index >= len(self.forum_configs):
            return None
        forum_id = self.forum_configs[self.current_forum_index][1]
        max_start = self.forum_configs[self.current_forum_index][2]
        # If current_page_start exceeds the maximum for this forum, we're done with it
        if self.current_page_start > max_start:
            return None
        # If start is 0, use the base URL without modification
        if self.current_page_start == 0:
            return self.forum_configs[self.current_forum_index][0]
        # Otherwise, generate the URL with the start parameter
        return f"https://forums.debian.net/viewforum.php?f={forum_id}&start={self.current_page_start}"

    def move_to_next_forum(self):
        """
        Moves to the next forum and resets the pagination
        """
        self.current_forum_index += 1
        self.current_page_start = 0
        if self.current_forum_index < len(self.forum_configs):
            next_url = self.get_next_page_url()
            logging.info(f"Moving to next forum: {next_url}")
            return next_url
        else:
            logging.info("All forums have been processed. Finishing.")
            return None

    def parse(self, response):
        """Processes each forum page and finds topics marked as solved."""
        current_url = response.url
        logging.info(f"Processing forum page: {current_url}")
        # Check if there are no more topics on this page
        no_topics = response.xpath('//div[contains(text(), "No topics or posts were found")]')
        if no_topics:
            logging.info(f"No more topics in this URL. Moving to next forum.")
            next_forum_url = self.move_to_next_forum()
            if next_forum_url:
                yield Request(url=next_forum_url, callback=self.parse)
            return
        # Extract all topics from the page
        topics = response.xpath('//dl[contains(@class, "row-item")]/dt/div[@class="list-inner"]/a[contains(@class, "topictitle")]')
        solved_topics_found = 0
        for topic in topics:
            title = topic.xpath('text()').get()
            if title:
                title = title.strip()
                # Pattern to detect "[Solved]" in different formats but not "unsolved"
                is_solved = bool(re.search(r'(\[solved\]|\(solved\)|{solved}|"solved"|^solved| solved\b|\bsolved\b)', title, re.IGNORECASE))
                is_unsolved = bool(re.search(r'unsolved', title, re.IGNORECASE))
                # Only process topics that are marked as solved but not as unsolved
                if is_solved and not is_unsolved:
                    solved_topics_found += 1
                    topic_url = response.urljoin(topic.xpath('@href').get())
                    logging.info(f"Found solved topic #{solved_topics_found}: {title} - {topic_url}")
                    yield Request(url=topic_url, callback=self.parse_topic)
        logging.info(f"Total solved topics found on this page: {solved_topics_found}")
        # Move to the next page (increment by 50)
        self.current_page_start += self.page_increment
        next_page_url = self.get_next_page_url()
        if next_page_url:
            logging.info(f"Moving to next page: {next_page_url}")
            yield Request(url=next_page_url, callback=self.parse)
        else:
            # If there are no more pages for this forum, move to the next forum
            next_forum_url = self.move_to_next_forum()
            if next_forum_url:
                yield Request(url=next_forum_url, callback=self.parse)


    def parse_topic(self, response):
        logging.info(f"Processing topic: {response.url}")
        all_posts = response.xpath('//div[contains(@class, "post has-profile")]')

        # Necesitamos al menos OP + 1 respuesta (recuerda que all_posts[0] es el header falso)
        if len(all_posts) < 2:
            logging.warning(f"No hay suficientes posts en {response.url}")
            return

        result = DatasetscraperItem()
        result['url'] = response.url

        # Título del tema
        title = response.xpath('//h2[contains(@class, "topic-title")]/a/text()').get()
        result['title'] = title.strip() if title else None

        # Inicializamos campos
        result['ask'] = None
        result['timestamp_creation'] = None
        result['timestamp_edit'] = None
        result['correct_answer'] = None
        result['other_information'] = {}

        # --- 1) El post que realmente nos interesa para 'ask' y 'creation' ---
        op_post = all_posts[1]
        # ask = contenido HTML de ese post
        result['ask'] = op_post.xpath('string(.//div[@class="content"])').get()
        # timestamp_creation = datetime del <time>
        result['timestamp_creation'] = op_post.xpath('.//p[@class="author"]/time/@datetime').get()

        # --- 2) timestamp_edit: buscamos en el mismo op_post su <div class="notice"> ---
        notice_texts = op_post.xpath('.//div[contains(@class,"notice")]/text()').getall()
        if notice_texts:
            notice = "".join(notice_texts).strip()
            m = re.search(r'on\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})', notice)
            result['timestamp_edit'] = m.group(1) if m else None
        else:
            result['timestamp_edit'] = None

        # --- 3) El resto de respuestas en 'answers' (a partir de all_posts[2]) ---
        answers = []
        for post in all_posts[2:]:
            answer = {}
            user = post.xpath('.//dl[@class="postprofile"]/dt/a/text()').get()
            if user: answer['username'] = user.strip()
            rank = post.xpath('.//dd[contains(@class,"profile-rank")]/text()').get()
            if rank: answer['rank'] = rank.strip()
            pub = post.xpath('.//p[@class="author"]/time/@datetime').get()
            if pub: answer['published_at'] = pub
            resp = post.xpath('string(.//div[@class="content"])').get()
            if resp: answer['response_text'] = resp
            answers.append(answer)

        result['answers'] = answers
        logging.info(f"Se han incluido {len(answers)} respuestas en 'answers'")

        yield result
