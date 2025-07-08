import json
import re
from datetime import datetime

# Orden jerárquico de rangos (de mayor a menor autoridad)
rank_order = [
    'Debian Developer, Site Admin',
    'Debian Developer, Forum Ninja',
    'Site admin',
    'Administrator',
    'Global Moderator',
    'Section Moderator',
    'Moderator Team Member',
    'Debian Developer',
    'Emeritus',
    'User Project Contributor',
    'Forum Helper',
    'df -h | grep > 90TiB',
    'df -h | grep > 20TiB',
    'df -h | participant',
    'Forum Account',
    ''
]

def rank_importancia(rank):
    try:
        return rank_order.index(rank)
    except ValueError:
        return len(rank_order)

def limpiar_texto(texto):
    if isinstance(texto, str):
        texto = texto.replace('\\n', ' ')
        texto = texto.replace('\\t', ' ')
        texto = texto.replace('\n', ' ')
        texto = texto.replace('\t', ' ')
        texto = re.sub(r'\s+', ' ', texto)
        texto = texto.strip()
    return texto

def parse_fecha(fecha_str):
    try:
        if fecha_str.endswith('Z'):
            fecha_str = fecha_str.replace('Z', '+00:00')
        dt = datetime.fromisoformat(fecha_str)
        return dt.replace(tzinfo=None)
    except Exception:
        return None

# Cargar JSON original
with open("debian.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Lista para almacenar solo entradas con respuestas
entradas_con_respuestas = []

# Procesar cada pregunta
for item in data:
    # Limpiar campos base
    item["title"] = limpiar_texto(item.get("title", ""))
    item["ask"] = limpiar_texto(item.get("ask", ""))
    item["timestamp_creation"] = limpiar_texto(item.get("timestamp_creation", ""))
    item["timestamp_edit"] = limpiar_texto(item.get("timestamp_edit", ""))
    
    ts_edit = parse_fecha(item["timestamp_edit"]) if item["timestamp_edit"] else None
    answers = item.get("answers", [])

    # Si no hay respuestas, omitir esta entrada
    if not answers:
        continue
        
    best_answer = None
    best_rank_val = len(rank_order)

    nuevas_respuestas = []
    for ans in answers:
        # Omitir respuestas vacías
        if not ans:
            continue
            
        # Limpiar campos en cada respuesta
        ans["username"] = limpiar_texto(ans.get("username", ""))
        ans["rank"] = limpiar_texto(ans.get("rank", ""))
        ans["published_at"] = limpiar_texto(ans.get("published_at", ""))
        ans["response_text"] = limpiar_texto(ans.get("response_text", ""))
        
        # Añadir solo respuestas no vacías
        if ans.get("response_text"):
            nuevas_respuestas.append(ans)
            
        pub_date = parse_fecha(ans["published_at"])
        if ts_edit and pub_date and pub_date > ts_edit:
            continue

        rank_val = rank_importancia(ans["rank"])
        if rank_val < best_rank_val:
            best_rank_val = rank_val
            best_answer = ans

    # Reemplazar la lista de respuestas con la filtrada
    item["answers"] = nuevas_respuestas
    
    # Si después de filtrar no quedan respuestas, omitir esta entrada
    if not nuevas_respuestas:
        continue
        
    # Añadir la respuesta correcta
    item["correct_answer"] = best_answer["response_text"] if best_answer else None
    
    # Añadir esta entrada a la lista de entradas con respuestas
    entradas_con_respuestas.append(item)

# Guardar nuevo JSON con el campo `correct_answer` añadido
# Guardar en formato JSON lines: un objeto por línea
with open("debian_procesado.jsonl", "w", encoding="utf-8") as f:
    for item in entradas_con_respuestas:
        json.dump(item, f, ensure_ascii=False)
        f.write("\n")

print(f"✔ debian_procesado.jsonl generado: {len(data) - len(entradas_con_respuestas)} preguntas sin respuestas eliminadas.")