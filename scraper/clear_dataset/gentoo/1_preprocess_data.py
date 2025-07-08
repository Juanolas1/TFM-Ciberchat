import json
import re
from dateutil.parser import parse
from datetime import timezone

# Orden jerárquico de rangos (de mayor a menor autoridad) para Gentoo
rank_order = [
    'Administrator',
    'Developer',
    'Retired Dev',
    'Moderator',
    'Arch/Herd Tester',
    'Watchman',
    'Guru',
    'Veteran',
    'l33t',
    'Bodhisattva',
    'Advocate',
    'Apprentice',
    "Tux's lil' helper",
    'n00b',
    ''
]

def rank_importancia(rank):
    try:
        return rank_order.index(rank)
    except ValueError:
        return len(rank_order)  # Si no está en la lista, asignar prioridad mínima

def limpiar_texto(texto):
    if isinstance(texto, str):
        texto = texto.replace('\\n', ' ')
        texto = texto.replace('\\t', ' ')
        texto = texto.replace('\n', ' ')
        texto = texto.replace('\t', ' ')
        texto = re.sub(r'\s+', ' ', texto)
        texto = texto.strip()
    return texto

def limpiar_rank(rank_str):
    if not isinstance(rank_str, str):
        return rank_str
    return rank_str.split('Joined:', 1)[0].strip()

def parse_timestamp(ts_str, to_iso=True):
    ts = limpiar_texto(ts_str)
    
    m = re.search(r'Posted:\s*(.+?)\s{2,}Post subject:', ts, re.IGNORECASE)
    if m:
        fecha = m.group(1).strip()
    else:
        m2 = re.search(r'Last edited by .*? on (.+?)(?:;|$)', ts, re.IGNORECASE)
        if m2:
            fecha = m2.group(1).strip()
        else:
            m3 = re.search(
                r'\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?.*?\d{4}\s+\d{1,2}:\d{2}\s*(?:am|pm)',
                ts, re.IGNORECASE
            )
            fecha = m3.group(0) if m3 else None
    
    if not fecha:
        return None
    
    try:
        dt = parse(fecha)
    except Exception:
        return None
    
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    
    return dt.isoformat() if to_iso else dt.strftime('%Y-%m-%d %H:%M')

def parse_fecha(fecha_str):
    """Convertir string ISO a objeto datetime para comparación"""
    try:
        dt = parse(fecha_str)
        if dt.tzinfo is not None:
            dt = dt.replace(tzinfo=None)
        return dt
    except (ValueError, TypeError):
        return None

# --- carga y procesamiento ---
with open('gentoo.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Lista para almacenar solo las entradas con respuestas
entradas_con_respuestas = []

for item in data:
    # limpiar pregunta
    for campo in ('url', 'title', 'ask'):
        if campo in item and isinstance(item[campo], str):
            item[campo] = limpiar_texto(item[campo])
    
    # timestamps de la pregunta
    if item.get('timestamp_creation'):
        item['timestamp_creation'] = parse_timestamp(item['timestamp_creation'], to_iso=True)
    if item.get('timestamp_edit'):
        item['timestamp_edit'] = parse_timestamp(item['timestamp_edit'], to_iso=False)
    
    # Obtener fecha de edición para comparar con las respuestas
    ts_edit = parse_fecha(item.get('timestamp_edit'))
    
    # procesar respuestas
    nuevas = []
    best_answer = None
    best_rank_val = len(rank_order)
    
    for ans in item.get('answers', []):
        if not ans:
            continue  # salto diccionarios vacíos
        
        # limpio campos
        if 'response_text' in ans:
            ans['response_text'] = limpiar_texto(ans['response_text'])
        if 'rank' in ans:
            ans['rank'] = limpiar_rank(limpiar_texto(ans['rank']))
        if 'published_at' in ans and ans['published_at']:
            ans['published_at'] = parse_timestamp(ans['published_at'], to_iso=True)
        
        # Añadir solo respuestas con texto
        if ans.get('response_text'):
            nuevas.append(ans)
            
            # Comprobar si esta respuesta es candidata a ser la correcta
            pub_date = parse_fecha(ans.get('published_at'))
            
            # Si la respuesta se publicó después de la edición de la pregunta, no la consideramos
            if ts_edit and pub_date and pub_date > ts_edit:
                continue
                
            # Determinar la importancia del rango
            rank_val = rank_importancia(ans.get('rank', ''))
            
            # Si este rango es más importante que el mejor encontrado hasta ahora
            if rank_val < best_rank_val:
                best_rank_val = rank_val
                best_answer = ans
    
    # reemplazo la lista con la filtrada
    item['answers'] = nuevas
    
    # Solo guardo la entrada si tiene al menos una respuesta
    if nuevas:  # Si la lista no está vacía
        # Añadir la respuesta correcta (solo el texto)
        item['correct_answer'] = best_answer.get('response_text', '') if best_answer else None
        
        entradas_con_respuestas.append(item)

# Guardar en formato JSONL (un objeto por línea)
with open('gentoo_clean.jsonl', 'w', encoding='utf-8') as f:
    for item in entradas_con_respuestas:
        json.dump(item, f, ensure_ascii=False)
        f.write('\n')

print(f"✔ gentoo_clean.jsonl generado: {len(data) - len(entradas_con_respuestas)} preguntas sin respuestas eliminadas.")