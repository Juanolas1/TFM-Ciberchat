import json
import pandas as pd

# Cargar archivo JSON limpio de Gentoo
with open('gentoo_clean.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Aplanar estructura: una fila por cada respuesta de cada tema
records = []
for item in data:
    base = {
        'url': item.get('url', ''),
        'title': item.get('title', ''),
        'ask': item.get('ask', ''),
        'timestamp_creation': item.get('timestamp_creation', ''),
        'timestamp_edit': item.get('timestamp_edit', ''),
    }
    answers = item.get('answers', [])
    if not answers:
        # Si no hay respuestas, añadimos una fila con campos de respuesta vacíos
        records.append({**base,
                        'answer_username': None,
                        'answer_rank': None,
                        'answer_published_at': None,
                        'answer_text': None})
    else:
        for ans in answers:
            records.append({
                **base,
                'answer_username': ans.get('username', None),
                'answer_rank': ans.get('rank', None),
                'answer_published_at': ans.get('published_at', None),
                'answer_text': ans.get('response_text', None)
            })

# Crear DataFrame
df = pd.DataFrame(records)

# Mostrar las primeras filas para verificar
print("Primeras filas del DataFrame:")
print(df.head(), "\n")

# Mostrar los tipos únicos de rank en las respuestas de Gentoo
print("Tipos únicos de 'answer_rank' en el dataset de Gentoo:")
print(df['answer_rank'].dropna().unique())
